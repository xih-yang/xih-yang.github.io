# 10、ElasticSearch 实战：partial update的原理和使用
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/10.html
- 分类：搜索引擎
- 分组：教程目录
### 1、什么是partial update?

我们用document的全量替换来对比一下partial update。全量替换时，我们需要把document里的所有field给到es进行替换，而partial update只需要把document id和需要更新的部分字段给到es就行，两种方式对document的修改结果是一样的。

既然如此那为何还要用partial update呢？我画个图对比下

我们可以直观的看到全量替换document时，如果document过大，会占用更多网络带宽和磁盘io，因此整个查询更新的时间间隔会更长，产生并发冲突(留到下一篇讲)的几率也会更大。

事实上全量替换和partial update两种方式都需要先查询全量document后全量写入的，全量替换的方式是由我们程序查询后再写入，而partial update的方式全量查询和全量写入都是发生在es一个shard内部，避免了网络开销，也有效减少了并发冲突。

### 2、partial update如何使用

先写入一条测试数据

```java
PUT /product/book/1
{
  "product_name": "yuwen shu",
  "num": 10
}
```

用全量替换的方式进行更新test_field2字段是这样的

```java
PUT /product/book/1
{
  "product_name": "yuwen shu",
  "num": 11
}
```

而用partial update更新test_field2字段是这样的

```java
POST /product/book/1/_update
{
  "doc": {
    "num": 12
  }
}
```

### 3、基于groovy脚本进行partial update

es有个内置的脚本支持，可以基于groovy脚本进行各种复杂操作，那么基于groovy脚本怎么进行partial update呢

```java
POST /product/book/1/_update
{
   "script" : "ctx._source.num+=1"
}
```

此时num变成了12+1=13
