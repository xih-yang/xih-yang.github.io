# 11、ElasticSearch 实战：进阶-match全文检索
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/11.html
- 分类：搜索引擎
- 分组：教程目录
> 接第10节

#### 3)、match【匹配查询】

- 基本类型（非字符串），精确匹配

match 返回 account_number=20 的数据：

```java
GET /bank/_search
{
  "query": {
    "match": {
      "account_number": 20
    }
  }
}
```

- 字符串，全文检索

最终查询出 address 中包含 Kings 单词的所有记录，当搜索字符串类型的时候，会进行全文检索，并且每条记录有相关性得分。

```java
GET /bank/_search
{
  "query": {
    "match": {
      "address": "Kings"
    }
  }
}
```

- 字符串，多个单词（分词+全文检索）

全文检索按照评分进行排序，会对检索条件进行分词匹配

```java
GET /bank/_search
{
  "query": {
    "match": {
      "address": "Mill Lane"
    }
  }
}
```

最终查询出 address 中包含 Mill 或者 Lane 或者 Mill Lane 的所有记录,并给出相关性得分

> 参考文档-query-dsl
