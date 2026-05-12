# 04、ElasticSearch 实战：ElasticSearch索引操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/4.html
- 分类：搜索引擎
- 分组：教程目录
## Elasticsearch索引操作

ES对外暴露了RESTfulAPI，所以可以通过http方式发起对Elasticsearch的操作，我采用的是`Postman`这个HTTP客户端工具进行的。

### 创建索引

对比关系型数据库，创建索引就等同于创建数据库。在`Postman`中向`ES`服务器发送`PUT`请求请求地址：`http://127.0.0.1:9200/shopping`. 其中`http://127.0.0.1:9200/`是ES的地址，而后面的`shopping`就是要创建的索引`index`。

响应的内容

```java
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "shopping"
}
```

这个时候表示index `shopping` 已经创建成功了。由于该接口具有幂等性，所以如果再次发送会有问题，做同样的操作是不允许的。会返回错误提示信息如下：

```java
{
    "error": {
        "root_cause": [
            {
                "type": "resource_already_exists_exception",
                "reason": "index [shopping/UV5c0QcKQjOXpMmxgRY5RQ] already exists",
                "index_uuid": "UV5c0QcKQjOXpMmxgRY5RQ",
                "index": "shopping"
            }
        ],
        "type": "resource_already_exists_exception",
        "reason": "index [shopping/UV5c0QcKQjOXpMmxgRY5RQ] already exists",
        "index_uuid": "UV5c0QcKQjOXpMmxgRY5RQ",
        "index": "shopping"
    },
    "status": 400
}
```

整体而言是提示你该索引已经存在了，不能在继续了。

### 查询索引

#### 查询指定索引

刚才已经创建索引成功了，如果我们希望能进一步查看索引的信息的话只需要使用`GET`请求即可。同样使用`Postman`发送请求。请求url地址:`http://127.0.0.1:9200/shopping`

响应结果：

```java
{
    "shopping": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1651983547613",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "UV5c0QcKQjOXpMmxgRY5RQ",
                "version": {
                    "created": "7080099"
                },
                "provided_name": "shopping"
            }
        }
    }
}
```

##### 查询所有索引

请求url地址:`http://127.0.0.1:9200/_cat/indices?v`

返回是一个表格格式的。

#### 删除索引

删除索引发送`delete`类型的请求。请求地址一样：`http://127.0.0.1:9200/shopping`

删除成功响应内容：

```java
{
    "acknowledged": true
}
```
