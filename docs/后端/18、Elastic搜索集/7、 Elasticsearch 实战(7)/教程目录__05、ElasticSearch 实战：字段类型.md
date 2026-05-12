# 05、ElasticSearch 实战：字段类型
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/5.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

之前介绍了Elasticsearch关于数据结构的介绍，这里主要介绍下Elasticsearch对于数据类型的定义。

### Elasticsearch 数据类型

Elasticsearch整体将数据划分为：

- 核心数据类型
- 复杂数据类型
- 地理数据类型
- 专业数据类型
- 数组
- 多字段

#### 核心数据类型

##### 字符串

字符串在之前的版本主要指的是`string`类型。但是在5.X版本已经不支持`string`类型。其被`text`和`keyword`类型替代

**text**

text字段需要被全文搜索的内容，它可以保存非常长的内容。查询的时候一般使用分词器器进⾏行行分词然后进行全文搜索。text类型的字段不用于排序，很少用于聚合。

**keyword**

此字段不能使用分词器进行查询，只能搜索该字段的完整的值。所以其主要保存一些可以索引的结构化内容。此字段可以进行排序、聚合等操作。

##### 数值类型

**整数**

- long
- intege
- short
- byte

**浮点**

- double
- float
- half_float
- scaled_float

##### 布尔

- boolean

> 数值类型和布尔类型都很简单这里不再介绍

##### 范围

范围类型主要有下面几种。

- integer_range
- float_range
- long_range
- double_range
- date_range

> 范围类型，并不是表示一个具体的数值，它表示个范围。比如某样产品工作温度为10度至50度就可以使用这种类型表示。

比如我们这是工作温度（work）为10度到50度。那么值可以是 `{"gte" : 10, "lte" : 50}`，那么我们搜索工作温度在30摄氏度的产品可以使用`"term" : {"work": 30}`

##### 日期

- date

Elasticsearch通过解析字符串是否符合给定的format定义来判断是否为date类型。Elasticsearch提供了下面的方式对字符串进行时间的格式化

**日期格式的字符串**

“2022-01-01” “2022/01/01 12:10:30” 这种字符串串格式

**long类型**

从1970年年1⽉月1⽇日0点开始的毫秒数

**integer**

从1970年年1⽉月1⽇日0点开始的秒数

##### 二进制

- binary

该类型字段会用base64来表示索引中存储的二进制数据。例如图片等信息。默认情况下，该类型的字段只是存储不索引且不可搜索。

#### 复杂数据类型

##### 对象

- object

对象类型中可以出现对象嵌套对象，比如下面的层级

```java
{
    "name": "jong",
    "age": "27",
    "tel": "13477777777",
    "array": [
        "one",
        "two"
    ],
    "address": {
        "region": "China",
        "location": {
            "province": "HuBei",
            "city": "WuHan"
        }
    }
}
```

针对这种层级关系的数据我们在进行查询的时候需要指明其具体层级下的属性名称，比如

```java
"address.region": "China",
"address.location.province": "HuBei",
"address.location.city": "WuHan"
```

##### 嵌套类型

- nested

是ES对对象数组设置的类型，它可以对对象数组进行索引。

我们插入一个这样的数据。

```java
{
  "group" : "fans",
  "user" : [ 
    {
      "first" : "John",
      "last" :  "Smith"
    },
    {
      "first" : "Alice",
      "last" :  "White"
    }
  ]
}
```

最后可以得到一个类似这样的结果

```java
{
  "group" :        "fans",
  "user.first" : [ "alice", "john" ],
  "user.last" :  [ "smith", "white" ]
}
```

#### 地理数据类型

##### 坐标

- geo_point

主要保存地理经纬度的信息。其数据保存后的结果是下面样子

```java
{
    "query": {
        "geo_bounding_box": {
            "location": {
                "top_left": {
                    "lat": 42,
                    "lon": -72
                },
                "bottom_right": {
                    "lat": 40,
                    "lon": -74
                }
            }
        }
    }
}
```

##### 地理地图

- geo_shape

它允许我们使用形状来做查询，而不仅仅是坐标点。他允许你针对某个坐标点进行范围查询

```java
{
    "query": {
        "geo_shape": {
            "location": {
                "shape": {
                    "type": "circle",
                    "radius": "1km",
                    "coordinates": [
                        114.405638,
                        30.477114
                    ]
                }
            }
        }
    }
}
```

#### 专业数据类型

> 专业数据类型平时很少被使用，其诞生也是为了解决一部分业务场景的问题。所以很多时候我们并没有怎么了解他们，但是在某些特殊场景，这些数据类型却能很好解决问题。

##### ip类型

ip类型的字段本质上是一个长整型的字段，用来存储IPv4或者IPv6的地址

```java
{
    "query": {
        "term": {
            "ip_addr": "192.168.0.0/16"
        }
    }
}
```

##### 范围类型

##### 令牌

类型字段token_count实际上是一个integer接受字符串值，对其进行分析，然后为字符串中的令牌数编制索引的字段。

目前本人还没搞明白具体使用场景就不细讲了

##### murmur3

mapper-murmur3插件提供了在索引时计算字段值的哈希并将其存储在索引中的功能

##### Percolator

可以保存查询JSON的一个字段类型，可以保存之前设置的查询语句。

##### Join

可以在一个索引下，定义父子关系，然后实现类似关系型数据库中的多表关联查询。

##### 等级特征 Rank feature

一种记录数据点击特征的字段，通过这个字段可以尝试对数据点击率进行分析。

##### 等级特征 Rank features

一种记录数据点击特征的字段，通过这个字段可以尝试对数据点击率进行分析。类似于rank_feature数据类型，但更适合于特征列表稀疏的情况。

##### Dense vector

一个dense_vector字段存储浮点值的密集向量。

##### Sparse vector

一个sparse_vector字段存储浮点值的稀疏向量。

##### Search-as-you-type

一种开箱即用的搜索即可见的解决方案,内部会自动拆分为多个子字段索引

##### Alias

为现有字段定义别名。

##### Flattened

默认情况下，对象中的每个子字段都分别进行映射和索引。flattened类型其中将整个对象映射为单个字段。给定一个对象，flattened映射将解析出其叶子值，并将它们作为关键字索引到一个字段中。然后可以通过简单的查询和聚合来搜索对象的内容。

##### Shape

它可用于索引和查询其坐标属于二维平面坐标系的几何

#### 数组

ElasticSearch中，任何一个字段都可以包含0或多个值，这就意味着每个字段其实都可以认为是数组类型。不过ElasticSearch也要求，每个元素值的数据类型必须相同

**正确的数据**

- 字符串串数组 [ “one”, “two” ]
- 整数数组 [ 1, 2 ]
- Object对象数组 [ { “name”: “Louis”, “age”: 18 }, { “name”: “Daniel”, “age”: 17 }]

**错误的数据**

[“one”, “two”, 1, 2 ]
