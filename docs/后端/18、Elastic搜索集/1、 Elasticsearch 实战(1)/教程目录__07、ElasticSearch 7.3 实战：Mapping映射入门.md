# 07、ElasticSearch 7.3 实战：Mapping映射入门
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/7.html
- 分类：搜索引擎
- 分组：教程目录
## 1．mapping映射

概念：自动或手动为index中的_doc建立的一种数据结构和相关配置，简称为mapping映射。插入几条数据，让es自动为我们建立一个索引

```java
PUT /website/_doc/1
{
  "post_date": "2019-01-01",
  "title": "my first article",
  "content": "this is my first article in this website",
  "author_id": 11400
}
PUT /website/_doc/2
{
  "post_date": "2019-01-02",
  "title": "my second article",
  "content": "this is my second article in this website",
  "author_id": 11400
}
PUT /website/_doc/3
{
  "post_date": "2019-01-03",
  "title": "my third article",
  "content": "this is my third article in this website",
  "author_id": 11400
}
```

执行结果

对比一下数据库建表语句

```java
create table website(
     post_date date,
     title varchar(50),     
     content varchar(100),
     author_id int(11) 
 );
```

动态映射：dynamic mapping，自动为我们建立index，以及对应的mapping，mapping中包含了每个field对应的数据类型，以及如何分词等设置。

可以采用下面语句查看一下website的mapping

```java
GET  /website/_mapping/
```

得到的结果是：

尝试各种搜索

```java
GET /website/_search?q=2019        0条结果             
GET /website/_search?q=2019-01-01           1条结果
GET /website/_search?q=post_date:2019-01-01     1条结果
GET /website/_search?q=post_date:2019          0 条结果
```

搜索结果为什么不一致，因为es自动建立mapping的时候，设置了不同的field不同的data type。不同的data type的分词、搜索等行为是不一样的。所以出现了_all field和post_date field的搜索表现完全不一样。
