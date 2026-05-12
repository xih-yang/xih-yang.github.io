# 39、HBase特殊情况
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/39.html
- 分类：大数据框架
- 分组：教程目录
## HBase特殊情况

### 对于快速失败优于等待的应用程序

- 在客户端的 hbase-site.xml 中，设置以下参数：
- 设置 hbase.client.pause = 1000
- 设置 hbase.client.retries.number = 3
- 如果你想跨越分裂和区域移动，大幅增加 hbase.client.retries.number（> = 20）
- 设置 RecoverableZookeeper 重试计数： zookeeper.recovery.retry = 1（不重试）
- 在 hbase-site.xml 服务器端，设置 Zookeeper 会话超时以检测服务器故障：zookeeper.session.timeout⇐30秒（建议 20-30）。

### 对于可以容忍略有过时的信息的应用程序

HBase 时间线一致性（HBASE-10070） 启用了只读副本后，区域（副本）的只读副本将分布在群集中。一个 RegionServer 为默认或主副本提供服务，这是唯一可以服务写入的副本。其他 Region Server 服务于辅助副本，请遵循主要 RegionServer，并仅查看提交的更新。辅助副本是只读的，但可以在主服务器故障时立即提供读取操作，从而将读取可用性的时间间隔从几秒钟减少到几毫秒。Phoenix 支持时间线一致性为 4.4.0 的提示：

- 部署 HBase 1.0.0 或更高版本。
- 在服务器端启用时间线一致性副本。
- 使用以下方法之一设置时间线一致性：
- 使用 ALTER SESSION SET CONSISTENCY = ‘TIMELINE’
- 在JDBC连接字符串中设置连接属性 Consistency 为 timeline
