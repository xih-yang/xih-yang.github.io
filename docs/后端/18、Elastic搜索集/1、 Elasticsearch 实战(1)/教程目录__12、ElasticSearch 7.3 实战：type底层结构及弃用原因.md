# 12、ElasticSearch 7.3 实战：type底层结构及弃用原因
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/12.html
- 分类：搜索引擎
- 分组：教程目录
### 1、type是什么

type，是一个index中用来区分类似的数据的。类似的数据，但是可能有不同的fields，而且有不同的属性来控制索引建立、分词器、field的value。

在底层的lucene中建立索引的时候，全部是opaque bytes类型，不区分类型的。

lucene是没有type的概念的，在document中，实际上将type作为一个document的field来存储，即type。

ElasticSearch通过type来进行type的过滤和筛选。

### 2、es中不同type存储机制

一个index中的多个type，实际上是放在一起存储的，因此一个index下，不能有多个type重名，而类型或者其他设置不同的，因为那样是无法处理的。注意：下面语句博主没有实验过，只是浏览了一遍，加深自己的理解。

```java
{
   "goods": {
      "mappings": {
         "electronic_goods": {
            "properties": {
               "name": {
                  "type": "string",
               },
               "price": {
                  "type": "double"
               },
               "service_period": {
                  "type": "string"
                   }            
                }
         },
         "fresh_goods": {
            "properties": {
               "name": {
                  "type": "string",
               },
               "price": {
                  "type": "double"
               },
               "eat_period": {
                    "type": "string"
               }
                }
         }
      }
   }
}
```

```java
PUT /goods/electronic_goods/1
{
  "name": "小米空调",
  "price": 1999.0,
  "service_period": "one year"
}
```

```java
PUT /goods/fresh_goods/1
{
  "name": "澳洲龙虾",
  "price": 199.0,
  "eat_period": "one week"
}
```

es文档在底层的存储是这样子的

```java
{
   "goods": {
      "mappings": {
        "_type": {
          "type": "string",
          "index": "false"
        },
        "name": {
          "type": "string"
        }
        "price": {
          "type": "double"
        }
        "service_period": {
          "type": "string"
        },
        "eat_period": {
          "type": "string"
        }
      }
   }
}
```

底层数据存储格式

```java
{
  "_type": "electronic_goods",
  "name": "小米空调",
  "price": 1999.0,
  "service_period": "one year",
  "eat_period": ""
}
```

```java
{
  "_type": "fresh_goods",
  "name": "澳洲龙虾",
  "price": 199.0,
  "service_period": "",
  "eat_period": "one week"
}
```

### 3、type弃用

同一索引下，不同type的数据也会存储其他type的field的大量空值，造成资源浪费。所以，不同类型数据，要放到不同的索引中。在es9中，将会彻底删除type。
