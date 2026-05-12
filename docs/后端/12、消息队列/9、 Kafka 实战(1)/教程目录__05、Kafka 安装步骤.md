# 05、Kafka 安装步骤
- 来源：https://ddkk.com/zhuanlan/mq/kafka/1/5.html
- 分类：消息队列
- 分组：教程目录
以下是在机器上安装Java的步骤。

## 步骤1 – 验证Java安装

希望你已经在你的机器上安装了java，所以你只需使用下面的命令验证它。

```java
$ java -version
```

如果java在您的机器上成功安装，您可以看到已安装的Java的版本。

### 步骤1.1 – 下载JDK

如果没有下载Java，请通过访问以下链接并下载最新版本来下载最新版本的JDK。

[http://www.oracle.com/technetwork/java/javase/downloads/index.html](http://www.oracle.com/technetwork/java/javase/downloads/index.html)

现在最新的版本是JDK 8u 60，文件是“jdk-8u60-linux-x64.tar.gz”。 请在您的机器上下载该文件。

### 步骤1.2 – 提取文件

通常，正在下载的文件存储在下载文件夹中，验证它并使用以下命令提取tar设置。

```java
$ cd /go/to/download/path
$ tar -zxf jdk-8u60-linux-x64.gz
```

### 步骤1.3 – 移动到选择目录

要将java提供给所有用户，请将提取的java内容移动到 usr / local / java / folder。

```java
$ su
password: (type password of root user)
$ mkdir /opt/jdk
$ mv jdk-1.8.0_60 /opt/jdk/
```

### 步骤1.4 – 设置路径

要设置路径和JAVA_HOME变量，请将以下命令添加到〜/ .bashrc文件。

```java
export JAVA_HOME =/usr/jdk/jdk-1.8.0_60
export PATH=$PATH:$JAVA_HOME/bin
```

现在将所有更改应用到当前运行的系统。

```java
$ source ~/.bashrc
```

### 步骤1.5 – Java替代

使用以下命令更改Java Alternatives。

```java
update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.8.0_60/bin/java 100
```

**步骤1.6** - 现在使用第1步中说明的验证命令(java -version)验证java。

## 步骤2 – ZooKeeper框架安装

### 步骤2.1 – 下载ZooKeeper

要在您的计算机上安装ZooKeeper框架，请访问以下链接并下载最新版本的ZooKeeper。

[http://zookeeper.apache.org/releases.html](http://zookeeper.apache.org/releases.html)

现在，最新版本的ZooKeeper是3.4.6(ZooKeeper-3.4.6.tar.gz)。

### 步骤2.2 – 提取tar文件

使用以下命令提取tar文件

```java
$ cd opt/
$ tar -zxf zookeeper-3.4.6.tar.gz
$ cd zookeeper-3.4.6
$ mkdir data
```

### 步骤2.3 – 创建配置文件

使用命令vi“conf / zoo.cfg”打开名为 conf / zoo.cfg 的配置文件，并将所有以下参数设置为起点。

```java
$ vi conf/zoo.cfg
tickTime=2000
dataDir=/path/to/zookeeper/data
clientPort=2181
initLimit=5
syncLimit=2
```

一旦配置文件成功保存并再次返回终端，您可以启动zookeeper服务器。

### 步骤2.4 – 启动ZooKeeper服务器

```java
$ bin/zkServer.sh start
```

执行此命令后，您将得到如下所示的响应 –

```java
$ JMX enabled by default
$ Using config: /Users/../zookeeper-3.4.6/bin/../conf/zoo.cfg
$ Starting zookeeper ... STARTED
```

### 步骤2.5 – 启动CLI

```java
$ bin/zkCli.sh
```

输入上面的命令后，您将被连接到zookeeper服务器，并将获得以下响应。

```java
Connecting to localhost:2181
................
................
................
Welcome to ZooKeeper!
................
................
WATCHER::
WatchedEvent state:SyncConnected type: None path:null
[zk: localhost:2181(CONNECTED) 0]
```

### 步骤2.6 – 停止Zookeeper服务器

连接服务器并执行所有操作后，可以使用以下命令停止zookeeper服务器 –

```java
$ bin/zkServer.sh stop
```

现在你已经在你的机器上成功安装了Java和ZooKeeper。 让我们看看安装Apache Kafka的步骤。

## 步骤3 – Apache Kafka安装

让我们继续以下步骤在您的机器上安装Kafka。

### 步骤3.1 – 下载Kafka

要在您的机器上安装Kafka，请点击以下链接 –

[https://www.apache.org/dyn/closer.cgi?path=/kafka/0.9.0.0/kafka_2.11-0.9.0.0.tgz](https://www.apache.org/dyn/closer.cgi?path=/kafka/0.9.0.0/kafka_2.11-0.9.0.0.tgz)

现在最新版本，即 – **kafka_2.11_0.9.0.0.tgz** 将下载到您的计算机上。

### 步骤3.2 – 解压tar文件

使用以下命令提取tar文件 –

```java
$ cd opt/
$ tar -zxf kafka_2.11.0.9.0.0 tar.gz
$ cd kafka_2.11.0.9.0.0
```

现在您已经在您的机器上下载了最新版本的Kafka。

### 步骤3.3 – 启动服务器

您可以通过给出以下命令来启动服务器 –

```java
$ bin/kafka-server-start.sh config/server.properties
```

服务器启动后，您会在屏幕上看到以下响应:

```java
$ bin/kafka-server-start.sh config/server.properties
[2016-01-02 15:37:30,410] INFO KafkaConfig values:
request.timeout.ms = 30000
log.roll.hours = 168
inter.broker.protocol.version = 0.9.0.X
log.preallocate = false
security.inter.broker.protocol = PLAINTEXT
…………………………………………….
…………………………………………….
```

## 步骤4 – 停止服务器

执行所有操作后，可以使用以下命令停止服务器 –

```java
$ bin/kafka-server-stop.sh config/server.properties
```

现在我们已经讨论了Kafka安装，我们可以在下一章中学习如何对Kafka执行基本操作。
