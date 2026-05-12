# 09、ElasticSearch 实战：search查询API
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/9.html
- 分类：搜索引擎
- 分组：教程目录
### es的其他查询方式

term查询的API主要用于结构化的数据，比如keyword或者number或者date。对于text字段不适用term的查询。和之前介绍的分词查询不同，term的查询一般都是精确查找，所以很多用于日期或者数字等字段上。

#### 精准匹配

下面是一个简单的例子，在之前模拟数据的基础上尝试查询城市名称为`北京`的城市，可以使用下面的请求

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "term": {
            "name": "北京"
        }
    }
}
```

**响应**

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": 2.3671236,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 2.3671236,
                "_source": {
                    "name": "北京",
                    "desc": "中华人民共和国首都",
                    "province": "北京",
                    "gdp": "3032000000000",
                    "area": "华北地区",
                    "carNumPrefix": "京"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 精准匹配查询
    public static void baseTermQuery() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("name","北京"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

**支持的部分参数**

属性
说明

allow_partial_search_results
设置为false在只有部分结果可用时使请求失败

batched_reduce_size
控制一次请求并发访问的最大分片数量，主要是防止一次请求汇聚了过量分片的数据，导致严重内存消耗

ccs_minimize_roundtrips
启用跨集群搜索

from
其实文档位置

request_cache
缓存结果

size
返回的命中数量

terminate_after
每个分片最大文档数量

search_timeout
超时时间

#### 非空查询

有的时候我们可能希望查询有多少非空的数据时候，可以使用`exists`的方法，通过制定索引中一列字段，然后获得此字段上非空的数据的总数。下面的例子很类似SQL中的`count(name)`,获取在name字段上非空的数据的总数。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "exists": {
            "field": "name"
        }
    }
}
```

**响应**

```java
{
    "took": 10,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 14,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "1",
                "_score": 1.0,
                "_source": {
                    "name": "上海",
                    "desc": "中国经济、金融、贸易、航运、科技创新中心",
                    "province": "上海",
                    "gdp": "3267900000000",
                    "area": "华东地区",
                    "carNumPrefix": "沪"
                }
            },
            ......
        ]
    }
}
```

**java代码形式**

```java
    // 在特定的字段中查找非空值的文档
    public static void baseExistsQuery() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.existsQuery("name"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 前缀匹配

在查询query的API中提供了`prefix`方法来实现前缀查询，其实现了SQL中的`like '"华中%'`的模糊查询，下面的例子中我们尝试寻找地区为`华中`开头的数据。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "prefix": {
            "area": "华中"
        }
    }
}
```

**响应**

```java
{
    "took": 7,
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
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "9",
                "_score": 1.0,
                "_source": {
                    "name": "武汉",
                    "desc": "大城市",
                    "province": "湖北",
                    "gdp": "1484700000000",
                    "area": "华中地区",
                    "carNumPrefix": "鄂A"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "13",
                "_score": 1.0,
                "_source": {
                    "name": "长沙",
                    "desc": "大城市",
                    "province": "湖南",
                    "gdp": "1152700000000",
                    "area": "华中地区",
                    "carNumPrefix": "湘A"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 查找包含带有指定前缀term的文档
    public static void basePrefixQuery() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.prefixQuery("area","华中"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 通配符匹配

除了模糊匹配，我们还可以使用`wildcard`方法实现通配符的匹配，比如使用*表示任意字符，?表示任意单个字符来查询符合前缀条件的指定长度的数据。比如下面例子中尝试查询名字为`北`开头的数据

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "wildcard": {
            "name": "北*"
        }
    }
}
```

**响应**

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 1.0,
                "_source": {
                    "name": "北京",
                    "desc": "中华人民共和国首都",
                    "province": "北京",
                    "gdp": "3032000000000",
                    "area": "华北地区",
                    "carNumPrefix": "京"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
   // 支持通配符查询，*表示任意字符，?表示任意单个字符
    public static void baseWildcardQuery() throws IOException {
        WildcardQueryBuilder wildcardQuery = QueryBuilders.wildcardQuery("name", "北*");
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(wildcardQuery);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 正则表达式匹配

使用`regexp`方法中我们可以输入正则格式的条件来进行数据的查询。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "regexp": {
            "name": "北.*"
        }
    }
}
```

**响应**

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 1.0,
                "_source": {
                    "name": "北京",
                    "desc": "中华人民共和国首都",
                    "province": "北京",
                    "gdp": "3032000000000",
                    "area": "华北地区",
                    "carNumPrefix": "京"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 正则表达式查询
    public static void baseRegexpQuery() throws IOException {
        RegexpQueryBuilder regexpQuery = QueryBuilders.regexpQuery("name", "北.*");
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(regexpQuery);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 多id匹配

使用`ids`方法，输入一个数组，我们可以一次查询多个ID的数据。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "ids": {
            "values": [
                1,
                2
            ]
        }
    }
}
```

**响应**

```java
{
    "took": 7,
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
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "1",
                "_score": 1.0,
                "_source": {
                    "name": "上海",
                    "desc": "中国经济、金融、贸易、航运、科技创新中心",
                    "province": "上海",
                    "gdp": "3267900000000",
                    "area": "华东地区",
                    "carNumPrefix": "沪"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 1.0,
                "_source": {
                    "name": "北京",
                    "desc": "中华人民共和国首都",
                    "province": "北京",
                    "gdp": "3032000000000",
                    "area": "华北地区",
                    "carNumPrefix": "京"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 多值匹配
    public static void baseIdsQuery() throws IOException {
        IdsQueryBuilder idsQueryBuilder = QueryBuilders.idsQuery().addIds("1", "2");
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(idsQueryBuilder);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 范围匹配

范围查询的方法`range`、可以接收两个参数开确定一定范围内的数据，类似于SQL中的`between`的使用，但是其开始和结束参数并非需要必须传递，可以只传递部分参数，实现大于某值、小于某值的查询。比如下面例子中尝试查询`gdp`字段中值为`"gte"`到`"lte"`结尾的数据。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "range": {
            "gdp": {
                "gte": 2400000000000,
                "lte": 3032000000000
            }
        }
    }
}
```

**响应**

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
            "value": 2,
            "relation": "eq"
        },
        "max_score": 1.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 1.0,
                "_source": {
                    "name": "北京",
                    "desc": "中华人民共和国首都",
                    "province": "北京",
                    "gdp": "3032000000000",
                    "area": "华北地区",
                    "carNumPrefix": "京"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "3",
                "_score": 1.0,
                "_source": {
                    "name": "深圳",
                    "desc": "中国经济特区、全国性经济中心城市和国际化城市",
                    "province": "广东",
                    "gdp": "2469100000000",
                    "area": "华南地区",
                    "carNumPrefix": "粤B"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
     // 范围查询
    public static void baseRangeQuery() throws IOException {
        RangeQueryBuilder range = QueryBuilders
            .rangeQuery("gdp")
            .gte("2400000000000")
            .lte("3032000000000");
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(range);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 符合条件匹配（must）

`must`方法内部接收一个条件判断的参数，里面可以是`"match"`也可以是`"range"`。此方法实现了查询出符合must内部条件的数据。而must为一个数组参数，所以must中的条件可以接收不止一个。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "name": "上海"
                    }
                }
            ]
        }
    }
}
```

**响应**

```java
{
    "took": 4,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 2.3671236,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "1",
                "_score": 2.3671236,
                "_source": {
                    "name": "上海",
                    "desc": "中国经济、金融、贸易、航运、科技创新中心",
                    "province": "上海",
                    "gdp": "3267900000000",
                    "area": "华东地区",
                    "carNumPrefix": "沪"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 布尔查询
    public static void baseMustQuery() throws IOException {
        TermQueryBuilder query = QueryBuilders.termQuery("name", "上海");
        BoolQueryBuilder must = QueryBuilders.boolQuery().must(query);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(must);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 符合条件匹配（filter）

`filter`也是根据其数组传递的条件参数进行匹配的，这点很类似`must`，两者的主要区别是。`filter`在进行查询的时候只会记录匹配到的数据，并不会做其他操作，而`match`在获取数据时候会计算其相关度的评分，查询条件和结果约相似的数据其排名会越靠前。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "bool": {
            "filter": [
                {
                    "match": {
                        "name": "上海"
                    }
                }
            ]
        }
    }
}
```

**响应**

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": 0.0,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "1",
                "_score": 0.0,
                "_source": {
                    "name": "上海",
                    "desc": "中国经济、金融、贸易、航运、科技创新中心",
                    "province": "上海",
                    "gdp": "3267900000000",
                    "area": "华东地区",
                    "carNumPrefix": "沪"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 效果同must，但是不打分
    public static void baseFilterQuery() throws IOException {
        TermQueryBuilder query = QueryBuilders.termQuery("name", "上海");
        BoolQueryBuilder filter = QueryBuilders.boolQuery().filter(query);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(filter);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 符合条件匹配（must_not）

`must_not`是用来获取不为其查询条件的数据，其用法和上面的`must`为相反的操作

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "area": "华中地区"
                    }
                }
            ],
            "must_not": [
                {
                    "term": {
                        "name": {
                            "value": "长沙"
                        }
                    }
                }
            ]
        }
    }
}
```

**响应**

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
            "value": 1,
            "relation": "eq"
        },
        "max_score": 1.856298,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "9",
                "_score": 1.856298,
                "_source": {
                    "name": "武汉",
                    "desc": "大城市",
                    "province": "湖北",
                    "gdp": "1484700000000",
                    "area": "华中地区",
                    "carNumPrefix": "鄂A"
                }
            }
        ]
    }
}
```

**java代码形式**

```java
    // 布尔查询
    public static void baseMustNotQuery() throws IOException {
        TermQueryBuilder query = QueryBuilders.termQuery("area", "华中地区");
        TermQueryBuilder query2 = QueryBuilders.termQuery("value", "长沙");
        BoolQueryBuilder must = QueryBuilders.boolQuery().must(query).mustNot(query2);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(must);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 条件匹配（should）

这个should不知道该怎么翻译，我个人感觉更类似条件匹配。`should`查询方法需要配合`minimum_should_match`参数使用，此参数指明了查询数据需要匹配多少条`should`中的条件。当默认情况下使用`should`匹配会发现其匹配出了不符合预期的数据。但是当配置了`minimum_should_match`参数后会发现可以查询出需要的内容。`should`可以应用在：当我们存在多个查询条件但是只需要数据满足其一部分条件即可的业务场景。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "area": "华南地区"
                    }
                }
            ],
            "must_not": [
                {
                    "term": {
                        "name": {
                            "value": "深圳"
                        }
                    }
                }
            ],
            "should": [
                {
                    "range": {
                        "gdp": {
                            "gte": 2400000000000,
                            "lte": 3032000000000
                        }
                    }
                }
            ]
        }
    }
}
```

**响应**

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
        "max_score": 1.2685113,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "4",
                "_score": 1.2685113,
                "_source": {
                    "name": "广州",
                    "desc": "广东省省会、副省级市、国家中心城市、超大城市",
                    "province": "广东",
                    "gdp": "2300000000000",
                    "area": "华南地区",
                    "carNumPrefix": "粤A"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "14",
                "_score": 1.2685113,
                "_source": {
                    "name": "无锡",
                    "desc": "广东，大城市",
                    "province": "江苏",
                    "gdp": "1143800000000",
                    "area": "华南地区",
                    "carNumPrefix": "苏B"
                }
            }
        ]
    }
}
```

将请求参数修改为：

```java
{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "area": "华南地区"
                    }
                }
            ],
            "must_not": [
                {
                    "term": {
                        "name": {
                            "value": "深圳"
                        }
                    }
                }
            ],
            "should": [
                {
                    "range": {
                        "gdp": {
                            "gte": 2400000000000,
                            "lte": 3032000000000
                        }
                    }
                }
            ],
            "minimum_should_match": 1
        }
    }
}
```

```java
{
    "took": 5,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 0,
            "relation": "eq"
        },
        "max_score": null,
        "hits": []
    }
}
```

**java代码形式**

```java
    // 即使匹配不不到也返回，只是评分不不同
    public static void baseShouldQuery() throws IOException {
        TermQueryBuilder query = QueryBuilders.termQuery("area", "华中地区");
        TermQueryBuilder query2 = QueryBuilders.termQuery("value", "长沙");
        RangeQueryBuilder gdp = QueryBuilders.rangeQuery("gdp").gte("2400000000000").lte("3032000000000");
        BoolQueryBuilder should = QueryBuilders.boolQuery()
            .must(query)
            .mustNot(query2)
            .should(gdp)
            .minimumShouldMatch(1);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(should);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```

#### 排序查询

`query`方法之后我们可以添加`sort`的参数来根据查询结果中某一列的数据进行排序。

**请求**

```java
POST localhost:9200/city_info/_search
```

**参数**

```java
{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "area": "华中地区"
                    }
                }
            ]
        }
    },
    "sort": [
        {
            "gdp": {
                "order": "asc"
            }
        }
    ]
}
```

**响应**

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
        "max_score": null,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "13",
                "_score": null,
                "_source": {
                    "name": "长沙",
                    "desc": "大城市",
                    "province": "湖南",
                    "gdp": "1152700000000",
                    "area": "华中地区",
                    "carNumPrefix": "湘A"
                },
                "sort": [
                    1152700000000
                ]
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "9",
                "_score": null,
                "_source": {
                    "name": "武汉",
                    "desc": "大城市",
                    "province": "湖北",
                    "gdp": "1484700000000",
                    "area": "华中地区",
                    "carNumPrefix": "鄂A"
                },
                "sort": [
                    1484700000000
                ]
            }
        ]
    }
}
```

**java代码形式**

```java
    public static void baseSortQuery() throws IOException {
        TermQueryBuilder query = QueryBuilders.termQuery("area", "华中地区");
        BoolQueryBuilder must = QueryBuilders.boolQuery().must(query);
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(must).sort("gdp",SortOrder.DESC);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse search =
            getClient().search(request, RequestOptions.DEFAULT);
        if (search.getShardFailures().length == 0) {
            System.out.println("do something");
        }
    }
```
