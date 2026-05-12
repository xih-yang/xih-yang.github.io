# 09、ElasticSearch 实战：进阶-两种查询方式
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/9.html
- 分类：搜索引擎
- 分组：教程目录
> 接第8节

## 四、进阶检索

### 1、SearchAPl

ES支持两种基本方式检索：

- 一个是通过使用 REST request URI 发送搜索参数(uri+检索参数)
- 另一个是通过使用 REST requestbody 来发送它们(uri+请求体)

#### 1)、检索信息

一切检索从_search开始

`uri+检索参数`:

请求或返回
解释

GET bank/_search
检索 bank 下所有信息,包括 type 和 docs

GET bank/_search?q=*&sort=account_number:asc
请求参数方式检索

响应结果解释：

took
Elasticsearch执行搜索的时间(臺秒)

time_out
告诉我们搜索是否超时

_shards
告诉我们多少个分片被搜索了,以及统计了成功/失败的搜索分片

hits
搜索结果

hits.total
搜索结果

hits.hits
实际的搜索结果数组(默认为前10的文档)

sort
结果的排序 key (键) (没有则按 score 排序)

score 和 max_score
相关性得分和最高得分(全文检索用)

查询结果：

`uri+请求体 进行检索`:

uri+请求体 进行检索

GET /bank/_search
{
 “query”: {
 “match_all”: {}
 },
 “sort”: [
 {
 “account_number”: “asc”
 },
 {
 “balance”: “desc”
 }
 ]
}

HTTP 客户端工具(POSTMAN)，get 请求不能携带请求体，我们变为 post 也是一样的我们 POST 一个 JSON 风格的查询请求体到_search APl。
需要了解，一旦搜索的结果被返回， Elasticsearch 就完成了这次请求，并且不会维护任何服务端的资源或者结果的 cursor (游标)

查询结果：

> 参考文档getting-started-search

### 2、Query DSL

> 在上一节中使用的形如

```java
GET /bank/_search
{
  "query": {
    "match_all": {
      }
  },
  "sort": [
    {
      "account_number": "asc"
    },
    {
      "balance": "desc"
    }
  ]
}
```

> 的查询语言风格，我们称之为 Query DSL。

#### 1)、基本语法格式

Elastisearch 提供了一个可以执行查询的 Json 风格的 DSl (domain-specific language 领域特定语言) 。这个被称为Query DSL。

该查询语言非常全面，并且刚开始的时候感觉有点复杂，真正学好它的方法是从一些基础的示例开始的。

- 一个查询语句的典型结构
