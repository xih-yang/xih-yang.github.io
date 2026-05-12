# 09、源码解析 Eureka 自我保护源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/9.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
Eureka自我保护源码解析

前言

## 1、自我保护整体流程图

## 2、整体流程说明

1、假如说，20个服务实例，结果在1分钟之内，只有8个服务实例保持了心跳 --> eureka server是应该将剩余的12个没有心跳的服务实例都摘除吗？

这个时候很可能说的是，eureka server自己网络故障了，那些服务没问题的。只不过eureka server自己的机器所在的网络故障了，导致那些服务的心跳发送不过来。就导致eureka server本地一直没有更新心跳。

自己进入一个自我保护的机制，从此之后就不会再摘除任何服务实例了

注册表的evict()方法，EvictionTask，定时调度的任务，60s来一次，会判断一下服务实例是否故障了，如果故障了，一直没有心跳，就会将服务实例给摘除。

1、evict()方法内部，先会判断上一分钟的心跳次数，是否小于我期望的一分钟的心跳次数，如果小于，那么压根儿就不让清理任何服务实例

2、心跳数计算

**注册、下线、故障**

这个每分钟期望的心跳的次数，是跟咱们的这个服务实例的数量相关的，服务实例随着上线和下线、故障，都在不断的变动着。注册的时候，每分钟期望心跳次数 + 2。服务下线的时候，直接每分钟期望心跳次数 - 2。

**定时更新**

Registry注册表，默认是15分钟，会跑一次定时任务，算一下服务实例的数量，如果从别的eureka server拉取到的服务实例的数量，大于当前的服务实例的数量，会重新计算一下，主要是跟其他的eureka server做一下同步

触发概率很小

3、实际的上一分钟的心跳次数是怎么算出来的

抓大放小，之前我们看源码的时候，看到过这个MeasutredRate，当时肯定是看不懂的，因为很多代码，都是一个机制相关的。每次一个心跳过来，一定会更新这个MeasturedRate。来计算每一分钟的心跳的实际的次数。

MeasuredRate，好好看看，**技术亮点：如何计算每一分钟内的一个内存中的计数的呢？计算每一分钟内的心跳的次数？**

4、来看看自我保护机制的触发

如果上一分钟实际的心跳次数，比我们期望的一分钟的心跳次数要小，触发自我保护机制，不允许摘除任何服务实例，此时认为自己的eureka server出现网络故障，大量的服务实例无法发送心跳过来

5、eureka这一块，自我保护机制，你必须从源码级别要看懂

因为其实在线上的时候，最坑爹的就是这儿，就是你会发现有些服务实例下线了，但是eureka控制台老是没给他摘除，自我保护机制了。线上生产环境，如果你可以的话，你可以选择将这个自我保护给关了。

如果eureka server接收不到心跳的话，各个服务实例也是无法从eureka server拉取注册表的。每个服务实例直接基于自己的本地的注册表的缓存来就可以了。

自我保护机制给打开也可以，从源码层面硬知道了，服务故障摘除，自我保护的源码，如果你发现线上生产环境，出现了一些问题，你可以从源码级别去看一下是怎么回事。

## 2、看一下自我保护的源码

### 2.1 isSelfPreservationModeEnabled（是否自我保护模式开启）

```java
/**
* 1、这个方法用于去检测自我保护模式是否开启
* 2、当 renewsInLastMin < 期望的心跳数，自我保护模式开启。因为 eureka 认为可能是自身的网络原因导致的心跳不成功，所以移除实例是危险的，所以开启自我保护模式，不摘除实例
* 3、当心跳数正常自我保护模式关闭、或者你把这个值设置为 false
*/
/**
 * Checks to see if the self-preservation mode is enabled.
 *
 * <p>
 * The self-preservation mode is enabled if the expected number of renewals
 * per minute {@linkgetNumOfRenewsInLastMin()} is lesser than the expected
 * threshold which is determined by {@linkgetNumOfRenewsPerMinThreshold()}
 * . Eureka perceives this as a danger and stops expiring instances as this
 * is most likely because of a network event. The mode is disabled only when
 * the renewals get back to above the threshold or if the flag
 * {@LinkEurekaServerConfig#shouldEnableSelfPreservation()} is set to
 * false.
 * </p>
 *
 * @return true if the self-preservation mode is enabled, false otherwise.
 */
@Override
public boolean isSelfPreservationModeEnabled() {
    return serverConfig.shouldEnableSelfPreservation();
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
