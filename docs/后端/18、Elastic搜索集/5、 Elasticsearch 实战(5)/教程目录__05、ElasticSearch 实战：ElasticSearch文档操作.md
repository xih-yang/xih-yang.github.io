# 05、ElasticSearch 实战：ElasticSearch文档操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/5.html
- 分类：搜索引擎
- 分组：教程目录
## Elasticsearch文档操作

### 创建文档

索引已经创建好之后就可以继续创建文档，并添加数据。 这里的文档可以类比为关系型数据库中的表数据，添加的数据格式为`JSON`格式。

在`Postman`中，向ES服务器发`POST`请求： [http://127.0.0.1:9200/shopping/_doc](http://127.0.0.1:9200/shopping/_doc)

请求体内容为：

```java
{
 "title":"水星家纺 60S长绒棉贡缎床上四件套 酒店高档纯棉床单被套枕套 被罩被单1.8米床乔伊斯玫瑰(海蓝色/抗菌)",
 "category":"床上用品",
"image":"https://www.shuixing.com/pc/images/2022/logo_02.png",
 "price": 899.0
}
```

`Postman`的执行效果

响应内容：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "6m6EooAB7B_-m9JH0tpA",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 0,
    "_primary_term": 1
}
```

返回的结果里面包含了`_id`字段也就是该文档的唯一标识。这个`id`也是可以自定义的。

#### 自主产生id方式

在某些场景下我们可能需要去自主产生维护id信息， 这样的情况下主要创建文档的URL要有变化，就是在url后面要加上id信息。例如[http://127.0.0.1:9200/shopping/_doc/1001](http://127.0.0.1:9200/shopping/_doc/1001)

同样使用`POST`请求

这个时候响应体里面的id就是固定的`1001`了。

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 1,
    "_primary_term": 1
}
```

#### 附言

其实创建文档的地址也可以是`http://127.0.0.1:9200/shopping/_create/1002`.也就是`_create`和`_doc`都是可行的。
