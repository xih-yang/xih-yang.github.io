# 25、Hive 教程 - 如何在 Hive 中创建外部表映射 Hbase 中已存在的表
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/25.html
- 分类：大数据框架
- 分组：教程目录
## 一、上传完整的jar文件到hive/lib中

**1、** 删除hive/lib下所有文件；

**2、** 解压上传hive所有的jar到该目录下；

## 二、修改hive-site.xml

```java
    <name>hbase.zookeeper.quorum</name>
    <value>ghym,ghys1,ghys2</value>#自定义的zookeeper集群电脑名与hbase建立联系
    <name>hive.zookeeper.quorum</name>
    <value>ping1,ping2,ping4</value>#自定义的zookeeper集群电脑名与hive建立联系
    <name>hive.aux.jars.path</name>#将jar文件的位置指定为本地目录,否则默认在HDFS上寻找jar
    <value>file:///home/hadoop/hive-2.3.3/lib/hbase-server-1.1.1.jar,file:///home/hadoop/hive-2.3.3/lib/hbase-client-1.1.1.jar,file:///home/hadoop/hive-2.3.3/lib/hive-hbase-handler-2.2.0.jar,file:///home/hadoop/hive-2.3.3/lib/zookeeper-3.4.6.jar</value>
```

## 三、修改hive-env.sh

```java
export HADOOP_HOME=/home/hadoop/hadoop-2.9.0#hadoop目录
export HBASE_HOME=/home/hadoop/hbase-1.2.6#hbase目录
export HIVE_CONF_DIR=/home/hadoop/hive-2.3.3/conf#hive配置文件目录
```

## 四、在hive和hbase中分别创建相关联的表并通过hive向hbase表中加载数据

```java
CREATE TABLE hive表名(key int, value1 string, value2 int,...)#hive表列名和数据类型 
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES (
"hbase.columns.mapping" = ":key,a:b,a:c,..."#hbase表rowkey,列族:列名
)TBLPROPERTIES(
"hbase.table.name"="hbase表名",
"hbase.mapred.output.outputtable"="hbase表名"
);
#不支持load data命令,通过insert从其他表查询数据加载
insert overwrite table hive表名 select eno,ename,... from emp;
```

**关键字**

**1、** STOREDBY表示使用hive配置中的类完成向hbase中存储数据；

**2、** WITHSERDEPROPERTIES表示创建hive临时对应hbase表的列族名称；

**3、** TBLPROPERTIES表示对应hbase中表的名称；

**4、** hbase.mapred.output.outputtable表示mapreduce操作向hbase表中输出；

## 五、在hive中创建外部表映射hbase中已存在的表

```java
CREATE EXTERNAL TABLE hive表名(key int, value1 string, value2 int,...)#hive表列名和数据类型 
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES (
"hbase.columns.mapping" = ":key,a:b,a:c,..."#hbase表rowkey,列族:列名
)TBLPROPERTIES(
"hbase.table.name"="hbase表名",
"hbase.mapred.output.outputtable"="hbase表名"
);
```

**特点**

**1、** 建表或映射表的时候如果没有指定:key则第一个列默认就是行键；

**2、** HBase对应的Hive表中没有时间戳概念，默认返回的就是最新版本的值；

**3、** 由于HBase中没有数据类型信息，所以在存储数据的时候都转化为String类型；

## 六、特别注意

**1、** 对HBase表进行预分区，增大其MapReduce作业的并行度；

**2、** 合理的设计rowkey使其尽可能的分布在预先分区好的Region上；

**3、** 通过sethbase.client.scanner.caching设置合理的扫描缓存；
