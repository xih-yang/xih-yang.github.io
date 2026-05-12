# 6、SkyWalking - APM链路监控：Spring Boot项目java -jar部署探针
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/20.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 环境准备

**1、** 在Sping项目开发中，一般都会打包成jar，部署项目时，采用java-jar的方式启动项目；

**2、** 准备一个springboot项目并打包成jar；

## 集成步骤

**1、** 使用jar-jar启动项目（参数解析参照上篇文档）；

```bash
java -javaagent:D:\javaDev\apache-skywalking-apm-bin-es7\agent\skywalking-agent.jar -Dskywalking.agent.service_name=pearl-test -Dskywalking.collector.backend_service=192.168.58.161:11800 -jar  pearl-test.jar
```

**1、** 访问测试接口并查看控制台,集成完毕；
