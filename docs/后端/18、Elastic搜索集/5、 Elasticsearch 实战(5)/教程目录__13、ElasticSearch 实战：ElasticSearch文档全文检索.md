# 13、ElasticSearch 实战：ElasticSearch文档全文检索
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/13.html
- 分类：搜索引擎
- 分组：教程目录
## 文档全文检索

在上面的操作中如果我们将查询的其实里面底层的操作是采用全文检索的方式实现的，下面我们可以一个测试。我们也查`category`字段，目前在我们的文档库中包含两个`category` ， 一个是`床上用品`，另一个是`3c数码`。那我们就查询`category=床上数码`。这样的话，如果是传统的关系型数据库应该是无法查询到结果的。

那我们的请求体内容就应该是：

```java
{
    "query":{
        "match": {
            "category":"床上数码"
        }
    }
}
```

查询操作

返回内容：

```java
{
    "took": 3,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 3,
            "relation": "eq"
        },
        "max_score": 2.1192915,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1003",
                "_score": 2.1192915,
                "_source": {
                    "title": "华为手机",
                    "category": "3C数码",
                    "image": "https://img10.360buyimg.com/n7/jfs/t1/111175/35/24913/81730/625ed1a5Ed8f452a3/d0370cd4e6837908.jpg",
                    "price": 1699.0
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 0.90630186,
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
                "_score": 0.90630186,
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

从上面可以看出，查询出了3条结果，其中包含了`category`为`3C数码`和`床上用品`两大类的数据。 从现象来看，其实我们的查询条件也被做了全文检索的分词处理，执行查询的操作上把分词后的结果再到倒排索引中去做一次匹配检索得出最后的匹配结果，这就是全文检索的效果了。

### 完全匹配（match_phrase）

如果我们不期望使用全文检索，而是直接完全匹配我们要查询的字段的话，可以使用`完全匹配`。 也就是不能使用`match`字段，而改用`match_phrase`。那把检索的内容体改为：

```java
{
    "query":{
        "match_phrase": {
            "category":"床上数码"
        }
    }
}
```

执行结果

这个时候`ES`中没有`category`为`床上数码`的文档了，所以我们检索不到数据。那如果我们把`category`改为`床上`啦？是否可以像关系型数据库那样做一个`like`模糊查询啦？

```java
{
    "query":{
        "match_phrase": {
            "category":"床上"
        }
    }
}
```

执行结果

从执行结果上看已经查询出了相应结果。那说明这里的完全匹配只是不对我们的查询条件做分词处理。在后端查询的时候其实和关系型数据库的`like '%床上%'`的效果是一致的。

### 高亮查询highlight

如果我们查询的结果期望像百度谷歌那样，对匹配的关键字进行高亮显示的话，可以使用查询条件中的`higlight`条件。

查询体：

```java
{
    "query": {
        "match": {
            "category": "床上数码"
        }
    },
    "highlight": {
        "fields": {
            "category": {
            }
        }
    }
}
```

响应内容：

```java
{
    "took": 161,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 3,
            "relation": "eq"
        },
        "max_score": 2.1192915,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1003",
                "_score": 2.1192915,
                "_source": {
                    "title": "华为手机",
                    "category": "3C数码",
                    "image": "https://img10.360buyimg.com/n7/jfs/t1/111175/35/24913/81730/625ed1a5Ed8f452a3/d0370cd4e6837908.jpg",
                    "price": 1699.0
                },
                "highlight": {
                    "category": [
                        "3C<em>数</em><em>码</em>"
                    ]
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 0.90630186,
                "_source": {
                    "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
                    "category": "床上用品",
                    "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
                    "price": 169.0
                },
                "highlight": {
                    "category": [
                        "<em>床</em><em>上</em>用品"
                    ]
                }
            },
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1002",
                "_score": 0.90630186,
                "_source": {
                    "title": "水星家纺 60S长绒棉贡缎床上四件套 酒店高档纯棉床单被套枕套 被罩被单1.8米床乔伊斯玫瑰(海蓝色/抗菌)",
                    "category": "床上用品",
                    "image": "https://www.shuixing.com/pc/images/2022/logo_02.png",
                    "price": 899.0
                },
                "highlight": {
                    "category": [
                        "<em>床</em><em>上</em>用品"
                    ]
                }
            }
        ]
    }
}
```

从上可以看出，查询的响应内容上多出了一个`highlight`字段。并且在该字段中将匹配的关键词加入了`em`标签。
