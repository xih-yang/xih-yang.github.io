# 12、FlinkSQL - Gateway以及支持Kerberos多租户的实现思路
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/12.html
- 分类：大数据框架
- 分组：教程目录
Flink 自带了一个SQLClient，截至目前Flink-1.13.0，Flink还没有Flink SQL Gateway。

## 需求

由于需要在提供友好的用户界面，类似于低代码平台，因此需要一个WEB服务来调用执行用户的SQL。

## 调研

Flink SQLClient 就是一个很好的样例。

思路就是：

实现一个SQL Parser：

**1、** 将用户输入的SQL文本，使用正则表达式，进行分割，转换成一条条DDL，DML；

**2、** 一行一行地调用FlinkTableAPI执行；

TableEnvironment：

```java
public interface TableEnvironment {
    TableResult executeSql(String statement);
}
```

执行过程：

```java
EnvironmentSettings settings = EnvironmentSettings.newInstance().useBlinkPlanner().build();
TableEnvironment tableEnv = TableEnvironment.create(settings);
tableEnv.useCatalog("slankka");
tableEnv.useDatabase(database);
tableResult = tableEnv.executeSql(cmd);
```

## HiveCatalog 多租户和Kerberos

在这篇文章中，对Hive进行了修改，以支持Kerberos。

[【Flink系列】构建实时计算平台——Flink 1.10+通过Kerberos连接HiveCatalog](/zhuanlan/bigdata/flink/3/7.html)

本篇文章将基于这个改动，提供多租户的思路。

HiveCatalog 类的源码如下：

```java
//org.apache.flink.table.catalog.hive.HiveCatalog
public class HiveCatalog extends AbstractCatalog {
    @VisibleForTesting HiveMetastoreClientWrapper client;
     @Override
    public void open() throws CatalogException {
        if (client == null) {
            client = HiveMetastoreClientFactory.create(hiveConf, hiveVersion);
            LOG.info("Connected to Hive metastore");
        }
        //....
    }
    @Override
    public void close() throws CatalogException {
        if (client != null) {
            client.close();
            client = null;
            LOG.info("Close connection to Hive metastore");
        }
    }
}
```

可以看到底层是一个`HiveMetastoreClientWrapper`

```java
//HiveMetastoreClientWrapper.java
    private IMetaStoreClient createMetastoreClient() {
        return hiveShim.getHiveMetastoreClient(hiveConf);
    }
```

HiveShimV100，对应hive-1.x。

```java
//HiveShimV100.java
public class HiveShimV100 implements HiveShim {
    @Override
    public IMetaStoreClient getHiveMetastoreClient(HiveConf hiveConf) {
        try {
            return new HiveMetaStoreClient(hiveConf);
        } catch (MetaException ex) {
            throw new CatalogException("Failed to create Hive Metastore client", ex);
        }
    }
}
```

因此`HiveCatalog.open` 导致 `HiveMetaStoreClient`的创建。

那么对于Kerberos代理，则需要HADOOP_PROXY_USER这个变量。

## HADOOP_PROXY_USER的运行时设置

Flink 的 TableEnvironment 有这个API：

```java
void registerCatalog(String catalogName, Catalog catalog);
```

这个将注册一个Catalog，对于持久化的Catalog，Flink目前只有HiveCatalog，那么可以覆盖HiveCatalog的子类的open/close方法来实现运行时切换用户。

```java
new HiveCatalog(...) {
      @Override
      public void open() throws CatalogException {
        wrapExecution(super::open);
      }
      @Override
      public void close() throws CatalogException {
        wrapExecution(super::close);
      }
      public void wrapExecution(Runnable consumer) {
          //大致代码如下：
          String current = System.getProperty(HADOOP_PROXY_USER);
          try {
             System.setProperty(HADOOP_PROXY_USER, slankkaProvidedAccount);
             consumer.run();
          } finally {
             if (current != null) {
                System.setProperty(HADOOP_PROXY_USER, current);
             } else {
                System.clearProperty(HADOOP_PROXY_USER);
             }
          }
      }
}
```

篇幅有限，大致记录一个思路。
