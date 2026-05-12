# 06、FlinkSQL - flink-connector-hive连接HiveMetastore遇到问题
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/6.html
- 分类：大数据框架
- 分组：教程目录
## 问题

Flink通过Flink-hive-connector来连接Hive，但是连接Hive报错。

具体报错是因为：

HiveMetaStoreClient连接HiveMetastore 使用的Thrift协议，但是Hive-1.x 没有实现 secure impersonation，也就是说没有支持HADOOP_PROXY_USER这个变量。

## 环境和版本

- Hive的版本Hive-1.1.0
- 服务器开启Kerberos认证

## 分析

由于目前项目中连接的是Hive 1.1.0，而HADOOP_PROXY_USER是 2.3.0才支持的 [HIVE-COMMIT](https://github.com/apache/hive/commit/3f90794d872e90c29a068f16cdf3f45b1cf52c74)

可以看到HiveMetaStoreClient.java中增加了如下代码：

```java
    //If HADOOP_PROXY_USER is set in env or property,
    //then need to create metastore client that proxies as that user.
    String HADOOP_PROXY_USER = "HADOOP_PROXY_USER";
    String proxyUser = System.getenv(HADOOP_PROXY_USER);
    if (proxyUser == null) {
      proxyUser = System.getProperty(HADOOP_PROXY_USER);
    }
    //if HADOOP_PROXY_USER is set, create DelegationToken using real user
    if(proxyUser != null) {
      LOG.info(HADOOP_PROXY_USER + " is set. Using delegation "
          + "token for HiveMetaStore connection.");
      try {
        UserGroupInformation.getLoginUser().getRealUser().doAs(
            new PrivilegedExceptionAction<Void>() {
              @Override
              public Void run() throws Exception {
                open();
                return null;
              }
            });
        String delegationTokenPropString = "DelegationTokenForHiveMetaStoreServer";
        String delegationTokenStr = getDelegationToken(proxyUser, proxyUser);
        Utils.setTokenStr(UserGroupInformation.getCurrentUser(), delegationTokenStr,
            delegationTokenPropString);
        this.conf.setVar(ConfVars.METASTORE_TOKEN_SIGNATURE, delegationTokenPropString);
        close();
      } catch (Exception e) {
        LOG.error("Error while setting delegation token for " + proxyUser, e);
        if(e instanceof MetaException) {
          throw (MetaException)e;
        } else {
          throw new MetaException(e.getMessage());
        }
      }
    }
```

## 解决

> 这种操作英语里叫做backport

把上述代码，直接复制粘贴到HiveMetaStoreClient，编译出class字节码即可。

其中把下面的代码替换为

```java
this.conf.setVar(ConfVars.METASTORE_TOKEN_SIGNATURE, delegationTokenPropString);
//上一行因为Hive 1.1.0没有这个枚举，因此直接替换为下方的字符串
this.conf.set("hive.metastore.token.signature", delegationTokenPropString);
```

亲测可行。
