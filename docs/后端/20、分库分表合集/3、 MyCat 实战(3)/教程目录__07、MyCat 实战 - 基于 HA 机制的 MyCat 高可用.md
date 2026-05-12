# 07、MyCat 实战 - 基于 HA 机制的 MyCat 高可用
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/3/7.html
- 分类：分库分表
- 分组：教程目录
在实际项目中，Mycat 服务也需要考虑高可用性，如果 Mycat 所在服务器出现宕机，或 Mycat 服

务故障，需要有备机提供服务，需要考虑 Mycat 集群。

## 1、 高可用方案

使用HAProxy + Keepalived 配合两台 Mycat 搭起 Mycat 集群，实现高可用性。

HAProxy实现了 MyCat 多节点的集群 **高可用**和 **负载均衡**

HAProxy 自身的高可用则可以通过 Keepalived 来实现。

角色
ip

mycat01
192.168.199.217

mycat02
192.168.199.120

HA(主)
192.168.199.174

keepalive（主机）
192.168.199.174

HA(主)
192.168.199.199

keepalive（主机
192.168.199.199

**先配置好mycat并且启动mycat**

## 2 安装配置 HAProxy

### 1、 安装 HAProxy

2解压到/usr/local/src

3进入解压后的目录，查看内核版本，进行编译

[root@mycat05 software]# cd /usr/local/src/haproxy-1.5.18/

[root@mycat05 haproxy-1.5.18]# uname -r

**3、** 10.0-957.el7.x86_64；

[root@mycat05 haproxy-1.5.18]# **make TARGET=linux310 PREFIX=/usr/local/haproxy ARCH=x86_64**

# ARGET=linux310，内核版本，使用uname -r查看内核，如：3.10.0-957.el7，此时该参数就为linux310；

#ARCH=x86_64，系统位数；

#PREFIX=/usr/local/haprpxy #/usr/local/haprpxy，为haprpxy安装路径。

4编译完成后，进行安装

make install PREFIX=/usr/local/haproxy

5安装完成后，创建目录、创建HAProxy配置文件

mkdir -p /usr/data/haproxy/

vim/usr/local/haproxy/haproxy.conf

6向配置文件中插入以下配置信息,并保存

```java
global
 log 127.0.0.1 local0
log 127.0.0.1 local1 notice
log loghost local0 info
 maxconn 4096
 chroot /usr/local/haproxy
 pidfile /usr/data/haproxy/haproxy.pid
 uid 99
 gid 99
 daemon
debug
quiet
defaults
 log global
 mode tcp
 option abortonclose
 option redispatch
 retries 3
 maxconn 2000
 timeout connect 5000
 timeout client 50000
 timeout server 50000
listen proxy_status 
bind :48066
 mode tcp
 balance roundrobin
 server mycat_1 192.168.140.128:8066 check inter 10s
 server mycat_2 192.168.140.127:8066 check inter 10s
frontend admin_stats 
bind :7777
 mode http
 stats enable
 option httplog
 maxconn 10
 stats refresh 30s
 stats uri /admin
 stats auth admin:123123 //登陆账户and密码
 stats hide-version
 stats admin if TRUE
```

### 2、 启动验证

1启动HAProxy

/usr/local/haproxy/sbin/haproxy -f /usr/local/haproxy/haproxy.conf

2查看HAProxy进程

ps-ef|grep haproxy

3打开浏览器访问

[http://192.168.199.174:7777/admin](http://192.168.199.174:7777/admin)

如果Mycat主备机均已启动，则可以看到如下图

4验证负载均衡，通过HAProxy访问Mycat

在HAProxy主机上执行（192.168.199.174HA的主机地址）

[root@mycat05 haproxy-1.5.18]# mysql -umycat -p123456 -h 192.168.199.174 -P 48066

## 3 配置 Keepalived

下载地址：[https://www.keepalived.org/software/](https://www.keepalived.org/software/)

1准备好Keepalived安装包，传到/opt目录下

2解压到/usr/local/src

tar-zxvf keepalived-1.4.2.tar.gz -C /usr/local/src

3安装依赖插件

yuminstall -y gcc openssl-devel popt-devel

4进入解压后的目录，进行配置，进行编译

cd/usr/local/src/keepalived-1.4.2

./configure --prefix=/usr/local/keepalived

5进行编译，完成后进行安装

make && make install

6运行前配置

cp/usr/local/src/keepalived-1.4.2/keepalived/etc/init.d/keepalived /etc/init.d/

mkdir /etc/keepalived

cp/usr/local/keepalived/etc/keepalived/keepalived.conf /etc/keepalived/

cp/usr/local/src/keepalived-1.4.2/keepalived/etc/sysconfig/keepalived /etc/sysconfig/

cp/usr/local/keepalived/sbin/keepalived /usr/sbin/

7修改配置文件

vim/etc/keepalived/keepalived.conf

```java
#修改内容如下
! Configuration File for keepalived
global_defs {
 notification_email {
 xlcocoon@foxmail.com
 }
 notification_email_from keepalived@showjoy.com
 smtp_server 127.0.0.1
 smtp_connect_timeout 30
 router_id LVS_DEVEL
 vrrp_skip_check_adv_addr
 vrrp_garp_interval 0
 vrrp_gna_interval 0
}
vrrp_instance VI_1 {
主机配MASTER，备机配BACKUP
state MASTER
#所在机器网卡
 interface ens33
virtual_router_id 51
#数值越大优先级越高
 priority 100
 advert_int 1
 authentication {
 auth_type PASS
 auth_pass 1111
 }
virtual_ipaddress {
#虚拟IP
 192.168.199.111
 } }
virtual_server 192.168.199.111 48066 {
 delay_loop 6
 lb_algo rr
 lb_kind NAT
 persistence_timeout 50
 protocol TCP
 real_server 192.168.199.174 48066 { HA的地址（主机）
 weight 1r
 TCP_CHECK {
 connect_timeout 3
 retry 3
 delay_before_retry 3
 } }
real_server 192.168.199.199 48600 {#HA地址（备机r）
 weight 1
 TCP_CHECK {
 connect_timeout 3
 nb_get_retry 3
 delay_before_retry 3
 }
 } }
```

**8、** 启动Keepalived；

同时启动备机上的HA

service keepalived start

**9、** 登录验证；

mysql -umycat -p123456 -h 192.168.199.111 -P 48066

**192、** 168.199.111：虚拟ip；

此时是：

HA隐藏mycat的ip

KeepAlive隐藏HA的ip

## 4 测试高可用

1关闭mycat

2通过虚拟ip查询数据

mysql -umycat -p123456 -h 192.168.199.111 -P 48066

```java
mysql> select * from orders;
ERROR 2013 (HY000): Lost connection to MySQL server during query
mysql> select * from orders;
ERROR 2006 (HY000): MySQL server has gone away
No connection. Trying to reconnect...
Connection id:    2
Current database: TESTDB
+--------+------------+-------------+-----------+
| id     | order_type | customer_id | amount    |
+--------+------------+-------------+-----------+
|      1 |        101 |         100 | 100100.00 |
|      2 |        101 |         100 | 100300.00 |
|      6 |        102 |         100 | 100020.00 |
|      3 |        101 |         101 | 120000.00 |
|      4 |        101 |         101 | 103000.00 |
|      5 |        102 |         101 | 100400.00 |
| 400100 |        102 |         101 |   1000.00 |
| 400101 |        102 |         101 |   1000.00 |
+--------+------------+-------------+-----------+
8 rows in set (1.46 sec)
```
