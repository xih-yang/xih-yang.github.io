# 15、SpringCloud Alibaba 之 SkyWalking MySQL、Elasticsearch持久化
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/15.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Skywalking跟踪数据默认是存放在内嵌式数据库H2中存贮，重启skywalking，跟踪数据就丢失了，我们可以把跟踪数据持久化到mysql或者elasticsearch中

/xx/apache-skywalking-apm-bin/config/application.yml 文件

## 一、MySQL持久化SkyWalking

此时我们可以修改配置文件

**1、** 使用MySQL数据库，且配置数据库名，以及用户名密码；

**2、** 开启MySQL服务，并创建好数据库skywalkdb，此时数据库表是空的；

**3、** 切换到bin目录下，启动SkyWalking，cd/xx/apache-skywalking-apm-bin/bin，此时查看日志会报错缺少mysql驱动；

```bash
- org.apache.skywalking.oap.server.library.module.BootstrapFlow - 46 [main] INFO  [] - start the provider mysql in storage module.
- com.zaxxer.hikari.HikariDataSource - 80 [main] INFO  [] - HikariPool-1 - Starting...
- org.apache.skywalking.oap.server.starter.OAPServerBootstrap - 57 [main] ERROR [] - Failed to get driver instance for jdbcUrl=jdbc:mysql://localhost:3306/skywalkdb?rewriteBatchedStatements=true
java.lang.RuntimeException: Failed to get driver instance for jdbcUrl=jdbc:mysql://localhost:3306/skywalkdb?rewriteBatchedStatements=true
        at com.zaxxer.hikari.util.DriverDataSource.<init>(DriverDataSource.java:110) ~[HikariCP-3.1.0.jar:?]
        at com.zaxxer.hikari.pool.PoolBase.initializeDataSource(PoolBase.java:334) ~[HikariCP-3.1.0.jar:?]
        at com.zaxxer.hikari.pool.PoolBase.<init>(PoolBase.java:109) ~[HikariCP-3.1.0.jar:?]
        at com.zaxxer.hikari.pool.HikariPool.<init>(HikariPool.java:108) ~[HikariCP-3.1.0.jar:?]
        at com.zaxxer.hikari.HikariDataSource.<init>(HikariDataSource.java:81) ~[HikariCP-3.1.0.jar:?]
        at org.apache.skywalking.oap.server.library.client.jdbc.hikaricp.JDBCHikariCPClient.connect(JDBCHikariCPClient.java:54) ~[library-client-8.8.1.jar:8.8.1]
        at org.apache.skywalking.oap.server.storage.plugin.jdbc.mysql.MySQLStorageProvider.start(MySQLStorageProvider.java:185) ~[storage-jdbc-hikaricp-plugin-8.8.1.jar:8.8.1]
        at org.apache.skywalking.oap.server.library.module.BootstrapFlow.start(BootstrapFlow.java:49) ~[library-module-8.8.1.jar:8.8.1]
        at org.apache.skywalking.oap.server.library.module.ModuleManager.init(ModuleManager.java:60) ~[library-module-8.8.1.jar:8.8.1]
        at org.apache.skywalking.oap.server.starter.OAPServerBootstrap.start(OAPServerBootstrap.java:43) [server-starter-8.8.1.jar:8.8.1]
        at org.apache.skywalking.oap.server.starter.OAPServerStartUp.main(OAPServerStartUp.java:23) [server-starter-8.8.1.jar:8.8.1]
Caused by: java.sql.SQLException: No suitable driver
        at java.sql.DriverManager.getDriver(DriverManager.java:315) ~[?:1.8.0_332]
        at com.zaxxer.hikari.util.DriverDataSource.<init>(DriverDataSource.java:103) ~[HikariCP-3.1.0.jar:?]
        ... 10 more
```

**4、** 切换到/opt/software/apache-skywalking-apm-bin/oap-libs目录下，选择本地mysql驱动上传到该目录下；

```bash
cd /xx/apache-skywalking-apm-bin/oap-libs
```

**5、** 重新启动SkyWalking；

```bash
jps -l：输出完全的包名，应用主类名，jar的完全路径名；
jps -l 
kill PID
sh startup.sh
```

此时再查看日志，会有很多 表table 不存在的信息，忽略掉

我们再去查看数据库 skywalkdb，会发现 多出了很多表

**6、** 浏览器访问，会看到SkyWalking-UI和mysql数据库中都有服务名称；

## 二、Elasticsearch持久化SkyWalking

**1、** 下载、上传、解压带es的安装包；

```bash
tar -zxvf apache-skywalking-apm-es7-8.7.0.tar.gz 
```

**2、** cdapache-skywalking-apm-es7-8.7.0；

**3、** 修改application.yml配置文件：

```bash
storage:
  selector: ${SW_STORAGE:elasticsearch7}
```

**4、** 启动elasticsearch7；

./elasticsearch -d 后台运行 （es不能用root启动， su 其他用户）

注：

（1）es不能用root启动， 需要切换其他用户（su 其他用户）

（2）Elasticsearch的jvm内存不能配置太小，至少512m，小了会出现错误：

status line [HTTP/1.1 429 Too Many Requests]

**5、** 启动elasticsearch-head插件：npmrunstart便于查看elasticsearch数据；

**6、** 启动skywalking；

./startup.sh

启动时会向elasticsearch中创建大量的index索引用于持久化数据，每天会产生一个新的索引文件

**7、** 启动应用程序，查看跟踪数据是否已经持久化到elasticsearch的索引中；

**8、** 然后重启skywalking，验证跟踪数据会不会丢失；
