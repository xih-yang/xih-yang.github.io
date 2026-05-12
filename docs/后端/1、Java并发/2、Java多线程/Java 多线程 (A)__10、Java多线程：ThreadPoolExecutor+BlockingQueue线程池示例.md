# 10、Java多线程：ThreadPoolExecutor+BlockingQueue线程池示例
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/10.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## 首先定义扩展线程池ExtThreadPoolExecutor

ExtThreadPoolExecutor作用是对线程池的增强，如在初始化线程池时、在线程执行前、执行后等处可添加自定义逻辑。

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
public class ExtThreadPoolExecutor extends ThreadPoolExecutor{
    public ExtThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
        init();
    }
    public ExtThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,
            BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, handler);
        init();
    }
    public ExtThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,
            BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler);
        init();
    }
    public ExtThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,
            BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory);
        init();
    }
    private void init(){
        System.out.println("ExtThreadPoolExecutor init......");
    }
    @Override
    protected void beforeExecute(Thread t, Runnable r) {
        System.out.println("beforeExecute......   begin" );
        super.beforeExecute(t, r);
        System.out.println("beforeExecute......   end" );
    }
    @Override
    protected void afterExecute(Runnable r, Throwable t) {
        System.out.println("afterExecute......   begin" );
        super.afterExecute(r, t);
        System.out.println("afterExecute......   end" );
    }
}
```

### 定义任务队列WorkQueue

```plaintext
通过BlockingQueue存放任务线程，该处使用生产者、消费者模式。
```

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
public class WorkQueue {
    private volatile static BlockingQueue<WorkEvent> queue;
    private WorkQueue(){}
    /**
     * 初始化队列，延迟初始化，其实也可使用内部类单例模式
     */
    private static void init(){
        if(queue == null){
            System.out.println("WorkQueue.queue null  init........");
            synchronized (WorkQueue.class) {
                System.out.println("WorkQueue.queue after synchronized still null  init........");
                if (queue == null) {
                    queue = new LinkedBlockingDeque<WorkEvent>();
                }
            }
        }
    }
    public static  void putWorkEvent(WorkEvent workEvent){
        init();
        try {
            queue.put(workEvent);
        } catch (InterruptedException e) {
            e.printStackTrace();
            System.out.println("WorkQueue.putWorkEvent  fail........");
        }
    }
    public static BlockingQueue<WorkEvent> getQueue() {
        return queue;
    }
}
```

业务处理

```java
public class EventHandler {
    /**
     * 处理业务
     * @param workEvent
     */
    public static void handle(WorkEvent workEvent){
        System.out.println("正在处理，workNo=[" + workEvent.getWorkNo() + "]");
    }
}
```

工作线程

消费者端，阻塞接收消息，并将消息传给实际需要者。

```java
public class WorkThread implements Runnable{
    @Override
    public void run() {
        while (true) {
            try {
                WorkEvent workEvent = WorkQueue.getQueue().take();
                System.out.println("ThreadName["  +  Thread.currentThread().getName() +  "], 获取到workEvent，workNo=[" + workEvent.getWorkNo() + "], ready handle");
                EventHandler.handle(workEvent);
                System.out.println("ThreadName["  +  Thread.currentThread().getName() +  "], 获取到workEvent，workNo=[" + workEvent.getWorkNo() + "], finish handle");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

消息实体

```java
import java.io.Serializable;
import java.util.concurrent.atomic.AtomicInteger;
public class WorkEvent implements Serializable{
    private static final long serialVersionUID = -1739230985770176506L;
    /**
     * 任务编号
     */
    private String workNo;
    /**
     * 执行次数
     */
    private AtomicInteger num;
    public WorkEvent(String workNo) {
        this.workNo = workNo;
        this.num = new AtomicInteger(0);
    }
    public String getWorkNo() {
        return workNo;
    }
    public void setWorkNo(String workNo) {
        this.workNo = workNo;
    }
    public AtomicInteger getNum() {
        return num;
    }
    public void setNum() {
        this.num.incrementAndGet();
    }
}
```

调用示例:

```java
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
public class StartWork {
    public static void main(String[] args) {
        System.out.println("准备放任务线程");
        int workNum = 6;
        for (int i = 0; i < workNum; i++) {
            WorkEvent workEvent = new WorkEvent("任务线程" + i);
            WorkQueue.putWorkEvent(workEvent);
        }
        // 初始化线程池
        ExtThreadPoolExecutor executor = new ExtThreadPoolExecutor(5, 5, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<Runnable>());
        // 先准备工作线程
        System.out.println("准备五个工作线程");
        executor.execute(new WorkThread());
        executor.execute(new WorkThread());
        executor.execute(new WorkThread());
        executor.execute(new WorkThread());
        executor.execute(new WorkThread());
        try {
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("10s后 。。。 准备放任务线程");
        for (int i = 0; i < workNum; i++) {
            WorkEvent workEvent = new WorkEvent("10s 后 任务线程" + i);
            WorkQueue.putWorkEvent(workEvent);
        }
    }
}
结果示例
```

代码大体流程：消息定义成实体WorkEvent，放入WorkQueue中，然后由ExtThreadPoolExecutor线程池开启接收端线程WorkThread，由WorkThread获取消息，并通知实际需要者EventHandler，EventHandler处理消息。
