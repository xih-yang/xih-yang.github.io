# 14、Spark深入解析、SparkCore之RDD的持久化/缓存、容错机制Checkpoint
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/14.html
- 分类：大数据框架
- 分组：教程目录
## RDD的持久化/缓存

在实际开发中`某些RDD的计算或转换可能会比较耗费时间`，如果这些RDD后续还会`频繁的被使用到`，那么可以将这些`RDD进行持久化/缓存`，这样下次再使用到的时候就不用再重新计算了，提高了程序运行的效率

### 持久化/缓存API详解

**persist方法和cache方法**

**RDD通过persist或cache方法可以将前面的计算结果缓存，但是并不是这两个方法被调用时立即缓存，而是触发后面的action时，该RDD将会被缓存在计算节点的内存中，并供后面重用。**

通过查看RDD的源码发现cache最终也是调用了persist无参方法(`默认存储只存在内存中`)

### 代码演示

- 启动集群和 spark-shell

```java
/export/servers/spark/sbin/start-all.sh
/export/servers/spark/bin/spark-shell \
--master spark://node01:7077,node02:7077 \
--executor-memory 1g \
--total-executor-cores 2 
```

- 将一个RDD持久化，后续操作该RDD就可以直接从缓存中拿

```java
//设置读取路径
val rdd1 = sc.textFile("hdfs://node01:8020/wordcount/input/words.txt")
//对数据进行flatMap处理并计算
val rdd2 = rdd1.flatMap(x=>x.split(" ")).map((_,1)).reduceByKey(_+_)
//缓存/持久化
rdd2.cache 
//触发action,会去读取HDFS的文件,rdd2会真正执行持久化
rdd2.sortBy(_._2,false).collect
//触发action,会去读缓存中的数据,执行速度会比之前快,因为rdd2已经持久化到内存中了
rdd2.sortBy(_._2,false).collect
```

- 存储级别

默认的存储级别都是仅在内存存储一份，Spark的存储级别还有好多种，存储级别在object StorageLevel中定义的

持久化级别
说明

MEMORY_ONLY(默认)
将RDD以非序列化的Java对象存储在JVM中。 如果没有足够的内存存储RDD，则某些分区将不会被缓存，每次需要时都会重新计算。 这是默认级别。

MEMORY_AND_DISK(开发中可以使用这个)
将RDD以非序列化的Java对象存储在JVM中。如果数据在内存中放不下，则溢写到磁盘上．需要时则会从磁盘上读取

MEMORY_ONLY_SER (Java and Scala)
将RDD以序列化的Java对象(每个分区一个字节数组)的方式存储．这通常比非序列化对象(deserialized objects)更具空间效率，特别是在使用快速序列化的情况下，但是这种方式读取数据会消耗更多的CPU。

MEMORY_AND_DISK_SER (Java and Scala)
与MEMORY_ONLY_SER类似，但如果数据在内存中放不下，则溢写到磁盘上，而不是每次需要重新计算它们。

DISK_ONLY
将RDD分区存储在磁盘上。

MEMORY_ONLY_2, MEMORY_AND_DISK_2等
与上面的储存级别相同，将持久化数据存为两份，备份每个分区存储在两个集群节点上。

OFF_HEAP(实验中)
与MEMORY_ONLY_SER类似，但将数据存储在堆外内存中。 (即不是直接存储在JVM内存中)
如：Tachyon-分布式内存存储系统、Alluxio - Open Source Memory Speed Virtual Distributed Storage

**小结**

**1、** RDD持久化/缓存的目的是为了提高后续操作的速度；

**2、** 缓存的级别有很多，默认只存在内存中,开发中使用memory_and_disk；

**3、** 只有执行action操作的时候才会真正将RDD数据进行持久化/缓存；

**4、** 实际开发中如果某一个RDD后续会被频繁的使用，可以将该RDD进行持久化/缓存；

## RDD的容错机制Checkpoint

- 持久化的局限

持久化/缓存可以把数据放在内存中，虽然是快速的，但是也是最不可靠的；也可以把数据放在磁盘上，也不是完全可靠的！例如磁盘会损坏等。

- 问题解决

Checkpoint的产生就是为了更加可靠的数据持久化，在Checkpoint的时候一般把数据放在在HDFS上，这就天然的借助了`HDFS天生的高容错、高可靠来实现数据最大程度上的安全，实现了RDD的容错和高可用`。
- 使用步骤

```java
//HDFS的目录
1.SparkContext.setCheckpointDir("目录") 
2.RDD.checkpoint()
```

### 代码演示

```java
//设置检查点目录,会立即在HDFS上创建一个空目录
sc.setCheckpointDir("hdfs://node01:8020/ckpdir") 
//对数据进行处理
val rdd1 = sc.textFile("hdfs://node01:8020/wordcount/input/words.txt").flatMap(_.split(" ")).map((_,1)).reduceByKey(_+_)
//对rdd1进行检查点保存
rdd1.checkpoint() 
//Action操作才会真正执行checkpoint
rdd1.collect 
//后续如果要使用到rdd1可以从checkpoint中读取
```

- 查看结果

```java
//命令行查看
hdfs dfs -ls /
//通过web界面查看
http://192.168.1.101:50070/dfshealth.html#tab-overview
```

**小结**

- 开发中如何保证数据的安全性性及读取效率？？

```java
可以对频繁使用且重要的数据，先做缓存/持久化，再做checkpint操作
```

## 持久化和Checkpoint的区别

**1、** 位置；

```java
Persist 和 Cache 只能保存在本地的磁盘和内存中(或者堆外内存--实验中)
Checkpoint 可以保存数据到 HDFS 这类可靠的存储上
```

**2、** 生命周期；

```java
Cache和Persist的RDD会在程序结束后会被清除或者手动调用unpersist方法
Checkpoint的RDD在程序结束后依然存在，不会被删除
```

**3、** Lineage(血统、依赖链–其实就是依赖关系)；

```java
Persist和Cache，不会丢掉RDD间的依赖链/依赖关系，因为这种缓存是不可靠的，
如果出现了一些错误(例如 Executor 宕机)，需要通过回溯依赖链重新计算出来。
```

```java
Checkpoint会斩断依赖链，因为Checkpoint会把结果保存在HDFS这类存储中，
更加的安全可靠，一般不需要回溯依赖链。
```
