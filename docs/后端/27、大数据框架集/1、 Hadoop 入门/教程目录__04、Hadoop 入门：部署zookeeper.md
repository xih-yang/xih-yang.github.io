# 04、Hadoop 入门：部署zookeeper
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/4.html
- 分类：大数据框架
- 分组：教程目录
## 1. 获取zookeeper

[zookeeper3.6.3版本](https://www.apache.org/dyn/closer.lua/zookeeper/zookeeper-3.6.3/apache-zookeeper-3.6.3-bin.tar.gz)

## 2. 解压

`tar -xvf apache-zookeeper-3.6.3-bin.tar -C /sjj/install/`

## 3. 修改配置文件

- 新建文件夹 mkdir -p /sjj/install/apache-zookeeper-3.6.3-bin/zkdatas
- 进入conf目录 cd /sjj/install/apache-zookeeper-3.6.3-bin/conf
- 拷贝文件 cp zoo_sample.cfg zoo.cfg
- 编辑zoo.cfg文件 vim zoo.cfg

**主要修改了dataDir，autopurge，以及末尾追加了三行**

```java
  1 The number of milliseconds of each tick
  2 tickTime=2000
  3 The number of ticks that the initial 
  4 synchronization phase can take
  5 initLimit=10
  6 The number of ticks that can pass between 
  7 sending a request and getting an acknowledgement
  8 syncLimit=5
  9 the directory where the snapshot is stored.
 10 do not use /tmp for storage, /tmp here is just 
 11 example sakes.
 12 dataDir=/sjj/install/apache-zookeeper-3.6.3-bin/zkdatas
 13 the port at which the clients will connect
 14 clientPort=2181
 15 the maximum number of client connections.
 16 increase this if you need to handle more clients
 17maxClientCnxns=60
 18
 19 Be sure to read the maintenance section of the 
 20 administrator guide before turning on autopurge.
 21
 22 http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
 23
 24 The number of snapshots to retain in dataDir
 25 autopurge.snapRetainCount=3
 26 Purge task interval in hours
 27 Set to "0" to disable auto purge feature
 28 autopurge.purgeInterval=1
 29 
 30 Metrics Providers
 31
 32 https://prometheus.io Metrics Exporter
 33metricsProvider.className=org.apache.zookeeper.metrics.prometheus.PrometheusMetricsProvider
 34metricsProvider.httpPort=7000
 35metricsProvider.exportJvmInfo=true
 36 
 37 追加三行
 38 server.1=node001:2888:3888
 39 server.2=node002:2888:3888
 40 server.3=node003:2888:3888
```

## 4. 添加myid配置

`cd/sjj/install/apache-zookeeper-3.6.3-bin/zkdatas`

`echo 1 > /sjj/install/apache-zookeeper-3.6.3-bin/zkdatas/myid`

## 5. 安装包分发

`scp -r /sjj/install/apache-zookeeper-3.6.3-bin/ node002:/sjj/install/`

`scp -r /sjj/install/apache-zookeeper-3.6.3-bin/ node003:/sjj/install/`

## 6. 修改其余两台机器的myid

- node002

`echo 2 > /sjj/install/apache-zookeeper-3.6.3-bin/zkdatas/myid`

- node003

`echo 3 > /sjj/install/apache-zookeeper-3.6.3-bin/zkdatas/myid`

## 7. 配置环境变量（三台机器都需要

`sudo vim /etc/profile`

```java
# zookeeper环境配置
export ZK_HOME=/sjj/install/apache-zookeeper-3.6.3-bin
export PATH=$PATH:$ZK_HOME/bin
```

`source /etc/profile`

## 7. 启动zookeeper服务

- 启动 zkServer.sh start
- 查看 zkServer.sh status
- 停止 zkServer.sh stop

## 8. 注意

**关闭必须先关zookeeper再关虚拟机最后关闭电脑，不然很容易出错**
