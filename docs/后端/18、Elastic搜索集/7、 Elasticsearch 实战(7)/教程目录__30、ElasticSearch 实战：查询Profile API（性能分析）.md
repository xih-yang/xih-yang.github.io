# 30、ElasticSearch 实战：查询Profile API（性能分析）
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/30.html
- 分类：搜索引擎
- 分组：教程目录
### Profile API 性能分析

平时开发的过程中我们可能需要对一些查询操作进行优化，而优化之前的工作就是要对操作的性能进行分析，而ES提供了Profile API来帮助用户进行性能分析。它让用户了解如何在较低的级别执行搜索请求，这样用户就可以理解为什么某些请求比较慢，并采取措施改进它们。

需要注意的是Profile API不测量网络延迟、搜索资源获取阶段、请求在队列中花费的时间或在协调节点上合并碎片响应时花费的时间。

需要注意的是开启性能分析会给查询带来非常大的性能开销。所以不要尝试将一个开启了性能分析的请求和为开启性能分析的请求比对时间效率。

**开启性能分析**

需要开启性能分析，只需要在原有请求中设置`"profile": true`。而当查询嵌套的内容比较多的时候返回的性能分析内容会非常冗长，所以可以在请求URI后面设置`?human=true`获取比较清晰的结构。

**性能分析结构**

下面依旧是使用之前kibana创建的`kibana_sample_data_ecommerce`做测试。下面是一个简单的查询请求。

```java
GET /kibana_sample_data_ecommerce/_search?human=true
{
    "profile": true,
    "_source": false, 
    "query": {
        "match": {
            "category": "Women's Shoes"
        }
    }
}
```

**返回内容**

性能分析的相关报告在`profile`对象内。

```java
{
    "took": 11,
    "timed_out": false,
    "_shards": {
        ......
    },
    "hits": {
        ......
    },
    "profile": {
        "shards": [
            {
                "id": "[tMhvMfVrTnGguu5QJ-1j-Q][kibana_sample_data_ecommerce][0]",
                "searches": [
                    {
                        "query": [
                            {
                                "type": "BooleanQuery",
                                "description": "category:women's category:shoes",
                                "time": "14.6ms",
                                "time_in_nanos": 14642543,
                                "breakdown": {
                                    "set_min_competitive_score_count": 0,
                                    "match_count": 3372,
                                    "shallow_advance_count": 0,
                                    "set_min_competitive_score": 0,
                                    "next_doc": 12574965,
                                    "match": 182802,
                                    "next_doc_count": 3378,
                                    "score_count": 3372,
                                    "compute_max_score_count": 0,
                                    "compute_max_score": 0,
                                    "advance": 0,
                                    "advance_count": 0,
                                    "score": 558388,
                                    "build_scorer_count": 12,
                                    "create_weight": 161677,
                                    "shallow_advance": 0,
                                    "create_weight_count": 1,
                                    "build_scorer": 1154576
                                },
                                "children": [
                                    {
                                        "type": "TermQuery",
                                        "description": "category:women's",
                                        "time": "1.3ms",
                                        "time_in_nanos": 1326026,
                                        "breakdown": {
                                            "set_min_competitive_score_count": 0,
                                            "match_count": 0,
                                            "shallow_advance_count": 50,
                                            "set_min_competitive_score": 0,
                                            "next_doc": 0,
                                            "match": 0,
                                            "next_doc_count": 0,
                                            "score_count": 2466,
                                            "compute_max_score_count": 50,
                                            "compute_max_score": 248144,
                                            "advance": 312952,
                                            "advance_count": 2472,
                                            "score": 201148,
                                            "build_scorer_count": 18,
                                            "create_weight": 82500,
                                            "shallow_advance": 82773,
                                            "create_weight_count": 1,
                                            "build_scorer": 393452
                                        }
                                    },
                                    {
                                        "type": "TermQuery",
                                        "description": "category:shoes",
                                        "time": "1ms",
                                        "time_in_nanos": 1089732,
                                        "breakdown": {
                                            "set_min_competitive_score_count": 0,
                                            "match_count": 0,
                                            "shallow_advance_count": 48,
                                            "set_min_competitive_score": 0,
                                            "next_doc": 0,
                                            "match": 0,
                                            "next_doc_count": 0,
                                            "score_count": 2080,
                                            "compute_max_score_count": 48,
                                            "compute_max_score": 183654,
                                            "advance": 454098,
                                            "advance_count": 2086,
                                            "score": 164281,
                                            "build_scorer_count": 18,
                                            "create_weight": 36149,
                                            "shallow_advance": 79552,
                                            "create_weight_count": 1,
                                            "build_scorer": 167717
                                        }
                                    }
                                ]
                            }
                        ],
                        "rewrite_time": 12723,
                        "collector": [
                            {
                                "name": "CancellableCollector",
                                "reason": "search_cancelled",
                                "time": "1.1ms",
                                "time_in_nanos": 1112587,
                                "children": [
                                    {
                                        "name": "SimpleTopScoreDocCollector",
                                        "reason": "search_top_hits",
                                        "time": "739.7micros",
                                        "time_in_nanos": 739707
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "aggregations": [
                ]
            }
        ]
    }
}
```

上面是一个非常简单的查询并不存在聚合内容，返回的分析报告相对也是比较简单的。

**参数解析**

参数
说明

id
对于参与响应的每个碎片，将返回一个分析报告，并由惟一的ID标识

query
显示查询的执行的详细分析内容

rewrite_time
表示累计重写时间的时间

collector
关于运行搜索的Lucene收集器的分析

aggregations
聚合分析的详细信息，上面内容因为不存在聚合分析所以为空

**shards**

因为针对一个索引的搜索可能涉及一个或者多个碎片。所以分析报告中`shards`是一个对象数组，每个分片都列出其ID，用来标识不同的分片。ID的命名格式`节点ID+索引名称+分片索引`

**query**

其是对基础Lucene索引执行的查询。用户提交的大多数搜索请求都只针对Lucene索引执行一次搜索。但是偶尔会执行多个搜索，比如包含一个全局聚合(需要为全局上下文执行第二个“match_all”查询)。

#### 查询分析

`query`部分包含Lucene在特定碎片上执行查询树的详细时间。这个查询树的结构会类似于最初请求数据时候的查询结构。其会在`description`字段中提供类似的解释。下面看下上面例子的分析报告

```java
"query" : [
  {
	"type" : "BooleanQuery",
	"description" : "category:women's category:shoes",
	"time" : "3.5ms",
	"time_in_nanos" : 3540328,
	"breakdown" : {
		......
	},
	"children" : [
            {
                "type": "TermQuery",
                "description": "category:women's",
                "time": "1.3ms",
                "time_in_nanos": 1326026,
                "breakdown": {
                    "set_min_competitive_score_count": 0,
                    "match_count": 0,
                    "shallow_advance_count": 50,
                    "set_min_competitive_score": 0,
                    "next_doc": 0,
                    "match": 0,
                    "next_doc_count": 0,
                    "score_count": 2466,
                    "compute_max_score_count": 50,
                    "compute_max_score": 248144,
                    "advance": 312952,
                    "advance_count": 2472,
                    "score": 201148,
                    "build_scorer_count": 18,
                    "create_weight": 82500,
                    "shallow_advance": 82773,
                    "create_weight_count": 1,
                    "build_scorer": 393452
                }
            },
            {
                "type": "TermQuery",
                "description": "category:shoes",
                "time": "1ms",
                "time_in_nanos": 1089732,
                "breakdown": {
                    ......
                }
            }
	]
  }
],
```

上面的查询条件被Lucene重写为一个带有两个子句，`type`字段显示Lucene类名，`description`字段显示了查询的Lucene解释文本，用于帮助区分查询的各个部分。`time_in_nanos`字段显示整个查询的花费（注意计时是以纳秒为单位列出的）。然后子数组列出可能存在的所有子查询。

**breakdown**

细分组件列出了底层Lucene执行的详细时间统计

```java
"breakdown" : {
    "set_min_competitive_score_count": 0,
    "match_count": 0,
    "shallow_advance_count": 50,
    "set_min_competitive_score": 0,
    "next_doc": 0,
    "match": 0,
    "next_doc_count": 0,
    "score_count": 2466,
    "compute_max_score_count": 50,
    "compute_max_score": 248144,
    "advance": 312952,
    "advance_count": 2472,
    "score": 201148,
    "build_scorer_count": 18,
    "create_weight": 82500,
    "shallow_advance": 82773,
    "create_weight_count": 1,
    "build_scorer": 393452
},
```

**breakdown参数的意义**

参数名称
说明

create_weight
Lucene中的查询必须能够跨多个IndexSearchers重用，而很多查询需要统计和它对应的索引相关的信息，所以Lucene要求每个查询生成一个Weight对象，它作为一个临时上下文对象来保存与相关联的状态。此参数表示创建这个对象花费的时间

build_scorer
构建一个计分器所花费的时间

next_doc
Lucene中next_doc方法，统计的是确定下一个匹配文档所需的时间

advance
Lucene中advance方法，next_doc的低级版本，用来查找下一个匹配的文档。因为并不是所有查询使用next_doc，所以advance也统计了此类查询的时间

match
有些查询比如短语查询（phrase queries）需要对文档进“近似地”匹配，此时查询过程中会存在第二阶段检查。其作用是匹配统计量的度量

score
统计了为文档打分的时间

*_count
记录特定方法的调用次数。例如，“next_doc_count”:2，表示在两个不同的文档上调用了nextDoc()方法。这可以通过比较不同查询组件之间的计数来帮助判断查询的选择性。

**collector**

Lucene为查询定义了一个收集器（Collector），负责协调遍历、评分以及匹配文档的收集。

```java
"collector": [
    {
        "name": "CancellableCollector",
        "reason": "search_cancelled",
        "time": "1.1ms",
        "time_in_nanos": 1112587,
        "children": [
            {
                "name": "SimpleTopScoreDocCollector",
                "reason": "search_top_hits",
                "time": "739.7micros",
                "time_in_nanos": 739707
            }
        ]
    }
]
```

**collector收集器**

`reason`字段尝试给出收集器类名的简单英文描述。而目前官方网站列出的收集器包含下面内容

收集器
收集器作用

search_sorted
对文件进行评分和分类的收集者。这是最常见的收集器，在大多数简单的搜索中都可以看到

search_count
仅计算与查询匹配的文档数量，但不获取源的收集器。这可以在指定size: 0时看到

search_terminate_after_count
在找到n个匹配文档后终止搜索执行的收集器。这可以在指定terminate_after_count查询参数时看到

search_min_score
只返回得分大于n的匹配文档的收集器。当指定了顶级参数min_score时，可以看到这种情况

search_multi
一个封装多个收集器的收集器。当搜索、聚合、全局agg和post_filters在单个搜索中组合时，可以看到这一点

search_timeout
在一段指定时间后停止执行的收集器。这可以在指定超时顶级参数时看到

aggregation
Elasticsearch用于对查询范围运行聚合的收集器。单个聚合收集器用于收集所有聚合的文档

global_aggregation
针对全局查询范围而不是指定查询执行聚合的收集器。

**search_top_hits以及search_cancelled**

关于这两个官方案例使用的收集器，在其文档中并没有说明，而我查询了`stackoverflow`也没有发现相关内容。后来我在`lucene`文档中查到了`org.apache.lucene.search.TopDocsCollector`类似的收集器类，主要是返回指定top数的文档。

**rewrite_time（重写时间）**

Lucene中的所有查询都要经历一次或者多次“重写”过程。这个过程将一直持续下去，直到查询停止变化。这个过程允许Lucene执行优化，例如删除冗余子句，替换一个查询以获得更有效的执行路径等等。这个值是包含所有被重写查询的总时间。

#### aggregations Section 聚合性能分析

使用聚合的查询时，其聚合内容的分析存在于`aggregations`对象中，其嵌套结构类似于查询请求时的嵌套结构。使用聚合的性能分析可以查看查询中聚合内容消耗资源的详情。

现在再次发出请求，此请求除了包含`query`还覆盖了`aggs`聚合以及嵌套聚合。

```java
GET /kibana_sample_data_ecommerce/_search
{
  "profile": true,
  "query": {
    "term": {
      "currency": {
        "value": "EUR"
      }
    }
  },
  "aggs": {
    "week": {
      "terms": {
        "field": "day_of_week"
      }
    },
    "gender_agg": {
      "global": {
     },
      "aggs": {
        "gender": {
          "terms": {
            "field": "customer_gender"
          }
        }
      }
    }
  },
  "post_filter": {
    "match": {
      "message": "some"
    }
  }
}
```

最后返回的性能信息的聚合部分如下面的内容

```java
{
    "profile": {
        "shards": [
            {
                "id": "[tMhvMfVrTnGguu5QJ-1j-Q][kibana_sample_data_ecommerce][0]",
                "aggregations": [
                    {
                        "type": "LowCardinality",
                        "description": "week",
                        "time_in_nanos": 1121184,
                        "breakdown": {
                            "reduce": 0,
                            "build_aggregation": 129073,
                            "build_aggregation_count": 1,
                            "initialize": 3620,
                            "initialize_count": 1,
                            "reduce_count": 0,
                            "collect": 983814,
                            "collect_count": 4675
                        }
                    },
                    {
                        "type": "GlobalAggregator",
                        "description": "gender_agg",
                        "time_in_nanos": 8733554,
                        "breakdown": {
                            "reduce": 0,
                            "build_aggregation": 34655,
                            "build_aggregation_count": 1,
                            "initialize": 12318,
                            "initialize_count": 1,
                            "reduce_count": 0,
                            "collect": 8681904,
                            "collect_count": 4675
                        },
                        "children": [
                            {
                                "type": "GlobalOrdinalsStringTermsAggregator",
                                "description": "gender",
                                "time_in_nanos": 6729126,
                                "breakdown": {
                                    "reduce": 0,
                                    "build_aggregation": 29463,
                                    "build_aggregation_count": 1,
                                    "initialize": 3148,
                                    "initialize_count": 1,
                                    "reduce_count": 0,
                                    "collect": 6691838,
                                    "collect_count": 4675
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

可以看到上面`week`聚合部分使用了`LowCardinality`，在同一层级上`gender_agg`使用的是GlobalAggregator。在`time_in_nanos`中详细给出了每个聚合所消耗的时间。

**时间分析（Timing Breakdown）**

`Timing Breakdown`对象内的数据分析了底层`Lucene`执行的详细时间消耗。以`week`的时间分析为例子。

```java
"breakdown": {
	"reduce": 0,
	"build_aggregation": 129073,
	"build_aggregation_count": 1,
	"initialize": 3620,
	"initialize_count": 1,
	"reduce_count": 0,
	"collect": 983814,
	"collect_count": 4675
}
```

统计的意义如下:

参数描述

参数
说明

initialize
代表的是在开始文档收集之前创建和初始化所消耗的时间

collect
表示聚合在收集文档阶段话费的时间。

build_aggregation
文档收集完成后，创建准备好聚合的结果发送至reducing node的时间

reduce
目前未使用的统计内容，稍后将添加reduce阶段的计时。

*_count
统计方法的调用次数，比如上面结果中collect_count返回的是collect()的调用次数

#### Profiling使用时需要注意的内容

**使用时需要注意**

**1、** 使用性能分析API会给搜索执行引入了较大的开销所以除非需要调试，其不应该在生产环境中被启用；

**2、** 一些简单方法如collect,advance,next_doc开销可能更大，因为这些方法是在循环中调用的；

**3、** 因为分析带来的额外消耗，所以不应该将启用性能分析和未启用性能分析的查询进行比较；

**Profiling存在的局限**

**1、** 性能分析不能获取搜索数据获取以及网络开销；

**2、** 性能分析也不考虑在队列中花费的时间、合并协调节点上的shard响应，或诸如构建全局序数之类的额外工作；

**3、** 性能分析目前无法应用于搜索建议（suggestions），高亮搜索（highlighting）；

**4、** 目前reduce阶段无法使用性能分析统计结果；

**5、** 性能分析是个实验性的功能；
