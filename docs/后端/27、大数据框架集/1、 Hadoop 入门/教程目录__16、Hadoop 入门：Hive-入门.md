# 16、Hadoop 入门：Hive-入门
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/16.html
- 分类：大数据框架
- 分组：教程目录
## Hive —— 入门

### Hive介绍

Apache Hive是一款建立在Hadoop之上的开源**数据仓库系统**，可以**将存储在Hadoop文件中的结构化、半结构化数据文件映射为一张数据库表**，基于表提供了一种类似SQL的查询模型，称为**Hive查询语言（ HQL）** ，用于访问和分析存储在Hadoop文件中的大型数据集。

Hive核心是**将HQL转换为MapReduce程序**，然后将程序提交Hadoop群集执行。

Hive由Facebook实现并开源。

**总的来说，Hive利用HDFS来存储数据，利用MapReduce分析数据，语言方面只需要使用HQL**

### Hive的架构组件

- **用户接口**

包括**command-line interface命令行接口和Hive Web interface**直接访问 和 **JDBC/ODBC等标准协议**结合Thrift服务器交互。

- **元数据存储**

通常是存储在关系数据库中，如mysql、derby（Hive自带）中。

- **驱动程序**

包括**语法解析器、计划编译器、优化器、执行器**

- **执行引擎**

Hive本身不处理数据，而是**通过执行引擎处理数据**，其支持MapReduce、Tez、Spark三种引擎。

### Hive的安装部署

安装模式
内嵌
本地
远程

Metastore是否需要单独配置启动
否
否
是

Metadata的存储介质
Derby
Mysql
Mysql

**这里仅介绍远程部署**

**机器版本：**Centos7

**安装前提：集群时间同步、防火墙关闭、主机host映射、免密登陆、Java环境、hadoop集群健康可用**

#### 1 安装Mysql

mysql在远程安装，需要注意的是要进行**远程访问授权**

```java
# 这里使用mysql的子版本mariadb，效果和mysql一样
## 1 移除mariadb
yum remove -y rpm -aq mariadb*
### 移除目录
rm -rf /etc/my.cnf
rm -rf /var/lib/mysql 
### 检查
rpm -aq mariadb*
## 2 安装
yum install mariadb* -y
## 3 设置开机自启
systemctl enable mariadb.service
## 4 其他
### 查看状态
systemctl status  mariadb
### 启动
systemctl start mariadb.service
### 重启
systemctl restart mariadb.service
### 停止
systemctl start mariadb.service
```

```java
# 进行远程访问授权
## 1 添加新用户，这里举例为 root 123456
use mysql;
update user set password=password("123456") where user='root';
## 2 授权，这里的%也可以替换为你想要进行授权的ip
grant all privileges on *.* to root@'%' identified by '123456' with grant option;
## 3 刷新
flush privileges;
```

#### 2 安装Hive

```java
## 解压
tar -xzvf apache-hive-3.1.3-bin.tar.gz -C /你想要/安装的/路径
## 使用hadoop中的guava替换hive中的guava
rm -rf apache-hive-3.1.3-bin/lib/guava-19.0.jar
cp hadoop-3.2.2/share/hadoop/common/lib/guava-27.0-jre.jar apache-hive-3.1.3-bin/lib/
```

#### 3 修改配置文件

**修改hadoop中的配置文件：**

```java
# 修改core-site.xml文件
vim hadoop-3.2.2/etc/hadoop/core-site.xml
```

```java
<property>
    <name>hadoop.proxyuser.root.hosts</name>
    <value>*</value>
</property>
<property>
    <name>hadoop.proxyuser.root.groups</name>
    <value>*</value>
</property>
```

**修改hive中 的配置文件**

```java
# 修改 hive-env.sh
cd apache-hive-3.1.3-bin/conf/
cp hive-env.sh.template hive-env.sh
vim hive-env.sh
```

```java
## 根据你的路径编写
# Set HADOOP_HOME to point to a specific hadoop install directory
HADOOP_HOME=/home/sjj/install/hadoop-3.2.2
# Hive Configuration Directory can be controlled by:
export HIVE_CONF_DIR=/home/sjj/install/apache-hive-3.1.3-bin/conf
# Folder containing extra libraries required for hive compilation/execution can be controlled by:
export HIVE_AUX_JARS_PATH=/home/sjj/install/apache-hive-3.1.3-bin/lib
```

```java
# 修改 hive-site.xml
vim hive-site.xml
```

```java
<configuration>
  <property>
    <name>hive.metastore.warehouse.dir</name>
    <value>/home/sjj/hive/warehouse</value>
    <description>数仓位置</description>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionURL</name>
    <value>jdbc:mysql://机器ip:3306/hive?createDatabaseIfNotExist=true&useSSL=false&useUnicode=true&characterEncoding=UTF-8</value>
    <description>MySQL连接协议 </description>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionDriverName</name>
    <value>com.mysql.cj.jdbc.Driver</value>
    <description>JDBC连接驱动</description>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionUserName</name>
    <value>root</value>
    <description>用户名</description>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionPassword</name>
    <value>123456</value>
    <description>密码</description> 
  </property>  
  <property>
    <name>hive.server2.thrift.bind.host</name>
    <value>机器ip</value>
    <description>H2S绑定host</description>
  </property>
  <property>
    <name>hive.metastore.uris</name>
    <value>thrift://机器ip:9083</value>
    <description>远程模式部署metastore地址</description>
  </property>
  <property>
    <name>hive.metastore.event.db.notification.api.auth</name>
    <value>false</value>
    <description>关闭元数据存储权限</description>
  </property>
  <property>
    <name>hive.metastore.local</name>  
    <value>false</value>  
  </property>
</configuration>
```

**然后上传mysql驱动jar包到hive的lib包下**

[mysql驱动下载地址](https://dev.mysql.com/downloads/connector/j/)

```java
## 初始化元数据
cd apache-hive-3.1.3-bin
bin/schematool -initSchema -dbType mysql -verbos
## 出现下面的显示说明成功了
Initialization script completed
schemaTool completed
## 创建成功的hive数据库中有74张表
```

#### 启动hive

**前台启动（方便排错）：**

```java
apache-hive-3.1.3-bin/bin/hive --service metastore --hiveconf hive.root.logger=DEBUG,console
```

**后台启动：**

```java
# 输出日志信息在./nohup.out
nohup apache-hive-3.1.3-bin/bin/hive --service metastore &
```

### Hive的客户端使用

```java
# 先启动metastore，再启动hiveserver2
nohup apache-hive-3.1.3-bin/bin/hive --service metastore &
nohup apache-hive-3.1.3-bin/bin/hive --service hiveserver2 &
```

#### 使用hive

```java
apache-hive-3.1.3-bin/bin/hive
```

#### 使用BeeLine

```java
apache-hive-3.1.3-bin/bin/beeline
# 连接
beeline> ! connect jdbc:hive2://机器ip:port
# 使用root用户
Enter username for jdbc:hive2://机器ip:port: root
```

#### 使用可视化客户端

可以使用**DataGrip（JB家的，没话说）** 、**DBeaver（推荐，嘎嘎好用还免费，就是下载驱动可能要特殊手段）** 、Navicat、SQL Client等。有兴趣的可以在网络上检索自行学习。
