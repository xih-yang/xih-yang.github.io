# 23、ElasticSearch 实战：摄取节点 - 需要配合业务逻辑的处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/23.html
- 分类：搜索引擎
- 分组：教程目录
#### 需要配合业务逻辑的处理器

**此类处理器没有对值的修改和解析，但是会执行某些行为，类似循环、异常处理相关，需要配合实际业务逻辑的处理**。此类处理器主要包含

**1. Date Index Name Processor**

该处理器可以根据文档中的日期或者时间戳将文档指向基于时间的索引。处理器根据设置的索引名称前缀，将文档中的日期或者时间戳用日期数学索引名称表达式设置到索引元数据中。

**2. Drop Processor**

将符合条件的文档从请求中剔除出去，防止文档在某些情况下创建索引。

**3. Fail Processor**

此处理器用于把符合条件的管道失败并返回特定消息到请求者。

**4. Foreach Processor**

当数组中所有的元素都需要以相同的方式处理，这个时候为每个元素定义处理器就变得非常麻烦。而使用foreach处理器可以通过指定数组元素的字段以及每个元素的处理方式来对整个数组进行操作。

**5. Pipeline Processor**

此处理器可以根据条件将某些处理委托给指定的管道进行处理。

## 日期格式索引名称处理器(Date Index Name Processor)

**处理器作用**

该处理器可以根据文档中的日期或者时间戳将文档指向基于时间的索引。处理器根据设置的索引名称前缀，将文档中的日期或者时间戳用日期数学索引名称表达式设置到索引元数据中。

**1、** 首先、该处理器从文档中的字段获取日期或时间戳；

**2、** 然后，根据设置格式来解析为日期；

**3、** 然后，将这个日期、提供的索引名称前缀和提供的日期舍入格式化为一个日期数学索引名称表达式；

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

index_name_prefix
非必填
-
索引名的前缀，要在打印日期之前加上前缀。支持模板片段。

date_rounding
必填
-
如何在将日期格式化为索引名时将日期四舍五入。有效值为:y(年)，M(月)，w(周)，d(日)，h(小时)，M(分钟)和s(秒)。支持模板片段。

date_formats
非必填
yyyy-MM-dd’T’HH:mm:ss.SSSXX
用于解析正在预处理的文档中的日期/时间戳的预期日期格式的数组。可以是java时间模式，也可以是下列格式之一:ISO8601、UNIX、UNIX_MS或TAI64N。

timezone
非必填
UTC
解析日期时使用的时区。支持模板片段

locale
非必填
ENGLISH
解析日期时使用的语言环境，解析月名或星期名时使用的语言环境。支持模板片段。

index_name_format
非必填
yyyy-MM-dd
将解析后的日期打印到索引名时使用的格式。这里需要一个有效的java时间模式。支持模板片段。

if
非必填
-
处理器的执行条件逻辑

on_failure
非必填
-
处理器发生异常后执行的逻辑

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

```java
{
  "description": "monthly date-time index naming",
  "processors" : [
    {
      "date_index_name" : {
        "field" : "date1",
        "index_name_prefix" : "myindex-",
        "date_rounding" : "M"
      }
    }
  ]
}
```

**使用例子**

Date Index Name Processor处理器会将经过的文档索引进行修改，但是修改并非是随意的。一般是一个固定的前缀索引+日期。此处理器主要是用于某类需要通过时间将数据存储在不同索引的某一类索引。此类索引保存的时候数据被保存在`{index}-{date}`的单个索引中，但是可以使用`{index}-*`去查询。

下面两个文档中索引都保持一致的，但是设置其`date`参数的不一致，然后进过`date_index_name`处理器处理。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "日期格式索引名称处理器",
        "processors": [
            {
                "date_index_name": {
                    "field": "date",
                    "index_name_prefix": "myindex-",
                    "date_rounding": "M"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "date": "2019-12-10T12:02:01.789Z",
                "foo":"1"
            }
        },
        {
            "_id": 2,
            "_index": 2,
            "_source": {
                "date": "2019-11-10T12:02:01.789Z",
                "foo":"2"
            }
        }
    ]
}
```

虽然两个文档原始索引一致，但是因为其时间不同，在经过处理器处理后的结果中，文档数据因为时间不同而被分到了不同的索引之中。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "<myindex-{2019-12-10||/M{yyyy-MM-dd|UTC}}>",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "date" : "2019-12-10T12:02:01.789Z",
          "foo" : "1"
        },
        "_ingest" : {
          "timestamp" : "2019-12-10T02:46:02.117644Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "<myindex-{2019-11-10||/M{yyyy-MM-dd|UTC}}>",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "date" : "2019-11-10T12:02:01.789Z",
          "foo" : "2"
        },
        "_ingest" : {
          "timestamp" : "2019-12-10T02:46:02.117648Z"
        }
      }
    }
  ]
}
```

## 丢弃处理器(Drop Processor)

**处理器作用**

将符合条件的文档从请求中剔除出去，防止文档在某些情况下创建索引。

**可选参数**

字段
是否必填
默认值
说明

if
非必填
-
处理器的执行条件逻辑

on_failure
非必填
-
处理器发生异常后执行的逻辑

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

```java
{
  "drop": {
    "if" : "ctx.network_name == 'Guest'"
  }
}
```

**使用例子**

Drop Processor处理器的作用是将符合条件的文档从管道中丢弃出去。这个处理器本身并不对数据进行干预。但是它可以让管道中后续的处理器忽略掉此文档的操作。需要注意的是，在多个处理器的时候Drop处理器只能让之后的处理器忽略此文档的操作，而之前已经执行的处理器逻辑并不会取消。

下面例子中，文档先经过一个小写处理器，然后再经过Drop处理器，后续经过大写处理器。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "丢弃处理器",
        "processors": [
            {
                "lowercase": {
                    "field": "foo"
                }
            },
            {
                "drop": {
                    "if": "ctx.foo == 'abc'"
                }
            },
            {
                "uppercase": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "foo": "aBc"
            }
        },
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "foo": "def"
            }
        }
    ]
}
```

在其返回内容中可以发现，第一个文档中的`foo`内容被小写了，但是并没有进入Drop之后的处理器逻辑。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : "abc"
        },
        "_ingest" : {
          "timestamp" : "2019-12-10T03:24:26.181718Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : "DEF"
        },
        "_ingest" : {
          "timestamp" : "2019-12-10T03:24:26.181723Z"
        }
      }
    }
  ]
}
```

## 失败逻辑处理器(Fail Processor)

**处理器作用**

此处理器用于把符合条件的管道失败并返回特定消息到请求者。

**可选参数**

字段
是否必填
默认值
说明

message
必填
-
需要处理器抛出的异常消息

if
非必填
-
处理器的执行条件逻辑

on_failure
非必填
-
处理器发生异常后执行的逻辑

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

```java
{
  "fail": {
    "if" : "ctx.tags.contains('production') != true",
    "message": "The production tag is not present, found tags: {
     {tags}}"
  }
}
```

**使用例子**

Fail Processor主要是当我们发现一些符合条件的数据时候，人为的抛出异常结束此条文档的业务逻辑，和Drop Processor相同的是，在Fail Processor执行前经过的处理器逻辑会被保留，而之后的处理器逻辑就无法执行。

下面一个类似于`Drop Processor`的例子，只是将`Drop Processor`换成了`fail`

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "丢弃处理器",
        "processors": [
            {
                "lowercase": {
                    "field": "boo"
                }
            },
            {
                "fail": {
                    "if": "ctx.foo == 'abc'",
                    "message": "进入了异常处理"
                }
            },
            {
                "uppercase": {
                    "field": "foo"
                }
            }
        ],
        "on_failure": [
            {
                "set": {
                    "field": "coo",
                    "value": "错误信息"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "foo": "abc",
                "boo": "ABC"
            }
        }
    ]
}
```

返回结果中可以看到，异常已经产生，`boo`参数已经被修改了，但是最后的`foo`参数却没能被修改。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "boo" : "abc",
          "eoo" : "错误信息",
          "foo" : "ABC"
        },
        "_ingest" : {
          "timestamp" : "2019-12-10T09:46:30.481189Z"
        }
      }
    }
  ]
}
```

## 循环逻辑处理器(Foreach Processor)

**处理器作用**

当数组中所有的元素都需要以相同的方式处理，这个时候为每个元素定义处理器就变得非常麻烦。而使用foreach处理器可以通过指定数组元素的字段以及每个元素的处理方式来对整个数组进行操作。

其处理器在数组元素的上下文中工作，并将其放入了_ingest元数据中。如果数组元素是一个JSON对象，它将保存该JSON对象的素有字段。如果数组元素是一个值，则那个值会被保存到_ingest下的_value中。注意，如果一个处理器在foreach处理器之前使用_ingest。那么，指定的值对于foreach处理器中的处理器是不可用的。foreach处理器确实会还原原始值，所以该值在foreach pro之后对处理器可用

请注意，与所有其他处理器一样，文档中的任何其他字段都是可访问和可修改的。这个处理器只是将当前数组元素读入_ingest。_value摄取元数据属性，以便对其进行预处理。

如果foreach处理器无法处理数组中的元素，并且没有指定on_failure处理器，那么它将中止执行并保留数组不变。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

processor
非必填
-
需要对每个元素进行的操作

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

if
非必填
-
处理器的执行条件逻辑

on_failure
非必填
-
处理器发生异常后执行的逻辑

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

注意此循环处理的处理器内部需要配置参数`processor`一个处理逻辑才能发挥作用

```java
{
    "foreach": {
        "field": "foo",
        "processor": {
            "uppercase": {
                "field": "_ingest._value"
            }
        }
    }
}
```

**使用例子**

根据官方API此参数只接受一个处理器的处理。并且`foreach`循环中被循环的内容会被放入`_ingest._value`中，下面的例子就是尝试将`foo`数组中的元素转换为大写。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "循环逻辑处理器",
        "processors": [
            {
                "foreach": {
                    "field": "foo",
                    "processor": {
                        "uppercase": {
                            "field": "_ingest._value"
                        }
                    }
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "foo": ["abc","def","hij"]
            }
        }
    ]
}
```

上面请求返回的结果是这样的。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : [
            "ABC",
            "DEF",
            "HIJ"
          ]
        },
        "_ingest" : {
          "_value" : null,
          "timestamp" : "2019-12-10T03:16:59.183902Z"
        }
      }
    }
  ]
}
```

## 管道委托处理器(Pipeline Processor)

**处理器作用**

此处理器可以根据条件将某些处理委托给指定的管道进行处理。

**可选参数**

字段
是否必填
默认值
说明

name
必填
-
需要被委托的管道名

if
非必填
-
处理器的执行条件逻辑

on_failure
非必填
-
处理器发生异常后执行的逻辑

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

```java
"processors" : [
    {
      "set" : {
        "field": "inner_pipeline_set",
        "value": "inner"
      }
    }
  ]
```

**使用例子**

关于管道委托，在最开始介绍[摄取节点](/zhuanlan/search/elasticsearch/7/18.html)的时候就已经介绍过了。管道委托类似于SpringMVC中的controller负责业务的分发工作。
