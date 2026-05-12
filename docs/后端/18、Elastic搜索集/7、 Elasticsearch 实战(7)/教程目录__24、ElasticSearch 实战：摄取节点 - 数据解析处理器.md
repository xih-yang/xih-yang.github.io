# 24、ElasticSearch 实战：摄取节点 - 数据解析处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/24.html
- 分类：搜索引擎
- 分组：教程目录
## 解析处理

**此类主要是对文档中字段内容进行解析，根据指定的格式获取字段内容中的数据**。此类处理器主要包含

**1. Dissect Processor**

此处理器根据预设的格式从文档中的单个文本字段中提取结构化字段。dissect不使用正则表达式。这使得dissect语法简单，在某些情况下比Grok处理器更快

**2. Dot Expander Processor**

此处理器将文档字段中带`.`的内容展开为对象，该处理器允许名称中带有`.`的字段可由管道中的其他处理器访问。这些内容在被其处理之前，其他处理器无法访问这些字段。

**3. GeoIP Processor**

此处理器根据Maxmind数据库中的数据添加关于IP地址地理位置的信息

**4. Grok Processor**

此处理器从文档中的单个文本字段中提取结构化字段。

**5. KV Processor**

此处理器帮助自动解析键值对类型的消息(或特定的事件字段)。

## 详情解析处理器(Dissect Processor)

**处理器作用**

根据预设的格式从文档中的单个文本字段中提取结构化字段。dissect不使用正则表达式。这使得dissect语法简单，在某些情况下比Grok处理器更快

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

pattern
必填
-
该字段的解析模式

append_separator
非必填
“”(空字符串)
分割字段的字符

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

Dissect Processor根据设定的格式尝试从一段字符串中提取出其数据内容。

下面的解析格式尝试解析数据。

```java
## 解析格式
%{
     clientip} %{
     ident} %{
     auth} [%{
     @timestamp}] \"%{
     verb} %{
     request} HTTP/%{
     httpversion}\" %{
     status} %{
     size}
## 数据
1.2.3.4 - - [30/Apr/1998:22:00:52 +0000] \"GET /english/venues/cities/images/montpellier/18.gif HTTP/1.0\" 200 3171
```

最后会解析出下面的内容。

```java
"doc": {
  "_index": "_index",
  "_type": "_type",
  "_id": "_id",
  "_source": {
    "request": "/english/venues/cities/images/montpellier/18.gif",
    "auth": "-",
    "ident": "-",
    "verb": "GET",
    "@timestamp": "30/Apr/1998:22:00:52 +0000",
    "size": "3171",
    "clientip": "1.2.3.4",
    "httpversion": "1.0",
    "status": "200"
  }
}
```

### 解析修饰符

在Dissect Processor中可以使用一些关键词修饰符合，键修饰符可以在%{和}内部的%{keyname}的左边或右边找到。

符号
名称
方向
用法
说明

->
右填充
(far) right
%{keyname1->}
将任何重复的字符跳到右边

+
追加操作
left
%{+keyname} %{+keyname}
Appends two or more fields together

+ with /n
顺序追加操作
left and right
%{+keyname/2} %{+keyname/1}
按指定的顺序将两个或多个字段追加在一起

?
忽略匹配
left
%{?ignoreme}
跳过输出中匹配的值。与%{}相同的行为

* and &
Reference keys
left
%{*r1} %{&r1}
设置输出键值为*，输出值为&

#### 右填充(->)

默认情况下`%{key1} %{key2}`中间存在一个空格，其只会匹配key1和key2中存在一个空格的数据，当两个字段中空格数不为1则无法匹配。

使用`%{key1->} %{key2}`，其可以匹配多个空格。

**使用格式**

```java
%{
     ts->} %{
     level}
```

**使用例子**

下面例子中`message`中两个文字中间被多个`*`隔开，在不使用`->`的时候是无法匹配到正确的内容，而使用`->`会将中间重复的字符默认为1个字符

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "详情解析处理器",
        "processors": [
            {
                "dissect": {
                    "field": "message",
                    "pattern": "%{message1-1}*%{message1-2}"
                }
            },
            {
                "dissect": {
                    "field": "message",
                    "pattern": "%{message2-1->}*%{message2-2}"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message": "这是消息1***这是消息2"
            }
        }
    ]
}
```

在返回结果中可以看到第二个处理器成功执行了数据的解析，而第一个处理器则没有，官方文档中使用的是空格的例子，而这里使用的是`*`是想强调，其可以针对多种符号，在实际中我们可以用此处理器进行更加灵活的内容解析。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "message1-1" : "这是消息1",
          "message1-2" : "",
          "message2-1" : "这是消息1",
          "message2-2" : "这是消息2",
          "message" : "这是消息1***这是消息2"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T13:33:15.538653Z"
        }
      }
    }
  ]
}
```

#### 追加操作(+)和顺序追加操作

使用`(+)`可以将多个解析出来的数据定义到同一个参数下。值从左到右追加。可以指定追加分隔符。而通过最后的`(/{num}})`我们可以来确定数据最终出现的顺序。

**匹配格式-追加操作**

```java
%{
     +name} %{
     +name} %{
     +name} %{
     +name}
```

**匹配格式-顺序追加操作**

```java
%{+name/2} %{+name/4} %{+name/3} %{+name/1}
```

**请求处理**

下面例子中直接使用顺序追加的方式解析下面的数据。使用`---`内容拼接相关最后结果

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "详情解析处理器",
        "processors": [
            {
                "dissect": {
                    "field": "message",
                    "pattern": "%{+message/4} %{+message/3} %{+message/2} %{+message/1}",
                    "append_separator":"---"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message": "数据1 数据2 数据3 数据4"
            }
        }
    ]
}
```

**返回结果**

在返回结果中可以看到数据已经按照上面设计的顺序重新拼接的数据

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "message" : "数据4---数据3---数据2---数据1"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T02:24:16.97587Z"
        }
      }
    }
  ]
}
```

#### 忽略匹配(?)

Dissect支持在最终结果中忽略匹配。针对来源数据中一些数据我们可能不需要，这可以使用空键%{?}来完成，但是为了可读性，可能需要为空键指定一个名称。

**使用格式**

```java
%{
     clientip} %{
     ?ident} %{
     ?auth} [%{
     @timestamp}]
```

**使用例子**

下面例子中我们尝试忽略三个数据中第二个数据的内容。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "详情解析处理器",
        "processors": [
            {
                "dissect": {
                    "field": "message",
                    "pattern": "%{message2} %{?ignore} %{message1}",
                    "append_separator":"---"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message": "消息 忽略消息 消息"
            }
        }
    ]
}
```

**返回内容**

再其返回内容中最终只解析了`message`字段中两端（第一个、第三个）的内容

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "message" : "消息 忽略消息 消息",
          "message2" : "消息",
          "message1" : "消息"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T02:28:15.136339Z"
        }
      }
    }
  ]
}
```

#### 键值对解析(* and &)

剖析支持使用解析值作为结构化内容的键/值对。假设系统部分地记录了键/值对。参考键允许您维护键/值关系

**使用格式**

```java
 %{
     *p1}:%{
     &p1}
```

**使用例子**

下面例子中尝试解析`message`字段中的内容，将其根据`:`解析为参数名和参数值

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "详情解析处理器",
        "processors": [
            {
                "dissect": {
                    "field": "message",
                    "pattern": "%{*name}:%{&name}"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message": "name:详情解析处理器"
            }
        }
    ]
}
```

**返回结果**

在最后结果可以看到数据被成功解析出`name`字段以及其值

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "name" : "详情解析处理器",
          "message" : "name:详情解析处理器"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T02:32:24.81747Z"
        }
      }
    }
  ]
}
```

## 点解析处理器(Dot Expander Processor)

**处理器作用**

将文档字段中带`.`的内容展开为对象，该处理器允许名称中带有`.`的字段可由管道中的其他处理器访问。这些内容在被其处理之前，其他处理器无法访问这些字段。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
需要操作的字段

path
非必填
-
包含要展开的字段的字段。仅当要展开的字段是另一个对象字段的一部分时才需要，因为字段选项只能理解叶字段。

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
  "dot_expander": {
    "field": "foo.bar"
  }
}
```

**使用例子**

下面例子中`dot_expander`尝试将`message.name`解析为`message`参数下`name`参数。默认情况解析出来的内容会放到文档的根目录下，当你设置了`path`属性，其会添加到`path`路径下

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "点解析处理器",
        "processors": [
            {
                "dot_expander": {
                    "field": "message.name"
                }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message.name": "点解析处理器"
            }
        }
    ]
}
```

**返回内容**

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "message" : {
            "name" : "点解析处理器"
          }
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T09:18:47.704014Z"
        }
      }
    }
  ]
}
```

当解析出来的数据结构的内容中已经存在参数，处理器并不会执行覆盖而是将字段转换为数组然后将新值添加进去。就像下面这样

```java
## 原始数据
"_source": {
	"message.name": "点解析处理器",
	"message": {
		"name": "点解析处理器2"
	}
}
## 解析后数据
"_source" : {
  "message" : {
	"name" : [
	  "点解析处理器2",
	  "点解析处理器"
	]
  }
},
```

## 键值对解析处理器(KV Processor)

**处理器作用**

此处理器将文档中的数据根据预设的参数对分隔符(`field_split`)以及键值分隔符(`value_split`)解析成一组或者多组的数据

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
要处理的字段

field_split
必填
-
用于分割键值对的正则表达式模式

value_split
必填
-
用于从键-值对中的值中分离键的正则表达式模式

target_field
非必填
null
要将转换后的值赋给的字段，默认情况下将就地更新

include_keys
非必填
null
要筛选和插入到文档中的键的列表。默认包括所有键

exclude_keys
非必填
null
要从文档中排除的键的列表

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

prefix
非必填
null
要添加到提取的键的前缀

trim_key
非必填
null
从提取的键中修剪的字符串

trim_value
非必填
null
要从提取的值中修剪的字符字符串

strip_brackets
非必填
false
如果真带括号()，<>，[]以及引号’和"从提取的值

if
非必填
-
执行这个处理器的条件

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

处理器格式

```java
{
  "kv": {
    "field": "message",
    "field_split": " ",
    "value_split": "="
  }
}
```

**使用例子**

下面例子中尝试解析键值对`=`分割，参数为空格分割的数据。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "点解析处理器",
        "processors": [
            {
              "kv": {
                "field": "message",
                "field_split": " ",
                "value_split": "="
              }
            }
        ]
    },
    "docs": [
        {
            "_id": 1,
            "_index": 1,
            "_source": {
                "message": "ip=1.2.3.4 error=REFUSED"
            }
        }
    ]
}
```

返回内容

在返回内容中可以看到`message`中成功解析出了`ip`和`error`的值

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "1",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "message" : "ip=1.2.3.4 error=REFUSED",
          "error" : "REFUSED",
          "ip" : "1.2.3.4"
        },
        "_ingest" : {
          "timestamp" : "2019-12-11T09:28:53.341755Z"
        }
      }
    }
  ]
}
```
