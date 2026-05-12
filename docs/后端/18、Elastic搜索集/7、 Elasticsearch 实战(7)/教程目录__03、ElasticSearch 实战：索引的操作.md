# 03、ElasticSearch 实战：索引的操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/3.html
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

### Elasticsearch的API

ElasticSearch提供了REST风格的API，我们可以用JSON格式的参数访问指定URL进行资源的操作。作为一个RESTful风格的API。不同的请求方式（GET、POST、DELETE、PUT）在相同的URL情况下发挥着不同的作用。

### 索引的操作

#### 新增索引

Elasticsearch使用PUT方式来实现索引的新增。你可以在创建索引的时候不添加任何参数，系统会为你创建一个默认的索引，当然你可以添加附加一些配置信息

##### 使用http请求

可以直接使用此请求创建索引。

```java
PUT "localhost:9200/test_city_info"
```

**也可以附带一些配置**

```java
{
   "settings" : {
      "index" : {
         "number_of_shards" : 3, "number_of_replicas" : 3
      }
   }
}
```

**响应结果**

其参数`acknowledged`表名索引已经创建

```java
{
    "acknowledged": true,
    "shards_acknowledged": true,
    "index": "test_city_info"
}
```

##### java命令

```java
    public static void createIndex() throws IOException {
        CreateIndexRequest createIndex = new CreateIndexRequest("test_city_info4");
        // RestClientUtils.client为es的连接实例，可以自己实现
        CreateIndexResponse response = RestClientUtils.client.indices().create(createIndex, RequestOptions.DEFAULT);
        System.out.println(response.isAcknowledged());
    }
```

#### 查询索引

##### 使用http请求

Elasticsearch使用和创建索引一样的URL但是请求方法为GET的API来查看索引内容

```java
GET localhost:9200/test_city_info2
```

**响应内容**

此时可以看到刚才创建的索引已经存在

```java
{
    "test_city_info2": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103979640",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ldQ3_2C5TLe7Bm8eIx6Igg",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info2"
            }
        }
    }
}
```

**返回内容**

这里简单的介绍下返回值的内容

字段
内容

aliases
别名

mappings
映射

settings
配置

settings.index.creation_date
创建时间

settings.index.number_of_shards
数据分片数

settings.index.number_of_replicas
数据备份数

settings.index.uuid
索引id

settings.index.provided_name
名称

**使用java代码**

```java
    public static void queryIndex() throws IOException {
        GetIndexRequest getIndex = new GetIndexRequest("test_city_info4");
        // RestClientUtils.client为es的连接实例，可以自己实现
        GetIndexResponse response = RestClientUtils.client.indices().get(getIndex, RequestOptions.DEFAULT);
        System.out.println(response.getMappings().get("key"));
    }
```

#### 批量查询索引

##### 使用http请求

在上面创建索引之后，又创建了一个test_city_info2索引。可以通过下面方法同时获取两个索引的信息。

```java
GET "localhost:9200/test_city_info,test_city_info2"
```

响应

```java
{
    "test_city_info": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103126318",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ljfFHhspSSmGaBVD3PHjbA",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info"
            }
        }
    },
    "test_city_info2": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103979640",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ldQ3_2C5TLe7Bm8eIx6Igg",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info2"
            }
        }
    }
}
```

使用java代码

```java
    public static void createIndex() throws IOException {
        DeleteIndexRequest deleteIndex = new DeleteIndexRequest("test_city_info4");
        AcknowledgedResponse response = RestClientUtils.client.indices().delete(deleteIndex, RequestOptions.DEFAULT);
        System.out.println(response.isAcknowledged());
    }
```

#### 获取全部索引

当我们想查看系统中所有的索引的时候可以使用`_all`的方式查看所有的索引。

##### 使用http请求

```java
GET "localhost:9200/_all"
```

**响应内容**

```java
{
    "test_city_info": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103126318",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ljfFHhspSSmGaBVD3PHjbA",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info"
            }
        }
    },
    "test_city_info2": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103979640",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ldQ3_2C5TLe7Bm8eIx6Igg",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info2"
            }
        }
    }
}
```

使用java代码

```java

```

#### 删除索引

Elasticsearch使用和创建索引一样的URL来进行索引的删除，但是需要注意这次使用的是DELETE的请求方式。

##### 使用http请求

```java
DELETE "localhost:9200/test_city_info2"
```

**响应内容**

通过`acknowledged`参数内容，我们可以确认索引已经移除

```java
{
    "acknowledged": true
}
```

#### 是否存在指定索引

这里就直接使用查询索引的方式，向某个索引发送GET请求，就可以确定该索引是否存在。如果HTTP响应为200，则存在；如果是404，则不存在

##### 使用http请求

```java
GET "localhost:9200/test_city_info2"
```

响应

```java
{
    "error": {
        "root_cause": [
            {
                "type": "index_not_found_exception",
                "reason": "no such index [test_city_info2]",
                "resource.type": "index_or_alias",
                "resource.id": "test_city_info2",
                "index_uuid": "_na_",
                "index": "test_city_info2"
            }
        ],
        "type": "index_not_found_exception",
        "reason": "no such index [test_city_info2]",
        "resource.type": "index_or_alias",
        "resource.id": "test_city_info2",
        "index_uuid": "_na_",
        "index": "test_city_info2"
    },
    "status": 404
}
```

使用java代码

```java
    public static void existsIndex() throws IOException {
        GetIndexRequest createIndex = new GetIndexRequest("test_city_info4");
        boolean exists = RestClientUtils.client.indices().exists(createIndex, RequestOptions.DEFAULT);
        System.out.println(exists);
   }
```

#### 关闭索引

在一些业务场景，我们可能需要禁止掉某些索引的访问功能，但是又不想删除这个索引。这时候可以使用关闭索引的功能，这样这个索引暂时无法被访问到，在后续需要的时候可以再次开启此索引。

Elasticsearch使用使用`_close`以及`POST`请求方法来关闭某个索引

##### 使用http请求

```java
POST "localhost:9200/test_city_info/_close"
```

**响应内容**

```java
{
    "acknowledged": true,
    "shards_acknowledged": true
}
```

此时我们尝试访问此索引会发现已经不能正常访问。

```java
{
    "test_city_info": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "verified_before_close": "true",
                "number_of_shards": "1",
                "provided_name": "test_city_info",
                "creation_date": "1571103126318",
                "number_of_replicas": "1",
                "uuid": "ljfFHhspSSmGaBVD3PHjbA",
                "version": {
                    "created": "7020099"
                }
            }
        }
    }
}
```

`"verified_before_close": "true"`显示此索引被关闭

使用java代码

```java
    public static void closeIndex() throws IOException {
        CloseIndexRequest closeIndex = new CloseIndexRequest("test_city_info4");
        AcknowledgedResponse close = RestClientUtils.client.indices().close(closeIndex, RequestOptions.DEFAULT);
        System.out.println(close.isAcknowledged());
    }
```

#### 打开索引

当然索引可以被关闭也需要被打开，Elasticsearch使用`_open`以及`POST`请求方法来关闭某个索引

##### 使用http请求

```java
POST "localhost:9200/test_city_info/_open"
```

响应

```java
{
    "acknowledged": true,
    "shards_acknowledged": true
}
```

此时我们尝试访问此索引会发现已经可以正常访问。

```java
{
    "test_city_info": {
        "aliases": {
     },
        "mappings": {
     },
        "settings": {
            "index": {
                "creation_date": "1571103126318",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "ljfFHhspSSmGaBVD3PHjbA",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "test_city_info"
            }
        }
    }
}
```

此时索引内容`"verified_before_close": "true"`不再显示

使用java代码

```java
    public static void openIndex() throws IOException {
        OpenIndexRequest openIndex = new OpenIndexRequest("test_city_info4");
        OpenIndexResponse open = RestClientUtils.client.indices().open(openIndex, RequestOptions.DEFAULT);
        System.out.println(open.isAcknowledged());
    }
```
