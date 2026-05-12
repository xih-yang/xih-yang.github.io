# 16、ElasticSearch 实战：进阶-term查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/16.html
- 分类：搜索引擎
- 分组：教程目录
> 接第15节

#### 8)、term

和match 一样。匹配某个属性的值。`全文检索字段用 match，其他非 text 字段匹配用 term`。

> Avoid using the term query for text fields.
>
> By default, Elasticsearch changes the values of text fields as part of analysis. This can make finding exact matches for text field values difficult.
>
> To search text field values, use the match query instead.

非文本值使用 term 检索：

```java
GET /bank/_search
{
  "query": {
    "term": {
      "age":28
    }
  }
}
```

match 的 `xxx.keyword`，文本的精确匹配检索：

```java
GET /bank/_search
{
  "query": {
    "match": {
      "address.keyword": "789 Madison"
    }
  }
}
```

match 全文分词匹配：

```java
GET /bank/_search
{
  "query": {
    "match": {
      "address": "789 Madison"
    }
  }
}
```

match_phrase，将需要匹配的值当成一个整体单词(不分词)进行检索：

```java
GET /bank/_search
{
  "query": {
    "match_phrase": {
      "address": "789 Madison"
    }
  }
}
```

`注意`：如果对于文本值使用 term 检索时，并不会进行分词，而是精确检索，所以可能会匹配不到数据：

```java
GET /bank/_search
{
  "query": {
    "term": {
      "address": "789 Madison"
    }
  }
}
```

> 参考文档-query-dsl-term-query

> 参考文档-query-dsl
