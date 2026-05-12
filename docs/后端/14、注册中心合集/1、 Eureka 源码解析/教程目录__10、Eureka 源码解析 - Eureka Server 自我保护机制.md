# 10、Eureka 源码解析 - Eureka Server 自我保护机制
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/10.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、什么是自我保护机制

默认情况下，如果Eureka Server在一定时间内（`默认 90 秒，其实不止 90 秒`）没有接收到某个微服务实例的心跳，Eureka Server将会移除该实例。但是当网络分区故障发生时，微服务与Eureka Server之间无法正常通信，而微服务本身是正常运行的，此时不应该移除这个微服务，所以引入了自我保护机制。

官方对于自我保护机制的定义：

> 自我保护模式正是一种针对网络异常波动的安全保护措施，使用自我保护模式能使 Eureka 集群更加的健壮、稳定的运行。

自我保护机制的工作机制是：如果在15分钟内超过 85% 的客户端节点都没有正常的心跳，那么Eureka就认为客户端与注册中心出现了网络故障，Eureka Server 自动进入自我保护机制，此时会出现以下几种情况：

- Eureka Server不再从注册列表中移除因为长时间没收到心跳而应该过期的服务。
- Eureka Server仍然能够接受新服务的注册和查询请求，但是不会被同步到其它节点上，保证当前节点依然可用。
- 当网络稳定时，当前Eureka Server新的注册信息会被同步到其它节点中。

因此Eureka Server可以很好的应对因网络故障导致部分节点失联的情况，而不会像 ZK 那样如果有一半不可用的情况会导致整个集群不可用而变成瘫痪。

Eureka Server 自我保护机制，可以通过通过配置 `eureka.server.enable-self-preservation` 来 **true 打开/ false 禁用** 自我保护机制，默认打开状态，建议生产环境打开此配置。

### 2、Eureka Server 自我保护机制

之前的文章当前 – [9、Eureka 源码解析 之 Eureka Server 服务过期](/zhuanlan/registered/eureka/1/9.html) 当中，在进行服务过期的时候，首先会判断 Eureka Server 是否开启了自我保护机制。

> AbstractInstanceRegistry#evict(long)

```java
    public void evict(long additionalLeaseMs) {
        logger.debug("Running the evict task");
        if (!isLeaseExpirationEnabled()) {
            logger.debug("DS: lease expiration is currently disabled.");
            return;
        }
		......
}
```

如果开启了自我保护机制也就是 `isLeaseExpirationEnabled()` 方法返回了 false，就直接返回，不进行服务下线。

> PeerAwareInstanceRegistryImpl#isLeaseExpirationEnabled

```java
    @Override
    public boolean isLeaseExpirationEnabled() {
        if (!isSelfPreservationModeEnabled()) {
            // The self preservation mode is disabled, hence allowing the instances to expire.
            return true;
        }
        return numberOfRenewsPerMinThreshold > 0 && getNumOfRenewsInLastMin() > numberOfRenewsPerMinThreshold;
    }
```

- 首先判断 Eureka Server 是否开启了自我保护机制 eureka.enableSelfPreservation 为 true 开启反之不开启。如果没有开启直接返回 true，可以进行服务过期处理。
- 然后判断每分钟期望的续约数(numberOfRenewsPerMinThreshold) 大于 0 并且实际每分钟的续约数(getNumOfRenewsInLastMin()) 大于每分钟期望的续约数(numberOfRenewsPerMinThreshold)

### 3、每分钟应用的续约数

在Eureka Server 启动的时候，在注册服务(`AbstractInstanceRegistry`)中会启动一个定时任务 `MeasuredRate` 来计算每分钟应用续约的个数。时序图如下：

`MeasuredRate`，它是一个统计定时任务，在 `AbstractInstanceRegistry` 的构建器创建 `MeasuredRate` 对象的时候传入 `1000 * 60 * 1`，然后在这里调用它的 `start` 方法里面有一个定时任务，**每隔 60 秒也就是每隔 1 分钟执行一次**。这个定时任务里面有 **2 个 AtomicLong 类型的参数**。一个是 `AtomicLong currentBucket`每进行一次续约的时候就会调用它 + 1，另一个是 `AtomicLong lastBucket`。

当`MeasuredRate` 任务每分钟进行执行的时候就会把 `AtomicLong currentBucket` 里面的值设置到 `AtomicLong lastBucke`t当中去，然后把 `AtomicLong currentBucket`值清空再次计算。然后通过获取 `AtomicLong lastBucket` 的值就能够得到最近一分钟续约的次数。

这个设计还是蛮精巧的。

### 4、每分钟期望的续约数

每分钟期望的续约数是 AbstractInstanceRegistry#numberOfRenewsPerMinThreshold , 这个值是动态变化的。它提供了 AbstractInstanceRegistry#updateRenewsPerMinThreshold 来动态的更新这个值。

> AbstractInstanceRegistry#updateRenewsPerMinThreshold

```java
    protected void updateRenewsPerMinThreshold() {
        this.numberOfRenewsPerMinThreshold = (int) (this.expectedNumberOfClientsSendingRenews
                * (60.0 / serverConfig.getExpectedClientRenewalIntervalSeconds())
                * serverConfig.getRenewalPercentThreshold());
    }
```

每分钟期望的续约数是根据 `expectedNumberOfClientsSendingRenews` (期望 Eureka Client 发送的续约数，这个值会根据服务的动作进行更新：`服务注册 + 1`与`服务下线 - 1`) 来进行判断的。上面的公式如下：

```java
每分钟期望的续约数 = 期望Eureka Client发送的续约数 * (60 秒 / 预计客户端间隔秒数续约[默认 30 秒]) * 0.85
比如：现在注册中心有 20 个服务
那么：每分钟期望的续约数 = 20 * (60 / 30) * 0.85 = 17
```

> AbstractInstanceRegistry#register

```java
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
		......
        synchronized (lock) {
            if (this.expectedNumberOfClientsSendingRenews > 0) {
                // Since the client wants to register it, increase the number of clients sending renews
                this.expectedNumberOfClientsSendingRenews = this.expectedNumberOfClientsSendingRenews + 1;
                updateRenewsPerMinThreshold();
            }
        }
		...... 
}
```

**服务注册， expectedNumberOfClientsSendingRenews（期望Eureka Client发送的续约数） + 1**，并且更新每分钟期望的续约数。

> AbstractInstanceRegistry#internalCancel

```java
protected boolean internalCancel(String appName, String id, boolean isReplication) {
	.......
    synchronized (lock) {
        if (this.expectedNumberOfClientsSendingRenews > 0) {
            // Since the client wants to cancel it, reduce the number of clients to send renews.
            this.expectedNumberOfClientsSendingRenews = this.expectedNumberOfClientsSendingRenews - 1;
            updateRenewsPerMinThreshold();
        }
    }
	....
}
```

**服务下线， expectedNumberOfClientsSendingRenews（期望Eureka Client发送的续约数） - 1**，并且更新每分钟期望的续约数。

参考文章：

- [SpringCloud Eureka自我保护机制](https://www.jianshu.com/p/cb7fa0aa47a8)
