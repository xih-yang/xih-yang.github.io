# 15、ElasticSearch 实战： ES 聚合计算
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/15.html
- 分类：搜索引擎
- 分组：教程目录
聚合框架用于收集搜索查询选择的所有数据。该框架由许多构建块组成，有助于构建复杂的数据摘要

下面的JSON 对象使用聚合函数的一般请求正文格式

```java
"aggregations" : {
   "<aggregation_name>" : {
      "<aggregation_type>" : {
         <aggregation_body>
      }
      [,"meta" : { [<meta_data_body>] } ]?
      [,"aggregations" : { [<sub_aggregation>]+ } ]?
   }
}
```

Elasticsearch 提供了大量的聚合函数，它们都有各自不同的目的

## 矩阵聚合 ( Metrics )

这些聚合函数可以根据聚合文档的字段值计算度量值，而且有时可以从脚本生成一些值

数字矩阵既可以是单值，也可以是平均聚合或多值统计等

## 平均数聚合 ( avg )

该聚合函数用于计算文档中出现的任何数字字段的平均值

例如

```java
POST http://localhost:9200/user_admin/_search?pretty
```

请求正文

```java
{
   "aggs":{
      "avg_money":{"avg":{"field":"money"}}
   }
}
```

返回响应结果

```java
{
  "took" : 160,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "avg_money" : {
      "value" : 1780321.6666666667
    }
  }
}
```

如果一个或多个聚合文档中不存在此值，默认情况下它们会被忽略

我们可以在聚合中添加缺失字段来设置缺失字段的默认值

```java
{
    "aggs":{
        "avg_money":{
            "avg":{
                "field":"money"
                "missing":0
            }
        }
    }
}
```

## 基数聚合 ( cardinality )

基数聚合 ( cardinality ) 用于计算特定字段的不同值的计数

例如

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "aggs":{
      "distinct_nickname_count":{"cardinality":{"field":"nickname"}}
   }
}
```

响应内容

```java
{
  "error" : {
    "root_cause" : [
      {
        "type" : "illegal_argument_exception",
        "reason" : "Fielddata is disabled on text fields by default. Set fielddata=true on [nickname] in order to load fielddata in memory by uninverting the inverted index. Note that this can however use significant memory. Alternatively use a keyword field instead."
      }
    ],
    "type" : "search_phase_execution_exception",
    "reason" : "all shards failed",
    "phase" : "query",
    "grouped" : true,
    "failed_shards" : [
      {
        "shard" : 0,
        "index" : "user",
        "node" : "4zwAMlTzRCaioBeOE9PaNw",
        "reason" : {
          "type" : "illegal_argument_exception",
          "reason" : "Fielddata is disabled on text fields by default. Set fielddata=true on [nickname] in order to load fielddata in memory by uninverting the inverted index. Note that this can however use significant memory. Alternatively use a keyword field instead."
        }
      }
    ],
    "caused_by" : {
      "type" : "illegal_argument_exception",
      "reason" : "Fielddata is disabled on text fields by default. Set fielddata=true on [nickname] in order to load fielddata in memory by uninverting the inverted index. Note that this can however use significant memory. Alternatively use a keyword field instead.",
      "caused_by" : {
        "type" : "illegal_argument_exception",
        "reason" : "Fielddata is disabled on text fields by default. Set fielddata=true on [nickname] in order to load fielddata in memory by uninverting the inverted index. Note that this can however use significant memory. Alternatively use a keyword field instead."
      }
    }
  },
  "status" : 400
}
```

很明显响应出错了，提示 Fielddata 要单独加载

好吧，那我们先运行下面的请求来修改下

```java
PUT http://localhost:9200/user*/_mapping/user
```

请求正文

```java
{
    "properties": {
        "nickname": { 
            "type":     "text",
            "fielddata": true
        }
    }
}
```

响应内容

```java
{"acknowledged":true}
```

然后重新发起刚刚报错的请求，响应如下

```java
{
  "took" : 186,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 5,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "枫晚",
          "description" : "停车坐爰枫林晚",
          "street" : "苏州大学",
          "city" : "Suzhou",
          "state" : "Jiangsu",
          "zip" : "215006",
          "location" : [
            120.65426,
            31.30797
          ],
          "money" : 10235,
          "tags" : [
            "Java",
            "Android"
          ],
          "vitality" : "3.5"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "question",
          "description" : "问题少年也是少年",
          "street" : "张江高科技园区",
          "city" : "Shanghai",
          "state" : "Shanghai",
          "zip" : "201204",
          "location" : [
            121.60632,
            31.199305
          ],
          "money" : 13648,
          "tags" : [
            "VUE",
            "HTML"
          ],
          "vitality" : "8.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "distinct_nickname_count" : {
      "value" : 9
    }
  }
}
```

## 扩展统计聚合 ( extended_stats )

此聚合用于生成有关聚合文档中特定数字字段的所有统计信息

例如

```java
POST http://localhost:9200/user_admin/user/_search?pretty
```

请求正文

```java
{
   "aggs" : {
      "money_stats" : { "extended_stats" : { "field" : "money" } }
   }
}
```

响应内容

```java
{
  "took" : 12,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "money_stats" : {
      "count" : 3,
      "min" : 68023.0,
      "max" : 5201814.0,
      "avg" : 1780321.6666666667,
      "sum" : 5340965.0,
      "sum_of_squares" : 2.7068555211509E13,
      "variance" : 5.853306500366889E12,
      "std_deviation" : 2419360.762756743,
      "std_deviation_bounds" : {
        "upper" : 6619043.192180153,
        "lower" : -3058399.858846819
      }
    }
  }
}
```

## 最大值聚合 ( max )

最大值聚合用于查找聚合文档中特定数字字段的最大值

例如

```java
POST http://localhost:9200/user*/_search
```

请求正文

```java
{
   "aggs" : {
      "max_money" : { "max" : { "field" : "money" } }
   }
}
```

响应内容

```java
{
  "took" : 22,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "max_money" : {
      "value" : 5201814.0
    }
  }
}
```

## 最小值聚合 ( min )

最小值聚合用于查找聚合文档中特定数字字段的最小值

例如

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "aggs" : {
      "min_money" : { "min" : { "field" : "money" } }
   }
}
```

响应内容

```java
{
  "took" : 20,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 5,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "枫晚",
          "description" : "停车坐爰枫林晚",
          "street" : "苏州大学",
          "city" : "Suzhou",
          "state" : "Jiangsu",
          "zip" : "215006",
          "location" : [
            120.65426,
            31.30797
          ],
          "money" : 10235,
          "tags" : [
            "Java",
            "Android"
          ],
          "vitality" : "3.5"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "question",
          "description" : "问题少年也是少年",
          "street" : "张江高科技园区",
          "city" : "Shanghai",
          "state" : "Shanghai",
          "zip" : "201204",
          "location" : [
            121.60632,
            31.199305
          ],
          "money" : 13648,
          "tags" : [
            "VUE",
            "HTML"
          ],
          "vitality" : "8.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "min_money" : {
      "value" : 10235.0
    }
  }
}
```

## 求和聚合 ( sum )

求和聚合 ( sum ) 用于计算聚合文档中特定数字字段的总和

例如

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
    "aggs" :  {
      "total_money" : { "sum" : { "field" : "money" } }
    }
}
```

返回响应

```java
{
  "took" : 10,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 5,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "枫晚",
          "description" : "停车坐爰枫林晚",
          "street" : "苏州大学",
          "city" : "Suzhou",
          "state" : "Jiangsu",
          "zip" : "215006",
          "location" : [
            120.65426,
            31.30797
          ],
          "money" : 10235,
          "tags" : [
            "Java",
            "Android"
          ],
          "vitality" : "3.5"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "雅少",
          "description" : "虚怀若谷",
          "street" : "四川大学",
          "city" : "Chengdu",
          "state" : "Sichuan",
          "zip" : "610044",
          "location" : [
            104.094537,
            30.640174
          ],
          "money" : 68023,
          "tags" : [
            "Python",
            "HTML"
          ],
          "vitality" : "7.8"
        }
      },
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "question",
          "description" : "问题少年也是少年",
          "street" : "张江高科技园区",
          "city" : "Shanghai",
          "state" : "Shanghai",
          "zip" : "201204",
          "location" : [
            121.60632,
            31.199305
          ],
          "money" : 13648,
          "tags" : [
            "VUE",
            "HTML"
          ],
          "vitality" : "8.8"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "站长",
          "description" : "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
          "street" : "东四十条",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100007",
          "location" : [
            116.432727,
            39.937732
          ],
          "money" : 5201814,
          "tags" : [
            "PHP",
            "Python"
          ],
          "vitality" : "9.0"
        }
      },
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "nickname" : "歌者",
          "description" : "程序设计也是设计，研发新菜也是研发",
          "street" : "五道口",
          "city" : "Beijing",
          "state" : "Beijing",
          "zip" : "100083",
          "location" : [
            116.346346,
            39.999333
          ],
          "money" : 71128,
          "tags" : [
            "Java",
            "Scala"
          ],
          "vitality" : "6.9"
        }
      }
    ]
  },
  "aggregations" : {
    "total_money" : {
      "value" : 5364848.0
    }
  }
}
```

此外，还存在一些其它聚合函数用于计算地理位置，如地理边界聚合和地理质心聚合

## 批量聚合 ( Bucket )

这些聚合包含了许多具有统一标准的不同类型的桶聚合，它们用于确定文档是否应该属于某个桶。

下面我们将会罗列这些桶聚合

### 子聚合

批量聚合会生成一组文档，这些文档将映射到父桶中

参数type 用于定义父索引

例如，假如我们有一个品牌及其不同的模型，然后模型类型将包含以下 _parent 字段

```java
{
   "model" : {
        "_parent" : {
            "type" : "brand"
        }
    }
}
```

还有很多其它的特殊的批量集合，在某些特定的情况下很好用，我们罗列如下

**1、** DateHistogram聚合；

**2、** DateRange聚合；

**3、** Filter聚合；

**4、** Filters聚合；

**5、** GeoDistance聚合；

**6、** GeoHashgrid聚合；

**7、** Global聚合；

**8、** Histogram聚合；

**9、** IPv4Range聚合；

**10、** Missing聚合；

**11、** Nested聚合；

**12、** Range聚合；

**13、** Reversenested聚合；

**14、** Sampler聚合；

**15、** SignificantTerms聚合；

**16、** Terms聚合；

## 聚合元数据

可以在请求时使用 meta 参数添加关于聚合的一些数据，然后就可以在响应时获取到这些数据

```java
POST http://localhost:9200/user*/report/_search?pretty
```

请求正文

```java
{
    "aggs" : {
        "min_money" : {
            "avg" : { "field" : "money" } ,
            "meta" :{"dsc" :"Lowest Moneys"}
        }
    }
}
```

响应内容

```java
{
  "took" : 30,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 0,
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "min_money" : {
      "meta" : {
        "dsc" : "Lowest Moneys"
      },
      "value" : null
    }
  }
}
```
