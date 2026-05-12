# 18、ElasticSearch 实战： ES 查询描述语言
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/18.html
- 分类：搜索引擎
- 分组：教程目录
Elasticsearch 使用基于 JSON 数据格式的查询来执行搜索

查询由两个子句组成:

**1、****叶子查询短语**；

```java
这种短语包括 **匹配** ( matching ) 、词 ( term ) 或范围 ( range )，用于在特定的字段中查找特定的值
```

**2、****复合查询短语**；

```java
这种查询短语由 **叶子查询短语** 和其它复合查询短语组成，用于提取所需要的数据
```

Elasticsearch 支持数量庞大的各种不同类型的查询

这些查询以 query 开始，然后使用 JSON 对象包含条件和过滤器

本章接下来的内容将学习和介绍各种不同类型的查询

## 匹配所有的查询

这是最基本的查询，它会返回所有的内容，其中的每个对象的得分都是 1.0

这种查询的请求正文一般为

```java
{
   "query":{
      "match_all":{}
   }
}
```

例如下面的请求用于查询 user* 索引中的所有数据

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "match_all":{}
   }
}
```

响应内容

```java
{
    "took": 21,
    "timed_out": false,
    "_shards": {
        "total": 10,
        "successful": 10,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": 5,
        "max_score": 1,
        "hits": [
            {
                "_index": "user",
                "_type": "user",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "nickname": "枫晚",
                    "description": "停车坐爰枫林晚",
                    "street": "苏州大学",
                    "city": "Suzhou",
                    "state": "Jiangsu",
                    "zip": "215006",
                    "location": [
                        120.65426,
                        31.30797
                    ],
                    "money": 10235,
                    "tags": [
                        "Java",
                        "Android"
                    ],
                    "vitality": "3.5"
                }
            },
            {
                "_index": "user_admin",
                "_type": "user",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "nickname": "雅少",
                    "description": "虚怀若谷",
                    "street": "四川大学",
                    "city": "Chengdu",
                    "state": "Sichuan",
                    "zip": "610044",
                    "location": [
                        104.094537,
                        30.640174
                    ],
                    "money": 68023,
                    "tags": [
                        "Python",
                        "HTML"
                    ],
                    "vitality": "7.8"
                }
            },
            {
                "_index": "user",
                "_type": "user",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "nickname": "question",
                    "description": "问题少年也是少年",
                    "street": "张江高科技园区",
                    "city": "Shanghai",
                    "state": "Shanghai",
                    "zip": "201204",
                    "location": [
                        121.60632,
                        31.199305
                    ],
                    "money": 13648,
                    "tags": [
                        "VUE",
                        "HTML"
                    ],
                    "vitality": "8.8"
                }
            },
            {
                "_index": "user_admin",
                "_type": "user",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "nickname": "站长",
                    "description": "DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ",
                    "street": "东四十条",
                    "city": "Beijing",
                    "state": "Beijing",
                    "zip": "100007",
                    "location": [
                        116.432727,
                        39.937732
                    ],
                    "money": 5201814,
                    "tags": [
                        "PHP",
                        "Python"
                    ],
                    "vitality": "9.0"
                }
            },
            {
                "_index": "user_admin",
                "_type": "user",
                "_id": "3",
                "_score": 1,
                "_source": {
                    "nickname": "歌者",
                    "description": "程序设计也是设计，研发新菜也是研发",
                    "street": "五道口",
                    "city": "Beijing",
                    "state": "Beijing",
                    "zip": "100083",
                    "location": [
                        116.346346,
                        39.999333
                    ],
                    "money": 71128,
                    "tags": [
                        "Java",
                        "Scala"
                    ],
                    "vitality": "6.9"
                }
            }
        ]
    }
}
```

## 全文检索查询

这些查询会搜索整个文本，如章节或新闻文章

这种查询会用到与指定的索引或文档相关联的分析器，由分析器对内容进行分析

接下来，我们就看看 Elasticsearch 支持哪些全文检索查询

### 匹配查询

这种查询将文本或短语与一个或多个字段的值进行匹配，返回匹配成功的文档

例如下面的查询请求用于查询所有城市为 pune 的学校

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "match" : {
         "city":"Chengdu"
      }
   }
}
```

响应内容

```java
{
  "took" : 15,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "2",
        "_score" : 0.2876821,
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
      }
    ]
  }
}
```

### 多字段匹配查询

这种查询会将文本或短语与多个字段进行匹配

例如下面的请求，将在 city 和 state 字段上查找匹配 shanghai 的内容

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "multi_match" : {
         "query": "shanghai",
         "fields": [ "city", "state" ]
      }
   }
}
```

返回响应

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
    "total" : 1,
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "1",
        "_score" : 0.2876821,
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
      }
    ]
  }
}
```

## 查询字符串查询

这种查询会使用 query_string 来指定要查询的关键字，然后用查询分析器来分析查询关键字

例如下面的查询请求将返回包含 语 和 枫 的查询结果

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "query_string":{
         "query":"语 枫"
      }
   }
}
```

返回响应

```java
{
  "took" : 111,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 2,
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "user",
        "_type" : "user",
        "_id" : "2",
        "_score" : 0.2876821,
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
        "_id" : "1",
        "_score" : 0.2876821,
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
      }
    ]
  }
}
```

## 术语级别查询

这种查询主要用于查询结构化的数据，比如数字、日期和枚举 ( emuns )

例如下面的查询返回所有 zip 为 100007 的数据

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "term":{"zip":"100007"}
   }
}
```

响应内容

```java
{
  "took" : 23,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "user_admin",
        "_type" : "user",
        "_id" : "1",
        "_score" : 0.2876821,
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
      }
    ]
  }
}
```

### 范围查询

这种查询主要用于查询那些值处于某个范围区间的对象

为此，我们还需要使用下面的关键字

关键字
说明

gte
大于等于

gt
大于

lte
小于等于

lt
小于

例如下面的查询用于返回那些 vitality 在 5.5 以上的文档

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "range":{
         "vitality":{
            "gte":5.5
         }
      }
   }
}
```

响应内容

```java
{
  "took" : 71,
  "timed_out" : false,
  "_shards" : {
    "total" : 10,
    "successful" : 10,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 4,
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
  }
}
```

还存在一些其它类型的术语级别查询，我们就不一一介绍了，先罗列在此

查询
说明

存在查询
返回某个字段不为 null 的对象

缺失查询
与存在查询相反，这种查询用于搜索不存在某个字段或即使存在其值也为 null 的对象

通配符或正则查询
使用正则表达式来匹配某个字段的值是否符合某个模式的对象

## 类型查询

用于查询那些符合某个类型的文档

例如下面的查询请求用于查询符合 user 类型的文档

```java
POST http://localhost:9200/user*/_search
```

请求正文

```java
{
   "query":{
      "type" : {
         "value" : "user"
      }
   }
}
```

响应内容

返回的响应一定是 user 索引索引中的全部 JSON 对象文档

## 复合查询

这种查询使用布尔运算符( 例如 and 、or 和 not ) 运算符来组合不同的索引或函数调用返回的不同的查询的结果

例如下面的复合查询

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
      "filtered":{
         "query":{
            "match":{
               "state":"UP"
            }
         },
         "filter":{
            "range":{
               "rating":{
                  "gte":4.0
               }
            }
         }
      }
   }
}
```

响应正文

```java
{
   "took":16, "timed_out":false, "_shards":{"total":10, "successful":10, "failed":0},
   "hits":{"total":0, "max_score":null, "hits":[]}
}
```

## 连接查询

这种查询用于包含多个映射或文档的情况

有两种类型的连接查询

**1、** 嵌套查询；

```java
这种查询一般用于处理嵌套映射的情况，我们会在下一章节详细介绍
```

**2、****has_child**和**has_parent**查询；

```java
这种查询用于检索文档的子文档或父文档，以找出匹配查询的对象
例如下面这个查询请求
```

```java
    POST http://localhost:9200/tutorials/_search
```

```java
请求正文
```

```java
    {
       "query":
       {
          "has_child" : {
             "type" : "article", "query" : {
                "match" : {
                   "Text" : "This is article 1 of chapter 1"
                }
             }
          }
       }
    }
```

```java
返回响应内容
```

```java
    {
       "took":21, "timed_out":false, "_shards":{"total":5, "successful":5, "failed":0},
       "hits":{
          "total":1, "max_score":1.0, "hits":[{
             "_index":"tutorials", "_type":"chapter", "_id":"1", "_score":1.0,
             "_source":{
                "Text":"this is chapter one"
             }
          }]
       }
    }
```

## 地理信息查询

这种查询可以处理地理位置信息和地理点

一般用于找出学校或任何地点附近的任何其它地理对象

对于这种查询，我们需要使用地理点数据类型

例如下面的查询

```java
POST http://localhost:9200/user*/_search?pretty
```

请求正文

```java
{
   "query":{
        "bool": {
            "filter":{
                "geo_distance":{
                    "distance":"100km",
                    "location":[116.4448,39.943042]
                }
            }
        }
    }
}
```

响应正文

```java
{
  "error" : {
    "root_cause" : [
      {
        "type" : "query_shard_exception",
        "reason" : "field [location] is not a geo_point field",
        "index_uuid" : "VYLD0ybxRLeVB_KsJ8ZjDw",
        "index" : "user"
      },
      {
        "type" : "query_shard_exception",
        "reason" : "field [location] is not a geo_point field",
        "index_uuid" : "_acBr-_YSCiaHImp1VObGg",
        "index" : "user_admin"
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
          "type" : "query_shard_exception",
          "reason" : "field [location] is not a geo_point field",
          "index_uuid" : "VYLD0ybxRLeVB_KsJ8ZjDw",
          "index" : "user"
        }
      },
      {
        "shard" : 0,
        "index" : "user_admin",
        "node" : "4zwAMlTzRCaioBeOE9PaNw",
        "reason" : {
          "type" : "query_shard_exception",
          "reason" : "field [location] is not a geo_point field",
          "index_uuid" : "_acBr-_YSCiaHImp1VObGg",
          "index" : "user_admin"
        }
      }
    ]
  },
  "status" : 400
}
```

如果你在运行上面的范例时抛出了异常，那么可以运行下面的请求为索引添加映射

```java
{
   "mappings":{
      "user":{
         "properties":{
            "location":{
               "type":"geo_point"
            }
         }
      }
   }
}
```
