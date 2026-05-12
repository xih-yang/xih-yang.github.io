# 101、HBase自定义拆分策略
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/101.html
- 分类：大数据框架
- 分组：教程目录
## 自定义拆分策略

您可以使用自定义RegionSplitPolicy（HBase 0.94+）重写默认拆分策略。通常，自定义拆分策略应该扩展HBase的默认拆分策略： IncreasingToUpperBoundRegionSplitPolicy。

该策略可以通过HBase配置或者也可以基于每个表在全局范围内进行设置。

在hbase-site.xml中全局配置拆分策略：

```java
<property>
  <name>hbase.regionserver.region.split.policy</name>
  <value>org.apache.hadoop.hbase.regionserver.IncreasingToUpperBoundRegionSplitPolicy</value>
</property>
```

使用Java API在表上配置拆分策略：

```java
HTableDescriptor tableDesc = new HTableDescriptor("test");
tableDesc.setValue(HTableDescriptor.SPLIT_POLICY, ConstantSizeRegionSplitPolicy.class.getName());
tableDesc.addFamily(new HColumnDescriptor(Bytes.toBytes("cf1")));
admin.createTable(tableDesc);
----
```

使用HBase Shell在表上配置拆分策略：

```java
hbase> create 'test', {METADATA => {'SPLIT_POLICY' => 'org.apache.hadoop.hbase.regionserver.ConstantSizeRegionSplitPolicy'}},{NAME => 'cf1'}
```

该策略可以通过使用的HBaseConfiguration或按表进行全局设置：

```java
HTableDescriptor myHtd = ...;
myHtd.setValue(HTableDescriptor.SPLIT_POLICY, MyCustomSplitPolicy.class.getName());
```

该DisabledRegionSplitPolicy策略阻止手动区域拆分。
