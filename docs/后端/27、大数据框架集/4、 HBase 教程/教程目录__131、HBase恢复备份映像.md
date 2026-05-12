# 131、HBase恢复备份映像
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/131.html
- 分类：大数据框架
- 分组：教程目录
## 恢复备份映像

以HBase超级用户身份运行以下命令。您只能在正在运行的HBase集群上还原备份，因为必须将数据重新分发到RegionServers才能成功完成操作。

```java
hbase restore <backup_path> <backup_id>
```

### 位置命令行参数

BACKUP_PATH

该BACKUP_PATH参数指定的地方用来存储备份映像文件系统的完整URI。有效的前缀是hdfs：，webhdfs：，gpfs：和s3fs :

备份ID

唯一标识要还原的备份映像的备份ID。

### 命名命令行参数

-t

要还原的以逗号分隔的表列表。有关对表集合执行操作的详细信息，请参阅备份集。与-s选项互斥；其中一个命名选项是必需的。

-s``

根据备份集确定要备份的表。有关备份集的用途和用法，请参阅使用备份集。与-t选项互斥。

-q

（可选）允许指定应在其中执行创建备份的MapReduce作业的YARN队列的名称。此选项有助于防止备份任务从其他高重要性MapReduce作业中窃取资源。

-C

（可选）执行还原的干运行（dry-run）。会检查操作，但不执行。

-m``

（可选）要还原到的以逗号分隔的表列表。如果未提供此选项，则使用原始表名。提供此选项时，必须提供与-t选项中相同数量的条目。

-o

（可选）如果表已存在，则覆盖还原的目标表。

### 用法示例

```java
hbase backup restore /tmp/backup_incremental backupId_1467823988425 -t mytable1,mytable2
```

此命令还原增量备份映像的两个表。在此示例中: · tmp/backup_incremental 是包含备份映像的目录的路径。· backupId_1467823988425 是备份 ID。· mytable1 和 mytable2 是要还原的备份映像中的表的名称。

此命令将恢复增量备份映像的两个表。在此示例中：

- /tmp/backup_incremental是包含备份映像的目录的路径。
- backupId_1467823988425是备份ID。
- mytable1和mytable2是要还原的备份映像中的表的名称。
