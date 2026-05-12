# 01、Eureka 基础组件与工作原理
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-2/1.html
- 分类：注册中心
- 分组：Eureka 教程（版本 B）
## Eureka 核心概念

整体上可以分为两个主体：Eureka Server 和 Eureka Client. Service provider和Service consumer本质都是Eureka Client.

**Eureka Server：注册中心服务端, 功能如下:**

**1、****服务注册:** 服务提供者启动时，会通过EurekaClient向EurekaServer发送REST请求的方式向EurekaServer注册自己的服务信息数据，这些数据是服务自身的元数据，比如ip地址、端口、运行状况指标的url、主页地址等信息,EurekaServer会存储该服务的信息，EurekaServer内部有二层缓存机制(一个双层的Map)中来维护整个注册表.；

**2、****提供注册表:** 服务消费者在调用服务时，如果EurekaClient没有缓存注册表的话，会从EurekaServer获取最新的注册表；

**3、****同步状态:** EurekaClient通过注册、心跳机制和EurekaServer同步当前客户端的状态.；

**4、****Eviction服务剔除,** 当EurekaClient和EurekaServer不再有心跳时，EurekaServer会将该服务实例从服务注册列表中删除，即服务剔除；

**Eureka Client：注册中心客户端, 它**是一个 Java 客户端，用于简化与 Eureka Server 的交互。Eureka Client 会拉取、更新和缓存 Eureka Server 中的信息。因此当所有的 Eureka Server 节点都宕掉，服务消费者依然可以使用缓存中的信息找到服务提供者，但是当服务有更改的时候会出现信息不一致.

**1、** **Register:服务注册,**服务的提供者,将自身注册到注册中心，服务提供者也是一个EurekaClient；

**2、** **Renew:服务续约,**EurekaClient会每隔30秒发送一次心跳来续约通过续约来告知EurekaServer该EurekaClient运行正常，没有出现问题默认情况下，如果EurekaServer在90秒内没有收到EurekaClient的续约，Server端会将实例从其注册表中删除，此时间可配置，一般情况不建议更改；

服务续约的重要属性:

```java
服务续约任务的调用间隔时间，默认为30秒
eureka.instance.lease-renewal-interval-in-seconds=30
服务失效的时间，默认为90秒。
eureka.instance.lease-expiration-duration-in-seconds=90
```

**3. Cancel: 服务下线,** Eureka Client 在程序关闭时向 Eureka Server 发送取消请求。 发送请求后，该客户端实例信息将从 Eureka Server 的实例注册表中删除。该下线请求不会自动完成，它需要调用以下内容：

```java
DiscoveryManager.getInstance().shutdownComponent()；
```

**4. GetRegisty: 获取注册列表信息,** Eureka Client 从服务器获取注册表信息，并将其缓存在本地。客户端会使用该信息查找其他服务，从而进行远程调用。该注册列表信息定期（每30秒钟）更新一次。每次返回注册列表信息可能与 Eureka Client 的缓存信息不同，Eureka Client 自动处理。

如果由于某种原因导致注册列表信息不能及时匹配，Eureka Client 则会重新获取整个注册表信息。 Eureka Server 缓存注册列表信息，整个注册表以及每个应用程序的信息进行了压缩，压缩内容和没有压缩的内容完全相同。Eureka Client 和 Eureka Server 可以使用 JSON/XML 格式进行通讯。在默认情况下 Eureka Client 使用压缩 JSON 格式来获取注册列表的信息。

```java
# 启用服务消费者从注册中心拉取服务列表的功能
eureka.client.fetch-registry=true
# 设置服务消费者从注册中心拉取服务列表的间隔
eureka.client.registry-fetch-interval-seconds=30
```

**5. Remote Call: 远程调用,** 当 Eureka Client 从注册中心获取到服务提供者信息后，就可以通过 Http 请求调用对应的服务；服务提供者有多个时，Eureka Client 客户端会通过 Ribbon 自动进行负载均衡

## 自我保护机制

默认情况下，如果 Eureka Server 在一定的 90s 内没有接收到某个微服务实例的心跳，会注销该实例。但是在微服务架构下服务之间通常都是跨进程调用，网络通信往往会面临着各种问题，比如微服务状态正常，网络分区故障，导致此实例被注销。固定时间内大量实例被注销，可能会严重威胁整个微服务架构的可用性。为了解决这个问题，Eureka 开发了自我保护机制，那么什么是自我保护机制呢？

Eureka Server 在运行期间会去统计心跳失败比例在 15 分钟之内是否低于 85%，如果低于 85%，Eureka Server 即会进入自我保护机制。

**Eureka Server 触发自我保护机制后，页面会出现提示：**

**Eureka Server 进入自我保护机制，会出现以下几种情况：**

**1、** Eureka不再从注册列表中移除因为长时间没收到心跳而应该过期的服务；

**2、** Eureka仍然能够接受新服务的注册和查询请求，但是不会被同步到其它节点上(即保证当前节点依然可用)；

**3、** 当网络稳定时，当前实例新的注册信息会被同步到其它节点中；

Eureka 自我保护机制是为了防止误杀服务而提供的一个机制。当个别客户端出现心跳失联时，则认为是客户端的问题，剔除掉客户端；当 Eureka 捕获到大量的心跳失败时，则认为可能是网络问题，进入自我保护机制；当客户端心跳恢复时，Eureka 会自动退出自我保护机制。

如果在保护期内刚好这个服务提供者非正常下线了，此时服务消费者就会拿到一个无效的服务实例，即会调用失败。对于这个问题需要服务消费者端要有一些容错机制，如重试，断路器等。

```java
eureka.server.enable-self-preservation=true  开启自我保护机制
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/zhangyingchengqi/category_10464123.html
