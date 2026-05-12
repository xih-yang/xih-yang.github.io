# 17、ElasticSearch 实战：摄取节点 - 管道（pipeline）介绍
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/17.html
- 分类：搜索引擎
- 分组：教程目录
## 摄取节点的作用

之前在介绍ES集群的时候，曾经介绍过集群中存在一个摄取节点，在数据保存到文档索引之前，我们可能需要对文档进行预处理，而摄取节点会拦截这些请求，根据需要将文档中的内容进行处理然后传递会索引或者API中。

### 摄取节点的配置

默认配置下所有节点都启用了ingest。因此任何一个ES节点都可以处理ingest任务。就像之前ES集群中描述的，我们可以创建一个专门处理相关业务的ingest节点。

控制节点的ingest开关在其`elasticsearch.yml`中的参数

```java
## 关闭ingest
node.ingest: false
```

### 节点和管道

摄取节点节点对数据的处理主要是通过管道（pipeline），在索引和请求中指定管道参数，这样ingest节点在拦截请求后就指定使用哪条管道进行处理。

## 管道的操作

### 创建管道

我们可以使用`_ingest/pipeline`API来创建管道，我们现在创建一个对`des`设置默认值的管道

```java
PUT _ingest/pipeline/test_pipeline
{
  "description" : "这是测试的管道内容",
  "processors" : [
    {
      "set" : {
        "field": "des",
        "value": "这是管道默认数据"
      }
    }
  ]
}
```

### 为管道设置版本号

这里需要注意，根据官方文档的介绍，此版本号没有实际作用，仅仅方便使用者根据其业务环境进行外部的版本管理

```java
PUT _ingest/pipeline/test_pipeline
{
  "description" : "这是测试的管道内容",
  "version": 100, 
  "processors" : [
    {
      "set" : {
        "field": "des",
        "value": "这是管道默认数据"
      }
    }
  ]
}
```

### 查询管道

**查询索引中的管道**

通过`GET`请求我们可以查询出，当前管道的配置信息

```java
GET _ingest/pipeline/test_pipeline
```

**返回内容**

```java
{
  "test_pipeline" : {
    "description" : "这是测试的管道内容",
    "version" : 100,
    "processors" : [
      {
        "set" : {
          "field" : "des",
          "value" : "这是管道默认数据"
        }
      }
    ]
  }
}
```

**查询管道版本**

```java
GET _ingest/pipeline/test_pipeline?filter_path=*.version
```

**返回数据**

```java
{
  "test_pipeline" : {
    "version" : 100
  }
}
```

### 删除管道

**删除管道**

删除管道类似删除文档之前需要使用`DELETE`请求调用其插入的API就可以完成

```java
DELETE _ingest/pipeline/test_pipeline
```

**删除所有管道**

和文档操作类似，你可以使用`*`符号匹配所有的管道进行清除。

```java
DELETE _ingest/pipeline/*
```

### 使用管道

现在我们存在一个这样的索引

```java
"test_field2": {
        "aliases": {
     },
        "mappings": {
            "properties": {
                "channel": {
                    "type": "nested"
                },
                "des": {
                    "type": "text"
                },
                "name": {
                    "type": "keyword"
                }
            }
        },
        "settings": {
            "index": {
                "creation_date": "1574774756443",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "RCF17AZOR1GPs84LKw88lA",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_field2"
            }
        }
    }
```

现在我们尝试向索引中插入数据。

**使用已经存在管道**

```java
PUT test_field2/_doc/1?pipeline=test_pipeline
{
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
```

然后查询ID为1的数据会得到下面内容

```java
{
  "_index" : "test_field2",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "des" : "这是管道默认数据",
    "name" : "内容1",
    "channel" : [
      {
        "num" : 33,
        "name" : "one"
      },
      {
        "num" : 44,
        "name" : "two"
      }
    ],
    "desc" : "描述1"
  }
}
```

会发现其des内容并非我们插入的数据，而是管道设置的参数。

> 从上面的内容可以发现，管道其实很像是我们平时使用的拦截器操作，会拦截一些操作然后对其进行修改。

**请求数据的时候定义管道**

除了上面的使用方式，我们也可以在请求数据的时候使用管道

```java
PUT test_field2/_doc/5
{
    "pipeline": {
        "description": "这是自定义的管道内容",
        "processors": [
            {
                "set": {
                    "field": "des",
                    "value": "这是管道默认数据"
                }
            }
        ]
    },
    "docs": [
        {
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
}
```

此时我们尝试查询数据会发现数据使用的是自定义的管道参数

```java
{
  "_index" : "test_field2",
  "_type" : "_doc",
  "_id" : "5",
  "_version" : 1,
  "_seq_no" : 2,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "pipeline" : {
      "description" : "这是自定义的管道内容",
      "processors" : [
        {
          "set" : {
            "field" : "des",
            "value" : "这是管道默认数据"
          }
        }
      ]
    },
    "docs" : [
      {
        "_source" : {
          "name" : "内容1",
          "desc" : "描述1",
          "channel" : [
            {
              "name" : "one",
              "num" : 33
            },
            {
              "name" : "two",
              "num" : 44
            }
          ]
        }
      }
    ]
  }
}
```

### 模拟管道

当然官方也提供了`_simulate` 方法让你模拟数据在经过了管道的处理后所得到的结果

```java
POST _ingest/pipeline/_simulate
{
  "pipeline" :
  {
    "description": "_description",
    "processors": [
      {
        "set" : {
          "field" : "field2",
          "value" : "_value"
        }
      }
    ]
  },
  "docs": [
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "bar"
      }
    },
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "rab"
      }
    }
  ]
}
```

**返回结果**

```java
{
   "docs": [
      {
         "doc": {
            "_id": "id",
            "_index": "index",
            "_type": "_doc",
            "_source": {
               "field2": "_value",
               "foo": "bar"
            },
            "_ingest": {
               "timestamp": "2017-05-04T22:30:03.187Z"
            }
         }
      },
      {
         "doc": {
            "_id": "id",
            "_index": "index",
            "_type": "_doc",
            "_source": {
               "field2": "_value",
               "foo": "rab"
            },
            "_ingest": {
               "timestamp": "2017-05-04T22:30:03.188Z"
            }
         }
      }
   ]
}
```

**查看管道对文件的影响**

```java
POST _ingest/pipeline/_simulate?verbose
{
  "pipeline" :
  {
    "description": "_description",
    "processors": [
      {
        "set" : {
          "field" : "field2",
          "value" : "_value2"
        }
      },
      {
        "set" : {
          "field" : "field3",
          "value" : "_value3"
        }
      }
    ]
  },
  "docs": [
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "bar"
      }
    },
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "rab"
      }
    }
  ]
}
```

**返回内容**

```java
{
   "docs": [
      {
         "processor_results": [
            {
               "doc": {
                  "_id": "id",
                  "_index": "index",
                  "_type": "_doc",
                  "_source": {
                     "field2": "_value2",
                     "foo": "bar"
                  },
                  "_ingest": {
                     "timestamp": "2017-05-04T22:46:09.674Z"
                  }
               }
            },
            {
               "doc": {
                  "_id": "id",
                  "_index": "index",
                  "_type": "_doc",
                  "_source": {
                     "field3": "_value3",
                     "field2": "_value2",
                     "foo": "bar"
                  },
                  "_ingest": {
                     "timestamp": "2017-05-04T22:46:09.675Z"
                  }
               }
            }
         ]
      },
      {
         "processor_results": [
            {
               "doc": {
                  "_id": "id",
                  "_index": "index",
                  "_type": "_doc",
                  "_source": {
                     "field2": "_value2",
                     "foo": "rab"
                  },
                  "_ingest": {
                     "timestamp": "2017-05-04T22:46:09.676Z"
                  }
               }
            },
            {
               "doc": {
                  "_id": "id",
                  "_index": "index",
                  "_type": "_doc",
                  "_source": {
                     "field3": "_value3",
                     "field2": "_value2",
                     "foo": "rab"
                  },
                  "_ingest": {
                     "timestamp": "2017-05-04T22:46:09.677Z"
                  }
               }
            }
         ]
      }
   ]
}
```

> ps. 本文中所涉及的API以及文档内容基于7.2版本。
