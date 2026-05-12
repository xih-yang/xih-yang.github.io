# 15、Zookeeper 源码解析 - 数据日志文件归档
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/1/15.html
- 分类：注册中心
- 分组：教程目录
## 1. 日志文件概述

### 1.1 作用说明

`ZK`框架不依赖于我们所理解的常规数据库，但服务器运行时需要记录处理过的客户端请求，`ZK`的处理方式则是将请求信息序列化到文件中。`ZK`将日志请求分为两种：

- 事务日志：用于记录接收过的每个客户端请求，里面会保存接收时间、cxid值、zxid值、操作类型、操作路径和请求数据；事务日志文件的核心作用有两个：

**1、** 根据日志文件可快速查阅在什么时间点服务端处理过什么操作，方便排查问题；

**2、** 在`ZK`服务器启动时，会将事务日志中`zxid`大于最新快照的`zxid`的请求再处理一遍，防止请求遗漏；

- 快照日志：在ZK服务器运行了一定的时间后或处理了一定的请求后，将ZK服务器当前状态记录并保存到文件中，形成快照文件，因此快照文件的数据就是某一时刻ZK服务器的数据记录；其作用在于ZK服务器重启时，可以读取最新的快照文件，恢复到上次停止时的状态。

上面一些名词的简单说明：

- cxid值：客户端每次请求cxid都会+1，初始值为1，在客户端的属性名为xid；
- zxid值：事务唯一ID，ZK服务端的全局变量，能够保证请求事务的唯一性。

### 1.2 日志文件格式

如果要看事务日志文件的内容，`ZK`官方提供了对应的可执行`Main`函数类`LogFormatter`和`SnapshotFormatter`，其中`LogFormatter`针对的是`ZK`的事务日志文件，`SnapshotFormatter`则是针对`ZK`的快照日志文件。

若想要直接使用`Idea`编译器来查看日志文件，以事务日志文件为例，只需要进入到类`LogFormatter`中，点击执行按钮，在弹窗的`Program arguments`一栏中填入需要查看的事务日志文件的路径即可，如下图：

一般而言直接执行会因为事务日志的内容太多，而导致`Idea`的控制台无法全部展示，此时只需要再配置控制台的输出重定向就可以了，如下图：

`ZK`的事务日志文件需要从`ZK`的服务器日志目录拉取，经过上面两种配置就可以顺利把`ZK`的事务日志文件读取并输出到对应的本地文件中了。

如果要解析快照日志文件，只需要进入`SnapshotFormatter`再重复上述两个步骤即可，但最好重定向的文件名不要一致。

#### 1.2.1 事务日志文件解析

先从事务日志文件的命名格式开始说起，事务日志的文件名是 **log.+事务日志文件中第一个请求事务的zxid**，解析重定向到本地文件中格式如下：

```java
{time}" session 0x"{clientId}" cxid 0x"{cxid}" zxid 0x"{zxid}"  "{type}" "{txnContent}
```

以下为真实数据内容：

```java
ZooKeeper Transactional Log File with dbid 0 txnlog format version 2
22-1-21 下午09时57分00秒 session 0x37c82be90ee01c9 cxid 0x2642ac zxid 0x22000595ba create '/XXXX/XXXX/X/XX/X,,v{s{31,s{'world,'anyone}}},T,433040
22-1-21 下午09时57分00秒 session 0x37c82be90ee01c9 cxid 0x2642b8 zxid 0x22000595bc delete '/XXXX/XXXX/X/XX/X
22-1-21 下午09时58分44秒 session 0x17dbd96b867001a cxid 0x263b2 zxid 0x22000595ce setData '/XX/XXXXX/XXX/X,XXXXXXX,52086
```

第一行用来标识本`ZK`事务日志文件所支持的`jar`包版本，避免不同事务格式日志文件混用报错。从日志文件内容可以得到`session`的`clientId`、`cxid`、`zxid`和操作类型，都是16进制，具体的`txnContent`内容每个请求都各不相同。根据本日志文件可以得到具体时间点的具体操作及内容，从而实现生产问题排查。

在`ZK`重启时，会根据事务日志文件名的`zxid`判断具体应该读取哪个事务日志文件，读取出来后再使用zxid去过滤已经处理过的请求，从而实现恢复到`ZK`停止前的状态。

#### 1.2.2 快照日志文件解析

快照日志文件名的格式为：**snapshot.+服务器最新的zxid**，事务日志的格式如下：

```java
ZNode Details (count={nodeCount}):
----
/
  cZxid = {cZxid}
  ctime = {ctime}
  mZxid = {mZxid}
  mtime = {mtime}
  pZxid = {pZxid}
  cversion = {cversion}
  dataVersion = {dataVersion}
  aclVersion = {aclVersion}
  ephemeralOwner = {ephemeralOwner}
  dataLength = {dataLength}
----
/
省略N个被序列化的快照节点信息
----
Session Details (sid, timeout, ephemeralCount):
{sessionId}, {timeout}, {ephemeralCount}
以下忽略N个session的超时信息
```

快照日志的信息看起来信息很多，但实际上基本都是`DataNode`中的`StatPersisted stat`成员属性，接下来挨个分析一下各个属性的代表含义：

**1、**`nodeCount`：快照文件中所包含的节点数量；

**2、**`cZxid`：创建该节点请求的`zxid`；

**3、**`ctime`：创建该节点的请求时间；

**4、**`mZxid`：最后修改节点的请求`zxid`；

**5、**`mtime`：最后修改节点的请求时间；

**6、**`pZxid`：增加删除节点时，操作父节点与当前节点的请求`zxid`值，因此如果有父子关系，则节点的`pZxid`会一致，且子节点的`cZxid`会与`pZxid`一致；

**7、**`cversion`：节点创建版本值，取值为父节点的`cversion+1`，因此子节点的值一定是比父节点要大的；

**8、**`dataVersion`：数据节点版本，主要由客户端控制；

**9、**`aclVersion`：如果为新增节点，值为0，如果为客户端发送的`setAcl`请求，则取决于客户端传值；

**10、**`ephemeralOwner`：是否是临时节点，如果不是则值为0，是则为某个客户端的sessionId值；

**11、**`dataLength`：节点成员属性`byte[]data`数组的长度；

**12、**`sessionId`：与客户端一一对应的唯一值，初始值为0，每当一个新的客户端连接进来，则+1，在集群中能够代表具体哪台客户端机器；

**13、**`timeout`：客户端的失效时间；

**14、**`ephemeralCount`：客户端下有多少个临时节点的数量值；

一共14个不同的参数，有几个参数的值内容值得推敲，实际快照日志文件内容如下：

```java
ZNode Details (count={nodeCount}):
----
/kafka1/brokers/topics/X.XX.XXX/partitions/11
  cZxid = 0x00002200053b0f
  ctime = Thu Jan 20 10:16:29 CST 2022
  mZxid = 0x00002200053b0f
  mtime = Thu Jan 20 10:16:29 CST 2022
  pZxid = 0x00002200053b2c
  cversion = 1
  dataVersion = 0
  aclVersion = 0
  ephemeralOwner = 0x00000000000000
  no data
----
/kafka1/brokers/topics/X.XX.XXX/partitions/11/state
  cZxid = 0x00002200053b2c
  ctime = Thu Jan 20 10:16:29 CST 2022
  mZxid = 0x00002200053b2c
  mtime = Thu Jan 20 10:16:29 CST 2022
  pZxid = 0x00002200053b2c
  cversion = 0
  dataVersion = 0
  aclVersion = 0
  ephemeralOwner = 0x00000000000000
  dataLength = 72
----
Session Details (sid, timeout, ephemeralCount):
0x17c82be90e20023, 10000, 1
0x17c82be90e20024, 40000, 25
```

从上面的简单例子便可以看出，可以通过`cZxid`和`pZxid`确认第一个节点是第二个节点的父节点，因为第一个节点`cZxid`和`pZxid`不一致，但是第二个节点两个属性的值是一致的。

## 2. 日志文件序列化

### 2.1 日志路径配置

如果要说日志文件的序列化，那首先是需要搞定出文件要被序列化在哪里并从哪里读取反序列化。`ZK`启动前可在`properties`配置文件中配置`dataDir`和`dataLogDir`属性来确定事务、快照日志文件路径。除了配置`properties`文件中的路径属性，也可以以参数传入，参数传入则只能有三个参数，第二个参数为路径属性，且`dataDir`=`dataLogDir`。

其中会先加载`dataDir`路径文件，再去加载`dataLogDir`路径文件，需要注意：**dataDir=snapLog，dataLogDir=txnLog**。所以实际上是先加载快照日志文件，再去加载事务日志文件，先从快照日志文件获取`ZK`停机前最新的`zxid`（如果有的话），再使用获取到的`zxid`去过滤事务日志文件中已经被处理过的请求，防止重复消费。

### 2.2 序列化时机

前面确定了`ZK`日志文件的存储位置，那么问题来了，`ZK`是如何判断当前应该进行写文件及归档呢？总不可能让请求信息一直无限制增加吧？所以肯定`ZK`会有个阈值，超过这个阈值后就进行一次归档，且最好要是可配的。

`ZK`也确实是这样做的，`ZK`服务器可配置`zookeeper.snapCount`属性，用来控制快照文件的数量，默认值大小为`100000`。服务器设置归档的范围是`[0,snapCount/2] + snapCount/2`，如果要保证可以有数字随机，其值最低只能为`2`，如果是`1`，随机的范围就只有`0`了，不符合随机要求。

只要看过前面`ZK`源码的小伙伴，就会知道`ZK`服务器在处理客户端的请求时，一定会经过`SyncRequestProcessor`处理器，这个处理器就是用来统计已处理的请求数量并判断是否超过阈值需要进行归档。判断流程图如下：

流程中有以下几点需要注意：

- randRoll在每个归档周期内都会重新设置随机值，随机范围[0,snapCount/2]，其目的在于动态伸缩ZK的日志归档大小。这样做的原因在于ZK会向集群内的所有机器同步请求，如果归档大小都是一样的，一段时间内所有的机器都在进行归档，占用IO，从导致集群在这一段时间的性能降低；如果归档时间不一样，就可以保证集群总体而言性能不会由于IO使用而降低太多；
- 当SyncRequestProcessor请求接收到requestOfDeath固定请求，则说明ZK由于某种原因需要关闭，此时将会退出死循环，否则将一直运行下去，即使轮询不到请求；
- 要添加到事务日志文件中，TxnHeader必须不为空，读操作的hdr和txn都是空，所以读请求不会写入事务日志中，写请求操作诸如create、set、delete等，都是可以成功添加到事务日志中的；
- randRoll随机范围是[0,snapCount/2]，事务日志的阈值范围是[snapCount/2,snapCount]，每当有一个事务请求添加到事务日志中，logCount将会+1；
- 在超过事务日志阈值前，事务请求都是被保存在BufferedOutputStream缓存中的，只要超过阈值后，事务日志才会写到文件中，且快照日志进行归档，logCount清零；
- 一台机器同时只会操作一个快照日志文件，如果上一次的文件还没写入完成，则下次快照归档会跳过；

除了上面几点外，还需要特别注意`toFlush`集合，该集合需要注意两点：

**1、** 事务请求添加到`toFlush`集合的情况：；

**1、** 当事务请求添加到事务文件成功时；

**2、** 添加到事务文件失败且`toFlush`集合不为空；

**2、** 清空`toFlush`集合事务请求，并将里面的事务请求交给下个`RequestProcessor`处理的情况：；

**1、**`toFlush`集合不为空，且无新的请求进入`SyncRequestProcessor`处理器时；

**2、** 新的`toFlush`请求进入，添加到事务日志文件失败且`toFlush`集合为空，直接交给下个`RequestProcessor`处理；

**3、** 当事务请求添加到`toFlush`集合成功，且集合数量大于`1000`时，主动清空集合，并将里面的请求全部交给下个`RequestProcessor`处理；

对于`toFlush`集合的操作，结合流程图应该大致能搞懂里面的逻辑，如果觉得很绕，结合源码再来看这些注意点就能够很轻松的搞懂了。

### 2.3 日志文件的管理

进行归档时会实例化一个`ZooKeeperThread`类型的线程对象，执行`takeSnapshot()`方法生成快照日志文件，而事务日志文件只需要将`BufferedOutputStream`缓存中的刷到文件中即可。

`ZK`往复执行上面的归档流程，如果没有对日志文件进行管理的机制，那就肯定是需要人工定时维护的，从`3.4.X`版本开始，支持配置两个属性来定时清理日志文件，如下：

**1、** 可在`properties`属性文件中配置`autopurge.purgeInterval`属性，用来设置间隔多久进行清理，单位小时`h`，默认值`0`，即不清理，所以如果要配最小清理间隔为`1h`；

**2、** 配置`autopurge.snapRetainCount`属性用来控制需要保留的快照文件数量`snapRetainCount`属性，默认值为`3`，最小值可配为`3`，配了之后将会保留最新的`snapRetainCount`个快照日志文件；

**注：上述的autopurge.snapRetainCount属性只控制快照日志文件，事务请求文件会清理比快照文件zxid最小还要小的。以下面为例：**

假设现在快照文件共有6个，事务日志文件共有6个：

序号
快照日志文件名
事务日志文件名

1
snapshot.1
log.1

2
snapshot.3
log.2

3
snapshot.5
log.4

4
snapshot.7
log.5

5
snapshot.9
log.7

6
snapshot.10
log.8

假设`autopurge.snapRetainCount`属性为默认的`3`，清理后的日志文件为：

序号
快照日志文件名
事务日志文件名

1
-
-

2
-
-

3
-
-

4
snapshot.7
-

5
snapshot.9
log.7

6
snapshot.10
log.8

因为快照日志文件最小的`zxid`为`7`，因此事务日志文件名的`zxid`小于`7`的都要删除。
