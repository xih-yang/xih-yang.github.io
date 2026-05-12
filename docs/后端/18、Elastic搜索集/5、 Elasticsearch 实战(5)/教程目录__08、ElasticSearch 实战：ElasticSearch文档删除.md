# 08、ElasticSearch 实战：ElasticSearch文档删除
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/8.html
- 分类：搜索引擎
- 分组：教程目录
## 文档删除

文档创建之后删除也是我们对数据管理的一些常规操作。与前面的操作类似，删除操作是，`http`请求的方式需要使用`delete`操作.资源地址是一样的。比如我们要删除`id`为`6m6EooAB7B_-m9JH0tpA`的文档,URL地址为：[http://127.0.0.1:9200/shopping/doc/6m6EooAB7B-m9JH0tpA](http://127.0.0.1:9200/shopping/_doc/6m6EooAB7B_-m9JH0tpA)

响应内容：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "6m6EooAB7B_-m9JH0tpA",
    "_version": 2,
    "result": "deleted",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 7,
    "_primary_term": 1
}
```

响应内容的result可以看出为`deleted`，也就是被删除成功了。

如果我们再点击一次继续删除。响应结果如下:

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "6m6EooAB7B_-m9JH0tpA",
    "_version": 1,
    "result": "not_found",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 8,
    "_primary_term": 1
}
```

`result`的值为`not_found`也就是没有找到该文档。
