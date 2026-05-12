# 13、ElasticSearch 实战： ES 文档 API
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/13.html
- 分类：搜索引擎
- 分组：教程目录
Elasticsearch 提供了单一文档 API 和多文档 API

## 索引 API

使用指定的映射请求相应的索引，对在索引中添加或更新 JSON 的帮助是很大的。

例如下面的请求会将 JSON 对象添加到 user_admin 索引和 user 映射下

```java
POST http://localhost:9200/user_admin/user/4?pretty
```

请求正文

```java
{"nickname":"飞仙","description":"天外飞仙","street":"苏州大学","city":"Suzhou","state":"Jiangsu","zip":"215006","location":[120.65426,31.30797],"money":10485,"tags":["iOS", "Android"],"vitality":"3.4"}
```

响应内容

```java
{
  "_index" : "user_admin",
  "_type" : "user",
  "_id" : "4",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 1,
  "_primary_term" : 1
}
```

## 自动创建索引

当发起一个请求将 JSON 对象添加到特定索引时，如果该索引不存在，则此 API 会自动创建该索引以及创建此 JSON 对象的基础映射

可以通过在 elasticsearch.yml 配置文件中将以下参数的值更改为 false 来禁用此功能

```java
action.auto_create_index:false   # 禁止自动创建索引
index.mapper.dynamic:false       # 禁止动态映射
```

我们还可以限制自动创建索引，只能通过更改以下参数的值来允许具有特定模式的索引名称

```java
action.auto_create_index:+acc*,-bank*
```

其中+索引 表示允许， -索引 表示不允许

## 版本化

Elasticsearch 提供版本控制功能

我们可以使用版本查询参数 version 来指定特定文档的版本

例如

```java
POST http://localhost:9200/user_admin/user/1?version=1&pretty
```

请求正文

```java
{"nickname":"站长","description":"DDKK.COM 弟弟快看，程序员编程资料站 ，教程 ","street":"东四十条","city":"Beijing","state":"Beijing","zip":"100007","location":[116.432727,39.937732],"money":5201314,"tags":["PHP", "Python"],"vitality":"9.0"}
```

响应内容

```java
{
  "_index" : "user_admin",
  "_type" : "user",
  "_id" : "1",
  "_version" : 2,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 1,
  "_primary_term" : 1
}
```

Elasticsearch 中两种最重要的版本控制类型:

**1、** 内部版本控制是以1开头的默认版本，随每次更新而增加，包括删除；

**2、** 版本号也可以在外部设置，要启用此功能，我们需要将version_type设置为external；

版本控制是一个实时过程，不受实时搜索操作的影响

## 操作类型

可以设置操作类型参数 op_type 为 create 用于强制执行创建操作，避免覆盖现有文档

```java
POST http://localhost:9200/python/lession/1?op_type=create
```

请求正文

```java
{
   "Text":"这是第一章节"
}
```

返回内容

```java
{"_index":"python","_type":"lession","_id":"1","_version":1,"result":"created","_shards":{"total":2,"successful":1,"failed":0},"_seq_no":0,"_primary_term":1}
```

## 自动生成 ID

在索引操作中如果未指定 ID ，那么 Elasticsearch 会自动为该文档生成标识 id

## 父文档和子文档

可以通过在 URL 中添加 parent 参数并指定父文档的 ID 来为当前文档指定一个父文档

```java
POST http://localhost:9200/python/article/1?parent=1&pretty
```

请求正文

```java
{
   "Text":"这是第一章节的第一小节"
}
```

如果执行此操作时抛出了异常

```java
{
  "error" : {
    "root_cause" : [
      {
        "type" : "illegal_argument_exception",
        "reason" : "can't specify parent if no parent field has been configured"
      }
    ],
    "type" : "illegal_argument_exception",
    "reason" : "can't specify parent if no parent field has been configured"
  },
  "status" : 400
}
```

则可以使用下面的设置来重新创建索引

```java
{
   "mappings": {
      "lession": {},
      "article": {
         "_parent": {
            "type": "lession"
         }
      }
   }
}
```

## 超时 ( Timeout )

默认情况下，索引操作将在主分片上等待最多 60 秒 分钟，然后操作失败障并响应一个错误

我们可以传递 timeout 参数来显式改变此超时时间

```java
POST http://localhost:9200/python/lession/2?timeout = 3m
```

请求正文

```java
{
   "Text":"这是第二章节，可以等待主分片 3 分钟"
}
```

## 获取文档

通过对特定文档执行获取请求，可以获取该文档的 JSON 对象

例如

```java
GET http://localhost:9200/user_admin/user/1?pretty
```

响应内容

```java
{
  "_index" : "user_admin",
  "_type" : "user",
  "_id" : "1",
  "_version" : 2,
  "found" : true,
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
    "money" : 5201314,
    "tags" : [
      "PHP",
      "Python"
    ],
    "vitality" : "9.0"
  }
}
```

**1、** 此操作是实时的，不受索引的刷新率影响；

**2、** 也可以指定版本，这样Elasticsearch将只读取该版本的文档；

**3、** 可以在请求中指定_all参数，这样Elasticsearch会在每种类型中搜索该文档ID，且返回第一个匹配的文档；

**4、** 还可以指定返回结果应该包含的字段；

```java
    GET http://localhost:9200/user_admin/user/1?stored_fields=nickname,money&pretty
```

```java
响应内容
```

```java
    {
      "_index" : "user_admin",
      "_type" : "user",
      "_id" : "1",
      "_version" : 2,
      "found" : true
    }
```

**5、** 还可以通过在URL中添加_source路径参数来获取该文档的原始内容；

```java
    GET http://localhost:9200/user_admin/user/1/_source?pretty
```

```java
响应内容
```

```java
    {
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
      "money" : 5201314,
      "tags" : [
        "PHP",
        "Python"
      ],
      "vitality" : "9.0"
    }
```

我们还可以添加 refresh 参数并设置为 true 来让 Elasticsearch 进行操作前先刷新分片

## 删除文档

可以通过向 Elasticsearch 发送 HTTP DELETE 请求来删除特定索引，映射或文档

例如

```java
DELETE http://localhost:9200/user_admin/user/4
```

返回响应

```java
{"_index":"user_admin","_type":"user","_id":"4","_version":2,"result":"deleted","_shards":{"total":2,"successful":1,"failed":0},"_seq_no":2,"_primary_term":1}
```

**1、** 可以指定文档的版本以删除该特定版本；

**2、** 可以指定路由参数以从特定用户删除文档，如果文档不属于该特定用户，则操作将失败；

**3、** 这个API中，可以指定与GETAPI相同的刷新和超时选项；

## 更新文档

如果要更新一个文档，需要传递一个 script 对象，并且会使用版本控制来确保获取和重新索引过程中未发生更新

例如下面的请求使用 scrip 对象来更新用户的积分

```java
POST http://localhost:9200/user_admin/user/1/_update?pretty
```

请求正文

```java
{
    "script": { 
        "inline":"ctx._source.money += 500"  
    }
}
```

响应内容

```java
{
  "_index" : "user_admin",
  "_type" : "user",
  "_id" : "1",
  "_version" : 4,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 3,
  "_primary_term" : 1
}
```

如果更新过程中抛出了 script 异常，则建议在 elasticcisearch.yml 中添加以下行，然后重启 Elasticsearch 服务

```java
script.inline: on
script.indexed: on
```

然后我们就可以通过向更新的文档发送获取请求来检查更新

```java
GET http://localhost:9200/user_admin/user/1
```

## 多文档获取操作 ( mget )

多文档获取 API 与 GET API 有着相同的功能，但 mget 请求可以返回多个文档

我们一般通过使用 doc 数组来指定需要提取的所有文档的索引，类型和 ID

```java
POST http://localhost:9200/_mget
```

请求正文

```java
{
    "docs":[
        {
            "_index": "user", "_type": "user", "_id": "1"
        },
        {
            "_index":"user_admin", "_type":"user", "_id": "2"
        }
   ]
}
```

响应内容

```java
{
  "docs" : [
    {
      "_index" : "user",
      "_type" : "user",
      "_id" : "1",
      "_version" : 1,
      "found" : true,
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
      "_id" : "2",
      "_version" : 1,
      "found" : true,
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
```

## 批量 API ( Bulk )

批量API 通过在单个请求中进行多个索引/删除操作来批量上载或删除 JSON 对象

可以在URL 上添加 _bulk 路径参数来启用批量 API，这部分的内容我们就不多做介绍，因为前面的章节中我们已经学习过了
