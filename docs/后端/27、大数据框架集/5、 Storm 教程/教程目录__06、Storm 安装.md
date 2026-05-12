# 06、Storm 安装
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/6.html
- 分类：大数据框架
- 分组：教程目录
现在，让我们来看看如何在你的机器上安装Apache Storm框架。这里有三个步骤 –

- 在系统上安装Java，如果你还没有安装。
- 安装ZooKeeper框架。
- 安装Apache Storm框架。

## 步骤1 – 验证Java安装

使用以下命令检查系统上是否已安装Java。

```java
$ java -version
```

如果Java已经存在，那么你会看到它的版本号。否则，下载最新版本的JDK。

### 步骤1.1 – 下载JDK

使用以下链接 – [www.oracle.com](http://www.oracle.com/technetwork/java/javase/downloads/index.html)下载最新版本的JDK

最新版本为JDK 8u 60，文件为**“jdk-8u60-linux-x64.tar.gz”**。在您的机器上下载文件。

### 步骤1.2 – 解压文件

通常文件被下载到下载文件夹。使用以下命令解压tar设置。

```java
$ cd /go/to/download/path
$ tar -zxf jdk-8u60-linux-x64.gz
```

### 步骤1.3 – 移动到opt文件夹

要使Java对所有用户可用，请将提取的Java内容移动到“/ usr / local / java”文件夹。

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

### 步骤1.5 – Java替代项

使用以下命令更改Java替代项。

```java
update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.8.0_60/bin/java 100
```

### 1.6步

现在使用第1步中解释的验证命令**（java -version）** 验证Java安装。

## 第2步 – ZooKeeper框架安装

### 步骤2.1 – 下载ZooKeeper

要在您的计算机上安装ZooKeeper框架，请访问以下链接并下载最新版本的ZooKeeper [http://zookeeper.apache.org/releases.html](http://zookeeper.apache.org/releases.html)

到目前为止，最新版本的ZooKeeper是3.4.6（ZooKeeper-3.4.6.tar.gz）。

### 步骤2.2 – 解压tar文件

使用以下命令解压tar文件 –

```java
$ cd opt/
$ tar -zxf zookeeper-3.4.6.tar.gz
$ cd zookeeper-3.4.6
$ mkdir data
```

### 步骤2.3 – 创建配置文件

使用命令“vi conf / zoo.cfg”打开名为“conf / zoo.cfg”的配置文件，并将所有以下参数设置为起点。

```java
$ vi conf/zoo.cfg
tickTime=2000
dataDir=/path/to/zookeeper/data
clientPort=2181
initLimit=5
syncLimit=2
```

配置文件保存成功后，可以启动ZooKeeper服务器。

### 步骤2.4 – 启动ZooKeeper服务器

使用以下命令启动ZooKeeper服务器。

```java
$ bin/zkServer.sh start
```

执行此命令后，您将收到一个响应如下 –

```java
$ JMX enabled by default
$ Using config: /Users/../zookeeper-3.4.6/bin/../conf/zoo.cfg
$ Starting zookeeper ... STARTED
```

### 步骤2.5 – 启动CLI

使用以下命令启动CLI。

```java
$ bin/zkCli.sh
```

执行上述命令后，您将连接到ZooKeeper服务器并获得以下响应。

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

### 步骤2.6 – 停止ZooKeeper服务器

连接服务器并执行所有操作后，可以使用以下命令停止ZooKeeper服务器。

```java
bin/zkServer.sh stop
```

您已成功在计算机上安装Java和ZooKeeper。现在让我们看看安装Apache Storm框架的步骤。

## 第3步 – Apache Storm框架安装

### 步骤3.1 – 下载Storm

要在您的计算机上安装Storm框架，请访问以下链接并下载最新版本的Storm [http://storm.apache.org/downloads.html](http://storm.apache.org/downloads.html)

到目前为止，最新版本的Storm是“apache-storm-0.9.5.tar.gz”。

### 步骤3.2 – 解压tar文件

使用以下命令解压tar文件

```java
$ cd opt/
$ tar -zxf apache-storm-0.9.5.tar.gz
$ cd apache-storm-0.9.5
$ mkdir data
```

### 步骤3.3 – 打开配置文件

当前版本的Storm在“conf / storm.yaml”中包含一个配置Storm守护程序的文件。将以下信息添加到该文件。

```java
$ vi conf/storm.yaml
storm.zookeeper.servers:
 - "localhost"
storm.local.dir: “/path/to/storm/data(any path)”
nimbus.host: "localhost"
supervisor.slots.ports:
 - 6700
 - 6701
 - 6702
 - 6703
```

应用所有更改后，保存并返回到终端。

### 步骤3.4 – 启动Nimbus

```java
$ bin/storm nimbus
```

### 步骤3.5 – 启动Supervisor

```java
$ bin/storm supervisor
```

### 步骤3.6 – 启动UI

```java
$ bin/storm ui
```

启动Storm用户界面应用程序后，在您最喜欢的浏览器中键入URL **http：// localhost：8080**，您可以看到Storm群集信息及其运行的拓扑。该页面应类似于以下屏幕截图。
