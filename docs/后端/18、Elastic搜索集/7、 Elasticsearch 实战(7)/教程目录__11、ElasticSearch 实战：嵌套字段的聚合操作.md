# 11、ElasticSearch 实战：嵌套字段的聚合操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/11.html
- 分类：搜索引擎
- 分组：教程目录
### 数据库字段

在之前介绍Elasticsearch字段的时候介绍过Elasticsearch的嵌套字段。在日常使用中，针对嵌套类型的聚合操作和普通字段类型有些许的不同。

##### 嵌套类型

- nested

是ES对对象数组设置的类型，它可以对对象数组进行索引。

我们插入一个这样的数据。

```java
{
  "group" : "fans",
  "user" : [ 
    {
      "first" : "John",
      "last" :  "Smith"
    },
    {
      "first" : "Alice",
      "last" :  "White"
    }
  ]
}
```

最后可以得到一个类似这样的结果

```java
{
  "group" :        "fans",
  "user.first" : [ "alice", "john" ],
  "user.last" :  [ "smith", "white" ]
}
```

**数据模拟**

我们现在有一个索引`test_field2`里面存在这样结构的数据

```java
    {
        "name": "内容1",
        "desc": "描述1",
        "channel": [
            {
                "name": "one",
                "num": 28
            },
            {
                "name": "two",
                "num": 32
            }
        ]
    }
```

### 获取嵌套数据的和

**按照普通字段的格式去查询**

按照之前学习的内容依照普通的字段聚合分析的样子我们尝试使用下面的参数来进行求和，**但是显然对于嵌套数据是不行的**。

```java
{
    "aggs": {
        "aggQuery": {
            "sum": {
                "field": "channel.num"
            }
        }
    },
    "size": 0
}
```

使用上面的参数并没有返回数据。

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 0
        }
    }
}
```

**nested方法**

为了方便我们对字段中的嵌套类型进行操作Elasticsearch提供了`nested`方法让我们对嵌套字段实现操作。

使用`nested`需要指定嵌套字段的路径`path`,假如希望对嵌套字段内的内容进行聚合等操作的时候需要指明字段的全部路径。`channel.num`

```java
{
    "query": {
        "match_all": {
            "boost": 1.0
        }
    },
    "aggregations": {
        "test": {
            "nested": {
                "path": "channel"
            },
            "aggregations": {
                "sumChannel": {
                    "sum": {
                        "field": "channel.num"
                    }
                }
            }
        }
    }
}
```

此时我们对嵌套内数据的求和操作，并不是仅仅将一条数据内此字段的数据进行聚合，而是将所有数据中嵌套内的值求和。下面的返回内容中`test`桶中的`sumChannel`的结果就是将两条数据的四个`num`值进行了相加操作。

```java
{
    "took": 133,
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
        "max_score": 1,
        "hits": [
            {
                "_index": "test_field2",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "name": "内容1",
                    "desc": "描述1",
                    "channel": [
                        {
                            "name": "one",
                            "num": 28
                        },
                        {
                            "name": "two",
                            "num": 32
                        }
                    ]
                }
            },
            {
                "_index": "test_field2",
                "_type": "_doc",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "name": "内容1",
                    "desc": "描述1",
                    "channel": [
                        {
                            "name": "one",
                            "num": 33
                        },
                        {
                            "name": "two",
                            "num": 44
                        }
                    ]
                }
            }
        ]
    },
    "aggregations": {
        "test": {
            "doc_count": 4,
            "sumChannel": {
                "value": 137
            }
        }
    }
}
```

**上面操作对应Java的代码**

针对嵌套字段JAVA中主要使用`NestedAggregationBuilder`来进行操作

```java
    public static void queryIndex() throws IOException {
        NestedAggregationBuilder nested = AggregationBuilders.nested("test", "channel");
        nested.subAggregation(AggregationBuilders.sum("sumChannel").field("channel.num"));
        // match all query 查询所有数据
        SearchRequest searchRequest = new SearchRequest();
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        searchSourceBuilder.query(QueryBuilders.matchAllQuery());
        searchSourceBuilder.aggregation(nested);
        searchRequest.source(searchSourceBuilder);
        // 同步执行 RestClientUtils.client 获得ES连接的方法
        SearchResponse searchResponse = RestClientUtils.client.search(searchRequest, RequestOptions.DEFAULT);
        Aggregations aggregations = searchResponse.getAggregations();
    }
```

### 获取嵌套数据不为空的数量

在对某一个字段存在值的数据总数求值的时候，我们只需要count对应的字段既能求出结果。但是对于嵌套字段，假如想当然的使用之前的做法。并不会返回预期的结果。

**尝试使用count嵌套字段获取数量**

```java
{
    "aggs": {
        "aggQuery": {
            "value_count": {
                "field": "channel"
            }
        }
    },
    "size": 0
}
```

```java
{
    "took": 1,
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
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 0
        }
    }
}
```

然而实际上并不能获得正确的结果。即使是一个简单的求值是否存在对于嵌套字段依然要使用

```java
{
	"size":0,
    "query": {
        "match_all": {
            "boost": 1.0
        }
    },
    "aggregations": {
        "test": {
            "nested": {
                "path": "channel"
            },
            "aggregations": {
                "sumChannel": {
                    "value_count": {
                        "field": "channel.num"
                    }
                }
            }
        }
    }
}
```

**需要注意的是我们尝试对嵌套字段某个字段进行count的时候，返回的内容是所有数据在嵌套字段中存在的数量。像下面结果，虽然我们只有两条数据但是存在四条子数据，所以count结果为4。可能有的时候我们希望查出嵌套字段存在值的父级数据的数量，使用这种方法显然不合适。**

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
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "test": {
            "doc_count": 4,
            "sumChannel": {
                "value": 4
            }
        }
    }
}
```

**如何仅仅是想获取存在嵌套值的数据的数量，可以使用下面的方法**

首先使用`must`和`nested`筛选出符合条件的数据,然后通过获取其`hits`命中的数量或者自行使用其他字段进行`count`求值。

```java
{
    "size": 0,
    "query": {
        "bool": {
            "must": [
                {
                    "nested": {
                        "path": "channel",
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "exists": {
                                            "field": "channel.num"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    },
    "aggs": {
        "aggQuery": {
            "value_count": {
                "field": "name"
            }
        }
    }
}
```

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
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 2
        }
    }
}
```
