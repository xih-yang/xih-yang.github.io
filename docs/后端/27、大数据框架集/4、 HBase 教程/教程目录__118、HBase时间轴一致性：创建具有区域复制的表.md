# 118、HBase时间轴一致性：创建具有区域复制的表
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/118.html
- 分类：大数据框架
- 分组：教程目录
## 创建具有区域复制的表

区域复制是每个表的属性。默认情况下，所有表都有REGION_REPLICATION=1，这意味着每个区域只有一个副本。您可以通过在表描述符中提供REGION_REPLICATION属性来设置和更改表的每个区域的副本数。

### Shell

```java
create 't1', 'f1', {REGION_REPLICATION => 2}
describe 't1'
for i in 1..100
put 't1', "r#{i}", 'f1:c1', i
end
flush 't1'
```

### Java

```java
HTableDescriptor htd = new HTableDescriptor(TableName.valueOf(“test_table”));
htd.setRegionReplication(2);
...
admin.createTable(htd);
```

您还可以使用setRegionReplication()和更改表来增加，减少表的区域复制。
