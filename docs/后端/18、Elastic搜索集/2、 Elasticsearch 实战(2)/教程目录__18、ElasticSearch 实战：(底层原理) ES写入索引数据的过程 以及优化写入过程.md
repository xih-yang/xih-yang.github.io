# 18、ElasticSearch 实战：(底层原理) ES写入索引数据的过程 以及优化写入过程
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/18.html
- 分类：搜索引擎
- 分组：教程目录
## 1 Lucene操作document的流程

**Lucene将index数据分为segment(段)进行存储和管理.**

**Lucene中, 倒排索引一旦被创建就不可改变, 要添加或修改文档, 就需要重建整个倒排索引, 这就对一个index所能包含的数据量, 或index可以被更新的频率造成了很大的限制.**

> 为了在保留不变性的前提下实现倒排索引的更新, Lucene引入了一个新思路: 使用更多的索引, 也就是通过增加新的补充索引来反映最新的修改, 而不是直接重写整个倒排索引.
>
> —— 这样就能确保, 从最早的版本开始, 每一个倒排索引都会被查询到, 查询完之后再对结果进行合并.

## 1.1 添加document的流程

**1、** 将数据写入buffer(内存缓冲区);

**2、** 执行commit操作: buffer空间被占满, 其中的数据将作为新的 index segment 被commit到文件系统的cache(缓存)中;

**3、** cache中的index segment通过`fsync`强制flush到系统的磁盘上;

**4、** 写入磁盘的所有segment将被记录到commit point(提交点)中, 并写入磁盘;

**4、** 新的index segment被打开, 以备外部检索使用;

⑤清空当前buffer缓冲区, 等待接收新的文档.

说明:

> (a) fsync是一个Unix系统调用函数, 用来将内存缓冲区buffer中的数据存储到文件系统. 这里作了优化, 是指将文件缓存cache中的所有segment刷新到磁盘的操作.
>
> (b) 每个Shard都有一个提交点(commit point), 其中保存了当前Shard成功写入磁盘的所有segment.

## 1.2 删除document的流程

**1、** 提交删除操作, 先查询要删除的文档所属的segment;

**2、** commit point中包含一个`.del`文件, 记录哪些segment中的哪些document被标记为`deleted`了;

**3、** 当`.del`文件中存储的文档足够多时, ES将执行物理删除操作, 彻底清除这些文档.

- 在删除过程中进行搜索操作:

依次查询所有的segment, 取得结果后, 再根据`.del`文件, 过滤掉标记为`deleted`的文档, 然后返回搜索结果. —— 也就是被标记为delete的文档, 依然可以被查询到.

- 在删除过程中进行更新操作:

将旧文档标记为`deleted`, 然后将新的文档写入新的index segment中. 执行查询请求时, 可能会匹配到旧版本的文档, 但由于`.del`文件的存在, 不恰当的文档将被过滤掉.

## 2 优化写入流程 - 实现近实时搜索

## 2.1 流程的改进思路

(1)现有流程的问题:

插入的新文档必须等待`fsync`操作将segment强制写入磁盘后, 才可以提供搜索.而 `fsync`操作的代价很大, 使得搜索不够实时.

(2)改进写入流程:

**1、** 将数据写入buffer(内存缓冲区);

**2、** 不等buffer空间被占满, 而是每隔一定时间(默认1s), 其中的数据就作为新的index segment被commit到文件系统的cache(缓存)中;

**3、** index segment 一旦被写入cache(缓存), 就立即打开该segment供搜索使用;

**4、** 清空当前buffer缓冲区, 等待接收新的文档.

——这里移除了`fsync`操作, 便于后续流程的优化.

> 优化的地方: 过程 2、 和过程 3、 :
>
> segment进入操作系统的缓存中就可以提供搜索, 这个写入和打开新segment的轻量过程被称为refresh.

## 2.2 设置refresh的间隔

Elasticsearch中, 每个Shard每秒都会自动refresh一次, 所以ES是近实时的, 数据插入到可以被搜索的间隔默认是1秒.

(1)手动refresh —— 测试时使用, 正式生产中请减少使用:

```java
# 刷新所有索引:
POST _refresh
# 刷新某一个索引: 
POST employee/_refresh
```

(2)手动设置refresh间隔 —— 若要优化索引速度, 而不注重实时性, 可以降低刷新频率:

```java
# 创建索引时设置, 间隔1分钟: 
PUT employee
{
    "settings": {
        "refresh_interval": "1m"
    }
}
# 在已有索引中设置, 间隔10秒: 
PUT employee/_settings
{
    "refresh_interval": "10s"
}
```

(3)当你在生产环境中建立一个大的新索引时, 可以先关闭自动刷新, 要开始使用该索引时再改回来:

```java
# 关闭自动刷新: 
PUT employee/_settings
{
    "refresh_interval": -1 
} 
# 开启每秒刷新: 
PUT employee/_settings
{
    "refresh_interval": "1s"
} 
```

## 3 优化写入流程 - 实现持久化变更

**Elasticsearch通过事务日志(translog)来防止数据的丢失 —— durability持久化.**

## 3.1 文档持久化到磁盘的流程

**1、** 索引数据在写入内存buffer(缓冲区)的同时, 也写入到translog日志文件中;

**2、** 每隔`refresh_interval`的时间就执行一次refresh:

> (a) 将buffer中的数据作为新的 index segment, 刷到文件系统的cache(缓存)中;
>
> (b) index segment一旦被写入文件cache(缓存), 就立即打开该segment供搜索使用;

**3、** 清空当前内存buffer(缓冲区), 等待接收新的文档;

**4、** 重复 **1、** ~ **3、** , translog文件中的数据不断增加;

⑤ **每隔一定时间(默认30分钟), 或者当translog文件达到一定大小时, 发生flush操作, 并执行一次全量提交**:

> (a) 将此时内存buffer(缓冲区)中的所有数据写入一个新的segment, 并commit到文件系统的cache中;
>
> (b) 打开这个新的segment, 供搜索使用;
>
> (c) 清空当前的内存buffer(缓冲区);
>
> (d) 将translog文件中的所有segment通过fsync强制刷到磁盘上;
>
> (e) 将此次写入磁盘的所有segment记录到commit point中, 并写入磁盘;
>
> (f) 删除当前translog, 创建新的translog接收下一波创建请求.

**扩展: translog也可以被用来提供实时CRUD.**

> 当通过id查询、更新、删除一个文档时, 从segment中检索之前, 先检查translog中的最新变化 —— ES总是能够实时地获取到文档的最新版本.

共计：3599 个字

## 3.2 基于translog和commit point的数据恢复

(1)关于translog的配置:

**flush操作 = 将translog中的记录刷到磁盘上 + 更新commit point信息 + 清空translog文件.**

> Elasticsearch默认: 每隔30分钟就flush一次;
>
> 或者: 当translog文件的大小达到上限(默认为512MB)时主动触发flush.

相关配置为:

```java
# 发生多少次操作(累计多少条数据)后进行一次flush, 默认是unlimited: 
index.translog.flush_threshold_ops
# 当translog的大小达到此预设值时, 执行一次flush操作, 默认是512MB: 
index.translog.flush_threshold_size
# 每隔多长时间执行一次flush操作, 默认是30min:
index.translog.flush_threshold_period
# 检查translog、并执行一次flush操作的间隔. 默认是5s: ES会在5-10s之间进行一次操作: 
index.translog.interval
```

(2)数据的故障恢复:

**1、** 增删改操作成功的标志: segment被成功刷新到Primary Shard和其对应的Replica Shard的磁盘上, 对应的操作才算成功.

**2、****translog文件中存储了上一次flush(即上一个commit point)到当前时间的所有数据的变更记录. —— 即translog中存储的是还没有被刷到磁盘的所有最新变更记录.**

**3、** ES发生故障, 或重启ES时, 将根据磁盘中的commit point去加载已经写入磁盘的segment, 并重做translog文件中的所有操作, 从而保证数据的一致性.

(3)异步刷新translog:

为了保证不丢失数据, 就要保护translog文件的安全:

> Elasticsearch 2.0之后, 每次写请求(如index、delete、update、bulk等)完成时, 都会触发fsync将translog中的segment刷到磁盘, 然后才会返回200 OK的响应;
>
> 或者: 默认每隔5s就将translog中的数据通过fsync强制刷新到磁盘.

——提高数据安全性的同时, 降低了一点性能.

==>频繁地执行`fsync`操作, 可能会产生阻塞导致部分操作耗时较久. **如果允许部分数据丢失, 可设置异步刷新translog来提高效率.**

```java
PUT employee/_settings
{
    "index.translog.durability": "async",
    "index.translog.sync_interval": "5s"
}
```

## 4 优化写入流程 - 实现海量segment文件的归并

## 4.1 存在的问题

由上述近实时性搜索的描述, 可知ES默认每秒都会产生一个新的segment文件, 而每次搜索时都要遍历所有的segment, 这非常影响搜索性能.

为解决这一问题, ES会对这些零散的segment进行merge(归并)操作, 尽量让索引中只保有少量的、体积较大的segment文件.

这个过程由独立的merge线程负责, 不会影响新segment的产生.

同时,**在merge段文件(segment)的过程中, 被标记为deleted的document也会被彻底物理删除.**

## 4.2 merge操作的流程

**1、** 选择一些有相似大小的segment, merge成一个大的segment;

**2、** 将新的segment刷新到磁盘上;

**3、** 更新commit文件: 写一个新的commit point, 包括了新的segment, 并删除旧的segment;

**4、** 打开新的segment, 完成搜索请求的转移;

⑤删除旧的小segment.

## 4.3 优化merge的配置项

segment的归并是一个非常消耗系统CPU和磁盘IO资源的任务, 所以ES对归并线程提供了限速机制, 确保这个任务不会过分影响到其他任务.

(1)归并线程的速度限制:

限速配置 `indices.store.throttle.max_bytes_per_sec`的默认值是20MB, 这对写入量较大、磁盘转速较高的服务器来说明显过低.

对ELK Stack应用, 建议将其调大到100MB或更高. 可以通过API设置, 也可以写在配置文件中:

```java
PUT _cluster/settings
{
    "persistent" : {
        "indices.store.throttle.max_bytes_per_sec" : "100mb"
    }
}
// 响应结果如下: 
{
    "acknowledged": true,
    "persistent": {
        "indices": {
            "store": {
                "throttle": {
                    "max_bytes_per_sec": "100mb"
                }
            }
        }
    },
    "transient": {}
}
```

(2)归并线程的数目:

推荐设置为CPU核心数的一半, 如果磁盘性能较差, 可以适当降低配置, 避免发生磁盘IO堵塞:

```java
PUT employee/_settings
{
    "index.merge.scheduler.max_thread_count" : 8
}
```

(3)其他策略:

```java
# 优先归并小于此值的segment, 默认是2MB:
index.merge.policy.floor_segment
# 一次最多归并多少个segment, 默认是10个: 
index.merge.policy.max_merge_at_once
# 一次直接归并多少个segment, 默认是30个
index.merge.policy.max_merge_at_once_explicit
# 大于此值的segment不参与归并, 默认是5GB. optimize操作不受影响
index.merge.policy.max_merged_segment
```

## 4.4 optimize接口的使用

segment的默认大小是5GB, 在非常庞大的索引中, 仍然会存在很多segment, 这对文件句柄、内存等资源都是很大的浪费.

但由于归并任务非常消耗资源, 所以一般不会选择加大 `index.merge.policy.max_merged_segment` 配置, 而是在负载较低的时间段, 通过`optimize`接口强制归并segment:

```java
# 强制将segment归并为1个大的segment: 
POST employee/_optimize?max_num_segments=1
# 在终端中的操作方法: 
curl -XPOST http://ip:5601/employee/_optimize?max_num_segments=1
```

**optimize线程不会受到任何资源上的限制, 所以不建议对还在写入数据的热索引(动态索引)执行这个操作.**

实战建议: 对一些很少发生变化的老索引, 如日志信息, 可以将每个Shard下的segment合并为一个单独的segment, 节约资源, 还能提高搜索效率.
