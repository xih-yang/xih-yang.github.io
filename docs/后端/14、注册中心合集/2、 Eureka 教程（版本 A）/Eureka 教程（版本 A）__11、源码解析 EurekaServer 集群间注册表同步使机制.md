# 11、源码解析 EurekaServer 集群间注册表同步使机制
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/11.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaServer集群间注册表同步使用的3层队列任务批处理机制

## 1、EurekaServer同步任务批处理机制流程图

**三个队列**

第一个队列，就是纯写入；

private final BlockingQueue> acceptorQueue = new LinkedBlockingQueue<>();

第二个队列，是用来根据时间和大小，来拆分队列；

private final Deque processingOrder = new LinkedList<>();

第三个队列，用来放批处理任务 ==》 异步批处理机制

private final BlockingQueue>> batchWorkQueue = new LinkedBlockingQueue<>();

## 2、涉及到的类 类图

## 1、源码入口分析

> 因为都是由 batchDispatcher.process() 放入一个任务
>
> 比如心跳的：
>
> com.netflix.eureka.cluster.PeerEurekaNode#heartbeat 中的代码：
>
> batchingDispatcher.process(taskId(“heartbeat”, info), replicationTask, expiryTime);

## 1.1 BatchingDispatcher 创建的源码 TaskDispatchers.createBatchingTaskDispatcher

```java
this.batchingDispatcher = TaskDispatchers.createBatchingTaskDispatcher(
        batcherName,
        config.getMaxElementsInPeerReplicationPool(),
        batchSize,
        config.getMaxThreadsForPeerReplication(),
        maxBatchingDelayMs,
        serverUnavailableSleepTimeMs,
        retrySleepTimeMs,
        taskProcessor
);
public static <ID, T> TaskDispatcher<ID, T> createBatchingTaskDispatcher(String id,
                                                                             int maxBufferSize,
                                                                             int workloadSize,
                                                                             int workerCount,
                                                                             long maxBatchingDelay,
                                                                             long congestionRetryDelayMs,
                                                                             long networkFailureRetryMs,
                                                                             TaskProcessor<T> taskProcessor) {
    // 1、创建一个 AcceptorExecutor
    final AcceptorExecutor<ID, T> acceptorExecutor = new AcceptorExecutor<>(
        id, maxBufferSize, workloadSize, maxBatchingDelay, congestionRetryDelayMs, networkFailureRetryMs
    );
    // 2、创建一个 TaskExecutors
    final TaskExecutors<ID, T> taskExecutor = TaskExecutors.batchExecutors(id, workerCount, taskProcessor, acceptorExecutor);
    // 3、创建 TaskDispatcher
    return new TaskDispatcher<ID, T>() {
        // 3.1 所以从这里可以看到 PeerEurekaNode 中执行 batchingTaskDispatcher.process() 的时候其实是由 acceptorExecutor 来执行的
        @Override
        public void process(ID id, T task, long expiryTime) {
            acceptorExecutor.process(id, task, expiryTime);
        }
        @Override
        public void shutdown() {
            acceptorExecutor.shutdown();
            taskExecutor.shutdown();
        }
    };
}
```

## 1.2 new AcceptorExecutor()

```java
AcceptorExecutor(String id,
                 int maxBufferSize,
                 int maxBatchingSize,
                 long maxBatchingDelay,
                 long congestionRetryDelayMs,
                 long networkFailureRetryMs) {
    // 1、设置一下 bufferSize、batchingSize、batchingDelay 
    this.maxBufferSize = maxBufferSize;
    this.maxBatchingSize = maxBatchingSize;
    this.maxBatchingDelay = maxBatchingDelay;
    // 2、设置网络相关的参数
    this.trafficShaper = new TrafficShaper(congestionRetryDelayMs, networkFailureRetryMs);
    // 3、这个是重点，这个会以 Daemon 的方式运行一个线程
    // 具体的逻辑在 AcceptorRunner(实现 Runnable 接口的类) 中实现
    ThreadGroup threadGroup = new ThreadGroup("eurekaTaskExecutors");
    this.acceptorThread = new Thread(threadGroup, new AcceptorRunner(), "TaskAcceptor-" + id);
    this.acceptorThread.setDaemon(true);
    this.acceptorThread.start();
    // 4、这里就是统计相关的，不用太过关注 
    final double[] percentiles = {
     50.0, 95.0, 99.0, 99.5};
    final StatsConfig statsConfig = new StatsConfig.Builder()
            .withSampleSize(1000)
            .withPercentiles(percentiles)
            .withPublishStdDev(true)
            .build();
    final MonitorConfig config = MonitorConfig.builder(METRIC_REPLICATION_PREFIX + "batchSize").build();
    this.batchSizeMetric = new StatsTimer(config, statsConfig);
    try {
        Monitors.registerObject(id, this);
    } catch (Throwable e) {
        logger.warn("Cannot register servo monitor for this object", e);
    }
}
```

## 1.2.1 com.netflix.eureka.util.batcher.AcceptorExecutor#process

```java
// 其实很简单，就是往 acceptorQueue 中添加数据
void process(ID id, T task, long expiryTime) {
    acceptorQueue.add(new TaskHolder<ID, T>(id, task, expiryTime));
    acceptedTasks++;
}
```

## 1.2.2 new AcceptorRunner(重点看一下这个后台线程在干啥)

```java
class AcceptorRunner implements Runnable {
    @Override
    public void run() {
        long scheduleTime = 0;
        // 1、其实就是一个 while(true) 死循环
        while (!isShutdown.get()) {
            try {
                // 2、处理输入队列
                drainInputQueues();
                // 3、总数 = 处理中的大小 
                int totalItems = processingOrder.size();
                // 4、重置 scheduleTime
                long now = System.currentTimeMillis();
                if (scheduleTime < now) {
                    scheduleTime = now + trafficShaper.transmissionDelay();
                }
                // 5、分配任务
                if (scheduleTime <= now) {
                    assignBatchWork();
                    assignSingleItemWork();
                }
                // 6、当没有任务可处理的时候， sleep 一会，避免太过紧密的循环
                // If no worker is requesting data or there is a delay injected by the traffic shaper,
                // sleep for some time to avoid tight loop.
                if (totalItems == processingOrder.size()) {
                    Thread.sleep(10);
                }
            } catch (InterruptedException ex) {
                // Ignore
            } catch (Throwable e) {
                // Safe-guard, so we never exit this loop in an uncontrolled way.
                logger.warn("Discovery AcceptorThread error", e);
            }
        }
    }
    private boolean isFull() {
        return pendingTasks.size() >= maxBufferSize;
    }
    private void drainInputQueues() throws InterruptedException {
        do {
            drainReprocessQueue();
            drainAcceptorQueue();
            if (!isShutdown.get()) {
                // If all queues are empty, block for a while on the acceptor queue
                if (reprocessQueue.isEmpty() && acceptorQueue.isEmpty() && pendingTasks.isEmpty()) {
                    TaskHolder<ID, T> taskHolder = acceptorQueue.poll(10, TimeUnit.MILLISECONDS);
                    if (taskHolder != null) {
                        appendTaskHolder(taskHolder);
                    }
                }
            }
        } while (!reprocessQueue.isEmpty() || !acceptorQueue.isEmpty() || pendingTasks.isEmpty());
    }
    private void drainAcceptorQueue() {
            // 1、如果 acceptorQueue 不为空则返回任务取出放到 pendingTasks 中
            while (!acceptorQueue.isEmpty()) {
                appendTaskHolder(acceptorQueue.poll());
            }
        }
        private void drainReprocessQueue() {
            long now = System.currentTimeMillis();
            // 1、reprocessQueue 不为空且 pendingTasks < 10000
            while (!reprocessQueue.isEmpty() && !isFull()) {
                TaskHolder<ID, T> taskHolder = reprocessQueue.pollLast();
                ID id = taskHolder.getId();
                // 2、如果过期了，则把 expiredTawsks + 1
                if (taskHolder.getExpiryTime() <= now) {
                    expiredTasks++;
                } else if (pendingTasks.containsKey(id)) {
                    // 3、如果处理中的任务包括该任务，则把 overriddentTasks + 1
                    overriddenTasks++;
                } else {
                    // 4、添加任务到 pendingTasks、添加到 processingOrder 头部
                    pendingTasks.put(id, taskHolder);
                    processingOrder.addFirst(id);
                }
            }
            // 5、如果满了，则把 queueOverflows + reprocessQueue 的大小，并清空 reprocessQueue
            if (isFull()) {
                queueOverflows += reprocessQueue.size();
                reprocessQueue.clear();
            }
        }
        private void appendTaskHolder(TaskHolder<ID, T> taskHolder) {
            // 1、如果待处理的任务满了，则从 processingOrder 中拿出一个任务，然后从待处理任务中移除。队列溢出的值 +1
            if (isFull()) {
                pendingTasks.remove(processingOrder.poll());
                queueOverflows++;
            }
            // 2、然后放入待处理任务的 Map 中
            TaskHolder<ID, T> previousTask = pendingTasks.put(taskHolder.getId(), taskHolder);
            // 3、如果没有放入成功，则把其加入 processingOrder 中
            if (previousTask == null) {
                processingOrder.add(taskHolder.getId());
            } else {
                // 4、加入成功则把覆盖任务数 +1
                overriddenTasks++;
            }
        }
        void assignSingleItemWork() {
            // 1、如果 processingOrder 不为空，则使用信号量去控制一次一个
            if (!processingOrder.isEmpty()) {
                if (singleItemWorkRequests.tryAcquire(1)) {
                    long now = System.currentTimeMillis();
                    // 2、如果 processingOrder 不为空
                    while (!processingOrder.isEmpty()) {
                        // 2.1 则从中取任务从 pendingTasks 中移除，
                        ID id = processingOrder.poll();
                        TaskHolder<ID, T> holder = pendingTasks.remove(id);
                        // 2.2 然后判断如果过期时间大于现在，则添加到 singleItemWorkQueue 中
                        if (holder.getExpiryTime() > now) {
                            singleItemWorkQueue.add(holder);
                            return;
                        }
                        // 2.3 否则过期任务数 +1
                        expiredTasks++;
                    }
                    // 3、释放信号
                    singleItemWorkRequests.release();
                }
            }
        }
        void assignBatchWork() {
            // 1、有足够的任务进入
            if (hasEnoughTasksForNextBatch()) {
                // 2、信号量控制进入
                if (batchWorkRequests.tryAcquire(1)) {
                    long now = System.currentTimeMillis();
                    // 3、取 processingOrder 和 maxBatchingSize 中的最小值。如果任务过多按照 maxBatchingSize 分隔任务
                    int len = Math.min(maxBatchingSize, processingOrder.size());
                    List<TaskHolder<ID, T>> holders = new ArrayList<>(len);
                    //4、往 holders 中添加数据
                    while (holders.size() < len && !processingOrder.isEmpty()) {
                        // 4.1 从 processingOrder 中获取数据
                        ID id = processingOrder.poll();
                        // 4.2 从 pendingTasks 中移除
                        TaskHolder<ID, T> holder = pendingTasks.remove(id);
                        // 4.3 判断是否过期，不过期加入
                        if (holder.getExpiryTime() > now) {
                            holders.add(holder);
                        } else {
                            // 4.4 过期了，expiredTasks + 1
                            expiredTasks++;
                        }
                    }
                    // 5、如果 holders 为空，说明没有任务，则释放信号
                    if (holders.isEmpty()) {
                        batchWorkRequests.release();
                    } else {
                        // 6、否则记录一下数据，添加到 batchWorkQueue 中
                        batchSizeMetric.record(holders.size(), TimeUnit.MILLISECONDS);
                        batchWorkQueue.add(holders);
                    }
                }
            }
        }
        private boolean hasEnoughTasksForNextBatch() {
            // 1、如果 processingOrder 为空，返回 false
            if (processingOrder.isEmpty()) {
                return false;
            }
            // 2、如果 pendingTasks 大小大于 maxBufferSize(10000) 返回 true
            if (pendingTasks.size() >= maxBufferSize) {
                return true;
            }
            // 3、从 processingOrder 中取出在 pendingTasks 中获取
            TaskHolder<ID, T> nextHolder = pendingTasks.get(processingOrder.peek());
            long delay = System.currentTimeMillis() - nextHolder.getSubmitTimestamp();
            // 4、判断如果 delay >= maxBatchingDelay(500) 返回 true
            return delay >= maxBatchingDelay;
        }
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
