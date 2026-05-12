# 165、Apache HBase协处理器的类型
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/165.html
- 分类：大数据框架
- 分组：教程目录
## 协处理器的类型

### 观察者协处理器

在特定事件发生之前或之后触发观察者协处理器。在事件之前发生的观察者使用以pre前缀开头的方法，例如，prePut。观察者发生在以post前缀（如postPut）开头的事件覆盖方法之后。

#### 用于观察者协处理器的用例

安全

在执行Get或Put操作之前，您可以使用preGet或prePut方法检查权限。

参照完整性

HBase不直接支持refential完整性的RDBMS概念，也称为外键。您可以使用协处理器来强制执行此类完整性。例如，如果您有一个业务规则，users表中的每个插入必须后跟user_daily_attendance表中的相应条目，您可以实现协处理器以在user使用该prePut方法向user_daily_attendance插入记录。

二级索引

您可以使用协处理器来维护二级索引。

#### 观察者协处理器的类型

RegionObserver

RegionObserver协处理器允许您观察区域上的事件，例如Get 和Put操作。

RegionServerObserver

RegionServerObserver允许您观察与RegionServer操作相关的事件，例如启动，停止或执行合并，提交或回滚。

MasterObserver

MasterObserver允许您观察与HBase Master相关的事件，例如表创建，删除或架构修改。

WalObserver

WalObserver允许您观察与写入预写日志（WAL）相关的事件。

示例提供了观察者协处理器的工作示例。

### 端点协处理器

端点处理器允许您在数据位置执行计算。例如，需要计算横跨数以百计区域的整个表的运行平均值或求和。

与您的代码透明运行的观察器协处理器相比，端点协处理器必须使用Table或HTable中提供的CoprocessorService()方法显式调用。

从HBase 0.96开始，端点协处理器使用Google Protocol Buffers（protobuf）实现。以0.94版本编写的端点协处理器与0.96或更高的版本不兼容。见[HBASE-5448](https://issues.apache.org/jira/browse/HBASE-5448)）。要将HBase群集从0.94或更早版本升级到0.96或更高版本，您需要重新实现协处理器。

协处理器端点不应使用HBase内部构件，只能利用公共API；理想情况下，CPEP应仅依赖于接口和数据结构。这并不总是可行的，但要注意这样做会使端点变脆弱，随着HBase内部的发展而易于破损。注释为私有或演进的HBase内部API在删除之前不必遵守语义版本规则或关于弃用的一般Java规则。虽然生成的protobuf文件没有hbase受众注释 – 它们是由protobuf protoc工具创建的，它不知道HBase是如何工作的 – 它们应该被认为是@InterfaceAudience.Private，因此容易改变。

在接下来的“示例”一节，提供了端点协处理器的工作示例。
