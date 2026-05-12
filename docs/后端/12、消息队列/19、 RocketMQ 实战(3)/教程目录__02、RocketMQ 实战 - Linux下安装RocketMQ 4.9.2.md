# 02、RocketMQ 实战 - Linux下安装RocketMQ 4.9.2
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/2.html
- 分类：消息队列
- 分组：教程目录
## 一、安装JDK1.8

RocketMQ是使用Java开发的，所以需要在Linux系统内安装JDK环境。主要有下面几个步骤：

- a. 从官网下载JDK1.8： [Java Downloads | Oracle](https://www.oracle.com/java/technologies/downloads/#java8)
- b. 将下载好的JDK安装包上传到Linux服务器中并解压缩，笔者这里是/java目录下

```java
[admin@admin /]$ cd /java/
[admin@admin java]$ ll
total 143376
-rw-rw-r--. 1 admin admin 146815279 Feb 15 10:20 jdk-8u321-linux-x64.tar.gz
[admin@admin java]$ tar -zxvf jdk-8u321-linux-x64.tar.gz 
```

- c. 解压缩完成后，会生成对应的【jdk1.8.0_321】目录，里面存放的是相关文件。假设这里我们将jdk安装在usr/java目录，那么我们需要将解压后的【jdk1.8.0_321】里面的所有数据移动到usr/java目录：

```java
mkdir /usr/java
chmod 777 /usr/java
mv jdk1.8.0_321/ /usr/java/
```

- d. 修改环境变量

```java
[admin@admin java]$ vim /etc/profile
```

用vim编辑器来编辑profile文件，在文件末尾添加以下内容（按“i”进入编辑）：

```java
export JAVA_HOME=/usr/java/jdk1.8.0_321
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib:$CLASSPATH
export JAVA_PATH=${JAVA_HOME}/bin:${JRE_HOME}/bin
export PATH=$PATH:${JAVA_PATH}
```

配置完使用:wq保存成后，我们通过命令source /etc/profile让profile文件立即生效：

```java
[admin@admin java]$ source /etc/profile
```

- e. 测试是否安装成功

```java
[admin@admin java]$ java
// 不会出现command not found错误
[admin@admin java]$ javac
// 不会出现command not found错误
[admin@admin java]$ java -version
// 能正常输出JDK对应版本号
```

## 二、安装RocketMQ

1、下载RocketMQ，这里我们以目前最新版本4.9.2为例，官网下载地址为：[Apache Download Mirrors](https://www.apache.org/dyn/closer.cgi?path=rocketmq/4.9.2/rocketmq-all-4.9.2-bin-release.zip)。这里我们直接下载编译好的二进制安装包，所以可以省去自己手动编译的过程，即【mvn -Prelease-all -DskipTests clean install -U】。

2、将下载好的rocketmq-all-4.9.2-bin-release.zip上传到Linux中。

3、解压rocketmq-all-4.9.2-bin-release.zip文件

```java
[admin@admin rocketmq]$ unzip rocketmq-all-4.9.2-bin-release.zip 
```

4、解压缩完成后，会生成【rocketmq-4.9.2】目录。进入【rocketmq-4.9.2】目录，然后我们修改broker.conf配置文件，追加下面两行配置：

```java
[admin@admin rocketmq]$ cd rocketmq-4.9.2/
[admin@admin rocketmq-4.9.2]$ ll
total 144
drwxr-xr-x. 2 admin admin   126 Oct 22 13:56 benchmark
drwxr-xr-x. 3 admin admin  4096 Feb 15 13:57 bin
drwxr-xr-x. 6 admin admin   228 Feb 15 13:44 conf
-rw-rw-r--. 1 admin admin 19018 Feb 15 13:36 hs_err_pid2828.log
-rw-rw-r--. 1 admin admin 18969 Feb 15 13:36 hs_err_pid2854.log
-rw-rw-r--. 1 admin admin 18969 Feb 15 13:39 hs_err_pid3015.log
-rw-rw-r--. 1 admin admin 19018 Feb 15 13:41 hs_err_pid3060.log
-rw-rw-r--. 1 admin admin 19039 Feb 15 13:52 hs_err_pid3458.log
drwxr-xr-x. 2 admin admin  4096 Oct 22 13:56 lib
-rw-r--r--. 1 admin admin 17327 Oct 22 13:41 LICENSE
-rw-------. 1 admin admin  2956 Feb 15 14:00 nohup.out
-rw-r--r--. 1 admin admin  1338 Oct 22 13:41 NOTICE
-rw-r--r--. 1 admin admin  5342 Oct 22 13:41 README.md
[admin@admin rocketmq-4.9.2]$ cd conf
[admin@admin conf]$ ll
total 40
drwxr-xr-x. 2 admin admin   118 Oct 22 13:41 2m-2s-async
drwxr-xr-x. 2 admin admin   118 Oct 22 13:41 2m-2s-sync
drwxr-xr-x. 2 admin admin    91 Oct 22 13:41 2m-noslave
-rw-r--r--. 1 admin admin   999 Feb 15 13:44 broker.conf
drwxr-xr-x. 2 admin admin    72 Oct 22 13:41 dledger
-rw-r--r--. 1 admin admin 14978 Oct 22 13:41 logback_broker.xml
-rw-r--r--. 1 admin admin  3836 Oct 22 13:41 logback_namesrv.xml
-rw-r--r--. 1 admin admin  3761 Oct 22 13:41 logback_tools.xml
-rw-------. 1 admin admin    44 Feb 15 13:44 nohup.out
-rw-r--r--. 1 admin admin  1305 Oct 22 13:41 plain_acl.yml
-rw-r--r--. 1 admin admin   834 Oct 22 13:41 tools.yml
[admin@admin conf]$ vim broker.conf
```

```java
// 10.0.90.59是笔者Linux的IP，读者朋友需要自行修改成自己的IP
namesrvAddr=10.0.90.59:9876
brokerIP1=10.0.90.59
```

如下图：

5、修改启动参数

这一步非必须，由于笔者使用的虚拟机，内存不太够，如果读者朋友觉得内存够的话，可以不修改。不过如果内存不够的话，启动broker也会报内存不足的错误。

我们需要两个启动脚本：runserver.sh 和 runbroker.sh

```java
[admin@admin bin]$ vim /rocketmq/rocketmq-4.9.2/bin/runserver.sh 
```

如下图，调整JAVA_OPT的内存大小：

```java
[admin@admin bin]$ vim /rocketmq/rocketmq-4.9.2/bin/runbroker.sh 
```

如下图，调整JAVA_OPT的内存大小：

## 三、启动RocketMQ

启动RocketMQ包括启动NameServer和Broker，先启动NameServer：

```java
[admin@admin /]$ cd /rocketmq/rocketmq-4.9.2/
[admin@admin rocketmq-4.9.2]$ nohup sh bin/mqnamesrv -n 10.0.90.59:9876 &
[1] 4796
[admin@admin rocketmq-4.9.2]$ nohup: ignoring input and appending output to ‘nohup.out’
```

查看NameServer是否启动成功：

```java
[admin@admin rocketmq-4.9.2]$ tail -f ~/logs/rocketmqlogs/namesrv.log
2022-02-15 14:47:00 INFO main - tls.client.keyPassword = null
2022-02-15 14:47:00 INFO main - tls.client.certPath = null
2022-02-15 14:47:00 INFO main - tls.client.authServer = false
2022-02-15 14:47:00 INFO main - tls.client.trustCertPath = null
2022-02-15 14:47:00 INFO main - Using JDK SSL provider
2022-02-15 14:47:02 INFO main - SSLContext created for server
2022-02-15 14:47:02 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-15 14:47:02 INFO NettyEventExecutor - NettyEventExecutor service started
2022-02-15 14:47:02 INFO main - The Name Server boot success. serializeType=JSON
2022-02-15 14:47:02 INFO FileWatchService - FileWatchService service started
[admin@admin rocketmq-4.9.2]$ jps
4817 NamesrvStartup
4853 Jps
```

可以看到，The Name Server boot success...，说明 Name Server启动成功，并且通过jps也能查到这个NamesrvStartup进程。

然后再启动Broker：

```java
[admin@admin /]$ cd /rocketmq/rocketmq-4.9.2/
[admin@admin rocketmq-4.9.2]$ nohup sh bin/mqbroker -n 10.0.90.59:9876 -c conf/broker.conf autoCreateTopicEnable=true & 
[1] 4902
[admin@admin rocketmq-4.9.2]$ nohup: ignoring input and appending output to ‘nohup.out’
```

查看Broker是否启动成功：

```java
[admin@admin rocketmq-4.9.2]$ tail -f ~/logs/rocketmqlogs/broker.log 
2022-02-15 14:51:17 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-15 14:51:17 INFO FileWatchService - FileWatchService service started
2022-02-15 14:51:17 INFO main - Try to start service thread:PullRequestHoldService started:false lastThread:null
2022-02-15 14:51:17 INFO PullRequestHoldService - PullRequestHoldService service started
2022-02-15 14:51:17 INFO main - Try to start service thread:TransactionalMessageCheckService started:false lastThread:null
2022-02-15 14:51:17 INFO brokerOutApi_thread_1 - register broker[0]to name server 10.0.90.59:9876 OK
2022-02-15 14:51:17 INFO main - The broker[admin.com, 10.0.90.59:10911] boot success. serializeType=JSON and name server is 10.0.90.59:9876
2022-02-15 14:51:26 INFO BrokerControllerScheduledThread1 - dispatch behind commit log 0 bytes
2022-02-15 14:51:26 INFO BrokerControllerScheduledThread1 - Slave fall behind master: 191890 bytes
2022-02-15 14:51:27 INFO brokerOutApi_thread_2 - register broker[0]to name server 10.0.90.59:9876 OK
```

可以看到，The broker[admin.com, 10.0.90.59:10911] boot success，Broker也启动成功。通过jps也能查询到对应的进程：

```java
[admin@admin rocketmq-4.9.2]$ jps
4817 NamesrvStartup
4993 Jps
4910 BrokerStartup
```

至此，RocketMQ就启动成功了，下面我们简单测试一下消息的发送以及消息的消费。

## 四、测试消息发送和消费

- 1、发送消息

```java
[admin@admin rocketmq-4.9.2]$ export NAMESRV_ADDR=10.0.90.59:9876
[admin@admin rocketmq-4.9.2]$ sh bin/tools.sh org.apache.rocketmq.example.quickstart.Producer
```

可以看到，消息发送成功。

- 2、消费消息

```java
[admin@admin rocketmq-4.9.2]$ export NAMESRV_ADDR=10.0.90.59:9876
[admin@admin rocketmq-4.9.2]$ sh bin/tools.sh org.apache.rocketmq.example.quickstart.Consumer
```

可以看到，客户端成功接收到消息，进行消费。

## 五、关闭RocketMQ

关闭RocketMQ的时候，需要先先关闭Broker，然后再关闭Name Server。

- 1、关闭Broker

```java
[admin@admin rocketmq-4.9.2]$ sh bin/mqshutdown broker
The mqbroker(4910) is running...
Send shutdown request to mqbroker(4910) OK
```

- 2、关闭Name Server

```java
[admin@admin rocketmq-4.9.2]$ sh bin/mqshutdown namesrv
The mqnamesrv(4817) is running...
Send shutdown request to mqnamesrv(4817) OK
[1]+  Exit 143                nohup sh bin/mqbroker -n 10.0.90.59:9876 autoCreateTopicEnable=true
```

## 六、可视化管理页面安装

1、下载可视化管理页面插件，并上传到服务器中，然后解压缩

下载地址：[https://github.com/rocketmq/rocketmq-externals](https://github.com/rocketmq/rocketmq-externals)

```java
[admin@admin rocketmq]$ unzip rocketmq-externals-master.zip 
```

解压缩完成后，会生成一个【rocketmq-externals-master】目录。

2、修改配置文件

```java
[admin@admin rocketmq-externals-master]$ cd /rocketmq/rocketmq-externals-master/rocketmq-console/
[admin@admin rocketmq-console]$ ll
total 52
drwxrwxr-x. 3 admin admin    19 Mar 23  2018 doc
-rw-rw-r--. 1 admin admin 29843 Mar 23  2018 LICENSE
-rw-rw-r--. 1 admin admin   176 Mar 23  2018 NOTICE
-rw-rw-r--. 1 admin admin 11424 Mar 23  2018 pom.xml
-rw-rw-r--. 1 admin admin  2169 Mar 23  2018 README.md
drwxrwxr-x. 4 admin admin    30 Mar 23  2018 src
drwxrwxr-x. 3 admin admin    74 Mar 23  2018 style
[admin@admin rocketmq-console]$ vim src/main/resources/application.properties
```

主要是修改端口号和配置RocketMQ NameServer的地址：

3、手动打包生成可运行的Jar文件

进入rocketmq-console，跳过测试并打包：

```java
[admin@admin rocketmq-console]$ pwd
/rocketmq/rocketmq-externals-master/rocketmq-console
[admin@admin rocketmq-console]$ mvn clean package -Dmaven.test.skip=true
```

打包完成后，在target目录下回生成一个可执行的Jar文件，如下图：

4、启动可视化页面

```java
[admin@admin target]$ java -jar rocketmq-console-ng-1.0.0.jar
```

查看启动日志：

5、访问可视化页面

启动成功后，浏览器访问：[http://10.0.90.59:1111/#/](http://10.0.90.59:1111/#/)

可以看到，RocketMQ可视化管理页面就搭建成功了。至此，RocketMQ单机版的安装就安装成功了，接下来就可以愉快地学习RocketMQ啦。

## 七、遇到的问题

1、防火墙问题

读者朋友可以开放RocketMQ对应的端口监听，当然也可以直接关闭Centos的防火墙。

2、内存不足问题

修改bin目录下的runserver.sh和runbroker.sh两个文件中的JAVA_OPT启动参数的内存配置，调小一些即可。

3、启动Broker失败

检查broker.conf配置文件是否配置了NameServer的地址等，或者查看具体的日志看下什么原因。
