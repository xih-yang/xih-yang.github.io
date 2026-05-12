# 02、SkyWalking部署-Windows环境（SkyWalking Windows环境部署）
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/2.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 一、环境搭建资料

https://blog.csdn.net/zhangkang65/article/details/78991760

## 1、下载

### 1.1官网地址

http://skywalking.apache.org/downloads/

gitlib中文文档地址：

https://github.com/apache/incubator-skywalking/blob/v5.0.0-alpha/docs/README_ZH.md

官方网站：

http://skywalking.apache.org/

http://incubator.apache.org/projects/skywalking.html

github项目地址：

https://github.com/OpenSkywalking/skywalking-netcore

下载

http://skywalking.apache.org/downloads/

## 2、架构图

## 二、Windows本地部署

## 1、版本要求

- SkyWalking5.0.0-GA
- ElasticSearch-5.x
- 注意6.X版本不支持；新版本的skywalking使用ES作为存储，所以先安装es。
- JDK8+ (SkyWalking collector和WebUI部署在jdk8及以上版本)
- JDK6+(被监控的应用程序运行在jdk6及以上版本)
- 被监控应用的宿主服务器系统时间(包含时区)与collectors,UIs部署的宿主服务器时间设置正确且相同

## 2、部署过程

### 【参考】

https://blog.csdn.net/y_h_d/article/details/83342846

https://blog.csdn.net/jilo88/article/details/81355265

### 2.1 ES

**2、** 1.1配置；

**修改config/elasticsearch.yml文件**

**1、** 设置：

（1）、设置 cluster.name: CollectorDBCluster

此名称需要和collector配置文件一致。->collector配置文件需要和该名称一致【】。

-如：

collector配置文件为config\application.yml，其中配置为

clusterName: CollectorDBCluster。如下图

（2）、设置 node.name: CollectorDBCluster1

可以设置为任意名字，如Elasticsearch为集群模式，则每个节点名称需要不同。

**2、** 增加如下配置：

# ES监听的ip地址

#network.host: 172.16.105.93【???-未通过】

#-解释 https://www.cnblogs.com/sunxucool/p/3799190.html

network.host: 0.0.0.0

thread_pool.bulk.queue_size: 1000

**2、** 1.2验证；

localhost:9200或ip:9200（http://172.21.123.99:9200/）

### 2.2 SW-collector

**2、** 2.1端口要求；

确保端口10800,11800,12800不被占用

**2、** 2.2存储要求；

`collector`配置ElasticSearch作为运行存储介质

**2、** 2.3时间设置要求；

被监控应用的宿主服务器系统时间(包含时区)与collectors,UIs部署的宿主服务器时间设置正确且相同【???】

**2、** 2.4配置；

- 位置

apache-skywalking-apm-incubating\config\application.yml

- 配置项解释（官方解释）

下面是关于collector连接配置的5种类型方式

naming :agent使用HTTP协议连接collectors

agent_gRPC :agent使用gRPC协议连接collectors

remote :Collector使用gRPC协议连接collector

ui :使用HTTP协议连接collector,(大多数情况不需要修改)

agent_jetty:agent使用HTTP协议连接collectors(可选连接)

- 配置内容1（官方解释- cluster方式）

cluster:

# The Zookeeper cluster for collector cluster management.

zookeeper:

hostPort: localhost:2181

sessionTimeout: 100000

naming:

# Host and port used for agent config

jetty:

# 配置agent发现collector集群,host必须要系统真实网络ip地址. agent --(HTTP)--> collector

host: localhost

port: 10800

contextPath: /

remote:

gRPC:

# 配置collector节点在集群中相互通信,host必须要系统真实网络ip地址.

# collectorN --(gRPC) --> collectorM

host: localhost

port: 11800

agent_gRPC:

gRPC:

# 配置agent上传(链路跟踪和指标)数据到collector,host必须要系统真实网络ip地址. agent--(gRPC)--> collector

host: localhost

port: 11800

agent_jetty:

jetty:

# 配置agent上传(链路跟踪和指标)数据到collector,host必须要系统真实网络ip地址. agent--(HTTP)--> collector

# SkyWalking native Java/.Net/node.js agents don't use this.

# Open this for other implementor.

host: localhost

port: 12800

contextPath: /

analysis_register:

default:

analysis_jvm:

default:

analysis_segment_parser:

default:

bufferFilePath: ../buffer/

bufferOffsetMaxFileSize: 10M

bufferSegmentMaxFileSize: 500M

ui:

jetty:

# 配置UI访问collector,host必须要系统真实网络ip地址.

host: localhost

port: 12800

contextPath: /

# 配置Elasticsearch 集群连接信息

storage:

elasticsearch:

clusterName: CollectorDBCluster

clusterTransportSniffer: true

clusterNodes: localhost:9300

indexShardsNumber: 2

indexReplicasNumber: 0

highPerformanceMode: true

# 设置统计指标数据的失效时间，当指标数据失效时系统将数据自动删除.

traceDataTTL: 90 # 单位为分

minuteMetricDataTTL: 45 # 单位为分

hourMetricDataTTL: 36 # 单位为小时

dayMetricDataTTL: 45 # 单位为天

monthMetricDataTTL: 18 # 单位为月

configuration:

default:

# namespace: xxxxx

# 告警阀值

applicationApdexThreshold: 2000

serviceErrorRateThreshold: 10.00

serviceAverageResponseTimeThreshold: 2000

instanceErrorRateThreshold: 10.00

instanceAverageResponseTimeThreshold: 2000

applicationErrorRateThreshold: 10.00

applicationAverageResponseTimeThreshold: 2000

# 热力图配置，修改配置后需要删除热力指标统计表，由系统重建

thermodynamicResponseTimeStep: 50

thermodynamicCountOfResponseTimeSteps: 40

- 配置内容参考2

#cluster:

# zookeeper:

# hostPort: localhost:2181

# sessionTimeout: 100000

naming:

jetty:

#OS real network IP(binding required), for agent to find collector cluster

host: 172.21.123.99

port: 10800

contextPath: /

cache:

# guava:

caffeine:

remote:

gRPC:

# OS real network IP(binding required), for collector nodes communicate with each other in cluster. collectorN --(gRPC) --> collectorM

host: 172.21.123.99

port: 11800

agent_gRPC:

gRPC:

#OS real network IP(binding required), for agent to uplink data(trace/metrics) to collector. agent--(gRPC)--> collector

host: 172.21.123.99

port: 11800

# Set these two setting to open ssl

#sslCertChainFile: `$`path

#sslPrivateKeyFile: `$`path

# Set your own token to active auth

#authentication: xxxxxx

agent_jetty:

jetty:

# OS real network IP(binding required), for agent to uplink data(trace/metrics) to collector through HTTP. agent--(HTTP)--> collector

# SkyWalking native Java/.Net/node.js agents don't use this.

# Open this for other implementor.

host: 172.21.123.99

port: 12800

contextPath: /

analysis_register:

default:

analysis_jvm:

default:

analysis_segment_parser:

default:

bufferFilePath: ../buffer/

bufferOffsetMaxFileSize: 10M

bufferSegmentMaxFileSize: 500M

bufferFileCleanWhenRestart: true

ui:

jetty:

# Stay in \localhost\ if UI starts up in default mode.

# Change it to OS real network IP(binding required), if deploy collector in different machine.

host: 172.21.123.99

port: 12800

contextPath: /

storage:

elasticsearch:

clusterName: CollectorDBCluster

clusterTransportSniffer: true

clusterNodes: localhost:9300

indexShardsNumber: 2

indexReplicasNumber: 0

highPerformanceMode: true

# Batch process setting, refer to https://www.elastic.co/guide/en/elasticsearch/client/java-api/5.5/java-docs-bulk-processor.html

bulkActions: 2000 # Execute the bulk every 2000 requests

bulkSize: 20 # flush the bulk every 20mb

flushInterval: 10 # flush the bulk every 10 seconds whatever the number of requests

concurrentRequests: 2 # the number of concurrent requests

# Set a timeout on metric data. After the timeout has expired, the metric data will automatically be deleted.

traceDataTTL: 90 # Unit is minute

minuteMetricDataTTL: 90 # Unit is minute

hourMetricDataTTL: 36 # Unit is hour

dayMetricDataTTL: 45 # Unit is day

monthMetricDataTTL: 18 # Unit is month

#storage:

# h2:

# url: jdbc:h2:~/memorydb

# userName: sa

configuration:

default:

#namespace: xxxxx

# alarm threshold

applicationApdexThreshold: 2000

serviceErrorRateThreshold: 10.00

serviceAverageResponseTimeThreshold: 2000

instanceErrorRateThreshold: 10.00

instanceAverageResponseTimeThreshold: 2000

applicationErrorRateThreshold: 10.00

applicationAverageResponseTimeThreshold: 2000

# thermodynamic

thermodynamicResponseTimeStep: 50

thermodynamicCountOfResponseTimeSteps: 40

# max collection's size of worker cache collection, setting it smaller when collector OutOfMemory crashed.

workerCacheMaxSize: 10000

#receiver_zipkin:

# default:

# host: localhost

# port: 9411

# contextPath: /

**3、** 2.6启动；

单独启动collector,运行 bin/collectorService.bat

**2、** 2.5验证；

http://172.21.123.99:10800/agent/jetty

### 2.3 SW-Web UI

**2、** 3.1位置；

WebUI的配置项保存在**\webapp\webapp.yml中

**2、** 3.2配置修改；

- listOfServers配置

collector的访问服务名称(与config/application.yml中naming.jetty配置保持相同)， 且若是多个collector服务名称用','分隔。

修改collector.ribbon.listOfServers如下图：

- 端口配置
- 修改原因

web的默认监听端口是8080，与tomcat默认端口冲突。修改该端口。

- 修改
-
- collector.path

Collector 查询uri地址. 默认是/graphql

- collector.ribbon.ReadTimeout

查询超时时间,默认是10秒

- security.user.*

登录用户名/密码. 默认是 admin/admin

**2、** 3.3启动；

单独启动UI,运行 bin/webappService.bat

**2、** 3.4验证；

http://ip:8090

### 2.4 SW-Agent

**2、** 4.1拷贝目录；

拷贝agent目录到所需位置。日志、插件和配置都包含在包中，请不要改变目录结构。

**2、** 4.2更改agent配置；

- 位置

agent\config目录中的agent.config

- 修改内容

agent.application_code=CollectorDBCluster

#对应elasticsearch中的clusterName，表示数据存储的集合名称【注释错误-可以随意命名】

collector.servers=10.176.16.39:10800

#对应collector配置中的 naming【???】

### 2.5 监控Tomcat实例

**2、** 5.1版本要求；

JDK6+(被监控的应用程序运行在jdk6及以上版本)

**2、** 5.2配置；

简单配置一下如何监控tomcat，在catalina脚本的setlocal下面添加一项

**2、** 5.3配置需要监控的应用的agent探针参考1；

实例windows为例。解压下载的skywalking-agent.zip文件，探针包含整个目录，请不要改变目录结构，可修改agent.config配置agent.application_code=xxl-job为自己的应用名。

配置文件如下：

# The application name in UI

agent.application_code=my_job

# The number of sampled traces per 3 seconds

# Negative number means sample traces as many as possible, most likely 100%

# agent.sample_n_per_3_secs=-1

# The max amount of spans in a single segment.

# Through this config item, skywalking keep your application memory cost estimated.

# agent.span_limit_per_segment=300

# Ignore the segments if their operation names start with these suffix.

# agent.ignore_suffix=.jpg,.jpeg,.js,.css,.png,.bmp,.gif,.ico,.mp3,.mp4,.html,.svg

# If true, skywalking agent will save all instrumented classes files in /debugging\ folder.

# Skywalking team may ask for these files in order to resolve compatible problem.

# agent.is_open_debugging_class = true

# Server addresses.

# Mapping to \agent_server/jetty/port\ in \config/application.yml\ of Collector.

# Examples：

# Single collector：SERVERS="127.0.0.1:8080"

# Collector cluster：SERVERS="10.2.45.126:8080,10.2.45.127:7600"

collector.servers=127.0.0.1:10800

# Logging level

logging.level=DEBUG

**2.5.4****部署 java agent参考2**

--https://blog.csdn.net/jilo88/article/details/81355265

**2、** 5.5JAR启动参考；

--https://blog.csdn.net/jilo88/article/details/81355265

## 三、启动顺序

## 1、ElasticSearch

启动elasticsearch.bat

## 2、SkyWalking

A、分别启动collectorService.bat、webappService.bat

B、启动startup.bat，使用bin/startup.bat则同时启动collector和web

## 3、监听

启动被监听的应用程序

## 四、监控结果

## 五、参考资源

（一）、环境部署--社区

**1、** 网络；

https://blog.csdn.net/y_h_d/article/details/83342846

https://blog.csdn.net/zhangkang65/article/details/78991760

**2、** 端口修改skywalking8080端口修改；

https://my.oschina.net/ytqvip/blog/1793767

**3、** 社区；

docker环境：

https://www.cnblogs.com/liguobao/p/9686310.html

**4、** 版本5.X；

A类

es环境安装：

http://blog.51cto.com/zero01/2130696

高级特性

https://blog.csdn.net/jilo88/article/details/81355265

https://blog.csdn.net/SoberChina/article/details/79315242

https://blog.csdn.net/qq_42281649/article/details/82804703

**5、** 独到总结；

https://blog.csdn.net/qq_36236890/article/details/79647017

**6、** 官方社区；

https://github.com/OpenSkywalking/Community

**7、** 高级部署；

http://blog.51cto.com/536410/2318051

**8、** APM、Google；

pass==++++https://www.cnblogs.com/xiaoqi/p/apm.html

（二）、环境部署--官方--文档

**1、** 官方；

中文

https://github.com/apache/incubator-skywalking/blob/5.x/docs/README_ZH.md

--英文

https://github.com/apache/incubator-skywalking

**2、** Docker；

https://github.com/JaredTan95/skywalking-docker

**3、** 如何构建项目；

https://github.com/apache/incubator-skywalking/blob/master/docs/en/guides/How-to-build.md

（三）、高级特性

**1、** 个性化服务过滤；

https://github.com/apache/incubator-skywalking/blob/5.x/apm-sniffer/optional-plugins/trace-ignore-plugin/README_CN.md

https://blog.csdn.net/u013095337/article/details/80452088

**2、** 版本、；

https://github.com/SkywalkingTest/agent-integration-test-report#dubbo

（四）、理论、深入研究文章

**1、** 架构设计-系列文章；

https://github.com/apache/incubator-skywalking/blob/5.x/docs/cn/Architecture-CN.md

https://blog.csdn.net/Saphulot/article/details/81739411

pass==https://www.jianshu.com/p/2fd56627a3cf

**2、** 全面深入分析；

https://juejin.im/post/5a7a9e0af265da4e914b46f1

**3、** 全面学习；

http://www.iocoder.cn/categories/SkyWalking/

**4、** 10加文章；

https://juejin.im/post/5ab5b0e26fb9a028e25d7fcb

**5、** skywalking源码解析之javaAgent工具ByteBuddy的应用；

http://www.kailing.pub/article/index/arcid/178.html

**6、** 谷歌论文《Dapper，大规模分布式系统的跟踪系统》；

http://bigbully.github.io/Dapper-translation/

（五）、监控应用

https://www.jianshu.com/p/3ddd986c7581

https://www.cnblogs.com/huangxincheng/p/9666930.html

（六）、APM常见技术对比

https://blog.csdn.net/u012394095/article/details/79700200

https://www.jianshu.com/p/0fbbf99a236e

https://www.cnblogs.com/davidwang456/articles/8119047.html

（七）、UI

https://blog.csdn.net/qq_36236890/article/details/79647017

http://blog.zollty.com/b/archive/apm-comparison-of-skywalking-and-pinpiont.html
