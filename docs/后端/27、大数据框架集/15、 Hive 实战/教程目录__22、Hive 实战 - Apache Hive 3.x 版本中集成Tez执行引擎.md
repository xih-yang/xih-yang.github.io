# 22、Hive 实战 - Apache Hive 3.x 版本中集成Tez执行引擎
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/22.html
- 分类：大数据框架
- 分组：教程目录
## 1. 什么是Tez引擎

Tez是一个Hive的运行引擎，性能优于MR。为什么优于MR呢？看下图。

用Hive直接编写MR程序，假设有四个有依赖关系的MR作业，上图中，绿色是Reduce Task，云状表示写屏蔽，需要将中间结果持久化写到HDFS。

Tez可以将多个有依赖的作业转换为一个作业，这样只需写一次HDFS，且中间节点较少，从而大大提升作业的计算性能。

## 2. 安装包下载和上传

1）下载tez的依赖包：[Apache Tez – Welcome to Apache TEZ®](https://tez.apache.org/)

2）上传安装包到 /opt/software 目录下，如下图所示

3）解压安装包到 /opt/module 目录下，并配置软连接

```java
mkdir /opt/module/tez-0.10.1
tar -zxvf tez-0.10.1-SNAPSHOT.tar.gz -C /opt/module/tez-0.10.1
ln -s /opt/module/tez-0.10.1/ /opt/module/tez
```

## 3. 在hive中配置tez

1）在hive的conf目录下新添加 hive-env.sh 文件，并在该文件中添加如下配置：

vim/opt/module/hive/conf/hive-env.sh

```java
# Set HADOOP_HOME to point to a specific hadoop install directory
export HADOOP_HOME=/opt/module/hadoop
# Hive Configuration Directory can be controlled by:
export HIVE_CONF_DIR=/opt/module/hive/conf
# Folder containing extra libraries required for hive compilation/execution can be controlled by:
# tez的解压目录
export TEZ_HOME=/opt/module/tez
export TEZ_JARS=""
for jar in ls $TEZ_HOME |grep jar; do
    export TEZ_JARS=$TEZ_JARS,$TEZ_HOME/$jar
done
for jar in ls $TEZ_HOME/lib; do
    export TEZ_JARS=$TEZ_JARS,$TEZ_HOME/lib/$jar
done
# 需要设置 HIVE_AUX_JARS_PATH
export HIVE_AUX_JARS_PATH=${TEZ_JARS:1}
echo $HIVE_AUX_JARS_PATH
```

2）在hive-site.xml文件中添加如下配置，更改hive计算引擎

```java
    <property>
        <name>hive.execution.engine</name>
        <value>tez</value>
    </property>
```

## 4. 配置Tez

1）在Hive的/opt/module/hive/conf下面创建一个tez-site.xml文件

```java
vim /opt/module/hive/conf/tez-site.xml
```

2）在该配置文件中添加如下内容

```java
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>tez.lib.uris</name>
        <value>${fs.defaultFS}/tez/tez-0.10.1,${fs.defaultFS}/tez/tez-0.10.1/lib</value>
    </property>
    <property>
        <name>tez.lib.uris.classpath</name>
        <value>${fs.defaultFS}/tez/tez-0.10.1,${fs.defaultFS}/tez/tez-0.10.1/lib</value>
    </property>
    <property>
        <name>tez.use.cluster.hadoop-libs</name>
        <value>true</value>
    </property>
    <property>
        <name>tez.history.logging.service.class</name>
        <value>org.apache.tez.dag.history.logging.ats.ATSHistoryLoggingService</value>
    </property>
</configuration>
```

## 5. 上传Tez到集群

将/opt/module/tez-0.10.1上传到HDFS的/tez路径

```java
hadoop fs -mkdir /tez
hadoop fs -put /opt/module/tez-0.10.1/ /tez
hadoop fs -ls /tez
```

最后正常运行hive即可，再执行作业时，即为使用tez引擎来执行
