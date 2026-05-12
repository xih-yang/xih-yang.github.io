# 19、FlinkSQL - HDFS_DELEGATION_TOKEN过期的问题解决汇总
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/19.html
- 分类：大数据框架
- 分组：教程目录
## 问题类别

- Spark框架自身的问题
- Hadoop全家桶的问题
- 开发者使用的库的问题

## 排查

**1、** 已知Hadoop-common-2.6.0的UGI存在bug，代码为[HADOOP-10786](https://issues.apache.org/jira/browse/HADOOP-10786)，该问题在CDH发行版中已经修复，但Apache版本在2.6.1之前存在问题；

**2、** 已知HDFS也存在一个HDFS_DELEGATION_TOKEN过期的bug，代码为[HDFS-9276](https://issues.apache.org/jira/browse/HDFS-9276)，问题在CDH发行版中已经修复，但Apache在2.7.1之前的版本存在问题；

**3、** 已知Spark还存在一个HDFS_DELEGATION_TOKEN过期的bug，代码为[SPARK-23361](https://issues.apache.org/jira/browse/SPARK-23361)，该问题会导致Driver重启后，如果超过7天，就会挂掉一次SPARK2.4.0之前存在该问题；

*以上CDH发行版特指 2.6.0-CDH5.12.1，相对的Apache发行版版本为2.6.0*

## 方法

- *首先，确保用的Apache库没有问题，才能安全地长期运行Spark，Flink等 long-running applications，其次再排查手动使用Hadoop HDFS库的方式，才能访问HDFS，Hbase, Hive等，才能确保程序不会挂掉*
- *确保使用 Hadoop-common-2.6.0-CDH5.12.1以及其他Hadoop有关的包，**保证**框架层面不会有问题*
- *要么升级版本到没有BUG的hadoop库的版本，才能继续使用Apache全家桶*

## 提示

- 用户打包的应用程序内可能会有 hadoop-xxxx.jar，SPARK_HOME/jars/内也可能有 hadoop-xxxx.jar，或者shade导致的内嵌字节码文件。
- 常见的 --conf spark.hadoop.fs.hdfs.impl.disable.cache=true 这个选项，只能回避HDFS-9276的BUG。

## 案例

```java
org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.security.token.SecretManager$InvalidToken): token (token for research: HDFS_DELEGATION_TOKEN owner=research@RTC.SLANKKA.COM, renewer=yarn, realUser=, issueDate=1690268368213, maxDate=1690873168213, sequenceNumber=211804054, masterKeyId=2078) is expired, current time: 2023-08-01 15:00:20,416+0800 expected renewal time: 2023-08-01 14:59:28,213+0800
	at org.apache.hadoop.ipc.Client.call(Client.java:1504)
	at org.apache.hadoop.ipc.Client.call(Client.java:1441)
	at org.apache.hadoop.ipc.ProtobufRpcEngine$Invoker.invoke(ProtobufRpcEngine.java:230)
	at com.sun.proxy.$Proxy10.getFileInfo(Unknown Source)
	at org.apache.hadoop.hdfs.protocolPB.ClientNamenodeProtocolTranslatorPB.getFileInfo(ClientNamenodeProtocolTranslatorPB.java:771)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.apache.hadoop.io.retry.RetryInvocationHandler.invokeMethod(RetryInvocationHandler.java:260)
	at org.apache.hadoop.io.retry.RetryInvocationHandler.invoke(RetryInvocationHandler.java:104)
	at com.sun.proxy.$Proxy11.getFileInfo(Unknown Source)
	at org.apache.hadoop.hdfs.DFSClient.getFileInfo(DFSClient.java:2126)
	at org.apache.hadoop.hdfs.DistributedFileSystem$20.doCall(DistributedFileSystem.java:1262)
	at org.apache.hadoop.hdfs.DistributedFileSystem$20.doCall(DistributedFileSystem.java:1258)
	at org.apache.hadoop.fs.FileSystemLinkResolver.resolve(FileSystemLinkResolver.java:81)
	at org.apache.hadoop.hdfs.DistributedFileSystem.getFileStatus(DistributedFileSystem.java:1258)
	at org.apache.hadoop.fs.FilterFileSystem.getFileStatus(FilterFileSystem.java:425)
	at org.apache.hadoop.fs.viewfs.ChRootedFileSystem.getFileStatus(ChRootedFileSystem.java:226)
	at org.apache.hadoop.fs.viewfs.ViewFileSystem.getFileStatus(ViewFileSystem.java:379)
```
