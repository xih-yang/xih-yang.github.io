# 10、ElasticSearch 7.3 实战：采用restful风格对索引的增删改查
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/10.html
- 分类：搜索引擎
- 分组：教程目录
## 1、 为什么需要手动创建索引

直接put数据 PUT index/_doc/1，es会自动生成索引，并建立动态映射dynamic mapping。这样的话很大可能与实际的需求不服，在实际的应用上，我们需要自己手动建立索引和映射，这也是为了更好地管理索引。就像数据库的建表语句一样。

## 2、 创建索引

创建索引的语法

```java
PUT /index
{
    "settings": { ... any settings ... },
    "mappings": {
       "properties" : {
            "field1" : { "type" : "text" }
        }
    },
    "aliases": {
        "default_index": {}
  } 
}
```

举例：

```java
PUT /my_index
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "field1": {
        "type": "text"
      },
      "field2": {
        "type": "text"
      }
    }
  },
  "aliases": {
    "default_index": {}
  }
}
```

结果：

其中的aliases含义是索引别名，可以和数据库中的别名类比记忆

插入数据

```java
POST /my_index/_doc/1
{
    "field1":"java",
    "field2":"js"
}
```

查询数据的话两种方式都可以查到

```java
GET /my_index/_doc/1
GET /default_index/_doc/1
```

返回的结果一样：

```java
{
  "_index" : "my_index",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 1,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "field1" : "java",
    "field2" : "js"
  }
}
```

## 3、查询索引

```java
GET /my_index/_mapping
```

```java
GET /my_index/_setting
```

## 4、修改索引

比如说修改索引中的副本数

```java
PUT /my_index/_settings
{
  "index": {
    "number_of_replicas": 2
  }
}
```

再次查询得到的结果如下：

## 5、删除索引

删除索引有好几种方式，指定删除某一个，删除某两个，根据匹配来进行删除，或者直接删除全部索引。

```java
DELETE /my_index
DELETE /index_one,index_two
DELETE /index_*
DELETE /_all
```

为了安全起见，防止恶意删除索引，生产上可以设置elasticsearch.yml中以下配置，让删除时必须指定索引名：

```java
action.destructive_requires_name: true
```
