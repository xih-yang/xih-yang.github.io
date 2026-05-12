# 03、Spark深入解析、Spark基础解析之Spark环境搭建（不同模式）
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/3.html
- 分类：大数据框架
- 分组：教程目录
## Local本地模式

### 安装

- 下载Spark安装包
- 下载地址：[http://spark.apache.org/downloads.html](http://spark.apache.org/downloads.html)
- 解压重命名

cd /export/servers

tar spark-2.2.0-bin-2.6.0-cdh5.14.0.tgz

mv spark-2.2.0-bin-2.6.0-cdh5.14.0 spark

> 注意：

如果有权限问题，可以修改为root，方便学习时操作，实际中使用运维分配的用户和权限即可

chown -R root /export/servers/spark

chgrp -R root /export/servers/spark

> 解压目录说明：

bin 可执行脚本

conf 配置文件

data 示例程序使用数据

examples 示例程序

jars 依赖 jar 包

python pythonAPI

R R 语言 API

sbin 集群管理命令

yarn 整合yarn需要的东西

### 启动spark-shell

> 开箱即用(解压完毕后即可使用，无需配置其他)

直接启动bin目录下的spark-shell

./spark-shell

- **spark-shell说明**

**1、** 直接使用./spark-shell；

表示使用local 模式启动，在本机启动一个SparkSubmit进程

**2、** 还可指定参数--master，如：；

spark-shell --master local[N] 表示在本地模拟N个线程来运行当前任务

spark-shell --master local[*] 表示使用当前机器上所有可用的资源

**3、** 不携带参数默认就是；

spark-shell --master local[*]

**4、** 后续还可以使用–master指定集群地址，表示把任务提交到集群上运行，如

./spark-shell --master spark://node01:7077

**5、** 退出spark-shell；

使用 :quit

### 初体验-读取本地文件

> 准备数据

```java
vim /tmp/words.txt 
添加以下数据：
hello me you her 
hello you her
hello her 
hello
```

> 代码实现

```java
//设置读取路径
val textFile = sc.textFile("file:///root/words.txt")
//处理数据
val counts = textFile.flatMap(_.split(" ")).map((_, 1)).reduceByKey(_ + _)
//收集结果
counts.collect
//结果数据
Array[(String, Int)] = Array((you,2), (hello,4), (me,1), (her,3))
```

### 初体验-读取HDFS文件

> 准备数据

```java
上传文件到hdfs
hadoop fs -put /tmp/words.txt /wordcount/input/words.txt
目录如果不存在可以创建
hadoop fs -mkdir -p /wordcount/input
结束后可以删除测试文件夹
hadoop fs -rm -r /wordcount
```

> 代码实现

```java
//读取文件
val textFile = sc.textFile("hdfs://node01:8020/wordcount/input/words.txt")
//处理数据
val counts = textFile.flatMap(_.split(" ")).map((_, 1)).reduceByKey(_ + _)
//手机结果，将处理后的结果数据存储到指定目录
counts.saveAsTextFile("hdfs://node01:8020/wordcount/output")
```

## Standalone集群模式

### 集群角色介绍

**Spark是基于内存计算的大数据并行计算框架**，实际中运行计算任务肯定式使用集群模式

- Standalone集群使用了分布式计算中的 master-slave 模型
- master是集群中含有master进程的节点
- slave是集群中的worker节点含有Executor进程

Spark架构图（官网）

### 集群规划

```java
//主节点
node01:master
//从节点1
node02:slave/worker  
//从节点2
node03:slave/worker 
```

### 修改配置并分发

> 修改Spark配置文件

```java
//进入以下目录
cd /export/servers/spark/conf
//复制配置文件并修改文件名
cp spark-env.sh.template spark-env.sh
```

> 添加以下配置（vim spark-env.sh）

```java
#配置java环境变量
export JAVA_HOME=/export/servers/jdk1.8
#指定spark Master的IP
export SPARK_MASTER_HOST=node01
#指定spark Master的端口
export SPARK_MASTER_PORT=7077
```

> 修改以下配置文件

```java
//复制该文件，修改其文件名，并添加配置
cp slaves.template slaves
```

> 添加以下配置（vim slaves）

```java
#设置slave工作者节点
node02
node03
```

配置spark环境变量 (建议不添加，避免和Hadoop的命令冲突)

将spark添加到环境变量,添加以下内容到 /etc/profile

```java
export SPARK_HOME=/export/servers/spark
export PATH=$PATH:$SPARK_HOME/bin
```

**注意：**

hadoop/sbin 的目录和 spark/sbin 可能会有命令冲突：

start-all.sh stop-all.sh

**解决方案：**

**1、** 把其中一个框架的sbin从环境变量中去掉；

**2、** 改名hadoop/sbin/start-all.sh改为:start-all-hadoop.sh；

通过scp 命令将配置文件分发到其他机器上

```java
scp -r /export/servers/spark node02:/export/servers
scp -r /export/servers/spark node03:/export/servers
scp /etc/profile root@node02:/etc
scp /etc/profile root@node03:/etc
source /etc/profile  刷新配置
```

### 启动和停止

集群启动和停止

```java
在主节点上启动spark集群
/export/servers/spark/sbin/start-all.sh 
```

单独启动和停止

在master 安装节点上启动和停止 master：

```java
start-master.sh
stop-master.sh
```

在Master 所在节点上启动和停止worker(work指的是slaves 配置文件中的主机名)

```java
start-slaves.sh
stop-slaves.sh
```

### 查看web界面

正常启动spark集群后，查看spark的web界面，查看相关信息。

http://node01:8080/（node01：节点IP）

**测试**

需求

```java
使用集群模式运行Spark程序读取HDFS上的文件并执行WordCount
```

集群模式启动spark-shell

```java
/export/servers/spark/bin/spark-shell --master spark://node01:7077
```

运行程序

```java
sc.textFile("hdfs://node01:8020/wordcount/input/words.txt")
.flatMap(_.split(" ")).map((_, 1)).reduceByKey(_ + _)
.saveAsTextFile("hdfs://node01:8020/wordcount/output2")
```

**注意**

集群模式下程序是在集群上运行的，不要直接读取本地文件，应该读取HDFS上的，因为程序运行在集群上。

## Standalone-HA高可用模式

### 原理

`Spark Standalone集群是Master-Slaves架构的集群模式`，和大部分的Master-Slaves结构集群一样，存在着Master单点故障的问题。

**如何解决这个单点故障问题，Spark提供了如下两种方案：**

- 第一种：基于文件系统的单点恢复（Single-Node Recovery with Local File System）---只能用于开发或者测试环境。
- 第二种：基于Zookeeper的Stand by Masters（Stand by Master with Zookeeper）---可以用于生产环境。

### 配置HA

HA方案使用起来很简单，首先启动一个ZooKeeper集群，然后在不同节点上启动Master，注意这些节点需要具有相同的zookeeper配置。

先停止Sprak集群

```java
/export/servers/spark/sbin/stop-all.sh 
```

在node01上配置：

```java
vim /export/servers/spark/conf/spark-env.sh
```

注释掉Master配置

```java
#export SPARK_MASTER_HOST=node01
```

在spark-env.sh添加SPARK_DAEMON_JAVA_OPTS，内容如下：

```java
export SPARK_DAEMON_JAVA_OPTS="-Dspark.deploy.recoveryMode=ZOOKEEPER  -Dspark.deploy.zookeeper.url=node01:2181,node02:2181,node03:2181  -Dspark.deploy.zookeeper.dir=/spark"
```

参数说明

```java
spark.deploy.recoveryMode：恢复模式
spark.deploy.zookeeper.url：ZooKeeper的Server地址
spark.deploy.zookeeper.dir：保存集群元数据信息的文件、目录。包括Worker、Driver、Application信息。
```

scp到其他节点

```java
scp /export/servers/spark/conf/spark-env.sh node02:/export/servers/spark/conf/
scp /export/servers/spark/conf/spark-env.sh node03:/export/servers/spark/conf/
```

### 启动Zookeeper集群

```java
//查看zk当前状态
zkServer.sh status
//启动zk（每个节点启动）
zkServer.sh start
//停止zk（每个节点停止）
zkServer.sh stop
```

- 一键启动/一键停止Zookeeper
- 参考链接： [https://blog.csdn.net/wzc8961661/article/details/104934721](https://blog.csdn.net/wzc8961661/article/details/104934721)

### 启动Spark集群

node01上启动Spark集群执行

```java
/export/servers/spark/sbin/start-all.sh
```

在node02上再单独只起个master:

```java
/export/servers/spark/sbin/start-master.sh
```

注意：

```java
在普通模式下启动spark集群
只需要在主节点上执行start-all.sh 就可以了
在高可用模式下启动spark集群
先需要在任意一台主节点上执行start-all.sh 
然后在另外一台主节点上单独执行start-master.sh
```

查看node01和node02

```java
http://node01:8080/
http://node02:8080/
可以观察到有一台状态为StandBy
```

### 测试HA

测试主备切换

```java
1.在node01上使用jps查看master进程id
2.使用kill -9 id号强制结束该进程
3.稍等片刻后刷新node02的web界面发现node02为Alive
```

测试集群模式提交任务

**1.集群模式启动spark-shell**

```java
/export/servers/spark/bin/spark-shell --master spark://node01:7077,node02:7077
```

**2.运行程序**

```java
sc.textFile("hdfs://node01:8020/wordcount/input/words.txt")
.flatMap(_.split(" ")).map((_, 1)).reduceByKey(_ + _)
.saveAsTextFile("hdfs://node01:8020/wordcount/output3")
```

## On Yarn集群模式

**官方文档**

[http://spark.apache.org/docs/latest/running-on-yarn.html](http://spark.apache.org/docs/latest/running-on-yarn.html)

### 准备工作

**1.安装启动Hadoop(需要使用HDFS和YARN，已经ok)**

**2.安装单机版Spark(已经ok)**

注意：不需要集群，因为把Spark程序提交给YARN运行本质上是把字节码给YARN集群上的JVM运行，但是得有一个东西帮我去把任务提交上个YARN，所以需要一个单机版的Spark，里面的有spark-shell命令，spark-submit命令

**3.修改配置**

在spark-env.sh ，添加HADOOP_CONF_DIR配置，指明了hadoop的配置文件的位置

vim/export/servers/spark/conf/spark-env.sh

```java
export HADOOP_CONF_DIR=/export/servers/hadoop/etc/hadoop
```

### Cluster模式

> 说明

**在企业生产环境中大部分都是Cluster模式运行Spark应用**

Spark On YARN的Cluster模式，指的是`Driver程序运行在YARN集群上`

> Driver是什么？

运行应用程序的main() 函数并创建SparkContext的进程

> 运行程序

`spark-shell`是一个简单的用来测试的交互式窗口

`spark-submit`用来提交打成jar包的任务

```java
//任意目录下均可运行以下命令
/export/servers/spark-2.2.0-bin-2.6.0-cdh5.14.0/bin/spark-submit \
--class org.apache.spark.examples.SparkPi \
--master yarn \
--deploy-mode cluster \
--driver-memory 1g \
--executor-memory 1g \
--executor-cores 2 \
--queue default \
/export/servers/spark-2.2.0-bin-2.6.0-cdh5.14.0/examples/jars/spark-examples_2.11-2.2.0.jar \
10
```

查看界面

http://node01:8088/cluster

### Client模式

说明

学习测试时使用，开发不使用

Spark On YARN的Client模式 指的是Driver程序运行在提交任务的客户端

运行程序测试

```java
/export/servers/spark-2.2.0-bin-2.6.0-cdh5.14.0/bin/spark-submit \
--class org.apache.spark.examples.SparkPi \
--master yarn \
--deploy-mode client \
--driver-memory 1g \
--executor-memory 1g \
--executor-cores 2 \
--queue default \
/export/servers/spark-2.2.0-bin-2.6.0-cdh5.14.0/examples/jars/spark-examples_2.11-2.2.0.jar \
10
```

### 两种模式的区别

Cluster和Client模式最本质的区别是：Driver程序运行在哪里！！！

**运行在YARN集群中的就是Cluster模式**

**运行在客户端的就是Client模式**

本质区别延伸出来的区别如下：

Cluster模式：生产环境中使用该模式

**1、** Driver程序运行在YARN集群中；

**2、** 应用的运行结果`不能在客户端显示`；

**3、** 该模式下Driver运行ApplicationMaster这个进程中，如果出现问题，YARN会重启ApplicationMaster（Driver）；

Client模式

**1、** Driver运行在Client上的SparkSubmit进程中；

**2、** 应用程序运行`结果会在客户端显示`；
