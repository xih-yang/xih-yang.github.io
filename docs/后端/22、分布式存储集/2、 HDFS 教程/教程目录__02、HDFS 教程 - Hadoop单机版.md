# 02、HDFS 教程 - Hadoop单机版
- 来源：https://ddkk.com/zhuanlan/filestorage/hdfs/1/2.html
- 分类：分布式存储
- 分组：教程目录
## 1. 安装hadoop并修改配置文件

在usr 文件夹下创建 hadoop 文件夹作为压缩包存放和解压路径，将 hadoop 的压缩包传输到此文件夹下后 解压：

```java
[root@hadoop-1 hadoop]# pwd
/usr/hadoop
[root@hadoop-1 hadoop]# ll
total 357860
-rw-r--r--. 1 root root 366447449 Feb 25 14:28 hadoop-2.9.2.tar.gz
[root@hadoop-1 hadoop]# tar -zxvf hadoop-2.9.2.tar.gz
```

后续就是配置proflie文件 和 修改五个配置文件

注意：hadoop 2.x 的配置文件在 $HADOOP_HOME/etc/hadoop 目录中

### 1.1 配置proflie文件

在etc 的 profile 最后添加入下内容，然后 source 刷新配置文件

```java
export HADOOP_HOME=/usr/hadoop/hadoop-2.9.2
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
```

接下来需要改五个配置文件

### 1.2 第一个：hadoop-env.sh

进入到hadoop-2.9.3 /etc/hadoop 文件夹下，修改 hadoop-env.sh

vimhadoop-env.sh，填写的是java的安装路径（25行）

```java
# The java implementation to use.
# export JAVA_HOME=${JAVA_HOME}
export JAVA_HOME=/usr/java/jdk1.8.0_231
```

> 思考：hadoop-env.sh 中为何要重复配置 JAVA_HOME？

### 1.3 第二个 core-site.xml

在configuration 中加上：

```java
<!-- 指定HDFS的老大（NameNode）的地址 -->
<property>
	<name>fs.defaultFS</name>
	<value>hdfs://hadoop-1.wj:9000</value>
</property>
<!-- 指定hadoop运行时产生文件的存储目录[能自动生成目录] -->
<property>
	<name>hadoop.tmp.dir</name>
	<value>/usr/hadoop/tmp</value>
</property>
```

### 1.4 第三个 hdfs-site.xml

同上configuration 中添加：

```java
<!-- 指定HDFS副本的数量 -->
<property>
    <name>dfs.replication</name>
    <value>1</value>
</property>
<!-- 确定 DFS namenode 在本地文件系统上应存储名称表（fsimage）的位置 -->
<property>
    <name>dfs.namenode.name.dir</name> 
    <value>/usr/local/hadoop/tmp/dfs/name</value>
</property>
<!-- 确定 DFS datanode 应在本地文件系统上的哪个位置存储其块 -->
<property>
    <name>dfs.datanode.data.dir</name>                      
    <value>/usr/local/hadoop/tmp/dfs/data</value>
</property>
<!-- 如果为“ false”，则关闭权限检查 -->
<property>
    <name>dfs.permissions.enabled</name>                      
    <value>falise</value>
</property>
```

> hdfs-site.xml 文件配置参考

### 1.5 第四个 mapred-site.xml

mapred-site.xml 配置 MapReduce 运行的平台，默认为 local 本地平台模拟运行，而不是在集群上分布式运行，只是一个单机的程序

这里配置为 yarn 平台运行，yarn 负责分配内存

这个需要复制一个模版文件出来

```java
cp mapred-site.xml.template mapred-site.xml
```

然后vim mapred-site.xml 添加

```java
<!-- 指定mr运行在yarn上 -->
<property>
	<name>mapreduce.framework.name</name>
	<value>yarn</value>
</property>
```

### 1.6 第五个 yarn-site.xml

```java
<!-- 指定YARN的老大（ResourceManager）的地址 -->
<property>
	<name>yarn.resourcemanager.hostname</name>
	<value>hadoop-1.wj</value>
</property>
<!-- reducer 获取数据的方式 -->
<property>
	<name>yarn.nodemanager.aux-services</name>
	<value>mapreduce_shuffle</value>
</property>
<!-- 忽略虚拟内存检查，如果实在实体机上，并且内存够多，可以去掉 -->
<property>
	<name>yarn.nodemanager.vmen-check-enabled</name>
	<value>false</value>
</property>
```

## 2. 格式化 namenode

对namenode 进行初始化

```java
hadoop namenode -format
```

如果没有报错说明配置文件成功,否则重新检查配置文件

## 3. 启动 hadoop

先启动HDFS（这里需要yes三次并输入你的root密码三次）：

```java
start-dfs.sh
```

再启动YARN（这里需要输入root密码）：

```java
start-yarn.sh
```

## 4. 验证是否启动成功

```java
[root@hadoop-1 hadoop]# jps
3297 DataNode
4113 Jps
3477 SecondaryNameNode
3973 NodeManager
3161 NameNode
3674 ResourceManager
```

关闭防火墙

```java
[root@hadoop-1 hadoop]# systemctl stop firewalld
[root@hadoop-1 hadoop]# systemctl disable firewalld.service
Removed symlink /etc/systemd/system/dbus-org.fedoraproject.FirewallD1.service.
Removed symlink /etc/systemd/system/basic.target.wants/firewalld.service.
```

浏览器查看

- http://ip地址:50070 （HDFS 管理界面）
- http://ip地址:8088 (YARN 管理界面）

本例中：

- HDFS 管理界面 ：http://192.168.27.100:50070/
- YSRN 管理界面 ：http://192.168.27.100:8088/

如果页面正常则说明hadoop配置成功
