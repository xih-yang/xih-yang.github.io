# 14、ElasticSearch 实战：document数据路由原理
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/14.html
- 分类：搜索引擎
- 分组：教程目录
### 1、document路由到shard上是什么意思？

我们知道，1个index的数据会被分配到多个shard中，1个document只会被放到其中1个primary shard中。

也就是说，当我们创建document的时候，es就要决定这个document是放在这个index的哪个shard上，这个过程就称为document routing(数据路由)。

### 2、路由算法

公式：shard=hash(routing)%number_of_primary_shards

每次增删改查一个document的时候，都会带过来一个routing，默认就是这个document的_id，也就说会默认会根据_id来路由

举个例子，1个index有3个primary shard(P1,P2,P3)，_id是1

hash(1)假如等于22，hash值对primary shard数量求余22%3=1，那这个document由es决定放在P1上。

### 3、使用默认routing或手动指定routing

默认的routing就是_id

也可以在写入document的时候指定routing，语法为

```java
put /index/type/id?routing=user_id
```

### 4、为什么primary shard数量不可变

举刚才的例子，默认3个primary shard(P1,P2,P3)，id为1的document最终被存放在P1

此时假如primary shard数量变成了4，此时我们对这个document进行查询

用公式计算比如hash(4)=28，hash值对primary shard数量求余28/4=0，此时es会去P0上拿document，而我们知道这个document是被存放在P1的，结果发现没有找到，间接导致了数据丢失。

### 5、通过协调节点进行增删改的内部原理

前面讲了数据路由原理，这里要讲的是document是在哪里进行路由，那么就要引出一个概念：协调节点。简单地说所有的shard都是协调节点。java客户端可以往任何一个shard发送请求，因为任何一个shard都知道每个document在哪个shard上。下面讲一下增删改的流程/内部原理：

(1)请求会从协调节点被转发到最终的primary shard上去处理。

(2)然后primary shard将document同步到replica shard上。

(3)协调节点发现路由到的所有primary shard和对应的replica shard都处理完请求后，就返回响应结果给客户端。

### 6、通过协调节点进行查询的内部原理

与增删改不同的是，协调节点会把查询请求路由到涉及到的document的其中一个primary shard或replica shard上，具体会使用round-robin随机轮询算法，使读请求负载均衡。
