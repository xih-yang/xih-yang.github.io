# 02、Hadoop 教程 - Hadoop的安装和部署
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/2.html
- 分类：大数据框架
- 分组：教程目录
## 1. Hadoop的安装部署

关于Hadoop的安装和部署在博主的其他博文中已有介绍，可以参考如下链接：

[Apache Hadoop 3.x 版本的安装和配置](/zhuanlan/bigdata/hadoop/3/39.html)

[Apache Hadoop 3.x 版本的HA高可用配置和部署](/zhuanlan/bigdata/hadoop/3/40.html)

## 2. Hadoop的目录结构

Hadoop中的目录结构如下所示：

```java
drwxr-xr-x.  bin
drwxr-xr-x.  etc
drwxr-xr-x.  include
drwxr-xr-x.  lib
drwxr-xr-x.  libexec
-rw-r--r--.  LICENSE.txt
-rw-r--r--.  NOTICE.txt
-rw-r--r--.  README.txt
drwxr-xr-x.  sbin
drwxr-xr-x.  share
```

重要目录和介绍如下所示：

```java
（1）bin目录：存放对Hadoop相关服务（hdfs，yarn，mapred）进行操作的脚本
（2）etc目录：Hadoop的配置文件目录，存放Hadoop的配置文件
（3）lib目录：存放Hadoop的本地库（对数据进行压缩解压缩功能）
（4）sbin目录：存放启动或停止Hadoop相关服务的脚本
（5）share目录：存放Hadoop的依赖jar包、文档、和官方案例
```

## 3. Hadoop的运行模式

Hadoop官方网站：http://hadoop.apache.org/

Hadoop运行模式包括：本地模式、伪分布式模式以及完全分布式模式。

### 3.1. 本地模式

单机运行，只是用来演示一下官方案例，学习使用，生产环境不用。

### 3.2. 伪分布式模式

也是单机运行，但是具备Hadoop集群的所有功能，一台服务器模拟一个分布式的环境。个别缺钱的公司用来测试，生产环境不用。

### 3.3. 完全分布式模式

多台服务器组成分布式环境。生产环境使用。

## 4. Hadoop的常用端口说明

端口名称
Hadoop2.x
Hadoop3.x

NameNode内部通信端口
8020 / 9000
8020 / 9000/9820

NameNode HTTP UI
50070
9870

MapReduce查看执行任务端口
8088
8088

历史服务器通信端口
19888
19888
