# 07、FlinkSQL - Flink 1.10+通过Kerberos连接HiveCatalog
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/7.html
- 分类：大数据框架
- 分组：教程目录
## 背景

因为要开发Flinksql，决定要使用HiveCatalog的支持，Flink当前最新版本是1.12.2，集群Hive的版本是1.1.0，而且需要用某个Linux用户进行代理。

在实际开发中，遇到两个问题：

**1、** Hive1.1.0使用的不是jdbc，而是MetastoreClient，通过Thrift进行连接，而他不支持HADOOP_PROXY_USER；

**2、** Kerberos认证需要什么配置文件，是否需要在代码里配置UGI？；

## 问题一：HADOOP_PROXY_USER支持

这个问题[上一篇文章](/zhuanlan/bigdata/flink/3/6.html) 已经给出解决方案。

具体请参考：hive-metastore（HIVE-15579）

Github代码Commit[Github链接](https://github.com/apache/hive/commit/3f90794d872e90c29a068f16cdf3f45b1cf52c74?branch=3f90794d872e90c29a068f16cdf3f45b1cf52c74)

## 问题二：Kerberos认证需要什么配置文件，是否需要在代码里配置UGI？

经过测试，发现并不需要在代码中写任何 UserGroupInformation 和 doAs 相关的代码。

需要的配置文件如下：

hive-site.xml

```java
<!--First created by Slankka-->
<configuration>
  <property>
    <name>hive.metastore.uris</name>
    <value>thrift://xxxxx.xxxxx.xxxxxx.com:xxxxx</value>
  </property>
  <property>
    <name>hive.metastore.client.socket.timeout</name>
    <value>300</value>
  </property>
  <!--property>
    <name>hive.metastore.execute.setugi</name>
    <value>slankka</value>
  </property-->
  <property>
    <name>hive.cluster.delegation.token.store.class</name>
    <value>org.apache.hadoop.hive.thrift.MemoryTokenStore</value>
  </property>
  <!--property>
    <name>hive.server2.enable.doAs</name>
    <value>true</value>
  </property-->
  <property>
    <name>hive.metastore.sasl.enabled</name>
    <value>true</value>
  </property>
  <!--property>
    <name>hive.server2.authentication</name>
    <value>kerberos</value>
  </property-->
  <property>
    <name>hive.metastore.kerberos.principal</name>
    <value>hive/_HOST@slankka.COM</value>
  </property>
  <property>
    <name>hive.server2.authentication.kerberos.principal</name>
    <value>hive/_HOST@slankka.COM</value>
  </property>
</configuration>
```

另外还需要一个文件:

core-site.xml

```java
<configuration>
  <property>
    <name>hadoop.security.authentication</name>
    <value>kerberos</value>
  </property>
</configuration>
```

这样在程序启动的时候，只需要指定这两个配置文件即可。

另外不需要任何HADOOP_CONF_DIR或者HIVE_CONF_DIR。

**以上内容就是最小化配置。**

代码示例：

```java
  public static void main(String[] args) {
        Catalog catalog = new HiveCatalog("slankka", "flink", args[0], args[1], "1.1.0");
        try {
//            List<String> strings = catalog.listDatabases();
//            for (String database : strings) {
//                System.out.println(database);
//            }
//            ObjectPath objectPath = new ObjectPath("flink", "objectName");
//            catalog.createFunction(objectPath, new CatalogFunctionImpl("className", FunctionLanguage.JAVA), false);
//            catalog.dropFunction(objectPath, false);
//            catalog.alterFunction(objectPath, new CatalogFunctionImpl("className", FunctionLanguage.JAVA), false);
//            CatalogFunction function = catalog.getFunction(objectPath);
//            catalog.listFunctions("flink");
//            catalog.createTable(objectPath, new CatalogTableImpl());
            catalog.open();
            EnvironmentSettings settings = EnvironmentSettings.newInstance().useBlinkPlanner().build();
            TableEnvironment tableEnv = TableEnvironment.create(settings);
            String[] strings = tableEnv.listCatalogs();
            Arrays.stream(strings).forEach(System.out::println);
            boolean pfc = Arrays.asList(strings).contains("slankka");
            if (!pfc) {
                tableEnv.registerCatalog("slankka", catalog);
            }
            tableEnv.useCatalog("slankka");
            tableEnv.useDatabase("flink");
            tableEnv.executeSql("drop table if exists slankka.flink.WordCountSink");
            TableResult tableResult = tableEnv.executeSql("create table slankka.flink.WordCountSink (\n" +
                    "   word STRING,\n" +
                    "   len INT\n" +
                    ") WITH (\n" +
                    "   'connector' = 'jdbc',\n" +
                    "   'url' = 'jdbc:mysql://slankka.com:3306/rtc',\n" +
                    "   'table-name' = 'flink_sink_test',\n" +
                    "   'username' = 'root',\n" +
                    "   'password' = '1'\n" +
                    ")");
            tableResult.print();
            String[] tables = tableEnv.listTables();
            System.out.println("Tables: --->");
            Arrays.stream(tables).forEach(System.out::println);
        } finally {
            catalog.close();
        }
    }
}
```

执行结果如下：

```java
21/03/15 15:23:08 INFO hive.HiveCatalog: Setting hive conf dir as /data/work/cloudservice/slankka/lib/
21/03/15 15:23:09 WARN util.NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
21/03/15 15:23:09 INFO hive.HiveCatalog: Created HiveCatalog 'slankka'
21/03/15 15:23:09 INFO hive.metastore: HADOOP_PROXY_USER is set. Using delegation token for HiveMetaStore connection.
21/03/15 15:23:09 INFO hive.metastore: Trying to connect to metastore with URI thrift://xxxxx.xxxxx.xxxxx.com:xxxx
21/03/15 15:23:09 INFO hive.metastore: Opened a connection to metastore, current connections: 1
21/03/15 15:23:09 INFO hive.metastore: Connected to metastore.
21/03/15 15:23:09 INFO hive.metastore: Closed a connection to metastore, current connections: 0
21/03/15 15:23:09 INFO hive.metastore: Trying to connect to metastore with URI thrift://xxxxx.xxxxx.xxxxx.com:xxxx
21/03/15 15:23:09 INFO hive.metastore: Opened a connection to metastore, current connections: 1
21/03/15 15:23:09 INFO hive.metastore: Connected to metastore.
21/03/15 15:23:09 INFO hive.HiveCatalog: Connected to Hive metastore
default_catalog
21/03/15 15:23:10 INFO catalog.CatalogManager: Set the current default catalog as [slankka] and the current default database as [flink].
+--------+
| result |
+--------+
|     OK |
+--------+
1 row in set
Tables: --->
wordcountsink
```
