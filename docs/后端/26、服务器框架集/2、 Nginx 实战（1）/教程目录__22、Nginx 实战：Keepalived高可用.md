# 22、Nginx 实战：Keepalived高可用
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/22.html
- 分类：服务器框架
- 分组：教程目录
## 一、Keepalived高可用概述

KeepAlived是一个用C语言编写的路由软件，它的主要目的是为了提供基于Linux服务器的负载均衡和高可用功能。其负载均衡是依赖lvs的，keepalived还实现了一些的检测器来实现后端服务器的健康检查。KeepAlived一般是指2台机器启动着完全相同的业务系统，当有一台机器down机了，另外一台服务器就能快速的接管，对于访问的用户是无感知的。

## 二、Keepalived高可用常用工具

```java
1.硬件：
	F5
2.软件：
	keepalived
```

## 三、KeepAlived高可用原理

```java
Keepalived高可用服务的故障切换转移，是通过VRRP来实现的。
在Keepalived服务正常运行时，主Master节点会不断向备用结点发送（多播方式）心跳信息，用以告诉Backup节点自己还活着。
当Master节点发生故障时，就无法发送心跳信息，Backup节点也就无法检测到来自Master的心跳信息，于是调用自身的接管程序，接管Master的IP资源和服务；
当Master恢复时，Backup又会释放Master故障时自身接管的IP资源和服务，恢复到原来的备用角色。
VRRP（Virtual Router Redundancy Protocol）虚拟路由协议，为了解决静态路由的单点故障问题，VRRP通过一种竞选机制来将路由的任务交给某台VRRP路由器。
VRRP早期是用来解决交换机、路由器等设备单点故障。交互、路由的Master和Backup的切换原理同样适用于Keepalived的工作原理。
在一组VRRP路由器集群中，有多台物理VRRP路由器，但并不是同时工作，而是由一台Master的机器负责路由工作，其他机器都是Backup。Master并不是一成不变，VRRP会让每个VRRP路由参与竞选，最终获胜的就是Master。获胜的Master有一些特权，比如拥有虚拟路由器的IP地址等。
拥有系统资源的Master负责转发发送给网关地址的包和响应ARP请求。
VRRP通过竞选机制来实现虚拟路由器的功能，所有的协议报文都是通过IP多播（Multicast）包形式来发送，默认多播地址224.0.0.18。在一组虚拟路由器中，不管谁是 Master，对外都是相同的MAC和IP，称之为VIP。客户端主机并不需要因Master的改变而修改自己的路由配置。对他们来说，这种切换时透明的。
在一组虚拟路由器中，只有作为Master的VRRP路由器会一直发送VRRP广播包，此时Backup不会抢占Master。当Master不可用时，Backup就收不到来自Master的广播包了，此时多台Backup中优先级最高的路由器会抢占为Master。
这种抢占非常快速，以保证服务的连续性。处于安全性考虑，VRRP数据报使用了加密协议进行加密。
```

## 四、KeepAlived高可用使用场景

```java
通常业务系统需要保证7×24小时不DOWN机，比如公司内部的OA系统，每天公司人员都需要使用，则不允许Down机，作为业务系统来说随时都可用
```

## 五、Keepalived高可用重要功能

### 1.管理LVS负载均衡软件

```java
可以说，Keepalived起初是专为解决LVS的问题而诞生的。因此，Keepalived和LVS的关系如夫妻一样，可紧密结合。
```

### 2.实现对LVS集群节点健康检查

```java
当LVS集群中某个节点服务器发生故障时，Keepalived服务会自动将失效的节点从正常队列中剔除，并将请求调度到别的正常的节点服务器上，从而保证用户访问不受影响。当故障节点被修复后，Keepalived服务又会自动把它切换回来。
```

### 3.系统网络服务的高可用功能

```java
Keepalived可以实现任意两台主机之间，如Master和Backup间的故障转移和自动切换。这个主机是不能停机的业务服务器，如LVS负载均衡、Nginx反向代理服务器等。
Keepalived高可用功能的简单原理。Mater获得所有资源并对用户提供服务，Backup主机为Master的热备。当Master失效或出现故障时，Backup将自动接管Master主机的所有工作，包括VIP资源；当Master恢复后，自会自动接管回它原来的工作，Backup则同时释放它接管的工作。
此时，两台主机将恢复到最初启动时各自的原始角色及工作状态。
```

## 六、keepalived高可用核心概念

```java
1.如何确定谁是主节点谁是背节点（选举投票，优先级）
2.如果Master故障，Backup自动接管，那么Master恢复后会夺权吗（抢占式、非抢占式）
3.如果两台服务器都认为自己是Master会出现什么问题（脑裂）
```

## 七、keepalived高可用搭建

### 1.环境准备

主机
IP
身份

web01
172.16.1.7

web03
172.16.1.9

nfs
172.16.1.31

db01
172.16.1.51

lb01
172.16.1.4
master

lb02
172.16.1.5
backup

10.0.0.3
VIP

### 2.保证两台七层负载均衡一致

```java
[root@lb01 ~]# scp /etc/nginx/conf.d/* 172.16.1.5:/etc/nginx/conf.d/
#访问测试
10.0.0.5 linux.blog.com
10.0.0.4 linux.blog.com
```

### 3.安装keepalived

```java
[root@lb01 ~]# yum install -y keepalived
[root@lb02 ~]# yum install -y keepalived
```

### 4.配置keepalived主节点

```java
#查找配置文件
[root@lb01 ~]# rpm -qc keepalived
/etc/keepalived/keepalived.conf
[root@lb01 ~]# vim /etc/keepalived/keepalived.conf
global_defs {				#全局配置
   router_id lb01			#身份识别
}
vrrp_instance VI_1 {		#VRPP协议配置
    state MASTER			#告诉你一开始这台机器是主
    interface eth0			#绑定的网卡
    virtual_router_id 51	#虚拟路由标识，就是编组，将master和backup分为一组
    priority 100			#优先级（真正判断是主还是备的条件）
    advert_int 1			#检测心跳的时间间隔
    authentication {		#认证相关
        auth_type PASS		#以密码的形式认证
        auth_pass 1111		#密码
    }
    virtual_ipaddress {		#指定VIP地址
        10.0.0.3
    }   
}
[root@lb01 ~]# vim /etc/keepalived/keepalived.conf
global_defs {
   router_id lb01
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
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

### 5.配置keepalived备节点

```java
[root@lb02 ~]# vim /etc/keepalived/keepalived.conf 
global_defs {
   router_id lb02
}
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 90
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

### 6.主备节点配置区别

区别
master主节点
backup备节点

router_id（唯一标识符）
lb01
lb02

state（角色状态）
MASTER
BACKUP

priority（优先级）
100
90

### 7.启动服务

```java
[root@lb02 ~]# systemctl start keepalived.service
[root@lb02 ~]# tail -f /var/log/messages
[root@lb01 ~]# systemctl start keepalived.service
[root@lb02 ~]# tail -f /var/log/messages
```

### 8.配置keepalived日志

```java
#配置keepalived
[root@lb02 ~]# vim /etc/sysconfig/keepalived
KEEPALIVED_OPTIONS="-D -d -S 0"
#配置rsyslog
[root@lb02 ~]# vim /etc/rsyslog.conf
local0.*               /var/log/keepalived.log
#重启服务
[root@lb02 ~]# systemctl restart rsyslog 
[root@lb02 ~]# systemctl restart keepalived
#查看日志
[root@lb02 ~]# tail -f /var/log/keepalived.log
```

## 八、Keepalived高可用抢占式与非抢占式

### 1.两个节点都启动

```java
#由于节点1的优先级高于节点2，所以VIP在节点1上面
[root@lb01 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
[root@lb02 ~]# ip addr | grep 10.0.0.3
```

### 2.停止主节点

```java
[root@lb01 ~]# systemctl stop keepalived
#节点2联系不上节点1，主动接管VIP
[root@lb02 ~]# ip addr | grep 10.0.0.3
	inet 10.0.0.3/32 scope global eth0
```

### 3.重新启动主节点

```java
[root@lb01 ~]# systemctl start keepalived
#由于节点1的优先级高于节点2，所以恢复节点1之后，vip又漂回节点1
[root@lb01 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
```

### 4.配置非抢占式

#### 1）节点一修改

```java
[root@lb01 ~]# vim /etc/keepalived/keepalived.conf 
... ...
vrrp_instance VI_1 {
    state BACKUP
    nopreempt
    ......
}
[root@lb01 ~]# systemctl restart keepalived
```

#### 2）节点二修改

```java
[root@lb02 ~]# vim /etc/keepalived/keepalived.conf 
... ...
vrrp_instance VI_1 {
    state BACKUP
    nopreempt
    ......
}
[root@lb02 ~]# systemctl restart keepalived
```

#### 3）配置注意事项

```java
1.两台机器节点状态都要改成 BACKUP
2.两个节点都要加上 nopreempt
3.优先级不需要改变
```

### 5.访问页面测试

```java
#配置hosts
10.0.0.3 linux.blog.com
#访问页面
http://linux.blog.com/
#节点测试
[root@lb01 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
#访问网站，并且windows查看mac地址测试
C:\Users\11764>arp -a
	VIP						VMAC
  10.0.0.3              00-0c-29-d7-bc-2c     动态
  10.0.0.4              00-0c-29-d7-bc-2c     动态
  10.0.0.5              00-0c-29-89-2f-10     动态
#关闭节点1keepalived
[root@lb01 ~]# systemctl stop keepalived.service
[root@lb02 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
#访问网站，并且windows查看mac地址测试
C:\Users\11764>arp -a
	VIP						VMAC
  10.0.0.3              00-0c-29-89-2f-10     动态
  10.0.0.4              00-0c-29-d7-bc-2c     动态
  10.0.0.5              00-0c-29-89-2f-10     动态
```

## 九、Keepalived高可用的脑裂现象

### 1.脑裂现象介绍

```java
由于某些原因，导致两台keepalived高可用服务器在指定时间内，无法检测到对方的心跳，各自取得资源及服务的所有权，而此时的两台高可用服务器又都还活着。
```

### 2.脑裂的原因

```java
1.服务器网线松动等网络故障
2.服务器硬件故障发生损坏现象而崩溃
3.主备都开启firewalld防火墙
```

### 3.故障演示

#### 1）开启防火墙

```java
[root@lb01 ~]# systemctl start firewalld
[root@lb02 ~]# systemctl start firewalld
```

#### 2）查看两个节点

```java
[root@lb01 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
[root@lb02 ~]# ip addr | grep 10.0.0.3
    inet 10.0.0.3/32 scope global eth0
```

#### 3）访问项目页面

```java
#拒绝访问，需要配置防火墙规则
[root@lb01 ~]# firewall-cmd --add-service=http
success
[root@lb01 ~]# firewall-cmd --add-service=https
success
#访问页面正常
```

### 4.解决脑裂的方法

```java
#如果发生脑裂，则随机kill掉一台即可
#在备节点上编写检测脚本, 测试如果能ping通主，并且备节点还有VIP的话则认为产生了脑裂
[root@lb02 ~]# vim /scripts/check_split_brain.sh 
#!/bin/sh
vip=10.0.0.3
lb01_ip=10.0.0.4
lb02_vip=$(ip add|grep "$vip"|wc -l)
while true;do
    ssh $lb01_ip "ip add|grep $vip" &>/dev/null
    if [ $? -eq 0 -a $lb02_vip -eq 1 ];then
        echo "ha is split brain.warning."
    else
        echo "ha is ok"
    fi
sleep 5
done
-eq		#等于
-ne		#不等于
-lt		#小于
-gt		#大于
-le		#小于等于
-ge		#大于等于
```

## 十、Keepalived高可用与Nginx

```java
Nginx默认监听在所有的IP地址上，VIP会飘到一台节点上，相当于那台nginx多了VIP这么一个网卡，所以可以访问到nginx所在机器
但是.....如果nginx宕机，会导致用户请求失败，但是keepalived没有挂掉不会进行切换，所以需要编写一个脚本检测Nginx的存活状态，如果不存活则kill掉keepalived
```

### 1.nginx故障切换脚本

```java
[root@lb01 ~]# vim check_web.sh
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
[root@lb01 ~]# chmod +x /root/check_web.sh
```

### 2.调用脚本

```java
[root@lb01 ~]# vim /etc/keepalived/keepalived.conf
global_defs {           
    router_id lb01      
}
#每5秒执行一次脚本，脚本执行内容不能超过5秒，否则会中断再次重新执行脚本
vrrp_script check_web {
    script "/root/check_web.sh"
    interval 5
}
vrrp_instance VI_1 {
    state MASTER        
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
   调用并运行脚本
	track_script {
    	check_web
	}
}
#在Master的keepalived中调用脚本，抢占式，仅需在master配置即可。（注意，如果配置为非抢占式，那么需要两台服务器都使用该脚本）
```
