# PinPoint APM链路跟踪：监控报警 SpringCloud 服务
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/8.html
- 分类：链路追踪
- 分组：教程目录
## 1、环境说明

spring boot 、spring cloud、mysql 、mybatis 、k8s、docker、redis、rocketmq

## 2、安装步骤

### 2.1 安装PinPoint

```bash
git clone https://github.com/pinpoint-apm/pinpoint-docker.git
cd pinpoint-docker
docker-compose pull && docker-compose up -d
```

安装过程

```bash
[root@monitor pinpoint-docker]# docker-compose pull && docker-compose up -dPulling pinpoint-mysql      ... done
Pulling zoo1                ... done
Pulling pinpoint-hbase      ... done
Pulling pinpoint-batch      ... done
Pulling pinpoint-collector  ... done
Pulling pinpoint-agent      ... done
Pulling pinpoint-quickstart ... done
Pulling pinpoint-web        ... done
Pulling zoo2                ... done
Pulling zoo3                ... done
Pulling jobmanager          ... done
Pulling taskmanager         ... done
Creating network "pinpoint-docker_pinpoint" with driver "bridge"
Creating volume "pinpoint-docker_data-volume" with default driver
Creating volume "pinpoint-docker_mysql_data" with default driver
Creating volume "pinpoint-docker_hbase_data" with default driver
Creating pinpoint-docker_zoo3_1 ... done
Creating pinpoint-docker_zoo2_1 ... done
Creating pinpoint-docker_zoo1_1 ... done
Creating pinpoint-mysql         ... done
Creating pinpoint-flink-jobmanager ... done
Creating pinpoint-hbase             ... done
Creating pinpoint-flink-taskmanager ... done
Creating pinpoint-batch             ... done
Creating pinpoint-collector         ... done
Creating pinpoint-web               ... done
Creating pinpoint-agent             ... done
Creating pinpoint-quickstart        ... done
```

安装后启动的docker 容器

```bash
[root@datalink ~]# docker ps 
CONTAINER ID   IMAGE                                     COMMAND                  CREATED      STATUS      PORTS                                                                                                                                                                                        NAMES
fb54699553bf   lihaixin/portainer                        "/portainer --templa…"   8 days ago   Up 8 days   8000/tcp, 0.0.0.0:9000->9000/tcp, :::9000->9000/tcp                                                                                                                                          portainer
e2ea6fab2277   pinpointdocker/pinpoint-batch:2.4.1       "sh /pinpoint/script…"   8 days ago   Up 8 days                                                                                                                                                                                                pinpoint-batch
827ee01929f6   pinpointdocker/pinpoint-web:2.4.1         "sh /pinpoint/script…"   8 days ago   Up 8 days   0.0.0.0:8080->8080/tcp, :::8080->8080/tcp, 0.0.0.0:9997->9997/tcp, :::9997->9997/tcp                                                                                                         pinpoint-web
204c8526992f   pinpointdocker/pinpoint-quickstart        "catalina.sh run"        8 days ago   Up 8 days   0.0.0.0:8085->8080/tcp, :::8085->8080/tcp                                                                                                                                                    pinpoint-quickstart
ff6d1a502934   pinpointdocker/pinpoint-agent:2.4.1       "/usr/local/bin/conf…"   8 days ago   Up 8 days                                                                                                                                                                                                pinpoint-agent
5564d90ef82a   pinpointdocker/pinpoint-collector:2.4.1   "sh /pinpoint/script…"   8 days ago   Up 8 days   0.0.0.0:9991-9996->9991-9996/tcp, :::9991-9996->9991-9996/tcp, 0.0.0.0:9995-9996->9995-9996/udp, :::9995-9996->9995-9996/udp                                                                 pinpoint-collector
c78f83d41893   pinpointdocker/pinpoint-flink:2.4.1       "/docker-bin/docker-…"   8 days ago   Up 8 days   6123/tcp, 0.0.0.0:6121-6122->6121-6122/tcp, :::6121-6122->6121-6122/tcp, 0.0.0.0:19994->19994/tcp, :::19994->19994/tcp, 8081/tcp                                                             pinpoint-flink-taskmanager
7589edc596a1   pinpointdocker/pinpoint-flink:2.4.1       "/docker-bin/docker-…"   8 days ago   Up 8 days   6123/tcp, 0.0.0.0:8081->8081/tcp, :::8081->8081/tcp                                                                                                                                          pinpoint-flink-jobmanager
92425aa237df   pinpointdocker/pinpoint-hbase:2.4.1       "/bin/sh -c '/usr/lo…"   8 days ago   Up 8 days   0.0.0.0:16010->16010/tcp, :::16010->16010/tcp, 0.0.0.0:16030->16030/tcp, :::16030->16030/tcp, 0.0.0.0:60000->60000/tcp, :::60000->60000/tcp, 0.0.0.0:60020->60020/tcp, :::60020->60020/tcp   pinpoint-hbase
3eab4570bf20   zookeeper:3.4.13                          "/docker-entrypoint.…"   8 days ago   Up 8 days   2888/tcp, 3888/tcp, 0.0.0.0:49154->2181/tcp, :::49154->2181/tcp                                                                                                                              pinpoint-docker_zoo3_1
f5eb8cb5aaa8   zookeeper:3.4.13                          "/docker-entrypoint.…"   8 days ago   Up 8 days   2888/tcp, 3888/tcp, 0.0.0.0:49153->2181/tcp, :::49153->2181/tcp                                                                                                                              pinpoint-docker_zoo1_1
637ae4c0084c   zookeeper:3.4.13                          "/docker-entrypoint.…"   8 days ago   Up 8 days   2888/tcp, 3888/tcp, 0.0.0.0:49155->2181/tcp, :::49155->2181/tcp                                                                                                                              pinpoint-docker_zoo2_1
bc67523a7afe   pinpointdocker/pinpoint-mysql:2.4.1       "docker-entrypoint.s…"   8 days ago   Up 8 days   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp                                                                                                                                         pinpoint-mysql
```

进入到web页面效果

### 2.2 安装agent

#### 2.2.1 下载

#### 2.2.2 agent配置

下载，解压后进入/pinpoint-agent-2.4.1/profiles目录，复制release文件夹，新增dev,prod,test文件夹

一个环境一个文件夹。

修改以下配置

```bash
1.收集服务的ip
profiler.transport.grpc.collector.ip=10.50.10.xx
profiler.collector.ip=10.50.10.xx
2.指定采集的是Tomcat或者Spring boot等
profiler.applicationservertype=SPRING_BOOT 
3.if it's COUNTING(the default), then 1 out of n transactions will be sampled where n is the rate.
# eg. 1: 100%     20: 5%     50: 2%      100: 1%
profiler.sampling.counting.sampling-rate=1
4.数据采样率，搜集数据的比率，默认为20即为1/20 5%，如想改为100%即设为1
profiler.sampling.rate=1
```

#### 2.2.3 JVM 配置

把刚下载配置好的agent文件夹放到基础镜像中，然后在打镜像的时候配置以下几个参数

```bash
  <jvmFlag>-javaagent:/pinpoint-agent/pinpoint-bootstrap-2.4.1.jar</jvmFlag>
  <jvmFlag>-Dpinpoint.agentId=${project.artifactId}</jvmFlag>
  <jvmFlag>-Dpinpoint.applicationName=${project.artifactId}</jvmFlag>
  <jvmFlag>-Dpinpoint.profiler.profiles.active=${spring.profiles.active}</jvmFlag>
```

#### 2.2.4 日志中输出traceId

公司使用的slf4j实现类库是logback，如果你使用的是log4j的话，Pinpoint也提供了类似的配置项，大家可以自行查阅配置。

**1、** 设置配置项；

```bash
// 配置项在pinpoint.config中
profiler.logback.logging.transactioninfo = true
```

**2、** 修改日志输出pattern，增加[%X{PtxId:-0}]；

```bash
<property name="log.pattern" value="%d{HH:mm:ss.SSS} [%thread] %-5level %logger{20} - [%method,%line]-[%X{PtxId:-0}] - %msg%n" />
```

**3、** 效果；

## 3、部署问题

### 3.1 多个相同名称的项目放在一个pinpoint下监控

解决方法：给相同项目指定不同的agentId和applicationName，如：

```bash
 <jvmFlag>-javaagent:/pinpoint-agent/pinpoint-bootstrap-2.4.1.jar</jvmFlag>
 <jvmFlag>-Dpinpoint.agentId=${
     spring.profiles.active}-${
     project.artifactId}</jvmFlag>
 <jvmFlag>-Dpinpoint.applicationName=${
     spring.profiles.active}-${
     project.artifactId}</jvmFlag>
 <jvmFlag>-Dpinpoint.profiler.profiles.active=${
     spring.profiles.active}</jvmFlag>
```

### 3.2 agent id 过长问题（最大长度不能超过24个字符）

```bash
pinpoint invalid Id. SystemProperties(-D) applicationName can only contain [a-zA-Z0-9], '.', '-', '_'. maxLength:24
```

### 3.2 k8s 多个副本pod ，agentId重复

解决方法：去掉pinpoint.agentId的配置，让agent自动生成agentId
