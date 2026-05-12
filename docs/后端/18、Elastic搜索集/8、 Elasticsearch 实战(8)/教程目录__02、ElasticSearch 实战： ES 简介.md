# 02、ElasticSearch 实战： ES 简介
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/2.html
- 分类：搜索引擎
- 分组：教程目录
Elasticsearch 使用 Java 语言开发，使用 Elastic 开源协议，实时分布式开源的全文搜索和分析引擎。

Elasticsearch 通过 RESTful Web 服务接口访问，并使用 JSON 文档来存储数据。

Elasticsearch 使用 Java 作为开发语言，但却能够跨平台运行，可以使用者非常快速的探索大量的数据

Elasticsearch 由 **Shay Banon** 于 2010 年创建，当前的最新版本是 2018 年 6 月 13 日发布的 6.3.0

### Elasticsearch 官网

Elasticsearch 的官方网址是： [https://www.elastic.co/products/elasticsearch](https://www.elastic.co/products/elasticsearch)

Elasticsearch 的下载地址是： [https://www.elastic.co/downloads/elasticsearch](https://www.elastic.co/downloads/elasticsearch)

### Elasticsearch 背后的公司

Elasticsearch 发布不久后就受到开发的持续关注，成为 Github 上最受欢迎的项目之一。

之后，一家主营 Elasticsearch 的公司成立了，它们一边提供商业支持一边开发新功能，但它们保证， Elasticsearch 将永远开源且对所有人可用

## Elasticsearch 的特性

**1、** 安装方便：没有其他依赖，下载后安装非常方便；只用修改几个参数就可以搭建起来一个集群；

**2、** JSON：输入/输出格式为JSON，意味着不需要定义Schema，快捷方便；

**3、** RESTful：基本所有操作(索引、查询、甚至是配置)都可以通过HTTP接口进行；

**4、** 分布式：节点对外表现对等（每个节点都可以用来做入口）；加入节点自动均衡；

**5、** 多租户：可根据不同的用途分索引；可以同时操作多个索引；

**6、** 支持超大数据：可以扩展到PB级的结构化和非结构化数据；

**7、** Elasticsearch可以用来替代MongoDB和RavenDB等文档数据库；

说了这么多，其实只有一个优点： 如果想要创建自己的搜索引擎，那么 Elasticsearch 是唯一的不可替代的方案，没有之一

## Elasticsearch 优点

**1、** Elasticsearch使用Java作为开发语言，所以可以运行在任何平台上；

**2、** Elasticsearch是实时的，换句话说，就是在添加了文档后就可以立刻搜索到刚刚添加的文档；

**3、** Elasticsearch是分布式的，可以轻松扩展并集成到任何大型组织中；

**4、** 通过使用Elasticsearch中的网关概念，轻松创建完整备份；

**5、** 与ApacheSolr相比，Elasticsearch中处理多租户非常容易；

**6、** Elasticsearch使用JSON对象作为响应，这是当下最流行的数据交换格式；

**7、** Elasticsearch几乎支持所有文档类型，但不能渲染的文本除外，例如二进制数据；

## Elasticsearch 缺点

**1、** 与ApacheSolr不同，Elasticsearch在处理请求和响应数据方面不支持多种数据格式，也就是说只支持JSON；

```java
Apache Solr 支持多种数据传输格式，比如 CSV，XML 和 JSON 格式
```

**2、** Elasticsearch也存在脑裂(Split-Brain)的情况，但发生的可能性很少；

```java
Split-Brain，中文一般翻译为 **脑裂**， 脑裂问题就是产生了两个 leader,导致集群行为不一致
```
