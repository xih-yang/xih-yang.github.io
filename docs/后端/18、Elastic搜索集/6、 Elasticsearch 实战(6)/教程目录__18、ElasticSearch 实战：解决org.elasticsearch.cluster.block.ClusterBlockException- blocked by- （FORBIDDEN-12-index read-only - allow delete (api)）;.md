# 18、ElasticSearch 实战：解决org.elasticsearch.cluster.block.ClusterBlockException: blocked by: [FORBIDDEN-12-index read-only - allow delete (api)];
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/18.html
- 分类：搜索引擎
- 分组：教程目录
ES部署一段时间后，今天发布内容发现后台报错

```java
2020-09-16 03:02:33.530 ERROR 9 --- [nio-9080-exec-8] o.a.c.c.C.[.[.[.[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [/kbserver] threw exception [Request processing failed; nested exception is ClusterBlockException[blocked by: [FORBIDDEN/12/index read-only / allow delete (api)];]] with root cause
org.elasticsearch.cluster.block.ClusterBlockException: blocked by: [FORBIDDEN/12/index read-only / allow delete (api)];
at org.elasticsearch.cluster.block.ClusterBlocks.indexBlockedException(ClusterBlocks.java:208)
at org.elasticsearch.action.support.replication.TransportReplicationAction.blockExceptions(TransportReplicationAction.java:255)
at org.elasticsearch.action.support.replication.TransportReplicationAction.access$500(TransportReplicationAction.java:100)
at org.elasticsearch.action.support.replication.TransportReplicationAction$ReroutePhase.doRun(TransportReplicationAction.java:788)
at org.elasticsearch.common.util.concurrent.AbstractRunnable.run(AbstractRunnable.java:37)
at org.elasticsearch.action.support.replication.TransportReplicationAction.doExecute(TransportReplicationAction.java:172)
at org.elasticsearch.action.support.replication.TransportReplicationAction.doExecute(TransportReplicationAction.java:100)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:167)
at org.elasticsearch.xpack.security.action.filter.SecurityActionFilter.apply(SecurityActionFilter.java:121)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:165)
at org.elasticsearch.action.support.TransportAction.execute(TransportAction.java:139)
at org.elasticsearch.action.support.TransportAction.execute(TransportAction.java:81)
at org.elasticsearch.action.bulk.TransportBulkAction$BulkOperation.doRun(TransportBulkAction.java:440)
at org.elasticsearch.common.util.concurrent.AbstractRunnable.run(AbstractRunnable.java:37)
at org.elasticsearch.action.bulk.TransportBulkAction.executeBulk(TransportBulkAction.java:553)
at org.elasticsearch.action.bulk.TransportBulkAction.doExecute(TransportBulkAction.java:256)
at org.elasticsearch.action.bulk.TransportBulkAction.doExecute(TransportBulkAction.java:92)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:167)
at org.elasticsearch.xpack.security.action.filter.SecurityActionFilter.apply(SecurityActionFilter.java:121)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:165)
at org.elasticsearch.action.support.TransportAction.execute(TransportAction.java:139)
at org.elasticsearch.action.bulk.TransportSingleItemBulkWriteAction.doExecute(TransportSingleItemBulkWriteAction.java:69)
at org.elasticsearch.action.bulk.TransportSingleItemBulkWriteAction.doExecute(TransportSingleItemBulkWriteAction.java:44)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:167)
at org.elasticsearch.xpack.security.action.filter.SecurityActionFilter.apply(SecurityActionFilter.java:121)
at org.elasticsearch.action.support.TransportAction$RequestFilterChain.proceed(TransportAction.java:165)
at org.elasticsearch.action.support.TransportAction.execute(TransportAction.java:139)
```

再网上搜索都是ES集群部署会出现这个问题，这边单机部署，不知道为什么会有这个问题。

按照Eleastisearch 官方文档给的解决办法是：

```java
An example of resetting the read-only index block on the twitter index:
PUT /twitter/_settings
{
“index.blocks.read_only_allow_delete”: null
}
```

经研究学习，在Elasticsearch所部署的机器上，执行以下命令，可解决此问题：

```java
curl -XPUT -H "Content-Type: application/json" http://127.0.0.1:9200/_all/_settings -d '{"index.blocks.read_only_allow_delete": null}'
```

其中_all 这个可以更改为自己在创建 Eleastisearch 索引的时候的name，用来修改单个索引只读状态，当然用 _all 也可以, _all 是修改了所有的索引只读状态。
