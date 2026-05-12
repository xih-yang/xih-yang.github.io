# 5、SkyWalking - APM链路监控：Tomcat9部署探针
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/19.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 环境准备

**1、** 下载Tomcat9；
**2、** 准备一个war包；

## 部署步骤

**1、** 复制war包到tomcat指定位置；

**2、** 修改文件，在第一行添加启动参数（参照上篇文档修改）；

```bash
set "CATALINA_OPTS= -javaagent:D:\javaDev\apache-skywalking-apm-bin-es7\agent\skywalking-agent.jar -Dskywalking.agent.service_name=demo -Dskywalking.collector.backend_service=192.168.58.161:11800"
```

**1、** 启动项目并访问项目测试接口；

**2、** 查看控制台，集成完毕；

**3、** ；
