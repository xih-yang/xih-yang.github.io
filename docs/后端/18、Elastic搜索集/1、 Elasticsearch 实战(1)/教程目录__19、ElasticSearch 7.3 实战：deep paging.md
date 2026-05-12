# 19、ElasticSearch 7.3 实战：deep paging
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/19.html
- 分类：搜索引擎
- 分组：教程目录
#### 1、什么是deep paging

根据相关度评分倒排序，所以分页过深，协调节点会将大量数据聚合分析。

#### 2、deep paging 性能问题

1消耗网络带宽，因为所搜过深的话，各 `shard`要把数据传递给 `coordinate node`，这个过程是有大量数据传递的，消耗网络。

2消耗内存，各 shard 要把数据传送给 coordinate node，这个传递回来的数据，是被 coordinate node 保存在内存中的，这样会大量消耗内存。

3消耗cup，coordinate node 要把传回来的数据进行排序，这个排序过程很消耗cpu。 所以：鉴于deep paging的性能问题，所有应尽量减少使用。

如上图所示：查询第9990页数据。来理解deep paging：

我们比较容易想到，我们每个节点都取第9990页的10条数据，在把三个shard总共30条数据在排序取前10条。但是事实真是这样的吗？

因为每次搜索的关键词是不同的，所有的score在每个shard中是呈现出完全不一样的分布。可能某个shard的第一条数据的score都比另一个shard上第10000个数据的评分都要低。所以，每个shard取10条数据是完全错误的。

那真正的分页是怎样的呢？

首先每个shard都会将10000条数据给协调节点，协调节点在内存中再排序，拿出我们想要的10条数据，然后在返回给客户端。

综上所述，在实际的应用过程中一般避免分页过深。
