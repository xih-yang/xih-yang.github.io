# 14、ElasticSearch 实战：(底层原理) ES内部如何处理不同type的数据
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/14.html
- 分类：搜索引擎
- 分组：教程目录
## 1 type的作用

在Elasticsearch的索引(index)中, 通过标识元字段`_type`来区分不同的type, 所以我们可以把具有相同字段(field)的文档划分到同一个type下.

==>因而`_type`也称作映射类型, 即每个type都有各自的mapping.

但即使是类似的数据, 也有可能存在不同的field, 比如:

> 商品中有电子商品有电压field;
>
> 服装商品有洗涤方式field;
>
> 生鲜商品有营养成分field… 这些不同的field要如何处理呢?

==>在之前的博文中有提到过: **同一index的不同type中, 同名的field的映射配置必须相同.** 这是为什么呢?

## 2 type的底层数据结构

Elasticsearch底层所使用的核心工具库——Lucene中并没有type的说法, 它在建立索引的时候, 会把所有field的值当做opaque bytes(不透明字节)类型来处理:

> 在存储document时, ES会将该document所属的type作为一个type字段进行存储;
>
> 在搜索document时, ES通过_type来进行过滤和筛选.

**每个index中的所有type都是存储在一起的**, 因此:

> 在Elasticsearch 6.0之前: 同一个index的不同type中, 同名的field的映射配置(_type)必须相同.
>
> 在Elasticsearch 6.0开始: 一个index中不能拥有多个type.

## 3 探究type的存储结构

说明:**从Elasticsearch 6.0开始, 不允许在一个index中创建多个type ——只能创建一个**, 否则将发生错误:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "illegal_argument_exception",
        "reason": "Rejecting mapping update to [website] as the final mapping would have more than 1 type: [manager, writer]"
      }
    ],
    "type": "illegal_argument_exception",
    "reason": "Rejecting mapping update to [website] as the final mapping would have more than 1 type: [manager, writer]"
  },
  "status": 400
}
```

这里演示所用的版本是6.6.0, 特此说明.

## 3.1 创建索引并配置映射

```java
PUT website
{
    "mappings": {      // Elasticsearch 6.0之后的版本中, 只添加这一个type
        "writer": {
            "properties": {
                "id": { "type": "long" },
                "name": { "type": "text" },
                "age": { "type": "integer" },
                "sex": { "type": "text", "index": false }
            }
        }, 
        "manager": {   // 省去此type
            "properties": {
                "id": { "type": "long" },
                "name": { "type": "text" },
                "age": { "type": "integer" },
                "sex": { "type": "text", "index": false }, 
                "authorize": { "type": "text", "index": false}
            }
        }
    }
}
```

## 3.2 添加数据

```java
PUT website/writer/1
{
    "id": 1001,
    "name": "tester",
    "age": 18,
    "sex": "female"
}
// Elasticsearch 6.0之后的版本中, 不添加下述文档:
PUT website/manager/1
{
    "id": 1001,
    "name": "shou feng",
    "age": 20,
    "sex": "male",
    "authorize": "all"
}
```

## 3.3 查看存储结构

```java
// 搜索所有数据
GET website/_search
// 搜索结果如下:
{
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "website",
        "_type" : "writer",    // _type是writer
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "id" : 1001,
          "name" : "tester",
          "age" : 18,
          "sex" : "female"
        }
      },
      {
        "_index": "website",
        "_type": "manager",			// _type为manager
        "_id": "1",
        "_score": 1,
        "_source": {
          "id": 1001,
          "name": "shou feng",
          "age": 20,
          "sex": "male",
          "authorize": "all"
        }
      }
    ]
  }
}
```

## 4 关于type的最佳实践

**将结构类似的type存放在同一个index下 —— 这些type的大部分field应该是相同的.**

如果将两个field完全不同的type存入同一个index下, 在Lucene底层存储时, 每个document中都将有一大部分field是空值, 这将导致严重的性能问题, 并且占用磁盘空间:

例如:上述`website/writer`的每个document中, 都有"authorize"字段, 只是它们的值都为空.

——从这个角度出发, 大概就能猜出 **ES限制一个index中只能有一个type** 的原因了吧, 也就是更方便地组织文档数据、节省磁盘空间😊
