# 13、SpringCloud Alibaba 之 SkyWalking 下载安装，应用
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/13.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
随着互联网[架构](https://so.csdn.net/so/search?q=%E6%9E%B6%E6%9E%84&spm=1001.2101.3001.7020)的扩张，分布式系统变得日趋复杂，越来越多的组件开始走向分布式化，如微服务、消息收发、分布式数据库、分布式缓存、分布式对象存储、跨域调用，这些组件共同构成了繁杂的分布式网络

对于一个由几十个、甚至几百个大型微服务构成的微服务架构系统，通常会遇到下面一些问题，如：

**1、** 一个请求调用其中一个服务失败，如何定位问题？；

**2、** :如何计算每个节点访问流量？；

**3、** 流量波动的时候，增加哪些节点集群服务？；

为了解决分布式应用、[微服务](https://so.csdn.net/so/search?q=%E5%BE%AE%E6%9C%8D%E5%8A%A1&spm=1001.2101.3001.7020)系统面临的这些挑战，**APM**系统（**Application Performance Management**，即**应用性能管理**，简单来说就是**应用监控**）营运而生

## 一、Skywalking

**Skywalking** 是一个国产的开源框架，2015年由吴晟个人开源（国人开源的产品，主要开发人员来自于华为），2017年加入Apache孵化器，2019年4月17日Apache董事会批准SkyWalking成为顶级项目，支持Java、.Net、NodeJs等探针，数据存储支持Mysql、Elasticsearch等，跟Pinpoint一样采用字节码注入的方式实现代码的无侵入，探针采集数据粒度粗，但性能表现优秀，且对云原生支持，目前增长势头强劲，社区活跃

Skywalking是分布式系统的应用程序性能监视工具，专为微服务，云原生架构和基于容器（Docker，K8S,Mesos）架构而设计，它是一款优秀的APM（Application Performance Management）工具，包括了分布式追踪、服务网格遥测分析、性能指标分析、服务依赖分析、度量聚合和可视化一体化解决方案等

官网：[Apache SkyWalking](http://skywalking.apache.org/)

下载：[Downloads | Apache SkyWalking](http://skywalking.apache.org/downloads/)

Github：[GitHub - apache/skywalking: APM, Application Performance Monitoring System](https://github.com/apache/skywalking)

使用公司：（国内非常多）

[https://github.com/apache/skywalking/blob/master/docs/powered-by.md](https://github.com/apache/skywalking/blob/master/docs/powered-by.md)

### 链路追踪

谷歌在2010 年 4 月发表了一篇论文《Dapper, a Large-Scale Distributed Systems Tracing Infrastructure》介绍了分布式追踪的概念，之后很多互联网公司都开始根据这篇论文打造自己的分布式链路追踪系统。APM 系统的核心技术就是分布式链路追踪。

论文在线地址：[https://storage.googleapis.com/pub-tools-public-publication-data/pdf/36356.pdf](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/36356.pdf)

国内的翻译版：[https://bigbully.github.io/Dapper-translation/](https://bigbully.github.io/Dapper-translation/)

### 1、Skywalking主要功能特性

**1、** 多种监控手段，可以通过语言探针和servicemesh获得监控的数据；

**2、** 支持多种语言自动探针，包括Java，.NETCore和Node.JS；

**3、** 轻量高效，无需大数据平台和大量的服务器资源；

**4、** 模块化，UI、存储、集群管理都有多种机制可选；

**5、** 支持告警；

**6、** 优秀的可视化解决方案；

### 2、分布式链路追踪技术成熟产品

分布式链路追踪技术已然成熟，产品也不少，国内外都有，如：

**1、** SpringCloudSleuth+TwitterZipkin；

`Zipkin`是Twitter开源的调用链分析工具，目前基于springcloud sleuth得到了广泛的使用，特点是轻量，使用部署简单。

**2、** 阿里巴巴的“鹰眼”EagleEye；

**3、** 大众点评的“CAT”；

`CAT`是大众点评开源的基于编码和配置的调用链分析，应用监控分析，日志采集，监控报警等一系列的监控平台工具。

**4、** 美团的“Mtrace”；

**5、** 京东的“Hydra”；

**6、** 新浪的“Watchman”；

**7、** SkyWalking；

`SkyWalking`是本土开源的基于字节码注入的调用链分析，以及应用监控分析工具。特点是支持多种插件，UI功能较强，接入端无代码侵入。目前已加入Apache孵化器。

## 二、Skywalking 架构

整个架构分成四部分：

**1、** 上部分Agent：负责从应用中，收集链路信息，发送给SkyWalkingOAP服务器；

**2、** 下部分SkyWalkingOAP：负责接收Agent发送的Tracing数据信息，然后进行分析(AnalysisCore)，存储到外部存储器(Storage)，最终提供查询(Query)功能；

**3、** 右部分Storage：Tracing数据存储，目前支持ES、MySQL、ShardingSphere、TiDB、H2多种存储器，目前采用较多的是ES，主要考虑是SkyWalking开发团队自己的生产环境采用ES为主；

**4、** 左部分SkyWalkingUI：负责提供控台，查看链路等等；

## 三、Skywalking 下载安装部署

注：

数据存储默认使用 **H2 数据库**存储

/xx/apache-skywalking-apm-bin/config/application.yml 文件

**1、** 下载SkyWalking软件包；

下载：[Downloads | Apache SkyWalking](http://skywalking.apache.org/downloads/)

点击右侧的`Distribution`选择想要的版本进行下载，如果这里没有你想要的版本，可以将页面下拉 ，选择 [Archive repository](https://archive.apache.org/dist/skywalking/)

> 注：
>
> Skywalking 在 8.8.0版本以后将agent单独拆分了出来，所以若要使用8.8.0版本以后的，需要下载apm和agent两个压缩包

下载Agent 压缩包

解压缩

```bash
 tar -zxvf apache-skywalking-java-agent-8.8.0.tgz -C /opt/software/
```

切换到目录下查看

```bash
cd skywalking-agent/
```

apm和 agent 分别安装路径

2、搭建一个 SkyWalking OAP 和SkyWalking UI服务

（1）将 apache-skywalking-apm-8.8.1.tar 上传到 Linux系统上的 /opt/software 目录下

（2）解压

```bash
tar -zxvf apache-skywalking-apm-8.8.1.tar.gz -C /opt/software/
```

（3）切换：cd apache-skywalking-apm-bin ，目录如下

目录说明：

> agent #SkyWalking Agent；Skywalking 在 8.8.0版本以后将agent单独拆分了出来
>
> bin #执行脚本
>
> config #SkyWalking OAP Server 配置文件
>
> LICENSE
>
> licenses
>
> NOTICE
>
> oap-libs #SkyWalking OAP Server
>
> README.txt
>
> tools
>
> webapp #SkyWalking UI

**3、** 启动一个SpringBoot应用，并配置SkyWalkingAgent；

（1）切换到 bin 目录

（2）启动 ./startup.sh 或 sh startup.sh

启动后会启动两个服务，一个是 **skywalking-oap-server**，一个是 **skywalking-web-ui**

查看安装目录下的 ./logs/skywalking-oap-server.log 下的日志文件，检查两个服务的日志文件是否启动成功

skywalking-oap-server服务启动后会占用：11800 和 12800 两个端口

```java
tail -f logs/skywalking-oap-server.log 
```

skywalking-web-ui服务会占用 8080 端口；

如果想要修改SkyWalking UI服务的参数，可以编辑webapp/webapp.yml 配置文件，如：

server.port：SkyWalking UI服务端口，默认是8080；

collector.ribbon.listOfServers：SkyWalking OAP服务地址数组，SkyWalking UI界面的数据是通过请求SkyWalking OAP服务来获得

4、访问SkyWalking UI界面：[http://192.168.133.128:8080/](http://192.168.172.128:8080/)，默认端口为8080

页面的右下角可以中英文切换，可以切换选择要展示的时间区间的跟踪数据

## 四、SkyWalking Agent跟踪微服务

### 1、jar包

**1、** 编写一个springboot项目，打成jar包；

**2、** 上传到Linux服务器上；

**3、** 编写启动脚本，命名skywalking-agent.sh；

注：

**Skywalking 在 8.8.0版本以后将agent单独拆分了出来，所以若要使用8.8.0版本以后的，需要下载apm和agent两个压缩包**

博主分别安装 apm 和 agent 路径

启动脚本

在启动程序前加一个 **-javaagent** 参数即可完成对程序的跟踪

```bash
#!/bin/sh
# SkyWalking Agent配置;Skywalking 在 8.8.0版本以后将agent单独拆分了出来
export SW_AGENT_NAME=springboot-2-hello Agent名字,一般使用spring.application.name 
export SW_AGENT_COLLECTOR_BACKEND_SERVICES=127.0.0.1:11800 配置 Collector 地址
export SW_AGENT_SPAN_LIMIT=2000 配置链路的最大Span数量，默认为 300
export JAVA_AGENT=-javaagent:/opt/software/skywalking-agent/skywalking-agent.jar /opt/software/apache-skywalking-apm-bin/agent/skywalking-agent.jar
java $JAVA_AGENT -jar springboot-2-hello.jar jar启动
```

**4、** 执行启动脚本；

```bash
sh skywalking-agent.sh
```

```bash
[root@eureka8761 app]# sh skywalking-agent.sh 
DEBUG 2022-07-26 13:53:18:461 main AgentPackagePath : The beacon class location is jar:file:/opt/software/skywalking-agent/skywalking-agent.jar!/org/apache/skywalking/apm/agent/core/boot/AgentPackagePath.class. 
INFO 2022-07-26 13:53:18:463 main SnifferConfigInitializer : Config file found in /opt/software/skywalking-agent/config/agent.config. 
```

启动成功

**5、** 浏览器输入访问，[http://192.168.133.129:8081/springboot-2-hello/index.jsp](http://192.168.133.129:8081/springboot-2-hello/index.jsp)；

查看SkyWalking-UI控制台

### 2、war包

**1、** 编写一个springboot项目，打成war包；

**2、** 上传到Linux服务器上；

**3、** 修改/xx/apache-tomcat-xx/bin/catalina.sh文件，在顶部第一行加上：

```bash
CATALINA_OPTS="$CATALINA_OPTS -javaagent:/opt/software/skywalking-agent/skywalking-agent.jar";
export CATALINA_OPTS;
```

注：

（1）根据自身 安装 skywalking-agent.jar 路径配置

（2）如果tomcat端口与skywalking ui端口冲突的话，修改一下tomcat端口

**4、** 启动Tomcat；

**5、** 查看SkyWalking-UI控制台；

设置的**Your_ApplicationName** 可在 /xx/skywalking-agent/config/**agent.config** 文件中查看

点击就可查看日志，跟踪等
