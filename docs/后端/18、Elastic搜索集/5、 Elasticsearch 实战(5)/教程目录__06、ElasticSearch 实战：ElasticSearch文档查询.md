# 06、ElasticSearch 实战：ElasticSearch文档查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/6.html
- 分类：搜索引擎
- 分组：教程目录
## 文档查询

## 主键查询

从前面的操作来看，其实可以很好的猜想根据主键查询的url地址一个和主键添加文档的URL地址一样，只是请求的方法得使用`GET`请求。例如查询`1001`的文档，URL地址：[http://127.0.0.1:9200/shopping/_doc/1001](http://127.0.0.1:9200/shopping/_doc/1001)

返回的结果为：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "1001",
    "_version": 1,
    "_seq_no": 1,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
        "category": "床上用品",
        "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
        "price": 139.0
    }
}
```

如果我们给出的`id`是不存在的，例如：[http://127.0.0.1:9200/shopping/_doc/2001](http://127.0.0.1:9200/shopping/_doc/2001)

返回内容就会变为：

```java
{
    "_index": "shopping",
    "_type": "_doc",
    "_id": "2001",
    "found": false
}
```

### 全查询

全查询就是查询所有的文档信息：

请求的url地址：[http://127.0.0.1:9200/shopping/_search/1001](http://127.0.0.1:9200/shopping/_doc/1001)

响应结果：

```java
{
    "took": 35,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "6m6EooAB7B_-m9JH0tpA",
                "_score": 1.0,
                "_source": {
                    "title": "水星家纺 60S长绒棉贡缎床上四件套 酒店高档纯棉床单被套枕套 被罩被单1.8米床乔伊斯玫瑰(海蓝色/抗菌)",
                    "category": "床上用品",
                    "image": "https://www.shuixing.com/pc/images/2022/logo_02.png",
                    "price": 899.0
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 1.0,
                "_source": {
                    "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
                    "category": "床上用品",
                    "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
                    "price": 139.0
                }
            }
        ]
    }
}
```

响应内容里面会包含了是否超时`time_out` ， 命中:`hits`这个里面就是我们查询出来的内容数据了。
