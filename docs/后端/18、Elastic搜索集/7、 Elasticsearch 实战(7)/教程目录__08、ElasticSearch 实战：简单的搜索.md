# 08、ElasticSearch 实战：简单的搜索
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/7/8.html
- 分类：搜索引擎
- 分组：教程目录
**关于版本**

内容
版本

Elasticsearch版本
7.2.0

JAVA依赖版本
7.2.1

> Elasticsearch 7.x 和之前版本有相当大的变化，所以本篇内容尤其是JAVA代码的操作对于使用旧版本的同学帮助可能不大。因为本人主要是JAVA开发，在介绍相关操作的时候会附带JAVA代码操作的逻辑。

### ES的简单搜索

#### 精确查找和短语匹配

- 精确查找(（)term词条查找)：词条查询不会分析查询条件，只有当词条和查询字符串串完全匹配时，才匹配搜索。
- 短语匹配(match词条查找)：ElasticSearch引擎会先分析查询字符串，将其拆分成多个分词，只要已分析的字段中包含词条的任意一个，或全部包含，就匹配查询条件，返回该文档；如果不包含任意一个分词，表示没有任何文档匹配查询条件。

#### 模拟数据

##### 创建一个新索引

```java
PUT "localhost:9200/city_info"
```

##### 创建新的映射

```java
url:  PUT "localhost:9200/test_city_info/_mapping"
head:  Content-Type:application/json
请求参数
{
    "properties": {
        "name": {
            "type": "keyword"
        },
        "desc": {
            "type": "text"
        },
        "province": {
            "type": "keyword"
        },
        "gdp": {
            "type": "long"
        },
        "area": {
            "type": "keyword"
        },
        "carNumPrefix": {
        	"type": "keyword"
        }
    }
}
```

##### 插入数据

```java
PUT localhost:9200/city_info/_doc/1
```

请求参数

```java
{
    "name": "上海",
    "desc": "中国经济、金融、贸易、航运、科技创新中心",
    "province": "上海",
    "gdp": "3267900000000",
    "area": "华东地区",
    "carNumPrefix": "沪"
}
{
    "name": "北京",
    "desc": "中华人民共和国首都",
    "province": "北京",
    "gdp": "3032000000000",
    "area": "华北地区",
    "carNumPrefix": "京"
}
// ...
// 数据有点多就不写了，大概就是GDP前十几的城市
```

#### term词条查询

##### 单条term

我们现在尝试查出城市名字为“北京”的地区，只需要按照下面的请求

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "term": {
            "name": "北京"
        }
    }
}
```

**响应内容**

可以看到最后返回了北京的相关信息

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
        "max_score": 2.302585,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "2",
                "_score": 2.302585,
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

**JAVA代码**

```java
    public static void term() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termQuery("name", "北京"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            System.out.println(searchResponse.getHits().getHits()[0]);
        }
    }
```

##### 多条term

但是有的时候我们可能尝试查询不止一个数据的时候呢，可以使用`terms`的api。下面我们尝试查询名字为北京和上海的城市

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "terms": {
            "name": [
                "北京",
                "上海"
            ]
        }
    }
}
```

**响应内容**

```java
{
    "took": 14,
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

**JAVA代码**

```java
    public static void terms() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.termsQuery("name", "北京","上海"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            for (int i = 0; i < hits.length; i++) {
                System.out.println(searchResponse.getHits().getHits()[i]);
            }
        }
    }
```

##### match_all

当我们需要查询某个索引所有数据的时候可以使用`match_all`,此API实现了查询所有的方法。当然当数据非常大的时候最好一次不要查询太多条数据。下面例子中只查询了3条

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "match_all": {
     }
    },
    "from": 0,
    "size": 3
}
```

**响应内容**

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

**JAVA代码**

```java
    public static void matchAll() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchAllQuery()).from(0).size(3);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            System.out.println(hits.length);
        }
    }
```

##### match

当我们对keyword的字段进行查询匹配的时候我们可以使用term。但是对text类型的字段进行查询操作的时候就需要使用`match`，他会查询所有匹配上条件的结果。并不要求其完全匹配。下面的例子我们查询了描述为城市的数据，结果可以看出来返回的数据中desc字段都包含`城市`内容，但是内容都远远多于查询的条件。可以认为term是精确匹配而match是模糊匹配

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "match": {
        	"desc" : "城市"
        }
    },
    "from": 0,
    "size": 3
}
```

**响应内容**

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
            "value": 12,
            "relation": "eq"
        },
        "max_score": 0.47477022,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "7",
                "_score": 0.47477022,
                "_source": {
                    "name": "苏州",
                    "desc": "大城市",
                    "province": "江苏",
                    "gdp": "1859700000000",
                    "area": "华东地区",
                    "carNumPrefix": "苏E"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "8",
                "_score": 0.47477022,
                "_source": {
                    "name": "成都",
                    "desc": "大城市",
                    "province": "四川",
                    "gdp": "1534200000000",
                    "area": "西南地区",
                    "carNumPrefix": "川A"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "9",
                "_score": 0.47477022,
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

**JAVA代码**

```java
    public static void match() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchQuery("desc","城市")).from(0).size(3);
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            System.out.println(hits.length);
        }
    }
```

##### multi_match

`multi_match`和`match`相比，它提供了多种字段匹配的能力，你可以设置在多个字段中存在匹配的内容。比如例子中尝试查询描述和省份都携带`广东`的数据。（正常desc字段是不携带广东内容了，下面数据为了显示API的作用，专门修改了一个城市的描述）

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "multi_match": {
            "query": "广东",
            "fields": [
                "province",
                "desc"
            ]
        }
    }
}
```

**响应内容**

```java
{
    "took": 991,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 3,
            "relation": "eq"
        },
        "max_score": 4.163451,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "14",
                "_score": 4.163451,
                "_source": {
                    "name": "无锡",
                    "desc": "广东，大城市",
                    "province": "江苏",
                    "gdp": "1143800000000",
                    "area": "华南地区",
                    "carNumPrefix": "苏B"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "4",
                "_score": 2.1411116,
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
                "_id": "3",
                "_score": 1.856298,
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

**JAVA代码**

```java
    public static void match() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.multiMatchQuery("广东","province","desc"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            System.out.println(hits.length);
        }
    }
```

##### match_phrase

`match_phrase`在其查询配置中可以添加`slop`参数，使用此参数可以限制输入的内容被分词后，短语中间还能间隔的词语的数量。

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "match_phrase": {
            "desc": "中心城市",
            "slop" : 0
        }
    }
}
```

**响应内容**

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
        "max_score": 1.8040439,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "4",
                "_score": 1.8040439,
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
                "_id": "3",
                "_score": 1.6869828,
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

**JAVA代码**

```java
    public static void matchPhrase() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchPhraseQuery("desc","中心城市"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            System.out.println(hits.length);
        }
    }
```

##### match_phrase_prefix

`match_phrase_prefix`的用法有点类似搜索推荐中的内容补全（ES实现推荐搜索是用另外一个API），但是又不完全一样，他会将最后一个被切分的词条（trem）作为前缀去匹配索引，然后再从匹配的结果中定位包含前面词条的数据。比如我们尝试搜索`大城市 北`，es会尝试先找出北开头的doc然后再去定位包含北和大城市的doc。

**http请求**

```java
POST localhost:9200/city_info/_search
```

**请求参数**

```java
{
    "query": {
        "match_phrase_prefix": {
            "desc": "大城"
        }
    }
}
```

**响应内容**

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
            "value": 11,
            "relation": "eq"
        },
        "max_score": 0.5402701,
        "hits": [
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "7",
                "_score": 0.5402701,
                "_source": {
                    "name": "苏州",
                    "desc": "大城市",
                    "province": "江苏",
                    "gdp": "1859700000000",
                    "area": "华东地区",
                    "carNumPrefix": "苏E"
                }
            },
            .....
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "5",
                "_score": 0.50118303,
                "_source": {
                    "name": "重庆",
                    "desc": "超大城市",
                    "province": "重庆",
                    "gdp": "2036300000000",
                    "area": "西南地区",
                    "carNumPrefix": "渝"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "6",
                "_score": 0.50118303,
                "_source": {
                    "name": "天津",
                    "desc": "超大城市",
                    "province": "天津",
                    "gdp": "1880900000000",
                    "area": "华北地区",
                    "carNumPrefix": "津"
                }
            },
            {
                "_index": "city_info",
                "_type": "_doc",
                "_id": "14",
                "_score": 0.46737003,
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

**JAVA代码**

```java
    public static void matchPhrasePrefix() throws IOException {
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchPhrasePrefixQuery("desc","大城"));
        SearchRequest request = new SearchRequest(INDEX);
        request.source(sourceBuilder);
        SearchResponse searchResponse = RestClientUtils.client.search(request, RequestOptions.DEFAULT);
        if (searchResponse.getShardFailures().length == 0) {
            SearchHit[] hits =
                    searchResponse.getHits().getHits();
            System.out.println(hits.length);
        }
    }
```
