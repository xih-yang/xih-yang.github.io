# 32、SpringCloud Alibaba - 整合SkyWalking
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/32.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、简介

SkyWalking是一个APM（应用程序性能监控）系统，专为微服务、云原生和基于容器的架构而设计，包括了分布式链路追踪，性能指标分析和服务依赖分析等功能。

Skywalking 支持Java等探针，数据存储支持Elasticsearch等。

[https://github.com/apache/skywalking](https://github.com/apache/skywalking)

## 二、安装服务端

**1、** 下载；

下载apache-skywalking-apm-8.9.1.tar.gz

[https://skywalking.apache.org/downloads/](https://skywalking.apache.org/downloads/)

**2、** 安装；

首先需要安装elasticsearch，步骤省略。

1、上传到服务器解压

```java
tar -zxvf apache-skywalking-apm-8.9.1.tar.gz
```

2、配置es

```java
 cd config
 vi application.yml
```

修改存储的selector 为 ${SW_STORAGE:elasticsearch}

修改es的地址为 ${SW_STORAGE_ES_CLUSTER_NODES:192.168.61.128:9200}

```java
storage:
  selector: ${
     SW_STORAGE:elasticsearch}
  elasticsearch:
    namespace: ${
     SW_NAMESPACE:""}
    clusterNodes: ${
     SW_STORAGE_ES_CLUSTER_NODES:192.168.61.128:9200}
    protocol: ${
     SW_STORAGE_ES_HTTP_PROTOCOL:"http"}
    connectTimeout: ${
     SW_STORAGE_ES_CONNECT_TIMEOUT:500}
    socketTimeout: ${
     SW_STORAGE_ES_SOCKET_TIMEOUT:30000}
    numHttpClientThread: ${
     SW_STORAGE_ES_NUM_HTTP_CLIENT_THREAD:0}
    user: ${
     SW_ES_USER:""}
```

3、启动

进入到bin 目录 执行 start.sh 脚本

```java
[root@ddkk.com bin]# ./startup.sh
SkyWalking OAP started successfully!
SkyWalking Web Application started successfully!
```

4、访问

访问http://192.168.61.128:8080/ 就能进入web端主页

## 三、安装agent

**1、** 下载；

下载apache-skywalking-java-agent-8.9.0-src.tgz

[https://skywalking.apache.org/downloads/](https://skywalking.apache.org/downloads/)

**2、** 打包；

由于下载是源码包，需要用maven进行打包

首先进行解压，然后在命令行执行mvn clean install

打包完成后，会生成一个skywalking-agent的目录，里面包含了已经打好的jar包

## 四、使用agent

分别创建三个项目，gateway、client、server，通过gateway调用client，client调用server。项目创建过程参考前面的博客，这里就不叙述了。

分别配置启动参数

**1、** gateway；

配置启动参数

```java
-javaagent:E:\tmp\skywalking-agent\skywalking-agent.jar
-Dskywalking.agent.service_name=gateway
-Dskywalking.collector.backend_service=192.168.61.128:11800
```

javaagent 是 skywalking-agent.jar 所在的目录

skywalking.agent.service_name 是服务的名称

skywalking.collector.backend_service 是服务端的地址，agent采集的数据要上报到服务端

其他参数参考配置文件 skywalking-agent/config/agent.config

**2、** client；

1、配置启动参数

```java
-javaagent:E:\tmp\skywalking-agent\skywalking-agent.jar
-Dskywalking.agent.service_name=gateway
-Dskywalking.collector.backend_service=192.168.61.128:11800
```

2、接口

自定义一个接口，通过 openfeign 访问 server 服务

```java
@RestController
@RequestMapping("/client")
public class ClientController {
    @Autowired
    private ServerApi serverApi;
    @GetMapping("/test/{id}")
    public Map test(@PathVariable String id){
        return serverApi.test(id);
    }
```

```java
@FeignClient(value = "server",fallback = ServerApiFallBack.class)
@Component
public interface ServerApi {
    @GetMapping("/server/test/{id}")
    Map test(@PathVariable String id);
}
```

**3、** server；

1、配置启动参数

```java
-javaagent:E:\tmp\skywalking-agent\skywalking-agent.jar
-Dskywalking.agent.service_name=gateway
-Dskywalking.collector.backend_service=192.168.61.128:11800
```

2、接口

为client 提供接口服务

```java
@RestController
@RequestMapping("/server")
public class ServerController {
    @GetMapping("/test/{id}")
    public Object test(@PathVariable String id) {
        Map map = new HashMap();
        map.put("server", id);
        return map;
    }
}
```

**4、** 访问gateway地址；

```java
http://192.168.100.73:9003/client/client/test/100
```

**5、** 查看skywalkingweb页面；

1、注册的服务

2、服务的调用关系拓扑图

3、服务端点调用追踪
