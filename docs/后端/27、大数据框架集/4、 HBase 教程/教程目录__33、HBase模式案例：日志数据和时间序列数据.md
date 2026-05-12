# 33、HBase模式案例：日志数据和时间序列数据
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/33.html
- 分类：大数据框架
- 分组：教程目录
## HBase案例：日志数据和时间序列数据

本节为你介绍了 HBase 模式案例之一：日志数据和时间序列数据

假设正在收集以下数据元素。

- 主机名（Hostname）
- 时间戳（timestamp）
- 日志事件（Log event）
- 值/消息（Value/message）

我们可以将它们存储在名为 LOG_DATA 的 HBase 表中，但 rowkey 会是什么呢？从这些属性中，rowkey 将是主机名，时间戳和日志事件的一些组合，但具体是什么？

### 行密钥（Rowkey）主导位置中的时间戳（Timestamp）

rowkey [timestamp][hostname][log-event] 受单调递增的行键/时间戳数据（Monotonically Increasing Row Keys/Timeseries Data）中描述的单调增长 rowkey 问题的影响。

通过在时间戳上执行 mod 操作，在关于 “bucketing” 时间戳的 dist-lists 中经常提到另一种模式。如果时间扫描很重要，这可能是一个有用的方法。必须注意 bucket 的数量，因为这需要相同数量的扫描来返回结果。

```java
long bucket = timestamp % numBuckets;
```

构造：

```java
[bucket][timestamp][hostname][log-event]
```

如上所述，要选择特定时间范围（timerange）的数据，需要为每个存储 bucket 执行 Scan。例如，100个存储 bucket 将在密钥空间中提供广泛的分布，但它需要 100 次 Scan 才能获得单个时间戳的数据，因此存在权衡。

### 行密钥（Rowkey）主导位置中的主机（Host）

如果有大量的主机在整个密钥空间中进行写入和读取操作，则 rowkey [hostname][log-event][timestamp] 是一个候选项。如果按主机名扫描是优先事项，则此方法非常有用。

### 时间戳或反向时间戳

如果最重要的访问路径是拉取最近的事件，则将时间戳存储为反向时间戳（例如，timestamp = Long.MAX_VALUE – timestamp）将创建能够对 [hostname][log-event] 执行 Scan 以获取最近捕获的事件的属性。

这两种方法都不是错的，它只取决于什么是最适合的情况。

反向扫描 API

HBASE-4811 实现了一个 API，它以反向扫描表格或范围内的表格，从而减少了对正向或反向扫描进行模式优化的需求。此功能在 HBase 0.98 和更高版本中可用。

### 可变长度或固定长度的行键

记住，在 HBase 的每一列上加盖行密码是非常重要的。如果主机名为 a，并且事件类型是 e1，那么结果 rowkey 会很小。但是，如果摄入的主机名是myserver1.mycompany.com 和事件类型是 com.package1.subpackage2.subsubpackage3.ImportantService，会怎么样？

在rowkey 中使用一些替换可能是有意义的。至少有两种方法：哈希和数字。在 Rowkey Lead Position 示例中的主机名中，它可能如下所示：

带有哈希的复合 Rowkey：

- [主机名的MD5哈希] = 16个字节（[MD5 hash of hostname] = 16 bytes）
- [事件类型的MD5哈希] = 16个字节（[MD5 hash of event-type] = 16 bytes）
- [时间戳] = 8个字节（[timestamp] = 8 bytes）

具有数值替换的复合 Rowkey：

对于这种方法，除了 LOG_DATA（称为LOG_TYPES）之外，还需要另一个查找表。LOG_TYPES 的 rowkey 是：

- [type]，（例如，指示主机名与事件类型的字节）。
- [bytes]，原始主机名或事件类型的可变长度字节。

此rowkey 的列可能是一个具有指定编号的长整数，可通过使用 HBase 计数器获得。

所以得到的复合 rowkey 将是：

- [代替主机名长] = 8个字节（[substituted long for hostname] = 8 bytes）
- [长时间取代事件类型] = 8个字节（[substituted long for event type] = 8 bytes）
- [时间戳] = 8个字节（[timestamp] = 8 bytes）

在Hash 或 Numeric 替换方法中，主机名和事件类型的原始值可以存储为列。
