# 34、HBase案例：Steroids上的日志数据
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/34.html
- 分类：大数据框架
- 分组：教程目录
## HBase案例：Steroids上的日志数据/时间序列上

这实际上是 OpenTSDB 的方法。OpenTSDB 做的是重写数据并将行打包到某些时间段中的列中。

但是，这是一般概念的工作原理：例如，以这种方式摄入数据：

```java
[hostname][log-event][timestamp1]
[hostname][log-event][timestamp2]
[hostname][log-event][timestamp3]
```

每个细节事件都有独立的 rowkeys，但是会被重写成这样：

```java
[hostname][log-event][timerange]
```

上述每个事件都转换为存储的列，其相对于开始 timerange 的时间偏移量 (例如，每5分钟)。这显然是一个非常先进的处理技术，但 HBase 使这成为可能。
