# 119、HBase时间轴一致性：读取API和用法
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/119.html
- 分类：大数据框架
- 分组：教程目录
## 阅读API和用法

### Shell

您可以使用Consistency.TIMELINE语义在shell中进行读取，如下所示：

```java
hbase(main):001:0> get 't1','r6', {CONSISTENCY => "TIMELINE"}
```

您可以模拟区域服务器暂停或变得不可用，并从辅助副本执行读取操作：

```java
$ kill -STOP <pid or primary region server>
hbase(main):001:0> get 't1','r6', {CONSISTENCY => "TIMELINE"}
```

使用扫描也是类似的：

```java
hbase> scan 't1', {CONSISTENCY => 'TIMELINE'}
```

### Java

您可以为Get和Scans设置一致性，并按如下方式执行请求：

```java
Get get = new Get(row);
get.setConsistency(Consistency.TIMELINE);
...
Result result = table.get(get);
```

您还可以传递多个获取：

```java
Get get1 = new Get(row);
get1.setConsistency(Consistency.TIMELINE);
...
ArrayList<Get> gets = new ArrayList<Get>();
gets.add(get1);
...
Result[] results = table.get(gets);
```

以及扫描：

```java
Scan scan = new Scan();
scan.setConsistency(Consistency.TIMELINE);
...
ResultScanner scanner = table.getScanner(scan);
```

您可以通过调用Result.isStale()方法来检查结果是否来自主区域：

```java
Result result = table.get(get);
if (result.isStale()) {
  ...
}
```
