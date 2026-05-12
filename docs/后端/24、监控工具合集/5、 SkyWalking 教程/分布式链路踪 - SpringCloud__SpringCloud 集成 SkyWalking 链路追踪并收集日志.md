# SpringCloud 集成 SkyWalking 链路追踪并收集日志
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/14.html
- 分类：链路追踪
- 分组：分布式链路踪 - SpringCloud
## 技术选型及版本

skywalking-apm：9.2.0

skywalking-java-agent：8.12.0

elasticsearch：7.8.0

## 一、下载地址

https://skywalking.apache.org/downloads/

## 二、SkyWalking 配置

## 1、下载解压

解压apache-skywalking-apm-9.2.0.tar.gz(小技巧：如果windows解压不了，可以在linux上面解压之后，再下载到windows上面)

解压apache-skywalking-java-agent-8.12.0.tgz(360压缩工具即可解压)

## 2、运行

运行/apache-skywalking-apm-bin/bin/startup.bat (或 startup.sh )

访问http://localhost:8080/

若需要修改8080端口，在/apache-skywalking-apm-bin/webapp下面的webapp.yml文件里面修改。

## 3、配置SkyWalking日志收集

### 3.1 pom 中依赖 SkyWalking 的 logback 插件包

```xml
<!-- skywalking链路追踪 -->
<!-- 如果想在项目代码中获取链路TraceId，则需要引入此依赖 -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>8.12.0</version>
</dependency>
<!-- skywalking logback日志插件 -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-logback-1.x</artifactId>
    <version>8.12.0</version>
</dependency>
```

### 3.2 添加/修改 logback.xml，启用 SkyWalking 提供的 appender

```xml
<appender name="stdout" class="ch.qos.logback.core.ConsoleAppender">
	<encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
		<layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
			<Pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%tid] [%thread] %-5level %logger{
     36} -%msg%n</Pattern>
		</layout>
	</encoder>
</appender>
<appender name="grpc" class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.log.GRPCLogClientAppender">
	<encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
		<layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.mdc.TraceIdMDCPatternLogbackLayout">
			<Pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%X{
     tid}] [%thread] %-5level %logger{
     36} -%msg%n</Pattern>
		</layout>
	</encoder>
</appender>
<root level="INFO">
	<appender-ref ref="stdout"/>
	<appender-ref ref="grpc"/>
</root>
```

## 4、配置Java agent

### 4.1 IDEA开发环境下配置Java agent

每个服务应用的 Edit Run/Debug Configurations ，添加如下VM options

```java
-javaagent:D:/Server/skywalking-agent/skywalking-agent.jar -Dskywalking.agent.service_name=yourAppName -Dskywalking.collector.backend_service=localhost:11800
```

### 4.2 jar包启动时配置Java agent

```java
nohup java -javaagent:/path/to/skywalking-agent/skywalking-agent.jar -Dskywalking.agent.service_name=yourAppName -Dskywalking.collector.backend_service=localhost:11800 -jar yourApp.jar &
```

### 4.3 注意事项

如果skywalking没有部署在本地，就需要作如下配置，打开agent/config/agent.config配置文件，搜索collector.backend_service，将127.0.0.1修改为skywalking所在的服务器ip

## 三、服务效果

## 1、启动服务

启动微服务的各个服务，并进行一些操作，以便产生一些日志

## 2、访问SkyWalking UI控制台

地址：http://localhost:8080/

### 2.1 性能监控

### 2.2 链路追踪

### 2.3 日志收集

SkyWalking默认使用H2数据库存储，不支持全文检索方式查日志内容，且重启后数据丢失，生产环境建议使用elasticsearch存储，如果skywalking使用的是elasticsearch作为存储，则可以进行全局模糊查询

## 四、修改数据存储方式

### 找到application.yml中的

```bash
storage:
  selector: ${
     SW_STORAGE:h2}
```

### 修改为：

```bash
storage:
  selector: ${
     SW_STORAGE:elasticsearch}
```

### 配置elasticsearch(以下需配置，其它可默认)

```bash
storage:
  selector: ${
     SW_STORAGE:elasticsearch}
  elasticsearch:
  	# es集群名称
    namespace: ${
     SW_NAMESPACE:"my-es"}
    es地址
    clusterNodes: ${
     SW_STORAGE_ES_CLUSTER_NODES:192.168.163.128:9200}
    es账号(没有则填空字符串)
    user: ${
     SW_ES_USER:""}
    es密码(没有则填空字符串)
    password: ${
     SW_ES_PASSWORD:""}
```
