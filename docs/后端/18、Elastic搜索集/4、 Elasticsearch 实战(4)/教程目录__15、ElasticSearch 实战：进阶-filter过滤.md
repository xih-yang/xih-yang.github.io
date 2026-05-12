# 15、ElasticSearch 实战：进阶-filter过滤
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/15.html
- 分类：搜索引擎
- 分组：教程目录
> 接第14节

#### 7)、filter 【结果过滤】

并不是所有的查询都需要产生分数，特别是那些仅用于 “fitering” (过滤)的文档。为了不计算分数 Elasticsearch 会自动检查场景并且优化查询的执行。

在filter 元素下指定的查询对得分没有影响-得分以 0 形式返回。分数仅受指定查询的影响。

以`must` 查询为例：

```java
GET /bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
     "range": {
          "age": {
            "gte": 18,
            "lte": 30
          }
        }}
      ]
    }
  }
}
```

使用`filter` 来替代 `must` 查询，需要注意的是，使用`filter`查询出的结果和`must`查询出的结果是一致的，差异仅是没有相关性得分：

```java
GET /bank/_search
{
  "query": {
    "bool": {
      "filter": {
        "range": {
          "age": {
            "gte": 18,
            "lte": 30
          }
        }
      }
    }
  }
}
```

所以我们在 `should` 之后还可以加上 `filter` 条件进行过滤：

```java
GET /bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "gender": "M"
          }
        },
        {
          "match": {
            "address": "Mill"
          }
        }
      ],
      "must_not": [
        {
     "match": {
          "age": 30
        }}
      ],
      "should": [
        {
     "match": {
          "lastname": "Holland"
        }}
      ],
      "filter": {
        "range": {
          "age": {
            "gte": 18,
            "lte": 30
          }
        }
      }
    }
  }
}
```

> 参考文档-query-dsl
