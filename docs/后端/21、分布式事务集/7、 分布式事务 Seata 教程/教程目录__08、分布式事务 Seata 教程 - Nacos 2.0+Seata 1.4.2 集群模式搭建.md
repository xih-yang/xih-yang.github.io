# 08、分布式事务 Seata 教程 - Nacos 2.0+Seata 1.4.2 集群模式搭建
- 来源：https://ddkk.com/zhuanlan/transaction/5/8.html
- 分类：分布式事务
- 分组：教程目录
### 安装Nacos 2.0

[Nacos2.0.3安装](https://blog.csdn.net/qq_43437874/article/details/120067094)

### 安装Mysql

[Mariadb安装](https://blog.csdn.net/qq_43437874/article/details/115232523)

### Seata 1.4.2 高可用部署

`seata`高可用依赖于注册中心、数据库，可不依赖配置中心。

下载安装包并解压，[下载地址](https://github.com/seata/seata/releases)。

#### 1. 导入数据库脚本

db模式需要在Mysql数据库中创建`global_table`, `branch_table`, `lock_table`表。

[官方脚本](https://github.com/seata/seata/tree/develop/script/server/db)

[本系列整理中文注释脚本](https://blog.csdn.net/qq_43437874/article/details/122686850)

#### 2. 注册中心配置

Seata-Server 需要使用注册中心，以 Nacos 为例。

更多注册中心支持可参考[注册中心](https://seata.io/zh-cn/docs/user/registry/index.html)。

修改registry.conf的注册中心配置：

```java
registry {
  type = "nacos"
  nacos {
  seata服务注册在nacos上的别名，客户端通过该别名调用服务
    application = "seata-server"
  请根据实际生产环境配置nacos服务的ip和端口
    serverAddr = "127.0.0.1:8848"
  nacos上指定的namespace
    namespace = ""
    cluster = "default"
    username = ""
    password = ""
  }
}
config {
  type = "nacos"
  nacos {
    请根据实际生产环境配置nacos服务的ip和端口
    serverAddr = "127.0.0.1:8848"
    nacos上指定的namespace
    namespace = ""
    group = "SEATA_GROUP"
    username = ""
    password = ""
  从v1.4.2版本开始，已支持从一个Nacos dataId中获取所有配置信息,你只需要额外添加一个dataId配置项
    dataId: ""
  }
}
```

#### 3. 配置中心

在第二步中，我们使用了Naocs 作为Seata 的配置中心，更多配置中心支持可参考[配置中心](https://seata.io/zh-cn/docs/user/configuration/index.html)。

当然也可不依赖配置中心，但是就需要各个节点的Seata 配置保持一致了。

[下载配置脚本地址](https://github.com/seata/seata/tree/1.4.2/script/config-center)

修改储存方式为db，配置数据库连接：

相关说明：

```java
# 存储模式
store.mode=db
store.db.datasource=druid
store.db.dbType=mysql
# 需要根据mysql的版本调整driverClassName
# mysql8及以上版本对应的driver：com.mysql.cj.jdbc.Driver
# mysql8以下版本的driver：com.mysql.jdbc.Driver
store.db.driverClassName=com.mysql.cj.jdbc.Driver
# 注意根据生产实际情况调整参数host和port
store.db.url=jdbc:mysql://127.0.0.1:3306/seata-server?useUnicode=true&characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useSSL=false
# 数据库用户名
store.db.user=
# 用户名密码
store.db.password=
```

找到nacos 初始化配置脚本：

如果是Windows，则需要安装Git，右键打开Git Bash,输入sh nacos-config.sh，导入完成后，可在nacos中查看到所有配置。

#### 4. 启动集群

配置完后，直接启动Seata 即可，这里需要注意设置启动参数，[参考文档](https://blog.csdn.net/qq_43437874/article/details/113886911)。

因为测试是在同一台机器，所以这里设置了不同的端口和节点序号。

分别启动三个节点，查看Nacos，发现都注册进来了。

### 集群测试

#### 1. 启动项目

启动我们之前搭建的三个项目，可以看到后台服务都在各个Seata 节点中注册了自己的RM。

#### 2. 测试分布式事务

发起多个分布式事务请求，可以看到分别分发到了不同的节点

#### 3. 负载均衡

可以看到这里使用的是Nacos 中的权重算法，我们可以在这里配置节点的权重值。

### 总结
