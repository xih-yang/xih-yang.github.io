# 190、故障排除和调试HBase：RegionServer
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/190.html
- 分类：大数据框架
- 分组：教程目录
## RegionServer

有关RegionServers的更多信息，请参阅[RegionServer](https://www.w3cschool.cn/hbase_doc/hbase_doc-sjp62q2h.html)。

### 启动错误

#### Master启动了，但RegionServers没有

Master认为RegionServers的IP为127.0.0.1 – 这是localhost的，并解析为master自己的localhost。

RegionServers错误地通知Master，他们的IP地址是127.0.0.1。

修改区域服务器上的/etc/hosts，可以从：

```java
# Do not remove the following line, or various programs
# that require network functionality will fail.
127.0.0.1               fully.qualified.regionservername regionservername  localhost.localdomain localhost
::1             localhost6.localdomain6 localhost6
```

到（从localhost中删除主节点的名称）：

```java
# Do not remove the following line, or various programs
# that require network functionality will fail.
127.0.0.1               localhost.localdomain localhost
::1             localhost6.localdomain6 localhost6
```

#### 压缩链接错误

由于需要在每个群集上安装和配置LZO等压缩算法，因此这是启动错误的常见原因。如果你看到这样的消息：

```java
11/02/20 01:32:15 ERROR lzo.GPLNativeCodeLoader: Could not load native gpl library
java.lang.UnsatisfiedLinkError: no gplcompression in java.library.path
        at java.lang.ClassLoader.loadLibrary(ClassLoader.java:1734)
        at java.lang.Runtime.loadLibrary0(Runtime.java:823)
        at java.lang.System.loadLibrary(System.java:1028)
```

然后压缩库存在路径问题。请参阅链接上的“配置”部分：[LZO压缩配置]。

#### 由于缺少文件系统的hsync而发生RegionServer中止

为了向集群写入提供数据持久性，HBase依赖于在写入日志中持久保存状态的能力。当使用支持检查所需调用的可用性的Apache Hadoop Common文件系统API版本时，如果发现无法安全运行，HBase将主动中止群集。

对于RegionServer角色，失败将显示在以下日志中：

```java
2018-04-05 11:36:22,785 ERROR [regionserver/192.168.1.123:16020] wal.AsyncFSWALProvider: The RegionServer async write ahead log provider relies on the ability to call hflush and hsync for proper operation during component failures, but the current FileSystem does not support doing so. Please check the config value of 'hbase.wal.dir' and ensure it points to a FileSystem mount that has suitable capabilities for output streams.
2018-04-05 11:36:22,799 ERROR [regionserver/192.168.1.123:16020] regionserver.HRegionServer: ***** ABORTING region server 192.168.1.123,16020,1522946074234: Unhandled: cannot get log writer *****
java.io.IOException: cannot get log writer
        at org.apache.hadoop.hbase.wal.AsyncFSWALProvider.createAsyncWriter(AsyncFSWALProvider.java:112)
        at org.apache.hadoop.hbase.regionserver.wal.AsyncFSWAL.createWriterInstance(AsyncFSWAL.java:612)
        at org.apache.hadoop.hbase.regionserver.wal.AsyncFSWAL.createWriterInstance(AsyncFSWAL.java:124)
        at org.apache.hadoop.hbase.regionserver.wal.AbstractFSWAL.rollWriter(AbstractFSWAL.java:759)
        at org.apache.hadoop.hbase.regionserver.wal.AbstractFSWAL.rollWriter(AbstractFSWAL.java:489)
        at org.apache.hadoop.hbase.regionserver.wal.AsyncFSWAL.<init>(AsyncFSWAL.java:251)
        at org.apache.hadoop.hbase.wal.AsyncFSWALProvider.createWAL(AsyncFSWALProvider.java:69)
        at org.apache.hadoop.hbase.wal.AsyncFSWALProvider.createWAL(AsyncFSWALProvider.java:44)
        at org.apache.hadoop.hbase.wal.AbstractFSWALProvider.getWAL(AbstractFSWALProvider.java:138)
        at org.apache.hadoop.hbase.wal.AbstractFSWALProvider.getWAL(AbstractFSWALProvider.java:57)
        at org.apache.hadoop.hbase.wal.WALFactory.getWAL(WALFactory.java:252)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.getWAL(HRegionServer.java:2105)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.buildServerLoad(HRegionServer.java:1326)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.tryRegionServerReport(HRegionServer.java:1191)
        at org.apache.hadoop.hbase.regionserver.HRegionServer.run(HRegionServer.java:1007)
        at java.lang.Thread.run(Thread.java:745)
Caused by: org.apache.hadoop.hbase.util.CommonFSUtils$StreamLacksCapabilityException: hflush and hsync
        at org.apache.hadoop.hbase.io.asyncfs.AsyncFSOutputHelper.createOutput(AsyncFSOutputHelper.java:69)
        at org.apache.hadoop.hbase.regionserver.wal.AsyncProtobufLogWriter.initOutput(AsyncProtobufLogWriter.java:168)
        at org.apache.hadoop.hbase.regionserver.wal.AbstractProtobufLogWriter.init(AbstractProtobufLogWriter.java:167)
        at org.apache.hadoop.hbase.wal.AsyncFSWALProvider.createAsyncWriter(AsyncFSWALProvider.java:99)
        ... 15 more
```

如果您尝试在独立模式下运行并看到此错误，请返回[快速入门 – 独立HBase][_ _HBase]部分，并确保已包含所有给定的配置设置。

#### RegionServer因无法初始化对HDFS的访问而中止

我们将尝试使用AsyncFSWAL用于HBase-2.x，因为它具有更好的性能，同时消耗更少的资源。但AsyncFSWAL的问题在于它侵入了DFSClient实现的内部，因此在升级hadoop时很容易被破解，即使是简单的补丁发布也是如此。

如果不指定WAL供应商，我们将尝试回落到旧FSHLog，如果我们无法完成初始化AsyncFSWAL，但它可能并不总是工作。失败将显示在这样的日志中：

```java
18/07/02 18:51:06 WARN concurrent.DefaultPromise: An exception was
thrown by org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputHelper$13.operationComplete()
java.lang.Error: Couldn't properly initialize access to HDFS
internals. Please update your WAL Provider to not make use of the
'asyncfs' provider. See HBASE-16110 for more information.
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputSaslHelper.<clinit>(FanOutOneBlockAsyncDFSOutputSaslHelper.java:268)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputHelper.initialize(FanOutOneBlockAsyncDFSOutputHelper.java:661)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputHelper.access$300(FanOutOneBlockAsyncDFSOutputHelper.java:118)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputHelper$13.operationComplete(FanOutOneBlockAsyncDFSOutputHelper.java:720)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputHelper$13.operationComplete(FanOutOneBlockAsyncDFSOutputHelper.java:715)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultPromise.notifyListener0(DefaultPromise.java:507)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultPromise.notifyListeners0(DefaultPromise.java:500)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultPromise.notifyListenersNow(DefaultPromise.java:479)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultPromise.notifyListeners(DefaultPromise.java:420)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultPromise.trySuccess(DefaultPromise.java:104)
     at org.apache.hbase.thirdparty.io.netty.channel.DefaultChannelPromise.trySuccess(DefaultChannelPromise.java:82)
     at org.apache.hbase.thirdparty.io.netty.channel.epoll.AbstractEpollChannel$AbstractEpollUnsafe.fulfillConnectPromise(AbstractEpollChannel.java:638)
     at org.apache.hbase.thirdparty.io.netty.channel.epoll.AbstractEpollChannel$AbstractEpollUnsafe.finishConnect(AbstractEpollChannel.java:676)
     at org.apache.hbase.thirdparty.io.netty.channel.epoll.AbstractEpollChannel$AbstractEpollUnsafe.epollOutReady(AbstractEpollChannel.java:552)
     at org.apache.hbase.thirdparty.io.netty.channel.epoll.EpollEventLoop.processReady(EpollEventLoop.java:394)
     at org.apache.hbase.thirdparty.io.netty.channel.epoll.EpollEventLoop.run(EpollEventLoop.java:304)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:858)
     at org.apache.hbase.thirdparty.io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:138)
     at java.lang.Thread.run(Thread.java:748)
 Caused by: java.lang.NoSuchMethodException:
org.apache.hadoop.hdfs.DFSClient.decryptEncryptedDataEncryptionKey(org.apache.hadoop.fs.FileEncryptionInfo)
     at java.lang.Class.getDeclaredMethod(Class.java:2130)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputSaslHelper.createTransparentCryptoHelper(FanOutOneBlockAsyncDFSOutputSaslHelper.java:232)
     at org.apache.hadoop.hbase.io.asyncfs.FanOutOneBlockAsyncDFSOutputSaslHelper.<clinit>(FanOutOneBlockAsyncDFSOutputSaslHelper.java:262)
     ... 18 more
```

如果您遇到此错误，请在配置文件中明确指定FSHLog，例如，*filesystem*。

```java
<property>
  <name>hbase.wal.provider</name>
  <value>filesystem</value>
</property>
```

### 运行时错误

#### RegionServer挂起

你是否运行旧的JVM（<1.6.0_u21？）？当你看一个线程转储时，看起来线程是否被阻塞，但没有人持有所有被阻塞的锁？请参阅[HBaseServer中的HBASE 3622死锁（JVM错误？）](https://issues.apache.org/jira/browse/HBASE-3622)。在conf / hbase-env.sh中添加-XX:+UseMembar到HBase的HBASE_OPTS中可以修复它。

#### java.io.IOException …（打开的文件太多）

如果您看到这样的日志消息：

```java
2010-09-13 01:24:17,336 WARN org.apache.hadoop.hdfs.server.datanode.DataNode:
Disk-related IOException in BlockReceiver constructor. Cause is java.io.IOException: Too many open files
        at java.io.UnixFileSystem.createFileExclusively(Native Method)
        at java.io.File.createNewFile(File.java:883)
```

#### xceiverCount 258超过并发xcievers 256的限制

这通常显示在DataNode日志中。

#### 系统不稳定，并出现“java.lang.OutOfMemoryError: unable to createnew native thread in exceptions” HDFS DataNode日志或任何系统守护程序的日志

请参阅有关ulimit和nproc配置的“入门”部分。最新Linux发行版的默认值为1024 – 这对于HBase来说太低了。

#### DFS不稳定或RegionServer租约超时

如果你看到这样的警告信息：

```java
2009-02-24 10:01:33,516 WARN org.apache.hadoop.hbase.util.Sleeper: We slept xxx ms, ten times longer than scheduled: 10000
2009-02-24 10:01:33,516 WARN org.apache.hadoop.hbase.util.Sleeper: We slept xxx ms, ten times longer than scheduled: 15000
2009-02-24 10:01:36,472 WARN org.apache.hadoop.hbase.regionserver.HRegionServer: unable to report to master for xxx milliseconds - retrying
```

或者看到完整的GC压缩，那么您可能正在体验完整的GC。

#### “No live nodes contain current block”或YouAreDeadException

这些错误可能在用完OS文件句柄时或在节点无法访问的严重网络问题期间发生。

请参阅有关ulimit和nproc配置的“入门”部分，并检查您的网络。

#### ZooKeeper SessionExpired事件

Master或RegionServers关闭日志中的消息：

```java
WARN org.apache.zookeeper.ClientCnxn: Exception
closing session 0x278bd16a96000f to sun.nio.ch.SelectionKeyImpl@355811ec
java.io.IOException: TIMED OUT
       at org.apache.zookeeper.ClientCnxn$SendThread.run(ClientCnxn.java:906)
WARN org.apache.hadoop.hbase.util.Sleeper: We slept 79410ms, ten times longer than scheduled: 5000
INFO org.apache.zookeeper.ClientCnxn: Attempting connection to server hostname/IP:PORT
INFO org.apache.zookeeper.ClientCnxn: Priming connection to java.nio.channels.SocketChannel[connected local=/IP:PORT remote=hostname/IP:PORT]
INFO org.apache.zookeeper.ClientCnxn: Server connection successful
WARN org.apache.zookeeper.ClientCnxn: Exception closing session 0x278bd16a96000d to sun.nio.ch.SelectionKeyImpl@3544d65e
java.io.IOException: Session Expired
       at org.apache.zookeeper.ClientCnxn$SendThread.readConnectResult(ClientCnxn.java:589)
       at org.apache.zookeeper.ClientCnxn$SendThread.doIO(ClientCnxn.java:709)
       at org.apache.zookeeper.ClientCnxn$SendThread.run(ClientCnxn.java:945)
ERROR org.apache.hadoop.hbase.regionserver.HRegionServer: ZooKeeper session expired
```

JVM正在进行长时间运行的垃圾收集，这会暂停每个线程（也就是“stop the world”）。由于RegionServer的本地ZooKeeper客户端无法发送heartbeat，因此会话超时。根据设计，我们会在超时后关闭任何无法联系ZooKeeper集合的节点，以便它停止提供可能已在其他地方分配的数据。

- 确保你提供足够的RAM（在hbase-env.sh中），默认的1GB将无法维持长时间运行的导入。
- 确保不交换，JVM在交换时从不表现良好。
- 确保您没有CPU占用了RegionServer线程。例如，如果在具有4个内核的计算机上使用6个CPU密集型任务运行MapReduce作业，则可能会使RegionServer匮乏，从而导致更长时间的垃圾收集暂停。
- 增加ZooKeeper会话超时

如果您希望增加会话超时，请将以下内容添加到hbase-site.xml，以将超时从默认值60秒增加到120秒。

```java
<property>
  <name>zookeeper.session.timeout</name>
  <value>120000</value>
</property>
<property>
  <name>hbase.zookeeper.property.tickTime</name>
  <value>6000</value>
</property>
```

请注意，设置较高的超时意味着由失败的RegionServer服务的区域将至少花费这段时间传输到另一个RegionServer。对于提供实时请求的生产系统，我们建议将其设置为低于1分钟并过度配置群集，以便每台计算机上的内存负载越低（因此每台计算机收集的垃圾越少）。

如果在只发生一次的上传过程中发生这种情况（比如最初将所有数据加载到HBase中），请考虑批量加载。

有关ZooKeeper故障排除的其他一般信息，请参阅ZooKeeper，Cluster Canary，这将在之后的章节中进行介绍。

#### NotServingRegionException

在DEBUG级别的RegionServer日志中找到此异常是“normal”。此异常将返回给客户端，然后客户端返回hbase:meta以查找已移动区域的新位置。

但是，如果NotServingRegionException被记录为ERROR，则客户端用完了重试，可能出现了错误。

#### 日志充斥着’2011-01-10 12：40：48,407 INFO org.apache.hadoop.io.compress.CodecPool：Gotbrand-new compressor’消息

我们没有使用压缩库的本机版本。请参阅[释放hadoop 0.21时HBASE-1900恢复本机支持](https://issues.apache.org/jira/browse/HBASE-1900)。从HBase lib dir下的hadoop复制本机libs，或者将它们链接到适当的位置，消息就会消失。

#### 60020上的服务器处理程序X捕获：java.nio.channels.ClosedChannelException

如果您看到此类消息，则表示区域服务器正在尝试向客户端读取/发送数据，但它已经消失。造成这种情况的典型原因是客户端被杀死（当MapReduce作业被终止或失败时，您会看到类似这样的消息）或者客户端收到SocketTimeoutException。这是无害的，但如果你没有做一些事情来触发它们，你应该考虑更多。
