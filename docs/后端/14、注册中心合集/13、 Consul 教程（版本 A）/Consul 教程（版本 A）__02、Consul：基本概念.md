# 02、Consul：基本概念
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/2.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章继续介绍一些使用Consul所需要了解的基础概念。

## 开发模式

Consul提供开发模式（dev），这种模式不被建议在生产环境中使用，在这种模式下可扩展性和安全性的保障都不足，但是使用起来却会非常简单，大多数Consul的功能的使用都无需进行额外的配置和设定，是学习Consul功能中常用的选项。

## Server vs Client

> Consul集群：在Consul中，每个提供服务的节点上都需要安装和运行Consul Agent，Consul Agent有服务器和客户端两种模式，所有运行Consul Agent的节点一同构成Consul集群。

- Consul Server

Consul Server主要负责存放和备份使用RAFT协议保持了一致性的数据，通常由奇数个节点构成集群并选举出Leader。
- 多数据中心支持

Consul是支持多个数据中心的，每个Consul的数据中心都必须有至少一个Server用来维护Consul的状态。这些信息包括用于服务发现以及服务路由的相关内容。需要进行跨数据中心的查询等操作的时候，是通过本地数据中心的Consul Server进行的，需要注意的是这种情况下Consul Server之间不会进行Key/Value数据的同步。

## 集群构成说明

- CLIENT

上图中标示CLIENT的节点表示此Consul Agent以客户端模式运行（client），这种方式下，所有注册当此节点的服务都会被转发到图中标示SERVER的节点进行持久化信息的保存，而CLIENT节点本身并不进行持久化信息的保存。
- SERVER

上图中标示SERVER的节点表示此Consul Agent以服务端模式运行（server），这种方式下，所有注册当此节点的服务都会在本地进行持久化信息的保存，这是和CLIENT节点最大的不同。
- LEADER

多节点之间进行数据的同步，往往都需要一个Leader进行统一管理，比如将注册信息分发给其他SERVER以及各个节点的健康监测等职责都由上图中标示LEADER的节点来完成。
- LAN GOSSIP vs WAN GOSSIP

Consul使用GOSSIP协议进行集群成员之间信息的通信，通过LAN GOSSIP进行本地数据中心之间的内部通信，而WAN GOSSIP则是用于多个数据中心之间的通信。

## 建议事项

- 建议1: 不要在生产环境中使用开发模式

开发模式虽然使用起来非常简单（使用-dev即可），但是有安全的风险，同时持久化选项也是不支持的。
- 建议2: 不要在生产环境中使用单节点结构的Consul

为了保证Consul的高可用性，在生产环境中建议至少使用3个或者5个节点构成的Consul集群提供服务，这样会避免但节点结构的Consul因服务器宕机导致的Consul服务的不可用。使用奇数的节点以保证节点故障之后Consul集群仍然能较好地运行。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
