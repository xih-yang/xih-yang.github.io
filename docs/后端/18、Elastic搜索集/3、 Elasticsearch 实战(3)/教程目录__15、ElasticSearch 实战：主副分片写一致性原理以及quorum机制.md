# 15、ElasticSearch 实战：主副分片写一致性原理以及quorum机制
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/15.html
- 分类：搜索引擎
- 分组：教程目录
简单说就是primary shard写完，会同步到replica shard上，两者最终可能会出现不一致的情况。那es是如何确定主副分片的写一致性的呢？

### 1、es5.0前，采用写入前检查存活shard的方式

#### (1)consistency

我们在发送任何一个增删改请求的时候，比如说put /product/book/id，都可以带上一个consistency参数，指明我们想要的写一致性类型

```java
put /product/book/1?consistency=quorum
```

consistency有三个可选值：

one：只要有1个primary shard是可用的，就可以进行写操作

all：必须所有的primary shard和replica shard都是可用的，才可以进行写操作

quorum：默认值。要求所有的shard中，必须大部分shard都是可用的，才可以进行写操作

#### (2)quorum机制

写之前必须确保大多数shard都是可用的，具体会根据公式来判断是否可用

公式：可用的shard>=(primary shard数量+replica shard份数)/2+1时可以写入，举个例子

有3个primary shard，replica shard份数为1，总共有3+3*1=6个shard

quorum=(3+1)/2+1=3

所以，要求6个shard中至少有3个shard是可用的，才可以执行这个写操作

有种特殊情况，比如es只有1个节点，index有1个primary shard和1个replica shard，这种情况replica shard实际上是无法分配到节点上的，存活shard只有1个，而quorum=(1+1)/2+1=2,按公式算的话最终会无法写入，不过es对这种情况做了例外处理是可以正常写入的。

#### (3)quorum不齐全时不会直接拒绝写入

当quorum不齐全时，会默认等待1分钟，看等待期间可用的shard有没有增加到quorum的数量，等待时间结束若还不满足，则拒绝写入，比如我在写入时手动指定30秒等待(超时)时间，语法为

```java
put /product/book/1?timeout=30
```

### 2、es5.0后，采用写入后才确认的方式

consistency检查是在put之前做的。然而虽然检查的时候，可用shard数量满足quorum数量，但是真正从primary shard写到replica shard之前，仍然会出现shard挂掉的可能，但update api会返回succeed。因此，这个检查并不能保证replica shard成功写入，甚至这个primary shard是否能成功写入也未必能保证。

因此es5.0后修改了语法，用wait_for_active_shards代替原来的consistency

```java
#写入完1个primary shard就返回客户端
PUT /product/book/1?wait_for_active_shards=1
```

也可以在建索引的时候指定write.wait_for_active_shards

```java
PUT /product
{ "mappings": {
    "properties": {
      "text": {
        "type": "text",
        "store" : true
       },
       "fullname": {
        "type": "text"
      }
    }
  },
  "settings" : {
    "index" : {
      "number_of_shards" : 1,
      "number_of_replicas" : 2,
      "write.wait_for_active_shards":3
    }
  }
}
```
