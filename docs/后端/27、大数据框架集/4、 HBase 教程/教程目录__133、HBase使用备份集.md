# 133、HBase使用备份集
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/133.html
- 分类：大数据框架
- 分组：教程目录
## 使用备份集

备份集可以通过减少表名重复输入的数量来简化HBase数据备份和还原的管理。您可以使用该hbase backup set add命令将表分组到命名备份集中。然后，您可以使用-set选项在hbase backup create或hbase backup restore中调用备份集的名称，而不是单独列出组中的每个表。您可以拥有多个备份集。

请注意hbase backup set add命令和*-set*选项之间的区别：必须先运行该hbase backup set add命令，然后才能在其他命令中使用该-set选项，因为在将备份集用作快捷方式之前，必须先命名并定义备份集。

如果运行该hbase backup set add命令并指定系统上尚不存在的备份集名称，则会创建一个新集。如果使用现有备份集名称的名称的命令，则指定的表将添加到该集合中。

在此命令中，备份集名称区分大小写。

备份集的元数据存储在HBase中。如果您无法访问具有备份集元数据的原始HBase群集，则必须指定单个表名以还原数据。

要创建备份集，请以HBase超级用户身份运行以下命令：

```java
$ hbase backup set <subcommand> <backup_set_name> <tables>
```

### 备份集子命令

以下列表详细介绍了hbase backup set命令的子命令。

在hbase backup set设置完成操作后，必须输入以下子命令中的一个（且不超过一个）。此外，备份集名称在命令行实用程序中区分大小写。

add

将表[s]添加到备份集。在此参数后面指定backup_set_name值以创建备份集。

remove

从集中删除表。在tables参数中指定要删除的表。

list

列出所有备份集。

describe

显示备份集的描述。该信息包括该集是否具有完整备份或增量备份，备份的开始和结束时间以及集合中的表列表。此子命令必须位于backup_set_name值的有效值之前。

delete

删除备份集。在命令后直接输入backup_set_na*me*选项的值hbase backup set delete。

### 位置命令行参数

backup_set_name

用于分配或调用备份集名称。备份集名称必须仅包含可打印字符，并且不能包含任何空格。

tables

要包含在备份集中的表（或单个表）的列表。输入表名作为逗号分隔列表。如果未指定表，则所有表都包含在集中。

在单独或远程群集的备份策略中维护区分大小写的备份集名称的日志或其他记录以及每个集合中的相应表。此信息可以帮助您在主群集失败的情况下进行。

### 用法示例

```java
$ hbase backup set add Q1Data TEAM3,TEAM_4
```

根据不同的环境，在此命令导致一个以下操作：

- 如果Q1Data备份集不存在，则创建包含表TEAM_3和TEAM_4的备份集。
- 如果Q1Data备份集已经存在，表TEAM_3和TEAM_4添加到Q1Data备份集。
