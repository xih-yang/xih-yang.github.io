# 13、ElasticSearch 实战：使用bulk进行批量增删改
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/13.html
- 分类：搜索引擎
- 分组：教程目录
使用bulk语法可以进行批量增删改操作，bulk语法有严格的要求，每个json串不能换行，两个json串必须换行，下面演示下

```java
#删除
POST /_bulk
{ "delete": { "_index": "test_index", "_type": "test_type", "_id": "1" }} 
```

```java
#强制创建
POST /_bulk
{ "create": { "_index": "test_index", "_type": "test_type", "_id": "1" }}
{ "test_field":    "create test" }
```

```java
#不存在则创建，存在则替换，执行put操作
POST /_bulk
{ "index":  { "_index": "test_index", "_type": "test_type", "_id": "1" }}
{ "test_field":    "index test" }
```

```java
#更新,执行partial update操作
POST /_bulk
{ "update": { "_index": "test_index", "_type": "test_type", "_id": "1", "_retry_on_conflict" : 3} }
{ "doc" : {"test_field" : "update test"} }
```

我们也可以把增删改放在1个请求里面

```java
POST /_bulk
{ "delete": { "_index": "test_index", "_type": "test_type", "_id": "1" }} 
{ "create": { "_index": "test_index", "_type": "test_type", "_id": "1" }}
{ "test_field":    "create test" }
{ "index":  { "_index": "test_index", "_type": "test_type", "_id": "1" }}
{ "test_field":    "index test" }
{ "update": { "_index": "test_index", "_type": "test_type", "_id": "1", "_retry_on_conflict" : 3} }
{ "doc" : {"test_field" : "update test"} }
```

需要注意的是，bulk请求会把document加载到内存，如果一次批量操作的数据过大反而会影响性能。我们可以从1000-5000条数据开始尝试增加。如果看大小的话最好控制在5-15M。
