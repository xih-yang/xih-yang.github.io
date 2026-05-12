# 137、HBase删除备份映像
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/137.html
- 分类：大数据框架
- 分组：教程目录
## 删除备份映像

此命令可用于删除不再需要的备份映像。

```java
$ hbase backup delete <backup_id>
```

### 位置命令行参数

backup_id

应该删除备份映像的ID。

### 命名命令行参数

没有。

### 用法示例

```java
$ hbase backup delete backupId_1467823988425
```
