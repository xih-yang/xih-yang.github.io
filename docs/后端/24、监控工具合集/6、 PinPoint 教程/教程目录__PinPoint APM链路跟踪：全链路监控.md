# PinPoint APM链路跟踪：全链路监控
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/6.html
- 分类：链路追踪
- 分组：教程目录
## 1、PinPoint出现与其他相似概念比较

### 1.1、PinPoint概念

PinPoint是由java/PHP编写而成的，用来对大规模的分布式系统提供应用性能管理。pinpoint可以解决复杂架构下的拓扑解析与性能分析。

### 1.2、PinPoint的特点

分布式事务追踪，跟踪跨分布式应用的消息；

自动检测拓扑，帮助搞清楚应用架构；

水平扩展可以支持大规模服务器集群；

提供代码级别的可见性，轻松定位失败点和瓶颈；

使用字节码增强技术，添加新功能是无需修改代码，对代码无侵入性。

### 1.3、PinPoint的功能

服务拓扑图：对整个系统的调用关系进行可视化的展示，点击某个节点，显示该节点的具体信息。

实时活跃线程图：监控应用内活跃线程的执行情况。

请求响应散点图：以时间维度展示请求计数和响应时间。

请求调用栈查看：对分布式环境中的请求可以定位到代码维度；可以查找问题的出现是否与代码有关。

应用状态、机器状态检查：查看与该项目相关的其他性能，cpu利用率、内存等。

### 1.4、APM(应用性能管理）

APM属于IT运维管理。主要针对于企业关键业务的应用性能和用户体验的检测、优化，提高企业IT应用的质量和可靠性。

APM多级运用性能监控，覆盖通讯协议1-7层，通过事务处理过程监控、模拟等手段实现端对端的应用监控。对应用系统中的各个组件进行监测，迅速定位系统故障，并进行修复或建议。对系统中各组件的系统资源进行实时监控，并根据监控结果给予建议。

图片来自华为云官网。

## 2、PinPoint架构原理

### 2.1、架构组成

PinPoint Collector:收集各种性能数据

PinPoint Agent:和自己运行的应用关联起来的探针

Pinpoint-Web: 将收集到的数据显成为 WEB网页显示

HBase Storage: 存储收集到的数据

### 2.2、工作原理

pinpoint的核心思想是在各个服务节点之间彼此调用时，记录并传递一个应用级别的标记，这个标记用来关联各个服务节点之间的关系。例：两个服务器之间利用http协议来进行通信，pinpoint就会将这个标记加入到http头之中，各个应用之间进行上报的时候，将报文头上的标记和各个应用之间的调用关系汇报给pinpoint，pinpoint根据得到的信息，将每一个应用串联成一个链路，得到服务拓扑。

通过pinpoint-agent往自身web应用的tomcat中打入探针，由pinpoint-collector收集数据，存储于hbase中，通过pinpoint-web展示数据。

## 3、pinpoint应用部署

部署一个例子，用来收集一些数据，展示pinpoint的配置和应用方式。

这个例子共需要两台服务器，一台安装pinpoint，用作pinpoint的web展示端，逻辑控制机，以及hbase存储。另一台用来安装pinpoint-agent ，主要用来采集数据，发送给pinpoint处理。

### 3.1 环境准备

两台机器之间可以关闭防火墙，也可以打开，在这个例子中，我运用的云主机，所以会将服务器内部的防火墙关闭，在服务器的安全组之中将所需要的端口打开。

注：两台机器最好同时操作，防止之后忘记

### 3.2、关闭防火墙：

命令集合：

```bash
systemctl stop firewalld  
systemctl disable firewalld取消开机自启动
```

### 3.3、 安装一些依赖以及一些常用工具

命令集合

```bash
[root@pinpoint ~]# yum install net-tools bash-completion wget vim -y
```

### 3.4、关于时间同步

由于云主机上的利用弹性公网ip与外界连接，所以，运用云主机之间是可以不用同步时间的。但在自己的虚拟机，比如利用wmware虚拟的虚拟机，机器时间可能会不相同，需要进行时间同步，否则如果在两台机器上连接时，可能会出现问题。

同步命令合集：

```bash
yum install ntpdate -y
ntpdate cn.pool.ntp.org
hwclock -w
```

## 4、环境配置

### 4.1、获取需要的安装包

官网下载。

均未选择版本，请自行选择版本。

jdk下载地址：[Java Downloads | Oracle](https://www.oracle.com/java/technologies/downloads/)

hbse下载地址：[Index of /dist/hbase](https://archive.apache.org/dist/hbase/)

tomcat下载地址：[Apache Tomcat® - Apache Tomcat 9 Software Downloads](https://tomcat.apache.org/download-90.cgi)

pinpoint下载地址：[Home - PinPoint](http://pinpoint.net)

网盘下载

我提供我的网盘中的压缩包，可自行选择下载方式。

链接：https://pan.baidu.com/s/1ZNq6y6KFW8qv7C_KyKbE1Q

提取码：k4s0

```bash
jdk       Java运行环境
hbase     数据库。用来存储监控数据
tomcat    web服务器
pinpoint-collector.war     pinpoint的控制器
pinpoint-web.war           pinpoint的展示页面
```

**2、** 配置jdk；

pinpoint这套系统利用jdk进行部署，所以首先配置jdk。

```bash
[root@pinpoint pinpoint]# tar -xf jdk-7u79-linux-x64.tar.gz 
[root@pinpoint pinpoint]# mkdir /usr/java/
[root@pinpoint pinpoint]# mv jdk1.7.0_79/ /usr/java/jdk7
[root@pinpoint pinpoint]# vim /etc/profile
export JAVA_HOME=/usr/java/jdk7
export PATH=$PATH:$JAVA_HOME/bin
[root@pinpoint pinpoint]# source /etc/profile
[root@pinpoint pinpoint]# java -version
java version "1.7.0_79"
Java(TM) SE Runtime Environment (build 1.7.0_79-b15)
Java HotSpot(TM) 64-Bit Server VM (build 24.79-b02, mixed mode)
```

## 5、安装hbase

Hbase在这套系统中的主要功能是用来存储pinpoint收集到的数据。

### 1、解压Hbase，并放入制定目录

```bash
[root@pinpoint pinpoint]# tar xf hbase-1.0.3-bin.tar.gz 
[root@pinpoint pinpoint]# mkdir -p /data/service
[root@pinpoint pinpoint]# mv hbase-1.0.3/ /data/service/hbase
[root@pinpoint pinpoint]# cd /data/service/hbase/conf/
[root@pinpoint conf]# vim hbase-env.sh 
[root@pinpoint conf]# egrep -v "^#|^$" hbase-env.sh 
export JAVA_HOME=/usr/java/jdk7/
export HBASE_OPTS="-XX:+UseConcMarkSweepGC"
```

### 2、修改 Hbase的配置信息

```bash
[root@pinpoint conf]# pwd
/data/service/hbase/conf
[root@pinpoint conf]# vim hbase-site.xml 
[root@pinpoint conf]# egrep -v "^#|^$|\*" hbase-site.xml 
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<!--
-->
<configuration>
hbase.rootdir
file:///data/hbase
</configuration>
```

### 3、启动Hbase

```bash
[root@pinpoint ~]# cd /data/service/hbase/bin/
[root@pinpoint bin]# ./start-hbase.sh 
starting master, logging to /data/service/hbase/bin/../logs/hbase-root-master-pinpoint.out
[root@pinpoint bin]# jps
12527 HMaster
12756 Jps
```

### 4、初始化Hbase的pinpoint库；

初始化这个库需要一个文件，hbase-create.hbase。该文件存在于我分享的百度网盘中。

```bash
[root@pinpoint pinpoint]# cd /data/service/hbase/bin/
[root@pinpoint bin]# ./hbase shell /root/pinpoint/hbase-create.hbase 
#初始化完成后，进入Hbase 可以看到数据库的版本以及一些其他的信息。
[root@pinpoint bin]# ./hbase shell
2021-11-03 13:44:35,524 WARN  [main] util.NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
HBase Shell; enter 'help<RETURN>' for list of supported commands.
Type "exit<RETURN>" to leave the HBase Shell
Version 1.0.3, rf1e1312f9790a7c40f6a4b5a1bab2ea1dd559890, Tue Jan 19 19:26:53 PST 2016
#查看初始化的表是否存在
hbase(main):001:0> status 'detailed'
version 1.0.3
0 regionsInTransition
master coprocessors: []
1 live servers
    git:38684 1635911596175
```

或者访问web页面，查看数据库是否初始化成功！

访问：http://ip:16010/master-status

如果访问不到，请查看端口是否已经打开。

## 6、安装pinpoint- collector

### 1、部署war包

```bash
#解压tomcat，并放置在响应地点
[root@pinpoint pinpoint]# tar xf apache-tomcat-8.0.36.tar.gz 
[root@pinpoint pinpoint]# mv apache-tomcat-8.0.36/ /data/service/pinpoint-col
#修改tomcat的配置
#修改端口，避免与后续的pinpoint-web的端口冲突。如果使用云主机，请开启安全组的响应端口，如果使用防火墙，请开启相应端口
[root@pinpoint pinpoint]# cd /data/service/pinpoint-col/conf/
[root@pinpoint conf]# sed -i 's/port="8005"/port="18005"/g' server.xml 
[root@pinpoint conf]# sed -i 's/port="8080"/port="18080"/g' server.xml 
[root@pinpoint conf]# sed -i 's/port="8443"/port="18443"/g' server.xml 
[root@pinpoint conf]# sed -i 's/port="8009"/port="18009"/g' server.xml 
[root@pinpoint conf]# sed -i 's/redirectPort="8443"/redirectPort="18443"/g' server.xml 
#将tomcat的私有IP开放。
[root@pinpoint conf]# sed -i 's/localhost/47.103.24.126/g' server.xml 
#部署pinpoint-collector.war包（如果没有unzip命令，使用“yum install unzip -y”下载）
[root@pinpoint pinpoint-col]# pwd
/data/service/pinpoint-col
[root@pinpoint pinpoint-col]# rm -rf ./webapps/*
[root@pinpoint pinpoint-col]# unzip /root/pinpoint/pinpoint-collector-1.5.2.war -d /data/service/pinpoint-col/webapps/ROOT
#启动tomcat
[root@pinpoint pinpoint-col]# cd /data/service/pinpoint-col/bin/
[root@pinpoint bin]# ./startup.sh 
Using CATALINA_BASE:   /data/service/pinpoint-col
Using CATALINA_HOME:   /data/service/pinpoint-col
Using CATALINA_TMPDIR: /data/service/pinpoint-col/temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-col/bin/bootstrap.jar:/data/service/pinpoint-col/bin/tomcat-juli.jar
Tomcat started.
#查看日志，是否启动成功
[root@pinpoint bin]# tail -f ../logs/catalina.out 
11-03 14:21:50 [INFO ](o.s.w.s.m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/admin/isEnable.*] onto handler 'handlerManagerController'
11-03 14:21:50 [INFO ](o.s.w.s.m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/admin/isEnable/] onto handler 'handlerManagerController'
11-03 14:21:50 [INFO ](o.s.w.s.m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/admin/enableAccess] onto handler 'handlerManagerController'
11-03 14:21:50 [INFO ](o.s.w.s.m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/admin/enableAccess.*] onto handler 'handlerManagerController'
11-03 14:21:50 [INFO ](o.s.w.s.m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/admin/enableAccess/] onto handler 'handlerManagerController'
11-03 14:21:50 [INFO ](o.s.w.s.DispatcherServlet          :504) FrameworkServlet 'pinpoint-web': initialization completed in 663 ms
03-Nov-2021 14:21:50.531 INFO [47.103.24.126-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory Deployment of web application directory /data/service/pinpoint-col/webapps/ROOT has finished in 6,978 ms
03-Nov-2021 14:21:50.534 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-18080"]
03-Nov-2021 14:21:50.549 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["ajp-nio-18009"]
03-Nov-2021 14:21:50.550 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 7026 ms
```

### 2、配置快速启动

配置快速启动需要一个pp- collector.init的文件，可以有两种获取方法

网盘：

之前分享的网盘中拥有这个文件，直接上传至服务器就可以使用。

文件内容：

新建一个文件，名为pp-collector.init，内容如下：

```bash
#!/bin/bash
#
# chkconfig: 345 99 28
# description: Starts/Stops Apache Tomcat
#
# Tomcat 7 start/stop/status script
# Forked from: https://gist.github.com/valotas/1000094
# @author: Miglen Evlogiev <bash@miglen.com>
#
# Release updates:
# Updated method for gathering pid of the current proccess
# Added usage of CATALINA_BASE
# Added coloring and additional status
# Added check for existence of the tomcat user
#
#Location of JAVA_HOME (bin files)
export JAVA_HOME=/usr/java/default/
#Add Java binary files to PATH
export PATH=$JAVA_HOME/bin:$PATH
#CATALINA_HOME is the location of the bin files of Tomcat  
export CATALINA_HOME=/data/service/pinpoint-collector/
#CATALINA_BASE is the location of the configuration files of this instance of Tomcat
export CATALINA_BASE=/data/service/pinpoint-collector/
#TOMCAT_USER is the default user of tomcat
export TOMCAT_USER=root
#TOMCAT_USAGE is the message if this script is called without any options
TOMCAT_USAGE="Usage: $0 {\e[00;32mstart\e[00m|\e[00;31mstop\e[00m|\e[00;32mstatus\e[00m|\e[00;31mrestart\e[00m}"
#SHUTDOWN_WAIT is wait time in seconds for java proccess to stop
SHUTDOWN_WAIT=3
tomcat_pid() {
        echo ps -fe | grep $CATALINA_BASE | grep -v grep | tr -s " "|cut -d" " -f2
}
start() {
  pid=$(tomcat_pid)
  if [ -n "$pid" ]
  then
    echo -e "\e[00;31mTomcat is already running (pid: $pid)\e[00m"
  else
    Start tomcat
    echo -e "\e[00;32mStarting tomcat\e[00m"
   ulimit -n 100000
   umask 007
   /bin/su -p -s /bin/sh tomcat
        if [ user_exists $TOMCAT_USER = "1" ]
        then
                su $TOMCAT_USER -c $CATALINA_HOME/bin/startup.sh
        else
                sh $CATALINA_HOME/bin/startup.sh
        fi
        status
  fi
  return 0
}
status(){
          pid=$(tomcat_pid)
          if [ -n "$pid" ]; then echo -e "\e[00;32mTomcat is running with pid: $pid\e[00m"
          else echo -e "\e[00;31mTomcat is not running\e[00m"
          fi
}
stop() {
  pid=$(tomcat_pid)
  if [ -n "$pid" ]
  then
    echo -e "\e[00;31mStoping Tomcat\e[00m"
   /bin/su -p -s /bin/sh tomcat
        sh $CATALINA_HOME/bin/shutdown.sh
    let kwait=$SHUTDOWN_WAIT
    count=0;
    until [ ps -p $pid | grep -c $pid = '0' ] || [ $count -gt $kwait ]
    do
      echo -n -e "\n\e[00;31mwaiting for processes to exit\e[00m";
      sleep 1
      let count=$count+1;
    done
    if [ $count -gt $kwait ]; then
      echo -n -e "\n\e[00;31mkilling processes which didn't stop after $SHUTDOWN_WAIT seconds\e[00m"
      kill -9 $pid
    fi
  else
    echo -e "\e[00;31mTomcat is not running\e[00m"
  fi
  return 0
}
user_exists(){
        if id -u $1 >/dev/null 2>&1; then
        echo "1"
        else
                echo "0"
        fi
}
case $1 in
        start)
          start
        ;;
        stop)  
          stop
        ;;
        restart)
          stop
          start
        ;;
        status)
                status
        ;;
        *)
                echo -e $TOMCAT_USAGE
        ;;
esac    
exit 0
```

拥有这个文件之后，修改默认的路径，修改后如下：

之后将文件赋予“执行”权限，加入启动项

```bash
[root@pinpoint pinpoint]# mv pp-collector.init /etc/init.d/pinpoint-col
[root@pinpoint pinpoint]# chmod 711 /etc/init.d/pinpoint-col 
[root@pinpoint pinpoint]# ll /etc/init.d/pinpoint-col 
-rwx--x--x 1 root root 3069 11月  3 14:40 /etc/init.d/pinpoint-col
```

测试

```bash
[root@pinpoint pinpoint]# /etc/init.d/pinpoint-col restart
Stoping Tomcat
Using CATALINA_BASE:   /data/service/pinpoint-col/
Using CATALINA_HOME:   /data/service/pinpoint-col/
Using CATALINA_TMPDIR: /data/service/pinpoint-col//temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-col//bin/bootstrap.jar:/data/service/pinpoint-col//bin/tomcat-juli.jar
waiting for processes to exitStarting tomcat
Using CATALINA_BASE:   /data/service/pinpoint-col/
Using CATALINA_HOME:   /data/service/pinpoint-col/
Using CATALINA_TMPDIR: /data/service/pinpoint-col//temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-col//bin/bootstrap.jar:/data/service/pinpoint-col//bin/tomcat-juli.jar
Tomcat started.
Tomcat is running with pid: 28463
```

设置成功！！！！

## 7、安装pinpoint-web

### 1、部署war包

```bash
#解压tomcat，并放置在响应地点
[root@pinpoint pinpoint]# tar xf apache-tomcat-8.0.36.tar.gz 
[root@pinpoint pinpoint]# mv apache-tomcat-8.0.36/ /data/service/pinpoint-web
#修改tomcat的配置
#修改端口，避免与后续的pinpoint-col的端口冲突。如果使用云主机，请开启安全组的响应端口，如果使用防火墙，请开启相应端口
[root@pinpoint pinpoint]# cd /data/service/pinpoint-web/conf/
[root@pinpoint conf]# sed -i 's/port="8005"/port="28005"/g' server.xml
[root@pinpoint conf]# sed -i 's/port="8080"/port="28080"/g' server.xml
[root@pinpoint conf]# sed -i 's/port="8443"/port="28443"/g' server.xml
[root@pinpoint conf]# sed -i 's/port="8009"/port="28009"/g' server.xml
[root@pinpoint conf]# sed -i 's/redirectPort="8443"/redirectPort="28443"/g' server.xml
#将tomcat的私有IP开放。
[root@pinpoint conf]# sed -i 's/localhost/47.103.24.126/g' server.xml 
#部署pinpoint-web.war包（如果没有unzip命令，使用“yum install unzip -y”下载）
[root@pinpoint conf]# rm -rf /data/service/pinpoint-web/webapps/* 
[root@pinpoint conf]# unzip /root/pinpoint/pinpoint-web-1.5.2.war -d /data/service/pinpoint-web/webapps/ROOT
#启动tomcat
[root@pinpoint conf]# cd /data/service/pinpoint-web/bin/
[root@pinpoint bin]# ./startup.sh 
Using CATALINA_BASE:   /data/service/pinpoint-web
Using CATALINA_HOME:   /data/service/pinpoint-web
Using CATALINA_TMPDIR: /data/service/pinpoint-web/temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-web/bin/bootstrap.jar:/data/service/pinpoint-web/bin/tomcat-juli.jar
Tomcat started.
#查看日志，查看是否启动成功
[root@pinpoint bin]# tail -f ../logs/catalina.out 
14:57:00 INFO (m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/userGroup/member.*] onto handler 'userGroupController'
14:57:00 INFO (m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/userGroup/member/] onto handler 'userGroupController'
14:57:00 INFO (m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/userGroup] onto handler 'userGroupController'
14:57:00 INFO (m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/userGroup.*] onto handler 'userGroupController'
14:57:00 INFO (m.a.DefaultAnnotationHandlerMapping:314) Mapped URL path [/userGroup/] onto handler 'userGroupController'
14:57:00 INFO (o.s.w.s.DispatcherServlet          :504) FrameworkServlet 'pinpoint-web': initialization completed in 908 ms
03-Nov-2021 14:57:00.659 INFO [47.103.24.126-startStop-1] org.apache.catalina.startup.HostConfig.deployDirectory Deployment of web application directory /data/service/pinpoint-web/webapps/ROOT has finished in 8,734 ms
03-Nov-2021 14:57:00.676 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-28080"]
03-Nov-2021 14:57:00.715 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["ajp-nio-28009"]
03-Nov-2021 14:57:00.754 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 8899 ms
```

此时访问地址http://ip:28080/#/main

出现主界面，成功！！！

### 2、配置快速启动

pinpoint-web的快速启动配置和pinpoint- collector的配置相同。

pp-web.init的内容如下：

```bash
#!/bin/bash
#
# chkconfig: 345 99 28
# description: Starts/Stops Apache Tomcat
#
# Tomcat 7 start/stop/status script
# Forked from: https://gist.github.com/valotas/1000094
# @author: Miglen Evlogiev <bash@miglen.com>
#
# Release updates:
# Updated method for gathering pid of the current proccess
# Added usage of CATALINA_BASE
# Added coloring and additional status
# Added check for existence of the tomcat user
#
#Location of JAVA_HOME (bin files)
export JAVA_HOME=/usr/java/default/
#Add Java binary files to PATH
export PATH=$JAVA_HOME/bin:$PATH
#CATALINA_HOME is the location of the bin files of Tomcat  
export CATALINA_HOME=/data/service/pinpoint-web/
#CATALINA_BASE is the location of the configuration files of this instance of Tomcat
export CATALINA_BASE=/data/service/pinpoint-web/
#TOMCAT_USER is the default user of tomcat
export TOMCAT_USER=root
#TOMCAT_USAGE is the message if this script is called without any options
TOMCAT_USAGE="Usage: $0 {\e[00;32mstart\e[00m|\e[00;31mstop\e[00m|\e[00;32mstatus\e[00m|\e[00;31mrestart\e[00m}"
#SHUTDOWN_WAIT is wait time in seconds for java proccess to stop
SHUTDOWN_WAIT=3
tomcat_pid() {
        echo ps -fe | grep $CATALINA_BASE | grep -v grep | tr -s " "|cut -d" " -f2
}
start() {
  pid=$(tomcat_pid)
  if [ -n "$pid" ]
  then
    echo -e "\e[00;31mTomcat is already running (pid: $pid)\e[00m"
  else
    Start tomcat
    echo -e "\e[00;32mStarting tomcat\e[00m"
   ulimit -n 100000
   umask 007
   /bin/su -p -s /bin/sh tomcat
        if [ user_exists $TOMCAT_USER = "1" ]
        then
                su $TOMCAT_USER -c $CATALINA_HOME/bin/startup.sh
        else
                sh $CATALINA_HOME/bin/startup.sh
        fi
        status
  fi
  return 0
}
status(){
          pid=$(tomcat_pid)
          if [ -n "$pid" ]; then echo -e "\e[00;32mTomcat is running with pid: $pid\e[00m"
          else echo -e "\e[00;31mTomcat is not running\e[00m"
          fi
}
stop() {
  pid=$(tomcat_pid)
  if [ -n "$pid" ]
  then
    echo -e "\e[00;31mStoping Tomcat\e[00m"
   /bin/su -p -s /bin/sh tomcat
        sh $CATALINA_HOME/bin/shutdown.sh
    let kwait=$SHUTDOWN_WAIT
    count=0;
    until [ ps -p $pid | grep -c $pid = '0' ] || [ $count -gt $kwait ]
    do
      echo -n -e "\n\e[00;31mwaiting for processes to exit\e[00m";
      sleep 1
      let count=$count+1;
    done
    if [ $count -gt $kwait ]; then
      echo -n -e "\n\e[00;31mkilling processes which didn't stop after $SHUTDOWN_WAIT seconds\e[00m"
      kill -9 $pid
    fi
  else
    echo -e "\e[00;31mTomcat is not running\e[00m"
  fi
  return 0
}
user_exists(){
        if id -u $1 >/dev/null 2>&1; then
        echo "1"
        else
                echo "0"
        fi
}
case $1 in
        start)
          start
        ;;
        stop)  
          stop
        ;;
        restart)
          stop
          start
        ;;
        status)
                status
        ;;
        *)
                echo -e $TOMCAT_USAGE
        ;;
esac    
exit 0
```

同样进行修改默认配置，之后加入启动项。

测试：

```bash
[root@pinpoint pinpoint]# /etc/init.d/pp-web restart
Stoping Tomcat
Using CATALINA_BASE:   /data/service/pinpoint-web/
Using CATALINA_HOME:   /data/service/pinpoint-web/
Using CATALINA_TMPDIR: /data/service/pinpoint-web//temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-web//bin/bootstrap.jar:/data/service/pinpoint-web//bin/tomcat-juli.jar
waiting for processes to exitStarting tomcat
Using CATALINA_BASE:   /data/service/pinpoint-web/
Using CATALINA_HOME:   /data/service/pinpoint-web/
Using CATALINA_TMPDIR: /data/service/pinpoint-web//temp
Using JRE_HOME:        /usr/java/jdk7/
Using CLASSPATH:       /data/service/pinpoint-web//bin/bootstrap.jar:/data/service/pinpoint-web//bin/tomcat-juli.jar
Tomcat started.
Tomcat is running with pid: 30554
```

配置成功！！！

## 8、部署pinpoint- agent采集监控数据

需要另一台服务器，用来部署pinpoint-agent来采集服务器上的数据，返回给pinpoint，用来分析形成拓扑图。

### 1、上传安装包以及测试项目

网盘链接：

链接：https://pan.baidu.com/s/1Deu4QYoJwr7t78qs6R5Y9A

提取码：74ep

### 2、配置模拟环境的tomcat

配置jdk，配置方式与pinpoint方法相同

配置tomcat

```bash
[root@tomcat ~]# tar xf apache-tomcat-8.0.36.tar.gz 
[root@tomcat ~]# cd apache-tomcat-8.0.36/conf/
[root@tomcat conf]# sed -i "s/localhost/116.63.208.164/g" server.xml 
```

解压测试用的war包

```bash
[root@tomcat ~]# rm -rf apache-tomcat-8.0.36/webapps/*
[root@tomcat ~]# unzip test.war -d apache-tomcat-8.0.36/webapps/ROOT
Archive:  test.war
  inflating: apache-tomcat-8.0.36/webapps/ROOT/index.jsp  
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/commons-beanutils-1.7.0.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/commons-collections-3.1.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/commons-lang-2.5.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/commons-logging.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/ezmorph-1.0.3.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/lib/json-lib-2.1-jdk15.jar  
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/web.xml  
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/classes/
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/classes/com/
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/classes/com/yy/
   creating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/classes/com/yy/test/
  inflating: apache-tomcat-8.0.36/webapps/ROOT/WEB-INF/classes/com/yy/test/test.class 
```

### 3、配置pp-agent采集器

云主机开启pinpoint-collector的端口 9994，9995，9996

```bash
#解压pp-agent
[root@tomcat ~]# tar xf pinpoint-agent-1.5.2.tar.gz 
[root@tomcat ~]# mkdir -p /data/pp-agent
[root@tomcat ~]# mv pinpoint-agent-1.5.2 /data/pp-agent
#编辑配置文件
[root@tomcat ~]# cd /data/pp-agent/
[root@tomcat pp-agent]# vim pinpoint-agent-1.5.2/pinpoint.config profiler.collector.ip=47.103.24.126 修改它为pinpoint-collector的IP地址
#修改启动文件，增加探针
[root@tomcat ~]# cd apache-tomcat-8.0.36/bin/
[root@tomcat bin]# vim catalina.sh 
#在大概20行左右的位置添加如下内容
CATALINA_OPTS="$CATALINA_OPTS -javaagent:/data/pp-agent/pinpoint-agent-1.5.2/pinpoint-bootstrap-1.5.2.jar"添加pinpoint-bootstrap-1.5.2.jar的位置CATALINA_OPTS="$CATALINA_OPTS -Dpinpoint.agentId=pp123456"
CATALINA_OPTS="$CATALINA_OPTS -Dpinpoint.applicationName=MyTestPP"
```

### 4、监控tomcat

配置完成了，开始监控，启动测试的tomcat服务器。

```bash
[root@tomcat ~]# cd apache-tomcat-8.0.36/bin/
[root@tomcat bin]# ./startup.sh 
Using CATALINA_BASE:   /root/apache-tomcat-8.0.36
Using CATALINA_HOME:   /root/apache-tomcat-8.0.36
Using CATALINA_TMPDIR: /root/apache-tomcat-8.0.36/temp
Using JRE_HOME:        /usr/java/jdk7
Using CLASSPATH:       /root/apache-tomcat-8.0.36/bin/bootstrap.jar:/root/apache-tomcat-8.0.36/bin/tomcat-juli.jar
Tomcat started.
```

访问：http://ip:8080

访问http://ip:8080/test

此时访问pinpoint-web可以发现

**至此，pinpoint全链路监控搭建成功！**
