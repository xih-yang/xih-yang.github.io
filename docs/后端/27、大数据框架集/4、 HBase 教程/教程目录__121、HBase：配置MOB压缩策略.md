# 121、HBase：配置MOB压缩策略
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/121.html
- 分类：大数据框架
- 分组：教程目录
## 配置MOB压缩策略

默认情况下，一个特定日期的MOB文件会压缩为一个大型MOB文件。为了更多地减少MOB文件数，还支持其他MOB压缩策略：

**1、** 每日（daily）策略–每天将MOB文件压缩为一个大型MOB文件（默认策略）；

**2、** 每周（weekly）策略–每周将MOB文件压缩为一个大型MOB文件；

**3、** 每月（montly）策略–每月将MOB文件压缩为一个大型MOB文件；

使用HBase Shell配置MOB压缩策略：

```java
hbase> create 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'daily'}
hbase> create 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'weekly'}
hbase> create 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'monthly'}
hbase> alter 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'daily'}
hbase> alter 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'weekly'}
hbase> alter 't1', {NAME => 'f1', IS_MOB => true, MOB_THRESHOLD => 102400, MOB_COMPACT_PARTITION_POLICY => 'monthly'}
```
