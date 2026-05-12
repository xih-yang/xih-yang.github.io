# 04、MyCat 实战 - 读写分离 双主双从
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/4.html
- 分类：分库分表
- 分组：教程目录
## 双主双从

一个主机 m1 用于处理所有写请求，它的从机 s1 和另一台主机 m2 还有它的从机 s2 负责所有读请

求。当m1 主机宕机后，m2 主机负责写请求，m1、m2 互为备机。

角色地址

master1 192.168.199.231

slave1 192.168.199.185

master2 192.168.199.120

slave2 192.168.199.174

注意：在一主一从基本上需要删除testdb以及恢复从机

**mater1配置**

修改/etc/my.cnf文件

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

新加配置

```java
# 在作为从数据库的时候，有写入操作也要更新二进制日志文件
log-slave-updates
#表示自增长字段每次递增的量，指自增字段的起始值，其默认值是1，取值范围是1 .. 65535
auto-increment-increment=2 
## 表示自增长字段从哪个数开始，指字段一次递增多少，他的取值范围是1 .. 65535
auto-increment-offset=1
```

**master2配置**

/etc/my.cnf

```java
#主服务器唯一ID
server-id=3 
#启用二进制日志
log-bin=mysql-bin
# 设置不要复制的数据库(可设置多个)
binlog-ignore-db=mysql
binlog-ignore-db=information_schema
#设置需要复制的数据库
binlog-do-db=testdb
##设置logbin格式
binlog_format=STATEMENT
## 在作为从数据库的时候，有写入操作也要更新二进制日志文件
log-slave-updates 
##表示自增长字段每次递增的量，指自增字段的起始值，其默认值是1，取值范围是1 .. 65535
auto-increment-increment=2 
## 表示自增长字段从哪个数开始，指字段一次递增多少，他的取值范围是1 .. 65535
auto-increment-offset=2
```

**slave1配置**

```java
#从服务器唯一ID
server-id=2
##启用中继日志
relay-log=mysql-relay
```

**slave2配置**

```java
#从服务器唯一ID
server-id=4 
#启用中继日志
relay-log=mysql-relay
```

1、配置好哦之后进行mysql服务的重启

2、关闭防火墙

3、在两台主机上建立帐户并授权 slave

```java
#在主机MySQL里执行授权命令
GRANT REPLICATION SLAVE ON *.* TO 'slave'@'%' IDENTIFIED BY '123123';
```

查看主机**master1**状态

```java
mysql> show master status
    -> ;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000010 |      120 | testdb       | mysql            |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```

查询 **Master2**的状态

```java
mysql> show master status
    -> ;
+------------------+----------+--------------+--------------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB         | Executed_Gtid_Set |
+------------------+----------+--------------+--------------------------+-------------------+
| mysql-bin.000002 |      120 | testdb       | mysql,information_schema |                   |
+------------------+----------+--------------+--------------------------+-------------------+
1 row in set (0.00 sec)
```

#分别记录下File和Position的值

#执行完此步骤后不要再操作主服务器MYSQL，防止主服务器状态值变化

在两台主机创建slave

GRANT REPLICATION SLAVE ON *.* TO 'slave'@'%' IDENTIFIED BY '123123';

④、在从机上配置需要复制的主机

slave1·

```java
mysql> CHANGE MASTER TO MASTER_HOST='192.168.199.231',
    -> MASTER_USER='slave',
    -> MASTER_PASSWORD='123123',
    -> MASTER_LOG_FILE='mysql-bin.000010',MASTER_LOG_POS=120;
Query OK, 0 rows affected, 2 warnings (0.01 sec)
mysql> start slave;
Query OK, 0 rows affected (0.01 sec)
```

slave2

mysql> CHANGE MASTER TO MASTER_HOST='192.168.199.120',

->MASTER_USER='slave',

->MASTER_PASSWORD='123123',

->MASTER_LOG_FILE='mysql-bin.000002',MASTER_LOG_POS=120;

Query OK, 0 rows affected, 2 warnings (0.03 sec)

mysql> start slave;

Query OK, 0 rows affected (0.00 sec)

此时master1和slave1，master2和slave2的主从复制搭建完成

⑤、两个主机互相复制

master1和master2互备主从赋值

master1执行（即连接master2的主机IP地址）

mysql> CHANGE MASTER TO MASTER_HOST='192.168.199.120',

->MASTER_USER='slave',

->MASTER_PASSWORD='123123',

->MASTER_LOG_FILE='mysql-bin.000002',MASTER_LOG_POS=120;

Query OK, 0 rows affected, 2 warnings (0.05 sec)

mysql> start slave;

Query OK, 0 rows affected (0.00 sec)

master2执行（即连接master1的主机IP地址）

```java
mysql> CHANGE MASTER TO MASTER_HOST='192.168.199.231',
    -> MASTER_USER='slave',
    -> MASTER_PASSWORD='123123',
    -> MASTER_LOG_FILE='mysql-bin.000010',MASTER_LOG_POS=120;
Query OK, 0 rows affected, 2 warnings (0.07 sec)
mysql> start slave;
Query OK, 0 rows affected (0.00 sec)
```

⑥、Master1 主机新建库、新建表、insert 记录，Master2 和从机复制

**创建数据库**

master1

```java
mysql> create database testdb;
Query OK, 1 row affected (0.00 sec)
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| metastore          |
| mysql              |
| performance_schema |
| test               |
| testdb             |
+--------------------+
6 rows in set (0.00 sec)
```

slave2

```java
mysql>  show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| metastore          |
| mysql              |
| performance_schema |
| test               |
| testdb             |
+--------------------+
6 rows in set (0.00 sec)
```

master2

```java
mysql>  show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| metastore          |
| mysql              |
| performance_schema |
| test               |
| testdb             |
+--------------------+
6 rows in set (0.01 sec)
```

slave2

```java
mysql>  show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| metastore          |
| mysql              |
| performance_schema |
| test               |
| testdb             |
+--------------------+
6 rows in set (0.00 sec)
```

**创建表以及插入数据**

master1

```java
mysql> use testdb;
Database changed
mysql> create table tbl(id int,name varchar(40));
Query OK, 0 rows affected (0.03 sec)
mysql> insert into tbl values (1,'mrchengs');
Query OK, 1 row affected (0.00 sec)
```

slave1

```java
mysql> use testdb;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
+------+----------+
1 row in set (0.00 sec)
```

master2

```java
mysql> use testdb;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
+------+----------+
1 row in set (0.00 sec)
```

slave2

```java
mysql> use testdb;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A
Database changed
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
+------+----------+
1 row in set (0.00 sec)
```

## mycat的使用

1、、修改schema.xml配置文件

配置项说明

#balance="1": 全部的readHost与stand by writeHost参与select语句的负载均衡。

# **writeType**="0": 所有写操作发送到配置的第一个writeHost， **第一个挂了切到还生存的第二个**

# **writeType**="1"，所有写操作都随机的发送到配置的 writeHost，1.5 以后废弃不推荐

# **writeHost**，重新启动后以切换后的为准，切换记录在配置文件中:dnindex.properties 。

# **switchType**=

1: 1 默认值，自动切换。

-1 表示不自动切换

2 基于 MySQL 主从同步的状态决定是否切换。

2、、启动mycat

3、、验证读写分离

在master1上执行插入语句

INSERT INTO mytbl VALUES(3,@@hostname);

```java
mysql> select * from tbl;
+------+-----------------------+
| id   | name                  |
+------+-----------------------+
|    1 | mrchengs              |
|    3 | localhost.localdomain |
+------+-----------------------+
2 rows in set (0.01 sec)
```

slave2

```java
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat03  |
+------+----------+
2 rows in set (0.00 sec)
```

master2

```java
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat04  |
+------+----------+
2 rows in set (0.00 sec)
```

slave2

```java
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat05  |
+------+----------+
2 rows in set (0.00 sec)
```

④、登陆mycat

[root@ddkk.com ~]# mysql -umycat -p123456 -P 8066 -h 192.168.199.217

进行验证**读写分离**

```java
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat04  |
+------+----------+
2 rows in set (0.00 sec)
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat03  |
+------+----------+
2 rows in set (0.00 sec)
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat05  |
+------+----------+
2 rows in set (0.07 sec)
```

⑤、 **高可用下的抗风险能力（高可用）**

关闭master1查询在配置文件中配置是否进行切换写主机数据库

```java
[root@ddkk.com ~]# systemctl stop mysql
[root@ddkk.com ~]# systemctl status mysql
● mysql.service - LSB: start and stop MySQL
   Loaded: loaded (/etc/rc.d/init.d/mysql; bad; vendor preset: disabled)
   Active: inactive (dead) since Thu 2020-02-13 20:15:06 CST; 8s ago
     Docs: man:systemd-sysv-generator(8)
  Process: 1632 ExecStop=/etc/rc.d/init.d/mysql stop (code=exited, status=0/SUCCESS)
  Process: 1070 ExecStart=/etc/rc.d/init.d/mysql start (code=exited, status=0/SUCCESS)
Feb 13 19:18:32 localhost.localdomain systemd[1]: Starting LSB: start and stop MySQL...
Feb 13 19:18:33 localhost.localdomain mysql[1070]: Starting MySQL SUCCESS!
Feb 13 19:18:33 localhost.localdomain systemd[1]: Started LSB: start and stop MySQL.
Feb 13 20:14:50 localhost.localdomain systemd[1]: Stopping LSB: start and stop MySQL...
Feb 13 20:15:06 localhost.localdomain mysql[1632]: Shutting down MySQL.............. SUCCESS!
Feb 13 20:15:06 localhost.localdomain systemd[1]: Stopped LSB: start and stop MySQL.
```

mycat客户端中执行插入代码

```java
mysql> INSERT INTO tbl VALUES(100,@@hostname);
Query OK, 1 row affected, 1 warning (0.15 sec)
```

启动master1进行查看数据、

```java
mysql> select * from tbl;
+------+-----------------------+
| id   | name                  |
+------+-----------------------+
|    1 | mrchengs              |
|    3 | localhost.localdomain |
|  100 | localhost.localdomain |
+------+-----------------------+
3 rows in set (0.00 sec)
```

在mycat上进行查询

```java
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat05  |
|  100 | mycat05  |
+------+----------+
3 rows in set (0.00 sec)
mysql> select * from tbl;
+------+-----------------------+
| id   | name                  |
+------+-----------------------+
|    1 | mrchengs              |
|    3 | localhost.localdomain |
|  100 | localhost.localdomain |
+------+-----------------------+
3 rows in set (0.00 sec)
mysql> select * from tbl;
+------+----------+
| id   | name     |
+------+----------+
|    1 | mrchengs |
|    3 | mycat03  |
|  100 | mycat03  |
+------+----------+
3 rows in set (0.00 sec)
```

**此时master1成为读主机**

**此时master2成为写主机**
