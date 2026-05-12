# 28、ElasticSearch 实战：查询URI Search（简单查询字符串）
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/28.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

### 简单查询字符串——URI Search

实际业务中我们通常都是使用一个完整的请求体从elasticsearch获得数据。然而在有些时候我们为了调试系统或者数据的时候需要临时进行一些简单的查询时候，编写完整的请求体JSON可能会稍微麻烦。而elasticsearch提供了一种基于URI的简单的查询方式。虽然略显简陋，但是对于日常调试来说是一个比较方便的选择。

**查询支持的参数**

即使是基于URI的一行代码的请求elasticsearch依旧提供了不少参数以供其灵活的使用。这些参数大体可以分为三部分。

**1、** 针对查询条件的配置；

**2、** 针对查询结果的配置；

**3、** 针对查询过程的配置；

自己争取对官方文档中每一个请求进行测试。因为查询参数比较多写在文章中会显得比较臃肿，所以所有的查询都是基于索引`kibana_sample_data_ecommerce`的数据进行查询的，而此索引的数据来源于`kibana`的模拟数据。在集成`kibana`后，可以在首页的`Add sample data`操作中添加这些数据。

#### 针对查询条件的参数配置

参数
作用

q
执行查询的字符串

df
在没有设置查询字段的时候使用此参数指定的默认字段

analyzer
查询字符串时使用的分词器名称

analyze_wildcard
是否应该分析通配符和前缀查询。默认值为false。

default_operator
默认情况下对查询参数拆分后使用OR进行条件拼接，此参数可以设置OR或者AND来修改此逻辑

lenient
如果设置为true，将导致忽略基于格式的失败(比如向数字字段提供文本)。默认值为false。

**简单查询**

使用`q`执行查询的字符串，在其后面使用`{field_name}:{field_value}`的格式拼接成参数字符串，下面例子是查询`customer_last_name`为`Ruiz`的数据

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=customer_last_name:Ruiz
```

**设置默认查询字段（df）**

当在使用`q`进行查询的时候只设置查询值而不设置查询字段的时候elasticsearch会尝试在文档中所有字段中匹配查询值，只有通过设置`df`可以指定在缺失查询字段的时候的默认字段。下面例子是查询值为`22.99`的数据，此时使用默认字段`manufacturer`

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=22.99&df=manufacturer
```

**为查询指定分词器（analyzer）**

需要注意的是，在指定分词器的时候必须要使用`q`进行字段查询。在下面的两条语句中第一个使用的`keyword`分词器，查询内容会被认为一个术语而无法匹配出结果，第二条语句中查询内容会被分词然后匹配出数据。例子中使用分词查询`customer_full_name`为`this is Phelps&analyzer`的数据，分别使用`keyword`和`standard`

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=customer_full_name:this is Phelps&analyzer=keyword
GET kibana_sample_data_ecommerce/_search?size=10&q=customer_full_name:this is Phelps&analyzer=standard
```

**模糊查询**

`q`查询支持使用通配符的查询结果。下面例子查询`customer_full_name`为`Phelps`结尾的数据

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=customer_full_name:*Phelps
```

**修改条件拼接逻辑（default_operator）**

正常情况下如果没有指定多个参数的关系，Elasticsearch会使用OR来解析参数，下面例子中`ZO0367603676 ZO0704407044`会被解析为`ZO0367603676 OR ZO0704407044`当配置了此参数，系统会使用配置的逻辑进行条件拼接。下面例子就是查询`sku`包含`ZO0367603676`以及`ZO0704407044`的订单数据。

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=sku:ZO0367603676 ZO0704407044&default_operator=AND
```

#### 针对查询结果的配置

参数
作用

explain
是否返回命中文档的得分详情

_source
是否返回命中文档的详细信息

_source_includes
返回命中文档的指定字段信息

_source_exclude
不返回命中文档的指定字段信息

stored_fields
返回命中文档的指定的存储字段信息，其将不访问_source而直接返回存储的字段信息

sort
排序来执行。可以是fieldName的形式，也可以是fieldName:asc/fieldName:desc。fieldName可以是文档中的实际字段，也可以是特殊的_score名称，用于指示基于分数的排序。可以有多个排序参数(顺序很重要)。

track_scores
排序时，设置为true，以便仍然跟踪分数，并在每次命中时返回它们。

**查看查询结果分值的说明（explain）**

Elasticsearch在进行查询的时候会对每个文档根据条件计算出一个匹配度的分支，而此参数主要用来调试分值计算的详情。例子中尝试获取此条查询返回文档分值计算过程。

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=manufacturer:Oceanavigations&explain=true
```

在正常的返回数据之后会在`_explanation`字段，里面会详细显示分数计算过程

```java
 "_explanation" : {
          "value" : 1.8441883,
          "description" : "weight(manufacturer:oceanavigations in 5) [PerFieldSimilarity], result of:",
          "details" : [
            {
              "value" : 1.8441883,
              "description" : "score(freq=1.0), product of:",
              "details" : [
                {
                  "value" : 2.2,
                  "description" : "boost",
                  "details" : [ ]
                },
                {
                  "value" : 1.3446085,
                  "description" : "idf, computed as log(1 + (N - n + 0.5) / (n + 0.5)) from:",
                  "details" : [
                    {
                      "value" : 1218,
                      "description" : "n, number of documents containing term",
                      "details" : [ ]
                    },
                    {
                      "value" : 4674,
                      "description" : "N, total number of documents with field",
                      "details" : [ ]
                    }
                  ]
                },
                {
                  "value" : 0.6234286,
                  "description" : "tf, computed as freq / (freq + k1 * (1 - b + b * dl / avgdl)) from:",
                  "details" : [
                    {
                      "value" : 1.0,
                      "description" : "freq, occurrences of term within document",
                      "details" : [ ]
                    },
                    {
                      "value" : 1.2,
                      "description" : "k1, term saturation parameter",
                      "details" : [ ]
                    },
                    {
                      "value" : 0.75,
                      "description" : "b, length normalization parameter",
                      "details" : [ ]
                    },
                    {
                      "value" : 1.0,
                      "description" : "dl, length of field",
                      "details" : [ ]
                    },
                    {
                      "value" : 2.9602053,
                      "description" : "avgdl, average length of field",
                      "details" : [ ]
                    }
                  ]
                }
              ]
            }
          ]
        }
```

**不需要返回数据详情或者只返回部分数据信息（_source）**

**1、** _source；

很多时候我们查询可能只是需要进行数据的统计。比如下面例子中我可能只是希望知道订单用户数，并不关系每个订单的实际内容，这个时候将`_source`设置为`false`可以让结果显得干净一些

```java
GET kibana_sample_data_ecommerce/_search?size=10&q=_exists_:customer_full_name&_source=false
```

**1、** _source_includes和_source_excludes；

同样有些时候一个文档中存在的字段太多，或者某个字段内容太长。我们只想看到部分字段或者屏蔽部分字段内容的时候可以使用这两个参数来指定对相关字段的处理。

```java
GET kibana_sample_data_ecommerce/_search?size=10&_source_includes=customer_first_name
GET kibana_sample_data_ecommerce/_search?size=10&_source_excludes=customer_first_name
```

**为查询结果设置排序（sort）**

对查询结果的排序，只需要在后面使用`fieldName:asc`或者`fieldName:desc`就可以了，fieldName可以是文档中的实际字段也可以是_score。

```java
GET kibana_sample_data_ecommerce/_search?size=10&sort=taxless_total_price:asc
```

可以有多个排序参数，但是排序的时候请注意顺序

```java
GET kibana_sample_data_ecommerce/_search?size=10&sort=taxless_total_price:asc,order_id:asc
```

**在排序的时候依旧显示分数（track_scores）**

在上面的排序例子中最终返回结果中分数是没有被显示的`"_score" : null`。而此参数被设置为true后，查询过程中会仍然跟踪分数，并在每次命中时返回分数结果。

```java
GET kibana_sample_data_ecommerce/_search?size=10&sort=taxless_total_price:asc&track_scores=true
```

#### 针对查询过程的配置

参数
作用

batched_reduce_size
在协调节点上应该减少碎片结果的数量。如果请求中的碎片数量可能很大，则应该使用此值作为一种保护机制，以减少每个搜索请求的内存开销。

track_total_hits
默认为10000。设置为false以禁用对匹配查询的总命中数的跟踪。该整数表示要精确计数的命中次数

timeout
搜索超时时间。默认不超时。

terminate_after
为每个碎片收集的最大文档数量，当达到该数量时，查询执行将提前终止。如果设置了，则响应将具有一个布尔字段terminated_early，以指示查询执行是否实际使用了terminated_early。默认情况下没有terminate_after。

from
要返回的命中的起始索引。默认值为0

size
返回的命中次数。默认为10。

search_type
要执行的搜索操作的类型。可以是dfs_query_then_fetch或query_then_fetch。默认为query_then_fetch。

allow_partial_search_results
设置为false，如果请求将产生部分结果，则返回整个失败。默认值为true，在超时或部分失败的情况下允许部分结果。可以使用集群级设置search.default_allow_partial_results来控制这个默认值。

**返回命中文档数量的追踪结果（track_total_hits）**

此参数主要是返回查询最后命中的文档的数量。当命中的次数大于设置的次数的时候便不再追踪后续命中的数量了。注意此内容只是作为命中计数的跟踪，并不能限制实际查询数量。

```java
GET kibana_sample_data_ecommerce/_search?size=10&sort=taxless_total_price:asc&track_total_hits=100
```

上面例子中在不添加`track_total_hits=100`的时候返回结果发现命中了4675条数据

```java
    "total" : {
      "value" : 4675,
      "relation" : "eq"
    }
```

但是在配置了追踪上限为100后返回的文档命中数量就只有100了。

```java
	"total" : {
      "value" : 100,
      "relation" : "gte"
    },
```

**设置超时时间（timeout）**

超时时间是一个简单的API，需要注意的是参数中需要携带时间单位。

```java
GET kibana_sample_data_ecommerce/_search?size=10&timeout=100ms
```

**设置查询开始的位置（from）**

`from` 比较类似MYSQL中的`limit`，他设置的参数为从命中文档中的指定位置开始显示数据。下面例子中，第一条查询显示的4条数据，第二条查询中显示的是上面4条数据中的第3、第4条。

```java
GET kibana_sample_data_ecommerce/_search?size=4&sort=order_id:asc&_source_includes=order_id
GET kibana_sample_data_ecommerce/_search?size=2&sort=order_id:asc&from=2&_source_includes=order_id
```

**配置不同的查询类型（search_type）**

`search_type`可以设置ES查询所使用的的方式，官方文章中提到了两种查询方式`query_then_fetch`和`dfs_query_then_fetch`。这里就简单介绍下。

**1、** query_then_fetch；

此查询类型是默认的查询类型，其查询流程：

首先，先向所有的shard发出请求，各分片只返回排序和排名相关的信息，然后在协调节点中汇总各个分片分会的分数进行排序，取出size个文档。

然后，去相关的shard获取文档数据。

**1、** dfs_query_then_fetch；

这种方式操作类似于`query_then_fetch`区别是多了一步`initial scatter`操作。此操作是在进行最终查询之前，会先把各个分片中词频率和文档频率收集一下，然后各分片依据全局的词频率和文档频率进行搜索和排名。这样和`query_then_fetch`多出一步操作、效率较低，但是这种方法的搜索精度会高于`query_then_fetch`。
