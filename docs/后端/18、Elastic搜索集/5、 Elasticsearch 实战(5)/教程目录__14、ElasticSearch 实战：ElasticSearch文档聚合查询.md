# 14、ElasticSearch 实战：ElasticSearch文档聚合查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/14.html
- 分类：搜索引擎
- 分组：教程目录
## 聚合查询

对查询的结果进行统计，分组等操作的时候就需要用的聚合操作， 聚合操作需要用到聚合操作对应的参数。参数字段名叫：`aggs`。

### 分组统计(terms)

```java
{
    "aggs": {
      // 聚合操作
        "category_group":{
      // 名称，随意取名
            "terms":{
                "field":"price"
            }
        }
    }
}
```

返回内容

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
            "value": 3,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "shopping",
                "_type": "_doc",
                "_id": "1001",
                "_score": 1.0,
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
                "_id": "1003",
                "_score": 1.0,
                "_source": {
                    "title": "华为手机",
                    "category": "3C数码",
                    "image": "https://img10.360buyimg.com/n7/jfs/t1/111175/35/24913/81730/625ed1a5Ed8f452a3/d0370cd4e6837908.jpg",
                    "price": 1699.0
                }
            }
        ]
    },
    "aggregations": {
        "category_group": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": 169.0,
                    "doc_count": 1
                },
                {
                    "key": 899.0,
                    "doc_count": 1
                },
                {
                    "key": 1699.0,
                    "doc_count": 1
                }
            ]
        }
    }
}
```

从返回结果中还包含了元素的数据信息。如果要取消原数据的获取，那再添加一个`size`参数即可。

```java
{
    "aggs": {
      // 聚合操作
        "category_group":{
      // 名称，随意取名
            "terms":{
                "field":"price"
            }
        }
    },
    "size":0 // 表示取得原数据0条，这个也是分页查询的内容。
}
```

这时返回的数据就是：

```java
{
    "took": 6,
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
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "category_group": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": 169.0,
                    "doc_count": 1
                },
                {
                    "key": 899.0,
                    "doc_count": 1
                },
                {
                    "key": 1699.0,
                    "doc_count": 1
                }
            ]
        }
    }
}
```

### 取平均值（avg）

获取价格的平均值，请求体

```java
{
    "aggs": {
      // 聚合操作
        "category_group":{
      // 名称，随意取名
            "avg":{
                "field":"price"
            }
        }
    },
    "size":0 // 表示取得原数据0条，这个也是分页查询的内容。
}
```

响应内容

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
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "category_group": {
            "value": 922.3333333333334
        }
    }
}
```
