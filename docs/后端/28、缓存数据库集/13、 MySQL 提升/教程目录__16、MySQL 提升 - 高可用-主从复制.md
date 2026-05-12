# 16、MySQL 提升 - 高可用-主从复制
- 来源：https://ddkk.com/zhuanlan/db/mysql/1/16.html
- 分类：缓存数据库
- 分组：教程目录
### 一 原理

slave会从master读取binlog来进行数据同步，slave可以有多个。

#### 1.大概流程

**1、** master将数据更新日志记录到二进制日志(binarylog)中，这些记录过程叫做二进制日志事件，binarylogevents；

**2、** slave将master的binaryogevents拷贝到自己的中继日志(relaylog)中；

**3、** slave还原中继日志中的事件，将数据更新应用到自己的数据库中（该过程是串行化的）；

#### 2.原则和环境要求

**1、** 每个slaver只有一个master；

**2、** 每个slaver只能有一个唯一的服务器ID；

**3、** master可以有多个salver；

**4、** mysql的版本要一致；

**5、** 网络畅通；

### 二 流程

#### 1.相关配置文件介绍

```java
# 服务唯一id
server-id = 1
# 启用二进制日志
log-bin = 指定路径/xxxx/mysqlbin(文件)
# 启用错误日志
log-err = 指定路径/xxxx/mysqlerr(文件)
# mysql的根目录
basedir = mysql的根目录
# 临时目录
tmpdir = 临时目录
# 数据目录
datadir = 数据目录
# 可读写
read-only = 0
# 配置忽略复制的数据库
binlog-ignore-db = 
# 配置需要复制的数据库
binlog-do-db = 
```

其中只有server-id是必须的，master多一个log-bin配置，其他都可以省略。

#### 2.具体流程

**1、** 配置master的配置文件；

```java
# master服务唯一id
server-id = 1
# 启用二进制日志
log-bin = 指定路径/xxxx/mysqlbin(文件)
# 启用错误日志
log-err = 指定路径/xxxx/mysqlerr(文件)
```

**1、** 配置master的配置文件；

```java
# slaver服务唯一id
server-id = 2
```

**1、** 修改配置文件后重启生效；

**2、** 在master上创建账户用于数据复制使用；

```java
# 创建用户并授权
grant replication slave on *.* to '用户名'@'slaveip/ip段' identified by '密码';
# 刷新权限
flush privileges ;
```

**1、** 查询master的状态；

```java
show master status ;
```

记录下此时file的文件名和position的值

**1、** 在slave上配置从哪里复制数据；

```java
change master to master_host ='master主机ip',
master_user='主机开放的用户名',master_password='主机账户的密码',
master_log_file='哪个二进制文件',master_log_pos=二进制文件的指针数值;
```

**1、** 启动slaver的复制功能；

```java
# 启动同步功能
start slave;
# 查看同步状态
show slave status ;
```

当下面两个值为yes的时候才代表配置成功。

slave_io_running : yes

slave_sql_running: yes

**1、** 停止slaver的复制功能；

```java
stop slave;
```
