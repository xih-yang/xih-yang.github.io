# 21、Hive 实战 - Apache Hive 3.x 版本的配置和部署
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/1/21.html
- 分类：大数据框架
- 分组：教程目录
## 1. Hive安装部署

1）上传安装包到服务器对应目录

2）解压 apache-hive-3.1.2-bin.tar.gz 到 /opt/module/ 目录下面

```java
tar -zxvf /opt/software/apache-hive-3.1.2-bin.tar.gz -C /opt/module/
```

3）重命名解压目录，并配置软链接

```java
mv apache-hive-3.1.2-bin/ hive-3.1.2
ln -s /opt/module/hive-3.1.2/ /opt/module/hive
```

4）修改环境变量，并source环境变量，使生效

```java
vim /etc/profile
# 添加如下配置
#HIVE_HOME
export HIVE_HOME=/opt/module/hive
export PATH=$PATH:$HIVE_HOME/bin
# source环境变量，使生效
source /etc/profile
```

5）解决日志Jar包冲突，进入/opt/module/hive/lib目录

```java
cd /opt/module/hive/lib/
mv log4j-slf4j-impl-2.10.0.jar log4j-slf4j-impl-2.10.0.jar.bak
```

## 2. Hive元数据配置到MySQL

### 2.1. 拷贝驱动

将MySQL的JDBC驱动拷贝到Hive的lib目录下

```java
cp /opt/software/mysql-connector-java-5.1.37.jar /opt/module/hive/lib/
```

### 2.2. 配置Metastore到MySQL

1）在$HIVE_HOME/conf目录下新建hive-site.xml文件

```java
vim /opt/module/hive/conf/hive-site.xml
```

2）添加如下内容

```java
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>javax.jdo.option.ConnectionURL</name>
        <value>jdbc:mysql://bigdata1:3306/metastore?useSSL=false</value>
    </property>
    <property>
        <name>javax.jdo.option.ConnectionDriverName</name>
        <value>com.mysql.jdbc.Driver</value>
    </property>
    <property>
        <name>javax.jdo.option.ConnectionUserName</name>
        <value>root</value>
    </property>
    <property>
        <name>javax.jdo.option.ConnectionPassword</name>
        <value>Yangshibiao123456.</value>
    </property>
    <property>
        <name>hive.metastore.warehouse.dir</name>
        <value>/user/hive/warehouse</value>
    </property>
    <property>
        <name>hive.metastore.schema.verification</name>
        <value>false</value>
    </property>
    <property>
        <name>hive.server2.thrift.port</name>
        <value>10000</value>
    </property>
    <property>
        <name>hive.server2.thrift.bind.host</name>
        <value>bigdata1</value>
    </property>
    <property>
        <name>hive.metastore.event.db.notification.api.auth</name>
        <value>false</value>
    </property>
    <property>
        <name>hive.cli.print.header</name>
        <value>true</value>
    </property>
    <property>
        <name>hive.cli.print.current.db</name>
        <value>true</value>
    </property>
</configuration>
```

## 3. 初始化元数据库

1）登陆MySQL

```java
 mysql -uroot -pYangshibiao123456.
```

2）新建Hive元数据库

```java
create database metastore;
quit;
```

3）初始化Hive元数据库

```java
 schematool -initSchema -dbType mysql -verbose
```

在数据库中有如下表即成功初始化：

## 4. 启动Hive客户端并使用

```java
# 启动hive客户端
hive
# 使用hivesql
show databases;
show tables;
create table test (id int);
insert into test values(1);
select * from test;
```

## 5. 使用元数据服务的方式访问 Hive

1）在 hive-site.xml 文件中添加如下配置信息

```java
    <!-- 指定存储元数据要连接的地址 -->
    <property>
        <name>hive.metastore.uris</name>
        <value>thrift://bigdata1:9083</value>
    </property>
```

2）启动 metastore

```java
hive --service metastore
注意: 启动后窗口不能再操作，需打开一个新的 shell 窗口做别的操作
在一个新的窗口启动hive
```

## 6. 使用 JDBC 方式访问 Hive

1）在 hive-site.xml 文件中添加如下配置信息

```java
    <!-- 指定 hiveserver2 连接的 host -->
    <property>
        <name>hive.server2.thrift.bind.host</name>
        <value>bigdata1</value>
    </property>
    <!-- 指定 hiveserver2 连接的端口号 -->
    <property>
        <name>hive.server2.thrift.port</name>
        <value>10000</value>
    </property>
```

注意：上述配置文件中已有，不需要添加了

2）启动 hiveserver2

```java
hive --service hiveserver2
```

3）启动 beeline 客户端（需要多等待一会）

```java
beeline -u jdbc:hive2://bigdata1:10000 -n hive
# 上述的hive用户可以填随意用户
```

注意：上述连接可能报错，此时需要在 hadoop 的 core-site.xml 配置文件中配置如下配置：

```java
    <property>
        <name>hadoop.proxyuser.hive.hosts</name>
        <value>*</value>
    </property>
    <property>
        <name>hadoop.proxyuser.hive.groups</name>
        <value>*</value>
    </property>
```

当看到如下界面，即启动成功：

```java
Connecting to jdbc:hive2://bigdata1:10000
Connected to: Apache Hive (version 3.1.2)
Driver: Hive JDBC (version 3.1.2)
Transaction isolation: TRANSACTION_REPEATABLE_READ
Beeline version 3.1.2 by Apache Hive
0: jdbc:hive2://bigdata1:10000>
```

## 7. 编写hive一键脚本

vim/root/bin/hiveservices.sh

```java
#!/bin/bash
HIVE_LOG_DIR=$HIVE_HOME/logs
if [ ! -d $HIVE_LOG_DIR ]
then
  mkdir -p $HIVE_LOG_DIR
fi
#检查进程是否运行正常，参数 1 为进程名，参数 2 为进程端口
function check_process()
{
  pid=$(ps -ef 2>/dev/null | grep -v grep | grep -i $1 | awk '{print $2}')
  ppid=$(netstat -nltp 2>/dev/null | grep $2 | awk '{print $7}' | cut -d '/' -f 1)
  echo $pid
  [[ "$pid" =~ "$ppid" ]] && [ "$ppid" ] && return 0 || return 1
}
function hive_start()
{
  metapid=$(check_process HiveMetastore 9083)
  cmd="nohup hive --service metastore >$HIVE_LOG_DIR/metastore.log 2>&1 &"
  [ -z "$metapid" ] && eval $cmd || echo "Metastroe 服务已启动"
  server2pid=$(check_process HiveServer2 10000)
  cmd="nohup hiveserver2 >$HIVE_LOG_DIR/hiveServer2.log 2>&1 &"
  [ -z "$server2pid" ] && eval $cmd || echo "HiveServer2 服务已启动"
}
function hive_stop()
{
  metapid=$(check_process HiveMetastore 9083)
  [ "$metapid" ] && kill $metapid || echo "Metastore 服务未启动"
  server2pid=$(check_process HiveServer2 10000)
  [ "$server2pid" ] && kill $server2pid || echo "HiveServer2 服务未启动"
}
case $1 in
"start")
  hive_start
  ;;
"stop")
  hive_stop
  ;;
"restart")
  hive_stop
  sleep 2
  hive_start
  ;;
"status")
  check_process HiveMetastore 9083 >/dev/null && echo "Metastore 服务运行正常" || echo "Metastore 服务运行异常"
  check_process HiveServer2 10000 >/dev/null && echo "HiveServer2 服务运行正常" || echo "HiveServer2 服务运行异常"
  ;;
*)
  echo Invalid Args!
  echo 'Usage: '$(basename $0)' start|stop|restart|status'
  ;;
esac
```

添加对应权限，即可通过该脚本操作hive服务
