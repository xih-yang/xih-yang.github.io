# 02、MyCat 实战 - 安装启动
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/2.html
- 分类：分库分表
- 分组：教程目录
## 1、安装

**1、** 解压后即可使用；

解压缩文件拷贝到 linux 下 /usr/local/

**2、** 三个配置文件(mycat/conf目录下)；

**1、****schema**.xml：定义逻辑库，表、分片节点等内容

**2、****rule**.xml：定义分片规则

**3、****server**.xml：定义用户以及系统相关变量，如端口等

## 2、启动

位置：/usr/local/mycat/

**1、** 修改server.xml配置文件；

：标明是mycat用户

`TESTDB：逻辑库名是TESTDB`

**2、** 修改配置文件schema.xml；

删除测试库配置(标签中的数据)

**schema**:逻辑库

配置dataNode配置dataNode="dn1" 数据项的配置，逻辑库的默认的数据节点

`：TESTDB是逻辑库名`

**dataNode：**

name与上述的schema中的配置一致

dataHost是配置数据主机名

database：配置真实物理机上的数据库

**dataHost**：

**name:需要与上述的dataNode中的dataHost一致**

心跳检测，检测是否存活

```java
 <heartbeat>select user()</heartbeat>:
```

配置写主机（写主机包括一个读主机）

```java
<writeHost host="hostM1" url="localhost:3306" user="root"
                                   password="123456">
                        <!-- can have multi read hosts -->
                        <readHost host="hostS2" url="192.168.1.200:3306" user="root" password="xxx" />
                </writeHost>
```

最终样本：

远程访问mysql测试

[root@hadoop1 conf]# mysql -uroot -p1234 -h 192.168.43.87 -P 3306

[root@hadoop1 conf]# mysql -uroot -p1234 -h 192.168.43.132 -P 3306

### 启动程序

1、控制台启动 ：去 mycat/bin 目录下执行 ./mycat console

2、后台启动 ：去 mycat/bin 目录下 ./mycat start

## 3、登陆

**登录后台管理窗口**

登陆命令：mysql -**umycat**-p123456 -P 9066 -h 192.168.43.185

登录方式用于管理维护 Mycat

```java
[root@hadoop1 ~]# mysql -umycat -p123456 -P 9066 -h 192.168.43.185
Warning: Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 5.6.29-mycat-1.6.7.1-release-20190627191042 MyCat Server (monitor)
Copyright (c) 2000, 2015, Oracle and/or its affiliates. All rights reserved.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> 
```

```java
mysql> show database
    -> ;
+----------+
| DATABASE |
+----------+
| TESTDB   |
+----------+
1 row in set (0.01 sec)
mysql> show @@help
    -> ;
+--------------------------------------------------------------+--------------------------------------------+
| STATEMENT                                                    | DESCRIPTION                                |
+--------------------------------------------------------------+--------------------------------------------+
| show @@time.current                                          | Report current timestamp                   |
| show @@time.startup                                          | Report startup timestamp                   |
| show @@version                                               | Report Mycat Server version                |
| show @@server                                                | Report server status                       |
| show @@threadpool                                            | Report threadPool status                   |
| show @@database                                              | Report databases                           |
| show @@datanode                                              | Report dataNodes                           |
| show @@datanode where schema = ?                             | Report dataNodes                           |
| show @@datasource                                            | Report dataSources                         |
| show @@datasource where dataNode = ?                         | Report dataSources                         |
| show @@datasource.synstatus                                  | Report datasource data synchronous         |
| show @@datasource.syndetail where name=?                     | Report datasource data synchronous detail  |
| show @@datasource.cluster                                    | Report datasource galary cluster variables |
| show @@processor                                             | Report processor status                    |
| show @@command                                               | Report commands status                     |
| show @@connection                                            | Report connection status                   |
| show @@cache                                                 | Report system cache usage                  |
| show @@backend                                               | Report backend connection status           |
| show @@session                                               | Report front session details               |
| show @@connection.sql                                        | Report connection sql                      |
| show @@sql.execute                                           | Report execute status                      |
| show @@sql.detail where id = ?                               | Report execute detail status               |
| show @@sql                                                   | Report SQL list                            |
| show @@sql.high                                              | Report Hight Frequency SQL                 |
| show @@sql.slow                                              | Report slow SQL                            |
| show @@sql.resultset                                         | Report BIG RESULTSET SQL                   |
| show @@sql.sum                                               | Report  User RW Stat                       |
| show @@sql.sum.user                                          | Report  User RW Stat                       |
| show @@sql.sum.table                                         | Report  Table RW Stat                      |
| show @@parser                                                | Report parser status                       |
| show @@router                                                | Report router status                       |
| show @@heartbeat                                             | Report heartbeat status                    |
| show @@heartbeat.detail where name=?                         | Report heartbeat current detail            |
| show @@slow where schema = ?                                 | Report schema slow sql                     |
| show @@slow where datanode = ?                               | Report datanode slow sql                   |
| show @@sysparam                                              | Report system param                        |
| show @@syslog limit=?                                        | Report system mycat.log                    |
| show @@white                                                 | show mycat white host                      |
| show @@white.set=?,?                                         | set mycat white host,[ip,user]             |
| show @@directmemory=1 or 2                                   | show mycat direct memory usage             |
| show @@check_global -SCHEMA= ? -TABLE=? -retry=? -interval=? | check mycat global table consistency       |
| switch @@datasource name:index                               | Switch dataSource                          |
| kill @@connection id1,id2,...                                | Kill the specified connections             |
| stop @@heartbeat name:time                                   | Pause dataNode heartbeat                   |
| reload @@config                                              | Reload basic config from file              |
| reload @@config_all                                          | Reload all config from file                |
| reload @@route                                               | Reload route config from file              |
| reload @@user                                                | Reload user config from file               |
| reload @@sqlslow=                                            | Set Slow SQL Time(ms)                      |
| reload @@user_stat                                           | Reset show @@sql  @@sql.sum @@sql.slow     |
| rollback @@config                                            | Rollback all config from memory            |
| rollback @@route                                             | Rollback route config from memory          |
| rollback @@user                                              | Rollback user config from memory           |
| reload @@sqlstat=open                                        | Open real-time sql stat analyzer           |
| reload @@sqlstat=close                                       | Close real-time sql stat analyzer          |
| offline                                                      | Change MyCat status to OFF                 |
| online                                                       | Change MyCat status to ON                  |
| clear @@slow where schema = ?                                | Clear slow sql by schema                   |
| clear @@slow where datanode = ?                              | Clear slow sql by datanode                 |
+--------------------------------------------------------------+--------------------------------------------+
59 rows in set (0.00 sec)
```

**登录数据窗口**

用于通过 Mycat 查询数据

mysql - **umycat**-p123456 -P 8066 -h 192.168.43.185

查看数据库

mysql> show databases;

+----------+

|DATABASE |

+----------+

|TESTDB |

+----------+

1row in set (0.07 sec)

使用当前库

mysql> use TESTDB;

Database changed

查看表
mysql> show tables;

Empty set (0.01 sec)

在mysql中创建mytal数据表

mysql> show tables;

+------------------+

|Tables_in_testdb |

+------------------+

|mytbl |

+------------------+

1row in set (0.00 sec)
