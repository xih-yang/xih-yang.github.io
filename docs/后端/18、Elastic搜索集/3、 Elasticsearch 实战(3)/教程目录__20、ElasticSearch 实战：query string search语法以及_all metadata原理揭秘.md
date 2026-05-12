# 20、ElasticSearch 实战：query string search语法以及_all metadata原理揭秘
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/20.html
- 分类：搜索引擎
- 分组：教程目录
### 1、query string语法

```java
#1和2效果是一样的，查询test_type下test_field字段中包含test关键字的document
(1) GET /test_index/test_type/_search?q=test_field:test
(2) GET /test_index/test_type/_search?q=+test_field:test
#查询test_type下test_field字段中不包含test关键字的document
(3) GET /test_index/test_type/_search?q=-test_field:test
```

### 2、_all metadata的语法及原理

语法

```java
#查询test_type下任意一个field包含test关键字的document
GET /test_index/test_type/_search?q=test
```

难道是对test_type中的每一个field都进行一次搜索吗？不是的

原理是

使用了es中的_all元数据，我们插入一条document，它里面包含了多个field，在建立倒排索引时，es会自动将多个field的值全部串联起来成为一个长的字符串，作为_all field的值，同时建立索引

举个例子

```java
{
  "name": "jack",
  "age": 26,
  "email": "test@qq.com",
  "address": "guangzhou"
}
```

这个document会被拼接成"jack 26 test@qq.com guangzhou"，作为这一条document的_all field的值。同时进行分词后建立对应的倒排索引。

在使用GET /test_index/test_type/_search?q=test进行查询时会用test去_all field的值匹配。
