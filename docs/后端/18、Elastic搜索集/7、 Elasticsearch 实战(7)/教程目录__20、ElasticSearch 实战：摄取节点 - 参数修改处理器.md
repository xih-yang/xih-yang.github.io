# 20、ElasticSearch 实战：摄取节点 - 参数修改处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/20.html
- 分类：搜索引擎
- 分组：教程目录
## 参数修改处理器

**第一类主要是对文档中字段的值进行处理或者修改的处理器。此类处理器主要包含**。

此类处理器主要包含

**1. HTML Strip Processor**

**2. Lowercase Processor**

**3. Uppercase Processor**

**4. Trim Processor**

**5. Set Processor**

**6. Gsub Processor**

### HTML标签处理器(HTML Strip Processor)

**处理器作用**

此处理器的作用是将字段中的HTML标签移除

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

此处理器的使用方法

```java
{
  "html_strip": {
    "field": "foo"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试取出`foo`字段的HTML标签

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "HTML标签移除",
        "processors": [
            {
                "html_strip": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "<a>foo1<a>",
                "boo": "<a>foo1<a>"
            }
        },
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "<b>foo2<b>",
                "boo": "<b>foo2<b>"
            }
        }
    ]
}
```

可以看到`foo`字段的HTML标签已经去除

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "<a>foo1<a>",
          "foo" : "foo1"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T01:29:08.515257Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "<b>foo2<b>",
          "foo" : "foo2"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T01:29:08.515305Z"
        }
      }
    }
  ]
}
```

### 小写处理器(Lowercase Processor)

**处理器作用**

此处理器的作用是将字段中的字符串转换为其等效的小写形式。

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

此处理器的使用方法

```java
{
  "lowercase": {
    "field": "foo"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试取出`foo`字段的内容转换为小写

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "小写处理器",
        "processors": [
            {
                "lowercase": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "ASDFqweZXC",
                "boo": "ASDFqweZXC"
            }
        }
    ]
}
```

可以看到`foo`字段的内容都已经转换为小写

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "ASDFqweZXC",
          "foo" : "asdfqwezxc"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T01:35:04.552224Z"
        }
      }
    }
  ]
}
```

### 大写处理器(Uppercase Processor)

**处理器作用**

此处理器的作用是将字段中的字符串转换为其等效的大写形式。

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

此处理器的使用方法

```java
{
  "uppercase": {
    "field": "foo"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试将`foo`字段的内容转换为大写

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "大写处理器",
        "processors": [
            {
                "uppercase": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "asdfqwezxc",
                "boo": "asdfqwezxc"
            }
        }
    ]
}
```

可以看到`foo`字段的内容都已经转换为大写

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "asdfqwezxc",
          "foo" : "ASDFQWEZXC"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T01:37:11.040605Z"
        }
      }
    }
  ]
}
```

### 双端空字符移除处理器(Trim Processor)

**处理器作用**

此处理器的作用是将字段内容开头和结尾处的空白字符删除。

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

此处理器的使用方法

```java
{
  "trim": {
    "field": "foo"
  }
}
```

使用`_simulate`模拟此处理器效果，尝试删除`foo`字段开头和结尾处的空白字符

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "空字符移除",
        "processors": [
            {
                "trim": {
                    "field": "foo"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": " qwea sdzxc  ",
                "boo": " qweas dzxc "
            }
        }
    ]
}
```

可以看到`foo`字段的内容开头和结尾处的空白字符都已经被删除

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : " qweas dzxc ",
          "foo" : "qwea sdzxc"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T02:03:28.427413Z"
        }
      }
    }
  ]
}
```

### 值设置处理器(Set Processor)

**处理器作用**

此处理器的作用是将指定内容的值设置到指定的字段中。

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
要为字段设置的值，支持模板片段。

override
非必填
true
处理器将使用预先存在的非空值字段更新字段。当设置为false时，这些字段将不会被操作

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
  "description" : "值设置处理器"
  "set": {
    "field": "count",
    "value": 1
  }
}
```

使用`_simulate`模拟此处理器效果，尝试设置`foo`字段的值

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "值设置处理器",
        "processors": [
            {
                "set": {
                    "field": "foo",
                    "value": "默认值"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": " qwea sdzxc  ",
                "boo": " qweas dzxc "
            }
        }
    ]
}
```

可以看到`foo`字段的内容已经被设置为之前确定的值

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : " qweas dzxc ",
          "foo" : "默认值"
        },
        "_ingest" : {
          "timestamp" : "2019-12-02T02:11:51.905641Z"
        }
      }
    }
  ]
}
```

该处理器还可用于将数据从一个字段复制到另一个字段。例如

```java
PUT _ingest/pipeline/set_os
{
  "description": "sets the value of host.os.name from the field os",
  "processors": [
    {
      "set": {
        "field": "host.os.name",
        "value": "{
     {os}}"
      }
    }
  ]
}
POST _ingest/pipeline/set_os/_simulate
{
  "docs": [
    {
      "_source": {
        "os": "Ubuntu"
      }
    }
  ]
}
```

返回结果

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "host" : {
            "os" : {
              "name" : "Ubuntu"
            }
          },
          "os" : "Ubuntu"
        },
        "_ingest" : {
          "timestamp" : "2019-11-01T21:54:37.909224Z"
        }
      }
    }
  ]
}
```

### Gsub处理器(Gsub Processor)

**处理器作用**

通过应用正则表达式和替换来转换字符串字段。如果字段不是字符串，处理器将抛出异常。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
要将替换应用到的字段

pattern
必填
-
要替换的模式

replacement
必填
-
要替换匹配模式的字符串

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
    "gsub": {
        "field": "message",
        "pattern": "\\.",
        "replacement": "-"
    }
}
```

使用`_simulate`模拟此处理器效果，尝试设置`message`字段的值中的`.`替换为`-`

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "...",
        "processors": [
            {
                "gsub": {
                    "field": "message",
                    "pattern": "\\.",
                    "replacement": "-"
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "message": "name.time"
            }
        }
    ]
}
```

返回结果

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "message" : "name-time"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T09:39:10.508147Z"
        }
      }
    }
  ]
}
```

> 个人水平有限，上面的内容可能存在没有描述清楚或者错误的地方，假如开发同学发现了，请及时告知，我会第一时间修改相关内容。假如我的这篇内容对你有任何帮助的话，
>
> 麻烦给我点一个赞。你的点赞就是我前进的动力。
