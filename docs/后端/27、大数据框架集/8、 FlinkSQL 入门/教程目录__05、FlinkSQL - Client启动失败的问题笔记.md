# 05、FlinkSQL - Client启动失败的问题笔记
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/5.html
- 分类：大数据框架
- 分组：教程目录
## 问题

报错
org.apache.flink.table.api.NoMatchingTableFactoryException: Could not find a suitable table factory for 'org.apache.flink.table.factories.CatalogFactory' in the classpath.

## 分析

**1、** 此台服务器没有完整的HADOOP_CONF_DIR,HADOOP_CLASSPATH等环境变量；

**2、** flink-conf.yml没有经过任何修改；

**3、** FLINK_DIR/lib下没有添加任何jar；

**4、** 在conf/sql-client-defaults.yml中配置了Catalog.；

```java
# Define catalogs here.
catalogs:  empty list
 - name: pfc
   type: hive
   hive-conf-dir: /etc/hive/conf/
   default-database: flink
```

## 解决问题

查阅[Flink-HIVE 文档](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/connectors/hive/)

老实将图中的jar 添加到 FLINK_DIR/lib下面。

否则出现：

```java
Exception in thread "main" org.apache.flink.table.client.SqlClientException: Unexpected exception. This is a bug. Please consider filing an issue.
	at org.apache.flink.table.client.SqlClient.main(SqlClient.java:208)
Caused by: org.apache.flink.table.client.gateway.SqlExecutionException: Could not create execution context.
	at org.apache.flink.table.client.gateway.local.ExecutionContext$Builder.build(ExecutionContext.java:878)
	at org.apache.flink.table.client.gateway.local.LocalExecutor.openSession(LocalExecutor.java:226)
	at org.apache.flink.table.client.SqlClient.start(SqlClient.java:108)
	at org.apache.flink.table.client.SqlClient.main(SqlClient.java:196)
Caused by: java.lang.NoClassDefFoundError: org/apache/hadoop/hive/metastore/api/AlreadyExistsException
	at org.apache.flink.table.catalog.hive.factories.HiveCatalogFactory.createCatalog(HiveCatalogFactory.java:89)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.createCatalog(ExecutionContext.java:384)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.lambda$null$5(ExecutionContext.java:634)
	at java.util.HashMap.forEach(HashMap.java:1288)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.lambda$initializeCatalogs$6(ExecutionContext.java:633)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.wrapClassLoader(ExecutionContext.java:266)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.initializeCatalogs(ExecutionContext.java:632)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.initializeTableEnvironment(ExecutionContext.java:529)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.<init>(ExecutionContext.java:185)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.<init>(ExecutionContext.java:138)
	at org.apache.flink.table.client.gateway.local.ExecutionContext$Builder.build(ExecutionContext.java:867)
	... 3 more
Caused by: java.lang.ClassNotFoundException: org.apache.hadoop.hive.metastore.api.AlreadyExistsException
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
	... 14 more
```

或者出现：

```java
Exception in thread "main" org.apache.flink.table.client.SqlClientException: Unexpected exception. This is a bug. Please consider filing an issue.
	at org.apache.flink.table.client.SqlClient.main(SqlClient.java:208)
Caused by: org.apache.flink.table.client.gateway.SqlExecutionException: Could not create execution context.
	at org.apache.flink.table.client.gateway.local.ExecutionContext$Builder.build(ExecutionContext.java:878)
	at org.apache.flink.table.client.gateway.local.LocalExecutor.openSession(LocalExecutor.java:226)
	at org.apache.flink.table.client.SqlClient.start(SqlClient.java:108)
	at org.apache.flink.table.client.SqlClient.main(SqlClient.java:196)
Caused by: java.lang.NoClassDefFoundError: com/facebook/fb303/FacebookService$Iface
	at java.lang.ClassLoader.defineClass1(Native Method)
	at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
	at java.security.SecureClassLoader.defineClass(SecureClassLoader.java:142)
	at java.net.URLClassLoader.defineClass(URLClassLoader.java:467)
	at java.net.URLClassLoader.access$100(URLClassLoader.java:73)
	at java.net.URLClassLoader$1.run(URLClassLoader.java:368)
	at java.net.URLClassLoader$1.run(URLClassLoader.java:362)
	at java.security.AccessController.doPrivileged(Native Method)
	at java.net.URLClassLoader.findClass(URLClassLoader.java:361)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
	at org.apache.flink.table.catalog.hive.client.HiveShimV100.getHiveMetastoreClient(HiveShimV100.java:97)
	at org.apache.flink.table.catalog.hive.client.HiveMetastoreClientWrapper.createMetastoreClient(HiveMetastoreClientWrapper.java:245)
	at org.apache.flink.table.catalog.hive.client.HiveMetastoreClientWrapper.<init>(HiveMetastoreClientWrapper.java:76)
	at org.apache.flink.table.catalog.hive.client.HiveMetastoreClientFactory.create(HiveMetastoreClientFactory.java:35)
	at org.apache.flink.table.catalog.hive.HiveCatalog.open(HiveCatalog.java:245)
	at org.apache.flink.table.catalog.CatalogManager.registerCatalog(CatalogManager.java:190)
	at org.apache.flink.table.api.internal.TableEnvironmentImpl.registerCatalog(TableEnvironmentImpl.java:338)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.lambda$null$5(ExecutionContext.java:635)
	at java.util.HashMap.forEach(HashMap.java:1288)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.lambda$initializeCatalogs$6(ExecutionContext.java:633)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.wrapClassLoader(ExecutionContext.java:266)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.initializeCatalogs(ExecutionContext.java:632)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.initializeTableEnvironment(ExecutionContext.java:529)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.<init>(ExecutionContext.java:185)
	at org.apache.flink.table.client.gateway.local.ExecutionContext.<init>(ExecutionContext.java:138)
	at org.apache.flink.table.client.gateway.local.ExecutionContext$Builder.build(ExecutionContext.java:867)
	... 3 more
Caused by: java.lang.ClassNotFoundException: com.facebook.fb303.FacebookService$Iface
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
	... 31 more
```

## 另外

Flink 连接Hive的时候，需要通过HDFS配置文件来知道Hive服务的位置，所以还需要Hadoop的依赖。

通过查看 FLINK_DIR/bin/config.sh发现，HADOOP_CLASSPATH非常重要，仅 HADOOP_CONF_DIR似乎不够。

因此这样执行便可以启动 Flink SQL CLient:

```java
FLINK_DIR/bin $>`HADOOP_CLASSPATH=hadoop classpath ./sql-client.sh embedded
```

于是这样就启动成功了
