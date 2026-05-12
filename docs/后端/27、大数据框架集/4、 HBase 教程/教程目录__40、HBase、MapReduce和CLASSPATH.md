# 40、HBase、MapReduce和CLASSPATH
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/40.html
- 分类：大数据框架
- 分组：教程目录
## HBase，MapReduce和CLASSPATH

默认情况下，部署到 MapReduce 集群的 MapReduce 作业无权访问 `$` HBASE_CONF_DIR 类或 HBase 类下的 HBase 配置。

要为MapReduce 作业提供他们需要的访问权限，可以添加 hbase-site.xml_to _ `$` HADOOP_HOME / conf，并将 HBase jar 添加到 `$` HADOOP_HOME / lib 目录。然后，您需要在群集中复制这些更改。或者你可以编辑 `$` HADOOP_HOME / conf / hadoop-env.sh，并将 hbase 依赖添加到HADOOP_CLASSPATH 变量中。这两种方法都不推荐使用，因为它会使用 HBase 引用污染您的 Hadoop 安装。它还需要您在 Hadoop 可以使用 HBase 数据之前重新启动 Hadoop 集群。

推荐的方法是让 HBase 添加它的依赖 jar 并使用 HADOOP_CLASSPATHor -libjars。

自HBase 0.90.x 以来，HBase 将其依赖 JAR 添加到作业配置本身。依赖关系只需要在本地 CLASSPATH 可用，从这里它们将被拾取并捆绑到部署到MapReduce 集群的 fat 工作 jar 中。一个基本的技巧就是将完整的 hbase 类路径（所有 hbase 和依赖 jar 以及配置）传递给 mapreduce 作业运行器，让hbase 实用程序从完整类路径中选取需要将其添加到 MapReduce 作业配置中的源代码。

下面的示例针对名为 usertable 的表运行捆绑的 HBase RowCounter MapReduce 作业。它设置为 HADOOP_CLASSPATH 需要在 MapReduce 上下文中运行的 jar 包（包括配置文件，如 hbase-site.xml）。确保为您的系统使用正确版本的 HBase JAR；请在下面的命令行中替换 VERSION 字符串 w/本地 hbase 安装的版本。反引号（\符号）使 shell 执行子命令，设置输入 hbase classpath 为 HADOOP_CLASSPATH。这个例子假设你使用 BASH 兼容的 shell。

```java
$ HADOOP_CLASSPATH=${HBASE_HOME}/bin/hbase classpath \
  ${HADOOP_HOME}/bin/hadoop jar ${HBASE_HOME}/lib/hbase-mapreduce-VERSION.jar \
  org.apache.hadoop.hbase.mapreduce.RowCounter usertable
```

上述的命令将针对 hadoop 配置指向的群集上的本地配置指向的 hbase 群集启动行计数 mapreduce 作业。

hbase-mapreduce.jar 的主要内容是一个 Driver（驱动程序），它列出了几个与 hbase 一起使用的基本 mapreduce 任务。例如，假设您的安装是hbase 2.0.0-SNAPSHOT：

```java
$ HADOOP_CLASSPATH=${HBASE_HOME}/bin/hbase classpath \
  ${HADOOP_HOME}/bin/hadoop jar ${HBASE_HOME}/lib/hbase-mapreduce-2.0.0-SNAPSHOT.jar
An example program must be given as the first argument.
Valid program names are:
  CellCounter: Count cells in HBase table.
  WALPlayer: Replay WAL files.
  completebulkload: Complete a bulk data load.
  copytable: Export a table from local cluster to peer cluster.
  export: Write table data to HDFS.
  exportsnapshot: Export the specific snapshot to a given FileSystem.
  import: Import data written by Export.
  importtsv: Import data in TSV format.
  rowcounter: Count rows in HBase table.
  verifyrep: Compare the data from tables in two different clusters. WARNING: It doesn't work for incrementColumnValues'd cells since the timestamp is changed after being appended to the log.
```

您可以使用上面列出的缩短名称作为 mapreduce 作业，如下面的行计数器作业重新运行（再次假设您的安装为 hbase 2.0.0-SNAPSHOT）：

```java
$ HADOOP_CLASSPATH=${HBASE_HOME}/bin/hbase classpath \
  ${HADOOP_HOME}/bin/hadoop jar ${HBASE_HOME}/lib/hbase-mapreduce-2.0.0-SNAPSHOT.jar \
  rowcounter usertable
```

您可能会发现更多有选择性的 hbase mapredcp 工具输出；它列出了针对 hbase 安装运行基本 mapreduce 作业所需的最小 jar 集。它不包括配置。如果您希望MapReduce 作业找到目标群集，则可能需要添加这些文件。一旦你开始做任何实质的事情，你可能还必须添加指向额外的 jar 的指针。只需在运行 hbase mapredcp 时通过系统属性 Dtmpjars 来指定附加项。

对于不打包它们的依赖关系或调用 TableMapReduceUtil#addDependencyJars 的作业，以下命令结构是必需的：

```java
$ HADOOP_CLASSPATH=${HBASE_HOME}/bin/hbase mapredcp:${HBASE_HOME}/conf hadoop jar MyApp.jar MyJobMainClass -libjars $(${HBASE_HOME}/bin/hbase mapredcp | tr ':' ',') ...
```

### 注意

如果您从构建目录运行 HBase 而不是安装位置，该示例可能无法运行。您可能会看到类似以下的错误：

```java
java.lang.RuntimeException: java.lang.ClassNotFoundException: org.apache.hadoop.hbase.mapreduce.RowCounter$RowCounterMapper
```

如果发生这种情况，请尝试按如下方式修改该命令，以便在构建环境中使用来自 target/ 目录的 HBase JAR 。

```java
$ HADOOP_CLASSPATH=${HBASE_BUILD_HOME}/hbase-mapreduce/target/hbase-mapreduce-VERSION-SNAPSHOT.jar:${HBASE_BUILD_HOME}/bin/hbase classpath ${HADOOP_HOME}/bin/hadoop jar ${HBASE_BUILD_HOME}/hbase-mapreduce/target/hbase-mapreduce-VERSION-SNAPSHOT.jar rowcounter usertable
```

### HBase MapReduce 用户在 0.96.1 和 0.98.4 的通知

一些使用 HBase 的 MapReduce 作业无法启动。该症状是类似于以下情况的异常:

```java
Exception in thread "main" java.lang.IllegalAccessError: class
    com.google.protobuf.ZeroCopyLiteralByteString cannot access its superclass
    com.google.protobuf.LiteralByteString
    at java.lang.ClassLoader.defineClass1(Native Method)
    at java.lang.ClassLoader.defineClass(ClassLoader.java:792)
    at java.security.SecureClassLoader.defineClass(SecureClassLoader.java:142)
    at java.net.URLClassLoader.defineClass(URLClassLoader.java:449)
    at java.net.URLClassLoader.access$100(URLClassLoader.java:71)
    at java.net.URLClassLoader$1.run(URLClassLoader.java:361)
    at java.net.URLClassLoader$1.run(URLClassLoader.java:355)
    at java.security.AccessController.doPrivileged(Native Method)
    at java.net.URLClassLoader.findClass(URLClassLoader.java:354)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
    at
    org.apache.hadoop.hbase.protobuf.ProtobufUtil.toScan(ProtobufUtil.java:818)
    at
    org.apache.hadoop.hbase.mapreduce.TableMapReduceUtil.convertScanToString(TableMapReduceUtil.java:433)
    at
    org.apache.hadoop.hbase.mapreduce.TableMapReduceUtil.initTableMapperJob(TableMapReduceUtil.java:186)
    at
    org.apache.hadoop.hbase.mapreduce.TableMapReduceUtil.initTableMapperJob(TableMapReduceUtil.java:147)
    at
    org.apache.hadoop.hbase.mapreduce.TableMapReduceUtil.initTableMapperJob(TableMapReduceUtil.java:270)
    at
    org.apache.hadoop.hbase.mapreduce.TableMapReduceUtil.initTableMapperJob(TableMapReduceUtil.java:100)
...
```

这是由HBASE-9867 中引入的优化导致的，它无意中引入了类加载器依赖性。

这会影响两个作业，即使用 libjars 选项和 “fat jar” (在嵌套的 lib 文件夹中打包其运行时依赖项)。

为了满足新的加载器要求，hbase-protocol.jar 必须包含在 Hadoop 的类路径中。以下内容包括用于历史目的。

通过在Hadoop 的 lib 目录中包括对 hbase-protocol.jar 协议的引用，通过 symLink或将 jar 复制到新的位置，可以解决整个系统。

这也可以通过 HADOOP_CLASSPATH 在作业提交时将它包含在环境变量中来实现。启动打包依赖关系的作业时，以下所有三个启动命令均满足此要求：

```java
$ HADOOP_CLASSPATH=/path/to/hbase-protocol.jar:/path/to/hbase/conf hadoop jar MyJob.jar MyJobMainClass
$ HADOOP_CLASSPATH=$(hbase mapredcp):/path/to/hbase/conf hadoop jar MyJob.jar MyJobMainClass
$ HADOOP_CLASSPATH=$(hbase classpath) hadoop jar MyJob.jar MyJobMainClass
```

对于不打包它们的依赖关系的 jar，下面的命令结构是必需的：

```java
$ HADOOP_CLASSPATH=$(hbase mapredcp):/etc/hbase/conf hadoop jar MyApp.jar MyJobMainClass -libjars $(hbase mapredcp | tr ':' ',') ...
```
