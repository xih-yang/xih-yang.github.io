# 17、ElasticSearch 实战：(底层原理) ES增删改查索引数据的过程
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/17.html
- 分类：搜索引擎
- 分组：教程目录
## 1 增删改document的流程

## 1.1 协调节点 - Coordinating Node

**Coordinating Node(协调节点): 客户端随机选择一个Node用来发送操作请求, 这个节点就称为协调节点.**

由于每个Node都能计算出Document的存储位置, 所以由哪个Node担任协调节点都是可以的——这对客户端来说是透明的.

## 1.2 增删改document的流程

**1、** 客户端通过协调节点发送 **增删改请求**.

>

**2、** 协调节点对客户端提交的文档进行路由, 然后将相关请求转发到 **存储该文档的Primary Shard**上.

>

**3、** Primary Shard处理客户端的请求, 然后将操作后的Document同步到其对应的Replica Shard中.

>

**4、** 协调节点监控到Primary Shard和其对应的Replica Shard都处理完了该Document, (协调节点)就将操作结果响应给客户端.

**强调: 增删改操作只能由Primary Shard处理, Replica Shard只能处理查询请求.**

## 2 查询document的流程

(1)流程:

**1、** 客户端通过协调节点发送 **查询请求**.

>

**2、** 协调节点对客户端提交的文档进行路由, 明确存储相关文档的Primary Shard(主分片), 然后使用Round-Robin算法(随机轮训算法), 将查询请求转发到 **该Primary Shard及这个主分片对应的任意一个Replica Shard(副本分片)** —— 读请求的负载均衡.

>

**3、** 接收到查询请求的Shard执行该请求, 然后将查询结果响应给协调节点.

>

**4、** 协调节点将查询结果响应给客户端.

(2)特殊情况说明:

> 如果某个Document正在Primary Shard中建立索引, 其他Replica Shard还没有来得及同步此索引, 而协调节点却将查询请求转发到了某个这样的Replica Shard上, 就会出现 没有查到这个Document 的情况.
>
> 当Document完成索引的创建之后, Primary Shard和Replica Shard中就都有相关数据了.

**强调: Replica Shard只能处理读(查询)请求.**
