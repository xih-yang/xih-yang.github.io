# 01、Zookeeper 基本介绍
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-3/1.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 C）
## zppkeeper是什么

zookeeper是一个高性能、开源的分布式应用协调服务，它提供了简单原始的功能，分布式应用可以基于它实现更高级的服务，比如实现同步(分布式锁)、配置管理、集群管理。它被设计为易于编程，使用文件系统目录树作为数据模型。服务端使用Java语言编写，并且提供了Java和C语言的客户端。

> note:分布式的意味着由多台计算机构成的集群，每台计算机之间通过网络通信，这些计算机协调完成共同的目标，对外看来这些机器就是一个整体；协调的意思是多个节点一起完成某一个动作

## zookeeper数据模型

如下图所示，zookeeper数据模型是一种分层的树形结构：

- 树形结构中每个节点称为Znode;
- 每个Znode都可以有数据(byte[]类型)，也可以有子节点;
- Znode的路径使用斜线分割，例如：/Zoo/Duck，zookeeper中没有相对路径的说法，也即所有节点的路径都要写为绝对路径的方式；
- zookeeper定义了org.apache.zookeeper.data.Stat数据结构来存储数据的变化、ACL(访问权限)的变化和时间戳；
- 当zookeeper中节点的数据发生变化时，版本号会递增；
- 可以对Znode中的数据进行读写操作；

## zookeeper典型的应用场景

### 数据发布/订阅

数据发布/订阅即所谓的配置中心：发布者将数据发布到zk的一个或一系列节点上，订阅者进行数据订阅，可以及时得到数据的变化通知，如下图所示：

应用A将数据发布到zkServer的某个节点(Znode)上，应用B和C会先在zkServer上注册监听该节点的watcher(相当于Listener，基于RPC实现)，一旦该节点有数据变化，B和C上的watcher变化得到通知，继而从zkServer上获取最新的数据

### 负载均衡

zookeeper实现负载均衡本质上是利用zookeeper的配置管理功能，zookeeper实现负载均衡的步骤为：

**1、** 服务提供者把自己的域名及IP端口映射注册到zookeeper中；

**2、** 服务消费者通过域名从zookeeper中获取到对应的IP及端口，这里的IP及端口可能有多个，只是获取其中一个；

**3、** 当服务提供者宕机时，对应的域名与IP的对应就会减少一个映射；

**4、** 阿里的dubbo服务框架就是基于zookeeper来实现服务路由和负载；

### 命名服务

在分布式系统当中，命名服务(name service)也是很重要的应用场景，通过zookeeper也可以实现类似于J2EE中JNDI的效果；分布式环境下，命名服务更多的是资源定位，并不是真正的实体资源，其本质也是到zookeeper的集中配置和管理

### 分布式协调/通知

例如通过zookeeper的watcher和通知机制实现分布式锁和分布式事物

### 集群管理

获取当前集群中机器的数量、集群中机器的运行状态、集群中节点的上下线操作、集群节点的统一配置等

此外还可以通过zookeeper实现集群master节点的选举、分布式锁(排他锁、共享锁)、分布式队列等。

## zookeeper中的一些基本概念

### 集群角色

- **Leader**: 为客户端提供读写服务；
- **Follower**: 为客户端提供度服务，客户端到Follower的写请求会转交给Leader角色，Follower会参与Leader的选举；
- **Observer**：为客户端提供度服务，不参与Leader的选举过程，一般是为了增强zookeeper集群的读请求并发能力；

### 会话(Session)

- session是客户端与zookeeper服务端之间建立的长链接；
- zookeeper在一个会话中进行心跳检测来感知客户端链接的存活；
- zookeeper客户端在一个会话中接收来自服务端的watch事件通知；
- zookeeper可以给会话设置超时时间；

### zookeeper的数据节点(ZNode)

- Znode是zookeeper树形结构中的数据节点，用于存储数据；
- Znode分为持久节点和临时节点两种类型：
- 持久节点：一旦创建，除非主动调用删除操作，否则一直存储在zookeeper上；
- 临时节点：与客户端回话绑定，一旦客户端失效，这个客户端创建的所有临时节点都会被删除；
- 可以为持久节点或临时节点设置Sequential属性，如果设置该属性则会自动在该节点名称后面追加一个整形数字

### zookeeper中的版本

zookeeper中有三种类型的版本：

- Version：代表当前Znode的版本；
- Cversion：代表当前Znode的子节点的版本，子节点发生变化时会增加该版本号的值；
- Aversion：代表当前Znode的ACL(访问控制)的版本，修改节点的访问控制权限时会增加该版本号的值；

### zookeeper中的watcher

- watcher监听在Znode节点上；
- 当节点的数据更新或子节点的状态发生变化都会使客户端的watcher得到通知；

### zookeeper中的ACL(访问控制)

类似于Linux/Unix下的权限控制，有以下几种访问控制权限：

- CREATE：创建子节点的权限；
- READ：获取节点数据和子节点列表的权限；
- WRITE：更新节点数据的权限；
- DELETE: 删除子节点的权限；
- ADMIN：设置节点ACL的权限；

> note: CREATE和DELETE是针对子节点的权限控制

## zookeeper的部署模式

zookeeper可以单机部署或集群部署，生产环境下一定要使用集群部署，开发测试可以使用单机部署。当然在单机环境下也可以通过修改端口或使用docker实现集群部署。这里我们只演示单机部署和单机下通过修改端口实现集群部署，docker部署以后有空再研究。

### zookeeper单机部署

下载zookeeper安装包，解压即可，解压目录的`/home/peter/Study/Zookeeper/zookeeper-3.4.13/conf`目录下如果没有`zoo.cfg`，则将`zoo_sample.cfg`文件拷贝一份，重命名为`zoo.cfg`。

`zoo.cfg`的最小配置如下：

- tickTime=2000：zookeeper定义的时间单位，zookeeper使用它的倍数来表示系统内部时间间隔配置
- initLimit=10：用于leader等待follow启动和数据同步完成后的时间，它不是具体的时间，initLimit * tickTime才是真正的时间，默认值是10，也就是follow最多有20秒的时间来启动和同步leader的数据，当集群中节点较多时，可以适当将该值调大；
- syncLimit=5：用于leader和follow之间的心跳检测的最大延迟时间，超过这个时间表示follow已经脱离了leader所在的网络环境，同样的 syncLimit * tickTime才是它真正的时间，如果网络环境不稳定，可以适当调大该值；
- dataDir=/tmp/zookeeper: 数据持久化目录，zookeeper中的数据会持久化到dataDir指定的目录下；
- clientPort=2181：客户端链接zookeeper的端口；

切换到zookeeper解压目录下，执行如下命令前台启动zookeeper：

```java
$ bin/zkServer.sh start-foreground
```

切换到zookeeper解压目录，执行如下命令启动客户端链接zookeeper：

```java
$ bin/zkCli.sh
```

默认情况下zookeeper客户端链接的地址是localhost:2181，若需要指定zookeeper地址加上`-server`选项即可：

```java
$ bin/zkCli.sh -server localhost:2181
```

### 单机下修改端口实现集群部署

复制三份解压后的zookeeper代码，并创建三个存储zookeeper数据的目录，如下图所示：

在三个数据目录下分别创建名称为myid的文件，文件内容是一个数字，代表集群中的第几个节点，如下图所示：

`zookeeper-3.4.12.r1`的 `zoo.cfg`配置如下：

```java
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/home/peter/Study/Zookeeper/zookeeper-r1-datadir
clientPort=2181
server.1=localhost:2888:3888
server.2=localhost:2889:3889
server.3=localhost:2890:3890
```

`zookeeper-3.4.12.r2`的`zoo.cfg`配置如下：

```java
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/home/peter/Study/Zookeeper/zookeeper-r2-datadir
clientPort=2182
server.1=localhost:2888:3888
server.2=localhost:2889:3889
server.3=localhost:2890:3890
```

`zookeeper-3.4.12.r3`的`zoo.cfg`配置如下：

```java
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/home/peter/Study/Zookeeper/zookeeper-r3-datadir
clientPort=2183
server.1=localhost:2888:3888
server.2=localhost:2889:3889
server.3=localhost:2890:3890
```

三个配置中不同的配置项为`dataDir`和`clientPort`，这也容易理解，因为在同一台机器上跑三个zookeeper服务，这三个zookeeper服务监听的客户端链接端口(clientPort)必须不一样，在真实生产集群上所有机器上clientPort最好一样，dataDir是zookeeper服务保存快照数据的目录，因为在同一台机器上跑三个zookeeper服务，这个配置也必须不一样。

剩下三个相同配置项`server.1`、`serer.2`、`server.3`代表集群中所有的机器，数字1是机器序列号，和zookeeper-r1-datadir目录下myid文件中的数字一致，范围为1~255；`localhost:2888:3888`表示zookeeper集群中某一台机器的ip为localhost，2888是follow服务器和leader服务器之间通信和数据同步的端口，3888是选举过程中投票通信端口。

在终端下分别启动三个zookeeper服务：

```java
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r1$ bin/zkServer.sh start-foreground
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r2$ bin/zkServer.sh start-foreground
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r3$ bin/zkServer.sh start-foreground
```

> note: 启动过程中如果现实端口已被占用，先执行lsof -i:2181查看占用2181端口的进程再用kill -9 2181结束该进程，重新启动zookeeper即可

客户端测试连接：

```java
// 测试能否连接第一个节点
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r3$ bin/zkCli.sh -server localhost:2181
// 测试能否连接第二个节点
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r3$ bin/zkCli.sh -server localhost:2182
// 测试能否连接第三个节点
peter@ubuntu:~/Study/Zookeeper/zookeeper-3.4.13-r3$ bin/zkCli.sh -server localhost:2183
// 在连接第一个节点的客户端上创建节点
[zk: localhost:2181(CONNECTED) 0] create /clustertest1 clustertest1data
Created /clustertest1
// 在连接第二个节点的客户端上观察节点是否创建成功
[zk: localhost:2182(CONNECTED) 0] ls /
[zookeeper]
[zk: localhost:2182(CONNECTED) 1] ls /
[clustertest1, zookeeper]
// 在连接第二个节点的客户端上观察节点是否创建成功
[zk: localhost:2183(CONNECTED) 0] ls /    
[zookeeper]
[zk: localhost:2183(CONNECTED) 1] ls /
[clustertest1, zookeeper]
```

### zookeeper的基本操作命令

### 帮助命令

进入客户端后输入help(实际上输入任何zookeeper无法识别的命令都会显示帮助命令)会显示所有命令及其语法，如下所示：

```java
[zk: localhost:2181(CONNECTED) 0] help
ZooKeeper -server host:port cmd args
    stat path [watch]
    set path data [version]
    ls path [watch]
    delquota [-n|-b] path
    ls2 path [watch]
    setAcl path acl
    setquota -n|-b val path
    history 
    redo cmdno
    printwatches on|off
    delete path [version]
    sync path
    listquota path
    rmr path
    get path [watch]
    create [-s] [-e] path data acl
    addauth scheme auth
    quit 
    getAcl path
    close 
    connect host:port
```

### ls path [watch]

其中path指定数据节点的路径，加上watch参数表示监听path路径下所有子节点的变化，ls命令的作用是列出指定节点下的所有子节点，ls只能查看第一级的所有子节点。

如下所示不加watch只列出根节点(/)下的所有子节点：

```java
[zk: localhost:2181(CONNECTED) 2] ls /
[watchertest3, acl, zookeeper, watchertest1]
```

加上watch参数后如果有其他客户端在根节点(/)下创建了新的节点，则当前链接的客户端端会得到通知，如下所示

```java
现在当前客户端执行
[zk: localhost:2181(CONNECTED) 3]  ls / watch
[watchertest3, acl, zookeeper, watchertest1]
然后另外一个客户端在根节点下创建子节点
[zk: localhost:2181(CONNECTED) 1] create /watchtest2 watchtestdata
Created /watchtest2
这时当前客户端得到如下事件通知，事件类型为NodeChildrenChanged：
[zk: localhost:2181(CONNECTED) 3]  ls / watch
[watchertest3, acl, zookeeper, watchertest1]
[zk: localhost:2181(CONNECTED) 4] 
WATCHER::
WatchedEvent state:SyncConnected type:NodeChildrenChanged path:/
```

### create [-s] [-e] path data acl命令

该命令的作用是创建zookeeper节点，-s选项代表创建的节点具有顺序的属性，-e选项代表创建的是临时节点，默认情况下创建的是持久节点，path为节点的全路径，data为创建节点中的数据，acl用来进行权限控制，默认情况下不做任何权限控制。

如下所示命令为在根节点下创建watchtest2子节点，节点中的数据为watchtestdata：

```java
[zk: localhost:2181(CONNECTED) 1] create /watchtest2 watchtestdata
Created /watchtest2
```

### get path [watch]命令

获取path节点的数据内容和属性信息，watch选项作用同ls命令。如下示例所示：

```java
[zk: localhost:2181(CONNECTED) 5] get /watchtest2
watchtestdata   // 节点中的数据
cZxid = 0x4d    // 创建该节点的事务id
ctime = Thu Sep 13 07:31:24 PDT 2018  // 节点创建时间
mZxid = 0x4d    // 最后一次更新该节点的事务id
mtime = Thu Sep 13 07:31:24 PDT 2018  // 最后一次更新时间
pZxid = 0x4d  
cversion = 0   // 子节点版本
dataVersion = 0  // 该节点数据版本
aclVersion = 0  // 该节点访问控制权限的版本
ephemeralOwner = 0x0
dataLength = 13
numChildren = 0
```

这些属性信息和zookeeper中`org.apache.zookeeper.data.Stat`类中的成员一一对应。

### set path data [version]命令

该名的作用是更新path路径节点的数据内容，data为更新的数据，version为指定数据被更新的版本，如果version比当前的dataVersion还小，则会报错。

如下所示：

```java
[zk: localhost:2181(CONNECTED) 5] get /watchtest2
watchtestdata
cZxid = 0x4d
ctime = Thu Sep 13 07:31:24 PDT 2018
mZxid = 0x4d
mtime = Thu Sep 13 07:31:24 PDT 2018
pZxid = 0x4d
cversion = 0
dataVersion = 0   // 刚创建的节点dataVersion为0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 13
numChildren = 0
[zk: localhost:2181(CONNECTED) 6] set /watchtest2 watchtest2changeddata
cZxid = 0x4d
ctime = Thu Sep 13 07:31:24 PDT 2018
mZxid = 0x4e
mtime = Thu Sep 13 07:54:27 PDT 2018
pZxid = 0x4d
cversion = 0
dataVersion = 1  // 修改完后dataVersion为1
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 21
numChildren = 0
[zk: localhost:2181(CONNECTED) 7] set /watchtest2 watchtest2changeddata 0  // 再次修改指定版本为0报错
version No is not valid : /watchtest2
```

### delete path [version]命令

删除路径为path的节点，version指定被删除数据的版本，一般不指定，表示删除最新的数据版本，若version为旧的版本则会报错。

如下示例所示：

```java
[zk: localhost:2181(CONNECTED) 8] delete /watchtest2 0  // 当前的数据版本为1，指定的0为旧版本数据，报错
version No is not valid : /watchtest2
[zk: localhost:2181(CONNECTED) 9] delete /watchtest2  
[zk: localhost:2181(CONNECTED) 10] ls /watchtest2
Node does not exist: /watchtest2
[zk: localhost:2181(CONNECTED) 11] ls /          
[watchertest3, acl, zookeeper, watchertest1]
```

zookeeper还有其他一些命令，这里不一一举例，使用时help查看即可。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
