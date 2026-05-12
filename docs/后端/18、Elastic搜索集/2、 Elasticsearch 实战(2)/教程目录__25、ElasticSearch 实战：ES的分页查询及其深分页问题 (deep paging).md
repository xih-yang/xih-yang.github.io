# 25、ElasticSearch 实战：ES的分页查询及其深分页问题 (deep paging)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/25.html
- 分类：搜索引擎
- 分组：教程目录
## 1 分页查询方法

- 在GET请求中拼接from和size参数

```java
// 查询10条数据, 默认从第0条数据开始
GET book_shop/_search?size=10
// 从第0条数据开始(包括第0条), 查询10条数据
GET book_shop/_search?from=0&size=10
// 从第5条数据开始(包括第5条), 查询10条数据
GET book_shop/_search?from=5&size=10
```

## 2 分页查询的deep paging问题

deep paging, 就是深层分页搜索:

> 分页搜索的深度越深, 协调节点(负责分发查询、汇总结果的ES节点)上要存储的数据就越多, 协调节点对这些数据整体排序后, 再取对应页的数据.

**这个过程既耗费网络资源, 也耗费内存和CPU资源.**

**应该尽可能避免deep paging操作. —— 方法类似于Solr的游标, 后续补充.**
