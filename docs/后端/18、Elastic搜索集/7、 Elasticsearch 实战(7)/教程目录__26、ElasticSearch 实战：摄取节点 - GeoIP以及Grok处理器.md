# 26、ElasticSearch 实战：摄取节点 - GeoIP以及Grok处理器
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/26.html
- 分类：搜索引擎
- 分组：教程目录
## IP解析处理器(GeoIP Processor)

**处理器作用**

GeoIP Processor主要是根据IP地址解析出具体的地理位置信息的处理器。此处理器需要配合Maxmind数据库中的数据。

`ingest-geoip`模块附带的`GeoLite2 City`、`GeoLite2 Country`和`GeoLite2 ASN geoip2`数据库，这些数据来自Maxmind。

geoip处理器可以与Maxmind中的其他GeoIP2数据库一起运行，但是这些文档必须赋值到ingest-geoip配置目录中，并且应该使用database_file选项来指定自定义数据库的文件名。必须存储未压缩的自定义数据库文件。ingest-geoip配置目录位于$ES_CONFIG/ingest-geoip。

**可选参数**

字段
是否必填
默认值
说明

if
必填
-
获取用于地理查找的ip地址的字段。

target_field
非必填
geoip
将保存从Maxmind数据库中查找的地理信息的字段。

database_file
非必填
GeoLite2-City.mmdb
geoip配置目录中的数据库文件名。GeoLite2-City.mmdb, GeoLite2-Country.mmdb and GeoLite2-ASN.mmdb

properties
非必填
[continent_name, country_iso_code, region_iso_code, region_name, city_name, location] *
基于地理位置查找，控制将哪些属性添加到target_field

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

*database_file*

- 如果使用GeoLite2-City.mmdb，则可以在target_field下添加以下字段:ip、country_iso_code、country_name、continent_name、region_iso_code、region_name、city_name、时区、纬度、经度和位置。实际添加的字段取决于找到了什么以及在属性中配置了哪些属性。
- 如果使用GeoLite2-Country.mmdb，则可以在target_field下添加以下字段:ip、country_iso_code、country_name和continent_name。实际添加的字段取决于找到了什么以及在属性中配置了哪些属性。
- 如果使用GeoLite2-ASN.mmdb，则可以在target_field下添加以下字段:ip、ASN和organization_name。实际添加的字段取决于找到了什么以及在属性中配置了哪些属性。

**使用方式**

下面例子中尝试解析我自己的服务器IP地址，使用`GeoLite2-ASN.mmdb`数据。

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "GeoIP处理器",
        "processors": [
            {
                "geoip": {
                  "database_file":"GeoLite2-ASN.mmdb",
                    "field": "ip"
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "ip": "47.**.**.0"
            }
        }
    ]
}
```

在返回结果中可以看到相关组织的参数解析。因为使用的是阿里的产品所以会显示所属组织为阿里巴巴

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "geoip" : {
            "asn" : 37963,
            "ip" : "47.**.**.0",
            "organization_name" : "Hangzhou Alibaba Advertising Co.,Ltd."
          },
          "ip" : "47.**.**.0"
        },
        "_ingest" : {
          "timestamp" : "2019-12-14T07:44:29.877038Z"
        }
      }
    }
  ]
}
```

**修改IP缓存**

geoip处理器会缓存IP解析的内容，可以通过修改参数`ingest.geoip.cache_size`来控制缓存数量，其参数默认为1000。另外需要注意的是这个参数是基于节点设置的，也就是说每个处理节点都会有一个缓存。

### Grok处理器（Grok Processor）

**概述**

> 这个工具非常适合syslog日志、apache和其他webserver日志、mysql日志，以及通常为人类而不是计算机编写的任何日志格式。这个处理器附带了许多可重用的模式。

Grok Processor和Dissect Processor的功能是一样的，就像Dissect Processor之前介绍的，其不支持正则表达式。而Grok Processor支持正则表达式。而且官方文档中也明确表示**任何正则表达式在Grok中都是有效的。**

Grok利用这种正则表达式语言来命名现有的模式，并将它们组合成与字段匹配的更复杂的模式。重用grok模式的语法有三种形式:%{syntax:SEMANTIC}、%{syntax}、%{syntax:SEMANTIC:TYPE}。

**1、** SYNTAX语法是与文本匹配的模式的名称例如，3.44将由数字模式匹配，55.3.244.1将由IP模式匹配语法是如何匹配的NUMBER和IP都是默认模式集中提供的模式；

**2、** SEMANTIC语义是你给匹配文本的标识符例如，3.44可以是事件的持续时间，因此可以简单地称之为持续时间此外，字符串55.3.244.1可能标识发出请求的客户机；

**3、** TYPE类型是您希望转换指定字段的类型int、long、double、float和boolean都支持强制类型；

**字段解释**

字段
是否必填
默认值
说明

field
必填
-
用于grok表达式解析的字段

patterns
必填
-
用于匹配和提取指定捕获的grok表达式的有序列表。返回列表中第一个匹配的表达式。

pattern_definitions
非必填
-
定义要由当前处理器使用的自定义模式的模式名称和模式元组的映射。与现有名称匹配的模式将覆盖现有的定义。

trace_match
非必填
false
当真实,_ingest。_grok_match_index将被插入到匹配文档的元数据中，并将索引插入到匹配模式中的模式中。

ignore_missing
非必填
false
当字段不存在或者为null的时候，处理器是否忽略此数据

if
非必填
-
执行这个处理器的条件

on_failure
非必填
-
异常处理内容

ignore_failure
非必填
false
是否忽略异常处理

tag
非必填
-
此处理器的标识符。用于调试使用

**使用例子**

比如下面的信息，使用提供的模式从文档中的字符串字段提取和命名结构化字段

```java
POST _ingest/pipeline/_simulate
{
    "pipeline": {
        "description": "...",
        "processors": [
            {
                "grok": {
                    "field": "message",
                    "patterns": [
                        "%{IP:client} %{WORD:method} %{URIPATHPARAM:request} %{NUMBER:bytes} %{NUMBER:duration}"
                    ]
                }
            }
        ]
    },
    "docs": [
        {
            "_source": {
                "message": "55.3.244.1 GET /index.html 15824 0.043"
            }
        }
    ]
}
```

其结果被解析为:

```java
{
  "docs" : [
    {
      "doc" : {
        "_index" : "_index",
        "_type" : "_doc",
        "_id" : "_id",
        "_source" : {
          "duration" : "0.043",
          "request" : "/index.html",
          "method" : "GET",
          "bytes" : "15824",
          "client" : "55.3.244.1",
          "message" : "55.3.244.1 GET /index.html 15824 0.043"
        },
        "_ingest" : {
          "timestamp" : "2019-12-18T12:19:56.421134Z"
        }
      }
    }
  ]
}
```

假如希望查询处理器使用的解析模式可以使用下面的请求API

```java
GET _ingest/processor/grok
```

其返回内容是一个字典的键-值表示形式。

```java
{
  "patterns" : {
    "BACULA_CAPACITY" : "%{INT}{1,3}(,%{INT}{3})*",
    "PATH" : "(?:%{UNIXPATH}|%{WINPATH})",
    "MONGO_SLOWQUERY" : "%{WORD} %{MONGO_WORDDASH:database}\\.%{MONGO_WORDDASH:collection} %{WORD}: %{MONGO_QUERY:query} %{WORD}:%{NONNEGINT:ntoreturn} %{WORD}:%{NONNEGINT:ntoskip} %{WORD}:%{NONNEGINT:nscanned}.*nreturned:%{NONNEGINT:nreturned}..+ (?<duration>[0-9]+)ms",
    ...
}
```

**支持配置**

执行时间过长的Grok表达式会被中断，而grok处理器有一个看门狗线程,此线程没过一段时间检测是否超时。此频率可以使用下面参数进行修改

```java
# 默认1秒钟
ingest.grok.watchdog.interval
```

而执行时间可以通过下面的参数进行配置

```java
ingest.grok.watchdog.max_execution_time
```
