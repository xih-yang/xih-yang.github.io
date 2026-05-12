# 12、ElasticSearch 实战：索引之别名使用
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/12.html
- 分类：搜索引擎
- 分组：教程目录
### Elasticsearch的别名

#### 别名的作用

在之前的文章中，介绍过Elasticsearch索引创建之后，假如尝试修改字段的类型的时候，除了重建索引之外没有别的办法。

假如我们尝试重建一个新的索引并把数据迁移过去，就会出现一个问题，当我们完成数据迁移的时候可能会需要重启我们的环境，将查询目标指向新的索引。假如这个业务已经运行在生产环境中，我们不得不进行一次停机升级。这个对于我们系统的运行来说显然不是很好的方法。

所以Elasticsearch提供了索引别名的功能。索引别名就像一个快捷方式或软连接，可以指向一个或多个索引，也可以给任何一个需要索引名的API来使用。使用索引别名我们可以在运行的集群中无缝的从一个索引切换到另外一个索引。

> 针对索引的API主要有两种，_alias 用于单个操作， _aliases用于执行多个原子级操作。这点会发现下面两种API都有使用的例子

#### 查询别名

直接调用`_alias`API的GET方法可以看到索引的别名，下面的例子中就是一个没有创建别名的索引。

**查询指定索引的别名**

```java
GET localhost:9200/employee/_alias
```

**查询所有索引的别名**

```java
GET localhost:9200/_alias
```

```java
{
    "test_city_info3": {
        "aliases": {
     }
    },
    "employee": {
        "aliases": {
     }
    },
    "city_info": {
        "aliases": {
     }
    }
}
```

#### 创建别名

这里使用的`_aliases`方法是一个支持多个别名操作的API。请求参数中接收的是个数组，其可以同时对多个索引添加或者删除别名操作。

- **JSON参数方式**

**请求地址**

```java
POST localhost:9200/_aliases
```

**请求参数**

```java
{
    "actions": [
        {
            "add": {
                "index": "employee",
                "alias": "employee_out"
            }
        }
    ]
}
```

- **第二种方式**

这里使用的`_alias`方法一次只能操作一个索引。

```java
PUT  localhost:9200/city_info/_alias/city_info_out
```

**再次查询别名**

```java
{
    "test_city_info3": {
        "aliases": {
     }
    },
    "employee": {
        "aliases": {
            "employee_out": {
     }
        }
    },
    "city_info": {
        "aliases": {
            "city_info_out": {
     }
        }
    }
}
```

#### 删除别名

删除别名使用的依旧是`_aliases`API，需要将`add`参数修改为`remove`

**请求及参数**

```java
POST localhost:9200/_aliases
{
    "actions": [
        {
            "remove": {
                "index": "employee",
                "alias": "employee_out"
            }
        }
    ]
}
```

```java
DELETE localhost:9200/_aliases
```

**再次查询所有索引的别名**

```java
{
    "test_city_info3": {
        "aliases": {
     }
    },
    "employee": {
        "aliases": {
     }
    },
    "city_info": {
        "aliases": {
     }
    }
}
```

#### 修改别名

其实就是移除之前的别名，然后关联新的别名关系。这一步操作我们可以实现运行中的es集群无缝切换索引。我们可以将索引指向一个新准备的别名中，也可以为别名关联新的索引。

```java
{
    "actions": [
        {
            "remove": {
                "index": "employee",
                "alias": "employee_out"
            }
        },
        {
            "add": {
                "index": "employee",
                "alias": "employee_out2"
            }
        }
    ]
}
```

另外可以看到索引和别名并非是一对一的关系，一个索引可以对应多个别名，同样一个别名可以对应多个索引。所以就可能出现下面的数据情况

**多个索引使用一个别名**

```java
{
    "actions": [
        {
            "add": {
                "index": "employee",
                "alias": "employee_out2"
            }
        },
        {
            "add": {
                "index": "city_info",
                "alias": "employee_out2"
            }
        },
        {
            "add": {
                "index": "test_city_info",
                "alias": "employee_out2"
            }
        }
    ]
}
```

**一个索引使用多个别名**

```java
{
    "actions": [
        {
            "add": {
                "index": "employee",
                "alias": "employee_out2"
            }
        },
        {
            "add": {
                "index": "employee",
                "alias": "employee_out3"
            }
        },
        {
            "add": {
                "index": "employee",
                "alias": "employee_out4"
            }
        }
    ]
}
```

#### 通过别名查询索引

一旦一个索引创建了别名，我们就可以通过这个别名获取索引的配置信息。当一个别名对应了多个索引的时候，系统会返回其关联的多个索引的信息。

**请求及参数**

```java
GET localhost:9200/employee_out3
```

**响应内容**

```java
{
    "employee": {
        "aliases": {
            "employee_out2": {
     },
            "employee_out3": {
     },
            "employee_out4": {
     }
        },
        "mappings": {
            "properties": {
                "age": {
                    "type": "integer"
                },
                "entry_time": {
                    "type": "date"
                },
                "group": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                }
            }
        },
        "settings": {
            "index": {
                "creation_date": "1571801862644",
                "number_of_shards": "1",
                "number_of_replicas": "1",
                "uuid": "FZwM2b8WQQiSnaxMqgbckQ",
                "version": {
                    "created": "7020099"
                },
                "provided_name": "employee"
            }
        }
    }
}
```

#### 通过别名查询数据

通过别名进行数据查询的时候可以尝试查询出多个索引的数据。现在有个`employee_out2`它关联了两个完全不同结构的索引，一个之前测试数据的`employee`索引，一个是之前测试的城市信息索引`city_info`,现在尝试对这两个完全不一样结构的索引进行查询

**请求地址**

```java
POST localhost:9200/employee_out2/_search
{
    "query": {
        "terms": {
            "name": [
                "甲0",
                "上海"
            ]
        }
    }
}
```

**返回结果**

最后可以看到其拿到了完全不同的数据内容。

```java
{
    ....
    "hits": {
        "total": {
            "value": 5,
            "relation": "eq"
        },
        "max_score": 1,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "name": "上海",
                    "desc": "中国经济、金融、贸易、航运、科技创新中心",
                    "province": "上海",
                    "gdp": "3267900000000",
                    "area": "华东地区",
                    "carNumPrefix": "沪"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "7",
                "_score": 1,
                "_source": {
                    "name": "苏州",
                    "desc": "大城市",
                    "province": "江苏",
                    "gdp": "1859700000000",
                    "area": "华东地区",
                    "carNumPrefix": "苏E"
                }
            },
            ....
        ]
    }
}
```

#### 通过别名写数据

当一个别名关联多个索引的时候，此时需要为索引设置参数`is_write_index`,被设置为`true`的索引，当对别名写数据的时候数据会被写到此索引中。

```java
POST localhost:9200/_aliases
{
    "actions": [
        {
            "add": {
                "index": "employee",
                "alias": "employee_out2",
                "is_write_index": true
            }
        }
    ]
}
```

**然后数据插入完成**

```java
PUT localhost:9200/employee_out2/_doc/200
{
    "_index": "employee",
    "_type": "_doc",
    "_id": "200",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 100,
    "_primary_term": 1
}
```

### 使用别名重建索引的过程

当我们决定存储某种数据时，在创建索引的时候需要将数据结构完整确定下来，于此同时索引的设定和很多固定配置将不能改变。

当需要改变数据结构时，就需要重新建立索引，为此，Elastic团队提供了很多辅助⼯工具帮助开发人员进行重建索引。

#### 重建索引过程

**1、** 为当前索引建立一个别名；

**2、** 将需要调整后的映射建立一个索引；

**3、** 将旧索引的数据同步到新索引中；

**4、** 将新索引和当前索引别名关联；

**5、** 删除旧索引，完成数据转移；

##### 创建索引以及映射

```java
PUT  localhost:9200/user
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "age": {
            "type": "integer"
        },
        "role": {
            "type": "integer"
        }
    }
}
```

##### 创建别名

```java
POST localhost:9200/_aliases
```

```java
{
    "actions": [
        {
            "add": {
                "index": "user",
                "alias": "user_out",
                "is_write_index": true
            }
        }
    ]
}
```

##### 插入一些数据

…

##### 新的索引映射

```java
PUT  localhost:9200/user_v2
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "age": {
            "type": "integer"
        },
        "role": {
            "type": "keyword"
        }
    }
}
```

##### 拷贝数据

```java
POST localhost:9200/_reindex
{
    "source": {
        "index": "user"
    },
    "dest": {
        "index": "user_v2"
    }
}
```

##### 进行别名替换

```java
POST localhost:9200/_aliases
```

```java
{
    "actions": [
        {
            "add": {
                "index": "user_v2",
                "alias": "user_out"
            }
        },
        {
            "remove": {
                "index": "user",
                "alias": "user_out"
            }
        }
    ]
}
```

当一个别名关联多个索引的时候，进行查询

```java
{
    "error": {
        "root_cause": [
            {
                "type": "illegal_argument_exception",
                "reason": "Alias [employee_out2] has more than one indices associated with it [[employee, test_city_info, city_info]], can't execute a single index op"
            }
        ],
        "type": "illegal_argument_exception",
        "reason": "Alias [employee_out2] has more than one indices associated with it [[employee, test_city_info, city_info]], can't execute a single index op"
    },
    "status": 400
}
```

##### 删除索引（错误内容）

POST localhost:9200/user

##### 访问数据

```java
GET localhost:9200/user_out/_doc/1
```
