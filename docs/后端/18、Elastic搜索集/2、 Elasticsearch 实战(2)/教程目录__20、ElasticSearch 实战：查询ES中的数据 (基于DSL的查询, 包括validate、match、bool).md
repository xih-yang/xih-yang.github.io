# 20、ElasticSearch 实战：查询ES中的数据 (基于DSL的查询, 包括validate、match、bool)
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/2/20.html
- 分类：搜索引擎
- 分组：教程目录
## 1 什么是DSL

DSL: Domain Specific Language, 领域特定语言, 指的是专注于某个应用程序领域的、具有高度针对性的计算机语言.

**Query String 与 Query DSL之间的区别:**

> Query String: 在请求的URL后直接拼接查询条件;
>
> Query DSL: 在请求的Request Body中携带查询条件.

**DSL功能强大, 可以构建复杂的查询、过滤、聚合条件, 所以这种查询方式的用途最广.**

## 2 _validate - 校验查询语句是否合法

**对于复杂的查询, 很有必要在查询前使用validate API进行验证, 保证DSL语句的正确有效:**

```java
// 要查询name中包含"java"的文档: 
GET shop/it_book/_validate/query?explain
{
	"query": {
        "math": {            // 错误的查询名称, 应该是match
            "name": "java"
        }
    }
}
// 校验结果: 
{
    "valid": false,
    "error": "org.elasticsearch.common.ParsingException: no [query] registered for [math]"
}
// 修改math为match后, 校验结果为: 
{
    "valid": true,
    "_shards": {
        "total": 1,
        "successful": 1,
        "failed": 0
    },
    "explanations": [
        {
            "index": "shop",
            "valid": true,    // 校验通过, DSL有效
            "explanation": "+name:java_type:it_book"  // 查询条件, +表示必须存在
        }
    ]
}
```

## 3 match query - 匹配查询

## 3.1 简单功能示例

### 3.1.1 查询所有文档

```java
GET shop/it_book/_search
{
    "query": {
        "match_all": {}
    }
}
```

### 3.1.2 查询满足一定条件的文档

查询name中包含"java"的文档, 同时按照价格升序排序:

```java
GET shop/it_book/_search
{
    "query": {
        "match": {
            "name": "java"
        }
    }, 
    "sort": [
        { 
            "price": {"order": "asc"} 
        }
    ]
}
```

### 3.1.3 分页查询文档

```java
GET shop/it_book/_search
{
    "query": {
        "match_all": {}
    },
    "from": 0,      // 开始记录数, 起始数为0
    "size": 1       // 页大小, 即每页显示的记录数
}
```

### 3.1.4 指定返回的结果中包含的字段

```java
GET shop/it_book/_search
{
    "query": {
        "match_all": {}
    }, 
    "_source": [
        "name", 	// 显示商品名称
        "price"		// 显示商品价格
    ]
}
```

## 3.2 精确查询 - match_phrase

不同的数据类型在建立倒排索引时, 有的会作为full text处理, 有的作为exact value处理.

对查询串分词时, 使用的分析器(analyzer)必须和创建index时使用的相同, 否则将检索不到准确的数据.

### 3.2.1 精确匹配 - exact value

常见的exact value类型有date - 日期类型.

**ES检索时, 不会对String进行分词, 而是完全根据String的值去精确匹配, 查找相应的文档.**

在DSL中, 通过`match_phrase`短语匹配达到精确匹配的目的 —— 不会对查询串进行分词, 而是直接精确匹配查找.

示例:查询name中包含"thinking in java"的文档, 不会对查询串进行分词:

```java
GET shop/_search
{
    "query": {
        "match_phrase": {
            "name": "thinking in java"
        }
    }
}
```

### 3.2.2 全文搜索 - full text

常见的full text类型有: text - 文本串.

**ES检索时, 会对检索串进行分词, 包括缩写、时态、同义词等转换手段, 然后根据分词结果与倒排索引进行匹配, 查找相应的文档.**

> 索引中只要有任意一个相关field的分词 匹配拆分后的词, 这个文档就可以出现在结果中, 只是匹配度越高的排名越靠前.

示例:查询name中包含"thinking in java"的文档, 会将查询串拆分为"think", "in", "java"三个词:

```java
GET shop/_search
{
    "query": {
        "match": {
            "name": "thinking in java"
        }
    }
}
```

## 3.3 控制匹配规则 - operator

`operator` 操作符, 用来指定ES对分词后的词项如何进行检索过滤. 选项有:

> and, 作用 == match_phrase, 即全部匹配;
>
> or, 作用 == match, 即部分匹配.

使用示例:

```java
GET shop/_search
{
    "query": {
        "match": {
            "name": {					// 要查询的field 
                "query": "编程思想",
                "operator": "or"		// 操作符
            }
        }
    }
}
```

## 3.4 指定命中的百分比 - minimum_should_match

`minimum_should_match` 用来指定最少要匹配多少比例的分词, 才算符合条件并返回结果.

示例:搜索name中包含"并发编程的艺术", 被拆分成"并发", "编程", "艺术"等词, 现在要求至少匹配50%的分词, 可以这样:

```java
GET shop/_search
{
    "query": {
        "match": {
            "name": {
                "query": "并发编程的艺术", 
                "minimum_should_match": "50%"
            }
        }
    }
}
```

当然这种需求也可以用 must、must_not、should 匹配同一个字段的方式进行组合查询.

## 3.5 多字段的匹配 - multi_match

`multi_match` 用来对多个字段同时进行匹配: 任意一个字段中存在相应的分词, 就可作为结果返回.

示例 **1、** : 查询 name 或 desc 字段中包含 "面试经典" 的文档 —— 会对查询串进行分词:

```java
GET shop/_search
{
    "query": {
        "multi_match": {
            "query": "面试经典", 
            "fields": [
                "name", 
                "desc"
            ]
        }
    }
}
```

示例 **2、** : 查询 name 或 desc 字段中同时包含 "面试经典" 的文档 —— 不对查询串进行分词:

```java
GET shop/_search
{
    "query": {
        "multi_match": {
            "query": "面试经典",
            "type": "cross_fields", // 还有best_fields、most_fields、phrase、phrase_prefix选项
            "operator": "and", 		// 全部匹配, or是部分匹配
            "fields": [
                "name", 
                "desc"
            ]
        }
    }
}
```

## 4 bool query - 布尔查询(真假查询)

bool query, 顾名思义, 就是 **真假/有无** 查询. 包括4个子查询:

**1、** must - 必须匹配, 类似于SQL中的 `=` ;

**2、** must_not - 必须不匹配, 类似于SQL中的 `!=` ;

**3、** should - 不强制匹配, 类似于SQL中的 `or` ;

**4、** filter - 过滤, 将满足一定条件的文档筛选出来.

**除filter之外, 每个子查询都会根据自己的条件计算出每个文档的相关度分数, 然后bool综合所有分数, 合并为一个.**

## 4.1 简单功能示例

```java
GET shop/_search
{
    "query": {
        "bool": {
            "must":[ 
                { "match": { "name": "Java" } }
            ], 
            "must_not": [
                { "match": { "desc": "编程" } }
            ], 
            "should": [
                { "match": { "publisher": "机械工业" } }
            ], 
            "filter": {
                "bool": { 
                    "must": [
                        { "range": { "date": { "gte": "2010-01-01" }}},
                        { "range": { "price": { "lte": 99.00 }}}
                    ]
                }
            }
        }
    }
}
```

## 4.2 嵌套使用bool query

```java
GET shop/_search
{
    "query": {
        "bool": {
            "should": [
                { "term": { "name.keyword": "Java编程思想" } },
                {
                    "bool": {
                        "must": [
                            { "term": { "product_desc": "刷头" } }
                        ]
                    }
                }
            ]
        }
    }
}
```

## 4.3 直接filter操作 - 使用constant_score

> 如果不指定query条件而直接filter, 将抛出no [query] registered for [filter], 此时通过constant_score即可实现直接filter.

```java
GET shop/_search 
{
    "query": {
    	"constant_score": {
            "filter": {
                "range": { "price": { "gte": 80 } }
            }
        }
    }
}
```

## 4.4 指定should的匹配个数 - minimum_should_match

如果组合查询中没有`must`, 就会至少匹配一个`should`.

可以通过 `minimum_should_match` 指定匹配的`should`的个数.

```java
GET shop/_search
{
    "query": {
        "bool": {
            "should": [
                { "match": { "name": "java" } }, 
                { "match": { "desc": "编程"} }, 
                { "match": { "price": 109 } }
            ], 
            "minimum_should_match": 2
        }
    }
}
```
