# 25、ElasticSearch 实战：摄取节点 - 安全用户、浏览器信息、自定义脚本处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/25.html
- 分类：搜索引擎
- 分组：教程目录
#### 安全用户、浏览器信息、自定义脚本处理器

**1. Script Processor**

此处理器允许在接收管道中执行内联和存储的脚本

**2. Set Security User Processor**

此处理器，将当前经过身份验证的用户的用户相关详细信息（如用户名、角色、电子邮件、全名和元数据）设置为当前文档。

**3. User Agent processor**

此处理器从浏览器随其web请求发送的用户代理字符串中提取详细信息。

## 自定义脚本处理器(Script Processor)

**处理器作用**

允许内联和存储的脚本在ingest管道中执行。脚本处理器利用已编译脚本的缓存来提高性能。由于在处理器中指定的脚本可能会根据每个文档重新编译，脚本缓存就变得非常重要。

**可选参数**

字段
是否必填
默认值
说明

lang
非必填
“painless”
脚本语言

id
非必填
-
要引用的存储脚本id

source
非必填
-
要执行的内联脚本

params
非必填
-
脚本参数

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

使用脚本执行处理的时候，文档中的数据被放在ctx变量下面。在处理逻辑中可以使用ctx来访问文档数据。执行此处理器的时候必须提供脚本`source`或者脚本ID`id`。此处理器的使用方式。

```java
{
	"script": {
		"lang": "painless",
		"source": 脚本内容,
		"params": {
			"param_c": 10
		}
	}
}
```

**使用例子**

下面例子中根据文档中的某个参数为文档创建不同的索引地址。脚本内容为if-else语句，下面例子中使用了kibana的`"""`方式来格式化脚本语句。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "自定义脚本处理器",
        "processors": [
            {
                "script": {
                    "lang": "painless",
                    "source": """
                        if ("1" == ctx.foo) {
                          ctx._index = "index1"
                        } else if ("2" == ctx.foo) {
                          ctx._index = "index2"
                        } else {
                          ctx._index = "index3"
                        }
                    """,
                    "params": {
                        "param_c": 10
                    }
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "foo": "1"
            }
        },
        {
            "_source": {
                "foo": "2"
            }
        }
    ]
}
```

返回内容中，根据`foo`的参数返回了不到的索引地址，其作用很类似日期索引处理器，但是因为是自定义的脚本，其提供了更加灵活的逻辑处理。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index1",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "foo" : "1"
        },
        "_ingest" : {
          "timestamp" : "2019-12-12T01:32:24.851918Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index2",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "foo" : "2"
        },
        "_ingest" : {
          "timestamp" : "2019-12-12T01:32:24.851925Z"
        }
      }
    }
  ]
}
```

**使用例子——脚本ID**

上面例子中在处理器中设置了脚本内容。当然也可以使用已经被保存起来的脚本。

可以先将之前的脚本保存起来

```java
POST _scripts/get_index
{
  "script": {
      "lang": "painless",
      "source": """
          if ("1" == ctx.foo) {
            ctx._index = "index1"
          } else if ("2" == ctx.foo) {
            ctx._index = "index2"
          } else {
            ctx._index = "index3"
          }
      """,
      "params": {
          "param_c": 10
      }
  }
}
```

然后配置`id`参数为之前命名的脚本名称，发起请求可以得到之前一样的结果

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "自定义脚本处理器",
        "processors": [
            {
                "script": {
                    "id": "get_index",
                    "params": {
                        "param_c": 10
                    }
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "foo": "1"
            }
        },
        {
            "_source": {
                "foo": "2"
            }
        }
    ]
}
```

## 设置安全用户处理器 Set Security User Processor

**处理器作用**

通过对ingest进行预处理，将用户相关的细节(例如用户名、角色、电子邮件、full_name和元数据)从当前经过身份验证的用户设置为当前文档。此处理器需要开启ES安全验证并完成登陆后使用

**字段解释**

字段
是否必填
默认值
说明

field
必填
-
要处理的字段

properties
非必填
[username, roles, email, full_name, metadata]
控件将哪些用户相关属性添加到字段中

if
非必填
-
执行这个处理器的条件

on_failure
非必填
-
异常处理内容

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

tag
非必填
-
此处理器的标识符。用于调试使用

**使用方式**

以下示例将当前经过身份验证的用户的所有用户详细信息添加到此管道处理的所有文档的user字段:

```java
{
  "processors" : [
    {
      "set_security_user": {
        "field": "user"
      }
    }
  ]
}
```

**使用例子**

下面请求之前本地已经开启了集群安全验证，并且登陆了超级账号

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "设置安全用户处理器",
        "processors": [
            {
                "set_security_user": {
        "field": "user"
      }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "foo": ""
            }
        }
    ]
}
```

返回内容中可以看到登陆账号的名称、角色等信息都已经被获取到指定的字段中。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "user" : {
            "metadata" : {
              "_reserved" : true
            },
            "roles" : [
              "superuser"
            ],
            "username" : "elastic"
          },
          "foo" : ""
        },
        "_ingest" : {
          "timestamp" : "2019-12-13T03:12:29.858388Z"
        }
      }
    }
  ]
}
```

## 用户代理处理器(User Agent processor)

**处理器作用**

user_agent处理器从浏览器与其web请求一起发送的用户代理字符串中提取细节。

**可选参数**

字段
是否必填
默认值
说明

field
必填
-
要处理的字段

target_field
非必填
null
要将转换后的值赋给的字段，默认情况下将就地更新

regex_file
非必填
-
config/ingest-user-agent目录中包含解析用户代理字符串的正则表达式的文件的名称。在开始Elasticsearch之前，必须创建目录和文件。如果没有指定，ingest-user-agent将使用regexes。来自uap-core的yaml随它一起发布(见下面)。

properties
非必填

[name, major, minor, patch, build, os, os_name, os_major, os_minor, device]
控制将哪些属性添加到target_field。

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

ecs
非必填
true
是否以弹性通用模式格式返回输出。注意:此设置已被废弃，将在以后的版本中删除。

**使用方式**

```java
"processors": [
	{
		"user_agent": {
			"field": "User-Agent"
		}
	}
]
```

**使用例子**

我们通过浏览器发起请求的时候，通常浏览器`Request Headers`的`User-Agent`会携带一部分请求信息，我们可以使用此处理器解析用户请求的信息。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "用户代理处理器",
        "processors": [
            {
                "user_agent": {
                    "field": "User-Agent"
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36"
            }
        }
    ]
}
```

此处理器通过解析浏览器代理信息`User-Agent`可以获取到相关名称、平台、版本等信息。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
          "user_agent" : {
            "name" : "Chrome",
            "original" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
            "os" : {
              "name" : "Windows 10"
            },
            "device" : {
              "name" : "Other"
            },
            "version" : "75.0.3770"
          }
        },
        "_ingest" : {
          "timestamp" : "2019-12-12T03:48:03.367924Z"
        }
      }
    }
  ]
}
```

**自定义正则解析文件**

有些时候，因为设备或者版本的更新，以及特殊的业务场景我们需要提供自己的解析策略。这个时候我们可以使用自定义的正则表达式文件。

自定义的正则表达式文件需要放置在`config/ingest-user-agent`目录下，并且使用`yaml`的文件扩展名。

而官方默认使用的正则解析文件来源于此地址 [正则解析文件](https://github.com/ua-parser/uap-core/blob/master/regexes.yaml)
