# 141、HBase：在Amazon S3上保护应用程序数据集
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/141.html
- 分类：大数据框架
- 分组：教程目录
## 方案：在Amazon S3上保护应用程序数据集

此HBase方案描述了假设的零售业务如何使用备份来保护应用程序数据, 然后在失败后还原数据集。

HBase 管理团队使用备份集来存储一组表中的数据, 它们具有一个名为绿色的应用程序的相关信息。在此示例中, 一个表包含交易记录, 另一张包含客户详细信息。需要备份这两个表并作为一个组进行恢复。

管理团队还希望确保自动进行每日备份。

以下是用于备份绿色应用程序的数据并稍后恢复数据的命令的步骤和示例的概述。以HBase超级用户身份登录时，将运行所有命令。

- 创建名为green_set的备份集作为transactions表和customer表的别名。备份集可用于所有操作，以避免键入每个表名。备份集名称区分大小写，应仅使用可打印字符且和不带空格的格式生成。

```java
    $ hbase backup set add green_set transactions
    $ hbase backup set add green_set customer
```

- green_set数据的第一个备份必须是完整备份。以下命令示例显示如何将凭据传递到Amazon S3并使用s3a：前缀指定文件系统。

```java
    $ ACCESS_KEY=ABCDEFGHIJKLMNOPQRST
    $ SECRET_KEY=123456789abcdefghijklmnopqrstuvwxyzABCD
    $ sudo -u hbase hbase backup create full\
      s3a://$ACCESS_KEY:SECRET_KEY@prodhbasebackups/backups -s green_set
```

- 应根据计划运行增量备份，以确保在发生灾难时进行必要的数据恢复。在这家零售公司，HBase管理团队决定自动每日备份以充分保护数据。团队决定他们可以通过修改在/etc/crontab中定义的现有Cron作业来实现此目的。因此，IT通过添加以下行来修改Cron作业：

```java
    @daily hbase hbase backup create incremental s3a://$ACCESS_KEY:$SECRET_KEY@prodhbasebackups/backups -s green_set
```

- 失败性IT事件会禁用绿色应用程序使用的生产群集。备份群集的HBase系统管理员必须将green_set数据集还原到最接近恢复目标的时间点。

如果备份HBase群集的管理员具有可访问记录中具有相关详细信息的备份ID，则可以绕过以下使用该hdfs dfs -ls命令搜索和手动扫描备份ID列表的搜索。请考虑在环境中的生产群集外部持续维护和保护备份ID的详细日志。

管理员在存储备份的目录上运行以下命令，以在控制台上打印成功备份ID的列表：

```java
    hdfs dfs -ls -t /prodhbasebackups/backups
```

- 管理员扫描列表以查看在最接近恢复目标的日期和时间创建的备份。为此，管理员将恢复时间点的日历时间戳转换为Unix时间，因为备份ID是用Unix时间唯一标识的。备份ID按反向时间顺序列出，这意味着最先出现的最新成功备份。管理员注意到命令输出中的以下行与需要还原的green_set备份相对应：

```java
    /prodhbasebackups/backups/backup_1467823988425
```

- 管理员恢复green_set调用备份ID和-overwrite选项。-overwrite选项截断目标中的所有现有数据，并使用备份数据集中的数据填充表。如果没有此标志，备份数据将附加到目标中的现有数据。在这种情况下，管理员决定覆盖数据，因为它已损坏。

```java
    $ sudo -u hbase hbase restore -s green_set \
      s3a://$ACCESS_KEY:$SECRET_KEY@prodhbasebackups/backups backup_1467823988425 \ -overwrite
```
