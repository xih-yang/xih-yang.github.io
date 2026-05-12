# 15、ElasticSearch 实战：Elasticsearch集群健康管理
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/15.html
- 分类：搜索引擎
- 分组：教程目录
### Elasticsearch关于集群的API

#### 查看集群健康状态

**请求地址**

```java
GET /_cat/health?v
```

**请求结果**

**参数含义**

参数
说明

status
集群状态，red红色表示集群不可用，yellow黄色表示集群可用但是不是高可用，green绿色表示集群正常

node.tota
节点数

node.data
数据节点的数量

shards
数据分片数量

pri
主分片数量

active_shards_percent
激活的分片百分比，当集群启动的时候，此数量可能不是100%，但是随着各个节点完成启动，会逐渐增大

#### 查看集群的索引健康状态

**请求地址**

```java
GET /_cat/indices?v
```

**请求结果**

**参数含义**

参数
说明

health
索引健康状态，green绿色为正常，yellow为索引可用但非高可用，red红色为索引不可用。其状态和集群健康状态相同

status
状态表明索引是否打开

index
索引名称

uuid
索引内部分配的唯一标识

pri
集群的主分片数量

docs.count
文档的数量

docs.deleted
被删除文档的数量

store.size
索引的存储的总容量

pri.store.size
主分片的容量

#### 查看磁盘的分配情况

**请求地址**

```java
GET /_cat/allocation?v
```

**请求结果**

**参数含义**

参数
说明

shards
该节点的分片数量

disk.indices
该节点中所有索引在该磁盘的空间

disk.used
该节点已经使用的磁盘容量

disk.avai
该节点可以使用的磁盘容量

disk.total
该节点的磁盘容量

#### 查看集群的节点情况

**请求地址**

```java
GET /_cat/nodes?v
```

**请求结果**

**参数含义**

参数
说明

ip
ip地址

heap.percen
堆内存使用情况

ram.percent
运行内存使用情况

cpu
CPU使用情况

master
是否是主节点

#### 集群管理的相关API

此API提供关于集群健康的其他的API

**请求地址**

```java
GET /_cat
```

**请求结果**

**参数含义**

请求API
作用

/_cat/allocation
查看磁盘的分配情况

/_cat/shards
查看节点包含哪些分片的详细视图

/_cat/shards/{index}
查看指定索引节点包含哪些分片的详细视图

/_cat/master
返回关于主节点的相关信息

/_cat/nodes
查看集群的节点情况

/_cat/tasks
查看es集群内部任务执行的情况

/_cat/indices
查看集群的索引健康状态

/_cat/indices/{index}
查看集群的索引健康状态(指定索引)

/_cat/segments
查询集群中Lucene数据段的信息，segment是ES中一个数据段，每次refresh都会生成一个新的segmen。elasticsearch有一个后台进程专门负责segment的合并，它会把小segments合并成更大的segments，然后反复这样

/_cat/segments/{index}
查询集群中Lucene数据段的信息(指定索引)

/_cat/count
返回集群中文档的计数

/_cat/count/{index}
返回指定索引的文档计数

/_cat/recovery
查看索引回复的情况

/_cat/recovery/{index}
查看指定索引回复的情况

/_cat/health
查看集群健康状态

/_cat/pending_tasks
查询集群中被挂起的任务

/_cat/aliases
查看集群别名列表

/_cat/aliases/{alias}
查看指定索引的别名情况

/_cat/thread_pool
查询es内部线程池的情况

/_cat/thread_pool/{thread_pools}
查询es内部线程池中指定线程的情况

/_cat/plugins
查询es插件列表

/_cat/fielddata
查询集群中每个节点中的fileddata所使用的堆内存

/_cat/fielddata/{fields}
查询集群中每个节点中的fields所使用的堆内存

/_cat/nodeattrs
查看集群节点的属性值

/_cat/repositories
查看集群的快照存储库

/_cat/snapshots/{repository}
返回有关存储在一个或多个存储库中的快照的信息

/_cat/templates
集群中索引模板的信息
