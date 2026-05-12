# 11、FlinkSQL - Flink作业提交过程的调试和诊断
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/11.html
- 分类：大数据框架
- 分组：教程目录
## 报错记录

提交作业的时候，遇到一些坑，报错具有迷惑性。

## 413 Request Entity Too Large. Try to raise [rest.client.max-content-length]

```java
Caused by: org.apache.flink.runtime.rest.util.RestClientException: 413 Request Entity Too Large. Try to raise [rest.client.max-content-length]
	at org.apache.flink.runtime.rest.RestClient$ClientHandler.channelRead0(RestClient.java:565)
	... 31 more
```

## 分析

此问题调试了半天结果发现

问题不在`rest.client.max-content-length`，

亦不在`rest.server.max-content-length`，

也不是session-cluster没有重启。

因为本次 jobGraph 以及要上传的jar，总计才6MB左右。

## 调试方法

经过探索，以及上一篇[【Flink系列】Flink 作业提交遇到的问题记录以及原理](/zhuanlan/bigdata/flink/3/10.html)内的自我启发，

最终找到了调试Flink作业提交的方法。

### 调试JobManager或者TaskManager

在Flink的配置文件`conf/flink-conf.yaml`内

```java
env.java.opts.jobmanager: '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5123'
env.java.opts.taskmanager: '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5124'
```

### 调试flink run 这个提交过程

※加到提交的命令行的最前：

```java
JVM_ARGS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5125" /flink-1.13.0-cdh5.12.1-slankka/bin/flink run ...
```

那么在IDEA中，打开 JVM Remote Debug配置即可，填好IP和端口，打开Debug即可。

- 作业提交过程会打印一行：

```java
Listening for transport dt_socket at address: 5125
```

打印完毕后，立即连接即可。

## 结论

上述问题，经过Debug，没有找到JobManager停留在对应断点。但意外发现，Flink 提交过程中 RestClient的端口为8081，不符合服务器上的配置。

于是立即修改 flink-conf.yaml，

```java
rest.bind-port: 8086-8090
rest.port: 8086
```

※这很重要，客户端需要rest.port，Environment初始化的时候，才能生成正确的客户端。

默认rest.port是8081，但是*服务器的8081由其他服务所占用，也就是说上传到别的服务了，不是上传到Flink了*。

JobManager的端口，由上一条配置给出范围，8086，即对应 rest.port。

### 特定场景下出现此错误

由于（其他需求导致）服务端和客户端使用的配置文件不同，因此导致此差异，引发端口错误。并抛出 413 Request Entity Too Large错误，实在是具有迷惑性。

※重申解决方法，需要保证客户端和服务端的rest.host以及rest.port是一样的。

因此，Session-Cluster模式下，尤其要注意这一点。
