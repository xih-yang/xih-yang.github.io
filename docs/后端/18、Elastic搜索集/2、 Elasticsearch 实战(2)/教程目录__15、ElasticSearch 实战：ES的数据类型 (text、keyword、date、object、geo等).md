# 15、ElasticSearch 实战：ES的数据类型 (text、keyword、date、object、geo等)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/15.html
- 分类：搜索引擎
- 分组：教程目录
> 说在前面: Elasticsearch中每个field都要精确对应一个数据类型.
>
> 本文的所有演示, 都是基于Elasticsearch 6.6.0进行的, 不同的版本可能存在API发生修改、不支持的情况, 还请注意.

## 1 核心数据类型

## 1.1 字符串类型 - string(不再支持)

(1)使用示例:

```java
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "title": {"type": "string"}, 	// 全文本
                "tags": {"type": "string", "index": "not_analyzed"}	// 关键字, 不分词
            }
        }
    }
}
```

(2)ES 5.6.10中的响应信息:

```java
#! Deprecation: The [string] field is deprecated, please use [text] or [keyword] instead on [tags]
#! Deprecation: The [string] field is deprecated, please use [text] or [keyword] instead on [title]
{
  "acknowledged": true,
  "shards_acknowledged": true,
  "index": "website"
}
```

(3)ES 6.6.0中的响应信息:

```java
{
  "error": {
    "root_cause": [
      {
        "type": "mapper_parsing_exception",
        "reason": "No handler for type [string] declared on field [title]"
      }
    ],
    "type": "mapper_parsing_exception",
    "reason": "Failed to parse mapping [blog]: No handler for type [string] declared on field [title]",
    "caused_by": {
      "type": "mapper_parsing_exception",
      "reason": "No handler for type [string] declared on field [title]"
    }
  },
  "status": 400
}
```

**可知string类型的field已经被移除了, 我们需要用text或keyword类型来代替string.**

### 1.1.1 文本类型 - text

在Elasticsearch 5.4 版本开始, text取代了需要分词的string.

—— **当一个字段需要用于全文搜索(会被分词), 比如产品名称、产品描述信息, 就应该使用text类型.**

> text的内容会被分词, 可以设置是否需要存储: "index": "true|false".
>
> text类型的字段不能用于排序, 也很少用于聚合.

使用示例:

```java
PUT website
{
	"mappings": {
        "blog": {
            "properties": {
        		"summary": {"type": "text", "index": "true"}
            }
        }
    }
}
```

### 1.1.2 关键字类型 - keyword

在Elasticsearch 5.4 版本开始, keyword取代了不需要分词的string.

—— **当一个字段需要按照精确值进行过滤、排序、聚合等操作时, 就应该使用keyword类型.**

> keyword的内容不会被分词, 可以设置是否需要存储: "index": "true|false".

使用示例:

```java
PUT website
{
	"mappings": {
        "blog": {
            "properties": {
        		"tags": {"type": "keyword", "index": "true"}
            }
        }
    }
}
```

## 1.2 数字类型 - 8种

数字类型有如下分类:

类型
说明

byte
有符号的8位整数, 范围: [-128 ~ 127]

short
有符号的16位整数, 范围: [-32768 ~ 32767]

integer
有符号的32位整数, 范围: [\(-2^{31}\) ~ \(2^{31}\)-1]

long
有符号的64位整数, 范围: [\(-2^{63}\) ~ \(2^{63}\)-1]

float
32位单精度浮点数

double
64位双精度浮点数

half_float
16位半精度IEEE 754浮点类型

scaled_float
缩放类型的的浮点数, 比如price字段只需精确到分, 57.34缩放因子为100, 存储结果为5734

使用注意事项:

> 尽可能选择范围小的数据类型, 字段的长度越短, 索引和搜索的效率越高;
>
> 优先考虑使用带缩放因子的浮点类型.

使用示例:

```java
PUT shop
{
    "mappings": {
        "book": {
            "properties": {
                "name": {"type": "text"},
                "quantity": {"type": "integer"},  // integer类型
                "price": {
                    "type": "scaled_float",       // scaled_float类型
                    "scaling_factor": 100
                }
            }
        }
    }
}
```

## 1.3 日期类型 - date

JSON没有日期数据类型, 所以在ES中, 日期可以是:

- 包含格式化日期的字符串, "2018-10-01", 或"2018/10/01 12:10:30".
- 代表时间毫秒数的长整型数字.
- 代表时间秒数的整数.

> 如果时区未指定, 日期将被转换为UTC格式, 但存储的却是长整型的毫秒值.
>
> 可以自定义日期格式, 若未指定, 则使用默认格式: strict_date_optional_time||epoch_millis

(1)使用日期格式示例:

```java
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "pub_date": {"type": "date"}   // 日期类型
            }
        }
    }
}
// 添加数据
PUT website/blog/11
{ "pub_date": "2018-10-10" }
PUT website/blog/12
{ "pub_date": "2018-10-10T12:00:00Z" }	// Solr中默认使用的日期格式
PUT website/blog/13
{ "pub_date": "1589584930103" }			// 时间的毫秒值
```

(2)多种日期格式:

> 多个格式使用双竖线||分隔, 每个格式都会被依次尝试, 直到找到匹配的.
>
> 第一个格式用于将时间毫秒值转换为对应格式的字符串.

使用示例:

```java
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "date": {
                    "type": "date",  // 可以接受如下类型的格式
                    "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                }
            }
        }
    }
}
```

## 1.4 布尔类型 - boolean

可以接受表示真、假的字符串或数字:

- 真值: true, "true", "on", "yes", "1"...
- 假值: false, "false", "off", "no", "0", ""(空字符串), 0.0, 0

## 1.5 二进制型 - binary

二进制类型是Base64编码字符串的二进制值, 不以默认的方式存储, 且不能被搜索. 有2个设置项:

> (1) doc_values: 该字段是否需要存储到磁盘上, 方便以后用来排序、聚合或脚本查询. 接受true和false(默认);
>
> (2) store: 该字段的值是否要和_source分开存储、检索, 意思是除了_source中, 是否要单独再存储一份. 接受true或false(默认).

使用示例:

```java
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "blob": {"type": "binary"}   // 二进制
            }
        }
    }
}
// 添加数据
PUT website/blog/1
{
    "title": "Some binary blog",
    "blob": "hED903KSrA084fRiD5JLgY=="
}
```

> 注意: Base64编码的二进制值不能嵌入换行符\n, 逗号(0x2c)等符号.

## 1.6 范围类型 - range

range类型支持以下几种:

类型
范围

integer_range
\(-2^{31}\) ~ \(2^{31}-1\)

long_range
\(-2^{63}\) ~ \(2^{63}-1\)

float_range
32位单精度浮点型

double_range
64位双精度浮点型

date_range
64位整数, 毫秒计时

ip_range
IP值的范围, 支持IPV4和IPV6, 或者这两种同时存在

(1)添加映射:

```java
PUT company
{
    "mappings": {
        "department": {
            "properties": {
                "expected_number": {  // 预期员工数
                    "type": "integer_range"
                },
                "time_frame": {       // 发展时间线
                    "type": "date_range", 
                    "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                "ip_whitelist": {     // ip白名单
                    "type": "ip_range"
                }
            }
        }
    }
}
```

(2)添加数据:

```java
PUT company/department/1
{
    "expected_number" : {
        "gte" : 10,
        "lte" : 20
    },
    "time_frame" : { 
        "gte" : "2018-10-01 12:00:00", 
        "lte" : "2018-11-01"
    }, 
    "ip_whitelist": "192.168.0.0/16"
}
```

(3)查询数据:

```java
GET company/department/_search
{
    "query": {
        "term": {
            "expected_number": {
                "value": 12
            }
        }
    }
}
GET company/department/_search
{
    "query": {
        "range": {
            "time_frame": {
                "gte": "208-08-01",
                "lte": "2018-12-01",
                "relation": "within" 
            }
        }
    }
}
```

查询结果：

```java
{
  "took": 26,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 1,
    "max_score": 1.0,
    "hits": [
      {
        "_index": "company",
        "_type": "department",
        "_id": "1",
        "_score": 1.0,
        "_source": {
          "expected_number": {
            "gte": 10,
            "lte": 20
          },
          "time_frame": {
            "gte": "2018-10-01 12:00:00",
            "lte": "2018-11-01"
          },
          "ip_whitelist" : "192.168.0.0/16"
        }
      }
    ]
  }
}
```

## 2 复杂数据类型

## 2.1 数组类型 - array

ES中没有专门的数组类型, 直接使用[]定义即可;

**数组中所有的值必须是同一种数据类型, 不支持混合数据类型的数组**:

**1、** 字符串数组: ["one", "two"];

**2、** 整数数组: [1, 2];

**3、** 由数组组成的数组: [1, [2, 3]], 等价于[1, 2, 3];

**4、** 对象数组: [{"name": "Tom", "age": 20}, {"name": "Jerry", "age": 18}].

注意:

> 动态添加数据时, 数组中第一个值的类型决定整个数组的类型;
> 不支持混合数组类型, 比如[1, "abc"];
> 数组可以包含null值, 空数组[]会被当做missing field —— 没有值的字段.

## 2.2 对象类型 - object

JSON文档是分层的: 文档可以包含内部对象, 内部对象也可以包含内部对象.

(1)添加示例:

```java
PUT employee/developer/1
{
    "name": "ma_shoufeng",
    "address": {
        "region": "China",
        "location": {"province": "GuangDong", "city": "GuangZhou"}
    }
}
```

(2)存储方式:

```java
{
    "name":                       "ma_shoufeng",
    "address.region":             "China",
    "address.location.province":  "GuangDong", 
    "address.location.city":      "GuangZhou"
}
```

(3)文档的映射结构类似为:

```java
PUT employee
{
    "mappings": {
        "developer": {
            "properties": {
                "name": { "type": "text", "index": "true" }, 
                "address": {
                    "properties": {
                        "region": { "type": "keyword", "index": "true" },
                        "location": {
                            "properties": {
                                "province": { "type": "keyword", "index": "true" },
                                "city": { "type": "keyword", "index": "true" }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## 2.3 嵌套类型 - nested

嵌套类型是对象数据类型的一个特例, 可以让array类型的对象被独立索引和搜索.

### 2.3.1 对象数组是如何存储的

**1、** 添加数据:

```java
PUT game_of_thrones/role/1
{
    "group": "stark",
	"performer": [
        {"first": "John", "last": "Snow"},
        {"first": "Sansa", "last": "Stark"}
    ]
}
```

**2、** 内部存储结构:

```java
{
    "group": 	         "stark",
    "performer.first": [ "john", "sansa" ],
    "performer.last":  [ "snow", "stark" ]
}
```

**3、** 存储分析:

可以看出, user.first和user.last会被平铺为多值字段, 这样一来, John和Snow之间的关联性就丢失了.

在查询时, 可能出现John Stark的结果.

### 2.3.2 用nested类型解决object类型的不足

如果需要对以最对象进行索引, 且保留数组中每个对象的独立性, 就应该使用嵌套数据类型.

——嵌套对象实质是将每个对象分离出来, 作为隐藏文档进行索引.

**1、** 创建映射:

```java
PUT game_of_thrones
{
    "mappings": {
        "role": {
            "properties": {
                "performer": {"type": "nested" }
            }
        }
    }
}
```

**2、** 添加数据:

```java
PUT game_of_thrones/role/1
{
    "group" : "stark",
    "performer" : [
        {"first": "John", "last": "Snow"},
        {"first": "Sansa", "last": "Stark"}
    ]
}
```

**3、** 检索数据:

```java
GET game_of_thrones/_search
{
    "query": {
        "nested": {
            "path": "performer",
            "query": {
                "bool": {
                    "must": [
                        { "match": { "performer.first": "John" }},
                        { "match": { "performer.last":  "Snow" }} 
                    ]
                }
            }, 
            "inner_hits": {
                "highlight": {
                    "fields": {"performer.first": {}}
                }
            }
        }
    }
}
```

## 3 地理数据类型

## 3.1 地理点类型 - geo point

地理点类型用于存储地理位置的经纬度对, 可用于:

> 查找一定范围内的地理点;
> 通过地理位置或相对某个中心点的距离聚合文档;
> 将距离整合到文档的相关性评分中;
> 通过距离对文档进行排序.

(1)添加映射:

```java
PUT employee
{
    "mappings": {
        "developer": {
            "properties": {
                "location": {"type": "geo_point"}
            }
        }
    }
}
```

(2)存储地理位置:

```java
// 方式一: 纬度 + 经度键值对
PUT employee/developer/1
{
    "text": "小蛮腰-键值对地理点参数", 
    "location": {
        "lat": 23.11, "lon": 113.33		// 纬度: latitude, 经度: longitude
    }
}
// 方式二: "纬度, 经度"的字符串参数
PUT employee/developer/2
{
  "text": "小蛮腰-字符串地理点参数",
  "location": "23.11, 113.33" 			// 纬度, 经度
}
// 方式三: ["经度, 纬度"] 数组地理点参数
PUT employee/developer/3
{
  "text": "小蛮腰-数组参数",
  "location": [ 113.33, 23.11 ] 		// 经度, 纬度
}
```

(3)查询示例:

```java
GET employee/_search
{
    "query": { 
        "geo_bounding_box": { 
            "location": {
                "top_left": { "lat": 24, "lon": 113 },		// 地理盒子模型的上-左边
                "bottom_right": { "lat": 22, "lon": 114 }	// 地理盒子模型的下-右边
            }
        }
    }
}
```

## 3.2 地理形状类型 - geo_shape

是多边形的复杂形状. 使用较少, 这里省略.

可以参考这篇文章: [Elasticsearch地理位置总结](https://blog.csdn.net/u012332735/article/details/54971638)

## 4 专门数据类型

## 4.1 IP类型

IP类型的字段用于存储IPv4或IPv6的地址, 本质上是一个长整型字段.

(1)添加映射:

```java
PUT employee
{
    "mappings": {
        "customer": {
            "properties": {
                "ip_addr": { "type": "ip" }
            }
        }
    }
}
```

(2)添加数据:

```java
PUT employee/customer/1
{ "ip_addr": "192.168.1.1" }
```

(3)查询数据:

```java
GET employee/customer/_search
{
    "query": {
        "term": { "ip_addr": "192.168.0.0/16" }
    }
}
```

## 4.2 计数数据类型 - token_count

token_count类型用于统计字符串中的单词数量.

本质上是一个整数型字段, 接受并分析字符串值, 然后索引字符串中单词的个数.

(1)添加映射:

```java
PUT employee
{
    "mappings": {
        "customer": {
            "properties": {
                "name": { 
                    "type": "text",
                    "fields": {
                        "length": {
                            "type": "token_count", 
                            "analyzer": "standard"
                        }
                    }
                }
            }
        }
    }
}
```

(2)添加数据:

```java
PUT employee/customer/1
{ "name": "John Snow" }
PUT employee/customer/2
{ "name": "Tyrion Lannister" }
```

(3)查询数据:

```java
GET employee/customer/_search
{
    "query": {
        "term": { "name.length": 2 }
    }
}
```
