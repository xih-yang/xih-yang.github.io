# 10、Flink 基础 - Flink Environment
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/10.html
- 分类：大数据框架
- 分组：教程目录
## 一、Environment概述

一个Flink的程序是从一个Environment开始的

## 1.1 getExecutionEnvironment

创建一个执行环境，表示当前执行程序的上下文。如果程序是独立调用的，则此方法返回本地执行环境；如果从命令行客户端调用程序以提交到集群，则此方法返回此集群的执行环境，也就是说，getExecutionEnvironment会根据查询运行的方式决定返回什么样的运行环境，是最常用的一种创建执行环境的方式。

```java
ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment(); 
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment(); 
```

如果没有设置并行度，会以flink-conf.yaml中的配置为准，默认是1。

## 1.2 createLocalEnvironment

返回本地执行环境，需要在调用时指定默认的并行度。

```java
LocalStreamEnvironment env = StreamExecutionEnvironment.createLocalEnvironment(1); 
```

## 1.3 createRemoteEnvironment

返回集群执行环境，将Jar提交到远程服务器。需要在调用时指定JobManager的IP和端口号，并指定要在集群中运行的Jar包。

```java
ExecutionEnvironment env = ExecutionEnvironment
        .createRemoteEnvironment("flink-master", 8081, "/home/user/udfs.jar");
```

这种方法开发调试完成，打包前都得替换为远程的路径，比较麻烦，这类使用的会比较少。
