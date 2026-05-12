# 02、Redis 源码解析 - Redis 总体架构
- 来源：https://ddkk.com/zhuanlan/db/redis/6/2.html
- 分类：缓存数据库
- 分组：教程目录
刚开始阅读Redis代码的时候，经常感到效率不高，难以把握整体，现在回想起来主要有以下几个原因：

Redis为了追求极致的内存使用和效率，很多数据结构从0开始实现，个别结构比较复杂，导致很容易陷入细节之中。

Redis中功能模块很多，某些模块比较复杂，而且往往夹杂着其他模块，如果不清楚模块之间的联系，就很难找到一条清晰的调用主线。

Redis是纯C实现，很难达到C++那样的封装性和抽象性，导致一些复杂函数会非常长，为了理清一个函数的调用关系，往往花费大量时间，无法快速抓住主干。

如果一开始就盯着一个代码文件看，效率就比较低，也很难分清主次。所以阅读代码时要注意以下两点：

> 先理清主线分支，再根据功能深入分支细节

> 紧紧把握Redis的设计原理，根据原理来阅读代码，就容易理解代码逻辑

由于Redis 6.0版本在业界还没有大规模线上应用，而且较5.0版本改动较大，下面就以Redis 5.0.10版本为例，梳理下Redis的整体结构和功能模块，然后以模块为单位，阅读相关代码。

## Redis功能模块

Redis作为一个高性能、高可用的分布式KV缓存系统，可以将整个系统分成单机数据库、高可靠性、集群三部分。

三个部分相对来说比较独立，每个部分又可以继续拆解，将src目录下的文件按照这三个部分拆分。

### 单机数据库

单机数据库部分可以分为单机实例、数据结构、数据库操作。

#### 单机实例

Redis作为一个后端系统，需要有服务器的主体控制流程，这部分在server.h/c中，包括配置解析、数据库初始化、主流程启动。

其次服务器的网络通信部分在ae.h/c，ae_epoll.c，ae_evport.c，ae_kqueue.c，ae_select.c中，同时Redis对最底层的TCP部分进行了封装，包括Socket创建、接受、监听以及相关设置，这部分在anet.h/c中。当有客户端连接时，包括业务客户端、主从复制客户端、集群节点客户端连接到服务器时，会创建对应的client实例，client何时可写、如何回复、何时销毁等部分在networking.c中。

#### 数据结构

Redis提供了丰富的数据类型来支持不同的业务，除了用来实现不同的键值类型，底层的功能实现也依赖于这些数据类型，其中常见的键值类型包括String、List、Hash、Set和Sorted Set这这五种，同时还支持BitMap、HyperLogLog、Geo和Stream这四种扩展类型。Redis官方的Module在原理上也是通过创建新的数据类型来提供更加丰富的键值操作，比较出名的包括RedisSearch、RedisBloom、RedisJson等。

常见的数据结构以及与之对应的键值类型如下：

- 字符串 (sds.h/c)： String
- 双向列表（adlist.h/c）：List
- 压缩列表（ziplist.h/c）：List、Hash、Sorted Set
- 压缩Map（zipmap.h/c）：Hash
- quickList（quicklist.h/c）：List、Hash、Sorted Set，quickList的实现原理有点像stl中的deque
- 跳表（t_zset.c）：Sorted Set
- 哈希表（dict.h/c）：Hash
- 位图（bitops.c）: BitMap
- GeoHash（geohash.h/c、geo.h/c、geohelper.h/c）: Geo
- HyperLogLog（hyperloglog.c）：HyperLogLog
- 流数据（rax.h/c）：Stream

#### 数据库

- KV数据库的相关实现在db.c中，包括对键值对的新增、查询、修改和删除，所有支持的命令在server.c中，同时该文件也实现了这些命令的注册和初始化。
- 前面讲到，Redis支持String、List、Hash、Set和Sorted Set这五种数据类型，对应的实现在t_string.c、t_list.c、t_hash.c、t_set.c和t_zset中，对应的键值对的封装在object.c中。
- Redis还额外支持发布订阅的功能，这部分实现在pubsub.c中
- 对于事务的支持在multi.c中

Redis是一个纯内存的KV数据库，对于内存使用做了相当多的优化，比如：

- 为了对键值对做优化，很多类型底层都有两种实现方案，比如List和Hash在数据量较少时，采用ziplist和zipmap实现，内存使用效率更高，当数据量增大时，为了查询效率，才转化为quicklist和dict。
- 在内存分配中，Redis放弃了glibc中的tcmalloc，采用jemalloc，大大减少了内存碎片率。
- 当数据库所占内存超过配置的阈值时，为了保护系统，Redis会采用对应的规则淘汰KV对，淘汰策略有很多，包括LRU、LFU等算法，这部分在evict.c中。
- Redis支持对key设置过期时间，当key过期时，会采用相应策略删除KV对，这部分在expire.c中。

同时Redis是个单线程数据库，意味着包括读取解析客户端命令、处理命令、回复响应、大部分后台任务都要在一个线程中完成，这就要求任何步骤都不能造成长时间的阻塞，由此造成了Redis独有的一些处理方式：

- 当数据库需要扩容时，会逐步rehash，这部分在dict.h/c中
- 部分后台任务会在单独的线程中处理，例如：删除key、关闭文件、fsync文件，这部分在bio.h/c和lazyfree.c中。
- 每个模块都需要一些周期性任务，这些任务在server.c中实现，同时根据执行频率确定每个任务的执行间隔，有些任务还会严格的限制执行时间

### 高可靠性

虽然Redis通常作为一个纯内存的KV数据库使用，但是为了避免单机故障和完全丢失数据，Redis提供一些措施来保证它的高可靠性，主要包括持久化和主从复制。

#### 持久化

持久化有两种方式：

- 快照RDB，这部分实现在rdb.c中
- 追加日志AOF，这部分实现在aof.c

在AOF中，为了避免日志过大，会定期的打内存快照RDB，之后可以安全的删除之前的日志。

#### 主从复制

这部分实现在replication.c中，主从复制提供的是最终一致性，通过提供多份冗余数据的方式，保证了Redis的高可靠性，同时，在数据实时性要求不高的情况下，可以分散读请求的压力。最后主从复制可以看成是一种数据导出和同步的方式，在实际应用时可以非常灵活。

### 集群

集群部分相对独立，与主从复制共同保证了Redis的高可靠性，同时通过该分片提供了高扩展性，这部分实现在cluster.h/c中。

最后，Redis还提供额外的功能模块，来帮助运维人员排查问题和监测系统运行，比如latency.h/c中监控操作延时，slowlog.h/c中记录慢命令，这部分都比较简单。
