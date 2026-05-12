# 01、ElasticSearch 实战：简介
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/1.html
- 分类：搜索引擎
- 分组：教程目录
## 简介

全文搜索属于最常见的需求，开源的 Elasticsearch 是目前全文搜索引擎的首选。它可以快速地存储、搜索和分析海量数据。

维基百科、Stack Overflow、Github 都采用它。

Elastic 的底层是开源库 Lucene。

但是，你没法直接用 Lucene，必须自己写代码去调用它的接口。

Elastic 是 Lucene 的封装，提供了 REST API 的操作接口，开箱即用。

REST API：天然的跨平台。

- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [官方中文](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)

## 一、基本概念

### 1、Index（索引）

动词，相当于 MySQL 中的 insert；

名词，相当于 MySQL 中的 Database

### 2、Type（类型）

在Index（索引）中，可以定义一个或多个类型；

类似于MySQL 中的 Table；每一种类型的数据放在一起。

### 3、Document（文档）

保存在某个索引（Index）下，某种类型（Type）的一个数据（Document），文档是 JSON 格式的，

Document 就像是 MySQL 中的某个 Table 里面的内容。

### 4、倒排索引机制

词
记录

红海
1,2,3,4,5

行动
1,2,3

探索
2,5

特别
3,5

记录篇
4

特工
5

`分词`：将整句分拆为单词

> 保存的记录

- 1-红海行动
- 2-探索红海行动
- 3-红海特别行动
- 4-红海记录篇
- 5-特工红海特别探索

`检索`：

1）、红海特工行动？

2）、红海行动？

`相关性得分`：
