# 4、SkyWalking - APM链路监控：IDEA 部署探针
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/18.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 环境准备

**1、** 下载skywalking；

**2、** 解压，目录；

```bash
+-- agent
    +-- activations
         apm-toolkit-log4j-1.x-activation.jar
         apm-toolkit-log4j-2.x-activation.jar
         apm-toolkit-logback-1.x-activation.jar
         ...
    +-- config
         agent.config  
    +-- plugins
         apm-dubbo-plugin.jar
         apm-feign-default-http-9.x.jar
         apm-httpClient-4.x-plugin.jar
         .....
    +-- optional-plugins
         apm-gson-2.x-plugin.jar
         .....
    +-- bootstrap-plugins
         jdk-http-plugin.jar
         .....
    +-- logs
    skywalking-agent.jar
```

## 集成步骤

**1、** 准备项目（我这里准备了三个微服务项目，调用关系为A=》B=》C）；

**2、** IDEA中每个项目添加JVM启动参数；

```bash
# 修为Demo03App为服务名
# 修改192.168.58.161为skywalking所在地址
-javaagent:D:\javaDev\apache-skywalking-apm-bin-es7\agent\skywalking-agent.jar -Dskywalking.agent.service_name=Demo03App -Dskywalking.collector.backend_service=192.168.58.161:11800
```

**1、** 启动项目(会变慢很多)，调用接口（这里使用jemeter并发请求100）；

**2、** 查看控制台，有数据产生，集成成功；
