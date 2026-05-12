# 21、ElasticSearch 实战：摄取节点 - 参数转换处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/21.html
- 分类：搜索引擎
- 分组：教程目录
## 字节转换处理器(Bytes Processor)

**处理器作用**

将可读的字节值(如1kb)转换为其实际的字节数值值(如1024)。可读的字节单位包含“b”、“kb”、“mb”、“gb”、“tb”、“pb”。

此单位不区分大小写。如果字段中单位不符合支持的内容，或者结果大于2^63，则会出现错误。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

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
  "bytes": {
    "field": "file.size"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试将`foo`内容转换为具体字节值

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "字节转换处理器",
        "processors": [
            {
                "bytes": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": "1B"
            }
        },
        {
            "_index": "1",
            "_id": "2",
            "_source": {
                "foo": "1kb"
            }
        },
        {
            "_index": "1",
            "_id": "2",
            "_source": {
                "foo": "1mB"
            }
        }
    ]
}
```

可以看到`foo`字段内容已经转换为字节数值，并且其转换时忽略单位的大小写的。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : 1
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:39:34.48485Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "2",
        "_source" : {
          "foo" : 1024
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:39:34.484859Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "2",
        "_source" : {
          "foo" : 1048576
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:39:34.484862Z"
        }
      }
    }
  ]
}
```

**使用错误的单位管道会抛出错误信息**

下面例子中使用`on_failure`来捕获错误，并打印错误信息到`error`字段

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "字节转换处理器",
        "processors": [
            {
                "bytes": {
                    "field": "foo",
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
                "foo": "1bB"
            }
        }
    ]
}
```

错误信息被设置在`error`字段中

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "error" : """For input string: \"1b\"""",
          "foo" : "1bB"
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:50:20.815827Z"
        }
      }
    }
  ]
}
```

## 类型转换处理器(Convert Processor)

**处理器作用**

将输入的文档字段转换为另外一种数据类型，如果字段的值是一个数组，将会将其内部成员进行转换。

类型转换只支持的数据类型：integer, long, float, double, string, boolean, and auto。

如果指定字符串转换为布尔值的时候，如果其字符串值为true(忽略大小写)，则将返回true，如果其字符串值为false(忽略大小写)，则返回false。其他内容则会抛出异常。

指定转换为auto则尝试将字符串值字段转换为最近的非字符串类型。比如“true”的字段将被转换为布尔类型:true。如果提供的字段不能进行适当的转换，转换处理器仍然会成功地处理并保持字段值不变。在这种情况下，target_field仍然会使用未转换的字段值进行更新。在auto中float优先于double。值“242.15”将“自动”转换为类型为float的242.15。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

type
必填
-
需要转换的目标数据类型

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
PUT _ingest/pipeline/my-pipeline-id
{
  "description": "converts the content of the id field to an integer",
  "processors" : [
    {
      "convert" : {
        "field" : "id",
        "type": "integer"
      }
    }
  ]
}
```

使用`_simulate`模拟此处理器效果，尝试将`foo`内容转换为整数。提供了两个文档数据，第一个可以正确转换成整数，第二个则不可以。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "类型转换处理器",
        "processors": [
            {
                "convert": {
                    "field": "foo",
                    "type": "integer",
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
                "foo": "1000",
                "boo": "1000"
            }
        },
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": "1000L"
            }
        }
    ]
}
```

此时的返回内容中第二条文档数据并没有被转换，且录入的一条错误记录。而第一条记录中`foo`已经被转换为1000的整数表示，而`boo`字段依旧是1000的字符串表示。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "boo" : "1000",
          "foo" : 1000
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:54:43.864673Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "error" : """For input string: \"1000L\"""",
          "foo" : "1000L"
        },
        "_ingest" : {
          "timestamp" : "2019-12-03T01:54:43.864681Z"
        }
      }
    }
  ]
}
```

## 日期转换处理器(Date Processor)

**处理器作用**

将字段内容按照日期格式进行解析，默认情况下，日期处理器将解析后的日期添加为一个名为@timestamp的新字段。也可以通过`target_field`配置指定不同的字段，其支持多种日期格式，会按照顺序尝试解析date字段。其顺序取决于处理器定义的顺序。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

formats
必填
-
预期日期格式，数组类型。可以是java时间模式，也可以是下列格式之一:ISO8601、UNIX、UNIX_MS或TAI64N

timezone
非必填
UTC
解析日期时使用的时区。支持模板片段

locale
非必填
ENGLISH
解析日期时使用的语言环境，解析月名或星期名时使用的语言环境。支持模板片段。

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
  "description" : "...",
  "processors" : [
    {
      "date" : {
        "field" : "initial_date",
        "target_field" : "timestamp",
        "formats" : ["dd/MM/yyyy hh:mm:ss"],
        "timezone" : "Europe/Amsterdam"
      }
    }
  ]
}
```

需要注意的是此时`formats`为数组格式，处理器会根据提供的日期格式依次去尝试解析文档内容为日期格式。现在尝试使用`_simulate`模拟此处理器效果，尝试将`foo`和`boo`内容转换为不同时区的内容。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "日期转换处理器",
        "processors": [
            {
                "date": {
                    "field": "foo",
                    "target_field": "foo",
                    "formats": [
                        "yyyy-MM-dd HH:mm:ss"
                    ],
                    "timezone": "Europe/London"
                }
            },
            {
                "date": {
                    "field": "boo",
                    "target_field": "boo",
                    "formats": [
                        "yyyy-MM-dd HH:mm:ss"
                    ],
                    "timezone": "Asia/Shanghai"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": "2019-12-06 21:00:00",
                "boo": "2019-12-06 21:00:00"
            }
        }
    ]
}
```

返回内容中可以看到根据设置`timezone`的不同返回了不同的结果

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "boo" : "2019-12-06T21:00:00.000+08:00",
          "foo" : "2019-12-06T21:00:00.000Z"
        },
        "_ingest" : {
          "timestamp" : "2019-12-06T13:28:40.77367Z"
        }
      }
    }
  ]
}
```

**注意关于locale参数的设置**

在此处理器设置参数`locale`的时候，官方文档写的默认值为`ENGLISH`,而我尝试设置此参数为`ENGLISH`的时候系统会抛出下面的错误

```java
Couldn't find 3-letter language code for english
```

后来我尝试使用三字母的国家编码（GBR-英国，USA-美国，CHN-中国）之后错误才消失。

## JSON对象转换处理器(JSON Processor)

**处理器作用**

将文档字段中JSON字符串解析成JSON对象的处理器

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

target_field
非必填
field
需要将处理之后的内容赋值的目标字段，默认情况下将就地更新

add_to_root
非必填
false
该标记强制将序列化的json注入文档的根节点。选择此选项时，不能设置target_field。

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

JSON字符串中的对象将被解析成JSON支持的类型(null、boolean、number、array、object、string)。

所有json支持的类型都将被解析(null、boolean、number、array、object、string)。

此处理器的格式

```java
{
  "json" : {
    "field" : "string_source",
    "target_field" : "json_target"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试将`foo`的JSON字符串解析为JSON对象。下面例子中将`foo`字段中的内容按照JSON对象进行解析

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "JSON对象处理器",
        "processors": [
            {
                "json": {
                    "field": "foo",
                    "target_field": "foo_json"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": "{\"user\":\"大风\"}"
            }
        }
    ]
}
```

上面的请求返回的内容，中JSON字符串中的`user`被解析到了`foo_json`字段下面。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo_json" : {
            "user" : "大风"
          },
          "foo" : """{
     "user":"大风"}"""
        },
        "_ingest" : {
          "timestamp" : "2019-12-06T13:00:47.457056Z"
        }
      }
    }
  ]
}
```

此处理器提供了一个`add_to_root`参数，使用此参数的时候需要不能设置`target_field`。这个时候解析的内容会直接添加到文档的根节点下。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "user" : "大风",
          "foo" : """{
     "user":"大风"}"""
        },
        "_ingest" : {
          "timestamp" : "2019-12-06T13:06:27.29748Z"
        }
      }
    }
  ]
}
```

## URL解码处理器(URL Decode Processor)

**处理器作用**

对文档中URL-decodes进行解码转换成字符串

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

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

这是一个比较简单的处理器，主要是将被UrlEncode编码的内容进行解码。

此处理器的格式

```java
{
  "urldecode": {
    "field": "my_url_to_decode"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试将`foo`的内容进行解码

请求内容

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "URL-decodes解码处理器",
        "processors": [
            {
                "urldecode": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "1",
            "_id": "1",
            "_source": {
                "foo": "https%3A%2F%2Fblog.csdn.net%2Fqq330983778"
            }
        }
    ]
}
```

此时可以看到地址已经被处理了

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "foo" : "https://blog.csdn.net/qq330983778"
        },
        "_ingest" : {
          "timestamp" : "2019-12-06T13:07:41.211474Z"
        }
      }
    }
  ]
}
```
