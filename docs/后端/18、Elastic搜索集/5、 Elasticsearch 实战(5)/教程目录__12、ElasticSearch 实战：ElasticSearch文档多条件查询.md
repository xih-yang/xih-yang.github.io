# 12、ElasticSearch 实战：ElasticSearch文档多条件查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/12.html
- 分类：搜索引擎
- 分组：教程目录
## 多条件查询

### 同时满足must

查询的body体的查询不能在使用`match`关键字了，而需要使用，`bool`然后要多个条件同时成立，接下来要填入`must`，多个条件用数组。body样例如下：

```java
{
    "query":{
        "bool": {
            "must":[
                {
                    "match":{
                        "category":"床上用品"
                    }
                }
            ]
        }
    }
}
```

以上看起来就相当于是单条件要一样的效果。然后我们再加一个条件。如下：

```java
{
    "query":{
        "bool": {
            "must":[
                {
                    "match":{
                        "category":"床上用品"
                    }
                },
                {
                    "match":{
                        "price":169.0
                    }
                }
            ]
        }
    }
}
```

返回结果:

```java
{
    "took": 17,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 1.7292862,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 1.7292862,
                "_source": {
                    "title": "水星家纺被子夏季空调被 夏凉被夏天被子双人夏被被芯学生宿舍被子200*230cm",
                    "category": "床上用品",
                    "image": "https://img11.360buyimg.com/n7/jfs/t1/191056/14/24248/144443/62767f75E23ccafc4/5110691845cfa4cf.jpg",
                    "price": 169.0
                }
            }
        ]
    }
}
```

返回结果就同时满足了`"category":"床上用品"`和`"price":169.0`。

### 部分满足should

部分满足类似于sql语句中的`or`.

比如我们要查`category`为`床上用品`和`3C数码`的.

```java
{
    "query":{
        "bool": {
            "should":[
                {
                    "match":{
                        "category":"床上用品"
                    }
                },
                {
                    "match":{
                        "category":"3C数码"
                    }
                }
            ]
        }
    }
}
```

操作如下

#### 范围条件filter

比如我期望查询的是价格在500以上的产品。

查询内容体：

```java
{
    "query":{
        "bool": {
            "should":[
                {
                    "match":{
                        "category":"床上用品"
                    }
                },
                {
                    "match":{
                        "category":"3C数码"
                    }
                }
            ],
            "filter":{
                "range":{
                    "price":{
                        "gt":500
                    }
                }
            }
        }
    }
}
```

操作结果

响应内容：

```java
{
    "took": 5,
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
        "max_score": 3.1789374,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1003",
                "_score": 3.1789374,
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
                "_id": "1002",
                "_score": 1.8126037,
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

响应的条件只有2条了，过滤掉了价格低与500的。
