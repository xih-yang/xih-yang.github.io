# 22、ElasticSearch 实战：摄取节点 - 和数组相关的处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/22.html
- 分类：搜索引擎
- 分组：教程目录
## 数组内容处理

> 此内容主要包括下面四种处理器

**1、** AppendProcessor追加处理器；

**2、** JoinProcessor加入处理器；

**3、** SplitProcessor分割处理器；

**4、** SortProcessor排序处理器；

## 数组内容追加处理(Append Processor)

**处理器作用**

如果字段是一个数组，将指定的一个或多个值追加到现有字段中，如果不存在则创建包含所提供值的数组。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

value
必填
-
要追加的值。

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
  "append": {
    "field": "tags",
    "value": ["production", "{
     {app}}", "{
     {owner}}"]
  }
}
```

**使用例子**

Append Processor并不要求原始字段是否为数组，当发现字段为其他类型时，会将其转换为数组，然后将处理器中的值追加的后面。在下面的请求中，尝试对一个数组字段和整数字段执行`append`操作。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "数组内容追加处理",
        "processors": [
            {
                "append": {
                    "field": "foo",
                    "value": [
                        "append"
                    ]
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": 1
            }
        },
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": [
                    "foo"
                ]
            }
        }
    ]
}
```

其返回内容中可以看到，两个文档都被转换为了数组格式

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
            1,
            "append"
          ]
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T07:50:25.493016Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : [
            "foo",
            "append"
          ]
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T07:50:25.493031Z"
        }
      }
    }
  ]
}
```

## 数组内容拼接处理(Join Processor)

**处理器作用**

将字段中每个元素通过指定的分隔符进行拼接，返回拼接后的字符串。当指定的字段不是数组的时候会抛出异常。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

separator
必填
-
指定的分隔符号

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

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
  "join": {
    "field": "joined_array_field",
    "separator": "-"
  }
}
```

**使用例子**

join强制要求处理的字段为数组字段，否则会进入异常处理。但是ES并没有要求数组内元素一定是一种数据类型，可以存在不同的数据类型进行拼接。使用预先设置`separator`的值进行字符串拼接，此字段可以设置为""（仅仅进行字符串连接而没有连接符号），但是一定要设置此参数。在下面的请求中，尝试对两个文档内容使用此处理器，其中一个为数组字段，一个为字符串字段。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "数组内容拼接处理",
        "processors": [
            {
                "join": {
                    "field": "foo",
                    "separator": "-",
                    "on_failure": [
                        {
                            "set": {
                                "field": "error",
                                "value": "{
     { _ingest.on_failure_message }}"
                            }
                        }
                    ]
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": [
                    "elastic",
                    "search",
                    1
                ]
            }
        },
        {
            "_index": "2",
            "_id": "2",
            "_source": {
                "foo": "elasticsearch"
            }
        }
    ]
}
```

在返回内容中可以看到index为1的文档已经完成了字符串拼接，而index为2的文档产生的异常信息，且foo字段没有出现任何变化。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : "elastic-search-1"
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T08:01:42.459912Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "2",
        "_type" : "_doc",
        "_id" : "2",
        "_source" : {
          "error" : "field [foo] of type [java.lang.String] cannot be cast to [java.util.List]",
          "foo" : "elasticsearch"
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T08:01:42.459918Z"
        }
      }
    }
  ]
}
```

## 字符串切割处理(Split Processor)

**处理器作用**

使用分隔符将字段分割为数组。仅对字符串字段有效。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

separator
必填
-
指定的分隔符号

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

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

```java
{
  "split": {
    "field": "my_field",
    "separator": "\\s+" 
  }
}
```

``\s+`将所有连续的空白字符视为单个分隔符

查看7.X的文档时可以看到官方对此处理器提供了一个`preserve_trailing`参数，此参数的作用是如果设置了true则输入中的任何尾部空字段都将被保留。一个字段使用",“分割"a,b,c,”。如果没有启用则会解析为[“a”,“b”,"",“c”]。如果启用则解析为[“a”,“b”,"",“c”,""]。

注意：但是实际中在7.1-7.5的文档中此处理器都没有发现此参数配置，且在实际中（本人7.1版本）使用此参数会抛出异常，这一点暂时还不清楚

```java
processor [split] doesn't support one or more provided configuration parameters [preserve]
```

```java
{
  "split": {
    "field": "my_field",
    "separator": ","
  }
}
```

**使用例子**

split在分割字符串的时候会尝试省略掉尾部的空字符内容，但是在元素之间的空字符会被保留

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "字符串切割处理",
        "processors": [
            {
                "split": {
                    "field": "foo",
                    "separator": ","
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "foo": "apple,time,,cab,"
            }
        }
    ]
}
```

上面的请求返回内容是下面的内容，可以看到最后一个空白的内容被省略掉了，而元素中间的空白字符则被保留

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "foo" : [
            "apple",
            "time",
            "",
            "cab"
          ]
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T09:14:14.459187Z"
        }
      }
    }
  ]
}
```

## 数组内容排序处理(Sort Processor)

**处理器作用**

对数组中的元素进行排序，数字的同构数组将按数字顺序排序，而字符串数组或字符串+数字的异构数组将按字典顺序排序。当字段不是数组时抛出错误。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

order
非必填
“asc”
数组的排序方式

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

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
  "sort": {
    "field": "array_field_to_sort",
    "order": "desc"
  }
}
```

**使用例子**

Sort Processor的排序要求数组内的元素必须是相同的元素内容，可以都是整数（使用数字顺序排序），也可以使用字符串（使用字典顺序）。而使用整数和字符串混合的数组进行排序的时候会出现`class java.lang.String cannot be cast to class java.lang.Integer`或者`class java.lang.Integer cannot be cast to class java.lang.String`的异常。

下面的语句中尝试对整数数组和字符串数组进行排序

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "数组内容排序处理",
        "processors": [
            {
                "sort": {
                    "field": "foo",
                    "order": "desc",
                    "on_failure": [
                        {
                            "set": {
                                "field": "error",
                                "value": "{
     { _ingest.on_failure_message }}"
                            }
                        }
                    ]
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "foo": [
                    3,
                    4,
                    1
                ]
            }
        },
        {
            "_source": {
                "foo": [
                    "a1",
                    "b3",
                    "a2"
                ]
            }
        }
    ]
}
```

其返回内容中，对整数进行了数字排序，而字符串类型的数组则根据字符内容进行字典排序

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "foo" : [
            4,
            3,
            1
          ]
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T08:11:57.956089Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "foo" : [
            "b3",
            "a2",
            "a1"
          ]
        },
        "_ingest" : {
          "timestamp" : "2019-12-09T08:11:57.956097Z"
        }
      }
    }
  ]
}
```
