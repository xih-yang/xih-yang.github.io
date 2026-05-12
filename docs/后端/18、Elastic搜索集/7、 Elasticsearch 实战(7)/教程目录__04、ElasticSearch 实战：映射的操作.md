# 04、ElasticSearch 实战：映射的操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/4.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

JAVA依赖版本
7.2.1

> Elasticsearch 7.x 和之前版本有相当大的变化，所以本篇内容尤其是JAVA代码的操作对于使用旧版本的同学帮助可能不大。因为本人主要是JAVA开发，在介绍相关操作的时候会附带JAVA代码操作的逻辑。

### 映射的操作

映射的创建时基于索引的，你必须要先创建索引才能创建映射。es中的映射相当于传统数据库中的表结构，数据存储的格式就是通过映射来规定的

#### 新增映射

类似于索引，映射的创建也是使用`PUT`方法。

http请求

```java
url:  PUT "localhost:9200/test_city_info/_mapping"
```

创建映射的时候，需要设置其配置内容，这个时候你需要设置请求的头信息，否则可能导致参数解析失败

```java
head:  Content-Type:application/json
```

**请求参数**

```java
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "desc": {
            "type": "text"
        },
        "celebrity": {
            "type": "text"
        },
        "province": {
            "type": "keyword"
        },
        "population": {
            "type": "keyword"
        },
        "gdp": {
            "type": "keyword"
        }
    }
}
```

**响应**

```java
{
    "acknowledged": true
}
```

java代码

```java
    public static void createMapping() throws IOException {
        PutMappingRequest putMapping = new PutMappingRequest("test_city_info4");
        //创建mapping约束字段
        XContentBuilder mapping = XContentFactory.jsonBuilder()
                .startObject()
                .startObject("properties")
                .startObject("name")
                .field("type","keyword")
                .endObject()
                .startObject("desc")
                .field("type", "text")
                .endObject()
                .startObject("celebrity")
                .field("type","text")
                .endObject()
                .startObject("province")
                .field("type", "keyword")
                .endObject()
                .startObject("population")
                .field("type", "keyword")
                .endObject()
                .endObject()
                .endObject();
        PutMappingRequest source = putMapping.source(mapping);
        // RestClientUtils.client为es的连接实例，可以自己实现
        AcknowledgedResponse response = RestClientUtils.client.indices().putMapping(source, RequestOptions.DEFAULT);
        System.out.println(response.isAcknowledged());
    }
```

#### 查询映射

Elasticsearch使用`_mapping`的`POST`请求方法来查询映射

**http请求**

```java
GET "localhost:9200/test_city_info/_mapping"
```

**响应内容**

返回的就是刚才创建的映射内容

```java
{
    "test_city_info": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    }
}
```

java代码

```java
    public static void getMapping() throws IOException {
        GetMappingsRequest getMapping = new GetMappingsRequest();
        getMapping.indices("test_city_info4");
        // RestClientUtils.client为es的连接实例，可以自己实现
        GetMappingsResponse mapping = RestClientUtils.client.indices().getMapping(getMapping, RequestOptions.DEFAULT);
        System.out.println(mapping.mappings().get("test_city_info4"));
    }
```

#### 查询多个映射

Elasticsearch使用`_mapping`的`POST`请求方法来查询映射。当查询多个映射的时候只需要使用，来分割添加

**http请求**

```java
GET "localhost:9200/test_city_info,test_city_info2/_mapping"
```

**响应内容**

可以看到之前创建的两个映射都被查询出来了。

```java
{
    "test_city_info2": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name2": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    },
    "test_city_info": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    }
}
```

#### 查询所有映射

取消掉中间索引的参数直接使用`_mapping`可以查询这个实例下所有索引的映射。

**http请求**

```java
GET "localhost:9200/_mapping"
```

**响应内容**

```java
{
    "test_city_info3": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name3": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    },
    "test_city_info2": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name2": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    },
    "test_city_info": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    }
}
```

#### 修改映射

此处需要注意，修改映射的时候并不能去修改字段类型。假如你需要修改字段类型，只能创建一个新的数据类型，然后将之前的数据导入到新的字段中。

**http请求**

```java
url:  PUT "localhost:9200/test_city_info/_mapping"
```

**头信息**

```java
head:  Content-Type:application/json
```

**请求参数**

```java
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "desc": {
            "type": "text"
        },
        "celebrity": {
            "type": "text"
        },
        "province": {
            "type": "keyword"
        },
        "population": {
            "type": "keyword"
        },
        "gdp": {
            "type": "keyword"
        },
        "college": {
            "type": "text"
        }
    }
}
```

**响应内容**

```java
{
    "acknowledged": true
}
```

**再次查看**

这个时候可以发现字段已经被添加了

```java
{
    "test_city_info": {
        "mappings": {
            "properties": {
                "celebrity": {
                    "type": "text"
                },
                "college": {
                    "type": "text"
                },
                "desc": {
                    "type": "text"
                },
                "gdp": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                },
                "population": {
                    "type": "keyword"
                },
                "province": {
                    "type": "keyword"
                }
            }
        }
    }
}
```

java代码

修改映射在java中使用和新增映射相同的`PutMappingRequest`对象，相关代码可以参考新增映射的内容。
