# 16、ElasticSearch 实战： ES 索引 API
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/16.html
- 分类：搜索引擎
- 分组：教程目录
本章节我们要介绍的这些 API 用于管理索引的所有方面的内容，如设置，别名，映射，索引模板

## 创建索引

这个API 可以用来创建索引

当用户将 JSON 对象传递给任何索引时，可以自动创建索引

当然，也可以不传递任何数据，而是使用默认设置创建一个索引

要创建索引，只需要发送带有设置，映射和别名的 HTTP POST 请求，或者只是一个没有正文的简单请求

例如下面的请求使用默认设置创建一个索引

```java
PUT http://localhost:9200/colleges?pretty
```

返回响应

```java
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "colleges"
}
```

或者发起请求的时候可以传递一个设置

```java
PUT http://localhost:9200/colleges2?pretty
```

请求正文

```java
{
    "settings" : {
        "index" : {
            "number_of_shards" : 5, "number_of_replicas" : 3
        }
    }
}
```

返回响应

```java
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "colleges2"
}
```

传递的配置中还可以携带映射数据

```java
PUT http://localhost:9200/colleges3?pretty
```

请求正文

```java
{
    "settings" : {
        "number_of_shards" : 3
    },
   "mappings" : {
        "type1" : {
            "_source" : { "enabled" : false }, 
            "properties" : {
                "college_name" : { "type" : "string" }, 
                "college_type" : {"type":"string"}
            }
        }
    }
}
```

返回响应

```java
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "colleges3"
}
```

或创建索引时同时创建别名

```java
PUT http://localhost:9200/colleges4?pretty
```

请求正文

```java
{
    "aliases" : {
        "alias_1" : {}, 
        "alias_2" : {
            "filter" : {
                "term" : {"user" : "manu" }
            },
            "routing" : "manu"
        }
    }
}
```

返回响应

```java
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "colleges4"
}
```

## 删除索引

发起一个 HTTP DELETE 请求就可以删除某个索引，语法如下

```java
DELETE http://localhost:9200/<index_name>
```

`` 为想要删除的索引名，例如要删除 colleges4 索引，可以这样

```java
DELETE http://localhost:9200/colleges4
```

如果想要删除所有的索引，可以使用 _all 关键字，如下

```java
DELETE http://localhost:9200/_all
```

## 获取一个索引

发起一个 HTTP GET 请求就可以获取某个索引

### 语法如下

```java
GET http://localhost:9200/<index_name>
```

`` 为想要获取的索引名，例如要获取 user_admin 索引，可以这样

```java
GET http://localhost:9200/user_admin
```

返回响应内容

```java
{
  "user_admin" : {
    "aliases" : { },
    "mappings" : {
      "user" : {
        "properties" : {
          "city" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "description" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "interests" : {
            "type" : "text",
            "fielddata" : true
          },
          "location" : {
            "type" : "float"
          },
          "money" : {
            "type" : "long"
          },
          "nickname" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            },
            "fielddata" : true
          },
          "state" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "street" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "tags" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "vitality" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "zip" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          }
        }
      }
    },
    "settings" : {
      "index" : {
        "creation_date" : "1530187334876",
        "number_of_shards" : "5",
        "number_of_replicas" : "1",
        "uuid" : "_acBr-_YSCiaHImp1VObGg",
        "version" : {
          "created" : "6030099"
        },
        "provided_name" : "user_admin"
      }
    }
  }
}
```

如果想要获取多个所以，可以使用逗号分隔想要获取的多个索引名，如下

```java
GET http://localhost:9200/user,user_admin
```

如果想要获取所有的索引，可以使用 _all 关键字或星号 ( * )，如下

```java
GET http://localhost:9200/_all
```

或

```java
GET http://localhost:9200/*
```

## 判断索引是否存在

判断所以是否存在的方法很简单，只要想那个所以发起一个请求即可，如果返回的响应状态码是 200 则说明存在，如果返回的状态码为 404 则说明不存在

## 打开或关闭索引

打开或关闭一个索引的方法很简单，只要发起一个 HTTP POST 请求并在 URL 中添加 _close 或 _open 路径参数即可

例如下面的请求用于关闭索引 python

```java
POST http://localhost:9200/python/_close
```

而打开索引 python 则可以这样

```java
POST http://localhost:9200/python/_open
```

## 请求别名

发起一个 HTTP POST 请求并在 URL 中添加 _aliases 路径参数即可为任何索引创建一个别名

单个别名可以映射到多个，但是别名不能和索引名一样

例如

```java
POST http://localhost:9200/_aliases?pretty
```

请求正文

```java
{
   "actions" : [
      { "add" : { "index" : "user", "alias" : "user_nor" } }
   ]
}
```

响应内容

```java
{
    "acknowledged": true
}
```

创建了别名后我们就可以使用别名来获取索引

```java
GET http://localhost:9200/user_nor?pretty
```

返回内容

```java
{
    "user": {
        "aliases": {
            "user_nor": {}
        },
        "mappings": {
            "user": {
                "properties": {
                    "city": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "description": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "interests": {
                        "type": "text",
                        "fielddata": true
                    },
                    "location": {
                        "type": "float"
                    },
                    "money": {
                        "type": "long"
                    },
                    "nickname": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        },
                        "fielddata": true
                    },
                    "state": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "street": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "tags": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "vitality": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    },
                    "zip": {
                        "type": "text",
                        "fields": {
                            "keyword": {
                                "type": "keyword",
                                "ignore_above": 256
                            }
                        }
                    }
                }
            }
        },
        "settings": {
            "index": {
                "creation_date": "1530189785122",
                "number_of_shards": "5",
                "number_of_replicas": "1",
                "uuid": "VYLD0ybxRLeVB_KsJ8ZjDw",
                "version": {
                    "created": "6030099"
                },
                "provided_name": "user"
            }
        }
    }
}
```

## 索引设置

通过发送一个 HTTP GET 请求并向 URL 中添加 _settings 路径参数来获取某个索引的设置

```java
GET http://localhost:9200/schools/_settings?pretty
```

返回响应

```java
{
   "schools":{
      "settings":{
         "index":{
            "creation_date":"1454409831535", "number_of_shards":"5", 
            "number_of_replicas":"1", "uuid":"iKdjTtXQSMCW4xZMhpsOVA", 
            "version":{"created":"2010199"}
        }
      }
   }
}
```

## 分析

可以通过向 /_analyze 发起一个 HTTP POST 请求并传递需要分析的文本和分析器类型来分析一段文本

```java
POST http://localhost:9200/_analyze
```

请求正文

```java
{
   "analyzer" : "standard",
   "text" : "you are reading this at tutorials point"
}
```

返回响应

```java
{
   "tokens":[
      {"token":"you", "start_offset":0, "end_offset":3, "type":"<ALPHANUM>", "position":0},
      {"token":"are", "start_offset":4, "end_offset":7, "type":"<ALPHANUM>", "position":1},
      {"token":"reading", "start_offset":8, "end_offset":15, "type":"<ALPHANUM>", "position":2},
      {"token":"this", "start_offset":16, "end_offset":20, "type":"<ALPHANUM>", "position":3},
      {"token":"at", "start_offset":21, "end_offset":23, "type":"<ALPHANUM>", "position":4},
      {"token":"tutorials", "start_offset":24, "end_offset":33, "type":"<ALPHANUM>", "position":5},
      {"token":"point", "start_offset":34, "end_offset":39, "type":"<ALPHANUM>", "position":6}
   ]
}
```

我们也可以通过使用索引来分析文本，Elasticsearch 会使用索引相关联的分析器来分析文本

## 索引模板

我们可以使用映射来创建一个索引模板，然后可以将该索引模版用于新的索引中

例如

```java
POST http://localhost:9200/_template/template_a?pretty
```

请求正文

```java
{
    "template" : "tu*", 
      "settings" : {
         "number_of_shards" : 3
    },
    "mappings" : {
      "chapter" : {
         "_source" : { "enabled" : false }
      }
    }
}
```

这样，任何以 tu 开头的索引都会默认使用 template_a 模板相同的设置

## 索引统计

可以向某个索引发起一个 HTTP GET 请求并在 URL 中添加 _stats 路径参数来获取某个索引的统计信息

例如

```java
GET http://localhost:9200/user/_stats?pretty
```

返回响应

```java
{
    "_shards": {
        "total": 10,
        "successful": 5,
        "failed": 0
    },
    "_all": {
        "primaries": {
            "docs": {
                "count": 2,
                "deleted": 0
            },
            "store": {
                "size_in_bytes": 18005
            },
            "indexing": {
                "index_total": 0,
                "index_time_in_millis": 0,
                "index_current": 0,
                "index_failed": 0,
                "delete_total": 0,
                "delete_time_in_millis": 0,
                "delete_current": 0,
                "noop_update_total": 0,
                "is_throttled": false,
                "throttle_time_in_millis": 0
            },
            "get": {
                "total": 1,
                "time_in_millis": 9,
                "exists_total": 1,
                "exists_time_in_millis": 9,
                "missing_total": 0,
                "missing_time_in_millis": 0,
                "current": 0
            },
            "search": {
                "open_contexts": 0,
                "query_total": 55,
                "query_time_in_millis": 434,
                "query_current": 0,
                "fetch_total": 8,
                "fetch_time_in_millis": 6,
                "fetch_current": 0,
                "scroll_total": 0,
                "scroll_time_in_millis": 0,
                "scroll_current": 0,
                "suggest_total": 0,
                "suggest_time_in_millis": 0,
                "suggest_current": 0
            },
            "merges": {
                "current": 0,
                "current_docs": 0,
                "current_size_in_bytes": 0,
                "total": 0,
                "total_time_in_millis": 0,
                "total_docs": 0,
                "total_size_in_bytes": 0,
                "total_stopped_time_in_millis": 0,
                "total_throttled_time_in_millis": 0,
                "total_auto_throttle_in_bytes": 104857600
            },
            "refresh": {
                "total": 15,
                "total_time_in_millis": 0,
                "listeners": 0
            },
            "flush": {
                "total": 5,
                "periodic": 0,
                "total_time_in_millis": 11
            },
            "warmer": {
                "current": 0,
                "total": 5,
                "total_time_in_millis": 0
            },
            "query_cache": {
                "memory_size_in_bytes": 0,
                "total_count": 0,
                "hit_count": 0,
                "miss_count": 0,
                "cache_size": 0,
                "cache_count": 0,
                "evictions": 0
            },
            "fielddata": {
                "memory_size_in_bytes": 756,
                "evictions": 0
            },
            "completion": {
                "size_in_bytes": 0
            },
            "segments": {
                "count": 2,
                "memory_in_bytes": 10114,
                "terms_memory_in_bytes": 7778,
                "stored_fields_memory_in_bytes": 624,
                "term_vectors_memory_in_bytes": 0,
                "norms_memory_in_bytes": 1024,
                "points_memory_in_bytes": 8,
                "doc_values_memory_in_bytes": 680,
                "index_writer_memory_in_bytes": 0,
                "version_map_memory_in_bytes": 0,
                "fixed_bit_set_memory_in_bytes": 0,
                "max_unsafe_auto_id_timestamp": -1,
                "file_sizes": {}
            },
            "translog": {
                "operations": 2,
                "size_in_bytes": 1502,
                "uncommitted_operations": 0,
                "uncommitted_size_in_bytes": 550,
                "earliest_last_modified_age": 0
            },
            "request_cache": {
                "memory_size_in_bytes": 0,
                "evictions": 0,
                "hit_count": 0,
                "miss_count": 0
            },
            "recovery": {
                "current_as_source": 0,
                "current_as_target": 0,
                "throttle_time_in_millis": 0
            }
        },
        "total": {
            "docs": {
                "count": 2,
                "deleted": 0
            },
            "store": {
                "size_in_bytes": 18005
            },
            "indexing": {
                "index_total": 0,
                "index_time_in_millis": 0,
                "index_current": 0,
                "index_failed": 0,
                "delete_total": 0,
                "delete_time_in_millis": 0,
                "delete_current": 0,
                "noop_update_total": 0,
                "is_throttled": false,
                "throttle_time_in_millis": 0
            },
            "get": {
                "total": 1,
                "time_in_millis": 9,
                "exists_total": 1,
                "exists_time_in_millis": 9,
                "missing_total": 0,
                "missing_time_in_millis": 0,
                "current": 0
            },
            "search": {
                "open_contexts": 0,
                "query_total": 55,
                "query_time_in_millis": 434,
                "query_current": 0,
                "fetch_total": 8,
                "fetch_time_in_millis": 6,
                "fetch_current": 0,
                "scroll_total": 0,
                "scroll_time_in_millis": 0,
                "scroll_current": 0,
                "suggest_total": 0,
                "suggest_time_in_millis": 0,
                "suggest_current": 0
            },
            "merges": {
                "current": 0,
                "current_docs": 0,
                "current_size_in_bytes": 0,
                "total": 0,
                "total_time_in_millis": 0,
                "total_docs": 0,
                "total_size_in_bytes": 0,
                "total_stopped_time_in_millis": 0,
                "total_throttled_time_in_millis": 0,
                "total_auto_throttle_in_bytes": 104857600
            },
            "refresh": {
                "total": 15,
                "total_time_in_millis": 0,
                "listeners": 0
            },
            "flush": {
                "total": 5,
                "periodic": 0,
                "total_time_in_millis": 11
            },
            "warmer": {
                "current": 0,
                "total": 5,
                "total_time_in_millis": 0
            },
            "query_cache": {
                "memory_size_in_bytes": 0,
                "total_count": 0,
                "hit_count": 0,
                "miss_count": 0,
                "cache_size": 0,
                "cache_count": 0,
                "evictions": 0
            },
            "fielddata": {
                "memory_size_in_bytes": 756,
                "evictions": 0
            },
            "completion": {
                "size_in_bytes": 0
            },
            "segments": {
                "count": 2,
                "memory_in_bytes": 10114,
                "terms_memory_in_bytes": 7778,
                "stored_fields_memory_in_bytes": 624,
                "term_vectors_memory_in_bytes": 0,
                "norms_memory_in_bytes": 1024,
                "points_memory_in_bytes": 8,
                "doc_values_memory_in_bytes": 680,
                "index_writer_memory_in_bytes": 0,
                "version_map_memory_in_bytes": 0,
                "fixed_bit_set_memory_in_bytes": 0,
                "max_unsafe_auto_id_timestamp": -1,
                "file_sizes": {}
            },
            "translog": {
                "operations": 2,
                "size_in_bytes": 1502,
                "uncommitted_operations": 0,
                "uncommitted_size_in_bytes": 550,
                "earliest_last_modified_age": 0
            },
            "request_cache": {
                "memory_size_in_bytes": 0,
                "evictions": 0,
                "hit_count": 0,
                "miss_count": 0
            },
            "recovery": {
                "current_as_source": 0,
                "current_as_target": 0,
                "throttle_time_in_millis": 0
            }
        }
    },
    "indices": {
        "user": {
            "primaries": {
                "docs": {
                    "count": 2,
                    "deleted": 0
                },
                "store": {
                    "size_in_bytes": 18005
                },
                "indexing": {
                    "index_total": 0,
                    "index_time_in_millis": 0,
                    "index_current": 0,
                    "index_failed": 0,
                    "delete_total": 0,
                    "delete_time_in_millis": 0,
                    "delete_current": 0,
                    "noop_update_total": 0,
                    "is_throttled": false,
                    "throttle_time_in_millis": 0
                },
                "get": {
                    "total": 1,
                    "time_in_millis": 9,
                    "exists_total": 1,
                    "exists_time_in_millis": 9,
                    "missing_total": 0,
                    "missing_time_in_millis": 0,
                    "current": 0
                },
                "search": {
                    "open_contexts": 0,
                    "query_total": 55,
                    "query_time_in_millis": 434,
                    "query_current": 0,
                    "fetch_total": 8,
                    "fetch_time_in_millis": 6,
                    "fetch_current": 0,
                    "scroll_total": 0,
                    "scroll_time_in_millis": 0,
                    "scroll_current": 0,
                    "suggest_total": 0,
                    "suggest_time_in_millis": 0,
                    "suggest_current": 0
                },
                "merges": {
                    "current": 0,
                    "current_docs": 0,
                    "current_size_in_bytes": 0,
                    "total": 0,
                    "total_time_in_millis": 0,
                    "total_docs": 0,
                    "total_size_in_bytes": 0,
                    "total_stopped_time_in_millis": 0,
                    "total_throttled_time_in_millis": 0,
                    "total_auto_throttle_in_bytes": 104857600
                },
                "refresh": {
                    "total": 15,
                    "total_time_in_millis": 0,
                    "listeners": 0
                },
                "flush": {
                    "total": 5,
                    "periodic": 0,
                    "total_time_in_millis": 11
                },
                "warmer": {
                    "current": 0,
                    "total": 5,
                    "total_time_in_millis": 0
                },
                "query_cache": {
                    "memory_size_in_bytes": 0,
                    "total_count": 0,
                    "hit_count": 0,
                    "miss_count": 0,
                    "cache_size": 0,
                    "cache_count": 0,
                    "evictions": 0
                },
                "fielddata": {
                    "memory_size_in_bytes": 756,
                    "evictions": 0
                },
                "completion": {
                    "size_in_bytes": 0
                },
                "segments": {
                    "count": 2,
                    "memory_in_bytes": 10114,
                    "terms_memory_in_bytes": 7778,
                    "stored_fields_memory_in_bytes": 624,
                    "term_vectors_memory_in_bytes": 0,
                    "norms_memory_in_bytes": 1024,
                    "points_memory_in_bytes": 8,
                    "doc_values_memory_in_bytes": 680,
                    "index_writer_memory_in_bytes": 0,
                    "version_map_memory_in_bytes": 0,
                    "fixed_bit_set_memory_in_bytes": 0,
                    "max_unsafe_auto_id_timestamp": -1,
                    "file_sizes": {}
                },
                "translog": {
                    "operations": 2,
                    "size_in_bytes": 1502,
                    "uncommitted_operations": 0,
                    "uncommitted_size_in_bytes": 550,
                    "earliest_last_modified_age": 0
                },
                "request_cache": {
                    "memory_size_in_bytes": 0,
                    "evictions": 0,
                    "hit_count": 0,
                    "miss_count": 0
                },
                "recovery": {
                    "current_as_source": 0,
                    "current_as_target": 0,
                    "throttle_time_in_millis": 0
                }
            },
            "total": {
                "docs": {
                    "count": 2,
                    "deleted": 0
                },
                "store": {
                    "size_in_bytes": 18005
                },
                "indexing": {
                    "index_total": 0,
                    "index_time_in_millis": 0,
                    "index_current": 0,
                    "index_failed": 0,
                    "delete_total": 0,
                    "delete_time_in_millis": 0,
                    "delete_current": 0,
                    "noop_update_total": 0,
                    "is_throttled": false,
                    "throttle_time_in_millis": 0
                },
                "get": {
                    "total": 1,
                    "time_in_millis": 9,
                    "exists_total": 1,
                    "exists_time_in_millis": 9,
                    "missing_total": 0,
                    "missing_time_in_millis": 0,
                    "current": 0
                },
                "search": {
                    "open_contexts": 0,
                    "query_total": 55,
                    "query_time_in_millis": 434,
                    "query_current": 0,
                    "fetch_total": 8,
                    "fetch_time_in_millis": 6,
                    "fetch_current": 0,
                    "scroll_total": 0,
                    "scroll_time_in_millis": 0,
                    "scroll_current": 0,
                    "suggest_total": 0,
                    "suggest_time_in_millis": 0,
                    "suggest_current": 0
                },
                "merges": {
                    "current": 0,
                    "current_docs": 0,
                    "current_size_in_bytes": 0,
                    "total": 0,
                    "total_time_in_millis": 0,
                    "total_docs": 0,
                    "total_size_in_bytes": 0,
                    "total_stopped_time_in_millis": 0,
                    "total_throttled_time_in_millis": 0,
                    "total_auto_throttle_in_bytes": 104857600
                },
                "refresh": {
                    "total": 15,
                    "total_time_in_millis": 0,
                    "listeners": 0
                },
                "flush": {
                    "total": 5,
                    "periodic": 0,
                    "total_time_in_millis": 11
                },
                "warmer": {
                    "current": 0,
                    "total": 5,
                    "total_time_in_millis": 0
                },
                "query_cache": {
                    "memory_size_in_bytes": 0,
                    "total_count": 0,
                    "hit_count": 0,
                    "miss_count": 0,
                    "cache_size": 0,
                    "cache_count": 0,
                    "evictions": 0
                },
                "fielddata": {
                    "memory_size_in_bytes": 756,
                    "evictions": 0
                },
                "completion": {
                    "size_in_bytes": 0
                },
                "segments": {
                    "count": 2,
                    "memory_in_bytes": 10114,
                    "terms_memory_in_bytes": 7778,
                    "stored_fields_memory_in_bytes": 624,
                    "term_vectors_memory_in_bytes": 0,
                    "norms_memory_in_bytes": 1024,
                    "points_memory_in_bytes": 8,
                    "doc_values_memory_in_bytes": 680,
                    "index_writer_memory_in_bytes": 0,
                    "version_map_memory_in_bytes": 0,
                    "fixed_bit_set_memory_in_bytes": 0,
                    "max_unsafe_auto_id_timestamp": -1,
                    "file_sizes": {}
                },
                "translog": {
                    "operations": 2,
                    "size_in_bytes": 1502,
                    "uncommitted_operations": 0,
                    "uncommitted_size_in_bytes": 550,
                    "earliest_last_modified_age": 0
                },
                "request_cache": {
                    "memory_size_in_bytes": 0,
                    "evictions": 0,
                    "hit_count": 0,
                    "miss_count": 0
                },
                "recovery": {
                    "current_as_source": 0,
                    "current_as_target": 0,
                    "throttle_time_in_millis": 0
                }
            }
        }
    }
}
```

## 刷新索引缓冲区

刷新索引缓冲区指的是清除索引内存中的数据并将其迁移到索引存储，并清除内部事务日志

刷新索引缓冲区的方法很简单，只要向一个索引发起一个 HTTP GET 请求并在 URL 中添加 _flush 路径参数即可

例如

```java
GET http://localhost:9200/user/_flush?pretty
```

返回响应

```java
{
    "_shards": {
        "total": 10,
        "successful": 5,
        "failed": 0
    }
}
```

## 刷新索引

Elasticsearch 默认内置了刷新机制

当然我们也可以手动显式刷新索引

方法就是向一个索引发起一个 HTTP GET 请求并在 URL 中添加 _refresh 路径参数即可

例如

```java
GET http://localhost:9200/user/_refresh?pretty
```

返回内容

```java
{
    "_shards": {
        "total": 10,
        "successful": 5,
        "failed": 0
    }
}
```
