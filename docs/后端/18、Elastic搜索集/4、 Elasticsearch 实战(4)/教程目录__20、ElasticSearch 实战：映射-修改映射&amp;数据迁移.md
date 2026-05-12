# 20、ElasticSearch 实战：映射-修改映射&amp;数据迁移
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/20.html
- 分类：搜索引擎
- 分组：教程目录
> 接第19节

##### 4、数据迁移

先创建出 twitter 的正确映射。然后使用如下方式进行数据迁移

```java
# 7.x 之后的写法
POST _reindex	//固定写法
{
  "source": {
     	//老索引
    "index": "twitter"
  },
  "dest": {
     		//目标索引
    "index": "new_twitter"
  }
}
# 7.x之前的带 type 的写法
将旧索引的 type 下的数据进行迁移
POST _reindex	//固定写法
{
  "source": {
    "index": "twitter", //老索引
    "type": "twitter",  //老类型
  },
  "dest": {
     		//目标索引
    "index": "new_twitter"
  }
}
```

举例：
`创建一个新的索引`：

```java
PUT /newbank
{
  "mappings": {
    "properties": {
      "account_number": {
        "type": "long"
      },
      "address": {
        "type": "text"
      },
      "age": {
        "type": "integer"
      },
      "balance": {
        "type": "long"
      },
      "city": {
        "type": "keyword"
      },
      "email": {
        "type": "keyword"
      },
      "employer": {
        "type": "keyword"
      },
      "firstname": {
        "type": "text"
      },
      "gender": {
        "type": "keyword"
      },
      "lastname": {
        "type": "text"
      },
      "state": {
        "type": "keyword"
      }
    }
  }
}
```

`数据迁移`：

```java
POST _reindex
{
  "source": {
    "index": "bank",
    "type": "account"
  },
  "dest": {
    "index": "newbank"
  }
}
```

`查看迁移后的数据`：

可以看到，不用 type，老的数据可以迁移过来

```java
GET newbank/_search
```

> 参考文档-mapping
