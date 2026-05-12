# 06、Sharding-Sphere 实战：读写分离之MYSQL主从同步配置
- 来源：https://ddkk.com/zhuanlan/sharding/shardingsphere/1/6.html
- 分类：分库分表
- 分组：教程目录
概述：本周介绍mysql的主从同步配置，为下一步的Sharding 读写分离提供操作环境。mysql 主从同步主要通过主库开启binlog文件功能，然后从库通过监听binlog中内容进行数据在从库的实时同步。

环境：win7 + mysql 5.7.22

主要步骤：

**1、** 开启从数据库mysql服务；

**2、** 进行主从配置；

**3、** 创建账号用于主从复制；

**4、** 主从同步设置；

**一、开启从数据库mysql服务**

1，复制安装文件夹目录

2，修改从数据库的配置文件my.ini 修改服务端口以及文件夹路径和数据存储路径

3，修改从库中服务的uuid值，注意，不修改后期同步状态会有问题。

4，安装从库mysql服务。在从库的bin目录下 执行**mysqld install mysqls1 --defaults-file="D:\Program Files\mysql-5.7.27-winx64-s1\my.ini"**（注意需要通过管理员权限打开cmd窗口）

5，然后分别停止在启动mysql服务，检查是否正常

正常启动后可以使用数据库客户端工具进行测试连接。可以正常连接则第一个环节正常。

**二、进行主从配置**

1，在主mysql的安装文件下my.ini的mysqld的位置下添加如下内容，设置server_id 以及需要同步的数据库和忽略的数据库

```java
#==========主从配置master====================
#binlog 文件名
log-bin=mysql-bin
binlog_format=ROW
server_id=1
#设置需要同步的数据库名
binlog-do-db=course_db
binlog-do-db=course_db_1
binlog-do-db=course_db_2
binlog-do-db=user_db
#屏蔽数据库同步
binlog-ignore-db=mysql
binlog-ignore-db=performance_schema
binlog-ignore-db=information_schema
```

2，从库在从库的my.ini 同样位置下添加如下内容：

```java
#==========主从配置slave====================
#binlog 文件名
log-bin=mysql-bin
binlog_format=ROW
server_id=2
#设置需要同步的数据库
replicate_wild_do_table=course_db.%
replicate_wild_do_table=course_db_1.%
replicate_wild_do_table=course_db_2.%
replicate_wild_do_table=user_db.%
#设置忽略同步的数据库
replicate_wild_ignore_table=mysql.%
replicate_wild_ignore_table=performance_schema.%
replicate_wild_ignore_table=information_schema.%
```

3，添加完成后同样进行服务的停止与重启，进行连接测试是否正常，没有问题则继续进行下一步。

**三、添加用于主从同步的专用账号**

直接使用主库的现有账号也可以,，第三步可直接略过。单独创建账号方式如下：

在主库bin目录下打开cmd窗口 登录mysql 使用grant 命令创建账号，创建完成后并刷新账号权限。如下：

**四、设置从主库向从库同步数据**

1，在主库执行 **SHOW MASTER STATUS** 查询主库的binlog文件名以及起始点position

2，然后切换到从库首先停掉 从库（从库执行）

```java
STOP SLAVE;
```

3，执行sql（从库执行）

```java
CHANGE MASTER TO MASTER_HOST='localhost',MASTER_USER='root',MASTER_PASSWORD='root',MASTER_LOG_FILE='mysql-bin.000007',MASTER_LOG_POS=6756;
```

4，开启从库（从库执行）

```java
START SLAVE;
```

5，查询从库状态（从库执行）

```java
SHOW SLAVE STATUS
```

上面Slave_IO_Running、Slave_SQL_Running 都为yes时表示设置成功。（如果io项为false时检查账号权限以及第一部分中的server_id或uuid是否相同）。

到此配置完成。
