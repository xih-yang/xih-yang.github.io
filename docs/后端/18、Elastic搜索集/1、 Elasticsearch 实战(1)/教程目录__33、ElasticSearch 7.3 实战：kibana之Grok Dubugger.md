# 33、ElasticSearch 7.3 实战：kibana之Grok Dubugger
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/33.html
- 分类：搜索引擎
- 分组：教程目录
在[ElasticSearch7.3学习(三十二)----logstash三大插件（input、filter、output）及其综合示例](/zhuanlan/search/elasticsearch/1/32.html)中学到logstash使用filter插件进行数据清洗，grok是一个十分强大的logstash filter插件，他可以通过正则解析任意文本，将非结构化日志数据弄成结构化和方便查询的结构。他是目前logstash 中解析非结构化日志数据最好的方式。

但是在运用过程中不可能在生产上进行测试，需要一个测试工具来判断grok语法是否正确。

如下所示，

样例数据

```java
172.16.213.132 [07/Feb/2019:16:24:19 +0800] "GET / HTTP/1.1" 403 5039
```

Grok表达式

```java
%{IP:clientip}\ \[%{HTTPDATE:timestamp}\]\ %{QS:referrer}\ %{NUMBER:response}\ %{NUMBER:bytes}
```

测试结果如下
