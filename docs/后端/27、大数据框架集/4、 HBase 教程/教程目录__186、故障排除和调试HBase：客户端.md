# 186、故障排除和调试HBase：客户端
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/186.html
- 分类：大数据框架
- 分组：教程目录
## 客户端

有关HBase客户端的更多信息，请参阅[客户端](https://www.w3cschool.cn/hbase_doc/hbase_doc-h7242pis.html)。

### ScannerTimeoutException或UnknownScannerException

如果从客户端到RegionServer的RPC调用之间的时间超过扫描超时，则抛出此异常。例如，如果Scan.setCaching设置为500，然后在ResultScanner上每调用500个.next()行，就会有一个RPC调用来获取下一批行，因为数据正以500行为一个块的形式传输到客户端。减少setCaching值可能是一个选项，但将此值设置得太低会导致对行数的处理效率低下。

请参阅[扫描缓存](https://www.w3cschool.cn/hbase_doc/hbase_doc-ewj22z2d.html)。

### Thrift和Java API的性能差异

如果Scan.setCaching太高，可能会出现性能不佳，甚至可能发生ScannerTimeoutExceptions，如上文的“ScannerTimeoutException或UnknownScannerException”中所述。如果Thrift客户端对给定工作负载使用错误的缓存设置，则与Java API相比，性能会受到影响。要在Thrift客户端中为给定扫描设置缓存，请使用该scannerGetList(scannerId, numRows)方法，其中numRows是一个表示要缓存的行数的整数。在一个案例中，我们发现在相同的查询条件下，将Thrift扫描的缓存从1000减少到100，。

### 调用Scanner.next时的LeaseException

在某些情况下，从RegionServer获取数据的客户端会获得LeaseException而不是通常的ScannerTimeoutException或UnknownScannerException。通常，例外的来源是org.apache.hadoop.hbase.regionserver.Leases.removeLease(Leases.java:230)（行号可能会有所不同）。它往往发生在缓慢/冻结的RegionServer#next调用中。可以通过hbase.rpc.timeout > hbase.regionserver.lease.period来防止它。Harsh J调查了该问题，作为邮件列表线程HBase的一部分，mail＃user – Lease不存在异常。

### Shell或客户端应用程序在正常操作期间会引发许多可怕的异常

从0、20.0开始，\org.apache.hadoop.hbase.*\的默认日志级别为DEBUG。

在您的客户端上，编辑 `$` HBASE_HOME / conf / log4j.properties，并更改log4j.logger.org.apache.hadoop.hbase=DEBUG为：log4j.logger.org.apache.hadoop.hbase=INFO，或者甚至log4j.logger.org.apache.hadoop.hbase=WARN。

### 长客户端暂停压缩

这是关于Apache HBase dist-list的一个相当常见的问题。这种情况下，客户端通常将大量数据插入到相对未优化的HBase集群中。压缩会加剧暂停，尽管它不是问题的根源。

请参阅用于预创建区域的模式上的“[表创建：预创建区域](https://www.w3cschool.cn/hbase_doc/hbase_doc-bszx2z27.html)”，并确认该表不是以单个区域开始的。

对于集群配置，请参考[HBase配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-arej2yxs.html)，特别是hbase.hstore.blockingStoreFiles，hbase.hregion.memstore.block.multiplier，MAX_FILESIZE（区域的大小），和MEMSTORE_FLUSHSIZE.

暂停原因可能发生的稍长解释如下：在MemStores上有时会阻塞Puts，这些Plusher被阻塞的刷新线程阻塞，因为压缩文件太多而无法压缩，因为压缩程序有太多小文件要压缩而且必须重复压缩相同的数据。即使是轻微的压缩，也可能发生这种情况。更糟糕的是，Apache HBase不会压缩内存中的数据。因此，存储在MemStore中的64MB可能在压缩后变为6MB文件 – 这导致更小的StoreFile。好处是更多的数据被打包到同一个区域，但是通过能够编写更大的文件来实现性能 – 这就是为什么HBase在写入新的StoreFile之前等待flushsize的原因。较小的StoreFiles成为压缩的目标。如果不进行压缩，文件就会大得多，不需要那么多的压缩，但是这是以I/O为代价的。

有关其他信息，请参阅[具有压缩的长客户端暂停上的此线程](https://sematext.com/opensee/m/HBase/YGbbNKyd41WMAkh?subj=Long+client+pauses+with+compression)。

### 安全客户端连接（[由GSS异常引起：未提供有效凭据…]）

您可能会遇到以下错误：

```java
Secure Client Connect ([Caused by GSSException: No valid credentials provided
        (Mechanism level: Request is a replay (34) V PROCESS_TGS)])
```

此问题是由MIT Kerberos replay_cache组件中的[＃1201](http://krbdev.mit.edu/rt/Ticket/Display.html?id=1201)和[＃5924](http://krbdev.mit.edu/rt/Ticket/Display.html?id=5924)错误引起的。这些错误导致旧版本的krb5-server错误地阻止从Principal发送的后续请求。这导致krb5-server阻止从一个客户端发送的连接（每个RegionServer具有多个线程连接实例的HTable实例）；客户端日志中记录了诸如Request is a replay (34)之类的消息，您可以忽略这些消息，因为默认情况下，HTable将为每个失败的连接重试5 * 10（50）次。如果重试后与RegionServer的任何连接失败，HTable将抛出IOException，以便HTable实例的用户客户端代码可以进一步处理它。注意：HTable在HBase 1.0中弃用，使用Table。

或者，将krb5-server更新为解决这些问题的版本，例如krb5-server-1.10.3。有关详细信息，请参阅[JIRA HBASE-10379](https://issues.apache.org/jira/browse/HBASE-10379)。

### ZooKeeper客户端连接错误

像这样的错误：

```java
11/07/05 11:26:41 WARN zookeeper.ClientCnxn: Session 0x0 for server null,
 unexpected error, closing socket connection and attempting reconnect
 java.net.ConnectException: Connection refused: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(Unknown Source)
        at org.apache.zookeeper.ClientCnxn$SendThread.run(ClientCnxn.java:1078)
 11/07/05 11:26:43 INFO zookeeper.ClientCnxn: Opening socket connection to
 server localhost/127.0.0.1:2181
 11/07/05 11:26:44 WARN zookeeper.ClientCnxn: Session 0x0 for server null,
 unexpected error, closing socket connection and attempting reconnect
 java.net.ConnectException: Connection refused: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(Unknown Source)
        at org.apache.zookeeper.ClientCnxn$SendThread.run(ClientCnxn.java:1078)
 11/07/05 11:26:45 INFO zookeeper.ClientCnxn: Opening socket connection to
 server localhost/127.0.0.1:2181
```

要么是由于ZooKeeper关闭，要么是由于网络问题而无法访问。

实用程序zkcli可能有助于调查ZooKeeper问题。

### 客户端耗尽内存虽然堆大小似乎是稳定的（但堆外/直接堆不断增长）

您可能会遇到在[邮件线程HBase，mail # user-疑似内存泄漏](https://sematext.com/opensee/m/HBase/YGbbDUg6jOtjY42?subj=Re:+Suspected+memory+leak)，中描述和处理的问题，邮件# user -疑似内存泄漏，并继续在[HBase，mail # dev – FeedbackRe:疑似内存泄漏](https://sematext.com/opensee/m/HBase/YGbbw11aa2gW2cS1?subj=Re:+FeedbackRe:+Suspected+memory+leak)。解决方案是为-XX:MaxDirectMemorySize向客户端JVM传递一个合理的值。默认情况下，MaxDirectMemorySize等于-Xmx最大堆大小设置(如果设置了-Xmx)。尝试将其设置为较小的值(例如，一个用户在客户端堆为12g时成功地将其设置为1g)。如果你把它设置得太小，它就会导致fullgc，所以要把它设置得大一点。只有在运行新的实验性服务器端堆外缓存时，您才希望将此设置设置为客户端，因为此特性依赖于能够使用大的直接缓冲区(您可能必须保持单独的客户端和服务器端配置dirs)。

### 安全客户端无法连接（[由GSS异常引起：未提供有效凭据（机制级别：无法找到任何Kerberos tgt）]）

导致此问题的原因可能有多种。

首先，检查您是否拥有有效的Kerberos ticket。这是需要的，为了与安全的Apache HBase集群建立通信。通过运行klist命令行实用程序，检查当前在凭证缓存中的ticket（如果有）。如果未列出ticket，则必须通过运行带有指定密钥表的kinit命令或通过交互方式输入所需主体的密码来获取ticket。

然后，请参阅“[Java安全指南疑难解答](https://docs.oracle.com/javase/1.5.0/docs/guide/security/jgss/tutorials/Troubleshooting.html)”部分。通过将javax.security.auth.useSubjectCredsOnly系统属性值设置为false，可以解决最常见的问题。

由于MIT Kerberos写入其凭证缓存的格式发生了变化，因此Oracle JDK 6 Update 26及更早版本中存在一个错误，导致Java无法读取由MIT Kerberos 1.8.1或更高版创建的Kerberos凭证缓存。如果您的环境中存在这种有问题的组件组合，要解决此问题，请先使用kinit登录，然后立即使用kinit -R刷新凭证缓存。刷新将重写凭证缓存而不会出现有问题的格式设置。

在JDK 1.4之前，JCE是一个非捆绑产品，因此，JCA和JCE通常被称为独立的，不同的组件。由于JCE现在捆绑在JDK 7.0中，因此区别越来越不明显。由于JCE使用与JCA相同的架构，因此JCE应该更恰当地被视为JCA的一部分。

由于JDK 1.5或更早版本，您可能需要安装Java Cryptography Extension或JCE。确保JCE jar在服务器和客户端系统上的类路径中。

您可能还需要下载无限强度的JCE策略文件。解压缩并解压缩下载的文件，并将策略jar安装到 /lib/security中。
