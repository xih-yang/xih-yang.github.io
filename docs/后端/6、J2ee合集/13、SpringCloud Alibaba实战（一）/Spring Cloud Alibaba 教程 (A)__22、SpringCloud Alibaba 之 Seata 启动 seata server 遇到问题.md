# 22、SpringCloud Alibaba 之 Seata 启动 seata server 遇到问题
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/22.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们在使用Seata分布式事务服务时，会使用到Seata框架中的三个角色

**1、** TC(TransactionCoordinator)-事务协调者；

维护全局和分支事务的状态，驱动全局事务提交或回滚

**2、** TM(TransactionManager)-事务管理器；

定义全局事务的范围：开始全局事务、提交或回滚全局事务

**3、** RM(ResourceManager)-资源管理器；

> TC为单独部署的 Server 服务端，TM 和 RM 为嵌入到应用中的 Client 客户端

因此第一步，我们需要安装启动 Seata TC Server服务端

启动seata-server前我们需要修改两个配置文件

**1、** conf目录下的**file.conf**配置文件（主要修改自定义事务组名称，事务日志存储模式为db及数据库连接信息）；

**2、** conf目录下的**registry.conf**配置文件（主要修改注册中心，指明注册中心为nacos，及修改nacos连接信息即可）；

注：

如果使用nacos注册中心，先启动Nacos，再使用seata-server中 /bin/seata-server.sh 文件启动seata-server

## 一、问题1：file.conf配置文件中，db数据库url、用户名和密码是否正确

报错如下：

```java
com.mysql.jdbc.exceptions.jdbc4.MySQLNonTransientConnectionException: Could not create connection to database server.
```

检查/conf/file.conf 文件中 配置存储模式为 “db”，检查数据库url、user、password 是否正确

注：

mysql8版本之后，驱动driverClassName由 "com.mysql.jdbc.Driver" 改为 "com.mysql.cj.jdbc.Driver"

## 二、问题2：registry.conf配置文件中，注册中心是否正确

### Seata Server 配置

如果使用了 注册中心 ，如 type="nacos"等要检查nacos的 应用名application、服务注册地址serverAddr、分组group、命名空间namespace、集群cluster、用户名username、密码password是否正确等

### Seata Client 配置

在Seata Client（即微服务架构中的服务）中，通过 application.properties/yml 等配置文件对 Nacos 配置中心进行配置

```bash
#设置使用注册中心
#seata-spring-boot-starter 1.1版本少一些配置项
seata.enabled=true
seata.registry.type=nacos
# 集群
seata.registry.nacos.cluster=default
# 分组
seata.registry.nacos.group=SEATA_GROUP
# 应用名
seata.registry.nacos.application=seata-server
# 服务注册地址
seata.registry.nacos.server-addr=192.168.133.129:8848
```

## 三、sessionStore/root.data中回滚数据报错

报错如下：

```bash
Failed to retry rollbacking [192.168.133.129:8091:702852926242021399] Unknown java.lang.RuntimeException: rm client is not connected.
dbkey:jdbc:mysql://localhost:3306/orderdb,clientId:springboot-seata:192.168.133.1:64279
```

因之前博主测试 AT事务模式：单体应用多数据源分布式事务，导致 /bin/sessionStore/root.data 中含有回滚数据 ，但是连接的 数据库url是错误的，将其修改掉或者直接删除

rm-rf root.data

重新启动即可
