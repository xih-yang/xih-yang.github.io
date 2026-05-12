# 28、Netty 基础 之 Log4j整合到netty
- 来源：https://ddkk.com/zhuanlan/server/netty/4/28.html
- 分类：服务器框架
- 分组：教程目录
## 一、Log4j

**1、** 在maven中添加对Log4j的依赖在pom.xml；

**2、** 配置Log4j，在resources/log4j.properties；

**3、** 示例；

## 二、用slf4j + logback

**1、** pom文件添加slf4j和logback依赖包；

**2、** 编写logback.xml；

如果原来有的话，添加：

```java
<logger name="io.netty.handler.logging.LoggingHandler" additivity="false">
    <level value="debug" />
    <appender-ref ref="stdout"/>
</logger>
```

PS：我用的是slf4j + logback好像你不配置它启动时也会打debug日志
