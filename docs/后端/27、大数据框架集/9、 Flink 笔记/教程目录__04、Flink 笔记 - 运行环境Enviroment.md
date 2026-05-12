# 04、Flink 笔记 - 运行环境Enviroment
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/4.html
- 分类：大数据框架
- 分组：教程目录
## 一、Flink 数据流程

## 二、Environment

## 2.1、getExecutionEnvironment

创建一个执行环境，表示当前执行程序的上下文。 如果程序是独立调用的，则此方法返回本地执行环境；如果从命令行客户端调用程序以提交到集群，则此方法返回此集群的执行环境，也就是说，getExecutionEnvironment 会根据查询运行的方式决定返回什么样的运行环境，是最常用的一种创建执行环境的方式。本地创建执行环境，默认的并行度等于cpu 核数。

### 2.1.1、dataset

```java
ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
```

### 2.1.2、stream

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
```

## 2.2、createLocalEnvironment

返回本地执行环境，需要在调用时指定默认的并行度。

```java
LocalStreamEnvironment env = StreamExecutionEnvironment.createLocalEnvironment(1);
```
