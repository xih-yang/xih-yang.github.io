# 18、SpringCloud Alibaba 之 SkyWalking SkyWalking集群
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/18.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Skywalking集群是将skywalking oap作为一个服务注册到nacos上，只要skywalking oap服务没有全部宕机，保证有一个skywalking oap在运行，就能进行跟踪（SkyWalking搭建集群是非必须的，生产中不搭集群也是可以的，因为这个只是调用链路跟踪，skywalking oap跟踪服务如果宕机了，完全不会影响正常业务）

> 搭建一个skywalking oap集群需要：

1、至少一个Nacos（nacos也可集群）

2、至少一个ElasticSearch（es也可集群）

3、至少2个skywalking oap服务

4、至少1个SkyWalking-UI（UI也可以集群多个，用Nginx代理统一入口）

搭建SkyWalking oap 集群

### 1、解压两份apache-skywalking-apm-es7-8.1.0.tar.gz

### 2、修改 /config/application.yml 文件

**1、配置Nacos**

```java
cluster:
  selector: ${SW_CLUSTER:nacos}
# 注意，务必注释掉standalone这一行。默认情况下用的单机模式(standalone)，现在要改成集群模式，所以得注释掉。否则Skywalking将无法启动！
  standalone:
  nacos:
    Skywalking在Nacos Server的服务名称
    serviceName: ${SW_SERVICE_NAME:"SkyWalking_OAP_Cluster"}
    Nacos Server地址用http://ip:端口的形式
    hostPort: ${SW_CLUSTER_NACOS_HOST_PORT:localhost:8848}
    Nacos的namespace
    namespace: 'public'
```

**2、配置 gRPCHost、gRPCPort、restHost、restPort**

gRPCHost、gRPCPort是agent发送数据的地址

restHost、restPort是UI请求的地址

第一台：

```bash
core:
  default:
    restHost: ${SW_CORE_REST_HOST:0.0.0.0}
    restPort: ${SW_CORE_REST_PORT:12801}
    gRPCHost: ${SW_CORE_GRPC_HOST:0.0.0.0}
    gRPCPort: ${SW_CORE_GRPC_PORT:11801}
```

第二台：

```bash
core:
  default:
    restHost: ${SW_CORE_REST_HOST:0.0.0.0}
    restPort: ${SW_CORE_REST_PORT:12802}
    gRPCHost: ${SW_CORE_GRPC_HOST:0.0.0.0}
    gRPCPort: ${SW_CORE_GRPC_PORT:11802}
```

> 注：
>
> gRPCHost、gRPCPort是agent发送数据的地址
>
> restHost、restPort是UI请求的地址

**3、配置Elasticsearch相关信息，一般配置clusterNodes即可 （使用elasticsearch7 作为storage**）

```bash
storage:
  selector: ${SW_STORAGE:elasticsearch7}
storage: 
elasticsearch7: 
nameSpace: ${SW_NAMESPACE:""} 
clusterNodes: ${SW_STORAGE_ES_CLUSTER_NODES:localhost:9200}
```

### 3、配置ui服务webapp.yml文件的listOfServers

listOfServers: 127.0.0.1:12801,127.0.0.1:12802

### 4、启动测试

启动一个skywalking-webapp.jar使用脚本webappService.sh

启动两个OAPServerStartUp使用脚本oapService.sh

### 5、启动应用程序进行测试

**1、如果是jar包启动**

修改`agent/config/agent.config`

将`collector.backend_service` 修改为 `127.0.0.1:11801,127.0.0.1:11802`

java -javaagent:xxxxx/agent/skywalking-agent.jar

-Dskywalking.agent.service_name=gateway

-Dskywalking.collector.backend_service=192.168.133.128:11801,192.168.133.128:11802

-jar springboot-idea.jar

**2、如果是idea启动应用程序**：（注意配置两个连接地址）

SW_AGENT_COLLECTOR_BACKEND_SERVICES=192.168.133.128:11801,192.168.133.128:11802;SW_AGENT_NAME=springboot-idea
