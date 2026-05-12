# 135、HBase管理备份历史记录
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/135.html
- 分类：大数据框架
- 分组：教程目录
## 管理备份历史记录

此命令显示备份会话日志。每个会话的信息包括备份ID、类型（完整或增量），备份中的表、状态以及开始和结束时间。使用可选的-n参数指定要显示的备份会话数。

```java
$ hbase backup history <backup_id>
```

### 位置命令行参数

backup_id

通过查看进度信息指定要监视的备份，backupId要区分大小写。

### 命名命令行参数

-n``

（可选）最大备份记录数（默认值：10）。

-p``

存储备份映像的完整文件系统URI。

-s``

要获取其历史记录的备份集的名称。与-t选项互斥。

-t

获取历史记录的表的名称。与-s选项互斥。

### 用法示例

```java
$ hbase backup history
$ hbase backup history -n 20
$ hbase backup history -t WebIndexRecords
```
