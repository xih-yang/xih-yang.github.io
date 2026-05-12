# 93、HBase：WAL拆分
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/93.html
- 分类：大数据框架
- 分组：教程目录
## WAL拆分

RegionServer服务于许多区域。区域服务器中的所有区域共享相同活动的WAL文件。WAL文件中的每个编辑都包含有关它属于哪个区域的信息。当打开区域时，需要重播属于该区域的WAL文件中的编辑。因此，WAL文件中的编辑必须按区域分组，以便可以重播特定的集合以重新生成特定区域中的数据。按区域对WAL编辑进行分组的过程称为日志拆分。如果区域服务器出现故障，它是恢复数据的关键过程。

在群集启动时由HMaster完成日志拆分，或者在区域服务器关闭时由ServerShutdownHandler完成日志拆分。为保证一致性，受影响的区域在数据恢复之前不可用。所有WAL编辑都需要在给定区域再次可用之前恢复并重播。因此，受到日志拆分影响的区域在该过程完成之前不可用。

过程：日志分割，分步执行

新目录按以下模式命名:

**1、** /hbase/WALs/,,目录被重新命名重命名该目录非常重要，因为即使HMaster认为它已关闭，RegionServer仍可能启动并接受请求如果RegionServer没有立即响应，也没有检测到它的ZooKeeper会话，HMaster可能会将其解释为RegionServer失败重命名日志目录可确保现有的有效WAL文件仍然由活动但繁忙的RegionServer使用，而不会意外写入新目录根据以下模式命名：

```java
    /hbase/WALs/<host>,<port>,<startcode>-splitting       
```

```java
这种重命名的目录的例子可能如下所示：
```

```java
    /hbase/WALs/srv.example.com,60020,1254173957298-splitting
```

**2、** 每个日志文件都被拆分，每次一个日志拆分器一次读取一个编辑项的日志文件，并将每个编辑条目放入对应于编辑区域的缓冲区中同时，拆分器启动多个编写器线程编写器线程选取相应的缓冲区，并将缓冲区中的编辑项写入临时恢复的编辑文件临时编辑文件使用以下命名模式存储到磁盘：

```java
    /hbase/<table_name>/<region_id>/recovered.edits/.temp
```

```java
该文件用于存储此区域的WAL日志中的所有编辑。日志拆分完成后，.temp文件将被重命名为写入文件的第一个日志的序列ID。要确定是否所有编辑都已写入，将序列ID与写入HFile的上次编辑的序列进行比较。如果最后编辑的序列大于或等于文件名中包含的序列ID，则很明显，编辑文件中的所有写入操作都已完成。
```

**3、** 日志拆分完成后，每个受影响的区域将分配给RegionServer打开该区域时，会检查recoverededed文件夹以找到恢复的编辑文件如果存在任何这样的文件，则通过读取编辑并将其保存到MemStore来重播它们在重放所有编辑文件后，MemStore的内容被写入磁盘（HFile），编辑文件被删除；

### 处理日志分割期间的错误

如果您将该hbase.hlog.split.skip.errors选项设置为true，则错误处理如下：

- 拆分过程中遇到的任何错误都将被记录。
- 有问题的WAL日志将被移到hbase rootdir下的.corrupt目录中，
- WAL的处理将继续进行

如果该hbase.hlog.split.skip.errors选项设置为false默认值，则将传播该异常，并将该拆分记录为失败。

#### 拆分崩溃的RegionServer的WAL时如何处理EOFException

如果在拆分日志时发生EOFException，即使hbase.hlog.split.skip.errors设置为false，拆分也会继续。在读取要拆分的文件集合中的最后一个日志时，可能会出现EOFException，因为RegionServer可能在崩溃时写入记录的过程中。

##### 在日志分割期间的性能改进

WAL日志拆分和恢复可能需要大量资源并需要很长时间，具体取决于崩溃中涉及的RegionServer的数量和区域的大小。启用或禁用分布式日志分割是为了提高日志分割期间的性能。

启用或禁用分布式日志拆分

分布式日志处理自HBase 0.92开始默认启用。该设置由hbase.master.distributed.log.splitting属性控制，可以设置为true或false，但默认为true。

分布式日志拆分，分步执行

配置分布式日志拆分后，HMaster控制进程。HMaster在日志拆分过程中注册每个RegionServer，实际拆分日志的工作由RegionServers完成。分布式日志拆分中逐步描述的日志拆分的一般过程在这里仍然适用。

**1、** 如果启用分布式日志处理，则HMaster会在集群启动时创建拆分日志管理器实例；

```java
 *  拆分日志管理器管理所有需要扫描和拆分的日志文件。
 *  拆分日志管理器将所有日志作为任务放入ZooKeeper splitWAL节点（ hbase/splitWAL）中。
 *  您可以通过发出以下zkCli命令来查看splitWAL的内容。显示示例输出。
```

```java
        ls /hbase/splitWAL
        [hdfs%3A%2F%2Fhost2.sample.com%3A56020%2Fhbase%2FWALs%2Fhost8.sample.com%2C57020%2C1340474893275-splitting%2Fhost8.sample.com%253A57020.1340474893900,
        hdfs%3A%2F%2Fhost2.sample.com%3A56020%2Fhbase%2FWALs%2Fhost3.sample.com%2C57020%2C1340474893299-splitting%2Fhost3.sample.com%253A57020.1340474893931, 
        hdfs%3A%2F%2Fhost2.sample.com%3A56020%2Fhbase%2FWALs%2Fhost4.sample.com%2C57020%2C1340474893287-splitting%2Fhost4.sample.com%253A57020.1340474893946]
```

```java
    输出包含一些非ASCII字符。解码后，它看起来更简单：
```

```java
        [hdfs://host2.sample.com:56020/hbase/WALs
        /host8.sample.com,57020,1340474893275-splitting
        /host8.sample.com%3A57020.1340474893900,
        hdfs://host2.sample.com:56020/hbase/WALs
        /host3.sample.com,57020,1340474893299-splitting
        /host3.sample.com%3A57020.1340474893931,
        hdfs://host2.sample.com:56020/hbase/WALs
        /host4.sample.com,57020,1340474893287-splitting 
        /host4.sample.com%3A57020.1340474893946]
```

```java
    该列表表示要扫描和拆分的WAL文件名，这是日志拆分任务的列表。
```

**2、** 拆分日志管理器监视日志拆分任务和工作人员拆分日志管理器负责以下正在进行的任务：

```java
 *  一旦拆分日志管理器将所有任务发布到splitWAL znode，它就会监视这些任务节点并等待它们被处理。
 *  检查是否有任何排队等待的分组日志工人。如果发现没有响应的工作人员所要求的任务，它将重新提交这些任务。如果由于某些ZooKeeper异常而导致重新提交失败，则无法使用的工作者将再次排队等待重试。
 *  检查是否有未分配的任务。如果找到，它会创建一个短暂的重新扫描节点，以便通知每个拆分的日志工作者通过nodeChildrenChangedZooKeeper事件重新扫描未分配的任务。
 *  检查已分配但过期的任务。如果发现任何东西，它们会再次返回到TASK\_UNASSIGNED状态，以便它们可以重试。这些任务可能被分配给缓慢的工作人员，或者他们可能已经完成。这不是问题，因为日志拆分任务具有幂等性。换句话说，相同的日志拆分任务可以被处理多次而不会引起任何问题。
 *  拆分日志管理器不断监视HBase拆分日志节点。如果任何拆分日志任务节点数据发生更改，拆分日志管理器将检索节点数据。节点数据包含任务的当前状态。您可以使用该zkCli get命令来检索任务的当前状态。在下面的示例输出中，输出的第一行显示任务当前未分配。
```

```java
        get /hbase/splitWAL/hdfs%3A%2F%2Fhost2.sample.com%3A56020%2Fhbase%2FWALs%2Fhost6.sample.com%2C57020%2C1340474893287-splitting%2Fhost6.sample.com%253A57020.1340474893945
        unassigned host2.sample.com:57000
        cZxid = 0×7115
        ctime = Sat Jun 23 11:13:40 PDT 2012 
        ...
```

```java
    根据数据更改的任务的状态，拆分日志管理器将执行以下操作之一：
     *  如果任务未分配，请重新提交；
     *  如果任务被分配，则Heartbeat；
     *  如果任务失败，请重新提交或失败；
     *  如果任务完成时出现错误，请重新提交或失败；
     *  如果任务由于错误而无法完成，则请重新提交或失败；
     *  如果任务成功完成或失败，请将其删除。
> 任务失败的原因：该任务已被删除；该节点不再存在；日志状态管理器无法将任务的状态移至TASK\_UNASSIGNED；重新提交的次数超过了重新提交阈值。
```

**3、** 每个RegionServer的拆分日志工作器执行日志拆分任务；

每个RegionServer运行一个称为拆分日志工作器的守护进程线程，它负责拆分日志。守护程序线程在RegionServer启动时启动，并注册自己以观察HBase znode。如果任何splitWAL znode子项发生更改，它会通知睡眠工作器线程唤醒并获取更多任务。如果工作人员当前任务的节点数据发生更改，则工作人员将检查该任务是否已由其他工作人员执行。如果是这样，工作线程会停止当前任务的工作。工作人员不断监视splitWAL znode。出现新任务时，拆分日志工作人员将检索任务路径并检查每个任务路径，直到找到未声明的任务，并尝试声明该任务。如果声明成功，它将尝试执行该任务并state根据拆分结果更新任务的属性。此时，拆分日志工作者会扫描另一个无人认领的任务。拆分日志工作者如何接近任务

```java
 *  它查询任务状态，只在任务处于TASK\_UNASSIGNED状态时采取行动。
 *  如果任务处于TASK\_UNASSIGNED状态，则工作人员尝试TASK\_OWNED自行设置状态。如果它没有设置状态，另一名工人将尝试抓住它。如果任务保持未分配，拆分日志管理器还会要求所有工作人员稍后重新扫描。
 *  如果工作人员成功地完成任务，它会尝试再次获取任务状态，以确保它真正异步获取它。同时，它启动一个拆分任务执行器来完成实际工作：
     *  获取HBase根文件夹，在根目录下创建一个临时文件夹，并将日志文件拆分为临时文件夹。
     *  如果拆分成功，任务执行程序将任务设置为状态TASK\_DONE。
     *  如果工作人员捕获到意外的IOException，则该任务将设置为状态TASK\_ERR。
     *  如果工作人员正在关闭，请将任务设置为状态TASK\_RESIGNED。
     *  如果任务是由另一名工作人员完成的，则只需登录即可。
```

**4、** 拆分日志管理器监视未完成的任务拆分日志管理器在所有任务成功完成时返回如果所有任务都完成并出现一些故障，则拆分日志管理器将引发异常，以便日志拆分可以重试由于异步实现，在极少数情况下，拆分日志管理器会丢失一些已完成任务的跟踪因此，它定期检查其任务图或ZooKeeper中剩余的未完成任务如果没有找到，它会抛出一个异常，以便日志拆分可以马上重试，而不是挂在那里等待不会发生的事情；
