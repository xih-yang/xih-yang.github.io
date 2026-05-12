# 06、Eureka源码解析 EurekaServer自我保护机制
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/6.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## EurekaServer自我保护机制

- Eureka的自我保护机制的意义在于当EurekaServer由于自身发生网络故障等原因无法接收到EurekaClient端发送的心跳(续约)时，不会将未收到心跳(续约)请求的服务下线，虽然这样短时间内可能造成EurekaServer维护的注册列表信息不是完全准确的，但保证了EurekaServer可用性。主要通过expectedNumberOfRenewsPerMin，numberOfRenewsPerMinThreshold这两个值判断是否进入自我保护模式，当每分钟收到的心跳数量小于期望收到的心跳数量，EurekaServer便会进入自我保护模式，不会剔除任何一个服务，直到心跳回复正常后退出自我保护模式
- EurekaServer有多处会进行计算expectedNumberOfRenewsPerMin，numberOfRenewsPerMinThreshold这两个值，但其实计算方法基本都是一样的，这里主要看一下服务注册和服务下线的时候，EurekaServer如何计算这两个值
- 服务注册

```java
if (this.expectedNumberOfRenewsPerMin > 0) {
    // Since the client wants to cancel it, reduce the threshold
    // (1
    // for 30 seconds, 2 for a minute)
    // 每分钟期望收到的心跳(续约)次数增加两次
    this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin + 2;
    // 每分钟期望最小心跳(续约 )次数 = 修改后的expectedNumberOfRenewsPerMin * 默认的0.85
    this.numberOfRenewsPerMinThreshold =
        (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
}
```

- 服务下线

```java
// EurekaServer自我保护机制
synchronized (lock) {
    if (this.expectedNumberOfRenewsPerMin > 0) {
        // Since the client wants to cancel it, reduce the threshold (1 for 30 seconds, 2 for a minute)
        // 每分钟期望收到的心跳(续约)次数减少两次
        this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin - 2;
        // 每分钟期望最小心跳(续约 )次数 = 修改后的expectedNumberOfRenewsPerMin * 默认的0.85
        this.numberOfRenewsPerMinThreshold =
            (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
