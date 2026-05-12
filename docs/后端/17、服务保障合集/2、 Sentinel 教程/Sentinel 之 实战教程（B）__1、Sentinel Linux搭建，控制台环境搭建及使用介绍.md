# 1、Sentinel Linux搭建，控制台环境搭建及使用介绍
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/29.html
- 分类：服务保障
- 分组：Sentinel 之 实战教程（B）
## 1、概述

Sentinel 提供一个轻量级的开源控制台，它提供机器发现以及健康情况管理、监控（单机和集群），规则管理和推送的功能。

> Sentinel 控制台包含如下功能:

> 查看机器列表以及健康情况： 收集 Sentinel 客户端发送的心跳包，用于判断机器是否在线。
>
> 监控 (单机和集群聚合)： 通过 Sentinel 客户端暴露的监控 API，定期拉取并且聚合应用监控信息，最终可以实现秒级的实时监控。
>
> 规则管理和推送： 统一管理推送规则。
>
> 鉴权： 生产环境中鉴权非常重要。这里每个开发者需要根据自己的实际情况进行定制。

## 2、下载启动

下载地址：[https://github.com/alibaba/Sentinel/releases](https://github.com/alibaba/Sentinel/releases)，下载相应版本的`jar`包，比如`sentinel-dashboard-1.8.1.jar`

**启动：**

`sentinel-dashboard`就是一个SpringBoot项目，直接使用命令启动即可，命令如下：

```bash
nohup java -Dserver.port=8080 -Dcsp.sentinel.dashboard.server=162.14.118.19:8080 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard-1.8.1.jar >sentinel.log 2>&1 & echo $! > pidfile.txt
```

- -Dserver.port=8080 用于指定 Sentinel 控制台端口为 8080.
- -Dcsp.sentinel.dashboard.server=consoleIp:port 指定控制台地址和端口.

**访问：**

地址：[http://162.14.118.19:8080](http://localhost:8080) ；默认账户密码：sentinel/sentinel

**鉴权：**

从Sentinel 1.6.0 起，Sentinel 控制台引入基本的登录功能，默认用户名和密码都是 sentinel。该鉴权能力非常基础，生产环境使用建议根据安全需要自行改造。

> 用户可以通过如下JVM参数进行配置：

- Dsentinel.dashboard.auth.username=sentinel 用于指定控制台的登录用户名为 sentinel；
- Dsentinel.dashboard.auth.password=123456 用于指定控制台的登录密码为 123456；如果省略这两个参数，默认用户和密码均为 sentinel；
- Dserver.servlet.session.timeout=7200 用于指定 Spring Boot 服务端 session 的过期时间，如 7200 表示 7200 秒；60m 表示 60 分钟，默认为 30 分钟；

除了修改JVM启动参数的形式，还是源码中通过`application.properties`文件进行配置.

## 3、配置项目说明

控制台的一些特性可以通过配置项来进行配置

配置项
类型
默认值
最小值
描述

auth.enabled
boolean
true
-
是否开启登录鉴权，仅用于日常测试，生产上不建议关闭

sentinel.dashboard.auth.username
String
sentinel
-
登录控制台的用户名，默认为 sentinel

sentinel.dashboard.auth.password
String
sentinel
-
登录控制台的密码，默认为 sentinel

sentinel.dashboard.app.hideAppNoMachineMillis
Integer
0
60000
是否隐藏无健康节点的应用，距离最近一次主机心跳时间的毫秒数，默认关闭

sentinel.dashboard.removeAppNoMachineMillis
Integer
0
120000
是否自动删除无健康节点的应用，距离最近一次其下节点的心跳时间毫秒数，默认关闭

sentinel.dashboard.unhealthyMachineMillis
Integer
60000
30000
主机失联判定，不可关闭

sentinel.dashboard.autoRemoveMachineMillis
Integer
0
300000
距离最近心跳时间超过指定时间是否自动删除失联节点，默认关闭

sentinel.dashboard.unhealthyMachineMillis
Integer
60000
30000
主机失联判定，不可关闭

server.servlet.session.cookie.name
String
sentinel_dashboard_cookie
-
控制台应用的 cookie 名称，可单独设置避免同一域名下 cookie 名冲突

通过JVM方式为：启动时在`配置项目`前面加上`-D`即可，比如：`java -Dsentinel.dashboard.app.hideAppNoMachineMillis=60000`

## 4、控制台介绍

**查看机器列表以及健康情况：**

在机器列表中看到的连接到`sentinel`的机器，并且展示监控状况

**簇点链路：**

簇点链路（单机调用链路）页面实时的去拉取指定客户端资源的运行情况。它一共提供两种展示模式：一种用树状结构展示资源的调用链路，另外一种则不区分调用链路展示资源的实时情况。

**注意:** 簇点链路监控是内存态的信息，它仅展示启动后调用过的资源。

**实时监控：**

同一个服务下的所有机器的簇点信息会被汇总，并且秒级地展示在"实时监控"下。需要确保 Sentinel 控制台所在的机器时间与自己应用的机器时间保持一致，否则会导致拉不到实时的监控数据。

**注意:** 实时监控仅存储 5 分钟以内的数据，如果需要持久化，需要通过调用[实时监控接口](https://github.com/alibaba/Sentinel/wiki/%E5%AE%9E%E6%97%B6%E7%9B%91%E6%8E%A7)来定制。

**规则管理：**

Sentinel规则分为：流控、降级、热点、 系统、授权，通过控制台可以对各个`资源`配置相应的规则

## 5、linux自启部署

**1、建立sentinel文件夹**

```bash
mkdir /root/sentinel
```

并且将下载或者编译完的`jar` 拷贝搭到`/root/sentinel`目录下

**2、建立start.sh脚本**

```bash
vim /root/sentinel/start.sh
```

内容如下：

```bash
#!/bin/sh
export LANG="en_US.UTF-8"
cd /root/sentinel
runMessage=ps aux | grep \cat pidfile.txt\
projectStartCommand="/usr/local/java/jdk1.8.0_131/bin/java -jar sentinel-dashboard-1.8.1.jar"
if [[ $runMessage == *$projectStartCommand* ]]
then
echo "Application has starting ,restarting..."
kill -9 cat pidfile.txt
nohup /usr/local/java/jdk1.8.0_131/bin/java -Dserver.port=8080 -Dcsp.sentinel.dashboard.server=162.14.118.19:8080 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard-1.8.1.jar -java.tmp.dir=/root/sentinel/temp >/dev/null >sentinel_logs 2>&1 & echo $! > pidfile.txt
else
echo "Application has stopped ,starting..."
nohup /usr/local/java/jdk1.8.0_131/bin/java -Dserver.port=8080 -Dcsp.sentinel.dashboard.server=162.14.118.19:8080 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard-1.8.1.jar -java.tmp.dir=/root/sentinel/temp >/dev/null >sentinel_logs 2>&1 & echo $! > pidfile.txt
fi
```

**3、建立stop.sh脚本**

```bash
#!/bin/sh
cd /root/sentinel
PID=$(cat pidfile.txt)
if [ ${PID} ];
then
echo 'Application is stpping...'
echo kill $PID DONE
kill $PID
else
echo 'Application is already stopped...'
fi
```

**4、修改权限**

```bash
chmod 777 /root/sentinel/start.sh
chmod 777 /root/sentinel/stop.sh
```

**5、自启设置**

创建`sentinel.service`

```bash
vim /usr/lib/systemd/system/sentinel.service
```

内容：

```bash
[Unit]
Description=sentinel
[Service]
Type=forking
# 指定脚本路径
ExecStart=/root/sentinel/start.sh
ExecStop=/root/sentinel/stop.sh
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```

**6、开启自启：**

```bash
systemctl daemon-reload
systemctl enable sentinel.service
```

**7、使用命令**

```bash
# 启动
systemctl start sentinel
# 停止
systemctl stop sentinel
```

## 6、整合SpringCloud使用

```bash
spring:
 cloud:
  sentinel:
   transport:
     port: 9999跟控制台交流的端口,随意指定一个未使用的端口即可
	 dashboard: 162.14.118.19:8080 指定控制台服务的地址
   log:
     dir: logs/sentinel日志输出地址
```

**验证：**

Sentinel 会在客户端首次调用的时候进行初始化，开始向控制台发送心跳包，我们启动服务后，请求任意一个接口后，即可成功注册。
