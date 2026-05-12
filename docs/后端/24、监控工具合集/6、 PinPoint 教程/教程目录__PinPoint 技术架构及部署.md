# PinPoint 技术架构及部署
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/3.html
- 分类：链路追踪
- 分组：教程目录
## 1、背景

随着项目微服务的进行，微服务数量逐渐增加，服务间的调用也越来越复杂，我们急切需要一个APM工具帮我们监控各个服务的性能及对服务间的调用进行跟踪，而通过调研多个开源APM工具后，最终我们选择了pintpoint。

**1.1、github地址是：[https://github.com/naver/pinpoint](https://github.com/naver/pinpoint)**

**1.2、选择它有4个方面原因：**

**1、** PinPoint是基于java开发的，利于项目后期对源代码的修改；

**2、** 集成PinPoint不需要修改一行代码；

**3、** PinPoint有非常直观的UI，符合项目的当前需求；

**4、** PinPoint的社区还是挺活跃，一般提问题第二天就有项目的committer回复；

## 2、简介

PinPoint是一个开源的 APM (Application Performance Management/应用性能管理)工具，用于基于java的大规模分布式系统。在使用上力图简单高效，通过在启动时安装agent，不需要修改哪怕一行代码，最小化性能损失(3%).

**2.1、架构图**

**2.2、三个主要组件**

- Collector, 收集应用中agent发送的数据并存储到Hbase中
- Agent, 是和应用一起启动的和应用共享JVM，定时发送数据给Collector
- Web UI, 从hbase中读取数据并展示给用户，之后会有demo展示其功能

**2.3、依赖环境**

- JDK：1.8
- Pinpoint：1.7.3
- Tomcat：7.0.59

## 3、Pinpoint Collector 收集端

部署在独立的Tomcat容器中，如 tomcat-pinpoint-collector

**3.1、安装 pinpoint-collector**

```bash
上传pinpoint-collector-1.7.3.war到 tomcat/webapps目录
解压：
unzip pinpoint-collector-1.7.3.war -d pinpoint-collector
```

**3.2、配置 pinpoint-collector**

Pinpoint Collector 有 2 个配置文件: pinpoint-collector.properties 和 hbase.properties

这些配置文件在war文件下的 WEB-INF/classes 目录

**3.2.1、pinpoint-collector.properties： 包含colletor的配置，在配置pinpoint agent时需要与之对应：**

- collector.receiver.base.port（agent中是 profiler.collector.tcp.port - 默认: 9994）
- collector.receiver.stat.udp.port（agent中是 profiler.collector.stat.port - 默认: 9995）
- collector.receiver.span.udp.port（agent中是 profiler.collector.span.port - 默认: 9996）

```bash
注意：pinpoint collector 1.5.x版本 和 较新的 1.7.x版本的 pinpoint-collector.properties配置文
件有差异
具体参考：
https://github.com/naver/pinpoint/blob/1.7.3/collector/src/main/resources/pinpoint-collecto
r.properties
https://github.com/naver/pinpoint/blob/1.5.2/collector/src/main/resources/pinpoint-collecto
r.properties
```

- cluster.zookeeper.address（默认: localhost，修改为hbase相关的zookeeper的IP地址）

**3.3.2、hbase.properties ： 包含连接到HBase的配置**

- hbase.client.host （默认: localhost，修改为hbase相关的zookeeper的IP地址）
- hbase.client.port （默认: 2181）

查看pinpoint-collector.properties的其它配置，请看[https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/pinpoint-web.properties](https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/pinpoint-web.properties)

查看hbase.properties的其它配置，请看[https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/hbase.properties](https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/hbase.properties)

## 4、Pinpoint Web

部署在独立的Tomcat容器中，如 tomcat-pinpoint-web

**4.1、安装 pinpoint-web**

```bash
上传pinpoint-web-1.7.3.war到 tomcat/webapps目录
pinpoint-web应用需要部署为tomcat的ROOT应用
cd tomcat/webapps
rm -fr ROOT
unzip pinpoint-web-1.7.3.war -d ROOT
```

**4.2、配置 pinpoint-web**

和collector类似，Pinpoint web有和安装相关的配置文件：pinpoint-web.properties 和 hbase.properties

这些文件在 WEB-INF/classes 目录下

- pinpoint-web.properties

cluster.zookeeper.address（默认: localhost，修改为hbase相关的zookeeper的IP地址）

- hbase.properties ： 包含连接到HBase的配置

hbase.client.host （默认: localhost，修改为hbase相关的zookeeper的IP地址）

hbase.client.port （默认: 2181）

查看pinpoint-web.properties的其它配置

请看[https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/pinpoint-web.properties](https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/pinpoint-web.properties)

查看hbase.properties的其它配置

请看[https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/hbase.properties](https://github.com/naver/pinpoint/blob/1.7.3/web/src/main/resources/hbase.properties)

## 5、Pinpoint Agent

**5.1、安装 pinpoint-agent**

```bash
上传pinpoint-agent-1.7.3.tar.gz到安装目录，如 /home/jyapp
解压：
mkdir pinpoint-agent
tar zxvf pinpoint-agent-1.7.3.tar.gz -C pinpoint-agent
pinpoint-agent 目录层次如下：
|-- boot
| |-- pinpoint-bootstrap-core-$VERSION.jar
|-- lib
| |-- pinpoint-profiler-$VERSION.jar
| |-- pinpoint-profiler-optional-$VERSION.jar
| |-- pinpoint-rpc-$VERSION.jar
| |-- pinpoint-thrift-$VERSION.jar
| |-- ...
|-- pinpoint-bootstrap-$VERSION.jar
|-- pinpoint.config（Agent配置文件）
```

Pinpoint Agent 作为一个java agent需要附加到采样的应用（如 Tomcat）

为了让agent生效，在运行应用时需要设置 -javaagent JVM 参数为 $AGENT_PATH/pinpointbootstrap-$

VERSION.jar

```bash
-javaagent:$AGENT_PATH/pinpoint-bootstrap-$1 VERSION.jar
```

另外，Pinpoint Agent 需要两个命令行参数来在分布式系统中标记自身:

- -Dpinpoint.agentId - 唯一标记agent运行所在的应用（如，loan-33）
- -Dpinpoint.applicationName - 将许多的同样的应用实例分组为单一服务（如，loan）

注意：pinpoint.agentId 必须全局唯一来标识应用实例， 而所有共用相同 pinpoint.applicationName 的应用被当

成单个服务的多个实例

**5.2、配置 pinpoint-agent**

在pinpoint.config 中有很多Pinpoint Agent的配置选项 ，而最重要的必须检查的配置选项是collector ip

address 和 TCP/UDP 端口，Agent需要这些值来创建到collector的连接并正确工作

在pinpoint.config 中相应的设置这些值：

- profiler.collector.ip （pinpoint collector ip，默认: 127.0.0.1）
- profiler.collector.tcp.port （collector中是 collector.receiver.base.port - 默认: 9994）
- profiler.collector.stat.port （collector中是 collector.receiver.stat.udp.port - 默认: 9995）
- profiler.collector.span.port （collector中是 collector.receiver.span.udp.port - 默认: 9996）

查看pinponit.config的其它配置，

请看[https://github.com/naver/pinpoint/blob/1.7.3/agent/src/main/resources-release/pinpoint.config](https://github.com/naver/pinpoint/blob/1.7.3/agent/src/main/resources-release/pinpoint.config)

**5.3、Tomcat集成示例**

在tomcat 启动脚本（catalina.sh）中添加 -javaagent， -Dpinpoint.agentId， -Dpinpoint.applicationName

```bash
JAVA_OPTS="$JAVA_OPTS -javaagent:/home/jyapp/pinpoint-agent/pinpoint-bootstrap-1.7.3.jar"
JAVA_OPTS="$JAVA_OPTS -Dpinpoint.agentId=$AGENT_ID"
JAVA_OPTS="$JAVA_OPTS -Dpinpoint.applicationName=$APPLICATION_NAME"
注意：
$AGENT_ID - 需改为应用的唯一标记，如 loan-33，代表loan 33服务器
$APPLICATION_NAME - 需改为应用名，如 loan，代表贷款应用
```

启动tomcat来开始web应用的采样

SpringBoot微服务同理，在启动命令上添加 -javaagent， -Dpinpoint.agentId， -Dpinpoint.applicationName 即可

## 6、监控效果图

## 7、其他

将web请求路由到agent

从1.5.0 版本开始， Pinpoint 可以通过collector从web直接发送请求到agent（反之亦然）。 为此需要使用

Zookeeper 来协调agent和collector之间和collectors 和 web 之间的通讯通道.。在此之上，实时通讯（例如活动

线程数量监控）才变的可能

通常使用HBase后端提供的Zookeeper实例，这样就不需要额外的Zookeeper配置。相关的配置选项在这里：

**7.1、pinpoint-web.properties**

```bash
cluster.enable=true
cluster.web.tcp.port=9997
cluster.zookeeper.address=localhost
cluster.zookeeper.sessiontimeout=30000
cluster.zookeeper.retry.interval=60000
cluster.connect.address=
```

**7.2、pinpoint-collector.properties**

```bash
cluster.enable=true
cluster.zookeeper.address=localhost
cluster.zookeeper.sessiontimeout=30000
cluster.listen.ip=
cluster.listen.port=
```
