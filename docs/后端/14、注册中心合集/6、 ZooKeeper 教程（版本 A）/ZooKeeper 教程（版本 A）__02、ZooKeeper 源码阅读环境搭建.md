# 02、ZooKeeper 源码阅读环境搭建
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-1/2.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 A）
## 安装ant

安装方法略过

## 编译zookeeper源码

### 下载

https://github.com/apache/zookeeper

这里选择的是branch3.5.6这个分支

### 编译

进入zookeeper源码目录

执行如下的指令进行编译

```java
ant eclipse
```

等待几分钟之后出现如下输出即代表编译成功

### 导入idea

File -> New -> Project From Existing Sources 导入zookeeper的源码目录

### 解决报错

导入后发现zookeeper-server这个module下面的Version类报错，提示Info类不存在

在zookeeper-server这个module下的org.apache.zookeeper.version路径下面创建Info类

```java
public interface Info {
    int MAJOR = 3;
    int MINOR = 5;
    int MICRO = 6;
    String QUALIFIER = null;
    String REVISION_HASH = "c11b7e26bc554b8523dc929761dd28808913f091";
    String BUILD_DATE = "10/08/2019 20:18 GMT";
}
```

### 单机模式

在conf目录下创建zoo.cfg配置文件

主要配置dataDir和dataLogDir
s

```sh
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just
# example sakes.
dataDir=/tmp/zookeeper
# the port at which the clients will connect
clientPort=2181
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
dataDir=/Users/lxl/Desktop/source_study/zookeeper/dataDir
dataLogDir=/Users/lxl/Desktop/source_study/zookeeper/dataLogDir
```

在standalone模式下启动服务端，Main Class选择ZookeeperServerMain

vmoption设置为

-Dlog4j.configuration=file:/Users/lxl/Desktop/source_code_study/zookeeper/conf/log4j.properties(zookeeper conf目录下的log4j.properties)

program arguments设置为

/Users/lxl/Desktop/source_code_study/zookeeper/conf/zoo.cfg(zookeeper conf目录下的zoo.cfg)

运行出现如上情况代表运行成功

### 伪集群模式

伪集群模式就是在本机模拟三个服务端节点

首先我们需要创建三份zoo.cfg

zoo.cfg

```sh
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just
# example sakes.
dataDir=/tmp/zookeeper
# the port at which the clients will connect
clientPort=2181
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
dataDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataDir1
dataLogDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataLogDir1
server.1=127.0.0.1:28888:3888
server.2=127.0.0.1:28889:3889
server.3=127.0.1.1:28890:3890
```

zoo2.cfg

```java
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just
# example sakes.
dataDir=/tmp/zookeeper
# the port at which the clients will connect
clientPort=2182
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
dataDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataDir2
dataLogDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataLogDir2
server.1=127.0.0.1:28888:3888
server.2=127.0.0.1:28889:3889
server.3=127.0.1.1:28890:3890
```

zoo3.cfg

```java
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just
# example sakes.
dataDir=/tmp/zookeeper
# the port at which the clients will connect
clientPort=2183
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
dataDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataDir3
dataLogDir=/Users/lxl/Desktop/source_code_study/zookeeper/dataLogDir3
server.1=127.0.0.1:28888:3888
server.2=127.0.0.1:28889:3889
server.3=127.0.0.1:28890:3890
```

可以看到三份配置文件都使用了不同的clientPort，dataDir以及dataLogDir

然后分别在三个dataDir创建myid文件，内容分别为1，2，3

分别运行三个服务端节点

### 常用配置项

### tickTime

Zookeeper服务器之间或客户端与服务器之间的心跳间隔，单位是毫秒

### initLimit

Follower启动后，会向Leader同步数据。需要在initLimit内完成同步。单位是心跳的个数。

### syncLimit

Leader通过心跳来确定集群的节点是否在线，如果Leader在发出心跳包之后syncLimit个心跳间隔之后还没有收到响应，那么会认为该节点已经下线。单位是心跳的个数。

### dataDir

用来指定当前节点存储快照文件的目录

### dataLogDir

存放事务日志的目录

### clientPort

客户端连接端口

### server.id=host:port1:port2

这个id也是dataDir目录下myid文件的内容。

host是该zk进程所在的IP地址，port1表示follower和leader交换消息所使用的端口，port2表示选举leader所使用的端口。

也可以使用下面的形式来指定当前节点为observer

server.id=host:port1:port2:observer

### 运行客户端

出现如上情况代表运行成功，此时可以在命令行中输入命令和zookeeper进行交互

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
