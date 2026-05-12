# 02、ActiveMQ 实战 - ActiveMQ下载和安装（Linux版）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/3/2.html
- 分类：消息队列
- 分组：教程目录
### 怎么玩

估计是广大网友最喜欢的一篇文章了

### 官网地址

[ActiveMQ官网下载地址](http://activemq.apache.org/)

### 环境准备

**1、** Linux系统（Centos6.8）；

**2、** JDK环境；

(如果不懂，参考这篇文章、软件包啥的都提供

[Linux下JDK安装，亲测可用](https://blog.csdn.net/xiaozhegaa/article/details/76359426))

**3、** ActiveMQ安装包（Linux版本5.14.3）；

### 官方下载

进入官网

### 安裝

[Centos7安裝ActiveMQ](http://blog.csdn.net/gebitan505/article/details/55096222)

个人感觉这个博客要比老师介绍的更详细。

**1、** 将下载好的安装包解压到linux目录，比如我的是ActiveMQ版本是5.16.0，解压的到/activemq，解压命令：；

```java
mkdir /opt/activemq
cd /opt/activemq
tar -zxvf apache-activemq-5.14.3-bin.tar.gz
```

**1、** 进入解压路劲的bin文件夹，使用下面命令启动ActiveMQ；

```java
cd /opt/activemq/apache-activemq-5.14.3/bin
./activemq start
```

两种方式查看ActiveMQ是否成功启动

1）根据名称查询

```java
ps -ef|grep activemq|grep -v grep
or
ps -ef | grep java
```

2）根据启动端口查看

```java
netstat -anp|grep 61616
or
lsof -i:61616
```

### activemq常用命令

**1、** 普通方式启动；

```java
./activemq start
```

**1、** 带日志的启动方式；

```java
./activemq start > 目标文件
./activemq start > /opt/activemq/myactivemqstart.log
```

**1、** 关闭ActiveMQ；

```java
./activemq stop
```

**1、** 重启ActiveMQ；

```java
./activemq restart
```

**1、** 指定配置文件方式启动；

ActiveMQ默认使用安装路径下的conf/activemq.xml启动服务，也可以像Redis一样，可以使用指定路径下的配置文件启动服务。

```java
./activemq start xbean:file:/配置文件路径
```

### 端口说明

采用61616端口提供JMS服务\color{red}采用61616端口提供JMS服务采用61616端口提供JMS服务
采用8161提供管理控制台服务\color{red}采用8161提供管理控制台服务采用8161提供管理控制台服务

### 访问控制台

LinuxIP:47.98.163.118\color{red}LinuxIP:47.98.163.118LinuxIP:47.98.163.118
Linux防火墙开放\color{red}Linux防火墙开放Linux防火墙开放
默认账号密码都是：admin/admin\color{red}默认账号密码都是：admin/admin默认账号密码都是：admin/admin
输入
入

```java
http://47.98.163.118:8161/admin
```

### 出现问题

**1、** 因为主机名不符合规范导致无法启动activemq；

https://blog.csdn.net/qq_39056805/article/details/80749337
