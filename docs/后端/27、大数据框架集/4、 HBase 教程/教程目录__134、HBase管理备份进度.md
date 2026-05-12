# 134、HBase管理备份进度
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/134.html
- 分类：大数据框架
- 分组：教程目录
## 管理备份进度

您可以通过运行hbase backup progress命令并将备份ID指定为参数来监视另一个终端会话中正在运行的备份。

例如，以hbase超级用户身份运行以下命令以查看备份进度：

```java
$ hbase backup progress <backup_id>
```

### 位置命令行参数

**backup_id**

通过查看进度信息指定要监视的备份，backupId需要区分大小写。

### 命名命令行参数

没有。

### 用法示例

```java
hbase backup progress backupId_1467823988425
```
