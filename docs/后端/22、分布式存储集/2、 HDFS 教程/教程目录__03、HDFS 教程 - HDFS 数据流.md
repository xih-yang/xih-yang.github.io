# 03、HDFS 教程 - HDFS 数据流
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/3.html
- 分类：分布式存储
- 分组：教程目录
## 3. HDFS 数据流

### 3.1 HDFS 写数据流程

#### 3.1.1 剖析文件写入

**1、** Client向NameNode通信请求上传文件，NameNode检查目标文件是否已经存在，父目录是否已经存在；

**2、** NameNode返回是否可以上传；

**3、** Client先对文件进行切分，请求第一个block该传输到哪些DataNode服务器上；

**4、** NameNode返回3个DataNode服务器DataNode1，DataNode2，DataNode3；

**5、** Client请求3台中的一台DataNode1(网络拓扑上的就近原则，如果都一样，则随机挑选一台DataNode)上传数据（本质上是一个RPC调用，建立pipeline），DataNode1收到请求会继续调用DataNode2，然后DataNode2调用DataNode3，将整个pipeline建立完成，然后逐级返回客户端；

**6、** Client开始往DataNode1上传第一个block（先从磁盘读取数据放到一个本地内存缓存），以packet为单位写入的时候DataNode会进行数据校验，它并不是通过一个packet进行一次校验而是以chunk为单位进行校验（512byte）DataNode1收到一个packet就会传给DataNode2，DataNode2传给DataNode3，DataNode1每传一个packet会放入一个应答队列等待应答；

**7、** 当一个block传输完成之后，Client再次请求NameNode上传第二个block的服务器；

#### 3.1.2 网络拓扑概念

在本地网络中，两个节点被称为“彼此近邻”是什么意思？

在海量数据处理中，其主要限制因素是节点之间数据的传输速率——带宽很稀缺

这里的想法是将两个节点间的带宽作为距离的衡量标准

**节点距离**：两个节点到达最近的共同祖先的距离总和

例如，假设有 数据中心d1 机架r1 中的节点 n1，该节点可以表示为/d1/r1/n1，利用这种标记，这里给出四种距离描述：

```java
Distance(/d1/r1/n1, /d1/r1/n1)=0（同一节点上的进程）
Distance(/d1/r1/n1, /d1/r1/n2)=2（同一机架上的不同节点）
Distance(/d1/r1/n1, /d1/r3/n2)=4（同一数据中心不同机架上的节点）
Distance(/d1/r1/n1, /d2/r4/n2)=6（不同数据中心的节点）
```

#### 3.1.3 机架感知（副本节点选择）

官方介绍：

```java
http://hadoop.apache.org/docs/r2.7.3/hadoop-project-dist/hadoop-common/RackAwareness.html
http://hadoop.apache.org/docs/r2.7.3/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html#Data_Replication
```

##### 3.1.3.1 低版 本Hadoop 副本节点选择

第一个副本在 Client 所处的节点上，如果客户端在集群外，随机选一个

第二个副本和第一个副本位于不相同机架的随机节点上

第三个副本和第二个副本位于相同机架，节点随机

##### 3.1.3.2 Hadoop 2.9.2 副本节点选择

第一个副本在 Client 所处的节点上,如果客户端在集群外，随机选一个。

第二个副本和第一个副本位于相同机架，随机节点

第三个副本位于不同机架，随机节点

### 3.2 HDFS 读数据流程

**1、** 与NameNode通信查询元数据，找到文件块所在的DataNode服务器；

**2、** 挑选一台DataNode（网络拓扑上的就近原则，如果都一样，则随机挑选一台DataNode）服务器，请求建立socket流；

**3、** DataNode开始发送数据(从磁盘里面读取数据放入流，packet（一个packet为64kb）为单位来做校验)；

**4、** 客户端以packet为单位接收，先在本地缓存，然后写入目标文件；
