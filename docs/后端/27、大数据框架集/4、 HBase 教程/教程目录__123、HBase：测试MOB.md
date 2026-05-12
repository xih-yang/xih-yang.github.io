# 123、HBase：测试MOB
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/123.html
- 分类：大数据框架
- 分组：教程目录
## 测试MOB

HBase中提供了实用程序org.apache.hadoop.hbase.IntegrationTestIngestWithMOB以帮助测试MOB功能。该实用程序运行如下：

```java
$ sudo -u hbase hbase org.apache.hadoop.hbase.IntegrationTestIngestWithMOB \
            -threshold 1024 \
            -minMobDataSize 512 \
            -maxMobDataSize 5120
```

- threshold是当cells被认为是MOB时的阈值；默认值为1 kB，以字节为单位表示。
- minMobDataSize是MOB数据大小的最小值；默认值为512 B，以字节为单位表示。
- maxMobDataSize是MOB数据大小的最大值；默认值为5 kB，以字节为单位表示。
