# 10、ElasticSearch 实战：聚合分析
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/10.html
- 分类：搜索引擎
- 分组：教程目录
### 聚合查询

在使用关系型数据库的时候，常常会用到group by等操作进行分组求和、求平均的操作。而Elasticsearch同样提供了分组计算的能力。

关系型数据库中使用Group by进行分组计算在Elasticsearch中成为桶聚合。

### 数据准备

使用聚合查询之前几篇的数据可能不太适合，现在重新模拟一些数据。

#### 新建索引

```java
PUT localhost:9200/employee
```

#### 新建映射

```java
PUT localhost:9200/employee/_mapping
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "age": {
            "type": "integer"
        },
        "group": {
            "type": "keyword"
        },
        "entry_time": {
            "type": "date"
        }
    }
}
```

#### 新建数据

```java
    public static String INDEX = "employee";
    public static String[] GROUP = new String[] {
     "甲","乙","丙","丁"};
    public static int[] AGE = new int[] {
     15,20,25,30,35,40,45,50};
    public static String[] TIME =
        new String[] {
     "2019-01-01","2019-01-15","2019-02-01","2019-02-15",
                      "2019-03-01","2019-03-15","2019-04-01","2019-04-15",
                      "2019-05-01","2019-05-15","2019-06-01","2019-06-15",
                      "2019-07-01","2019-07-15","2019-08-01","2019-08-15",
                      "2019-09-01","2019-09-15","2019-10-01","2019-10-15",
                      "2019-11-01","2019-11-15","2019-12-01","2019-12-15"};
    public static void createData() throws IOException {
        BulkRequest request = new BulkRequest();
        for (int i = 0; i < 100; i++) {
            request.add(
                new IndexRequest(INDEX)
                    .id(String.valueOf(i+1))
                    .source(getBuilder(i))
            );//使用SMILE格式添加索引请求
        }
        getClient().bulk(request, RequestOptions.DEFAULT);
    }
    public static XContentBuilder getBuilder(int i) throws IOException {
        XContentBuilder builder = XContentFactory.jsonBuilder();
        builder.startObject();
        builder.field("name", GROUP[i%4] + i);
        builder.field("age", AGE[i%8]);
        builder.field("group", GROUP[i%4]);
        builder.field("entry_time", TIME[i%24]);
        builder.endObject();
        return builder;
    }
```

#### 聚合查询

##### 求平均值

现在模拟求所属`甲`分组`age`字段的平均值。可以使用下面的命令。聚合查询中这些常用的计算和SQL中是类似的`avg是求平均`、`sum求和`、`max求最`大、`min求最小`。这里我只贴出了`avg`的代码

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

Elasticsearch对于数据的聚合分析，都是使用`aggs`来完成每个桶内的数据的分组其中`aggQuery`是每次计算的一个别名，用来取出计算结果的时候使用。

```java
{
    "query": {
        "term": {
            "group": {
                "value": "甲"
            }
        }
    },
    "aggs": {
        "aggQuery": {
            "avg": {
                "field": "age"
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 25,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 24.6
        }
    }
}
```

**java代码**

Elasticsearch对于数据的分组，都是使用

```java
    // 平均
    public void avg() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("group","甲"));
        AvgAggregationBuilder agg = AggregationBuilders
            .avg("aggQuery")
            .field("age");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedAvg parsed = search.getAggregations().get("aggQuery");
            double value = parsed.getValue();
            System.out.println("rest:" + value);
            System.out.println("do something");
        }
    }
```

##### 求总

`value_count`的操作可以获取在该字段上非空的数据的条目数。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "query": {
        "term": {
            "group": {
                "value": "甲"
            }
        }
    },
    "aggs": {
        "aggQuery": {
            "value_count": {
                "field": "age"
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 25,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 25
        }
    }
}
```

**java代码**

```java
    // 统计
    public void count() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("group","甲"));
        ValueCountAggregationBuilder agg = AggregationBuilders
            .count("aggQuery")
            .field("age");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedValueCount parsed = search.getAggregations().get("aggQuery");
            double value = parsed.getValue();
            System.out.println("rest:" + value);
            System.out.println("do something");
        }
    }
```

##### 去重

其用法类似SQL中的 distinct 或者unique 值的数目。是有种获取数据去重后的结果的方法。

下面的内容尝试求出现在模拟求所属`甲`分组`age`字段后去重的内容，`aggQuery`是每次计算的一个别名，用来取出计算结果的时候使用。下面的内容在忽略query条件后可能类似这个样子：

```java
SELECT COUNT (DISTINCT age) FROM employee 
```

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "query": {
        "term": {
            "group": {
                "value": "甲"
            }
        }
    },
    "aggs": {
        "aggQuery": {
            "cardinality": {
                "field": "age"
            }
        }
    },
    "size": 0
}
```

**响应结果**

在`hits`中可以看到其命中的文档数量是25.但是在`aggregations`的`aggQuery`去重后只有2个数据。

```java
{
    "took": 3,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 25,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "value": 2
        }
    }
}
```

**java代码**

```java
    // 去重
    public void cardinality() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("group","甲"));
        CardinalityAggregationBuilder agg = AggregationBuilders
            .cardinality("aggQuery")
            .field("age");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedCardinality parsed =
                search.getAggregations().get("aggQuery");
            double value = parsed.getValue();
            System.out.println("rest:" + value);
            System.out.println("do something");
        }
    }
```

##### stats 多个聚合结果

上面介绍了Es提供了求大小值、平均值以及总和的方法，另外ES提供了stats方法可以一次把上面的内容全部查询出来。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "query": {
        "term": {
            "group": {
                "value": "甲"
            }
        }
    },
    "aggs": {
        "aggQuery": {
            "stats": {
                "field": "age"
            }
        }
    },
    "size": 0
}
```

**响应结果**

可以看到在`aggQuery`中返回了五个结果分别对应常用的聚合计算方法。

```java
{
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 25,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "count": 25,
            "min": 15.0,
            "max": 35.0,
            "avg": 24.6,
            "sum": 615.0
        }
    }
}
```

**java代码**

```java
    // stats 多个聚合结果
    public void stats() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("group","甲"));
        StatsAggregationBuilder agg = AggregationBuilders
            .stats("aggQuery")
            .field("age");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedStats parsed =
                search.getAggregations().get("aggQuery");
            double avg = parsed.getAvg();
            double max = parsed.getMax();
            double min = parsed.getMin();
            double sum = parsed.getSum();
            long count = parsed.getCount();
            System.out.println("avg:" + avg);
            System.out.println("max:" + max);
            System.out.println("min:" + min);
            System.out.println("sum:" + sum);
            System.out.println("count:" + count);
            System.out.println("do something");
        }
    }
```

##### 占比百分位查询

除了类似SQL提供了常用的分组计算方法，es还提供了ppercentiles百分比计算的方法。此方法的作用是计算在某个字段中，处于一定top值内的数据。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "percentiles": {
                "field": "age"
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 6,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "values": {
                "1.0": 15.0,
                "5.0": 15.0,
                "25.0": 20.0,
                "50.0": 30.0,
                "75.0": 40.0,
                "95.0": 50.0,
                "99.0": 50.0
            }
        }
    }
}
```

使用默认的参数可以求出上面分段的值。当然可以在参数中添加`percents`的参数值，来查询自己需要的内容。

```java
{
    "aggs": {
        "aggQuery": {
            "percentiles": {
                "field": "age",
                "percents": [
                      50,
                      95,
                      99
                ]
            }
        }
    },
    "size": 0
}
```

**java代码**

```java
    //  占比百分位对应的值统计
    public void percentiles() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        PercentilesAggregationBuilder agg = AggregationBuilders
            .percentiles("aggQuery")
            .field("age");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedPercentiles parsed = search.getAggregations().get("aggQuery");
            Iterator<Percentile> iterator = parsed.iterator();
            while (iterator.hasNext()) {
                Percentile next = iterator.next();
                System.out.println(next.getPercent() + ":" + next.getValue());
                System.out.println("do something");
            }
        }
    }
```

#### 桶聚合查询

上面的内容，只是简单的使用了常用的分组计算或者聚合计算的内容。而Es在数据分析中用的最多的是，桶聚合查询的内容。这也是类似SQL中`group by`的操作

##### 分组聚合

我们尝试求出不同`age`分组内数据量的结果，可以使用下面的命令。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

这里可以注意`size`的设置。最外层的`size`控制了要展示命中的文档内容，但是我们只是希望知道文档的数量而不是内容，所以设置了0。而内层的`size`显示的是我们分组计算后展示的结果条目数，这里的`size`可以根据业务进行设置。一般进行桶聚合的时候桶的数量最好不能过大（超过10000）。过多的桶会极大的消耗系统资源。甚至造成内存溢出。

```java
{
    "aggs": {
        "aggQuery": {
            "terms": {
                "field": "age",
                "size": 3
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 102,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 61,
            "buckets": [
                {
                    "key": 15,
                    "doc_count": 13
                },
                {
                    "key": 20,
                    "doc_count": 13
                },
                {
                    "key": 25,
                    "doc_count": 13
                }
            ]
        }
    }
}
```

**java代码**

```java
    //  分组聚合
    public static void termAggs() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        TermsAggregationBuilder agg =
            AggregationBuilders.terms("aggQuery").field("age").size(5);
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedTerms parsed = search.getAggregations().get("aggQuery");
            for (Terms.Bucket item : parsed.getBuckets()) {
                System.out.println(item.getKeyAsString() + ":" + item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

##### 分组聚合排序（使用聚合关键词排序）

ES分组API中提供了排序的设置，`_key`指的是根据分组的字段进行排序。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "terms": {
                "field": "age",
                "size": 5,
                "order": {
                    "_key": "desc"
                }
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 39,
            "buckets": [
                {
                    "key": 50,
                    "doc_count": 12
                },
                {
                    "key": 45,
                    "doc_count": 12
                },
                {
                    "key": 40,
                    "doc_count": 12
                },
                {
                    "key": 35,
                    "doc_count": 12
                },
                {
                    "key": 30,
                    "doc_count": 13
                }
            ]
        }
    }
}
```

**java代码**

```java
    //  分组聚合排序
    public void termAggsOrder() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        TermsAggregationBuilder agg =
            AggregationBuilders.terms("aggQuery")
                .field("age")
                .size(5)
                .order(BucketOrder.key(false));
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedTerms parsed = search.getAggregations().get("aggQuery");
            for (Terms.Bucket item : parsed.getBuckets()) {
                System.out.println(item.getKeyAsString() + ":" + item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

##### 分组聚合排序（使用匹配结果排序）

当然除了对数据中的字段进行排序，ES还支持针对分组的结果作为排序的一句。使用`_count`，将命中的文档数量作为排序依据进行排序。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "terms": {
                "field": "age",
                "size": 5,
                "order": {
                    "_count": "asc"
                }
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 39,
            "buckets": [
                {
                    "key": 35,
                    "doc_count": 12
                },
                {
                    "key": 40,
                    "doc_count": 12
                },
                {
                    "key": 45,
                    "doc_count": 12
                },
                {
                    "key": 50,
                    "doc_count": 12
                },
                {
                    "key": 15,
                    "doc_count": 13
                }
            ]
        }
    }
}
```

**java代码**

```java
    public void termAggsCountOrder() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        TermsAggregationBuilder agg =
            AggregationBuilders.terms("aggQuery")
                .field("age")
                .size(5).order(BucketOrder.count(true));
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedTerms parsed = search.getAggregations().get("aggQuery");
            for (Terms.Bucket item : parsed.getBuckets()) {
                System.out.println(item.getKeyAsString() + ":" + item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

##### 分组聚合中使用筛选功能

ES在进行桶聚合的时候，除了排序内容，也允许设置一些例外操作。

使用`include`可以设置哪些内容可以接收分组，当然也可以设置`exclude`参数将一些内容排除出分组操作之外。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "terms": {
                "field": "group",
                "include": [
                    "甲",
                    "乙",
                    "丙"
                ],
                "exclude": [
                    "丙"
                ],
                "size": 10,
                "order": {
                    "subAgg": "desc"
                }
            },
            "aggs": {
                "subAgg": {
                    "avg": {
                        "field": "age"
                    }
                }
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": "乙",
                    "doc_count": 25,
                    "subAgg": {
                        "value": 29.6
                    }
                },
                {
                    "key": "甲",
                    "doc_count": 25,
                    "subAgg": {
                        "value": 24.6
                    }
                }
            ]
        }
    }
}
```

**java代码**

```java
    // 筛选分组聚合
    public static void include() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        TermsAggregationBuilder agg =
            AggregationBuilders
                .terms("aggQuery")
                .field("group")
                .size(10)
                .includeExclude(
                    new IncludeExclude(
                        new String[]{
     "甲","乙","丙"},
                        new String[]{
     "丙"})
                )
                .order(BucketOrder.aggregation("subAgg",false));
        AvgAggregationBuilder field =
            AggregationBuilders.avg("subAgg").field("age");
        agg.subAggregation(field);
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedTerms parsed = search.getAggregations().get("aggQuery");
            for (Terms.Bucket item : parsed.getBuckets()) {
                System.out.println(item.getKeyAsString() + ":" + item.getDocCount());
                ParsedAvg subAgg = item.getAggregations().get("subAgg");
                System.out.println("subAgg:" + subAgg.getValue());
            }
            System.out.println("do something");
        }
    }
```

##### 范围分组聚合

ES提供ranges方法来方便进行范围查询。其类似SQL中的`between and`的操作，但是ES提供了两个不同的API来实现范围查询`ranges`是进行数字类型的范围查询。`date_range`进行时间范围的查询。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

可以在每个查询范围中设置`key`字段作为一个别名，方便我们在获取数据后使用此别名用来获取内容。

```java
{
    "aggs": {
        "aggQuery": {
            "range": {
                "field": "age",
                "ranges": [
                    {
                        "to": 20,
                        "key": "young"
                    },
                    {
                        "from": 20,
                        "to": 40,
                        "key": "middle"
                    },
                    {
                        "from": 40,
                        "key": "old"
                    }
                ]
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 1,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "buckets": [
                {
                    "key": "young",
                    "to": 20.0,
                    "doc_count": 13
                },
                {
                    "key": "middle",
                    "from": 20.0,
                    "to": 40.0,
                    "doc_count": 51
                },
                {
                    "key": "old",
                    "from": 40.0,
                    "doc_count": 36
                }
            ]
        }
    }
}
```

**java代码**

```java
    // 范围分组聚合
    public void rangeAggregation() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        RangeAggregationBuilder agg =
            AggregationBuilders
                .range("aggQuery")
                .field("age")
                .addUnboundedTo("young",20)
                .addRange("middle",20,40)
                .addUnboundedFrom("old", 40);
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedRange parsed = search.getAggregations().get("aggQuery");
            for (Range.Bucket item : parsed.getBuckets()) {
                System.out.println(item.getKeyAsString() + ":" + item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

##### 时间范围分组聚合

之前在介绍Elasticsearch字段的时候，说过Elasticsearch中的Date格式其实是根据dateFormat的样式进行格式化成日期的字符串类型。所以进行时间范围查询的时候，需要一个`format`参数来对字段内的数据进行格式化，然后完成分组操作。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "date_range": {
                "field": "entry_time",
                "format": "yyyy-MM-dd",
                "ranges": [
                    {
                        "to": "2019-05-01"
                    },
                    {
                        "from": "2019-05-01",
                        "to": "2019-07-01"
                    },
                    {
                        "from": "2019-07-01"
                    }
                ]
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "buckets": [
                {
                    "key": "*-2019-05-01",
                    "to": 1.5566688E12,
                    "to_as_string": "2019-05-01",
                    "doc_count": 36
                },
                {
                    "key": "2019-05-01-2019-07-01",
                    "from": 1.5566688E12,
                    "from_as_string": "2019-05-01",
                    "to": 1.5619392E12,
                    "to_as_string": "2019-07-01",
                    "doc_count": 16
                },
                {
                    "key": "2019-07-01-*",
                    "from": 1.5619392E12,
                    "from_as_string": "2019-07-01",
                    "doc_count": 48
                }
            ]
        }
    }
}
```

**java代码**

```java
   //  时间范围分组聚合
    public void dateRange() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        DateRangeAggregationBuilder agg =
            AggregationBuilders
                .dateRange("aggQuery")
                .field("entry_time")
                .format("yyyy-MM-dd")
                .addUnboundedTo("2019-05-01")
                .addRange("2019-05-01","2019-07-01")
                .addUnboundedFrom("2019-07-01");
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedDateRange parsed = search.getAggregations().get("aggQuery");
            for (Range.Bucket item : parsed.getBuckets()) {
                System.out.println(
                    item.getFromAsString() + "-" +
                    item.getToAsString() + ":" +
                    item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

##### 时间柱状图聚合

使用上面的`date_range`的分组，我们可以实现将一个长的时间段分成多个小的时间段然后实现分时段的数据分析。当然实际业务中很多时候我们可能只需要展示一年每个月的数据分析、或者一个月每天的数据分析。这个时候可以使用`date_histogram`的方法。其`interval`参数接收`month`和`day`的参数，它可以将数据根据每月或者每天的区间自动完成数据的分组。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "aggs": {
        "aggQuery": {
            "date_histogram": {
                "field": "entry_time",
                "format": "yyyy-MM-dd",
                "interval": "month"
            }
        }
    },
    "size": 0
}
```

**响应结果**

```java
{
    "took": 3,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 100,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    },
    "aggregations": {
        "aggQuery": {
            "buckets": [
                {
                    "key_as_string": "2019-01-01",
                    "key": 1546300800000,
                    "doc_count": 10
                },
                {
                    "key_as_string": "2019-02-01",
                    "key": 1548979200000,
                    "doc_count": 10
                },
                {
                    "key_as_string": "2019-03-01",
                    "key": 1551398400000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-04-01",
                    "key": 1554076800000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-05-01",
                    "key": 1556668800000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-06-01",
                    "key": 1559347200000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-07-01",
                    "key": 1561939200000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-08-01",
                    "key": 1564617600000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-09-01",
                    "key": 1567296000000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-10-01",
                    "key": 1569888000000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-11-01",
                    "key": 1572566400000,
                    "doc_count": 8
                },
                {
                    "key_as_string": "2019-12-01",
                    "key": 1575158400000,
                    "doc_count": 8
                }
            ]
        }
    }
}
```

**java代码**

```java
    //  时间柱状图聚合
    public static void histogram() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        DateHistogramAggregationBuilder agg =
            AggregationBuilders
                .dateHistogram("aggQuery")
                .field("entry_time")
                .format("yyyy-MM-dd")
                .dateHistogramInterval(DateHistogramInterval.MONTH);
        sourceBuilder.aggregation(agg);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            ParsedDateHistogram parsed = search.getAggregations().get("aggQuery");
            for (Histogram.Bucket item : parsed.getBuckets()) {
                System.out.println(
                    item.getKeyAsString() + ":" +
                        item.getDocCount());
            }
            System.out.println("do something");
        }
    }
```

```java
returned 1 warnings: [299 Elasticsearch-7.2.0-508c38a "[interval] on [date_histogram] is deprecated, 
use [fixed_interval] or [calendar_interval] in the future."]
```

##### 使用lucene查询语法

最开始我们介绍Elasticsearch的时候有一段对Elasticsearch的描述

> ElasticSearch是一个基于Lucene的搜索服务器

所以其提供了使用原生的lucene查询语法。在某些业务场景可能Elasticsearch提供的API无法满足我们的使用场景，我们使用使用`query_string`的API，其接收原生的lucene查询语法，这样可以使用原生的lucene语法实现一些目前API无法实现的业务。

**请求**

```java
POST localhost:9200/employee/_search
```

**参数**

```java
{
    "query": {
        "query_string": {
            "default_field": "name",
            "query": "甲0 OR 甲4"
        }
    },
    "size": 100
}
```

**响应结果**

```java
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 4.2096553,
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "1",
                "_score": 4.2096553,
                "_source": {
                    "name": "甲0",
                    "age": 15,
                    "group": "甲",
                    "entry_time": "2019-01-01"
                }
            },
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "5",
                "_score": 4.2096553,
                "_source": {
                    "name": "甲4",
                    "age": 35,
                    "group": "甲",
                    "entry_time": "2019-03-01"
                }
            }
        ]
    }
}
```

**java代码**

```java
    // 基于query_string的查询
    public static void queryString() throws IOException  {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        QueryStringQueryBuilder queryBuilder = QueryBuilders.queryStringQuery("甲0 OR 甲4").field("name");
        sourceBuilder.query(queryBuilder);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            SearchHits hits = search.getHits();
            SearchHit[] hits1 = hits.getHits();
            for (int i = 0; i < hits1.length; i++) {
                Map<String, Object> sourceAsMap = hits1[i].getSourceAsMap();
                System.out.println(sourceAsMap.get("age"));
            }
            System.out.println("do something");
        }
    }
```
