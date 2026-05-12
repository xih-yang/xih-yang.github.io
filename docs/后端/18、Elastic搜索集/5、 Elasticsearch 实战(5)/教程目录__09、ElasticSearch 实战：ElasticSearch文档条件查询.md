# 09、ElasticSearch 实战：ElasticSearch文档条件查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/9.html
- 分类：搜索引擎
- 分组：教程目录
## 文档条件查询

在前面我们讲过对文档的查询，但是仅用了`id`和`全查`的方式, 这样的查询在实践中往往不能够满足多样化的检索需求。根据条件检索是非常必须的。条件查询的URL地址格式为`http://127.0.0.1:9200/shopping/_search/q=查询条件`.

例如我们希望直接查询品类为`床上用品`的所有数据. URL地址为:[http://127.0.0.1:9200/shopping/_search?q=category:床上用品](http://127.0.0.1:9200/shopping/_search?q=category:%E5%BA%8A%E4%B8%8A%E7%94%A8%E5%93%81). 查询的请求方式为`GET`。发起请求如下图:

响应结果：

```java
{
    "took": 25,
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
        "max_score": 0.72928625,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 0.72928625,
                "_source": {
                    "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
                    "category": "床上用品",
                    "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
                    "price": 169.0
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1002",
                "_score": 0.72928625,
                "_source": {
                    "title": "水星家纺 60S长绒棉贡缎床上四件套 酒店高档纯棉床单被套枕套 被罩被单1.8米床乔伊斯玫瑰(海蓝色/抗菌)",
                    "category": "床上用品",
                    "image": "https://www.shuixing.com/pc/images/2022/logo_02.png",
                    "price": 899.0
                }
            }
        ]
    }
}
```

上面的操作很类似关系型数据库根据字段，然后模糊查询的结果，其实用`http://127.0.0.1:9200/shopping/_search?q=category:床`也能面中上面的数据。

### 通过请求体传参

上面的例子可以看出，在url地址中发送请求条件格式过于复杂，而且还存在在url地址中传入中文等字符，这样的操作很容易出现乱码等问题导致查询出错。所以我们可以考虑使用请求体传参的方式来规避这些问题，ES的条件查询也是支持这样的操作的。

URL地址就比较固定了，URL地址为:`http://127.0.0.1:9200/shopping/_search`

请求的`body`结构如下：

```java
{
    "query":{
        "match": {
            "category":"床上用品"
        }
    }
}
```

查询条件的最外层为`query`, 匹配条件的字段为`match`， `match`下是一个对象，可以天上响应的字段内容信息。

响应的内容是：

```java
{
    "took": 2,
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
        "max_score": 0.72928625,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 0.72928625,
                "_source": {
                    "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
                    "category": "床上用品",
                    "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
                    "price": 169.0
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1002",
                "_score": 0.72928625,
                "_source": {
                    "title": "水星家纺 60S长绒棉贡缎床上四件套 酒店高档纯棉床单被套枕套 被罩被单1.8米床乔伊斯玫瑰(海蓝色/抗菌)",
                    "category": "床上用品",
                    "image": "https://www.shuixing.com/pc/images/2022/logo_02.png",
                    "price": 899.0
                }
            }
        ]
    }
}
```

和上面`GET`请求的条件相同，结果相同。
