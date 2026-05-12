# PinPoint APM链路跟踪：监控报警 SpringBoot 服务
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/7.html
- 分类：链路追踪
- 分组：教程目录
PinPoint能做什么，可以服务的调用链路进行追踪并且当服务调用失败率等进行报警。

## 那么下面就对两种者进行一个对比：

对比点

Zipkin

Pinpoint

说明

技术点

√

Zipkin依赖于spring 框架的api支持，监控内容和范围有限

Pinpoint使用字节码注入技术，监控更为深入和广泛，比如可以看到调用了redis、哪几个微服务、mysql以及执行的sql等，非常方便的追踪问题，个人非常喜欢这一点

接入成本

√

Zipkin需要对应用简单改造即sleuth的引入和配置

Pinpoint只需要在服务器打入探针，对业务没有改动

扩展性

√

Zipkin使用http+json的spring cloud常用协议，方便进行扩展

Pinpoint现在使用grpc协议，也可以使用Thrift传输协议，出于传输数据量和性能的考虑

兼容性

√

Zipkin对spring cloud的支持性更好，也得益于上面说的扩展性

产品

√

相比较，Pinpoint可以说是一款成熟的产品

性能

√

由于才是的数据范围不同，即使Pinpoint采用了高性能的传输协议，但是Zipkin性能更好

## 1、基于Docker搭建

### 1、git 安装

首先确保git已安装：yum install -y git

### 2、docker 安装

yum-util提供yum-config-manager功能，另外两个是devicemapper驱动依赖：

yuminstall -y yum-utils device-mapper-persistent-data lvm2

设置docker的yum源：

yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

查看所有仓库中所有docker版本，并选择版本安装：

yumlist docker-ce --showduplicates | sort -r

yum安装docker-ce【这里可以直接使用不指定版本的方式】：

yum-y install docker-ce -- 安装最新的推荐 stable稳定版

yum-y install docker-ce-20.10.8 -- 安装指定版本

将docker添加到开机启动：

systemctl enable docker

查看当前docker的状态，刚安装好没有启动为dead：

systemctl status docker

启动docker：

systemctl start docker 停止： systemctl stop docker

### 3、docker-compose

如果是值安装一个服务那么使用docker即可，但是如果需要安装pinpoint这样依赖于好几个服务并且相互之间有着依赖关系（类似于k8s的容器编排），则使用docker-compose将其依赖初始化是追方便的。 但是也需要注意，由于都在同一台Linux上创建了：zookeeper集群、collector集群、Hbase集群数据库等，所有我 2核4G的服务器都快撑不住了。

从github拉取最新版本的docker-compose文件，如下：

> curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

但是如果拉取速度太慢或者链接不上，可以使用daocloud的镜像地址：

> sudo curl -L https://get.daocloud.io/docker/compose/releases/download/1.25.1/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

添加执行权限：

chmod +x /usr/local/bin/docker-compose

添加软链接：

ln-s /usr/local/bin/docker-compose /usr/bin/docker-compose

查看版本信息：docker-compose -v

### 4、docker-compose安装pinpoint

拉取pinpoint：git clone https://github.com/naver/pinpoint-docker.git

进入目录：cd pinpoint-docker

拉取镜像并后台启动：docker-compose pull && docker-compose up -d

安装完成后 docker-compose.yml 中volumn（大概17/18行）中，挂载的路径是否包含点，是就修改为觉得路径（即修改为下面的样子）：

当前使用了 && docker-compose up -d 命令启动，当修改了 docker-compose.yml 后会停止并删除之前的容器重新创建，但是之前容器的数据卷依旧保留

如果不想Compose扫描更改。和重新创建容器，请使用 --no-recreate 标志

如果要强制Compose停止并重新创建所有容器，请使用 --force-recreate标志

查看docker当前启动的进程： docker ps -a

或者使用 docker-compose命令查询进程：docker-compose ps

### 5、查看页面启动情况

首先保证Centos防火墙关闭或者开放所有对应的端口，如果是阿里云、华为云、腾讯云等保证开放了安全组规则对应的端口。

特别只有由于agent项目要想上传数据到 collector服务时，需要开放的端口有： 9991/9992/9993/9994/9995/9996， 否则可能引起很多麻烦

Flinnk页面： http://ip:8081

Pinpoint页面：http://ip:8079/

QuickStart页面：http://ip:8000/

Hbase页面：http://ip:16010

### 6、pinpoint-flink-job的jar包上传

在地址https://github.com/pinpoint-apm/pinpoint/releases中下载 对应版本的包，比如：[pinpoint-flink-job-2.3.3.jarhttps://github.com/pinpoint-apm/pinpoint/releases/download/v2.3.3/pinpoint-flink-job-2.3.3.jar][pinpoint-flink-job-2.3.3.jar_nbsp_nbsp 15_https_github.com_pinpoint-apm_pinpoint_releases_download_v2.3.3_pinpoint-flink-job-2.3.3.jar](https://github.com/pinpoint-apm/pinpoint/releases/download/v2.3.3/pinpoint-flink-job-2.3.3.jar)，下载并上传至8081页面中

## 2、spring-boot(或Tomcat)集成pinpoint-agent

### 1、下载并配置pinpoint-agent

从https://github.com/pinpoint-apm/pinpoint/releases选择最好是与服务器pinpoint-collection版本进行下载，如： [https://github.com/pinpoint-apm/pinpoint/releases/download/v2.3.3/pinpoint-agent-2.3.3.tar.gz](https://github.com/pinpoint-apm/pinpoint/releases/download/v2.3.3/pinpoint-agent-2.3.3.tar.gz)，进行解压，如下：

需要注意，pinpoint-root.config, 很多博客等写的是pinpoint.config，新版本默认就是查找的pinpoint-root.config，如下是我将pinpoint-root.config改成pinpoint.config的效果：

默认是没有执行权限的需要修改文件权限，如 chmod 777 pinpoint-root.config

然后修改 pinpoint-root.config文件，特别需要注意的配置有：

- profiler.collector.ip (collector的ip地址 xxx.xxx.xxx.xxx，特别是采集端agent与收集端collection不在同一台服务器)
- profiler.transport.grpc.collector.ip： 也改成采集的ip，否则启动服务报 9991连不上
- profiler.applicationservertype=SPRING_BOOT (指定采集的是Tomcat或者Spring boot等)
- profiler.collector.tcp.port (collector's collector.tcpListenPort - default: 9994)
- profiler.collector.stat.port (collector's collector.udpStatListenPort - default: 9995)
- profiler.collector.span.port (collector's collector.udpSpanListenPort - default: 9996)
- profiler.sampling.counting.sampling-rate=1
- profiler.sampling.rate=1（数据采样率，搜集数据的比率，默认为20即为1/20 5%，如想改为100%即设为1）

如果是spring boot项目需要执行配置项：

profiler.applicationservertype=SPRING_BOOT

最后要保证 目录下的 、script/脚本有执行权限，如没有执行权限可以使用命令：

chmod +x networktest.sh 或者 chmod 777 networktest.sh

最后要保证脚本能测试执行成功，有的说是修改 profiler.collector.ip配置为Collector服务器端的ip，应该新版本是修改profiler.transport.grpc.collector.ip配置，这里我都修改了， 只是每次启动都报 9991端口不能访问什么的。发现访问ip替换的不好用，最后使用的直接修改为ip， 自己理解应该是从外面传入时可以使用变量替换（如下面spring boot在启动参数中替换），并且防止这里从华为云到阿里云，将超时时间改的比较长。

### 2、使用java -jar方式启动项目

修改好配置后，spring boot项目只需在启动的 java -jar中间增加 pinpoint agent的命令，如下：

```bash
java \
-javaagent:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap.jar \
-Dpinpoint.agentId=mosty-001 -Dpinpoint.applicationName=mosty-single-001 \
-Dprofiler.transport.grpc.collector.ip=49.233.253.180 -Dprofiler.collector.ip=49.233.253.180 \
-jar XXX.jar
```

- -javaagent: 指定pinpointagent的jar路径；
- -Dpinpoint.agentId：指明agent的id，必须唯一；
- -Dpinpoint.applicationName：指明agent的名称，最好唯一；
- -Dprofiler.transport.grpc.collector.ip= 指定collector服务器的ip；
- -Dprofiler.collector.ip= 指定collector服务器的ip；

最后当项目启动时，发现在最开始日志打印了一大堆的pinpoint参数时就应该ok了：

```bash
4-13 20:31:13.557 INFO  PinpointBootStrap                   : pinpoint agentArgs:null
04-13 20:31:13.583 INFO  PinpointBootStrap                   : PinpointBootStrap.ClassLoader:null
04-13 20:31:13.583 INFO  PinpointBootStrap                   : ContextClassLoader:sun.misc.Launcher$AppClassLoader@18b4aac2
04-13 20:31:13.585 INFO  ClassAgentPathFinder                : agentPath:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap-2.3.3.jar
04-13 20:31:13.585 INFO  PinpointBootStrap                   : JavaAgentPath:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap-2.3.3.jar
04-13 20:31:13.586 INFO  AgentDirBaseClassPathResolver       : Agent original-path:/home/pinpoint/pinpoint-agent-2.3.3
04-13 20:31:13.587 INFO  AgentDirBaseClassPathResolver       : Agent canonical-path:/home/pinpoint/pinpoint-agent-2.3.3
04-13 20:31:13.587 INFO  BootDir                             : found pinpoint-commons.jar path:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-commons-2.3.3.jar
04-13 20:31:13.588 INFO  BootDir                             : found pinpoint-bootstrap-core.jar path:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-core-2.3.3.jar
04-13 20:31:13.589 INFO  BootDir                             : found pinpoint-annotations.jar path:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-annotations-2.3.3.jar
04-13 20:31:13.589 INFO  BootDir                             : found pinpoint-bootstrap-java8.jar path:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-java8-2.3.3.jar
04-13 20:31:13.590 INFO  BootDir                             : found pinpoint-bootstrap-java9.jar path:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-java9-2.3.3.jar
04-13 20:31:13.602 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-reactor-netty-plugin-2.3.3.jar
04-13 20:31:13.602 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-spring-webflux-plugin-2.3.3.jar
04-13 20:31:13.603 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-spring-plugin-2.3.3.jar
04-13 20:31:13.603 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-redis-lettuce-plugin-2.3.3.jar
04-13 20:31:13.604 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-commons-dbcp-plugin-2.3.3.jar
04-13 20:31:13.604 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-mssql-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.604 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-vertx-plugin-2.3.3.jar
04-13 20:31:13.605 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-mybatis-plugin-2.3.3.jar
04-13 20:31:13.605 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-weblogic-plugin-2.3.3.jar
04-13 20:31:13.606 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-spring-boot-plugin-2.3.3.jar
04-13 20:31:13.606 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jackson-plugin-2.3.3.jar
04-13 20:31:13.606 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-cubrid-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.607 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-cassandra-driver-plugin-2.3.3.jar
04-13 20:31:13.607 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-websphere-plugin-2.3.3.jar
04-13 20:31:13.607 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-redis-plugin-2.3.3.jar
04-13 20:31:13.608 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-httpclient4-plugin-2.3.3.jar
04-13 20:31:13.608 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-netty-plugin-2.3.3.jar
04-13 20:31:13.609 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-undertow-plugin-2.3.3.jar
04-13 20:31:13.609 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jdk-http-plugin-2.3.3.jar
04-13 20:31:13.609 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-elasticsearch-plugin-2.3.3.jar
04-13 20:31:13.610 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-druid-plugin-2.3.3.jar
04-13 20:31:13.610 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-user-plugin-2.3.3.jar
04-13 20:31:13.611 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-thread-plugin-2.3.3.jar
04-13 20:31:13.611 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-resin-plugin-2.3.3.jar
04-13 20:31:13.611 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-common-servlet-2.3.3.jar
04-13 20:31:13.612 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-ning-asynchttpclient-plugin-2.3.3.jar
04-13 20:31:13.612 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-mysql-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.612 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-ibatis-plugin-2.3.3.jar
04-13 20:31:13.613 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jetty-plugin-2.3.3.jar
04-13 20:31:13.613 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-rabbitmq-plugin-2.3.3.jar
04-13 20:31:13.614 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-hbase-plugin-2.3.3.jar
04-13 20:31:13.614 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-logback-plugin-2.3.3.jar
04-13 20:31:13.614 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-rocketmq-plugin-2.3.3.jar
04-13 20:31:13.615 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-tomcat-plugin-2.3.3.jar
04-13 20:31:13.615 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-mongodb-driver-plugin-2.3.3.jar
04-13 20:31:13.616 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-activemq-client-plugin-2.3.3.jar
04-13 20:31:13.616 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-elasticsearch-bboss-plugin-2.3.3.jar
04-13 20:31:13.616 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-fastjson-plugin-2.3.3.jar
04-13 20:31:13.617 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-apache-dubbo-plugin-2.3.3.jar
04-13 20:31:13.617 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-resttemplate-plugin-2.3.3.jar
04-13 20:31:13.618 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-informix-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.618 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-reactor-plugin-2.3.3.jar
04-13 20:31:13.618 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-openwhisk-plugin-2.3.3.jar
04-13 20:31:13.619 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-google-httpclient-plugin-2.3.3.jar
04-13 20:31:13.619 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jdk-completable-future-plugin-2.3.3.jar
04-13 20:31:13.619 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-agentsdk-async-plugin-2.3.3.jar
04-13 20:31:13.620 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-redis-redisson-plugin-2.3.3.jar
04-13 20:31:13.620 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-log4j-plugin-2.3.3.jar
04-13 20:31:13.621 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-process-plugin-2.3.3.jar
04-13 20:31:13.621 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-dubbo-plugin-2.3.3.jar
04-13 20:31:13.621 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-postgresql-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.622 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jboss-plugin-2.3.3.jar
04-13 20:31:13.622 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-httpclient3-plugin-2.3.3.jar
04-13 20:31:13.623 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-json-lib-plugin-2.3.3.jar
04-13 20:31:13.623 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-kafka-plugin-2.3.3.jar
04-13 20:31:13.623 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-log4j2-plugin-2.3.3.jar
04-13 20:31:13.624 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-grpc-plugin-2.3.3.jar
04-13 20:31:13.624 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-thrift-plugin-2.3.3.jar
04-13 20:31:13.624 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-gson-plugin-2.3.3.jar
04-13 20:31:13.625 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jtds-plugin-2.3.3.jar
04-13 20:31:13.625 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-okhttp-plugin-2.3.3.jar
04-13 20:31:13.626 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-akka-http-plugin-2.3.3.jar
04-13 20:31:13.626 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-mariadb-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.627 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-hystrix-plugin-2.3.3.jar
04-13 20:31:13.627 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-hikaricp-plugin-2.3.3.jar
04-13 20:31:13.627 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-rxjava-plugin-2.3.3.jar
04-13 20:31:13.628 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-commons-dbcp2-plugin-2.3.3.jar
04-13 20:31:13.628 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-jsp-plugin-2.3.3.jar
04-13 20:31:13.628 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-arcus-plugin-2.3.3.jar
04-13 20:31:13.629 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-paho-mqtt-plugin-2.3.3.jar
04-13 20:31:13.629 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-cxf-plugin-2.3.3.jar
04-13 20:31:13.630 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-undertow-servlet-plugin-2.3.3.jar
04-13 20:31:13.630 INFO  AgentDirBaseClassPathResolver       : Found plugins:/home/pinpoint/pinpoint-agent-2.3.3/plugin/pinpoint-oracle-jdbc-driver-plugin-2.3.3.jar
04-13 20:31:13.631 INFO  PinpointBootStrap                   : appendToBootstrapClassLoader:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-commons-2.3.3.jar
04-13 20:31:13.632 INFO  PinpointBootStrap                   : appendToBootstrapClassLoader:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-core-2.3.3.jar
04-13 20:31:13.632 INFO  PinpointBootStrap                   : appendToBootstrapClassLoader:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-annotations-2.3.3.jar
04-13 20:31:13.633 INFO  PinpointBootStrap                   : appendToBootstrapClassLoader:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-java8-2.3.3.jar
04-13 20:31:13.633 INFO  PinpointBootStrap                   : appendToBootstrapClassLoader:/home/pinpoint/pinpoint-agent-2.3.3/boot/pinpoint-bootstrap-java9-2.3.3.jar
04-13 20:31:13.634 INFO  PinpointBootStrap                   : parentClassLoader:BootStrapClassLoader:null
04-13 20:31:13.636 INFO  IdValidator                         : check SystemProperties(-D) agentId:mosty-001
04-13 20:31:13.637 INFO  AgentIdResolver                     : SystemProperties(-D) pinpoint.agentId=mosty-001
04-13 20:31:13.637 INFO  IdValidator                         : check SystemProperties(-D) applicationName:mosty-single-001
04-13 20:31:13.638 INFO  AgentIdResolver                     : SystemProperties(-D) pinpoint.applicationName=mosty-single-001
04-13 20:31:13.638 INFO  AgentIdResolver                     : No AgentName(-Dpinpoint.agentName) provided, it's optional!
04-13 20:31:13.640 INFO  ProfilePropertyLoader               : load default config:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-root.config
04-13 20:31:13.644 INFO  ProfilePropertyLoader               : active profile:release
04-13 20:31:13.644 INFO  ProfilePropertyLoader               : load profile:/home/pinpoint/pinpoint-agent-2.3.3/profiles/release/pinpoint.config
04-13 20:31:13.651 INFO  ProfilePropertyLoader               : agent root path:/home/pinpoint/pinpoint-agent-2.3.3
04-13 20:31:13.652 INFO  ProfilePropertyLoader               : logConfig path:/home/pinpoint/pinpoint-agent-2.3.3/profiles/release/
04-13 20:31:13.669 INFO  PinpointStarter                     : logPath:/home/pinpoint/pinpoint-agent-2.3.3/logs
04-13 20:31:13.670 INFO  PinpointStarter                     : pinpoint version:2.3.3
04-13 20:31:13.670 INFO  PinpointStarter                     : Log directory maxbackupsize=5
04-13 20:31:13.673 INFO  PinpointStarter                     : agent JarPath:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap-2.3.3.jar
04-13 20:31:13.673 INFO  PinpointStarter                     : agent LibDir:/home/pinpoint/pinpoint-agent-2.3.3/lib
04-13 20:31:13.673 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-rpc-2.3.3.jar
04-13 20:31:13.674 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-grpc-2.3.3.jar
04-13 20:31:13.674 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-thrift-2.3.3.jar
04-13 20:31:13.675 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-profiler-optional-jdk8-2.3.3.jar
04-13 20:31:13.675 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-commons-profiler-2.3.3.jar
04-13 20:31:13.676 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-agent-proxy-nginx-plugin-2.3.3.jar
04-13 20:31:13.676 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-profiler-2.3.3.jar
04-13 20:31:13.677 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-plugins-loader-2.3.3.jar
04-13 20:31:13.677 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-profiler-optional-jdk7-2.3.3.jar
04-13 20:31:13.678 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-agent-proxy-apache-plugin-2.3.3.jar
04-13 20:31:13.678 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-agent-proxy-user-plugin-2.3.3.jar
04-13 20:31:13.678 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-profiler-logging-2.3.3.jar
04-13 20:31:13.679 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-agent-proxy-app-plugin-2.3.3.jar
04-13 20:31:13.679 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-agent-proxy-common-2.3.3.jar
04-13 20:31:13.680 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-commons-buffer-2.3.3.jar
04-13 20:31:13.680 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/pinpoint-profiler-optional-jdk9-2.3.3.jar
04-13 20:31:13.681 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/log4j-api-2.12.3.jar
04-13 20:31:13.681 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/aopalliance-1.0.jar
04-13 20:31:13.681 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-codec-4.1.58.Final.jar
04-13 20:31:13.682 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/gson-2.8.6.jar
04-13 20:31:13.682 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-context-1.36.2.jar
04-13 20:31:13.683 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-netty-1.36.2.jar
04-13 20:31:13.683 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/slf4j-api-1.7.30.jar
04-13 20:31:13.684 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/libthrift-0.12.0.jar
04-13 20:31:13.684 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-stub-1.36.2.jar
04-13 20:31:13.685 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/proto-google-common-protos-2.0.1.jar
04-13 20:31:13.685 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-transport-native-epoll-4.1.58.Final-linux-x86_64.jar
04-13 20:31:13.686 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-tcnative-boringssl-static-2.0.36.Final.jar
04-13 20:31:13.686 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/asm-analysis-9.1.jar
04-13 20:31:13.686 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/j2objc-annotations-1.3.jar
04-13 20:31:13.687 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/guice-4.2.2.jar
04-13 20:31:13.687 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-api-1.36.2.jar
04-13 20:31:13.688 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-protobuf-1.36.2.jar
04-13 20:31:13.688 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-resolver-4.1.58.Final.jar
04-13 20:31:13.689 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/jsr305-3.0.2.jar
04-13 20:31:13.689 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-buffer-4.1.58.Final.jar
04-13 20:31:13.689 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/log4j-slf4j-impl-2.12.3.jar
04-13 20:31:13.690 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/log4j-core-2.12.3.jar
04-13 20:31:13.690 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-3.10.6.Final.jar
04-13 20:31:13.691 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-core-1.36.2.jar
04-13 20:31:13.691 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/log4j2.component.properties
04-13 20:31:13.692 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/snakeyaml-1.27.jar
04-13 20:31:13.692 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/animal-sniffer-annotations-1.19.jar
04-13 20:31:13.693 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/asm-util-9.1.jar
04-13 20:31:13.693 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/protobuf-java-3.12.0.jar
04-13 20:31:13.693 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/guava-30.1-android.jar
04-13 20:31:13.694 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/asm-tree-9.1.jar
04-13 20:31:13.694 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/asm-commons-9.1.jar
04-13 20:31:13.695 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/asm-9.1.jar
04-13 20:31:13.695 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-common-4.1.58.Final.jar
04-13 20:31:13.696 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-transport-native-unix-common-4.1.58.Final.jar
04-13 20:31:13.696 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/annotations-4.1.1.4.jar
04-13 20:31:13.696 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/perfmark-api-0.23.0.jar
04-13 20:31:13.697 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/grpc-protobuf-lite-1.36.2.jar
04-13 20:31:13.697 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-codec-http2-4.1.58.Final.jar
04-13 20:31:13.698 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/javax.inject-1.jar
04-13 20:31:13.698 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/failureaccess-1.0.1.jar
04-13 20:31:13.699 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/error_prone_annotations-2.3.4.jar
04-13 20:31:13.699 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-handler-4.1.58.Final.jar
04-13 20:31:13.700 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-codec-http-4.1.58.Final.jar
04-13 20:31:13.700 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/netty-transport-4.1.58.Final.jar
04-13 20:31:13.701 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/checker-compat-qual-2.5.5.jar
04-13 20:31:13.701 INFO  PinpointStarter                     : agent Lib:file:/home/pinpoint/pinpoint-agent-2.3.3/lib/
04-13 20:31:13.702 INFO  PinpointStarter                     : agent config:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-root.config
04-13 20:31:13.706 INFO  PinpointStarter                     : pinpoint agent [com.navercorp.pinpoint.profiler.DefaultAgent] starting...
04-13 20:31:13.715 INFO  Log4j2LoggingSystem                 : logPath:file:/home/pinpoint/pinpoint-agent-2.3.3/profiles/release/log4j2.xml
04-13 20:31:17.398 INFO  PinpointStarter                     : pinpoint agent started normally.
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _ | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.4.RELEASE)
2022-04-13 20:31:18.499  INFO 2315938 --- [           main] com.mosty.MostyApplication               : Starting MostyApplication v1.0.0-SNAPSHOT on ecs-6a8c-0002 with PID 2315938 (/home/mosty/project/mosty/mosty-1.0.0-SNAPSHOT.jar started by root in /home/mosty/project/mosty)
2022-04-13 20:31:18.502  INFO 2315938 --- [           main] com.mosty.MostyApplication               : No active profile set, falling back to default profiles: default
2022-04-13 20:31:19.689  WARN 2315938 --- [           main] o.m.s.mapper.ClassPathMapperScanner      : No MyBatis mapper was found in '[com.mosty]' package. Please check your configuration.
2022-04-13 20:31:19.777  INFO 2315938 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Multiple Spring Data modules found, entering strict repository configuration mode!
2022-04-13 20:31:19.781  INFO 2315938 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data Redis repositories in DEFAULT mode.
2022-04-13 20:31:19.819  INFO 2315938 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 19ms. Found 0 Redis repository interfaces.
04-13 20:31:20.020 [           main] WARN  c.n.p.p.i.ASMMethod                      -- Skip adding interceptor. 'abstract or native method' class=reactor.core.publisher.InternalMonoOperator, interceptor=com.navercorp.pinpoint.bootstrap.interceptor.ExceptionHandleAroundInterceptor
04-13 20:31:20.020 [           main] WARN  c.n.p.p.i.ASMMethod                      -- Skip adding interceptor. 'abstract or native method' class=reactor.core.publisher.FluxFromMonoOperator, interceptor=com.navercorp.pinpoint.bootstrap.interceptor.ExceptionHandleAroundInterceptor
04-13 20:31:20.020 [           main] WARN  c.n.p.p.i.ASMMethod                      -- Skip adding interceptor. 'abstract or native method' class=reactor.core.publisher.MonoFromFluxOperator, interceptor=com.navercorp.pinpoint.bootstrap.interceptor.ExceptionHandleAroundInterceptor
04-13 20:31:20.020 [           main] WARN  c.n.p.p.i.ASMMethod                      -- Skip adding interceptor. 'abstract or native method' class=reactor.core.publisher.InternalFluxOperator, interceptor=com.navercorp.pinpoint.bootstrap.interceptor.ExceptionHandleAroundInterceptor
```

### 3、Tomcat中启动项目

如果是直接下载Tomcat，或者yum 方式安装Tomcat等方式时，直接修改Tomcat的 **bin/catalina.sh**，指定启动项，只是将上面的 命令行中的启动项目换到启动脚本中

如：vim /usr/local/tomcat/bin/catalina.sh

```bash
JAVA_OPTS="$JAVA_OPTS -javaagent:/home/pinpoint/pinpoint-agent-2.3.3/pinpoint-bootstrap.jar"
JAVA_OPTS="$JAVA_OPTS -Dpinpoint.agentId=myTomcatId"
JAVA_OPTS="$JAVA_OPTS -Dpinpoint.applicationName=myTomcatName"
```

## 3、Pinpoint使用和效果

### 1、调用链路，执行异常的信息

pinpoint可以查看整体服务的调用链路，和执行异常的信息

### 2、调用链路和执行每步的耗时

可以查看具体的某个请求的调用链路和执行每步的耗时，sql等
