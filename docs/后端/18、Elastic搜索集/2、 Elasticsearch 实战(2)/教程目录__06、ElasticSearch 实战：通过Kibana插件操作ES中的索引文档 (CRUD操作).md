# 06、ElasticSearch 实战：通过Kibana插件操作ES中的索引文档 (CRUD操作)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/6.html
- 分类：搜索引擎
- 分组：教程目录
> 向ES中添加文档时, ES会根据文档中各个字段的类型, 自动推测并创建映射(mapping), 这是比Solr灵活的地方;
>
> 这在大部分情况下是可用的, 但生产环境中不建议如此使用: 应该根据业务需求定制mapping映射. 关于定制mapping, 请参考后续文章.

## 1 创建、删除索引

## 1.1 创建索引

```java
# 创建索引API: 
PUT test_index?pretty
# 响应信息如下:
#! Deprecation: the default number of shards will change from [5] to [1] in 7.0.0; 
# if you wish to continue using the default of [5] shards, you must manage this on the create index request or with an index template
{
  "acknowledged": true,
  "shards_acknowledged": true,
  "index": "test_index"
}
# 查看集群中的索引: 
health status index        uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   test_index   hMeJ-M9pSHSXl0t39OedYw   5   1          0            0      1.2kb          1.2kb
yellow open   .kibana_1    4q7ELvdcTVilW3UwtMWqeg   1   0         18            0     78.5kb         78.5kb
```

> 过时说明:
>
> 在创建索引时, Elasticsearch提出过时警告: 从7.0.0版本开始, 默认的Shard个数将从[5]变为[1].
>
> 如果要继续使用默认的[5]个分片(Shard), 就需要在创建Index时指定, 或者通过索引模板创建Index.
>
> 关于创建Index时指定分片个数的方法, 参见后续的博文.

## 2.2 删除索引

```java
# 删除索引API:
DELETE test_index?pretty
# 响应信息如下: 
{
  "acknowledged": true
}
```

## 2 document的结构

ES是一款面向文档的数据搜索、分析引擎. document结构说明:

> (1) 基于面向对象的开发思想, 应用系统中的数据结构都是很复杂的: 对象中嵌套对象, 如CRM系统中的客户对象中, 还会嵌入客户相关的企业对象.
>
> (2) 对象数据存储到数据库中, 需要分解, 将嵌套对象分解为扁平的多张表数据, 每次操作时需要还原回对象格式, 过程繁琐.
>
> (3) ES存储的是JSON格式的文档, 基于此, ES可以提供复杂的索引, 全文检索, 分析聚合等功能.
>
> (4) document格式示例:

```java
{
    "id": "5220",
    "name": "张三",
    "sex": "男",
    "age": 25, 
    "phone": 13312345678, 
    "email": "zhangsan@163.com",
    "company": {
        "name": "Alibaba",
        "location": "杭州"
    },
    "join_date": "2018/11/01"
}
```

> 接下来以电商系统中的搜索子系统为例, 演示对文档的操作方法.

## 3 添加文档

(1)添加API:

```java
PUT index/type/id
{
  "JSON格式的文档数据"
}
```

> 说明: ES会自动创建PUT API中指定的index和type, 不需要提前创建;
>
> 而且ES默认对document的每个field都建立倒排索引, 保证它们都可以被检索.

(2)添加示例:

```java
PUT book_shop/it_book/1
{
    "name": "Java编程思想",
    "author": "[美] Bruce Eckel",
    "category": "编程语言",
    "desc":  "Java学习必读经典,殿堂级著作！",
    "price":  109.0,
    "publisher": "机械工业出版社",
    "date": "2007-06-01",
    "tags": [ "Java", "编程语言" ]
}
```

(3)添加之后的响应信息:

```java
{
    "_index" : "book_shop",
    "_type" : "it_book",
    "_id" : "1",
    "_version" : 1,
    "result" : "created",   操作结果: created(创建)了索引
    "_shards" : {
        "total" : 2,
        "successful" : 1,
        "failed" : 0
    },
    "_seq_no" : 0,
    "_primary_term" : 1
}
```

(4)再添加如下数据:

```java
PUT book_shop/it_book/2
{
    "name": "深入理解Java虚拟机：JVM高级特性与最佳实践",
    "author": "周志明",
    "category": "编程语言",
    "desc":  "Java图书领域公认的经典著作",
    "price":  79.0,
    "date": "2013-10-01",
    "publisher": "机械工业出版社",
    "tags": [ "Java", "虚拟机", "最佳实践" ]
}
PUT book_shop/it_book/3
{
    "name": "Java并发编程的艺术",
    "author": "方腾飞，魏鹏，程晓明",
    "category": "编程语言",
    "desc":  "阿里系工程师的并发编程实践",
    "price":  59.0,
    "date": "2015-07-10",
    "publisher": "机械工业出版社",
    "tags": [ "Java", "并发编程" ]
}
```

## 4 查询文档

(1)检索API:

```java
GET index/type/id
```

(2)检索示例:

```java
GET book_shop/it_book/2
```

(3)检索的结果:

```java
{
  "_index" : "book_shop1",
  "_type" : "it_book",
  "_id" : "2",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "name" : "深入理解Java虚拟机：JVM高级特性与最佳实践",
    "author" : "周志明",
    "category" : "编程语言",
    "desc" : "Java图书领域公认的经典著作",
    "price" : 79.0,
    "date" : "2013-10-01",
    "publisher" : "机械工业出版社",
    "tags" : [
      "Java",
      "虚拟机",
      "最佳实践"
    ]
  }
}
```

## 5 修改文档

## 5.1 替换文档

(1)替换API - 与添加API相同, 只不过文档id要存在, 此时系统将判定为修改操作:

——无论文档数据是否存在修改, 对同一id的文档执行1次以上的PUT操作, 都是修改操作.

```java
PUT index/type/id
{
    "JSON格式的文档数据"
}
```

> 注意: 替换方式的不便之处: 必须填写要修改文档的所有field, 如果缺少, 修改后的文档中将丢失相关field.

(2)替换示例 - 为name添加了"（第4版）"

```java
PUT book_shop/it_book/1
{
    "name": "Java编程思想（第4版）",
    "author": "[美] Bruce Eckel",
    "category": "编程语言",
    "desc":  "Java学习必读经典,殿堂级著作！",
    "price":  109.0,
    "date": "2007-06-01",
    "publisher": "机械工业出版社",
    "tags": [ "Java", "编程语言" ]
}
```

(3)替换的结果信息:

```java
{
  "_index" : "book_shop",
  "_type" : "it_book",
  "_id" : "1",
  "_version" : 2,
  "result" : "updated",  // 操作结果: updated(修改)了索引
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 1,
  "_primary_term" : 1
}
```

## 5.2 更新文档

(1)更新API:

——通过`POST`和`_update`, 更新文档中的特定字段(field), 其他的字段不会改动.

```java
POST index/type/id/_update
{
    "doc": {
        "field u want to update": "new value of ur update's field"
    }
}
```

> 注意: 与替换方式相比, 更新方式的好处: 可以更新指定文档的指定field, 未指定的field也不会丢失.

(2)更新示例 - 将name改为英文:

```java
POST book_shop/it_book/1/_update
{
    "doc": {
        "name": "Thinking in Java(4th Edition) "
    }
}
```

(3)更新的结果信息:

```java
{
  "_index" : "book_shop",
  "_type" : "it_book",
  "_id" : "1",
  "_version" : 3,
  "result" : "updated",  // 操作结果: updated(修改)了索引
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 2,
  "_primary_term" : 1
}
```

**此时查看该文档 GET book_shop/it_book/1, 可以发现更新成功.**

## 6 删除文档

(1)删除API:

```java
DELETE index/type/id
```

(2)删除示例:

```java
DELETE book_shop/it_book/1
```

(3)删除的结果信息:

```java
{
  "_index" : "book_shop",
  "_type" : "it_book",
  "_id" : "1",
  "_version" : 4,
  "result" : "deleted",  // 操作结果: deleted(删除)了索引
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 3,
  "_primary_term" : 1
}
```

(4)删除确认: 再次查看删除的文档:

```java
GET book_shop/it_book/1
```

(5)确认的信息:

```java
{
  "_index" : "book_shop",
  "_type" : "it_book",
  "_id" : "1",
  "found" : false   // 没有查找到相关文档
}
```

> 为了后期演示的方便, 再次将该文档添加至索引中:

```java
PUT book_shop/it_book/1
 {
     "name": "Java编程思想（第4版）",
     "author": "[美] Bruce Eckel",
     "category": "编程语言",
     "desc":  "Java学习必读经典,殿堂级著作！",
     "price":  109.0,
     "date": "2007-06-01",
     "publisher": "机械工业出版社",
     "tags": [ "Java", "编程语言" ]
 }
```
