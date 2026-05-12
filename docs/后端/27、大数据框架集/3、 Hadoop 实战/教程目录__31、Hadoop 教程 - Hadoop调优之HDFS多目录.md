# 31、Hadoop 教程 - Hadoop调优之HDFS多目录
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/31.html
- 分类：大数据框架
- 分组：教程目录
## 1. NameNode多目录配置

1）NameNode的本地目录可以配置成多个，且每个目录存放内容相同，增加了可靠性

2）具体配置如下

- 在hdfs-site.xml文件中添加如下内容（注意：因为每台服务器节点的磁盘情况不同，所以这个配置配完之后，可以选择不分发）

```java
<property>
     <name>dfs.namenode.name.dir</name>
     <value>file://${hadoop.tmp.dir}/dfs/name1,file://${hadoop.tmp.dir}/dfs/name2</value>
</property>
```

- 停止集群，删除三台节点的data和logs中所有数据（在所有机器中执行如下命令）

```java
rm -rf data/ logs/
```

- 格式化集群并启动。

```java
bin/hdfs namenode -format
sbin/start-dfs.sh
```

3）查看结果（在原有的dfs目录下可以看到name1和name2这2个目录，然后检查name1和name2里面的内容，发现一模一样）

## 2. DataNode多目录配置

1）DataNode可以配置成多个目录，每个目录存储的数据不一样（数据不是副本）

2）具体配置如下（在hdfs-site.xml文件中添加如下内容）

```java
<property>
     <name>dfs.datanode.data.dir</name>
     <value>file://${hadoop.tmp.dir}/dfs/data1,file://${hadoop.tmp.dir}/dfs/data2</value>
</property>
```

3）查看结果（在原有的dfs目录下可以看到data1和data2这2个目录）

4）向集群上传一个文件，再次观察两个文件夹里面的内容发现不一致（一个有数一个没有）

## 3. 集群数据均衡之磁盘间数据均衡

生产环境，由于硬盘空间不足，往往需要增加一块硬盘。刚加载的硬盘没有数据时，可以执行磁盘数据均衡命令。（Hadoop3.x新特性）

1）生成均衡计划（当只有一块磁盘时，不会生成计划）

```java
hdfs diskbalancer -plan hadoop103
```

2）执行均衡计划

```java
hdfs diskbalancer -execute hadoop103.plan.json
```

3）查看当前均衡任务的执行情况

```java
hdfs diskbalancer -query hadoop103
```

4）取消均衡任务

```java
hdfs diskbalancer -cancel hadoop103.plan.json
```
