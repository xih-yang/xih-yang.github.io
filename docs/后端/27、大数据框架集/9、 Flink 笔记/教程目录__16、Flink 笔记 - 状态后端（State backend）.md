# 16、Flink 笔记 - 状态后端（State backend）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/16.html
- 分类：大数据框架
- 分组：教程目录
## 一、概述

Flink支持的StateBackend:

MemoryStateBackend 默认的state的类型就是这种

FsStateBackend

RocksDBStateBackend

## 二、MemoryStateBackend

默认情况下，状态信息是存储在 TaskManager 的堆内存中的，checkpoint 的时候将状态保存到JobManager 的堆内存中。

缺点：
只能保存数据量小的状态

状态数据有可能会丢失

优点：
开发测试很方便

## 三、 FSStateBackend

状态信息存储在 TaskManager 的堆内存中的，checkpoint 的时候将状态保存到指定的文件中 (HDFS等文件系统)

优点：
状态访问速度很快

状态信息不会丢失

缺点：
状态大小受TaskManager内存限制(默认支持5M)

用于：
生产，也可存储状态数据量大的情况

## 四、RocksDBStateBackend

依赖：

```java
 <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-statebackend-rocksdb_2.12</artifactId>
            <version>1.10.1</version>
</dependency>
```

状态信息存储在 RocksDB 数据库 (key-value 的数据存储服务)， 最终保存在本地文件中。checkpoint 的时候将状态保存到指定的文件中 (HDFS 等文件系统)

缺点：
状态访问速度有所下降

优点：
可以存储超大量的状态信息

状态信息不会丢失

用于：
生产，可以存储超大量的状态信息

## 五、配置

## 5.1、代码中设置

```java
 StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 默认方式 Memory
        env.setStateBackend(new MemoryStateBackend());
        // fs
        env.setStateBackend(new FsStateBackend("hdfs://namenode:9000/flink/checkpoints"));
        // rocksDB
        env.setStateBackend(new RocksDBStateBackend("local-filepath",true));
```

## 5.2、配置 flink-conf.yaml

```java
state.backend: filesystem 
state.checkpoints.dir: hdfs://namenode:9000/flink/checkpoints 
```

注意：state.backend的值可以是下面几种：jobmanager(MemoryStateBackend), filesystem(FsStateBackend), rocksdb(RocksDBStateBackend)
