# 132、HBase合并增量备份映像
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/132.html
- 分类：大数据框架
- 分组：教程目录
## 合并增量备份映像

此命令可用于将两个或多个增量备份映像合并为单个增量备份映像。这可用于将多个小型增量备份映像合并为一个较大的增量备份映像。此命令可用于将每小时增量备份合并到每日增量备份映像中，或将每日增量备份合并到每周增量备份中。

```java
$ hbase backup merge <backup_ids>
```

### 位置命令行参数

backup_ids

以逗号分隔的增量备份映像ID列表，它们将组合到单个映像中。

### 命名命令行参数

没有。

### 用法示例

```java
$ hbase backup merge backupId_1467823988425,backupId_1467827588425
```
