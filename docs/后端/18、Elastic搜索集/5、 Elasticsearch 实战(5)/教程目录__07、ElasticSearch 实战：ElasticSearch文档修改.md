# 07、ElasticSearch 实战：ElasticSearch文档修改
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/7.html
- 分类：搜索引擎
- 分组：教程目录
## 文档修改

当文档数据被创建之后如果想对文档进行修改，这样的操作在ES中是被允许的。但是在`ES`中修改是分为两种情况的，

**1、** 一种是完全覆盖式的修改，也叫全量修改；

**2、** 另外一种是局部性的修改；

### 全量修改

全量修改的情况下，无论发送多少次请求，数据都是会被完全覆盖的。所以这样的操作其实是幂等性的。所以可以采用`PUT`进行操作. 地址跟主键查询和自定义主键修改是类似的。URL：[http://127.0.0.1:9002/shopping/_doc/1001](http://127.0.0.1:9002/shopping/_doc/1001),其中`_doc`表示文档数据。`1001`就是文档主键。`http`请求的body体就是我们准备修改后的内容。比如下面我们准备修改一下价格：

```java
{
 "title":"水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
 "category":"床上用品",
"image":"https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
 "price": 189.0
}
```

价格从`139.0`修改到`189.0`,准备涨价了。

发送请求

返回修改成功内容：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 2,
    "result": "updated",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 2,
    "_primary_term": 1
}
```

执行结果中主要内容

**1、**`result`修改结果为`updated`，即修改成功；

**2、**`_version`:版本，修改了一次加了1，变为了2.；

再次查询得到结果：

响应内容：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 5,
    "_seq_no": 5,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
        "category": "床上用品",
        "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
        "price": 189.0
    }
}
```

从响应结果上我们可以查看到文档的内容发生变化，价格已经变为了`189.0`了。

以上就是全量更新的操作， 这种操作其实在实践中往往用得较少，因为我们要改局部内容的可能性更高。接下来讲局部更新操作。

### 局部更新

由于我们是局部修改，所以我们每次修改的结果不会是相同的。既然结果是不相同的，所以这个操作就不是幂等性的。不能采用`PUT`，要使用`POST`。URL地址和全量更新也不相同,URL：[http://127.0.0.1:9002/shopping/_update/1001](http://127.0.0.1:9002/shopping/_update/1001). `http`请求的`body`也有固定的格式。比如我们又讲价格从`189.0`降价到`169.0`,`body`体如下：

```java
{
    "doc":{
        "price": 169.0
    }
}
```

发送操作如下:

响应结果:

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 6,
    "result": "updated",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 6,
    "_primary_term": 1
}
```

这个时候响应结果`result`为`update`。

如果我们修改的内容与库中内容完全一致，如下响应的`result`为`noop`

响应结果:

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 5,
    "result": "noop",
    "_shards": {
        "total": 0,
        "successful": 0,
        "failed": 0
    },
    "_seq_no": 5,
    "_primary_term": 1
}
```

响应的`result`为`noop`.

完成局部修改操作之后我们再次查询一下该文档内容确实是否被修改成功.

响应结果:

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 6,
    "_seq_no": 6,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
        "category": "床上用品",
        "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
        "price": 169.0
    }
}
```

从查询的响应结果可以看出，确实已经被修改成功了。
