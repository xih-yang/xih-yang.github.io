# 03、Nginx 实战：Rsync备份服务实战
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/3.html
- 分类：服务器框架
- 分组：教程目录
## 1.Rsync基本概述

rsync是一款开源的备份工具，可以在不同主机之间进行同步，可实现全量备份与增量备份，因此非常适合用于架构集中式备份或异地备份等应用。

rsync官方地址：传送门http://rsync.samba.org/

rsync监听端口：873

rsync运行模式：C/S

**既然需要备份，那么我们应该了解备份的方式**

完全备份

增量备份

假设客户端上有file1 file2 file3文件，服务端上有file1文件，现要将客户端上的数据备份至服务端

完全备份，将客户端所有的数据内容file1 file2 file3全部备份至服务端 (效率低下, 占用空间)

增量备份，将客户端的file2 file3增量备份至服务端 (提高备份效率,节省空间, 适合异地备份 )

## 2.Rsync应用场景

前面我们了解过备份的方式，下面我们需要了解Rync的数据同步模式

**1、** 推:所有主机推送本地数据至Rsync备份服务器，会导致数据同步缓慢(适合少量数据备份)；

**2、** 拉:rsync备份服务端拉取所有主机上的数据，会导致备份服务器开销大；

**3、** 大量服务器备份场景；

**4、** 异地备份实现思路；

## 3.Rsync传输模式

Rsync使用三种主要的数据传输方式

本地方式

远程方式

守护进程

## 3.1.本地传输方式: 单个主机本地之间的数据传输(此时类似于cp命令)

本地拷贝数据命令

```java
Local:  rsync [OPTION...] SRC... [DEST]
#本地拷贝数据示例
[root@backup ~]# rsync  -avz  /etc/passwd  /tmp/
rsync      备份命令(cp)
[options]  选项
SRC...     本地源文件
[DEST]     本地目标文件
```

## 3.2.远程通道传输方式: 通过ssh通道传输数据,类似scp命令

```java
#pull拉取数据命令
Pull: rsync [OPTION...] [USER@]HOST:SRC... [DEST]
#pull拉取数据示例
[root@backup ~]# rsync -avz root@172.16.1.41:/etc/hostname ./  拉取远程文件
[root@backup ~]# rsync -avz root@172.16.1.41:/root/ /backup/  拉取远程目录下的所有文件
[root@backup ~]# rsync -avz root@172.16.1.41:/root /backup/   拉取远程目录以及目录下的所有文件
Pull       拉取, 下载
rsync      备份命令
[options]  选项
[USER@]    目标主机的系统用户
HOST       目主机IP地址或域名
SRC...     目标主机源文件
[DEST]     下载至本地哪个位置
#push推送数据命令
Push: rsync [OPTION...] SRC... [USER@]HOST:DEST
#push推送数据示例
rsync -avz /backup/2018-10-01 root@172.16.1.41:/tmp/
Push       推送, 上传
rsync      备份命令
[options]  选项
SRC...     本地源文件
[USER@]    目标主机的系统用户
HOST       目主机IP地址或域名
[DEST]     目标对应位置
Rsync借助SSH协议同步数据存在的缺陷
1.使用系统用户（不安全）
2.使用普通用户（会导致权限不足情况）
```

## 3.3.守护进程传输方式: rsync自身非常重要的功能(不使用系统用户，更加安全)

```java
#pull拉取数据命令
Pull: rsync [OPTION...] [USER@]HOST::SRC... [DEST]
#1.拉取rsync备份服务的"backup模块"数据至本地/mnt目录
[root@nfs01 ~]# rsync -avz rsync_backup@192.172.16.1.41::backup/ /mnt/ --password-file=/etc/rsync.password
rsync          命令
[OPTION...]    选项
[USER@]        远程主机用户(虚拟用户)
HOST::         远程主机地址  
SRC...         远程主机模块(不是目录)
[DEST]         将远程主机数据备份至本地什么位置     
#push推送数据命令
Push: rsync [OPTION...] SRC... [USER@]HOST::DEST
#2.将本地/mnt目录推送至rsync备份服务器的backup模块
[root@nfs01 ~]# rsync -avz /mnt/ rsync_backup@192.172.16.1.41::backup/ --password-file=/etc/rsync.password
rsync          命令
[OPTION...]    选项
SRC...         远程主机模块(不是目录)
[USER@]        远程主机用户(虚拟用户)
HOST::         远程主机地址
[DEST]         将远程主机模块备份至本地什么位置
```

## 3.4.Rsync命令对应选项

```java
-a          归档模式传输, 等于-tropgDl
-v          详细模式输出, 打印速率, 文件数量等
-z          传输时进行压缩以提高效率
-r          递归传输目录及子目录，即目录下得所有目录都同样传输。
-t          保持文件时间信息
-o          保持文件属主信息
-p          保持文件权限
-g          保持文件属组信息
-l          保留软连接
-P          显示同步的过程及传输时的进度等信息
-D          保持设备文件信息
-L          保留软连接指向的目标文件
-e          使用的信道协议,指定替代rsh的shell程序
--exclude=PATTERN  指定排除不需要传输的文件模式
--exclude-from=file文件名在file文件中的
--bwlimit=100      限速传输
--partial          断点续传
--delete           让目标目录和源目录数据保持一致
```

=============================================

## 4.Rsync服务实践

主机角色
主机名称
外网IP(NAT)
内网IP(LAN)

Rsync服务端
backup
10.0.0.41
172.16.1.41

Rsync客户端
nfs
10.0.0.31
172.16.1.31

```java
1.安装rsync
[root@backup ~]# yum -y install rsync
2.配置/etc/rsyncd.conf
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
comment = welcome to oldboyedu backup!
path = /backup
--- 配置详解
[root@backup ~]# vim /etc/rsyncd.conf
uid = www                      运行进程的用户
gid = www                      运行进程的用户组
port = 873                       监听端口
fake super = yes                 无需让rsync以root身份运行，允许接收文件的完整属性
use chroot = no                  禁锢推送的数据至某个目录, 不允许跳出该目录
max connections = 200            最大连接数
timeout = 600                    超时时间
ignore errors                    忽略错误信息
read only = false                对备份数据可读写
list = false                     不允许查看模块信息
auth users = rsync_backup        定义虚拟用户，作为连接认证用户
secrets file = /etc/rsync.passwd 定义rsync服务用户连接认证密码文件路径
[backup]                定义模块信息
comment = commit        模块注释信息
path = /backup          定义接收备份数据目录
3.创建用户(运行www服务的用户身份)
#1) 创建www账户
[root@backup ~]# groupadd -g666 www
[root@backup ~]# useradd -u666 -g666 www
#2) 创建备份目录(尽可能磁盘空间足够大),授权www用户为属主
[root@backup ~]# mkdir /backup
[root@backup ~]# chown -R www.www /backup/
4.创建虚拟用户密码文件, 授权600安全权限(用于客户端连接时使用的用户)
[root@backup ~]# echo "rsync_backup:xly" >/etc/rsync.passwd
[root@backup ~]# chmod 600 /etc/rsync.passwd
使用rsync需要使用参数--password-file=/etc/rsync.passwd
5.启动rsync服务，并将rsync加入开机自启动
[root@backup ~]# systemctl start rsyncd
[root@backup ~]# systemctl enable rsyncd
6.检查rsync 873端口是否已处于监听状态
[root@backup ~]# netstat -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:873             0.0.0.0:*               LISTEN      4758/rsync 
7.Rsync客户端仅需配置虚拟用户的密码,并授权为600安全权限
# 方式一：适合终端执行指定用户密码文件
[root@nfs01 ~]# yum install rsync -y
[root@nfs01 ~]# echo "xly" > /etc/rsync.pass
[root@nfs01 ~]# chmod 600 /etc/rsync.pass
# 方式二：脚本中使用，强烈推荐方式
[root@nfs01 ~]# export RSYNC_PASSWORD=xly
```

## 实战：

实战一: 客户端推送backup目录下所有内容至Rsync服务端

```java
[root@nfs01 ~]# export RSYNC_PASSWORD=bgx
[root@nfs01 ~]# rsync -avz /backup/ rsync_backup@172.16.1.41::backup/
```

实战二: 客户端拉取Rsync服务端 backup模块数据至本地客户端的 /backup目录

```java
[root@nfs01 ~]# export RSYNC_PASSWORD=bgx
[root@nfs01 ~]#rsync -avz rsync_backup@172.16.1.41::backup /backup/
```

实战三: Rsync实现数据无差异同步

```java
#拉取远端数据：远端与本地保持一致,远端没有本地有会被删除, 造成客户端数据丢失
[root@nfs01 ~]# export RSYNC_PASSWORD=bgx
[root@nfs01 ~]# rsync -avz --delete rsync_backup@172.16.1.41::backup/ /data/
#推送数据至远端：本地与远端保持一致, 本地没有远端会被删除, 造成服务器端数据丢失
[root@nfs01 ~]# export RSYNC_PASSWORD=bgx
[root@nfs01 ~]# rsync -avz --delete /data/ rsync_backup@172.16.1.41::backup/
```

实战四: Rsync的Limit限速

```java
#企业案例: 某DBA使用rsync拉取备份数据时，由于文件过大导致内部交换机带宽被沾满，导致用户的请求无法响应
[root@nfs01 ~]# export RSYNC_PASSWORD=bgx
[root@nfs01 ~]# rsync -avz --bwlimit=1 rsync_backup@172.16.1.41::backup/ /data/
```

=============================================

## 5.Rsync备份案例

已知3台服务器主机名分别为web01、backup 、nfs主机信息见下表:

主机角色
主机名称
外网IP(NAT)
内网IP(LAN)

Rsync服务端
backup
10.0.0.41
172.16.1.41

Rsync客户端
nfs
10.0.0.31
172.16.1.31

WEB客户端
web01
10.0.0.7
1:172.16.1.7

需求：

```java
客户端需求
1.客户端提前准备存放的备份的目录，目录规则如下:/backup/nfs_172.16.1.31_2018-09-02
2.客户端在本地打包备份(系统配置文件、应用配置等)拷贝至/backup/nfs_172.16.1.31_2018-09-02
3.客户端最后将备份的数据进行推送至备份服务器
4.客户端每天凌晨1点定时执行该脚本
5.客户端服务器本地保留最近7天的数据, 避免浪费磁盘空间
服务端需求
1.服务端部署rsync，用于接收客户端推送过来的备份数据
2.服务端需要每天校验客户端推送过来的数据是否完整
3.服务端需要每天校验的结果通知给管理员
4.服务端仅保留6个月的备份数据,其余的全部删除
注意：所有服务器的备份目录必须都为/backup
```

建议备份的数据内容如下

```java
#1.开机自启动配置文件  设备挂载配置文件  本地内网配置文件    (系统配置文件)
/etc/rc.local       /etc/fstab      /etc/hosts              
#2.cron定时任务        firewalld防火墙       脚本目录      (重要目录)
/var/spool/cron/    /etc/firewalld     /server/scripts
#3.系统日志文件
/var/log/   //系统安全日志、sudo日志、内核日志、rsyslog日志
#4.应用程序服务配置文件 nginx、PHP、mysql、redis.....
```

客户端备份:

```java
1.nfs客户端备份实现思路,脚本每天凌晨01点定时执行一次（打包->标记->推送->保留最近7天的文件）
[root@nfs scripts]# cat /server/scripts/client_rsync_backup.sh 
#!/usr/bin/bash
#1.定义变量
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
Host=$(hostname)
Addr=$(ifconfig eth1|awk 'NR==2{print $2}')
Date=$(date +%F)
Dest=${Host}_${Addr}_${Date}
Path=/backup
#2.创建备份目录
[ -d $Path/$Dest ] || mkdir -p $Path/$Dest
#3.备份对应的文件
cd / && \
[ -f $Path/$Dest/system.tar.gz ] || tar czf $Path/$Dest/system.tar.gz etc/fstab etc/rsyncd.conf && \
[ -f $Path/$Dest/log.tar.gz ] || tar czf $Path/$Dest/log.tar.gz  var/log/messages var/log/secure && \
#4.携带md5验证信息
[ -f $Path/$Dest/flag_$Date ] || md5sum $Path/$Dest/*.tar.gz >$Path/$Dest/flag_$Date
#5.推送本地数据至备份服务器
export RSYNC_PASSWORD=bgx
rsync -avz $Path/ rsync_backup@172.16.1.41::backup
#6.本地保留最近7天的数据
find $Path/ -type d -mtime +7|xargs rm -rf
```

**2、** 客户端编写定时任务,让备份每天凌晨1点执行；

```java
[root@nfs01 ~]# crontab -l
00 01 * * * /bin/bash /server/scripts/backup_rsync.sh &>/dev/null
```

**3、** backup服务端校验客户端推送数据的完整性,(校验->存储校验结果->将保存的结果通过邮件发送给管理员->保留最近180天的数据)；

```java
#1.服务端配置邮件功能
[root@backup /]# yum install mailx -y
[root@backup /]# vim /etc/mail.rc
set from=552408925@qq.com
set smtp=smtps://smtp.qq.com:465
set smtp-auth-user=552408925@qq.com
set smtp-auth-password=#客户端授权码
set smtp-auth=login
set ssl-verify=ignore
set nss-config-dir=/etc/pki/nssdb/
#2.服务端校验、以及邮件通知脚本
[root@backup ~]# mkdir /server/scripts -p
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
4.服务端编写定时任务脚本
[root@backup backup]# crontab -l
00 05 * * * /bin/bash /server/scripts/check_backup.sh &>/dev/null
5.如何扩展多台服务器的备份？
[root@nfs ~]# rsync -avz /server 172.16.1.7:/
```

**6、** 全网备份图解流程；
