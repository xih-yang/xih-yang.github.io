# 20、Nginx 实战：Nginx高可用架构
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/20.html
- 分类：服务器框架
- 分组：教程目录
## 1.Keepalived高可用基本概述

## 1.1.什么是高可用

一般是指2台机器启动着相同的业务系统,当有一台机器down机了, 另外一台服务器能快速的接管, 对于访问的用户是无感知的。

## 1.2.高可用通常使用什么软件?

通常服务高可用我们选择使用keepalived软件实现

## 1.3.keepalived是如何实现高可用的？

keepalived软件是基于VRRP协议实现的。VRRP虚拟路由冗余协议，主要用于解决单点故障问题

## 1.4.那VRRP是如何诞生的，VRRP的原理又是什么？

比如公司的网络是通过网关转换进行上网的，那如果该路由器故障了，网关无法转发报文了，此时所有人都将无法上网，这么时候怎么办呢？

通常做法是给路由增加一台备节点，但问题来了?如果我们的主网关master故障了，用户是需要手动修改网关指向Backup，如果用户过多修改起来会非常的麻烦。

第一个问题: 假设用户将指向都修改到Backup路由器，那么Master路由器如果修复好了又该怎么办？

第二个问题: 假设Master网关故障，我们将Backup网关配置为Master网关IP行不行?

其实上不行，因为PC第一次是通过ARP广播寻找到Master网关的Mac地址与IP地址，PC则会将Master网关的对应IP与MAC地址写入ARP缓存表中，那么PC第二次则会直接读取ARP缓存表中的MAC地址与IP地址，然后进行数据包的转发。此时PC转发的数据包还是会教给Master。(除非PC的ARP缓存表过期，在次发起ARP广播的时候才能正确获取Bakcup的Mac地址与对应的IP地址。)

如何才能做到出现故障自动转移，此时VRRP就应运而生，我们的VRRP其实是通过软件或硬件的形式在Master和Backup外面增加一个虚拟MAC地址(简称VMAC)与虚拟IP地址(简称VIP)。那么在这种情况下，PC请求VIP的时候，无论是Master处理还是Backup处理，PC仅会在ARP缓存表中记录VMAC与VIP的对应关系。

## 1.5.高可用keepalived使用场景

通常业务系统需要保证7x24小时不DOWN机, 比如公司内部OA系统，每天公司人员都需要使用，则不允许Down机。作为业务系统来说随时都可用

## 1.6.高可用核心概念总结

- 1.如何确定谁是主节点谁是备节点。(投票选举？优先级？)
- 2.如果Master故障，Backup自动接管，那Master恢复后会夺权吗？(抢占式、非抢占式)
- 3.如果两台服务器都认为自己是Master会出现什么问题？(脑裂)

## 2.Keepalived高可用安装配置

## 2.1.实践环境，配置实现虚IP转移

状态
IP
角色

节点1
10.0.0.5
Master

节点2
10.0.0.6
Backup

VIP
10.0.0.3

## 2.2.在master与backup上分别安装keepalived

```java
[root@lb01 ~]# yum install keepalived -y
[root@lb02 ~]# yum install keepalived -y
```

## 2.3.配置节点1，Master

```java
[root@lb01 ~]# cat /etc/keepalived/keepalived.conf
global_defs {     
    router_id lb01   
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 50
    priority 150
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
}
    virtual_ipaddress {
        10.0.0.3
    }
}
```

## 2.4.配置节点2，Backup

```java
[root@lb02 ~]# cat /etc/keepalived/keepalived.conf
global_defs {
    router_id lb02
}
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 50
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.0.3
    }
}
```

## 2.5.对比keepalived的master与backup配置的区别

Keepalived配置区别
Master配置
Backup节配置

route_id(唯一标识)
lb01
lb02

state(角色状态)
MASTER
BACKUP

priority(优先级)
150
100

## 2.6.启动Master与Backup节点的keepalived

```java
#lb01
[root@lb01 ~]# systemctl enable keepalived
[root@lb01 ~]# systemctl start keepalived
#lb02
[root@lb02 ~]# systemctl enable keepalived
[root@lb02 ~]# systemctl start keepalived
```

## 3.Keepalived高可用地址漂移

检查keepalived的虚拟VIP地址能否漂移

## 3.1.在Master上进行如下操作

```java
# Master存在vip地址
[root@lb01 ~]# ip addr |grep 10.0.0.3
    inet 10.0.0.3/24 scope global secondary eth0
# 停止Master上的keepalived, 检测vip已不存在
[root@lb01 ~]# systemctl stop keepalived
[root@lb01 ~]# ip addr |grep 10.0.0.3
```

## 3.2.在Backup上进行如下操作

```java
#发现地址已经漂移至Backup端
[root@lb02 ~]# ip addr|grep 10.0.0.3
    inet 10.0.0.3/24 scope global secondary eth0
```

## 3.3.此时重新启动Master上的Keepalived,会发现VIP被强行抢占

```java
[root@lb01 ~]# systemctl start keepalived
[root@lb01 ~]# ip addr |grep 10.0.0.3
    inet 10.0.0.3/24 scope global secondary eth0
```

## 3.4.通过windows查看arp缓存表，验证地址漂移后是否会自动更新MAC地址。

## 4.Keepalived高可用非抢占式

通常master服务故障后backup会变成master，但是当master服务又恢复的时候，master会抢占VIP，这样就会发生两次切换对业务繁忙的网站来说并不是太友好，此时我们可以配置keepalived为非抢占式(前提两台主机的硬件配置信息一致)

配置非抢占式步骤如下

- 1、两个节点的state都必须配置为BACKUP(官方建议)
- 2、两个节点都在vrrp_instance中添加nopreempt参数
- 3、其中一个节点的优先级必须要高于另外一个节点的优先级。

两台服务器都角色状态启用nopreempt后，必须修改角色状态统一为BACKUP，唯一的区分就是优先级。

```java
#Master
    vrrp_instance VI_1 {
        state BACKUP
        priority 150
        nopreempt
    }
#Backup
    vrrp_instance VI_1 {
        state BACKUP
        priority 100
        nopreempt
    }
```

## 5.keepalived高可用故障脑裂

由于某些原因，导致两台keepalived高可用服务器在指定时间内，无法检测到对方的心跳消息，各自取得资源及服务的所有权，而此时的两台高可用服务器又都还活着。

- 1.服务器网线松动等网络故障
- 2.服务器硬件故障发生损坏现象而崩溃
- 3.主备都开启firewalld防火墙

## 5.1.在备上编写检测脚本, 测试如果能ping通主并且备节点还有VIP的话则认为产生了列脑

```java
[root@lb02 ~]# cat check_split_brain.sh
#!/bin/sh
vip=10.0.0.3
master_ip=10.0.0.5
while true;do
    ping -c 2 -W 3 $master_ip &>/dev/null
    if [ $? -eq 0 -a ip add|grep "$vip"|wc -l -eq 1 ];then
        echo "ha is split brain.warning."
    else
        echo "ha is ok"
    fi
sleep 5
done
```

## 5.2.如果Nginx宕机, 会导致用户请求失败, 但Keepalived并不会进行切换, 所以需要编写一个脚本检测Nginx的存活状态, 如果不存活则kill nginx和keepalived

```java
[root@lb01 ~]# mkdir /server/scripts
[root@lb01 ~]# vim /server/scripts/check_web.sh
#!/bin/sh
nginxpid=$(ps -C nginx --no-header|wc -l)
#1.判断Nginx是否存活,如果不存活则尝试启动Nginx
if [ $nginxpid -eq 0 ];then
    systemctl start nginx
    sleep 3
   2.等待3秒后再次获取一次Nginx状态
    nginxpid=$(ps -C nginx --no-header|wc -l) 
   3.再次进行判断, 如Nginx还不存活则停止Keepalived,让地址进行漂移,并退出脚本  
    if [ $nginxpid -eq 0 ];then
        systemctl stop keepalived
   fi
fi
#给脚本增加执行权限
[root@lb01 ~]# chmod +x /server/scripts/check_web.sh
```

## 5.3.在lb01主机的keepalived配置文件中调用此脚本

```java
[root@lb01 ~]# cat /etc/keepalived/keepalived.conf
global_defs {
         router_id LVS_01
}
#1.每5秒执行一次脚本, 脚本执行内容不能超过5秒,否则会被中断再次重新运行脚本
vrrp_script check_web {
   script "/server/scripts/check_web.sh"
   interval 5
}
vrrp_instance VI_1 {
    nopreempt
    state MASTER
    interface eth0
    virtual_router_id 50
    priority 150
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.0.3
    }
   2.调用并运行该脚本
    track_script {
        check_web
    }
}
```
