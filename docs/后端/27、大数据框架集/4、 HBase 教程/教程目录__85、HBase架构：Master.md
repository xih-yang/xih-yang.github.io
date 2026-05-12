# 85、HBase架构：Master
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/85.html
- 分类：大数据框架
- 分组：教程目录
## Master

HMaster是主服务器（Master Server）的实现。主服务器负责监视群集中的所有RegionServer实例，并且是所有元数据更改的接口。在分布式集群中，Master通常在NameNode上运行。

### 启动行为

如果在多主机（multi-Master）环境中运行，所有Master竞争运行集群。如果活动Master在ZooKeeper中失去租约（或Master关闭），则剩下的Master将争相接管角色。

### 运行时影响

当Master发生故障时，一个常见的dist-list问题涉及一个HBase集群会发生什么。由于HBase客户端直接与RegionServer对话，因此群集仍可以“稳定状态”运行。此外，每个目录表（Catalog Tables），hbase:meta作为HBase的表存在，而不是在Master中不存在。但是，Master控制关键功能，如RegionServer故障切换和完成区域分割。因此，虽然群集仍可以在没有Master的情况下运行很短的时间，但应尽快重新启动Master形状。

### 接口

HMasterInterface公开的方法主要是面向元数据（metadata-oriented）的方法：

- 表（createTable，modifyTable，removeTable，enable，disable）
- ColumnFamily（addColumn，modifyColumn，removeColumn）
- 区域（move，assign，unassign），例如，调用该Admin方法disableTable时，它由Master服务器提供服务。

### 流程

Master运行几个后台线程：

#### 负载平衡器

周期性地，当没有转换区域时，负载均衡器将运行并移动区域以平衡群集的负载。

有关区域分配的更多信息，将在后续的章节中介绍。

#### CatalogJanitor

定期检查并清理hbase:meta表格。
