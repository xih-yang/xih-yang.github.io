# 03、Zookeeper 的客户端命令行操作
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/d-2/3.html
- 分类：注册中心
- 分组：ZooKeeper 教程（版本 B）
## 1. 命令行语法

命令基本语法
功能描述

help
显示所有操作命令

ls path
使用 ls 命令来查看当前 znode 的子节点 [可监听]
 -w  监听子节点变化
 -s   附加次级信息

create
普通创建
 -s  含有序列
 -e  临时（重启或者超时消失）

get path
获得节点的值 [可监听]
 -w  监听节点内容变化
 -s   附加次级信息

set
设置节点的具体值

stat
查看节点状态

delete
删除节点

deleteall
递归删除节点

启动客户端和显示所有操作命令：

```java
# 在服务器上启动客户端，并连接对应的服务器
zkCli.sh -server yangshibiao:2181
# 在zk内部显示所有操作命令
[zk: yangshibiao:2181(CONNECTED) 0] help
```

## 2. znode节点数据信息

## 2.1. 查看当前znode中所包含的内容

```java
[zk: yangshibiao:2181(CONNECTED) 1] ls /
```

## 2.2. 查看当前节点详细数据

```java
# 使用命令
ls -s /
# 具体展示
[zk: yangshibiao:2181(CONNECTED) 2] ls -s /
[zookeeper]cZxid = 0x0
ctime = Thu Jan 01 08:00:00 CST 1970
mZxid = 0x0
mtime = Thu Jan 01 08:00:00 CST 1970
pZxid = 0x0
cversion = -1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 0
numChildren = 1
```

> （1） czxid： 创建节点的事务 zxid，每次修改 ZooKeeper 状态都会产生一个 ZooKeeper 事务 ID。事务 ID 是 ZooKeeper 中所有修改总的次序。每次修改都有唯一的 zxid，如果 zxid1 小于 zxid2，那么 zxid1 在 zxid2 之前发生。
>
> （2） ctime： znode 被创建的毫秒数（从 1970 年开始）
>
> （3） mzxid： znode 最后更新的事务 zxid
>
> （4） mtime： znode 最后修改的毫秒数（从 1970 年开始）
>
> （5） pZxid： znode 最后更新的子节点 zxid尚硅谷技术之 Zookeeper
>
> （6） cversion： znode 子节点变化号， znode 子节点修改次数
>
> （7） dataversion： znode 数据变化号
>
> （8） aclVersion： znode 访问控制列表的变化号
>
> （9） ephemeralOwner： 如果是临时节点，这个是 znode 拥有者的 session id。如果不是临时节点则是 0。
>
> （10） dataLength： znode 的数据长度
>
> （11） numChildren： znode 子节点数量

## 3. Zookeeper中的节点类型（持久/短暂/有序号/无序号）

## 3.1. 分别创建2个普通节点（永久节点 + 不带序号）

```java
[zk: localhost:2181(CONNECTED) 0] create /youjiu1 "youjiu1_value"
Created /youjiu1
[zk: localhost:2181(CONNECTED) 1] create /youjiu1/youjiu2 "youjiu2_value"
Created /youjiu1/youjiu2
```

注意：创建节点时，要赋值

## 3.2. 获得节点的值

```java
[zk: localhost:2181(CONNECTED) 2] get -s /youjiu1
youjiu1_value
cZxid = 0xb
ctime = Tue Apr 05 20:53:04 CST 2022
mZxid = 0xb
mtime = Tue Apr 05 20:53:04 CST 2022
pZxid = 0xc
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 13
numChildren = 1
[zk: localhost:2181(CONNECTED) 3] get -s /youjiu1/youjiu2
youjiu2_value
cZxid = 0xc
ctime = Tue Apr 05 20:53:09 CST 2022
mZxid = 0xc
mtime = Tue Apr 05 20:53:09 CST 2022
pZxid = 0xc
cversion = 0
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 13
numChildren = 0
```

## 3.3. 创建带序号的节点（永久节点 + 带序号）

1）先创建带序号的节点（永久节点 + 带序号）

create /youjiu_youxuhao "youjiu_youxuhao_value"

2）创建带序号的节点

create -s /youjiu_youxuhao/zhangliao "zhangliao"

create -s /youjiu_youxuhao/zhangliao "zhangliao"

create -s /youjiu_youxuhao/xuchu "xuchu"

具体命令操作如下：

```java
[zk: localhost:2181(CONNECTED) 10] create /youjiu_youxuhao "youjiu_youxuhao_value"
Created /youjiu_youxuhao
[zk: localhost:2181(CONNECTED) 11] create -s /youjiu_youxuhao/zhangliao "zhangliao"
Created /youjiu_youxuhao/zhangliao0000000000
[zk: localhost:2181(CONNECTED) 12] create -s /youjiu_youxuhao/zhangliao "zhangliao"
Created /youjiu_youxuhao/zhangliao0000000001
[zk: localhost:2181(CONNECTED) 13] create -s /youjiu_youxuhao/xuchu "xuchu"
Created /youjiu_youxuhao/xuchu0000000002
[zk: localhost:2181(CONNECTED) 14] ls /youjiu_youxuhao
[xuchu0000000002, zhangliao0000000000, zhangliao0000000001]
```

如果原来没有序号节点，序号从 0 开始依次递增。 如果原节点下已有 2 个节点，则再排序时从 2 开始，以此类推，并且节点可以重名，因为生成的节点会带序号，实际存在Zookeeper中的节点名就不会相同。

## 3.4. 创建短暂节点（短暂节点 + 不带序号 or 带序号）

（1）创建短暂的不带序号的节点

create /sanguo "sanguo"

create -e /sanguo/wuguo "zhouyu"

（2）创建短暂的带序号的节点

create -e -s /sanguo/wuguo "zhouyu"

（3）在当前客户端是能查看到的

ls/sanguo

（4）退出当前客户端然后再重启客户端

quit

（5）再次查看根目录下短暂节点已经删除

ls/sanguo

具体操作命令如下：

```java
# 在第一个客户端中
[zk: localhost:2181(CONNECTED) 15] 
[zk: localhost:2181(CONNECTED) 15] create /sanguo "sanguo"
Created /sanguo
[zk: localhost:2181(CONNECTED) 16] create -e /sanguo/wuguo "zhouyu"
Created /sanguo/wuguo
[zk: localhost:2181(CONNECTED) 17] create -e -s /sanguo/wuguo "zhouyu"
Created /sanguo/wuguo0000000001
[zk: localhost:2181(CONNECTED) 18] ls /sanguo
[wuguo, wuguo0000000001]
[zk: localhost:2181(CONNECTED) 19] quit
WATCHER::
WatchedEvent state:Closed type:None path:null
2022-04-05 21:06:10,993 [myid:] - INFO  [main:ZooKeeper@1422] - Session: 0x1000040d26a0001 closed
2022-04-05 21:06:10,993 [myid:] - INFO  [main-EventThread:ClientCnxn$EventThread@524] - EventThread shut down for session: 0x1000040d26a0001
# 退出客户端并重进
[zk: localhost:2181(CONNECTED) 1] ls /
[sanguo, youjiu1, youjiu_youxuhao, zookeeper]
[zk: localhost:2181(CONNECTED) 2] ls /sanguo
[]
```

在第一个客户端中的截图：

退出客户端并重进发现短暂节点已删除：

## 3.5. 修改节点数据值

set/sanguo "sanguo_xiugai"

```java
[zk: localhost:2181(CONNECTED) 3] get /sanguo
sanguo
[zk: localhost:2181(CONNECTED) 4] set /sanguo "sanguo_xiugai"
[zk: localhost:2181(CONNECTED) 5] get /sanguo
sanguo_xiugai
```

## 4. Zookeeper中的节点删除与查看

## 4.1. 删除节点

delete /youjiu1/youjiu2

```java
[zk: localhost:2181(CONNECTED) 8] ls /youjiu1
[youjiu2, youjiu_youxuhao, youjiu_youxuhao_1]
[zk: localhost:2181(CONNECTED) 9] ls /youjiu1/youjiu2
[]
[zk: localhost:2181(CONNECTED) 10] delete /youjiu1/youjiu2
[zk: localhost:2181(CONNECTED) 11] ls /youjiu1/youjiu2
Node does not exist: /youjiu1/youjiu2
[zk: localhost:2181(CONNECTED) 12] ls /youjiu1
[youjiu_youxuhao, youjiu_youxuhao_1]
```

## 4.2. 递归删除节点

deleteall /youjiu1

```java
[zk: localhost:2181(CONNECTED) 13] ls /youjiu1
[youjiu_youxuhao, youjiu_youxuhao_1]
[zk: localhost:2181(CONNECTED) 14] deleteall /youjiu1
[zk: localhost:2181(CONNECTED) 15] ls /youjiu1
Node does not exist: /youjiu1
[zk: localhost:2181(CONNECTED) 16] ls /
[sanguo, youjiu_youxuhao, zookeeper]
```

## 4.3. 查看节点状态

stat /sanguo

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
