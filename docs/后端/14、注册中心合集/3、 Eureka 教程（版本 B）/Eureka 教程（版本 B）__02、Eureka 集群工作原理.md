# 02、Eureka 集群工作原理
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-2/2.html
- 分类：注册中心
- 分组：Eureka 教程（版本 B）
我们假设有三台 Eureka Server 组成的集群，这样三台 Eureka Server 就组建成了一个跨区域的高可用集群，只要三个地方的任意一个机房不出现问题，都不会影响整个架构的稳定性。

Eureka Server 集群相互之间通过 Replicate 来同步数据，相互之间**不区分主节点和从节点**，所有的节点都是平等的。在这种架构中，节点通过彼此互相注册来提高可用性，每个节点需要添加一个或多个有效的 serviceUrl 指向其他节点。

如果某台 Eureka Server 宕机，Eureka Client 的请求会自动切换到新的 Eureka Server 节点。当宕机的服务器重新恢复后，Eureka 会再次将其纳入到服务器集群管理之中。当节点开始接受客户端请求时，所有的操作都会进行节点间复制，将请求复制到其它 Eureka Server 当前所知的所有节点中。

另外Eureka Server 的同步遵循着一个非常简单的原则：只要有一条边将节点连接，就可以进行信息传播与同步。所以，如果存在多个节点，只需要将节点之间两两连接起来形成通路，那么其它注册中心都可以共享信息。每个 Eureka Server 同时也是 Eureka Client，多个 Eureka Server 之间通过 P2P 的方式完成服务注册表的同步。

Eureka Server 集群之间的状态是**采用异步方式同步的**，所以**不保证节点间的状态一定是一致的**，不过基本能保证**最终状态是一致的**。

**Eureka 分区,** Eureka 提供了 Region 和 Zone 两个概念来进行分区，这两个概念均来自于亚马逊的 AWS:

**1、****region**：可以理解为地理上的不同区域，比如亚洲地区，中国区或者深圳等等没有具体大小的限制根据项目具体的情况，可以自行合理划分region；

**2、****zone**：可以简单理解为region内的具体机房，比如说region划分为深圳，然后深圳有两个机房，就可以在此region之下划分出zone1、zone2两个zone；

上图中的 us-east-1c、us-east-1d、us-east-1e 就代表了不同的 Zone。Zone 内的 Eureka Client 优先和 Zone 内的 Eureka Server 进行心跳同步，同样调用端优先在 Zone 内的 Eureka Server 获取服务列表，当 Zone 内的 Eureka Server 挂掉之后，才会从别的 Zone 中获取信息。

**Eurka 保证 AP(** 可用性（Availability）、分区容错性（Partition tolerance） ) , 而不保证 C ( 一致性（Consistency）)

Eureka Server 各个节点都是平等的，几个节点挂掉不会影响正常节点的工作，剩余的节点依然可以提供注册和查询服务。而 Eureka Client 在向某个 Eureka 注册时，如果发现连接失败，则会自动切换至其它节点。只要有一台 Eureka Server 还在，就能保证注册服务可用(保证可用性)，只不过查到的信息可能不是最新的(不保证强一致性)。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/zhangyingchengqi/category_10464123.html
