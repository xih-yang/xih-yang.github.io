# 23、Hive 教程 - 简单几招教你如何解决 Hive 中小文件过多的问题
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/23.html
- 分类：大数据框架
- 分组：教程目录
通常在大数据开发的过程中，我们会经常遇见小文件过多的情况，对查询和运算的性能都会有一定的影响，那么这篇文章将会帮助大家解决 hive 中小文件过多的问题 😎

## 一、哪里会产生小文件 ?

**1、** 源数据本身有很多小文件；

**2、** 动态分区会产生大量小文件；

**3、** reduce个数越多,小文件越多；

**4、** 按分区插入数据的时候会产生大量的小文件,文件个数=maptask个数*分区数；

## 二、影响

- 从Hive的角度看，小文件会开很多map，一个map开一个JVM去执行，所以这些任务的初始化，启动，执行会浪费大量的资源，严重影响性能。
- HDFS存储太多小文件, 会导致namenode元数据特别大, 占用太多内存, 制约了集群的扩展。

## 三、解决方法

### 方法一：通过调整参数进行合并

```java
#每个Map最大输入大小(这个值决定了合并后文件的数量)
set mapred.max.split.size=256000000;
#一个节点上split的至少的大小(这个值决定了多个DataNode上的文件是否需要合并)
set mapred.min.split.size.per.node=100000000;
#一个交换机下split的至少的大小(这个值决定了多个交换机上的文件是否需要合并)
set mapred.min.split.size.per.rack=100000000;
#执行Map前进行小文件合并
set hive.input.format=org.apache.hadoop.hive.ql.io.CombineHiveInputFormat;
#===设置map输出和reduce输出进行合并的相关参数：
#设置map端输出进行合并，默认为true
set hive.merge.mapfiles = true
#设置reduce端输出进行合并，默认为false
set hive.merge.mapredfiles = true
#设置合并文件的大小
set hive.merge.size.per.task = 256*1000*1000
#当输出文件的平均大小小于该值时，启动一个独立的MapReduce任务进行文件merge。
set hive.merge.smallfiles.avgsize=16000000
```

### 方法二：使用 distribute by rand() 将数据随机分配给 reduce

针对按**分区插入数据**的时候产生大量的小文件的问题, 可以使用DISTRIBUTE BY rand() 将数据随机分配给Reduce，这样可以使得每个Reduce处理的数据大体一致。

```java
# 设置每个reducer处理的大小为5个G
set hive.exec.reducers.bytes.per.reducer=5120000000;
# 使用distribute by rand()将数据随机分配给reduce, 避免出现有的文件特别大, 有的文件特别小
insert overwrite table test partition(dt)
select * from iteblog_tmp
DISTRIBUTE BY rand();
```

### 方法三：使用 sequencefile 作为表存储格式，不要用 textfile，在一定程度上可以减少小文件

### 方法四：使用hadoop的archive归档

```java
#用来控制归档是否可用
set hive.archive.enabled=true;
#通知Hive在创建归档时是否可以设置父目录
set hive.archive.har.parentdir.settable=true;
#控制需要归档文件的大小
set har.partfile.size=1099511627776;
#使用以下命令进行归档
ALTER TABLE srcpart ARCHIVE PARTITION(ds='2008-04-08', hr='12');
#对已归档的分区恢复为原文件
ALTER TABLE srcpart UNARCHIVE PARTITION(ds='2008-04-08', hr='12');
#::注意，归档的分区不能够INSERT OVERWRITE，必须先unarchive
```

### 补充：hadoop自带的三种小文件处理方案

- **Hadoop Archive**

Hadoop Archive或者HAR，是一个高效地将小文件放入HDFS块中的文件存档工具，它能够将多个小文件打包成一个HAR文件，这样在减少namenode内存使用的同时，仍然允许对文件进行透明的访问。

- **Sequence file**

sequence file由一系列的二进制key/value组成，如果为key小文件名，value为文件内容，则可以将大批小文件合并成一个大文件。

- **CombineFileInputFormat**

它是一种新的inputformat，用于将多个文件合并成一个单独的split，另外，它会考虑数据的存储位置。
