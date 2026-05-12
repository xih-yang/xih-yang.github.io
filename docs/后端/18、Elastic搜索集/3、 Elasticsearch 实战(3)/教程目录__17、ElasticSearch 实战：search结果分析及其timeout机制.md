# 17、ElasticSearch 实战：search结果分析及其timeout机制
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/17.html
- 分类：搜索引擎
- 分组：教程目录
### 1、搜索结果分析

```java
GET /_search
```

took：整个搜索请求花费了1毫秒

hits.total：本次搜索，返回了1条结果

hits.max_score：本次搜索的所有结果中，最大的相关度分数是多少

hits.hits：默认查询前10条数据，完整数据，按_score降序排序

shards：这次查询路由到的primary shard和replica shard

timeout：默认无timeout，可以手动指定timeout，走timeout查询执行机制

### 2、_search的timeout机制

有些搜索应用对时间是很敏感的，比如说我们的电商网站，你不能说让用户等10分钟，才能等到一次搜索请求的结果，如果那样的话人家早走了，不来买东西了。

而timeout机制，就是指定每个shard只能在timeout时间范围内将搜索到的部分数据(也可能全都搜索到了)直接返回给client，而不是等所有的数据全部搜索出来以后再返回。

比如，有2个shard，每个shard要搜索出来1000条数据需要1分钟，此时我们指定timeout=10ms，每个shard运行到10ms的时候可能就搜索出10条，那么这个请求本来应该在1分钟后总共拿到2000条数据，但是指定timeout后，就会在10ms拿到20条数据返回给客户端。

这样就可以确保一次搜索请求可以在指定的timeout时长内完成。为一些时间敏感的搜索应用提供良好的支持。

timeout的语法：

```java
GET /_search?timeout=10m
```

timeout的单位：ms(毫秒),s(秒),m(分钟)
