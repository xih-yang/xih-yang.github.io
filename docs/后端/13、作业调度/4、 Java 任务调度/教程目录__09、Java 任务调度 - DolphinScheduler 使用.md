# 09、Java 任务调度 - DolphinScheduler 使用
- 来源：https://ddkk.com/zhuanlan/job/job/1/9.html
- 分类：作业调度
- 分组：教程目录
DolphinScheduler 是一个分布式去中心化，易扩展的可视化 DAG 工作流任务调度系统。本文主要介绍 DolphinScheduler 的基本使用，文中使用到的软件及版本：Java 1.8.0_181、DolphinScheduler 1.3.6、MySQL 5.7、Zookeeper 3.6.3、Centos 7.6。

## 1、DolphinScheduler 简介

### 1.1、DolphinScheduler 特性

A、**高可靠性** 去中心化的多 Master 和多 Worker, 自身支持 HA 功能, 采用任务队列来避免过载，不会造成机器卡死

B、**简单易用** DAG 监控界面，所有流程定义都是可视化，通过拖拽任务完成定制 DAG，通过 API 方式与第三方系统集成, 一键部署

C、**丰富的使用场景** 支持暂停恢复操作. 支持多租户，更好的应对大数据的使用场景. 支持更多的任务类型，如:Spark, Hive, M/R, Python, Sub_process, Shell

D、**高扩展性** 支持自定义任务类型，调度器使用分布式调度，调度能力随集群线性增长，Master 和 Worker 支持动态上下线

### 1.2、DolphinScheduler 架构

### 1.3、DolphinScheduler 流程启动活动图

更多详细的介绍可参考官网：https://dolphinscheduler.apache.org/zh-cn/

## 2、DolphinScheduler 安装

### 2.1、单机安装

#### 2.1.1、基础软件安装

a、PostgreSQL (8.2.15+) or MySQL (5.7系列) : 两者任选其一即可, 如MySQL则需要JDBC Driver 5.1.47+

b、JDK (1.8+) : 必装，安装好后需配置 JAVA_HOME 及 PATH 变量

c、ZooKeeper (3.4.6+) ：必装

d、Hadoop (2.6+) or MinIO ：选装， 如果需要用到资源上传功能，针对单机可以选择本地文件目录作为上传文件夹(此操作不需要部署Hadoop)；当然也可以选择上传到Hadoop or MinIO集群上

#### 2.1.2、下载安装包并解压

https://dolphinscheduler.apache.org/zh-cn/download/download.html

```java
tar zxvf apache-dolphinscheduler-1.3.6-bin.tar.gz
```

#### 2.1.3、创建部署用户并赋予目录操作权限

```java
useradd dolphinscheduler;
# 添加密码
echo "dolphinscheduler" | passwd --stdin dolphinscheduler
# 配置sudo免密
sed -i '$adolphinscheduler  ALL=(ALL)  NOPASSWD: NOPASSWD: ALL' /etc/sudoers
sed -i 's/Defaults    requirett/#Defaults    requirett/g' /etc/sudoers
# 修改目录权限
chown -R dolphinscheduler:dolphinscheduler apache-dolphinscheduler-1.3.6-bin
```

#### 2.1.4、ssh 免密配置

```java
su dolphinscheduler
ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 2.1.5、修改数据库信息

```java
vi conf/datasource.properties
```

如果选择 MySQL，需要把 MySQL 的 JDBC 驱动放到 lib 目录下

```java
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://10.49.196.49:3306/dolphinscheduler?characterEncoding=UTF-8&allowMultiQueries=true
spring.datasource.username=admin
spring.datasource.password=Root_123!
```

#### 2.1.6、修改运行参数

a、修改 conf/env/`dolphinscheduler_env.sh` 中环境变量；JAVA_HOME 和 PATH 是必须要配置的，没有用到的可以忽略或者注释掉

```java
export HADOOP_HOME=/opt/soft/hadoop
export HADOOP_CONF_DIR=/opt/soft/hadoop/etc/hadoop
export SPARK_HOME1=/opt/soft/spark1
export SPARK_HOME2=/opt/soft/spark2
export PYTHON_HOME=/opt/soft/python
export JAVA_HOME=/home/hadoop/app/jdk1.8.0_221/bin/java
export HIVE_HOME=/opt/soft/hive
export FLINK_HOME=/opt/soft/flink
export DATAX_HOME=/opt/soft/datax
export PATH=$HADOOP_HOME/bin:$SPARK_HOME1/bin:$SPARK_HOME2/bin:$PYTHON_HOME:$JAVA_HOME/bin:$HIVE_HOME/bin:$FLINK_HOME/bin:$DATAX_HOME/bin
:$PATH
```

b、将jdk 软链到 /usr/bin/java下

```java
sudo ln -s /home/hadoop/app/jdk1.8.0_221/bin/java /usr/bin/java
```

c、修改一键部署配置文件 conf/config/install_config.conf 中的各参数

```java
dbtype="mysql"
dbhost="10.49.196.49:3306"
username="admin"
password="Root_123!"
zkQuorum="10.49.196.11:2181"
#安装目录
installPath="/home/dolphinscheduler/dolphinscheduler-1.3.6"
#部署用户
deployUser="dolphinscheduler"
# 业务用到的比如sql等资源文件上传到哪里，可以设置：HDFS,S3,NONE，单机如果想使用本地文件系统，请配置为HDFS，因为HDFS支持本地文件系统；如果不需要资源上传功能请选择NONE。强调一点：使用本地文件系统不需要部署hadoop
resourceStorageType="HDFS"
#这里以保存到本地文件系统为例
#如果想上传到HDFS的话，NameNode启用了HA，则需要将hadoop的配置文件core-site.xml和hdfs-site.xml放到conf目录下，本例即是放到/opt/dolphinscheduler/conf下面，并配置namenode cluster名称；如果NameNode不是HA,则修改为具体的ip或者主机名即可
#defaultFS="hdfs://mycluster:8020"
defaultFS="file:///home/dolphinscheduler/data"
# 资源上传根路径,支持HDFS和S3,由于hdfs支持本地文件系统，需要确保本地文件夹存在且有读写权限
resourceUploadPath="/home/dolphinscheduler/data"
ips="localhost"
masters="localhost"
workers="localhost:default"
alertServer="localhost"
apiServers="localhost"
```

d、一键部署

```java
install.sh
```

脚本完成后，会启动以下5个服务：

```java
MasterServer         ----- master服务
WorkerServer         ----- worker服务
LoggerServer         ----- logger服务
ApiApplicationServer ----- api服务
AlertServer          ----- alert服务
```

e、启停服务

**进入到安装目录**，可以启停个服务。

启停所有服务

```java
./bin/stop-all.sh
./bin/start-all.sh
```

启停Master

```java
./bin/dolphinscheduler-daemon.sh start master-server
./bin/dolphinscheduler-daemon.sh stop master-server
```

启停Worker

```java
./bin/dolphinscheduler-daemon.sh start worker-server
./bin/dolphinscheduler-daemon.sh stop worker-server
```

启停Api

```java
./bin/dolphinscheduler-daemon.sh start api-server
./bin/dolphinscheduler-daemon.sh stop api-server
```

启停Logger

```java
./bin/dolphinscheduler-daemon.sh start logger-server
./bin/dolphinscheduler-daemon.sh stop logger-server
```

启停Alert

```java
./bin/dolphinscheduler-daemon.sh start alert-server
./bin/dolphinscheduler-daemon.sh stop alert-server
```

### 2.2、集群安装

集群安装和单机安装大部分都是一样的，具体可参考官网文档，这里就不说明了。

## 3、DolphinScheduler 使用

进入控制台 **http://10.49.196.11:12345/dolphinscheduler** (admin/dolphinscheduler123)，点击“项目管理”，新建一个项目，然后定义工作流，工作流支持多种任务：SHELL、SQL、HTTP、MapReduce、SPARK 等等。

“工作流实例“，”任务实例“可以查看任务执行的日志。

详细的使用说明可参考官网文档：https://dolphinscheduler.apache.org/zh-cn/docs/latest/user_doc/system-manual.html。
