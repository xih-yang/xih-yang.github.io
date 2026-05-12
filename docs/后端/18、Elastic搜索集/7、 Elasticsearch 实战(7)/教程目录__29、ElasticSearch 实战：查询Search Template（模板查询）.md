# 29、ElasticSearch 实战：查询Search Template（模板查询）
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/29.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

### ES模板搜索——Search Template

日常开发中我们可能需要频繁的使用一些类似的查询。为了减少重复的工作，我们可以将这些类似的查询写成模板，在后续只需要传递不同的参数来调用模板获取结果。

#### 模板的保存和删除

**创建一个简单的模板**

下面例子中是创建了一个ID为`order_id_template`的简单模板。因为ES使用的是`mustache`语言所以`lang`的参数被设置为`mustache`。下面的请求完成后就获得了一个ID为`order_id_template`，根据传递的`orderId`参数来筛选`order_id`内容的脚本。

```java
POST _scripts/order_id_template
{
    "script": {
        "lang": "mustache",
        "source": {
            "query": {
                "match": {
                    "order_id": "{
     {orderId}}"
                }
            }
        }
    }
}
```

**查看之前创建的模板**

使用之前创建模板的`GET`方法可以获得之前保存的模板信息

```java
GET _scripts/order_id_template
```

使用kibana查询此模板，source内容会通过`"""`格式返回。

```java
{
  "_id" : "order_id_template",
  "found" : true,
  "script" : {
    "lang" : "mustache",
    "source" : """{"query":{"match":{"order_id":"{
     {
     orderId}}"}}}""",
    "options" : {
      "content_type" : "application/json; charset=UTF-8"
    }
  }
}
```

**删除模板**

使用之前创建模板的`DELETE`方法可以移除之前保存的模板信息

```java
DELETE _scripts/<templateid>
```

#### 模板如何使用在查询中

虽然可以在使用内联模板进行查询，比如下面的样子。但之所以使用模板就是为了节省时间，那么再使用内联模板就没有意义了。

```java
GET kibana_sample_data_ecommerce/_search/template
{
    "source": {
        "query": {
            "match": {
                "order_id": "{
     {orderId}}"
            }
        }
    },
    "params": {
        "orderId": "570111"
    }
}
```

此时在之前的查询请求添加`/template`后缀。然后使用自定义的参数（params）调用指定的模板（ID）获得对应数据。

```java
GET kibana_sample_data_ecommerce/_search/template
{
    "id": "order_id_template", 
    "params": {
        "orderId": "570111"
    }
}
```

#### 验证模板的效果

类似之前介绍的摄取节点的处理器功能，ES提供了`_render/template`方法，来对内联模板或者已经存储的模板进行验证。

**验证模板**

请求内容

```java
## 验证内联模板
GET _render/template
{
    "source": {
        "query": {
            "match": {
                "order_id": "{
     {orderId}}"
            }
        }
    },
    "params": {
        "orderId": "123"
    }
}
## 验证已保存的模板
GET _render/template/order_id_template
{
  "params": {
    "orderId" : "123"
  }
}
```

这个时候返回的时候此模板在当前参数下生成的结果

```java
GET _render/template/order_id_template
{
  "params": {
    "orderId" : "123"
  }
}
```

#### Mustache模板语法的介绍

Elasticsearch中实现了mustache语言。因此，搜索模板遵循脚本文档中描述的设置。下面主要介绍ES官方文档和Mustache文档中支持的语法。

##### 变量替换

**语法**

`{{params}}`

**作用**

此操作会将参数`params`中的值，和对应模板进行替换

**请求例子**

下面例子中参数中的值会自动带入到{ {}}中相同的名字的位置

```java
GET _render/template
{
    "source" : {
      "query": {
      "match" : {
      "{
     {my_field}}" : "{
     {my_value}}" } },
      "size" : "{
     {my_size}}"
    },
    "params" : {
        "my_field" : "message",
        "my_value" : "some message",
        "my_size" : 5
    }
}
```

##### 文本块的显示

**语法**

{ {#params}}{ {/params}}

**作用**

当此模板名称对应的参数不存在或者返回为false，被这一对标签包裹的文本内容将不会显示出来

**请求例子**

下面这种写法的一个类似JSON的展示样式，但是因为中间使用了{ {#line_no}}标签所以并不能为JSON所解析，所以需要转换成字符串形式。

```java
{
  "query": {
    "bool": {
      "filter": {
        {
     {
    line_no}}
          "range": {
            "line_no": {
              {
     {
    start}}
                "gte": "{
     {start}}"
                {
     {
    end}},{
     {
     /end}}
              {
     {
     /start}}
              {
     {
    end}}
                "lte": "{
     {end}}" 
              {
     {
     /end}}
            }
          }
        {
     {
     /line_no}}
      }
    }
  }
}
```

在真正的请求中上面内容需要转换为下面的内容才能请求成功

```java
GET _render/template
{
    "source": "{\"query\": {\"bool\": {\n\"filter\": {\n{
     {#line_no}} \"range\": {\"line_no\": {\n{
     {#start}} \"gte\": \"{
     {start}}\" {
     {#end}},{
     {/end}} {
     {/start}}{
     {#end}} \"lte\": \"{
     {end}}\" {
     {/end}}}}{
     {/line_no}}}}}}",
    "params": {
        "orderId": "123",
        "orderfield": "order_id",
        "line_no": {
            "start": 10,
            "end": 20
        }
    }
}
```

返回内容中因为`line_no`不为空，所以后续文本块被展示出来了。

```java
{
  "template_output" : {
    "query" : {
      "bool" : {
        "filter" : {
          "range" : {
            "line_no" : {
              "gte" : "10",
              "lte" : "20"
            }
          }
        }
      }
    }
  }
}
```

##### 列表循环

**语法**

{ {#params}}{ {/params}}

**作用**

假如模板对应的参数为数组，在被此标签包裹的内部可以循环此数组最终拼装出需要的内容。

**请求例子**

和上一个用法一样，原始的数据结构并不能被JSON所解析需要转换为字符串形式

```java
{
  "query": {
    "bool": {
      "should": [
        {
          "terms": {
            "order_id": [
               {
     {
    orderList}}
				  {
     {
     orderId}}
				{
     {
     /orderList}}
            ]
          }
        }
      ]
    }
  }
}
```

这是最终请求的结构，设置参数中是一个数组，通过循环`orderId`来拼接条件

```java
GET _render/template
{
    "source": "{\"query\": {\"bool\": {\"should\": [{\"terms\": {\"order_id\": [{
     {#orderList}}{
     {orderId}}{
     {/orderList}}]}}]}}}",
    "params": {
        "orderList": [
            {
                "orderId": "123,"
            },
            {
                "orderId": "456"
            }
        ]
    }
}
```

下面是返回的处理结果，可以看到数据已经被循环出来了

```java
{
  "template_output" : {
    "query" : {
      "bool" : {
        "should" : [
          {
            "terms" : {
              "order_id" : [
                123,
                456
              ]
            }
          }
        ]
      }
    }
  }
}
```

##### if-else

**语法**

```java
{
     {
    line_no}}
	逻辑1
{
     {
     /line_no}}
{
     {
     ^line_no}}
	逻辑2
{
     {
     /line_no}}
```

**作用**

使用这种结构可以实现类似if-else的操作，当`line_no`不存在的时候，会显示下一部分的文本块。

**请求例子**

同样，原始的数据结构并不能被JSON所解析需要转换为字符串形式

```java
{
  "query": {
    "bool": {
      "filter": {
        {
     {
    line_no}}
          "range": {
            "line_no": {
              {
     {
    start}}
                "gte": "{
     {start}}"
                {
     {
    end}},{
     {
     /end}}
              {
     {
     /start}}
              {
     {
    end}}
                "lte": "{
     {end}}" 
              {
     {
     /end}}
            }
          }
        {
     {
     /line_no}}
		{
     {
     ^line_no}}
			"gte": "0",
            "lte": "10" 
		{
     {
     /line_no}}
      }
    }
  }
}
```

下面是最终请求结构，需要注意的是，此时参数并没有包含任何数值。

```java
GET _render/template
{
    "source": "{\"query\": {\"bool\": {\n\"filter\": {\n{
     {#line_no}} \"range\": {\"line_no\": {\n{
     {#start}} \"gte\": \"{
     {start}}\" {
     {#end}},{
     {/end}} {
     {/start}}{
     {#end}} \"lte\": \"{
     {end}}\" {
     {/end}}}}{
     {/line_no}}{
     {^line_no}}\"gte\": \"0\",\"lte\":\"10\"{
     {/line_no}}}}}}",
    "params": {
    }
}
```

在没有发现`line_no`内容之后，默认的数据被显示出来了。

```java
{
  "template_output" : {
    "query" : {
      "bool" : {
        "filter" : {
          "gte" : "0",
          "lte" : "10"
        }
      }
    }
  }
}
```

##### 模板中添加注解

**语法**

`{{!注解}}`

**作用**

此方法用来对参数的内容进行注解并不影响最终结果

**请求例子**

```java
GET _render/template
{
  "source": {
    "query": {
      "match": {
        "order_id": "{
     {orderId}}{
     {!订单ID}}"
      }
    }
  },
  "params": {
        "orderId":"456"
  }
}
```

##### 将参数JSON化

**语法**

{ {#toJson}}{ {/toJson}}

**作用**

此功能主要是针对参数值是对象的内容，此时需要将对象参数JSON化来完成数据的拼装

**请求例子**

```java
GET _render/template
{
  "source": "{ \"query\": { \"terms\": {
     {#toJson}}statuses{
     {/toJson}} }}",
  "params": {
    "statuses" : {
        "status": [ "pending", "published" ]
    }
  }
}
```

最终形成的查询条件为正确的数组结构。

```java
{
  "template_output" : {
    "query" : {
      "terms" : {
        "status" : [
          "pending",
          "published"
        ]
      }
    }
  }
}
```

##### 对参数进行拼接操作

**语法**

{ {#join}}{ {/join}}

**作用**

使用此标签可以实现对数组参数值内容的拼接

**请求例子**

此时查询条件为数组，通过拼接可以将多个数据合并到查询条件中

```java
GET _render/template
{
  "source": {
    "query": {
      "match": {
        "emails": "{
     {#join}}emails{
     {/join}}"
      }
    }
  },
  "params": {
    "emails": [ "username@email.com", "lastname@email.com" ]
  }
}
```

返回结果中条件已经被合并

```java
{
  "template_output" : {
    "query" : {
      "match" : {
        "emails" : "username@email.com,lastname@email.com"
      }
    }
  }
}
```

**自定义的连接符号**

下面例子中使用{ {#join delimiter='||'}}{ {/join delimiter='||'}}可以自定义的连接符号。

```java
GET _render/template
{
  "source": {
    "query": {
      "match": {
        "emails": "{
     {#join delimiter='||'}}emails{
     {/join delimiter='||'}}"
      }
    }
  },
  "params": {
    "emails": [ "username@email.com", "lastname@email.com" ]
  }
}
```

##### 设置参数的默认值

**语法**

`{{^foo}}{ {/foo}}`

**作用**

此方法是保证在没有参数传递的过程中，有一个默认的参数可以用来执行查询

**请求例子**

下面例子中在没有获取到`foo`的参数值的情况下会使用20来代替它

```java
GET _render/template
{
  "source": {
    "query": {
      "match": {
        "foo": "{
     {foo}}{
     {^foo}}20{
     {/foo}}"
      }
    }
  }
}
```

##### 对地址类数据进行编码

**语法**

{ {#url}}{ {/url}}

**作用**

此标签是将其内部内容进行url编码操作,这边就避免因为地址中的特殊符号而导致保存或者查询异常。

**请求例子**

下面例子中`https://www.elastic.co/learn`被编码为了`https%3A%2F%2Fwww.elastic.co%2F%2Flearn`.

```java
GET _render/template
{
    "source" : {
        "query" : {
            "term": {
                "http_access_log": "{
     {#url}}{
     {host}}/{
     {page}}{
     {/url}}"
            }
        }
    },
    "params": {
        "host": "https://www.elastic.co/",
        "page": "learn"
    }
}
```

```java
{
  "template_output" : {
    "query" : {
      "term" : {
        "http_access_log" : "https%3A%2F%2Fwww.elastic.co%2F%2Flearn"
      }
    }
  }
}
```

##### 复杂的查询条件拼接

上面主要是介绍了部分ES文档和Mustache模板语法的一部分内容。使用此模板语法不仅仅可以实现参数自定义，还可以查询字段的自定义以及实现循环、判断能操作。

```java
{
  "query": {
    "bool": {
      "must": {
        "match": {
          "{
     {orderfield}}": "{
     {orderId}}"
        }
      },
      "filter": {
        {
     {
    line_no}}
          "range": {
            "line_no": {
              {
     {
    start}}
                "gte": "{
     {start}}"
                {
     {
    end}},{
     {
     /end}}
              {
     {
     /start}}
              {
     {
    end}}
                "lte": "{
     {end}}" 
              {
     {
     /end}}
            }
          }
        {
     {
     /line_no}}
      }
    }
  }
}
```

使用模板语法无论多么负责的查询语句都可以拼接出来，上面只是一个略简单的内容，实际中可能会拼接多种标签。在使用kibana进行测试的时候需要注意，在遇见"filter": { { {#line_no}}这种情况的时候时，不要去掉{ { {中间的空格，也可以使用{\n{ {这种。因为在我使用kibana进行查询的时候遇见{ { {结构会解析错误。

```java
GET _render/template
{
    "source": "{\"query\": {\"bool\": {\"must\": {\"match\": {\"{
     {orderfield}}\": \"{
     {orderId}}\"}},\n\"filter\": { {
     {#line_no}}\"range\": {\"line_no\": {\n{
     {#start}}\"gte\": \"{
     {start}}\"{
     {#end}},{
     {/end}}{
     {/start}}{
     {#end}}\"lte\": \"{
     {end}}\" {
     {/end}}}}{
     {/line_no}}}}}}",
    "params": {
        "orderId": "123",
        "orderfield": "order_id",
        "line_no": {
            "start": 10,
            "end": 20
        }
    }
}
```

输出内容

```java
{
  "template_output" : {
    "query" : {
      "bool" : {
        "must" : {
          "match" : {
            "order_id" : "123"
          }
        },
        "filter" : {
          "range" : {
            "line_no" : {
              "gte" : "10",
              "lte" : "20"
            }
          }
        }
      }
    }
  }
}
```
