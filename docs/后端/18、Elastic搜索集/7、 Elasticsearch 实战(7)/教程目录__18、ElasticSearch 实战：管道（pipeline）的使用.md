# 18、ElasticSearch 实战：管道（pipeline）的使用
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/18.html
- 分类：搜索引擎
- 分组：教程目录
## 管道的使用

### 管道中对文档数据的访问

**对文档字段的操作**

假如需要对文档中某些字段进行操作，只需要在`field`中指定字段名称或者通过`_source`前缀进行访问。

使用官方提供的`_simulate`模拟操作我们可以很轻松的看到其效果。下面内容一个直接访问`foo`,一个通过`_source.boo`对文档数据进行操作的例子

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "_description",
        "processors": [
            {
                "set": {
                    "field": "foo",
                    "value": "foo_value"
                }
            },
            {
                "set": {
                    "field": "_source.boo",
                    "value": "boo_value"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo",
                "boo": "boo"
            }
        },
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo",
                "boo": "boo"
            }
        }
    ]
}
```

结果可以发现使用这两个方式都可以修改对应内容。

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "boo_value",
          "foo" : "foo_value"
        },
        "_ingest" : {
          "timestamp" : "2019-11-27T01:32:41.133778Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "boo_value",
          "foo" : "foo_value"
        },
        "_ingest" : {
          "timestamp" : "2019-11-27T01:32:41.133785Z"
        }
      }
    }
  ]
}
```

> 除了文档中的字段，我们也可以使用_index、_type、_id、_routing对ES的元数据进行访问。（无需担心此操作会影响文档数据，因为ES限制映射中的字段不能存在和元数据相同的字段名）

在上面例子的返回内容中可以看到有一个`_ingest`属性。_ingest的数据同样可以使用`_ingest.timestamp`来提取其时间戳。但是需要注意的是ingest元数据并不是持久的数据，其在管道处理完毕之后就被丢弃。

**使用文档中的数据**

有些时候我们使用管道只是进行时间戳的赋值或者字段拼接，其内容根据数据内容的变化而变化。这个时候我们需要获取到文档或者ES的元素进行操作。这个情况下我们可以使用`{ {field}}`的方式进行访问。

获取_ingest中的时间戳赋值给received

```java
{
  "set": {
    "field": "received",
    "value": "{
     {_ingest.timestamp}}"
  }
}
```

简单的字段拼接

```java
{
  "set": {
    "field": "field_c",
    "value": "{
     {field_a}} {
     {field_b}}"
  }
}
```

下面的例子中`received`为时间戳数据，`foo`为foo和boo字段的拼接

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "_description",
        "processors": [
            {
                "set": {
                    "field": "foo",
                    "value": "{
     {foo}} {
     {_source.boo}}"
                }
            },
            {
              "set": {
                "field": "received",
                "value": "{
     {_ingest.timestamp}}"
              }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo",
                "boo": "boo"
            }
        },
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo",
                "boo": "boo"
            }
        }
    ]
}
```

**动态参数设置**

同样我们可以在`field`字段上使用`{ {}}`使其可以根据实际数据对不同的字段进行赋值。

```java
{
  "set": {
    "field": "{
     {service}}",
    "value": "{
     {code}}"
  }
}
```

### 为管道添加执行条件

ES在管道中提供了`if`属性，通过此属性值我们可以控制管道是否处理某些内容。这样的使用方式很类似拦截器，在拦截器中我们设置条件只拦截需要的内容。

#### 简单条件

每个处理器都允许一个可选的if条件来决定应该执行还是跳过该处理器。if的值需要将其计算为true或false。

下面是一个简单条件的例子

**1、** 现在创建一个管道，当遇见`area`为`中国华东`的数据时就不进行操作；

```java
PUT _ingest/pipeline/not_save
{
  "processors": [
    {
      "drop": {
        "if": "ctx.area == '中国华东'"
      }
    }
  ]
}
```

**1、** 然后尝试保存下面数据，并且使用`not_save`管道；

```java
POST city_info/_doc/1?pipeline=not_save
{
    "name": "无锡",
    "desc": "大城市",
    "province": "江苏",
    "gdp": "1143800000000",
    "area": "中国华东",
    "carNumPrefix": "苏B"
}
```

**1、** 尝试查询ID为1的文档,此时会发现数据并没有插入；

```java
GET city_info/_doc/1
{
  "_index" : "city_info",
  "_type" : "_doc",
  "_id" : "1",
  "found" : false
}
```

#### 复杂条件

**复杂条件**

除了简单条件，ES也支持多个if操作，比如下面是官方提供的一个复杂条件Demo。

```java
PUT _ingest/pipeline/not_prod_dropper
{
  "processors": [
    {
      "drop": {
        "if": "Collection tags = ctx.tags;if(tags != null){for (String tag : tags) {if (tag.toLowerCase().contains('prod')) { return false;}}} return true;"
      }
    }
  ]
}
```

因为受限制于JSON解析的原因执行条件被写在了一行之中，把条件单独拿出来是下面的样子，其实本质就是JAVA代码中的循环判断。

```java
	Collection tags = ctx.tags;
	if(tags != null){
	  for (String tag : tags) {
		  if (tag.toLowerCase().contains('prod')) {
			  return false;
		  }
	  }
	}
	return true;
```

假如使用Postman进行接口调试的时候因为限制无法将判断内容格式化，这对于开发调试来说是非常难受的。但是使用Kibana可以使用其`"""`语法，在其内部可以显示格式化后的条件代码。

```java
PUT _ingest/pipeline/not_prod_dropper
{
  "processors": [
    {
      "drop": {
        "if": """
            Collection tags = ctx.tags;
            if(tags != null){
              for (String tag : tags) {
                  if (tag.toLowerCase().contains('prod')) {
                      return false;
                  }
              }
            }
            return true;
        """
      }
    }
  ]
}
```

#### 管道委托

**委托给其他管道使用**

我们之前操作都是通过管道设置其中数据的值，而使用下面操作可以将数据的操作转移到另外一个管道中：

```java
	{
		"pipeline": {
		  "if": "ctx.foo == 'foo1'",
		  "name": "last_pipeline"
		}
	}
```

**1、** 下面例子中创建了一个`last_pipeline`的管道，其将`foo`参数设置为`last_foo_value`；

```java
PUT _ingest/pipeline/last_pipeline
{
  "processors": [
    {
      "set": {
          "field": "foo",
          "value": "last_foo_value"
      }
    }
  ]
}
```

**1、** 然后使用`_simulate`来模拟数据操作被转移的行为下面请求中当`"ctx.foo=='foo1'`条件被满足后，将用`last_pipeline`来处理数据；

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "_description",
        "processors": [
            {
                "pipeline": {
                  "if": "ctx.foo == 'foo1'",
                  "name": "last_pipeline"
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo1",
                "boo": "boo1"
            }
        },
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo2",
                "boo": "boo2"
            }
        }
    ]
}
```

#### 正则表达式的条件

当然除了上面的内容，pipeline也同样支持正则表达式，下面是官方提供的一个调用`demo`

```java
PUT _ingest/pipeline/check_url
{
  "processors": [
    {
      "set": {
        "if": "ctx.href?.url =~ /^http[^s]/",
        "field": "href.insecure",
        "value": true
      }
    }
  ]
}
```

#### 条件中的嵌套数据

当需要访问的字段是文档的嵌套字段，如果父级对象不存在的时候去调用其子对象，在JAVA中会抛出NullPointerException（NPE异常），而对于ES同样存在此风险，所以为了应对此类问题ES提供了`?`符号，使用此符号可以安全的进行子集访问。

下面就是官方在其文档中提供的一个使用demo

```java
PUT _ingest/pipeline/drop_guests_network
{
  "processors": [
    {
      "drop": {
        "if": "ctx.network?.name == 'Guest'"
      }
    }
  ]
}
```

### 处理管道异常

正常使用中，管道定义的处理列表是按照顺序执行的，当处理过程中存在异常时处理便会停止。在无法保证异常是否发生的环境中，让异常直接终止处理的方法显然不合理。当我们预期到某些异常的存在时，我们应该有另外一种方式去处理而不是停止程序。

`on_failure`参数定义了在发生故障的处理器之后立即执行的处理器列表。`on_failure`参数可以设置在管道中也可以设置在管道内的处理器中。

**1、** 如果处理器指定了`on_failure`配置，不管它是否为空，处理器抛出的任何异常都会被捕获；

**2、** 如果管道指定了`on_failure`配置，而管道将继续执行其余的处理器；

官方文档中提供了一个将`foo`字段重命名为`bar`的demo，我们将其使用`_simulate`执行后，可以看到起作用的效果

**1、** 将`foo`字段修改为`bar`字段，但是当`foo`的字段不存在的时候会发生异常，这个时候会执行`on_failure`内部的逻辑；

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "_description",
        "processors": [
            {
                "rename": {
                    "field": "foo",
                    "target_field": "bar",
                    "on_failure": [
                        {
                            "set": {
                                "field": "error",
                                "value": "field \"foo\" does not exist, cannot rename to \"bar\""
                            }
                        }
                    ]
                }
            }
        ]
    },
    "docs": [
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "boo": "boo1"
            }
        },
        {
            "_index": "index",
            "_id": "id",
            "_source": {
                "foo": "foo2",
                "boo": "boo2"
            }
        }
    ]
}
```

**1、** 其执行后的结果，可以看到第一条数据已经存在`error`的信息；

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "boo" : "boo1",
          "error" : """field "foo" does not exist, cannot rename to "bar""""
        },
        "_ingest" : {
          "timestamp" : "2019-11-27T02:56:07.757485Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "id",
        "_source" : {
          "bar" : "foo2",
          "boo" : "boo2"
        },
        "_ingest" : {
          "timestamp" : "2019-11-27T02:56:07.757497Z"
        }
      }
    }
  ]
}
```

**指向新的索引**

这是官方提供的一个异常处理的应用方式。将错误数据指向到一个新的索引中是个非常好的处理方式，当我们批量执行操作遇见错误的数据被保存到一个错误索引表中，我们就可以专门针对这张索引进行分析和处理。

```java
"on_failure" : [
{
  "set" : {
	"field" : "_index",
	"value" : "failed-{
     { _index }}"
  }
}
]
```

**忽略异常**

有的时候我们可能并不关系异常的内容和原因，仅仅是想完成一些操作，这个时候可以使用`"ignore_failure" : true`配置来让系统忽略掉所有异常。

```java
{
  "description" : "my first pipeline with handled exceptions",
  "processors" : [
    {
      "rename" : {
        "field" : "foo",
        "target_field" : "bar",
        "ignore_failure" : true
      }
    }
  ]
}
```

**获取异常信息**

类似try-catch中的(Exception e)的逻辑，我们可以获取异常中的信息，而ES也提供了获取异常信息的方式。其异常信息放在`_ingest`,此参数可以获取的内容为`on_failure_message`、`on_failure_processor_type`和`on_failure_processor_tag`的元数据字段。需要注意的上面的内容只能在`on_failure`代码块中访问

```java
"on_failure" : [
  {
	"set" : {
	  "field" : "error",
	  "value" : "{
     { _ingest.on_failure_message }}"
	}
  }
]
```
