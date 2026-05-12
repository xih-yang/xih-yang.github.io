# 32、ElasticSearch 实战：查询Sort（查询排序）
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/32.html
- 分类：搜索引擎
- 分组：教程目录
### Sort 查询排序

**测试索引**

Elasticsearch针对普通数据、数组、嵌套对象、地理位置都提供了排序功能，为了测试其排序方式我们需要可以能够足够数据类型的索引。所以创建了下面一个索引以及其映射

```java
PUT offline_sales
PUT offline_sales/_mapping
{
    "properties": {
        "order_id": {
            "type": "keyword"
        },
        "products": {
            "type": "nested",
            "properties": {
                "quantity": {
                    "type": "long"
                },
                "price": {
                    "type": "half_float"
                },
                "product_id": {
                    "type": "long"
                }
            }
        },
        "total_price": {
            "type": "half_float"
        },
        "price_list": {
            "type": "half_float"
        },
        "geo_location": {
            "type": "geo_point"
        },
        "sale_date": {
            "type": "date",
            "format": [
                "yyyy-MM-dd HH:mm:ss"
            ]
        }
    }
}
```

现在插入测试数据

```java
{"index":{"_index":"offline_sales","_id":0}}
{"order_id": "1","products": [{"product_id": 1,"price": 10.0,"quantity": 1},{"product_id": 2,"price": 20.0,"quantity": 2},{"product_id": 3,"price": 30.0,"quantity": 3}],"total_price": 140.0,"price_list":[10.0,20.0,30.0],"geo_location":[114.3185806274,30.5647434479],"sale_date": "2019-12-22 22:22:29","comment_num": 0}
{"index":{"_index":"offline_sales","_id":1}}
{"order_id": "2","products": [{"product_id": 1,"price": 10.0,"quantity": 1},{"product_id": 2,"price": 40.0,"quantity": 2},{"product_id": 3,"price": 30.0,"quantity": 3}],"total_price": 180.0,"price_list":[10.0,40.0,30.0],"geo_location":[114.3185806274,30.5847434479],"sale_date": "2019-12-22 22:22:29","comment_num": 0}
......
```

> 需要注意，国内地图获取的地理位置数组为[纬度,经度]，而ES的地理位置坐标要求输入[经度,纬度]

**使用元数据排序**

Elasticsearch除了允许其使用索引中的字段进行排序，还提供了了`_score`以及`_doc`数据的排序。其中`_score`基于查询匹配的分数排序，而`_doc`是根据索引的顺序自然排序。

官方文档中也强调。`_doc`排序是最有效的排序，在不需要根据某些业务实现文档顺序，仅仅是想实现某些翻页效果的时候，使用`_doc`排序会比较好。

**排序后的返回结果**

在使用非元数据进行排序的时候（文档字段）参与排序的字段值会作为结果的一部分输出。

需要注意的是，对于某些类型数据（比如日期类型，返回的数据并不是原始的年月日类型的数据）

对文档内容根据日期进行排序

```java
GET /offline_sales/_search
{
    "sort" : [
        "sale_date"
    ]
}
```

最后返回的排序字段值已经被转换。

```java
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    ......
  },
  "hits" : {
    "total" : {
     ......},
    "max_score" : null,
    "hits" : [
      {
        "_index" : "offline_sales",
        "_type" : "_doc",
        "_id" : "12",
        "_score" : null,
        "_source" : {
     ......},
        "sort" : [
          1577053349000
        ]
      }
    ]
  }
}
```

### 不同情况下的排序参数

#### 多字段排序

`sort`支持设置多个字段参与排序

```java
GET /offline_sales/_search
{
    "sort" : [
        {
      "sale_date" : {
     "order" : "asc"}},
        "total_price",
        {
      "order_id" : "desc" },
        "_score"
    ]
}
```

```java
"sort" : [
  1577053349000,
  140.0,
  "9",
  1.0
]
```

#### 跨索引不同类型字段排序

Elasticsearch在进行跨索引查询的时候也可以设置排序策略，不过此时要是排序字段的类型一致或者相似。对于数值类型的字段可以使用numeric_type选项将值从一种类型转换为另一种类型。

由于字段在第一个索引中映射为double，在第二个索引中映射为long，因此不能使用该字段对默认情况下同时查询两个索引的请求进行排序。但是，您可以使用numeric_type选项强制类型为一个或另一个，以便强制为所有索引的特定类型:

> 注意正常情况下上面的例子应该转换为double，但是为了突出显示数据被转换了，所以使用了long进行表示。

**numeric_type**支持的参数为：[“double”， “long”， “date”， “date_nanos”]

以这两个指标为例:

```java
GET /offline_sales,online_sales/_search
{
    "sort": [
        {
            "total_price": {
                "numeric_type": "long"
            }
        }
    ]
}
```

```java
"sort" : [
  140
]
```

**不同时间类型排序**

`numeric_type`还可用于将使用毫秒分辨率的日期字段转换为具有纳秒分辨率的date_nanos字段。以这两个指标为例:使用numeric_type类型选项可以为排序设置单个分辨率，设置到日期将把date_nanos转换为毫秒分辨率，而date_nanos将把日期字段的值转换为纳秒分辨率:

```java
GET /offline_sales,online_sales/_search
{
    "sort": [
        {
            "sale_date": {
                "numeric_type": "date_nanos"
            }
        }
    ]
}
```

> 需要注意的是，因为使用long类型计算时间的纳秒数值，为了避免溢出，对date_nanos的转换不能应用于1970年以前和2262年以后的日期。

#### 数组类型字段排序

针对字段为数组结构的数据，`sort`提供了根据`mode`设置类型进行排序的策略

参数
说明

min
基于数组中最小值进行排序，如果不是数组就取当前值

max
基于数组中最大值进行排序，如果不是数组就取当前值

sum
使用所有值的和作为排序值。仅适用于基于数字的数组字段

avg
使用所有值的平均值作为排序值。仅适用于基于数字的数组字段

median
使用所有值的中位数作为排序值。仅适用于基于数字的数组字段

下面的例子中价格是个列表结构，而通过设置`"mode" : "min"`,ES会根据此字段数组中最小的那个值进行排序

```java
GET offline_sales/_search
{
   "sort" : [
       {
          "price_list" : {
             "mode" :  "min",
             "order" : "asc"
          }
       }
    ]
}
```

#### 嵌套类型字段排序

Elasticsearch还支持根据一个或多个嵌套对象中的字段进行排序。支持按嵌套字段排序的嵌套排序选项具有以下属性:

参数
说明

path
定义对哪个嵌套对象进行排序。实际的排序字段必须是这个嵌套对象中的直接字段。按嵌套字段排序时，必须使用此字段。

filter
一个筛选器，嵌套路径内的内部对象应与之匹配，以便通过排序考虑其字段值。常见的情况是在嵌套的筛选器或查询中重复查询/筛选器。默认情况下，没有nested_filter是活动的。

max_children
在选择排序值时，每个根文档要考虑的子文档的最大数量。默认为无限。

nested
与顶级嵌套相同，但适用于当前嵌套对象中的另一个嵌套路径。

nested_path和nested_filter选项已经被弃用，取而代之的是上面记录的选项。

在下面的示例中，products是一个嵌套类型的字段。类似下面的结构

```java
"products" : [
	{
	  "product_id" : 1,
	  "price" : 10.0,
	  "quantity" : 1
	},
	{
	  "product_id" : 2,
	  "price" : 40.0,
	  "quantity" : 2
	},
	{
	  "product_id" : 3,
	  "price" : 30.0,
	  "quantity" : 3
	}
]
```

因为是数组，且又是嵌套类型，需要指定嵌套路径;否则，Elasticsearch不知道需要在什么嵌套级别上捕获排序值。下面的内容就是根据每个订单购买数量进行排序

```java
GET offline_sales/_search
{
   "sort" : [
       {
          "products.quantity" : {
             "mode" :  "sum",
             "order" : "asc",
             "nested": {
                "path": "products"
             }
          }
       }
    ]
}
```

#### 地理距离排序

除了针对传统数据进行排序，ES还支持根据地理位置进行排序。根据地理位置进行排序的时候需要指定一个初始坐标，使用地理位置排序支持以下参数。

参数
说明

distance_type
如何计算距离。可以是arc(默认值)，也可以是plane(更快，但在长距离和接近极点时不准确)。

mode
如果一个字段有几个地理点该怎么做。默认情况下，升序排序时考虑最短距离，降序排序时考虑最长距离。支持的值为min、max、median和avg。

unit
计算排序值时使用的单元。默认值是m(米)。

ignore_unmapped
指示是否应将未映射的字段视为丢失的值。将其设置为true相当于在字段sort中指定unmapped_type。默认值是false(未映射的字段导致搜索失败)。

> 地理距离排序不支持缺失值:当文档没有用于距离计算的字段值时，该距离总是被认为等于无穷大。

下面是根据之前创建的索引使用地理位置进行排序的例子。

```java
GET offline_sales/_search
{
    "sort": [
        {
            "_geo_distance": {
                "geo_location": [
                    114.3185806274,
                    30.5647434479
                ],
                "order": "asc",
                "unit": "m",
                "distance_type": "arc",
                "ignore_unmapped": false
            }
        }
    ]
}
```

其返回的`sort`字段为初始坐标点和数据中坐标点的直线距离

```java
"sort" : [
  2223.897834365496
]
```

在进行地理位置排序的时候，初始坐标点的设置并非固定，系统支持多种数据结构

**对象结构**

```java
GET offline_sales/_search
{
    "sort": [
        {
            "_geo_distance": {
                "geo_location": {
                    "lat": 30.5647434479,
                    "lon": 114.3185806274
                },
                "order": "asc",
                "unit": "m",
                "distance_type": "arc",
                "ignore_unmapped": false
            }
        }
    ]
}
```

**字符串类型**

```java
GET offline_sales/_search
{
    "sort": [
        {
            "_geo_distance": {
                "geo_location": "30.5647434479,114.3185806274",
                "order": "asc",
                "unit": "m",
                "distance_type": "arc",
                "ignore_unmapped": false
            }
        }
    ]
}
```

**Geohash**

```java
	"pin.location" : "drm3btev3e86",
```

**数组类型**

上面例子。

> 此处需要注意字符串类型和数组类型中经纬度的值顺序设置是相反的。

#### 字段缺失以及不存在字段

**字段参数缺失**

如果指定的字段，缺少值得时候ES提供了三个方式来设置其逻辑。默认值是_last

- _last：置于最后
- _first：置于最前
- 自定义参数：使用自定义的内容参与排序

```java
GET offline_sales/_search
{
    "sort": [
        {
            "total_price": {
                "missing": "_last"
            }
        }
    ]
}
```

**字段缺失**

默认情况下，如果依据一个不存在的字段进行排序，此处查询请求会失败，但是添加了`unmapped_type`参数后查询可以忽略没有映射的字段，并继续进行排序。

```java
GET offline_sales,online_sales/_search
{
    "sort": [
        {
            "real_price": {
                "unmapped_type" : "half_float"
            }
        }
    ]
}
```

虽然官方文档说明此时不会根据它们排序，但是实际上根据`sort`输出内容可以看到词字段被设置为了`Infinity`或者`-Infinity`(具体取决于你使用升序还是降序)

**missing和unmapped_type配合使用**

当尝试将两个索引合并查询并排序的时候，如果排序字段只存在于一张索引下，可以如下面例子中,没有此字段的索引参与排序的字段会被设置为默认的数字参与排序。

```java
GET offline_sales,online_sales/_search
{
    "sort": [
        {
            "real_price": {
                "unmapped_type" : "half_float",
                "missing": 210.0
            }
        }
    ]
}
```

#### 基于脚本的排序

排序的时候可以使用脚本来实现对排序值得修改，它并不会影响到字段的原始值而仅仅在排序中发挥作用。和之前介绍脚本使用一样在kibana中可以使用`"""`获得一个结构清晰的脚本内容。

下面例子就是对价格低于150的订单进行1.1倍的加成。

```java
GET offline_sales/_search
{
    "sort" : {
        "_script" : {
            "type" : "number",
            "script" : {
                "lang": "painless",
                "source": """
                        if (doc['total_price'].value < 150.0) {
                          doc['total_price'].value*params.factor
                        } else {
                          doc['total_price'].value
                        }
                    """,
                "params" : {
                    "factor" : 1.1
                }
            },
            "order" : "asc"
        }
    }
}
```

#### 跟踪分数

除非是基于`_score`进行排序，对其他字段进行排序的时候，结果中并不会显示文档得到的分数，此时假如需要获取文档的匹配分数的时候可以设置`"track_scores": true`，这样返回的文档中会显示文档的得分

```java
GET /offline_sales/_search
{
    "track_scores": true,
    "sort" : [
        "_doc"
    ]
}
```

### 关于排序的内存消耗

关于排序，在进行排序的时候排序字段的值会被整体加载到内存中，这就需要保证有足够的内存来保存这些数据。所以官方建议不应该对字符串类型的数据进行排序，而对于数值类型的字段进行排序的时候，尽可能的将其设置为较短类型的数据。
