# 13、ElasticSearch 实战：进阶-multi_match多字段匹配
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/13.html
- 分类：搜索引擎
- 分组：教程目录
> 接12节

#### 5)、multi_match 【多字段匹配】

举例：state 或 address 包含 mill

```java
GET /bank/_search
{
  "query": {
    "multi_match": {
      "query": "mill",
      "fields": ["address","state"]
    }
  }
}
```

多字段查询的时候也会进行分词查询，得分最高的在前面：

```java
GET /bank/_search
{
  "query": {
    "multi_match": {
      "query": "mill movico",
      "fields": ["address","city"]
    }
  }
}
```
