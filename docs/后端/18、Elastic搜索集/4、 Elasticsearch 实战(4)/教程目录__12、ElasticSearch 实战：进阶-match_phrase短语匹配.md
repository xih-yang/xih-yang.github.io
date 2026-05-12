# 12、ElasticSearch 实战：进阶-match_phrase短语匹配
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/12.html
- 分类：搜索引擎
- 分组：教程目录
> 接11节

#### 4)、match_phrase 【短语匹配】

将需要匹配的值当成一个整体单词(不分词)进行检索

举个栗子：查出 address 中包含 `mill road` 的所有记录，并给出相关性得分

```java
GET /bank/_search
{
  "query": {
    "match_phrase": {
      "address": "mill road"
    }
  }
}
```

> 参考文档-query-dsl
