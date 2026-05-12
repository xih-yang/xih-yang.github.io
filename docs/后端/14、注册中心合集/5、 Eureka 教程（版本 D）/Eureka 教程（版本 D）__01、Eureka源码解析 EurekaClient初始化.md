# 01、Eureka源码解析 EurekaClient初始化
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/1.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## Eureka

- 注册中心Eureka主要由EurekaClient和EurekaServer组成，EurekaClient向EurekaServer发送注册，心跳（续约），拉取实例注册信息等操作；EurekaServer将实例信息保存在一个ConcurrentHashMap`>`里面，其中 ConcurrentHashMap的Key为实例集合的名称，Value为一个Map，Map的Key为实例的Id，Value为实例租约的具体信息（由于每个实例集合可能由多个实例组成，所以要这样设计存储结构），EurekaServer在接收EurekaClient端发送的不同请求时，进行不同的操作。本篇主要解析EurekaClient启动时初始化的几个主要的定时任务，定时任务的具体实现后面文章会有详细介绍。本文基于https://github.com/Netflix/eureka上的master分支。最近在github上fork了一下eureka项目，更详细的注释可以去我的git上看：https://github.com/qiuyangli/eureka

## 具体解析

- EurekaClient启动时从EurekaClient的构造方法DiscoveryClient(applicationInfoManager, config, args, backupRegistryProvider)调用到initScheduledTasks()这个非常关键的方法，这个方法里初始化了拉取注册信息，服务心跳（续约），服务注册/刷新这三个定时任务，代码如下：

```java
// 初始化各种定时任务
private void initScheduledTasks() {
    // 从EurekaServer拉取注册信息
    // 从eureka.client.fetch-registry参数设置进来，默认为ture
    if (clientConfig.shouldFetchRegistry()) {
        // registry cache refresh timer
        // 从EurekaServer拉取注册信息的频率，默认30秒
        int registryFetchIntervalSeconds = clientConfig.getRegistryFetchIntervalSeconds();
        int expBackOffBound = clientConfig.getCacheRefreshExecutorExponentialBackOffBound();
        // 30秒后延时执行TimedSupervisorTask
        // 实际是拉取并刷新注册信息的定时任务，后面会有详细解析
        scheduler.schedule(
            new TimedSupervisorTask(
               "cacheRefresh",
                scheduler,
                cacheRefreshExecutor,
                registryFetchIntervalSeconds,
                TimeUnit.SECONDS,
                expBackOffBound,
                // new一个刷新注册信息线程(全量/差别)
                new CacheRefreshThread()
            ),
            registryFetchIntervalSeconds, TimeUnit.SECONDS);
    }
    // 服务续约(心跳)
    // 参数eureka.registration.enabled为true
    if (clientConfig.shouldRegisterWithEureka()) {
        // 10秒
        int expBackOffBound = clientConfig.getHeartbeatExecutorExponentialBackOffBound();
        // 心跳(续约)频率，默认30秒 
        int renewalIntervalInSecs = instanceInfo.getLeaseInfo().getRenewalIntervalInSecs();
        logger.info("Starting heartbeat executor: " + "renew interval is: {}", renewalIntervalInSecs);
        // Heartbeat timer
        // 30秒后延时执行TimedSupervisorTask
        // 实际是一个心跳(续约)定时任务，后面会有详细解析
        scheduler.schedule(
            new TimedSupervisorTask(
               "heartbeat",
                scheduler,
                heartbeatExecutor,
                renewalIntervalInSecs,
                TimeUnit.SECONDS,
                expBackOffBound,
                // new一个续约线程，最终调用到renew()方法
                new HeartbeatThread()
            ),
            renewalIntervalInSecs, TimeUnit.SECONDS);
        // InstanceInfo replicator
        // 创建实例信息复制器，其实InstanceInfoReplicator继承了Runnable
        // 详细操作看一下其中的run()方法，定时进行注册/刷新操作
        instanceInfoReplicator = new InstanceInfoReplicator(
            this,
            instanceInfo,
            // 默认30秒
            clientConfig.getInstanceInfoReplicationIntervalSeconds(),
            2); // burstSize
        // 实例状态变更监听器
        statusChangeListener = new ApplicationInfoManager.StatusChangeListener() {
            @Override
            public String getId() {
                return "statusChangeListener";
            }
            @Override
            public void notify(StatusChangeEvent statusChangeEvent) {
                if (InstanceStatus.DOWN == statusChangeEvent.getStatus() ||
                    InstanceStatus.DOWN == statusChangeEvent.getPreviousStatus()) {
                    // log at warn level if DOWN was involved
                    logger.warn("Saw local status change event {}", statusChangeEvent);
                } else {
                    logger.info("Saw local status change event {}", statusChangeEvent);
                }
                // 状态发生改变，需要进行更新
                // 其实也是调用instanceInfoReplicator的run()方法发起注册/刷新
                instanceInfoReplicator.onDemandUpdate();
            }
        };
        if (clientConfig.shouldOnDemandUpdateStatusChange()) {
            applicationInfoManager.registerStatusChangeListener(statusChangeListener);
        }
            instanceInfoReplicator.start(clientConfig.getInitialInstanceInfoReplicationIntervalSeconds());
    } else {
        logger.info("Not registering with Eureka server per configuration");
    }
}
```

- 第一个定时任务负责从EurekaServer拉取注册信息->new CacheRefreshThread()：CacheRefreshThread实现了Runnable，在run()方法中调用了refreshRegistry()方法，这个方法就是去EurekaServer拉取注册信息的方法，拉取注册信息分两种：全量获取和增量获取。全量获取会去EurekaServer拉取所有注册的信息，拉取后在本地进行过滤并对服务状态为UP的注册信息进行缓存；增量获取会对拉取下来的注册信息与本地缓存进行合并后进行缓存。
- 第二个定时任务负责服务心跳/续约->new HeartbeatThread()：HeartbeatThread实现了Runnable，在run()方法中调用了renew()方法，当租约不存在时候进行注册操作
- 第三个定时任务复制向EurekaServer发送注册/刷新请求->new InstanceInfoReplicator()：InstanceInfoReplicator实现了Runnable，在run()方法中向EurekaServer端发起服务注册/刷新请求
- 每个定时任务具体代码会在后面文章进行具体解析

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
