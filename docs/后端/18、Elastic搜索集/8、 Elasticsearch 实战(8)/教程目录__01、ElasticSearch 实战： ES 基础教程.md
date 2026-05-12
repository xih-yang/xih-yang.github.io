# 01、ElasticSearch 实战： ES 基础教程
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/1.html
- 分类：搜索引擎
- 分组：教程目录
Elasticsearch ( ES ) 是一个基于 Lucene 的实时分布式开源的全文搜索和分析引擎。它不但稳定、可靠、快速，而且也具有良好的水平扩展能力，是专门为分布式环境设计的

Elasticsearch 通常用于单页面应用 ( Single Page Application ) 项目中，这个应用程序像 Google 和百度一样，提供一个搜索框用于输入关键字，然后返回一个包含搜索结果的列表

Elasticsearch 使用 Java 语言开发，使用 Elastic 开源协议，已经被世界各地的各个大型的公司或组织使用。

本基础教程，我们通过对 Elasticsearch 的一些简单介绍和使用，让大家对 Elasticsearch 有一个基本的了解，达到能够使用 Elasticsearch 创建一个属于自己的简单搜索引擎

## 初衷

本站的顶部的搜索功能，使用的是 MySQL 中的 LIKE 语句实现的，搜素结果简单了些，而且没有任何很好的排序解决方案

其实，网站还没成型的时候，我就想要创建一个属于自己的搜索引擎，使用 Elasticsearch 来创建。也使用 Google 搜索了很多教程，看得总是不尽人意

怎么个不尽人意呢？

想想，如果你要使用 Elasticsearch 来实现搜索功能，你一般需要哪些?

**1、** 哪里下载Elasticsearch；

**2、** 如何安装；

**3、** 安装完Elasticsearch的第一步是做什么；

**4、** 如果需要继续配置Elasticsearch，那应该怎么做？；

**5、** 我要怎么把我要搜索的内容嫁到Elasticsearch；

**6、** 我要把哪些搜索的哪些东西加入到Elasticsearch，加入的方法有什么区别；

**7、** 加入成功后，我要怎么实现搜索功能，怎么检索出来；

**8、** 检索出来的结果我要如何排序，又要如何设计排序；

**9、** 对于中文，希望实现中文分词功能，又要怎么做；

等等这些，这些，没有一个系统的流水线的文章来说明它们…

所以，本教程，想以短短几十篇课程，一窥 Elasticsearch 的使用方式

## 开始学习之前

因为Elasticsearch 的 API 接口以 HTTP Restful 形式提供，使用 JSON 作为数据交换协议。所以我们希望你对 HTTP 和 JSON 有一定的基本了解

Web应用程序都会用到一些基本的 HTML 、CSS 和 JavaScript ，所以，我们也希望你具备一些这方面的基础知识

虽然Elasticsearch 语言开发，但除了安装环境和定制一些功能外，几乎用不到 Java 语言，所以，会不会 Java 倒是其次。

## 讨论

如果你对本教程有任何疑问或者发现任何错误，欢迎你在讨论区留下你包括的意见

Elasticsearch 讨论区
