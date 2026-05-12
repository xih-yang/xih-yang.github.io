# 05、Nginx 实战：Sersync实时同步实战
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/5.html
- 分类：服务器框架
- 分组：教程目录
## 1.实时同步概述

**1、** 什么是实时同步,只要当前目录发生变化则会触发一个事件，事件触发后将变化的目录同步至远程服务器；

**2、** 为什么要实时同步,保证数据的连续性,减少人力维护成本,解决nfs单点故障；

**3、** 实时同步实现原理,实时同步需要借助Inotify通知接口，用来监控目录的变化，如果监控的目录发生变更则触发动作，这个动作可以是进行一次同步操作，或其他操作；

**4、** 实时同步工具选择,有sersync(√)、inotify+rsync，通常我们会选择sersync，因为sersync是国人基于rsync+inotify-tools开发的工具，不仅保留了优点同时还强化了实时监控，文件过滤，简化配置等功能，帮助用户提高运行效率，节省时间和网络资源；

sersync项目地址https://github.com/wsgzao/sersync

## 2.实时同步实践

案例:实现web上传视频文件，实则是写入NFS至存储，当NFS存在新的数据则会实时的复制到备份服务器

角色
外网IP(NAT)
内网IP(LAN)
安装工具

web01
eth0:10.0.0.7
eth1:172.16.1.7
httpd、php

nfs-server
eth0:10.0.0.31
eth1:172.16.1.31
nfs、sersync

backup
eth0:10.0.0.41
eth1:172.16.1.41
rsync-server

## 2.1Backup服务器操作步骤如下

```java
1.安装 rsync
[root@backup ~]# yum install rsync -y
2.配置 rsync
[root@backup ~]# cat /etc/rsyncd.conf 
uid = www
gid = www
port = 873
fake super = yes
use chroot = no
max connections = 200
timeout = 600
ignore errors
read only = false
list = false
auth users = rsync_backup
secrets file = /etc/rsync.passwd
log file = /var/log/rsyncd.log
#####################################
[backup]
path = /backup
[data]
path = /data
3.建立对应密码文件
[root@backup ~]# echo "rsync_backup:123456" > /etc/rsync.passwd
4.创建对应目录并授权
[root@backup ~]# groupadd -g 666 www
[root@backup ~]# useradd -u 666 -g www www
[root@backup ~]# mkdir -p /{backup,data}
[root@backup ~]# chown -R www.www /{backup,data}
5.启动rsync
[root@backup ~]# systemctl enable rsyncd
[root@backup ~]# systemctl start rsyncd
```

## 2.2Nfs-Server操作步骤如下

```java
1.安装 sersync
# sersync需要依赖inotify和rsync工具
[root@nfs01 ~]# yum install rsync inotify-tools -y
# 安装sersync
[root@nfs01 ~]# mkdir /server/tools -p
[root@nfs01 ~]# cd /server/tools/
[root@nfs01 tools]# wget https://raw.githubusercontent.com/wsgzao/sersync/master/sersync2.5.4_64bit_binary_stable_final.tar.gz
[root@nfs01 tools]# tar xf sersync2.5.4_64bit_binary_stable_final.tar.gz
[root@nfs01 tools]# mv GNU-Linux-x86/ /usr/local/sersync
2.配置 sersync
[root@nfs01 tools]# cd /usr/local/sersync/
[root@nfs01 sersync]# cp confxml.xml confxml.bak
[root@nfs01 sersync]# vim confxml.xml
     <fileSystem xfs="true"/>  <!-- 文件系统 -->
     <filter start="false">  <!-- 排除不想同步的文件-->
         <exclude expression="(.*)\.svn"></exclude>
         <exclude expression="(.*)\.gz"></exclude>
         <exclude expression="^info/*"></exclude>
         <exclude expression="^static/*"></exclude>
     </filter>
     <inotify> <!-- 监控的事件类型 -->
         <delete start="true"/>
         <createFolder start="true"/>
         <createFile start="true"/>
         <closeWrite start="true"/>
         <moveFrom start="true"/>
         <moveTo start="true"/>
         <attrib start="false"/>
         <modify start="false"/>
     </inotify>
     <sersync>
         <localpath watch="/data"> <!-- 监控的目录 -->
             <remote ip="172.16.1.41" name="data"/>  <!-- backup的IP以及模块 -->
         </localpath>
         <rsync> <!-- rsync的选项 -->
             <commonParams params="-az"/>
             <auth start="true" users="rsync_backup" passwordfile="/etc/rsync.pass"/>
             <userDefinedPort start="false" port="874"/><!-- port=874 -->
             <timeout start="true" time="100"/><!-- timeout=100 -->
             <ssh start="false"/>
         </rsync>
             <!-- 每60分钟执行一次同步-->
         <failLog path="/tmp/rsync_fail_log.sh" timeToExecute="60"/><!--def
    ault every 60mins execute once-->
```

```java
3.启动 sersync服务守护进程
# 查看启动参数
[root@nfs01 sersync]# ./sersync2 -h
set the system param
execute：echo 50000000 > /proc/sys/fs/inotify/max_user_watches
execute：echo 327679 > /proc/sys/fs/inotify/max_queued_events
parse the command param
_______________________________________________________
参数-d:启用守护进程模式
参数-r:在监控前，将监控目录与远程主机用rsync命令推送一遍
参数-n: 指定开启守护线程的数量，默认为10个
参数-o:指定配置文件，默认使用confxml.xml文件
参数-m:单独启用其他模块，使用 -m refreshCDN 开启刷新CDN模块
参数-m:单独启用其他模块，使用 -m socket 开启socket模块
参数-m:单独启用其他模块，使用 -m http 开启http模块
不加-m参数，则默认执行同步程序
# 启动Sersync, 如果需要同步多个目录, 那么需要编写多个配置文件并启动
[root@nfs01 ~]# /usr/local/sersync/sersync2 -dro /usr/local/sersync/confxml.xml
```

## 2.3如果nfs出现故障，希望将web客户端挂载至backup服务器上, 怎么实现？

基于sersync海量文件实时同步项目案例https://www.cnblogs.com/xuliangwei/p/10245289.html

```java
#1.nfs和backup两台服务器应该保持一样（nfs配置。nfs共享的目录。nfs的权限）
[root@backup ~]# yum install nfs-utils -y
[root@backup ~]# rsync -avz root@172.16.1.31:/etc/exports /etc/
[root@backup ~]# groupadd -g 666 www
[root@backup ~]# useradd -u666 -g666 www
#2.启动nfs服务
[root@backup ~]# systemctl start rpcbind
[root@backup ~]# systemctl start nfs-server
#3.修改rsync的权限
[root@backup ~]# vim /etc/rsyncd.conf
uid = www
gid = www
#4.修改授权
[root@backup ~]# chown -R www.www /data/ /backup/
#5.重启rsync
[root@backup ~]# systemctl restart rsyncd
#6.进行一次数据推送, 然后模拟nfs故障（挂起虚拟机）
#7.web强制卸载172.16.1.31:/data       
[root@web01 ~]# umount -lf /data
#8.web尝试挂载172.16.1.41:/data 
[root@web01 ~]# mount -t nfs 172.16.1.41:/data /data/
```

## 3.案例:

实现web上传视频文件，实则是写入NFS至存储，当NFS存在新的数据则会实时的复制到备份服务器

角色
外网IP(NAT)
内网IP(LAN)
安装工具

web01
eth0:10.0.0.7
eth1:172.16.1.7
httpd、php

nfs-server
eth0:10.0.0.31
eth1:172.16.1.31
nfs、sersync

backup
eth0:10.0.0.41
eth1:172.16.1.41
rsync-server

## 3.1.web上传视频至nfs存储

### 3.1.1.nfs存储服务 172.16.1.31

```java
1.安装
	[root@nfs ~]# yum install nfs-utils -y
2.配置
	[root@nfs ~]# cat /etc/exports
	/data 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
	[root@nfs ~]# groupadd -g666 www
	[root@nfs ~]# useradd -u666 -g666 www
	[root@nfs ~]# mkdir /data
	[root@nfs ~]# chown -R www.www /data
3.启动
	[root@nfs ~]# systemctl restart nfs-server
	[root@nfs ~]# systemctl enable nfs-server
```

## 3.1.2.web服务器操作：172.16.1.7

```java
1.安装
	[root@web01 ~]# yum install httpd php -y
2.配置
	进程运行的身份（最好是和nfs的匿名用户保持一致）
    	[root@web01 html]# sed -i '/^User/c User www' /etc/httpd/conf/httpd.conf 	
    	[root@web01 html]# sed -i '/^Group/c Group www' /etc/httpd/conf/httpd.conf
	挂载
    	[root@web01 ~]# mount -t nfs 172.16.1.31:/data /var/www/html		#核心
	上传代码
        [root@web01 ~]# cd /var/www/html/
	[root@web01 html]# rz kaoshi.zip
	[root@web01 html]# unzip kaoshi.zip
3.启动
	[root@web01 ~]# systemctl start httpd
4.修改上传大小
	[root@web01 ~]# vim /etc/php.ini中设置：
	upload_max_filesize = 200M;
	post_max_size = 200M;
5.注意: 修改完配置记得重启服务
        [root@web01 ~]#  systemctl restart httpd
```

## 3.2.web和nfs的数据都备份在备份服务器的/backup

backup备份服务器操作如下：172.16.1.41

```java
1.安装
	[root@backup ~]# yum install rsync -y
2.配置
	[root@backup ~]# cat /etc/rsyncd.conf
	uid = www
	gid = www
	port = 873
	fake super = yes
	use chroot = no
	max connections = 200
	timeout = 600
	ignore errors
	read only = false
	list = true
	auth users = rsync_backup
	secrets file = /etc/rsync.passwd
	log file = /var/log/rsyncd.log
	#####################################
	[backup]
	path = /backup
	[data]
	path = /data
	创建用户
		[root@backup ~]# groupadd -g666 www
		[root@backup ~]# useradd -u666 -g666 www
	准备虚拟连接用户账号和密码
	        [root@backup ~]# cat /etc/rsync.passwd 
		rsync_backup:123456
		[root@backup ~]# chmod 600 /etc/rsync.passwd
	创建数据存放的目录
		[root@backup ~]# mkdir -p /data /backup
		[root@backup ~]# chown -R www.www /data/ /backup/
3.启动
	[root@backup ~]# systemctl restart rsyncd
4.客户端执行脚本。测试rsync的备份是否ok（客户端的数据都写入到/backup目录中）172.16.1.7 172.16.1.31
	[root@web01 ~]# sh /server/scripts/client_push_data.sh 
	sending incremental file list
	web01_172.16.1.7_2019-01-08/
	web01_172.16.1.7_2019-01-08/flag_2019-01-08
	web01_172.16.1.7_2019-01-08/other.tar.gz
	web01_172.16.1.7_2019-01-08/sys.tar.gz
```

## 3.3.如何将nfs的数据实时的同步到backup备份服务器的/data目录下

```java
监控nfs服务器上面的/data目录，如果发生变化则触发动作，动作可以是执行一次同步。
```

```java
1.安装
	[root@nfs ~]# yum install inotify-tools		监控工具
	[root@nfs ~]# rz -E sersync2.5.4_64bit_binary_stable_final.tar.gz	
	[root@nfs ~]# tar xf sersync2.5.4_64bit_binary_stable_final.tar.gz
	[root@nfs ~]# mv GNU-Linux-x86/ /usr/local/sersync
2.配置
	...............................................................
[root@nfs01 tools]# cd /usr/local/sersync/
[root@nfs01 sersync]# cp confxml.xml confxml.bak
[root@nfs01 sersync]# vim confxml.xml
     <fileSystem xfs="true"/>  <!-- 文件系统 -->
     <filter start="false">  <!-- 排除不想同步的文件-->
         <exclude expression="(.*)\.svn"></exclude>
         <exclude expression="(.*)\.gz"></exclude>
         <exclude expression="^info/*"></exclude>
         <exclude expression="^static/*"></exclude>
     </filter>
     <inotify> <!-- 监控的事件类型 -->
         <delete start="true"/>
         <createFolder start="true"/>
         <createFile start="true"/>
         <closeWrite start="true"/>
         <moveFrom start="true"/>
         <moveTo start="true"/>
         <attrib start="false"/>
         <modify start="false"/>
     </inotify>
     <sersync>
         <localpath watch="/data"> <!-- 监控的目录 -->
             <remote ip="172.16.1.41" name="data"/>  <!-- backup的IP以及模块 -->
         </localpath>
         <rsync> <!-- rsync的选项 -->
             <commonParams params="-az"/>
             <auth start="true" users="rsync_backup" passwordfile="/etc/rsync.pass"/>
             <userDefinedPort start="false" port="874"/><!-- port=874 -->
             <timeout start="true" time="100"/><!-- timeout=100 -->
             <ssh start="false"/>
         </rsync>
             <!-- 每60分钟执行一次同步-->
         <failLog path="/tmp/rsync_fail_log.sh" timeToExecute="60"/><!--def
    ault every 60mins execute once-->
	创建客户端密码文件
	[root@nfs ~]# cat /etc/rsync.pass
	123456
	[root@nfs ~]# chmod 600 /etc/rsync.pass
3.启动
	[root@nfs ~]# /usr/local/sersync/sersync2  -h
	set the system param
	execute：echo 50000000 > /proc/sys/fs/inotify/max_user_watches
	execute：echo 327679 > /proc/sys/fs/inotify/max_queued_events
	parse the command param
	_______________________________________________________
	参数-d:启用守护进程模式
	参数-r:在监控前，将监控目录与远程主机用rsync命令推送一遍
	参数-n: 指定开启守护线程的数量，默认为10个
	参数-o:指定配置文件，默认使用confxml.xml文件
	参数-m:单独启用其他模块，使用 -m refreshCDN 开启刷新CDN模块
	参数-m:单独启用其他模块，使用 -m socket 开启socket模块
	参数-m:单独启用其他模块，使用 -m http 开启http模块
	不加-m参数，则默认执行同步程序
	启动
	[root@nfs ~]#  /usr/local/sersync/sersync2 -dro /usr/local/sersync/confxml.xml
	#启动sersync后一定要提取同步的命令，手动运行一次，检查是否存在错误
	[root@nfs ~]#  cd /data && rsync -az -R --delete ./  --timeout=100 rsync_backup@172.16.1.41::data --password-file=/etc/rsync.pass
	停止
	[root@nfs data]# pkill sersync
```

## 3.4.如何平滑的迁移nfs数据到backup服务器。并且让后续的上传都是上传至backup （不能出现业务中断）

```java
1.backup服务器上需要运行和nfs服务器上一样的业务环境 
	创建用户
		[root@backup ~]# groupadd -g 666 www
		[root@backup ~]# useradd -u666 -g666 www
	配置
		[root@backup ~]# yum install nfs-utils -y
		[root@backup ~]# cat /etc/exports
		/data 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
	启动
		[root@backup ~]# systemctl restart nfs-server
2.先实现实时的同步 √
3.在web上实现切换，卸载nfs的/data目录，重新挂载backup服务的/data目录
		[root@web01 ~]# umount -lf /var/www/html/ && mount -t nfs 172.16.1.41:/data /var/www/html/
```

```java
项目需求：最近涉及到数百万张图片从本地存储迁移到云存储，为了使完成图片迁移，并保证图片无缺失，业务不中断，
        决定采用实时同步，同步完后再做流量切换。在实时同步方案中进行了几种尝试。	
实施步骤
项目总结
sersync对数百万张图片数据做到了实时同步，新增的数据能够立马同步到另一台，最后上百G的图片数据实现了在线迁移。
```

## 3.5.web备份客户端的脚本如下

### 3.5.1备份客户端的脚本如下

```java
[root@web01 ~]# cat /server/scripts/client_push_data.sh
#!/bin/bash
#1.定义变量
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
SRC=/backup
HOST=$(hostname)
ADDR=$(ifconfig eth1|awk 'NR==2 {print $2}')
DATE=$(date +%F)
DEST=${HOST}_${ADDR}_${DATE}
#2.创建目录
[ -d $SRC/$DEST ] || mkdir -p $SRC/$DEST
#3.备份文件
cd / && \
[ -f $SRC/$DEST/sys.tar.gz ] || tar czf $SRC/$DEST/sys.tar.gz etc/fstab etc/passwd && \
[ -f $SRC/$DEST/other.tar.gz ] || tar czf $SRC/$DEST/other.tar.gz var/spool/cron/ server/scripts && \
#4.使用md5打标记
[ -f $SRC/$DEST/flag_$DATE ] || md5sum $SRC/$DEST/*.tar.gz  > $SRC/$DEST/flag_$DATE 
#4.本地推送到备份服务器
export RSYNC_PASSWORD=123456
rsync -avz $SRC/$DEST rsync_backup@172.16.1.41::backup
#5.保留本地最近7天的数据
find $SRC/ -type d -mtime +7|xargs rm -rf 
```

### 3.5.2服务端备份脚本

```java
[root@backup ~]# vim /server/scripts/check_backup.sh
#!/usr/bin/bash
#1.定义全局的变量
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
#2.定义局部变量
Path=/backup
Date=$(date +%F)
#3.查看flag文件,并对该文件进行校验, 然后将校验的结果保存至result_时间
find $Path/ -type f -name "flag_$Date"|xargs md5sum -c >$Path/result_${Date}
#4.将校验的结果发送邮件给管理员
mail -s "Rsync Backup $Date" 123@qq.com <$Path/result_${Date}
#5.删除超过7天的校验结果文件, 删除超过180天的备份数据文件
find $Path/ -type f -name "result*" -mtime +7|xargs rm -f
find $Path/ -type d -mtime +180|xargs rm -rf
```
