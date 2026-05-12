# 11、ElasticSearch 实战：配置ES的映射 (mapping)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/11.html
- 分类：搜索引擎
- 分组：教程目录
## 1 映射的相关概念

## 1.1 什么是映射

(1)映射(mapping): 定义index的元数据, 指定要索引并存储的文档的字段类型.

> 也就是说映射决定了Elasticsearch在建立倒排索引、进行检索时对文档采取的相关策略, 如数字类型、日期类型、文本类型等等.

需要注意的是: **检索时用到的分析策略, 要和建立索引时的分析策略相同, 否则将导致数据不准确.**

(2)ES对不同的类型有不同的存储和检索策略.

**1、** 比如: 对full text型的数据类型(如text), 在索引时, 会经过各类处理 (包括分词、normalization(时态转换、同义词转换、大小写转换)等处理), 才会建立到索引数据中.

**2、** 再比如: 对exact value(如date), 在索引的分词阶段, 会将整个value作为一个关键词建立到倒排索引中.

## 1.2 映射的组成

每个index都有一 (至多) 个type, 每个type对应一个mapping.

> 在Elasticsearch 6.X版本开始, 1个index只能有1个type.

每个mapping都由下述部分组成:

**1、** 元字段: `_index`、`_type`、`_id` 和 `_source`.

**2、** field/properties(字段或属性): **同一index中, 同名的field的映射配置必须相同**

> a) 因为index是根据_type元字段来区分type的, 也就是存储的每个文档中都有_type等元字段, 如果相同名称的field的映射(_type字段的值)不同, Elasticsearch在解析时就会出现冲突.
>
> b) 这些参数可以例外: copy_to、dynamic、enabled、ignore_above、include_in_all.

关于type的处理方法, 可以参考博客: ES XX - Elasticsearch对type的处理（type的底层结构）.

## 1.3 元字段

每个文档都有与之关联的元数据 —— ES内部为所有的文档配备的field, 都是以下划线`_`开头的内置字段.

具体的内容请参考博文 ES XX - Elasticsearch的元字段 中详细讲解.

## 1.4 字段的类型

Elasticsearch中每个field都对应一至多个数据类型.

详细的内容请参考博文 ES XX - Elasticsearch中字段的类型 中详细讲解.

## 2 如何配置mapping

## 2.1 创建mapping

(1)必读说明:

**1、** 创建mapping时, 可以指定每个field是否需要:

> 索引: "index": true —— 默认配置
>
> 不索引: "index": false

**2、**`mapping root object`:

每个type对应的mapping的JSON串, 包括`properties, metadata(_id, _source, _type) , settings(analyzer) , 其他settings(如include_in_all)`

(2)创建mapping的示例:

**需求: 创建名为website的索引, 包含一个user类型. user类型中禁用元字段_all.**

```java
PUT website
{
    "mappings": {
        "user": {       // 这就是一个root object
            "_all": { "enabled": false },  // 禁用_all字段
            "properties": {
                "user_id": { "type": "text" },
            	  "name": {
                    "type": "text",
                    "analyzer": "english"
                },
                "age": { "type": "integer" },
                "sex": { "type": "keyword" },
                "birthday": {
                    "type": "date", 
                    "format": "strict_date_optional_time||epoch_millis"
                },
                "address": {
                    "type": "text",
                    "index": false         // 不分词
                }
            }
        }
    }
}
```

(3)过期提示说明 —— 这里使用的是Elasticsearch 6.6.0版本:

**1、** 是否索引的API已经做了修改, 若使用"analyzed" | "not_analyzed" | "yes" | "no"等, 将抛出如下警告:

>

```java
! Deprecation: Expected a boolean [true/false] for property [index] but got [not_analyzed]
! Deprecation: Expected a boolean [true/false] for property [index] but got [no]
```

>

**2、**`_all`元字段也将在7.0版本中移除, 它建议我们使用`copy_to`定制自己的`all field`:

>

```java
! Deprecation: [_all] is deprecated in 6.0+ and will be removed in 7.0. As a replacement, you can use [copy_to] on mapping fields to create your own catch all field.
```

## 2.2 更新mapping

(1)必读说明:

- 映射一旦创建完成, 就不允许修改:

—— Elasticsearch对文档的分析、存储、检索等过程, 都是严格按照mapping中的配置进行的. 如果允许后期修改mapping, 在检索时对索引的处理将存在不一致的情况, 导致数据检索行为不准确.

- **只能在创建index的时候手动配置mapping, 或者新增field mapping, 但是不能update field mapping.**

(2)更新mapping出现异常:

- 修改已经创建好的mapping

```java
PUT website
{
    "mappings": {
        "user": {
            "properties": {
                "author_id": { "type": "text" }
            }
        }
    }
}
```

- 抛出如下错误 —— 索引已经存在的异常:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "resource_already_exists_exception",
        "reason": "index [website/mVYk4-a7RMOZbkcCp2avfw] already exists",
        "index_uuid": "mVYk4-a7RMOZbkcCp2avfw",
        "index": "website"
      }
    ],
    "type": "resource_already_exists_exception",
    "reason": "index [website/mVYk4-a7RMOZbkcCp2avfw] already exists",
    "index_uuid": "mVYk4-a7RMOZbkcCp2avfw",
    "index": "website"
  },
  "status": 400
}
```

(3)向已有mapping中添加字段及其映射信息:

```java
PUT website/_mapping/user		// 修改user类型的_mapping, 注意API的顺序
{
    "properties": {
        "new_field": {
            "type": "text",
            "index": false
        }
    }
}
```

## 2.3 查看mapping

(1)查看mapping的API:

```java
GET website/_mapping
```

(2)查看的结果信息如下:

```java
{
  "website" : {
    "mappings" : {
      "user" : {
        "_all" : {
          "enabled" : false        // 禁用元字段_all
        },
        "properties" : {
          "address" : {
            "type" : "text",
            "index" : false        // 不索引
          },
          "age" : {
            "type" : "integer"
          },
          "birthday" : {
            "type" : "date"
          },
          "name" : {
            "type" : "text",
            "analyzer" : "english"
          },
          "new_field" : {          // 后期添加的新字段
            "type" : "text",
            "index" : false        // 不索引
          },
          "sex" : {
            "type" : "keyword"
          },
          "user_id" : {
            "type" : "text"
          }
        }
      }
    }
  }
}
```
