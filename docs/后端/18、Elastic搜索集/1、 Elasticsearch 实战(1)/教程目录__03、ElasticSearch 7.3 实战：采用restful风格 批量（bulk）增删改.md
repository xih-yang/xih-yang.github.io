# 03、ElasticSearch 7.3 实战：采用restful风格 批量（bulk）增删改
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/3.html
- 分类：搜索引擎
- 分组：教程目录
Bulk 操作是将文档的增删改查一些列操作，通过一次请求全都做完。目的是减少网络传输次数。

语法：

```java
POST /_bulk
{"action": {"metadata"}}
{"data"}
```

如下操作，创建14，创建5，删除5，更新14

```java
POST /_bulk
{ "create": { "_index": "test_index",  "_id": "14" }}
{ "test_field": "test14" }
{ "create": { "_index": "test_index",  "_id": "5" }}
{ "test_field": "test14" }
{ "delete": { "_index": "test_index",  "_id": "5" }} 
{ "update": { "_index": "test_index",  "_id": "14"} }
{ "doc" : {"test_field" : "bulk test"} }
```

结果

```java
{
  "took" : 1520,
  "errors" : false,
  "items" : [
    {
      "create" : {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "14",
        "_version" : 1,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 0,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "create" : {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "5",
        "_version" : 1,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 1,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "delete" : {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "5",
        "_version" : 2,
        "result" : "deleted",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 2,
        "_primary_term" : 1,
        "status" : 200
      }
    },
    {
      "update" : {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "14",
        "_version" : 2,
        "result" : "updated",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 3,
        "_primary_term" : 1,
        "status" : 200
      }
    }
  ]
}
```

总结：

为啥不采用Java里面传统的Json对象去实现批量操作，原因为解析Json字符串的时候，会保留一个比较大的Json对象放在Java内存中，大数据量的时候明显不可取。因此按照普通字符串读取就OK了。

**1、** 功能：；

- delete：删除一个文档，只要1个json串就可以了
- create：相当于强制创建 PUT /index/type/id/_create
- index：普通的put操作，可以是创建文档，也可以是全量替换文档
- update：执行的是局部更新partial update操作

**2、** 格式：每个json不能换行相邻json必须换行；

**3、** 隔离：每个操作互不影响操作失败的行会返回其失败信息；

**4、** 实际用法：bulk请求一次不要太大，否则一下积压到内存中，性能会下降所以，一次请求几千个操作、大小在几M正好；
