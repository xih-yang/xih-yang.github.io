# 21、ElasticSearch 实战：ES的高级检索语法 (包括term、prefix、wildcard、fuzzy、boost等)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/21.html
- 分类：搜索引擎
- 分组：教程目录
## 1 term query - 索引词检索

## 1.1 term query - 不分词检索

`term query`: 把检索串当作一个整体来执行检索, 即不会对检索串分词.

> term是完全匹配检索, 要用在不分词的字段上, 如果某个field在映射中被分词了, term检索将不起作用.
>
> 所以, 不分词的field, 要在mapping中设置为不分词.

——ES 5.x之后, 为每个text类型的字段新增了名为keyword的子字段, 是不分词的, 默认保留256个字符.

——可以使用keyword字段进行term检索. 示例:

```java
GET shop/_search
{
    "query": {
        "term": {
            "name.keyword": "Java编程思想"
        }
    }
}
```

## 1.2 terms query - in检索

`terms`, 相当于多个`term`检索, 类似于SQL中in关键字的用法, 即在某些给定的数据中检索:

```java
GET shop/_search
{
    "query": {
        "terms": {
            "name.keyword": [
                "Java编程思想", "Java并发编程的艺术"
            ]
        }
    }
}
```

## 2 prefix query - 前缀检索

`prefix query`, 就是前缀检索. 比如商品name中有多个以"Java"开头的document, 检索前缀"Java"时就能检索到所有以"Java"开头的文档.

—— **扫描所有倒排索引, 性能较差**.

```java
GET shop/_search
{
    "query": {
        "prefix": { "name": "java" }
    }
}
```

## 3 wildcard query - 通配符检索

**扫描所有倒排索引, 性能较差**.

```java
GET shop/_search
{
    "query": {
        "wildcard": { "name": "ja*" }
    }
}
```

## 4 regexp query - 正则检索

**扫描所有倒排索引, 性能较差**.

```java
GET shop/_search
{
    "query": {
        "regexp": { "name": "jav[a-z]*" }
    }
}
```

## 5 fuzzy query - 纠错检索

`fuzziness`的默认值是2 —— 表示最多可以纠错两次.

说明:`fuzziness`的值太大, 将削弱检索条件的作用, 也就是说纠错次数太多, 就会导致限定检索结果的检索条件被改变, 失去了限定作用.

示例:检索name中包含"Java"的文档, Java中缺失了一个字母a:

```java
GET shop/_search
{
    "query": {
        "match": { 
            "name": {
                "query": "Jav", 
                "fuzziness": 1, 
                "operator": "and"
            }
        }
    }
}
```

## 6 boost评分权重 - 控制文档的优先级别

通过boost参数, 令满足某个条件的文档的得分更高, 从而使得其排名更靠前.

```java
GET shop/_search
{
    "query": {
        "bool": {
            "must": [
                { "match": { "name": "编程思想"} }
            ], 
            "should": [
                { 
                   "match": { 
                        "name": {
                            "query": "艺术", 
                            "boost": 2        // 提升评分权重
                        } 
                    }
                }
            ]
        }
    }
}
```

## 7 dis_max的用法 - best fields策略

一般检索中, 检索条件会被分词, bool检索构建多个子检索 (`must` | `must_not` | `should` | `filter`), 这些子检索可能会包含多个field. 这时:

**多个子检索的field各自匹配少量关键字的文档的分数 > 某个子检索的field匹配大量关键字的文档的分数**.

## 7.1 dis_max的提出

如果我们希望检索结果中 (检索串被分词后的) 关键字匹配越多, 这样的文档就越靠前, 而不是多个子检索中匹配少量分词的文档靠前.

⇒此时可以使用dis_max和tie_breaker.

> tie_breaker的值介于0~1之间, Elasticsearch将 bool检索的分数 * tie_breaker的结果与dis_max的最高分进行比较, 除了取dis_max的最高分以外, 还会考虑其他的检索结果的分数.

## 7.2 使用示例

为了增加精准度, 常用的是配合boost、minimum_should_match等参数控制检索结果.

```java
GET shop/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { "match": { "name": "虚拟机" } },
                { "match": { "desc": "经典" } }
            ],
            "tie_breaker": 0.2		// 对同时满足的文档的分值进行提升
        }
    }
}
GET shop/_search
{
    "query": {
        "dis_max": {
            "queries": [
                { 
                    "match": { 
                        "name": {
                            "query": "虚拟机",
                            "minimum_should_match": "50%",
                            "boost": 2
                        }
                    }
                },
                {
                    "match": {
                        "desc": {
                            "query": "经典",
                            "minimum_should_match": "50%", 
                            "boost": 3
                        }
                    }
                }
            ],
            "tie_breaker": 0.3
        }
    }
}
```

## 8 exist query - 存在检索, 已过期

这是Elasticsearch 2.x中的API, 后续版本不再支持.

## 9 复杂检索的使用范例

## 9.1 多条件过滤 - 包含

> 检索出版时间在2012-07之后, 且至少满足下述条件中一个的文档:
>
> a. 名称(name)中包含"并发";
>
> b. 描述(desc)中包含"java";
>
> c. 出版社(publisher)名称中不包含"电子".

```java
GET shop/_search
{
    "query": {
        "bool": {
            "filter": {					// 按时间过滤
                "range": {
                    "date": {"gte": "2012-07"}
                }
            },
            "should": [					// 可匹配, 可不匹配
                {
                    "match": { "name": "并发" }
                },
                {
                    "bool": {
                        "must": {		// 必须匹配
                            "match": { "desc": "java" }
                        },
                        "must_not": {	// 不能匹配
                            "match": { "publisher": "电子" }
                        }
                    }
                }
            ],
            "minimum_should_match": 1	// 至少满足should中的一个条件
        }
    }, 
    // 自定义排序
	"sort": [
        { "price": { "order": "desc" } }
    ]
}
```

注意:排序的字段最好是数字, 或日期, 因为字符串字段会被分词, ES会通过分词后的某个词去排序, 结果难以预测.

## 9.2 多条件拼接 - 包含+范围+排序

> 匹配检索: name中包含"java"却不包含"虚拟机";
>
> 范围检索: 价格大于50、小于80;
>
> 结果排序: 按照价格升序排序.

```java
GET shop/_search
{
    "query": {
        "bool": {
            "must": {						// 必须匹配
                "match": { "name": "java" }
            }, 
            "must_not": {					// 必须不匹配
                "match": { "name": "虚拟机" }
            },
            "filter": {
                "range": {
                    "price": {
                        "gte": 40,
                        "lte": 80,
                        "boost": 2.0	// 设置得分的权重值(提升值), 默认是1.0
                    }
                }
            }
        }
    }
}
```

关于范围检索的使用, 请参考下篇文章: [ES 22 - Elasticsearch对数值或日期类型进行范围检索][ES 22 - Elasticsearch]

## 9.3 定制检索结果的排序规则

**(1) 默认排序规则:**

ES默认是按检索结果的分值(_score)降序排列的.

某些情况下, 可能存在无实际意义的_score, 比如filter时所有_score的值都相同:

```java
GET website/_search
{
    "query": {
        "bool": {
            "filter": {
                "term": {
                    "author_id": 5520	// 此时所有符合条件的_score都为0
                }
            }
        }
    }
}
// 或通过constant_score过滤: 
GET website/_search
{
    "query": {
        "constant_score": {
            "filter": {
                "term": {
                    "author_id": 5520	// 此时所有符合条件的_score都为1
                }
            }
        }
    }
}
```

**(2) 定制排序规则:**

```java
GET website/_search
{
    "query": {
        "constant_score": {
            "filter": {
                "term": {
                    "author_id": 5520
                }
            }
        }
    }, 
    "sort": [
        {
            "post_date": { "order": "asc" }
        }
    ]
}
```
