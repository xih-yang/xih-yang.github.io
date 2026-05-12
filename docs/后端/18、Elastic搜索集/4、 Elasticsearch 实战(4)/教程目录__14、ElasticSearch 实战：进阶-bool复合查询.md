# 14、ElasticSearch 实战：进阶-bool复合查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/14.html
- 分类：搜索引擎
- 分组：教程目录
> 接第13节

#### 6)、bool 【复合查询】

bool 用来做复合查询：

复合语句可以合并任何其它查询语句，包括复合语句，了解这一点是很重要的。

这就意味着，复合语句之间可以互相嵌套，可以表达非常复杂的逻辑。

- must：必须达到 must 列举的所有条件

```java
GET /bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "gender": "F"
          }
        },
        {
          "match": {
            "address": "Mill"
          }
        }
      ]
    }
  }
}
```

- must_not：子句（查询）不得出现在匹配的文档中

```java
GET /bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "gender": "F"
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
      ]
    }
  }
}
```

- should：子句（查询）应出现在匹配的文档中。（should表示有最好，没有也可以）

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
      ]
    }
  }
}
```

### 布尔查询

与文档匹配的查询，这些文档与其他查询的布尔组合匹配。布尔查询映射到Lucene `BooleanQuery`。它是使用一个或多个布尔子句构建的，每个子句都具有类型的出现。发生类型为：

发生
描述

must
子句（查询）必须出现在匹配的文档中，并将有助于得分。

filter
子句（查询）必须出现在匹配的文档中。但是不像 must查询的分数将被忽略。Filter子句在filter上下文中执行，这意味着计分被忽略，并且子句被考虑用于缓存。

should
子句（查询）应出现在匹配的文档中。

must_not
子句（查询）不得出现在匹配的文档中。子句在过滤器上下文中执行，这意味着计分被忽略，并且子句被视为用于缓存。由于忽略计分，0因此将返回所有文档的分数。

> 参考文档-query-dsl-bool-query

下一节我们来看一下 `filter` 结果过滤。

> 参考文档-query-dsl
