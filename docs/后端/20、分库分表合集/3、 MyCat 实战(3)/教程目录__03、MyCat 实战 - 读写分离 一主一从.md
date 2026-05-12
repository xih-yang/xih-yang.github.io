# 03、MyCat 实战 - 读写分离 一主一从
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/3.html
- 分类：分库分表
- 分组：教程目录
通过Mycat 和 MySQL 的主从复制配合搭建数据库的读写分离，实现 MySQL 的高可用性

## 一主一从

### mysql的配置

一个主机用于处理所有写请求，一台从机负责所有读请求

1、MySQL 主从复制原理

从从机的接入点开始复制数据

发生IO会有延时性特点

Relaylog:中继日志

2、主机配置文件192.168.199.231

文件位置： vim /etc/ **my.cnf**

```java
#主服务器唯一ID
server-id=1
##启用二进制日志
log-bin=mysql-bin
## 设置不要复制的数据库(可设置多个)
binlog-ignore-db=mysql
##binlog-ignore-db=information_schema
##设置需要复制的数据库
binlog-do-db=testdb
##设置logbin格式
binlog_format=STATEMENT
```

binlog三种格式：

3、从机配置192.168.199.185

文件位置： vim /etc/ **my.cnf**

```java
#从服务器唯一ID
server-id=2
#启用中继日志
relay-log=mysql-relay
```

④主机、从机重启 MySQL 服务

⑤主机从机都关闭防火墙

⑥在主机上建立帐户并授权 slave （权限）

mysql> GRANT REPLICATION SLAVE ON *.* TO 'slave'@'%' IDENTIFIED BY '123123';

Query OK, 0 rows affected (0.02 sec)

查询主机的状态

#记录下File和Position的值

#执行完此步骤后不要再操作主服务器MySQL，防止主服务器状态值变化

⑦在从机上配置需要复制的主机

CHANGE MASTER TO MASTER_HOST='主机的IP地址',

MASTER_USER='slave',

MASTER_PASSWORD='123123',（密码在 **⑥**中设置）

MASTER_LOG_FILE='mysql-bin.具体数字',MASTER_LOG_POS=具体值;

#启动从服务器复制功能

start slave;

#查看从服务器状态

show slave status\G;

注意：

如果已经连接主机需要进行重置

stop slave;

reset slave;

⑧主机新建库、新建表、insert 记录，从机复制

此时创建的数据库必须是testdb **2、**中设置属性

**主机中创建数据表以及插入数据**

mysql> use testdb;

Database changed

mysql> create table mytbl(id int,name varchar(20));

Query OK, 0 rows affected (0.12 sec)

插入数据

从机中进行查询数据

⑨停止从服务复制功能

stop slave;

⑩重新配置主从

stop slave;

reset master;

### mycat配置

schema.xml

启动Mycat

登陆mycat进行查询数据

#### 验证读写分离

#### 1、在写主机插入：insert into mytbl values (1,@@hostname);主从主机数据不一致了

主机:

从机：

**2、在Mycat里查询：select * from mytbl;**

**3、修改的balance属性，通过此属性配置读写分离的类型**

负载均衡类型，目前的取值有4 种：

（1）balance="0", 不开启读写分离机制，所有读操作都发送到当前可用的 writeHost 上。

**（2）balance="1"，全部的 readHost 与 stand by writeHost 参与 select 语句的负载均衡，**

**　　 简单的说，当双主双从模式(M1->S1，M2->S2，并且 M1 与 M2 互为主备)，正常情况下，M2,S1,S2 都参与 select 语句的负载均衡。企业开发**

（3）balance="2"，所有读操作都 **随机**的在 writeHost、readhost 上分发。

**（4）balance="3"，所有读请求随机的分发到 readhost 执行，writerHost 不负担读压力，企业开发**

再次进行查询

数据就会进行随机机器查询
