# 12、ElasticSearch 实战：如何配置使用ES的动态映射 (dynamic mapping)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/12.html
- 分类：搜索引擎
- 分组：教程目录
> 写在前面: 本文涉及到的演示以ES 6.6.0版本, 其他版本可能存在不同, 还请读者朋友们注意.

## 1 动态映射(dynamic mapping)

## 1.1 什么是动态映射

动态映射时Elasticsearch的一个重要特性: 不需要提前创建iindex、定义mapping信息和type类型, 你可以 **直接向ES中插入文档数据时, ES会根据每个新field可能的数据类型, 自动为其配置type等mapping信息**, 这个过程就是动态映射(dynamic mapping).

Elasticsearch动态映射的示例:

字段内容(field)
映射的字段类型(type)

true | false
boolean

1234
long

123.4
float

2018-10-10
date

"hello world"
text

> 说明: 动态映射虽然方便, 可并不直观, 为了个性化自定义相关设置, 可以在添加文档之前, 先创建index和type, 并配置type对应的mapping, 以取代动态映射.
>
> mapping的配置可参考博文: [ES 11 - 如何配置Elasticsearch的映射 (mapping)][ES 11 - _Elasticsearch_ _mapping].

## 1.2 体验动态映射

(1)插入如下数据:

> 如果已有website索引, 先删除DELETE blog , 再执行下面的插入操作: .

```java
PUT blog/_doc/1
{
    "blog_id": 10001,
    "author_id": 5520,
    "post_date": "2018-01-01",
	  "title": "my first blog",
	  "content": "my first blog in the website"
}
PUT blog/_doc/2
{
    "blog_id": 10002,
    "author_id": 5520,
    "post_date": "2018-01-02",
    "title": "my second blog",
    "content": "my second blog in the website"
}
PUT blog/_doc/3
{
    "blog_id": 10003,
    "author_id": 5520,
    "post_date": "2018-01-03",
    "title": "my third blog",
    "content": "my third blog in the website"
}
```

(2)进行如下检索测试:

**注意这里结果数是3的情况.**

```java
GET blog/_search?q=2018                 // 1条结果, 5.6之前的版本是3条结果
GET blog/_search?q=2018-01-01           // 1条结果, 5.6之前的版本是3条结果
GET blog/_search?q=post_date:2018       // 1条结果
GET blog/_search?q=post_date:2018-01-01	// 1条结果
```

(3)查看ES自动建立的mapping:

```java
GET blog/_mapping
// 结果如下:
{
  "blog" : {                  // index是blog
    "mappings" : {
      "_doc" : {              // type是_doc - 方便后期升级版本
        "properties" : {
          "author_id" : {
            "type" : "long"
          },
          "blog_id" : {
            "type" : "long"
          },
          "content" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "post_date" : {
            "type" : "date"  // 日期"2018-01-01"被自动识别为date类型
          },
          "title" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          }
        }
      }
    }
  }
}
```

## 1.3 搜索结果不一致的原因分析

如果使用的是ES 5.6.x之前的版本, [1.2]节中搜索结果会不一致, 这是因为:

**ES自动建立mapping时, 为不同的field映射了不同的数据类型, 而不同数据类型在分词、搜索等行为上也是不同的.**

我们通过`q=xxx`的方式搜索, 底层是从每个文档的`_all`字段中进行匹配的 —— **ES默认将每个文档的所有field的值抽取到一个名为_all的元字段中**.

官方文档指出, **从6.0+版本开始, _all字段就被禁止使用了, 建议我们使用copy_to实现相似的功能**.—— 也就是说, 如果`_all`字段被关闭, 就不会出现搜索结果不一致的情况.

(1)`GET website/blog/_search?q=2018`

id=1的文档的`_all`的值为:

```java
2018-01-01 my first blog my first blog in the website 5520
```

说明: `_all`字段将所有的值作为字符串索引, 所以日期被索引为年、月、日三个值, `_all`字段的倒排索引结果如下:

doc1
doc2
Doc3

2018
*
*
*

01
*
*
*

02

*

03

*

此项搜索中, ES是从`_all`字段中检索, 3个文档中都有 `2018` , 所以结果数是3.

(2)`GET website/blog/?q=2018-01-01`

> 同(1), ES也是从_all字段中检索, 结果数同样是3.

(3)`GET website/blog/_search?q=post_date:2018-01-01`

此检索指定了检索条件, ES将从post_date字段中检索, 而post_date被映射为date类型, 所以将进行精确匹配.

而date类型的字段索引的内容有其默认的固定格式. `post_date`字段的倒排索引结果如下:

doc1
doc2
doc3

2018-01-01 00:00:00 UTC
*

2018-01-02 00:00:00 UTC

*

2018-01-03 00:00:00 UTC

*

可以看出, 满足条件的只有1个结果, 即doc1.

(4)`GET /_search?q=post_date:2018`

> 这是ES 5.x版本中做的一个优化, 搜索post_date:01等是不会出现结果的, 搜索2018会出现第一条结果.

## 2 开启dynamic mapping动态映射策略

## 2.1 约束策略

策略
功能说明

true
开启 —— 遇到陌生字段时, 进行动态映射

false
关闭 —— 忽略遇到的陌生字段

strict
遇到陌生字段时, 作报错处理

## 2.2 策略示例

(1)使用不同的约束策略:

```java
PUT blog_user
{
  "mappings": {
      "_doc": {
          "dynamic": "strict",			// 严格控制策略
          "properties": {
              "name": { "type": "text" },
              "address": {
                  "type": "object",
                  "dynamic": "true"		// 开启动态映射策略
              }
          }
      }
  }
}
```

(2)插入数据演示:

```java
// 插入数据时多添加一个字段
PUT blog_user/1
{
    "name": "shou feng",
    "content": "this is my blog",  // 多添加的字段
    "address": {
        "province": "guangdong",
        "city": "guangzhou"
    }
}
```

将抛出如下错误信息:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "strict_dynamic_mapping_exception",
        // 错误原因: 不允许动态添加field
        "reason": "mapping set to strict, dynamic introduction of [content] within [_doc] is not allowed"
      }
    ],
    "type": "strict_dynamic_mapping_exception",
    "reason": "mapping set to strict, dynamic introduction of [content] within [_doc] is not allowed"
  },
  "status": 400
}
```

添加符合约束的数据, 操作就能成功:

```java
PUT blog_user/_doc/1
{
    "name": "shou feng",
    "address": {
        "province": "guangdong",
        "city": "guangzhou"
    }
}
```

(3)查看映射信息:

```java
GET user/_mapping
// 映射信息如下: 
{
  "blog_user" : {
    "mappings" : {
      "_doc" : {
        "dynamic" : "strict",      // 严格约束条件
        "properties" : {
          "address" : {
            "dynamic" : "true",    // 开启动态映射策略
            "properties" : {
              "city" : {
                "type" : "text",
                "fields" : {
                  "keyword" : {
                    "type" : "keyword",
                    "ignore_above" : 256
                  }
                }
              },
              "province" : {
                "type" : "text",
                "fields" : {
                  "keyword" : {
                    "type" : "keyword",
                    "ignore_above" : 256
                  }
                }
              }
            }
          },
          "name" : {
            "type" : "text"
          }
        }
      }
    }
  }
}
```

## 3 定制dynamic mapping策略

## 3.1 date_detection - 日期识别策略

对于date类型的数据, Elasticsearch有其默认的识别策略, 比如"yyyy-MM-dd". 存在这种情况:

**1、** 第一次添加文档时, 某个field是类似"2018-01-01"的值, 其类型就动态映射成date;

**2、** 后期再次添加文档, 该field是类似"hello world"的值, ES就会因为类型不匹配而报错.

为解决这一问题, 可以手动关闭某个type的date_detection; 如果不需要关闭, 建议手动指定这个field为date类型. 示例如下:

```java
PUT blog_user/_mapping/_doc
{
    "date_detection": false
}
```

## 3.2 在type中自定义动态映射模板

(1)在type中定义动态映射模板(dynamic mapping template) —— 把所有的String类型映射成text和keyword类型:

> 先删除已有的blog_user索引: DELETE blog_user, 再执行下述命令:

```java
PUT blog_user
{
    "mappings": {
        "_doc": {
            "dynamic_templates": [
                {
                    "en": {       // 动态模板的名称
                        "match": "*_en",           // 匹配名为"*_en"的field
                        "match_mapping_type": "string",
                        "mapping": {
                            "type": "text",        // 把所有的string类型, 映射成text类型
                            "analyzer": "english", // 使用english分词器
                            "fields": {
                                "raw": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        }
                    }
                }
            ]
        }
    }
}
```

(2)添加数据:

```java
PUT blog_user/_doc/1
{
    "name": "the first register user"
}
PUT blog_user/_doc/2
{
    "name_en": "the second register user"
}
```

(3)检索数据:

```java
// 有结果: "name"没有匹配到任何动态模板, 默认使用standard分词器
GET blog_user/_search
{
    "query": {
        "match": {"name": "the"}
    }
}
// 无结果: "name_en"匹配到了动态模板, 使用english分词器, the是停用词, 被过滤掉了
GET blog_user/_search
{
    "query": {
        "match": {"name_en": "the"}	
    }
}
```

说明:

> 这里的match_mapping_type的类型支持 [object, string, long, double, boolean, date, binary], 若使用text将抛出如下错误信息:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "mapper_parsing_exception",
        "reason": "Failed to parse mapping [_doc]: No field type matched on [text], possible values are [object, string, long, double, boolean, date, binary]"
      }
    ],
    "type": "mapper_parsing_exception",
     "reason": "Failed to parse mapping [_doc]: No field type matched on [text], possible values are [object, string, long, double, boolean, date, binary]",
     "caused_by": {
       "type": "illegal_argument_exception",
       "reason": "No field type matched on [text], possible values are [object, string, long, double, boolean, date, binary]"
     }
   },
   "status": 400
 }
```

> 在6.0之前的版本, 将抛出如下过期的警告信息:

```java
 Deprecation: match_mapping_type [text] is invalid and will be ignored: 
 No field type matched on [text], possible values are [object, string, long, double, boolean, date, binary]
```

## 3.3 [过期]在index中自定义默认映射模板

`_default mapping` - 默认映射模板是类似于全局变量的存在, 对当前配置的索引起作用.

**默认映射模板在Elasticsearch 6.x版本中已经不再支持**, 因为6.0版本开始, 每个索引只能有一个类型, 因此默认模板没有存在的意义了.

下面的演示过程, 是在6.0之前的版本上的测试.

(1)在index中定义默认映射模板(default mapping template):

> 先删除已有的blog_user索引: DELETE blog_user, 再执行下述命令:

```java
PUT blog_user
{
    "mappings": {
        "_default_": {
            "_all": { "enabled":  false }
        },
        "_doc": {
            "_all": { "enabled":  true  }
        }
    }
}
```

(2)动态映射可以和索引模板(Index Templates)配合使用.

无论是自动创建Index, 还是手动显式创建Index, 索引模板都可以用来配置新索引的默认mappings(映射)、settings(配置项)和aliases(别名). 具体使用方法请参考博客: [ES 10 - 如何使用Elasticsearch的索引模板(index template)][ES 10 - _Elasticsearch_index template]
