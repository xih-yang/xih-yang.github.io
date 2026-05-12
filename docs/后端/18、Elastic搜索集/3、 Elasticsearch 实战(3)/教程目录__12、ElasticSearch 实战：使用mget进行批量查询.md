# 12、ElasticSearch 实战：使用mget进行批量查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/12.html
- 分类：搜索引擎
- 分组：教程目录
### 1、为什么要批量查询

假如我们要查100个document，一个一个id查的话，需要发送100次网络请求，占用网络开销，用mget进行批量查询的话，只要发送1次网络请求，网络开销减小100倍。

### 2、mget的语法

#### (1) 同一index同一type

```java
GET /test_index/test_type/_mget
{
   "ids": [1, 2]
}
```

#### (2) 同一index不同type

```java
GET /test_index/_mget
{
   "docs" : [
      {
         "_type" :  "test_type",
         "_id" :    1
      },
      {
         "_type" :  "test_type2",
         "_id" :    2
      }
   ]
}
```

#### (3) 不同idex

```java
GET /_mget
{
   "docs" : [
      {
         "_index" : "test_index",
         "_type" :  "test_type",
         "_id" :    1
      },
      {
         "_index" : "test_index2",
         "_type" :  "test_type2",
         "_id" :    2
      }
   ]
}
```
