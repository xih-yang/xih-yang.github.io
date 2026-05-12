# 20、ElasticSearch 7.3 实战：采用restful风格查询详解
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/20.html
- 分类：搜索引擎
- 分组：教程目录
## 1、Query DSL入门

### 1.1 DSL

DSL:Domain Specified Language，特定领域的语言。es特有的搜索语言，可在请求体中携带搜索条件，功能强大。

查询全部

```java
GET /book/_search
{
  "query": { "match_all": {} }
}
```

排序

```java
GET /book/_search 
{
    "query" : {
        "match" : {
            "name" : " java"
        }
    },
    "sort": [
        { "price": "desc" }
    ]
}
```

分页查询

```java
GET  /book/_search 
{
  "query": { "match_all": {} },
  "from": 0,
  "size": 1
}
```

指定返回字段

```java
GET /book/_search 
{
  "query": { "match_all": {} },
  "_source": ["name", "studymodel"]
}
```

通过组合以上各种类型查询，实现复杂查询。

### 1.2 Query DSL语法

```java
{
    QUERY_NAME: {
        ARGUMENT: VALUE,
        ARGUMENT: VALUE,...
    }
}
```

```java
{
    QUERY_NAME: {
        FIELD_NAME: {
            ARGUMENT: VALUE,
            ARGUMENT: VALUE,...
        }
    }
}
```

```java
GET /test_index/_search 
{
  "query": {
    "match": {
      "test_field": "test"
    }
  }
}
```

### 1.3 组合多个搜索条件

搜索需求：

```java
title字段必须包含elasticsearch，content可以包含elasticsearch也可以不包含，author_id必须不为111
```

初始数据：

```java
POST /website/_doc/1
{
  "title": "my hadoop article",
  "content": "hadoop is very bad",
  "author_id": 111
}
POST /website/_doc/2
{
  "title": "my elasticsearch  article",
  "content": "es is very bad",
  "author_id": 112
}
POST /website/_doc/3
{
  "title": "my elasticsearch article",
  "content": "es is very goods",
  "author_id": 111
}
```

搜索：

```java
GET /website/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "elasticsearch"
          }
        }
      ],
      "should": [
        {
          "match": {
            "content": "elasticsearch"
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "author_id": 111
          }
        }
      ]
    }
  }
}
```

返回：

```java
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.47000363,
    "hits" : [
      {
        "_index" : "website",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.47000363,
        "_source" : {
          "title" : "my elasticsearch  article",
          "content" : "es is very bad",
          "author_id" : 112
        }
      }
    ]
  }
}
```

再次查询一个更复杂的搜索需求，例如如下sql语句，采用ElasticSearch来实现。

```java
select * from test_index where name='tom' or (hired =true and (personality ='good' and rude != true ))
```

ES语句如下：

```java
GET /test_index/_search
{
    "query": {
            "bool": {
                "must": { "match":{ "name": "tom" }},
                "should": [
                    { "match":{ "hired": true }},
                    { "bool": {
                        "must":{ "match": { "personality": "good" }},
                        "must_not": { "match": { "rude": true }}
                    }}
                ],
                "minimum_should_match": 1
            }
    }
}
```

## 2、full-text search 全文检索

### 2.1 全文检索

首先创建book索引

```java
PUT /book/
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "description": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "studymodel": {
        "type": "keyword"
      },
      "price": {
        "type": "double"
      },
      "timestamp": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
      },
      "pic": {
        "type": "text",
        "index": false
      }
    }
  }
}
```

插入数据

```java
PUT /book/_doc/1
{
  "name": "Bootstrap开发",
  "description": "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
  "studymodel": "201002",
  "price": 38.6,
  "timestamp": "2019-08-25 19:11:35",
  "pic": "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
  "tags": [
    "bootstrap",
    "dev"
  ]
}
PUT /book/_doc/2
{
  "name": "java编程思想",
  "description": "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
  "studymodel": "201001",
  "price": 68.6,
  "timestamp": "2019-08-25 19:11:35",
  "pic": "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
  "tags": [
    "java",
    "dev"
  ]
}
PUT /book/_doc/3
{
  "name": "spring开发基础",
  "description": "spring 在java领域非常流行，java程序员都在用。",
  "studymodel": "201001",
  "price": 88.6,
  "timestamp": "2019-08-24 19:11:35",
  "pic": "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
  "tags": [
    "spring",
    "java"
  ]
}
```

先简单的搜索一下，搜索description中包含java程序员的数据

```java
GET /book/_search
{
  "query": {
    "match": {
      "description": "java程序员"
    }
  }
}
```

结果如下

```java
{
  "took" : 257,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 2.137549,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 2.137549,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.57961315,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      }
    ]
  }
}
```

### 2.2 _score简单介绍

对于上面的搜索结果来进行一个简单的结果分析

**1、** 建立索引时,description字段term倒排索引；

关键词
文档

java
2，3

程序员
3

**2、** 搜索时，直接找description中含有java的文档2,3，并且3号文档含有两个java字段，一个程序员，所以得分高，排在前面2号文档含有一个java，排在后面；

这里只是简单的介绍一下`_score`这个字段的作用，更详细的后续会介绍。

## 3、DSL 语法练习

### 3.1 match_all

```java
GET /book/_search
{
    "query": {
        "match_all": {}
    }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "name" : "Bootstrap开发",
          "description" : "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
          "studymodel" : "201002",
          "price" : 38.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "bootstrap",
            "dev"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      }
    ]
  }
}
```

### 3.2 match

```java
GET /book/_search
{
    "query": { 
        "match": { 
            "description": "java程序员"
        }
    }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 2.137549,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 2.137549,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.57961315,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      }
    ]
  }
}
```

### 3.3 multi_match

```java
GET /book/_search
{
  "query": {
    "multi_match": {
      "query": "java程序员",
      "fields": [
        "name"
      ]
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.9331132,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.9331132,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      }
    ]
  }
}
```

### 3.4 range query 范围查询

gt大于 gte 大于等于

```java
GET /book/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 80,
        "lte": 90
      }
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      }
    ]
  }
}
```

### 3.5 term query

字段为keyword时，存储和搜索都不分词

```java
GET /book/_search
{
  "query": {
    "term": {
      "description": "java程序员"
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

### 3.6 terms query

```java
GET /book/_search
{
  "query": {
    "terms": {
      "tag": [
        "search",
        "full_text",
        "nosql"
      ]
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

### 3.7 exist query 查询有某些字段值的文档

```java
GET /book/_search
{
    "query": {
        "exists": {
            "field": "join_date"
        }
    }
}
```

### 结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

### 3.8 Fuzzy query 模糊查询

返回包含与搜索词类似的词的文档，该词由Levenshtein编辑距离度量。

包括以下几种情况：

- 更改角色（box→fox）
- 删除字符（aple→apple）
- 插入字符（sick→sic）
- 调换两个相邻字符（ACT→CAT）

```java
GET /book/_search
{
  "query": {
    "fuzzy": {
      "description": {
        "value": "jave"
      }
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 78,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 0.59524715,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.59524715,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.43470988,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      }
    ]
  }
}
```

### 3.9 IDs

查询id

```java
GET /book/_search
{
  "query": {
    "ids": {
      "values" : ["1", "4", "100"]
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "name" : "Bootstrap开发",
          "description" : "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
          "studymodel" : "201002",
          "price" : 38.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "bootstrap",
            "dev"
          ]
        }
      }
    ]
  }
}
```

### 3.10 prefix 前缀查询

```java
GET /book/_search
{
  "query": {
    "prefix": {
      "description": {
        "value": "spring"
      }
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      }
    ]
  }
}
```

### 3.11 regexp query 正则查询

以j开头，以a结尾 .*一个或多个

```java
GET /book/_search
{
  "query": {
    "regexp": {
      "description": {
        "value": "j.*a",
        "flags": "ALL",
        "max_determinized_states": 10000,
        "rewrite": "constant_score"
      }
    }
  }
}
```

结果：

查看代码

```java
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "name" : "java编程思想",
          "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
          "studymodel" : "201001",
          "price" : 68.6,
          "timestamp" : "2019-08-25 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "java",
            "dev"
          ]
        }
      },
      {
        "_index" : "book",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "name" : "spring开发基础",
          "description" : "spring 在java领域非常流行，java程序员都在用。",
          "studymodel" : "201001",
          "price" : 88.6,
          "timestamp" : "2019-08-24 19:11:35",
          "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
          "tags" : [
            "spring",
            "java"
          ]
        }
      }
    ]
  }
}
```

##
