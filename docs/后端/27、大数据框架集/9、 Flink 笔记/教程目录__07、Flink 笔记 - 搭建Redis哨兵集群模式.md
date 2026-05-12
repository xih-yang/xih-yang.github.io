# 07、Flink 笔记 - 搭建Redis哨兵集群模式
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/7.html
- 分类：大数据框架
- 分组：教程目录
## 1、下载安装包

[下载地址](https://download.redis.io/releases/?_ga=2.250129284.364617179.1615716673-1698622246.1615716673)

## 2、上传安装包

```java
 redis-3.0.6.tar.gz
```

## 3、解压

```java
tar -zxvf redis-3.0.6.tar.gz -C /opt/module/
```

## 4、修改安装目录

```java
[root@hadoop102 redis-3.0.6]# pwd
/opt/module/redis-3.0.6
[root@hadoop102 redis-3.0.6]# vim src/Makefile
# redis 安装目录
PREFIX?=/usr/local/redis3.0.6
INSTALL_BIN=$(PREFIX)/bin
INSTALL=install
```

## 5、安装依赖

```java
yum install readline-devel pcre-devel openssl-devel perl gcc-c++ -y
```

## 6、编译安装

```java
[root@hadoop102 redis-3.0.6]# pwd
/opt/module/redis-3.0.6
[root@hadoop102 redis-3.0.6]# make && make install
```

## 7、创建相关目录

```java
[root@hadoop102 redis3.0.6]# pwd
/usr/local/redis3.0.6
[root@hadoop102 redis3.0.6]# mkdir -p cluster/7001
```

## 8、复制 redis.conf

```java
[root@hadoop102 7001]# pwd
/usr/local/redis3.0.6/cluster/7001
[root@hadoop102 7001]# cp /opt/module/redis-3.0.6/redis.conf ./
[root@hadoop102 7001]# ls -l
总用量 44
-rw-r--r--. 1 root root 41560 3月  14 18:26 redis.conf
```

## 9、配置 redis.conf

```java
# redis 后台启动
daemonize yes
# redis 进程pid存放地
pidfile /usr/local/redis3.0.6/cluster/7001/redis.pid
# redis 客户端端口
port 7001
# redis 日志存放地
logfile "/usr/local/redis3.0.6/cluster/7001/log.txt"
# rdb 文件
dbfilename dump-7001.rdb
# 是否启动 aof 可选
appendonly yes
# aof 文件
appendfilename "appendonly-7001.aof"
```

## 10、配置其他主机

在其他主机配置同上面一样，注意创建目录700x不同和配置redis.conf有一些不同。比如上面是在hadoop102上配置，需要在hadoop103、hadoop104同理配置。

## 11、配置 sentinel.conf

```java
[root@hadoop102 redis3.0.6]# cd cluster/
[root@hadoop102 cluster]# pwd
/usr/local/redis3.0.6/cluster
[root@hadoop102 cluster]# vim sentinel.conf
# 添加如下内容
sentinel monitor mymaster 192.168.200.102 7001 1
```

```java
说明：sentinel monitor 为主机命名 主机IP 主机端口号 将主机判定为下线时需要Sentinel同意的数量
```

## 12、启动 redis

```java
[root@hadoop102 ~]# cd /usr/local/redis3.0.6/
[root@hadoop102 redis3.0.6]# bin/redis-server cluster/7001/redis.conf 
```

```java
[root@hadoop103 redis3.0.6]# pwd
/usr/local/redis3.0.6
[root@hadoop103 redis3.0.6]# bin/redis-server cluster/7002/redis.conf 
```

```java
[root@hadoop104 redis3.0.6]# pwd
/usr/local/redis3.0.6
[root@hadoop104 redis3.0.6]# bin/redis-server cluster/7003/redis.conf 
```

## 13、检查redis是否启动

```java
 ps -ef | grep redis
```

## 14、运行 sentinel.conf 配置

## 15、启动redis客户端

```java
[root@hadoop102 redis3.0.6]# bin/redis-cli -p 7001
[root@hadoop103 redis3.0.6]# bin/redis-cli -p 7002
[root@hadoop104 redis3.0.6]# bin/redis-cli -p 7003
```

## 16、查看角色

```java
127.0.0.1:7001> info replication
127.0.0.1:7002> info replication
127.0.0.1:7003> info replication
```

## 17、更改角色

语法：slaveof host/ip port

hadoop103：

```java
127.0.0.1:7001>SLAVEOF 192.168.200.102 7001
```

hadoop104::

```java
127.0.0.1:7001>SLAVEOF 192.168.200.102 7001
```

此时在查看角色 hadoop102 为master hadoop103和hadoop104为slave

## 18、测试主从复制

hadoop102：

```java
127.0.0.1:7001> set hello world
```

hadoop103：

```java
127.0.0.1:7001>get hello
“world”
```

hadoop104：

```java
127.0.0.1:7001>get hello
“world”
```

hadoop103、hadoop104不能增加修改数据 只能读取数据

## 19、测试master宕机

```java
[root@hadoop102 redis3.0.6]# ps -ef | grep redis
root      84358  52954  0 18:58 pts/3    00:00:11 bin/redis-sentinel *:26379 [sentinel]
root      84665  49088  0 19:25 pts/2    00:00:00 grep --color=auto redis
[root@hadoop102 redis3.0.6]# kill -9 84358
```

此时查看 hadoop103、hadoop104那个主机被选举程master

当hadoop102 重新启动时，需要重新加入。
