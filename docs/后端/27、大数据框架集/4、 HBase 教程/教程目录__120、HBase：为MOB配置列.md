# 120、HBase：为MOB配置列
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/120.html
- 分类：大数据框架
- 分组：教程目录
## 为MOB配置列

您可以在表创建或更改期间配置列以支持MOB，无论是在HBase Shell中还是通过Java API。两个相关的属性是boolean IS_MOB和MOB_THRESHOLD，它是一个对象被认为是MOB的字节数，只需要IS_MOB。如果未指定MOB_THRESHOLD，则使用默认阈值100 KB。

使用HBase Shell为MOB配置列：

```java
hbase> create 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400}
hbase> alter 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400}
```

示例23.使用Java API为MOB配置列：

```java
...
HColumnDescriptor hcd = new HColumnDescriptor(“f”);
hcd.setMobEnabled(true);
...
hcd.setMobThreshold(102400L);
...
```
