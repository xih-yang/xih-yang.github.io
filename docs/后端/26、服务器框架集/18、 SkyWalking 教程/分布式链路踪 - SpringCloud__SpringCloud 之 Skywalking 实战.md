# SpringCloud 之 Skywalking 实战
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/12.html
- 分类：链路追踪
- 分组：分布式链路踪 - SpringCloud
## 一、开源项目地址

[https://github.com/cakin24/spring-cloud-code/tree/master/ch](https://github.com/cakin24/spring-cloud-code/tree/master/ch6-1)16-3

## 二、给各个微服务制作jar包

## 三、建目录，构建启动环境

## 四、启动要监控的服务

```java
F:\springcloud\skywalkingtest\service-eureka>java -javaagent:F:\springcloud\skywalkingtest\service-eureka\agent\skywalking-agent.jar -jar ch16-3-eureka-skywalking-1.0-SNAPSHOT.jar
F:\springcloud\skywalkingtest\service-zuul>java -javaagent:F:\springcloud\skywalkingtest\service-zuul\agent\skywalking-agent.jar -jar ch16-3-zuul-skywalking-1.0-SNAPSHOT.jar
F:\springcloud\skywalkingtest\service-a>java -javaagent:F:\springcloud\skywalkingtest\service-a\agent\skywalking-agent.jar -jar ch16-3-service-a-1.0-SNAPSHOT.jar
F:\springcloud\skywalkingtest\service-b>java -javaagent:F:\springcloud\skywalkingtest\service-b\agent\skywalking-agent.jar -jar ch16-3-sevice-b-1.0-SNAPSHOT.jar
```

## 五、浏览器输入 http://localhost:8080/

## 六、测试

**postman输入**

localhost:9020/client/skyController/getInfo

**监控页面显示**
