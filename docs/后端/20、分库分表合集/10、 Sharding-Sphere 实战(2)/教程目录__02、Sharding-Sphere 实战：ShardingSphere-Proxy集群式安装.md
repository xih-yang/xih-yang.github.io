# 02、Sharding-Sphere 实战：ShardingSphere-Proxy集群式安装
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/2/2.html
- 分类：分库分表
- 分组：教程目录
从上一篇介绍的产品路线已知，ShardingSphere当前对数据库接入端主要提供了JDBC和Proxy两款产品。ShardingSphere-JDBC面向开发人员，以jar包形式提供服务，因此不需要安装，只要部署好相关jar包和数据库系统提供的JDBC驱动程序，再做适当配置即可使用。ShardingSphere-Proxy面向DBA和运维人员，以代理方式提供服务，有中心静态入口，需要安装部署过程。

本篇即详细讲解ShardingSphere-Proxy的安装、配置、验证过程。本专栏后面的所有实践部分均在此安装部署环境上进行，原因就一个：除SQL（DistSQL）外，不再需要编写Java或其他程序语言代码。

## 一、安装规划

在开始安装前先要最一些安装前的规划工作，主要包括确定ShardingSphere运行模式和主机角色划分。做好这些前期准备工作是适当搭建ShardingSphere环境的必要条件。

### 1. 选择运行模式

ShardingSphere针对不同使用场景提供了内存、单机和集群三种运行模式。内存模式方便开发人员对ShardingSphere进行功能测试而无需清理运行痕迹，单机模式适用于工程师在本地搭建ShardingSphere环境，而线上生产环境必须使用集群模式。

每种运行模式所需依赖不同，安装过程也会有所差异，这里选择集群运行模式。集群运行模式下多个ShardingSphere实例之间可以共享元数据，并且能够提供水平扩展和高可用等分布式系统的必备能力。

### 2. 主机规划

集群环境需要通过独立部署的注册中心来存储元数据和协调节点状态，ShardingSphere通常使用Zookeeper作为集群注册中心，因此首先需要规划Zookeeper主机。其次是确定安装ShardingSphere-Proxy的主机，既然是集群环境当然需要规划至少两台。再次是确定接入端数据库主机，这些主机上运行的数据库实例是真正存储数据和执行SQL的地方。ShardingSphere-Proxy目前实现了MySQL和PostgreSQL协议，我们使用MySQL作为接入数据库。最后，为了便于验证安装，指定一台主机作为MySQL客户端，连接ShardingSphere-Proxy访问底层数据库。为避免发生不必要的兼容性问题，MySQL服务器与客户端版本均为5.7.34，MySQL安装过程从略。

本次安装的主机规划信息如下，所有主机都使用CentOS Linux操作系统，并且网络互通。

- JDK、Zookeeper、MySQL服务器：172.18.26.198、172.18.10.66、172.18.18.102
- ShardingSphere-Proxy：172.18.10.66、172.18.18.102
- MySQL客户端：172.18.16.156

## 二、搭建ShardingSphere-Proxy集群环境

为简单起见，以下安装步骤中的命令均使用root操作系统用户执行。

### 1. 安装JDK

ShardingSphere是用Java语言开发的，编译或运行都依赖JDK，官方建议使用Java 17运行 ShardingSphere，以在默认情况下尽量提升性能。参见“[建议使用Java 17运行ShardingSphere](https://shardingsphere.apache.org/document/current/cn/reference/test/performance-test/benchmarksql-test/#%E5%BB%BA%E8%AE%AE%E4%BD%BF%E7%94%A8-java-17-%E8%BF%90%E8%A1%8C-shardingsphere)”Java 17下载地址：

[https://download.oracle.com/java/17/latest/jdk-17_linux-x64_bin.rpm](https://download.oracle.com/java/17/latest/jdk-17_linux-x64_bin.rpm)

下载安装包后，在172.18.26.198、172.18.10.66、172.18.18.102上执行以下命令安装JDK。

```java
# 安装rpm包
rpm -ivh jdk-17_linux-x64_bin.rpm
# 选择当前使用的Java版本（可选）
alternatives --config java
# 确认当前JDK版本
java --version
```

### 2. 安装ZooKeeper

最新的ZooKeeper 3.8.0在JDK 17上通过了全部测试，参见“[Official support for JDK17 (all tests are passing)](https://zookeeper.apache.org/releases.html)”，因此这里选择安装最新版本的ZooKeeper 3.8.0，下载地址：

[https://www.apache.org/dyn/closer.lua/zookeeper/zookeeper-3.8.0/apache-zookeeper-3.8.0-bin.tar.gz](https://www.apache.org/dyn/closer.lua/zookeeper/zookeeper-3.8.0/apache-zookeeper-3.8.0-bin.tar.gz)

生产环境建议安装副本模式，强烈建议奇数台服务器，至少三台。偶数台服务器可能因为无法做出多数仲裁而造成脑裂。在172.18.26.198、172.18.10.66、172.18.18.102三台机器上执行以下步骤安装配置ZooKeeper。

（1）解压二进制包

```java
tar -zxvf apache-zookeeper-3.8.0-bin.tar.gz
```

（2）创建配置文件

```java
# 进入配置文件目录
cd apache-zookeeper-3.8.0-bin/conf
# 创建配置文件
cp zoo_sample.cfg zoo.cfg
```

编辑zoo.cfg内容如下：

```java
# ZooKeeper使用的毫秒为单位的时间单元，用于进行心跳，最小会话超时将是tickTime的两倍。
tickTime=2000
# 存储内存中数据库快照的位置。
dataDir=/var/lib/zookeeper/data
# 数据库更新的事务日志所在目录。
dataLogDir=/var/lib/zookeeper/log
# 监听客户端连接的端口。
clientPort=2181
# LF初始通信时限，即集群中的follower服务器(F)与leader服务器(L)之间初始连接时能容忍的最多心跳数（tickTime的数量）。
initLimit=5
# LF同步通信时限，即集群中的follower服务器(F)与leader服务器(L)之间请求和应答之间能容忍的最多心跳数（tickTime的数量）。
syncLimit=2
# 集群配置 server.服务器ID=服务器IP地址:服务器之间通信端口:服务器之间投票选举端口。当服务器启动时，通过在数据目录中查找文件myid来知道它是哪台服务器。
server.1=172.18.26.198:2888:3888
server.2=172.18.10.66:2888:3888
server.3=172.18.18.102:2888:3888
# 指定自动清理事务日志和快照文件的频率，单位是小时。 
autopurge.purgeInterval=1
```

（3）创建新的空ZooKeeper数据目录和事务日志目录

```java
mkdir -p /var/lib/zookeeper/data
mkdir -p /var/lib/zookeeper/log
```

（4）添加myid配置

```java
# 172.18.26.198上
echo 1 > /var/lib/zookeeper/data/myid
# 172.18.10.66上
echo 2 > /var/lib/zookeeper/data/myid
# 172.18.18.102上
echo 3 > /var/lib/zookeeper/data/myid
```

（5）设置Zookeeper使用的JVM堆内存

修改zkEnv.sh文件中的ZK_SERVER_HEAP值，缺省为1000，单位是MB，修改为2048。

```java
# default heap for zookeeper server
ZK_SERVER_HEAP="${ZK_SERVER_HEAP:-2048}"
```

（6）启动ZooKeeper

```java
/root/apache-zookeeper-3.8.0-bin/bin/zkServer.sh start
```

日志记录在安装目录下的logs目录中，如本例中的/root/apache-zookeeper-3.8.0-bin/logs。

（7）查看ZooKeeper状态

```java
/root/apache-zookeeper-3.8.0-bin/bin/zkServer.sh status
```

**172、** 18.26.198输出：；

```java
/usr/bin/java
ZooKeeper JMX enabled by default
Using config: /root/apache-zookeeper-3.8.0-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: follower
```

**172、** 18.10.66输出：；

```java
/usr/bin/java
ZooKeeper JMX enabled by default
Using config: /root/apache-zookeeper-3.8.0-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: leader
```

**172、** 18.18.102输出：；

```java
/usr/bin/java
/usr/bin/java
ZooKeeper JMX enabled by default
Using config: /root/apache-zookeeper-3.8.0-bin/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: follower
```

（8）简单测试ZooKeeper命令

```java
# 连接ZooKeeper
/root/apache-zookeeper-3.8.0-bin/bin/zkCli.sh -server 172.18.26.198:2181
# 控制台输出：
Connecting to 172.18.26.198:2181
...
Welcome to ZooKeeper!
...
[zk: 172.18.26.198:2181(CONNECTED) 0] help
ZooKeeper -server host:port -client-configuration properties-file cmd args
...
Command not found: Command not found help
[zk: 172.18.26.198:2181(CONNECTED) 1] ls /
[zookeeper]
[zk: 172.18.26.198:2181(CONNECTED) 2] create /zk_test my_data
Created /zk_test
[zk: 172.18.26.198:2181(CONNECTED) 3] ls /
[zk_test, zookeeper]
[zk: 172.18.26.198:2181(CONNECTED) 4] get /zk_test
my_data
[zk: 172.18.26.198:2181(CONNECTED) 5] set /zk_test junk
[zk: 172.18.26.198:2181(CONNECTED) 6] get /zk_test
junk
[zk: 172.18.26.198:2181(CONNECTED) 7] delete /zk_test
[zk: 172.18.26.198:2181(CONNECTED) 8] ls /
[zookeeper]
[zk: 172.18.26.198:2181(CONNECTED) 9] quit
WATCHER::
WatchedEvent state:Closed type:None path:null
2022-05-22 16:10:24,893 [myid:] - INFO  [main:o.a.z.ZooKeeper@1232] - Session: 0x108632296230000 closed
2022-05-22 16:10:24,893 [myid:] - INFO  [main-EventThread:o.a.z.ClientCnxn$EventThread@568] - EventThread shut down for session: 0x108632296230000
2022-05-22 16:10:24,897 [myid:] - ERROR [main:o.a.z.u.ServiceUtils@42] - Exiting JVM with code 0
[root@vvml-z2-greenplum~/apache-zookeeper-3.8.0-bin/conf]#
```

### 3. 安装ShardingSphere-Proxy

下载地址：

[https://www.apache.org/dyn/closer.lua/shardingsphere/5.1.1/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin.tar.gz](https://www.apache.org/dyn/closer.lua/shardingsphere/5.1.1/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin.tar.gz)

在172.18.10.66、172.18.18.102两台机器上执行以下步骤安装配置ShardingSphere-Proxy。

（1）解压二进制包

```java
tar -zxvf apache-shardingsphere-5.1.1-shardingsphere-proxy-bin.tar.gz
```

（2）创建配置文件

```java
# 进入配置文件目录
cd apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/conf/
# 创建配置文件
cp server.yaml server.yaml.bak
```

编辑server.yaml内容如下：

```java
mode:
  type: Cluster            # 运行模式类型，可选配置：Memory、Standalone、Cluster
  repository:              持久化仓库配置，Memory类型无需持久化
    type: ZooKeeper        # 持久化仓库类型
    props:                 持久化仓库所需属性
      namespace: governance_ds        # 注册中心命名空间
      server-lists: 172.18.26.198:2181,172.18.10.66:2181,172.18.18.102:2181   注册中心连接地址
      retryIntervalMilliseconds: 500        # 重试间隔毫秒数
      timeToLiveSeconds: 60                 # 临时数据失效的秒数
      maxRetries: 3                         # 客户端连接最大重试次数
      operationTimeoutMilliseconds: 500     # 客户端操作超时的毫秒数
  overwrite: false                          是否使用本地配置覆盖持久化配置
rules:                                      授权规则
  - !AUTHORITY
    users:                                  # 用于登录计算节点的用户名
      - root@%:123456                       授权主机和密码的组合，格式：<username>@<hostname>:<password>
      - sharding@:123456                    # hostname为%或空字符串表示不限制授权主机
    provider:                               权限提供者配置
      type: ALL_PRIVILEGES_PERMITTED        # 存储节点的权限提供者类型，默认授予所有权限（不鉴权）
```

### 4. 引入依赖

如果后端连接PostgreSQL数据库，不需要引入额外依赖。如果后端连接MySQL数据库，下载mysql-connector-java-5.1.47.jar或者 mysql-connector-java-8.0.11.jar，并将其放入%SHARDINGSPHERE_PROXY_HOME%/ext-lib目录。

下载地址：

[https://downloads.mysql.com/archives/get/p/3/file/mysql-connector-java-5.1.47.tar.gz](https://downloads.mysql.com/archives/get/p/3/file/mysql-connector-java-5.1.47.tar.gz)

[https://downloads.mysql.com/archives/get/p/3/file/mysql-connector-java-8.0.11.tar.gz](https://downloads.mysql.com/archives/get/p/3/file/mysql-connector-java-8.0.11.tar.gz)

在172.18.10.66、172.18.18.102两台机器上执行以下步骤引入JDBC依赖包。

（1）解压

```java
tar -zxvf mysql-connector-java-5.1.47.tar.gz
tar -zxvf mysql-connector-java-8.0.11.tar.gz
```

（2）创建ext-lib目录

```java
# 因为初始目录中并没有 ext-lib，需要自行创建。
cd ~/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/
mkdir ext-lib
```

（3）将MySQL的JDBC驱动程序复制到ext-lib目录中

```java
cp ~/mysql-connector-java-5.1.47/mysql-connector-java-5.1.47.jar ~/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/ext-lib/
cp ~/mysql-connector-java-8.0.11/mysql-connector-java-8.0.11.jar ~/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/ext-lib/
```

## 三、验证ShardingSphere-Proxy集群环境

执行以下步骤验证ShardingSphere-Proxy集群环境。

### 1. 启动ShardingSphere-Proxy

在172.18.10.66、172.18.18.102两台机器上执行以下命令启动ShardingSphere-Proxy。

```java
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/start.sh
```

控制台输出：

```java
we find java version: java17, full_version=17.0.3.1
Starting the ShardingSphere-Proxy ...
The classpath is /root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/conf:.:/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/lib/*:/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/ext-lib/*
Please check the STDOUT file: /root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/logs/stdout.log
```

在/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/logs/stdout.log文件中出现如下错误信息：

```java
[ERROR] 2022-05-22 16:19:20.196 [_finished_check_Worker-1-EventThread] o.a.c.framework.imps.EnsembleTracker - Invalid config event received: {server.1=172.18.26.198:2888:3888:participant, server.2=172.18.10.66:2888:3888:participant, server.3=172.18.18.102:2888:3888:participant, version=0}
```

这是一个curator框架的bug，不影响使用，已在curator 5.2.0版本里修复该问题。参见“[Error logged for valid config - "Invalid config event received: {properties}"](https://issues.apache.org/jira/browse/CURATOR-526)”。ShardingSphere-Proxy 5.1.1 默认集成的ZooKeeper Curator客户端版本是3.6.0：

```java
cd ~/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/lib/
ll zookeeper-*
-rw-r--r-- 1 1000 1000 1242452 Nov  4  2021 zookeeper-3.6.0.jar
-rw-r--r-- 1 1000 1000  250372 Nov  4  2021 zookeeper-jute-3.6.0.jar
```

查看ZooKeeper数据：

```java
/root/apache-zookeeper-3.8.0-bin/bin/zkCli.sh -server 172.18.26.198:2181
[zk: 172.18.26.198:2181(CONNECTED) 0] ls /
[governance_ds, zookeeper]
[zk: 172.18.26.198:2181(CONNECTED) 1] ls /governance_ds
[lock, metadata, nodes, rules, scaling]
[zk: 172.18.26.198:2181(CONNECTED) 2] ls /governance_ds/nodes
[compute_nodes]
[zk: 172.18.26.198:2181(CONNECTED) 3] ls /governance_ds/nodes/compute_nodes
[attributes, online]
[zk: 172.18.26.198:2181(CONNECTED) 4] ls /governance_ds/nodes/compute_nodes/online
[proxy]
[zk: 172.18.26.198:2181(CONNECTED) 5] ls /governance_ds/nodes/compute_nodes/online/proxy
[172.18.10.66@3307, 172.18.18.102@3307]
[zk: 172.18.26.198:2181(CONNECTED) 6] ls /governance_ds/metadata
[information_schema, mysql, performance_schema, sys]
[zk: 172.18.26.198:2181(CONNECTED) 7] quit
```

看以看到在/governance_ds/nodes/compute_nodes/online/proxy节点下有我们部署的两个ShardingSphere-Proxy实例。

### 2. 验证客户端连接

在172.18.16.156执行MySQL客户端命令行连接一个Proxy实例，并创建一个逻辑数据库db1。

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456 -e "show databases;create database db1;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+
| schema_name        |
+--------------------+
| mysql              |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
```

可以看到初始安装的Proxy中有四个逻辑数据库，对应Zookeeper中/governance_ds/metadata节点下的数据。

在172.18.16.156执行MySQL客户端命令行连接另一个Proxy实例，查看当前所有数据库后，删除上一步创建的逻辑数据库db1。

```java
mysql -u root -h 172.18.18.102 -P 3307 -p123456 -e "show databases;drop database db1;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+
| schema_name        |
+--------------------+
| mysql              |
| db1                |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
```

可以看到上一步中创建的逻辑数据库db1，说明两个Proxy共享ZooKeeper上存储的元数据。

再次在172.18.16.156执行MySQL客户端命令行连接另一个Proxy实例，查看当前所有数据库。

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456 -e "show databases;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+
| schema_name        |
+--------------------+
| mysql              |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
```

可以看到逻辑数据库db1已经被删除。

### 3. 验证ShardingSphere-Proxy集群高可用

在172.18.18.102执行以下命令停止ShardingSphere-Proxy实例。

```java
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/stop.sh
```

控制台输出：

```java
Stopping the ShardingSphere-Proxy ....OK!
PID: 31577
```

此时查看ZooKeeper数据，现在只有172.18.10.66@3307一个Proxy实例，说明停止的Proxy实例已经从注册中心删除。

```java
/root/apache-zookeeper-3.8.0-bin/bin/zkCli.sh -server 172.18.26.198:2181
[zk: 172.18.26.198:2181(CONNECTED) 0] ls /governance_ds/nodes/compute_nodes/online/proxy
[172.18.10.66@3307]
[zk: 172.18.26.198:2181(CONNECTED) 1]
```

在172.18.16.156执行MySQL客户端命令行连接Proxy实例，创建逻辑数据库db1。

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456 -e "create database db1;"
```

在172.18.18.102执行以下命令启动ShardingSphere-Proxy实例。

```java
/root/apache-shardingsphere-5.1.1-shardingsphere-proxy-bin/bin/start.sh
```

查看ZooKeeper数据，现在有两个Proxy实例，说明重新启动的Proxy实例自动被添加到注册中心。

```java
/root/apache-zookeeper-3.8.0-bin/bin/zkCli.sh -server 172.18.26.198:2181
[zk: 172.18.26.198:2181(CONNECTED) 0] ls /governance_ds/nodes/compute_nodes/online/proxy
[172.18.10.66@3307, 172.18.18.102@3307]
[zk: 172.18.26.198:2181(CONNECTED) 1]
```

在172.18.16.156执行MySQL客户端命令行连接新启动的Proxy实例，查看所有逻辑数据库。

```java
mysql -u root -h 172.18.18.102 -P 3307 -p123456 -e "show databases;drop database db1;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+
| schema_name        |
+--------------------+
| db1                |
| mysql              |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
```

可以看到刚才创建的db1，说明重启Proxy实例后，依然继续共享ZooKeeper上存储的元数据。之后删除db1。

连接172.18.10.66的Proxy查看数据库，可以看到db1已经删除而不出现在数据库列表中。

```java
mysql -u root -h 172.18.10.66 -P 3307 -p123456 -e "show databases;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+
| schema_name        |
+--------------------+
| mysql              |
| information_schema |
| performance_schema |
| sys                |
+--------------------+
```

以上步骤说明只要集群中有一个可用的Porxy实例，就可以正常对外提供服务，保证了Proxy的高可用性。当故障实例恢复后，会自动加入集群共享当前元数据。这里只演示了高可用性，但需要手工更改客户端连接地址。若要做到对客户端透明的高可用性，就要引入可以自动漂移的VIP机制，通常使用类似Keepalived的高可用中间件实现。这是另一个内容广泛的话题，在此点到为止不做详述。

初始安装后，ShardingSphere-Proxy并没有任何可用资源，因为还没有实际的物理数据库实例注册其中。如上所见此时可以从命令行连接到Proxy，但从Workbench连接Proxy会报下图所示的错误，原因是GUI工具连接数据库时通常会查询元数据信息。当添加有效资源后，Workbench就能够正常连接Proxy了。
