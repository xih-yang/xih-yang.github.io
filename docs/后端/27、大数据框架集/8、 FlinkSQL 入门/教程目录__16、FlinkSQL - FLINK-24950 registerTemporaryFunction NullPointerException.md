# 16、FlinkSQL - FLINK-24950 registerTemporaryFunction NullPointerException
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/16.html
- 分类：大数据框架
- 分组：教程目录
## 问题

Flink SQL 使用Hive Dialect，同时Hive使用1.1.0-CDH5.x.x，报错:

```java
Exception in thread "main" java.lang.NullPointerException
    at org.apache.flink.table.catalog.hive.client.HiveShimV100.registerTemporaryFunction(HiveShimV100.java:422)
    at org.apache.flink.table.planner.delegation.hive.HiveParser.parse(HiveParser.java:217)
    at org.apache.flink.table.api.internal.TableEnvironmentImpl.executeSql(TableEnvironmentImpl.java:724)
```

详细场景参见 [FLINK-24950](https://issues.apache.org/jira/browse/FLINK-24950)

## 分析

Apache Hive 1.1.0-CDH5.x.x 有问题，按照FLINK-24950所说，需要升级到Hive-1.2.0，然而CDH似乎没有 Hive-1.2.0，直接 Hive-2.x.x。

因此需要修改 Apache Hive 1.1.0-CDH5.x.x的源码。

FLINK-24950 说到:

> hive. 1.1.0, and it does have the method.

因此可以从 Apache Hive 1.1.0 的源码移植到 Apache Hive 1.1.0-CDH5.x.x。

## 解决

直接增加`registerTemporaryFunction`的实现。
