# 19、ElasticSearch 实战：查询ES中的数据 (基于_search API进行检索)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/19.html
- 分类：搜索引擎
- 分组：教程目录
> 说在前面: 本文的所有演示, 都是基于Elasticsearch 6.6.0进行的, 不同的版本可能存在API发生修改、不支持的情况, 还请注意.

## 1 Search API的基本用法

## 1.1 查询所有数据

```java
GET _search
```

## 1.2 响应信息说明

```java
{
    "took" : 346,          // 整个检索消耗的时间, 单位是毫秒. 包括线程池中的等待时间、集群中分布式搜索+收集结果的时间
    "timed_out" : false,   // 默认不启用超时机制, 若启用, 需要设置具体的时间值
    "_shards" : {          // 搜索用到的shard数, 以及成功/失败的shard数
        "total" : 5,
        "successful" : 5,
        "skipped" : 0,
        "failed" : 0       // 一个Shard的Primary和Replicas都挂掉, 它才被认为失败
    },
    "hits" : {
        "total" : 10,      // 本次搜索命中(搜索到)的结果总数
        "max_score" : 1.0, // 本次搜索的所有结果中, 最大的相关度分数
        "hits" : [         // 默认显示查询结果中的前10条记录, 根据_score降序排序
            {
                "_index" : "book_shop",
                "_type" : "books",
                "_id" : "2",
                "_score" : 1.0,  // 相关度得分, 越相关, 分值越大, 排位越靠前
                "_source" : {
                    "name" : "Java编程思想",
                    "category" : "编程语言",
                    "author" : "Bruce Eckel",
                    "price" : 105.0,
                    "publisher" : "机械工业出版社",
                    "date" : "2016-01-01"
                }
            } 
        ]
    }
}
```

## 1.3 timeout超时机制

指定每个Shard必须在规定的时间 (也就是指定的timeout时间) 内, 将搜索到的数据 (可能只搜索到了部分数据, 也可能搜索到了全部数据) 立即返回给客户端, 而不是等待查询操作完全完成后再返回.

**—— 确保在指定时间内返回数据, 无论查询是否完成.**

ES的搜索默认不开启timeout, 查询持续的时间 (latency) 将根据查询的完整性 (completeness) 自动延迟, 可以手动指定timeout, 使用示例:

```java
GET _search?timeout=10ms
# 可用的单位: timeout=10ms | timeout=1s | timeout=1m
```

> 举例说明: ES能在1分钟内查询到符合条件的全部数据有2000条, 在指定timeout=10之后, 就会在10ms时返回查询到的部分结果, 此时可能只查询到了其中的100条数据.

## 1.4 查询多索引和多类型中的数据

(1)一次性搜索多个索引(multi-index) 中的数据:

```java
# 搜索指定一个index下的所有数据
GET index1/_search
# 同时搜索两个index下的数据
GET index1,index2/_search
# 按照通配符匹配搜索多个index下的数据
GET *1,*2/_search 
```

(2)和多个类型(multi-type)在的数据:

**注意: Elasticsearch 6.x之前的版本中, 支持一个index下有多个type, 在6.x之后的版本就只能定义一个type.**

```java
# 搜索一个index下指定的type的数据
GET index1/type1/_search 
# 搜索一个index下多个type的数据
GET index1/type1,type2/_search 
# 搜索多个index下的多个type的数据
GET index1,index2/type1,type2/_search
# _all, 搜索所有index下指定type的数据
GET _all/type1,type2/_search  
```

## 2 URI Search的用法

Elasticsearch支持通过在URI中携带请求参数执行搜索.

## 2.1 GET请求携带参数查询

比如要进行分页查询:

```java
GET _search
{
    "from": 0,
    "size": 10
}
```

HTTP协议中一般不允许GET请求携带请求体 (Request Body), 但由于GET更加符合查询数据的操作, 因此可以携带Request Body. 而很多浏览器也都支持GET + Request Body模式.

如果遇到不支持GET + Request Body模式的场景, 也可以用POST方式查询, 比如:

```java
POST _search
{
    "from":0,
    "size":10
}
```

或者使用拼接请求参数的方式进行查询:

```java
GET _search?from=0&size=10
```

**上述拼接的请求参数就是Query String, 这个串拼接的字段内容都是String, Elacticsearch底层会对各个field的类型进行映射.**

## 2.2 URI Search的参数列表

参数
使用方法

q
查询字符串.

df
查询中没有定义前缀时, 默认的搜索字段.

analyzer
分析查询字符串所使用的分析器的名称.

lowercase_expanded_terms
搜索时忽略大小写标识, 默认为true.

analyze_wildcard
通配符或前缀查询是否被分析, 默认为false.

batched_reduce_size
协调节点需要减少的分片结果数. 当分片数量很多时, 会产生很大的内存开销, 这个参数用来当做保护机制.

default_operator
默认的多个条件之间的关系, 可以是 AND 或 OR. 默认是 OR.

lenient
如果设置为true, 字段类型转换失败时将忽略处理. 默认为false.

explain
在每个返回结果中, 将包含评分机制的详细计算描述.

_source
是否包含元数据, 同时支持_source_incude和_source_exclude.

stored_fields
选择查询到的文档的指定字段, 多个之间用","分隔. 若不指定任何字段, 就不会返回任何字段.

sort
根据字段名排序. 可以是fieldName, 或fieldName:desc, 或fieldName:asc, 或_score (给予分数的排序). 可以有多个排序参数, 要注意各参数之间的顺序.

track_scores
跟踪评分. 排序时, 设置为true后将跟踪评分情况, 并在返回的结果中携带评分信息.

track_total_hits
设置为false, 禁止跟踪每个查询的结果总数. 默认为true, 即统计搜索到的结果总数.

timeout
搜索超时, 在指定的时间内执行搜索请求, 并在超时时间到期时返回查询到的已有结果. 默认无超时.

terminate_after
每个分片搜索的最大文档数, 如果达到此值, 即使搜索尚未结束, 当前分片将提前终止搜索.
如果设置, 响应信息中将携带一个boolean类型的terminated_early字段, 表示查询提前终止了. 默认没有设置.

from
从所有返回结果中的第几条开始显示, 默认为0.

size
搜索结果返回的条数. 默认为10, 即返回前10条.

search_type
搜索的类型, 可以是dfs_query_then_fetch或query_then_fetch, 默认是query_then_fetch.

allow_partial_search_results
如果请求将产生部分结果, 设置为false用来返回整体故障. 默认为true, 这将在超时或部分失败的情况下, 返回部分结果.
可以通过集群中的search.default_allow_partial_results来设置此参数.

## 2.3 URI Search用法示例

```java
// 查询索引index1中、类型为type1、field1=test的所有文档
GET index1/type1/_search?q=field1:test
// 查询索引index1中、类型为type1、必须满足field1=test的所有文档
GET index1/type1/_search?q=+test_field:test
// 查询索引index1中、类型为type1、不满足field1=test的所有文档
GET index1/type1/_search?q=-test_field:test
// 如果我们只想知道是否存在与查询条件相匹配的文档, 而对文档的具体信息不感兴趣, 此时可以设置size=0.
// 还可以设置terminate_after=1, 指明只要在每个shard中找到第一个匹配的文档, 就终止查询:
GET _search?q=field1:test&size=0&terminate_after=1
```

## 2.4 不指定field时的搜索原理

```java
GET index1/type1/_search?q=test
// 同样, 可以使用"+"或"-"来控制是否包含某个关键字, 比如: 查询不包含java的所有文档: 
GET shop/it_book/_search?q=-java
```

Elasticsearch默认为每个文档配置了`_all`元字段, 将各个文档的所有field的值用字符串拼接起来, 这个长字符串就作为`_all`字段的值, 同时建立索引.

查询时, 如果不指定关键字所属的field, ES将从`_all`字段中搜索, 所有文档中只要存在field包含指定的关键字, 就算作匹配, 并将作为结果返回. 举个例子:

```java
// 文档内容如下: 
{
    "name": "Java并发编程的艺术",
    "author": "方腾飞",
    "date": "2015-07",
    "publisher": "机械工业出版社"
}
// 搜索条件
GET shop/it_book/_search?q=java
// 该文档_all字段的值为: "Java并发编程的艺术 方腾飞 2015-07 机械工业出版社", _all字段中包含java, 所以能够匹配. 
```

**说明: 生产环境中不建议开启_all, 也不建议通过_all字段进行查询操作.**

**在Elasticsearch 6.0版本中, _all字段已经被禁用了.** 替代方案可以参考 [这篇文章中的第3部分](/zhuanlan/search/elasticsearch/2/13.html) .
