# 04、Nginx 实战：nfs(存储服务器)
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/4.html
- 分类：服务器框架
- 分组：教程目录
## 1.NFS基本概述

NFS是Network File System的缩写及网络文件系统。NFS的主要功能是通过局域网络让不同的主机系统之间可以共享文件或目录。

通常中小企业首选NFS作为集群架构的存储，但如果是大型网站, 会用到复杂的分布式文件系统，如FastDFS,glusterfs等等

**那么我们为什么要使用数据存储共享服务?**

**1、** 实现多台服务器之间数据共享；

**2、** 实现多台服务器之间数据一致；

## 2.NFS应用场景

下面我将通过图解给大家展示集群需要共享存储服务的理由。

**1、** A用户上传图片经过负载均衡，负载均衡将上传请求调度至WEB1服务器上；

**2、** B用户访问A用户上传的图片，此时B用户被负载均衡调度至WEB2上，因为WEB2上没有这张图片，所以B用户无法看到A用户传的图片；

如果有共享存储的情况

**1、** A用户上传图片无论被负载均衡调度至WEB1还是WEB2,最终数据都被写入至共享存储；

**2、** B用户访问A用户上传图片时，无论调度至WEB1还是WEB2，最终都会上共享存储访问对应的文件，这样就可以访问到资源了；

## 3.NFS实现原理

**本地文件操作方式**

```java
1.当用户执行mkdir命令, 该命令会调用shell解释器翻译给内核。
2.内核解析完成后会驱动对应的硬件设备，完成相应的操作。
```

**NFS实现原理(需要先了解[程序|进程|线程])**

1、用户进程访问NFS客户端，使用不同的函数对数据进行处理

2、NFS客户端通过TCP/IP的方式传递给NFS服务端。

3、NFS服务端接收到请求后，会先调用portmap进程进行端口映射。

4、nfsd进程用于判断NFS客户端是否拥有权限连接NFS服务端。

5、Rpc.mount进程判断客户端是否有对应的权限进行验证。

6、idmap进程实现用户映射和压缩

7、最后NFS服务端会将对应请求的函数转换为本地能识别的命令，传递至内核，由内核驱动硬件。

注意: rpc是一个远程过程调用，那么使用nfs必须有rpc服务

## 4.NFS服务安装(服务端)

## 4.0环境准备

服务器系统
角色
外网IP
内网IP

CentOS 7.5
NFS服务端(nfs)
eth0:10.0.0.31
eth1:172.16.1.31

CentOS 7.5
NFS客户端(backup)
eth0:10.0.0.41
eth1:172.16.1.41

注意:不要忘记关闭防火墙, 以免默认的防火墙策略禁止正常的NFS共享服务

## 4.1.关闭防火墙

```java
#1.关闭Firewalld防火墙
[root@nfs ~]# systemctl disable firewalld
[root@nfs ~]# systemctl stop firewalld
#2.关闭selinux防火墙
[root@nfs ~]# sed -ri '#^SELINUX=#cSELINUX=Disabled' /etc/selinux/config
[root@nfs ~]# setenforce 0
```

## 4.2.安装nfs-server服务

```java
[root@nfs ~]# yum -y install nfs-utils
```

## 4.3.配置nfs服务

nfs服务程序的配置文件为/etc/exports，需要严格按照共享目录的路径 允许访问的NFS客户端（共享权限参数）格式书写，定义要共享的目录与相应的权限，具体书写方式如下图所示。

## 4.4.配置场景，将nfs服务端的/data目录共享给172.16.1.0/24网段内的所有主机

**1、** 所有客户端主机都拥有读写权限；

**2、** 在将数据写入到NFS服务器的硬盘中后才会结束操作，最大限度保证数据不丢失；

**3、** 将所有用户映射为本地的匿名用户(nfsnobody)；

```java
#NFS客户端地址与权限之间没有空格
[root@nfs ~]# vim /etc/exports   
/data   172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
#在nfs服务器创建用户
groupadd -g666 www
useradd www -u666 -g www
#在NFS服务器上建立用于NFS文件共享的目录，并设置对应权限
[root@nfs ~]# mkdir /data
[root@nfs ~]# chown -R www.www /data
#NFS共享目录会记录至/var/lib/nfs/etab,如果该目录不存在共享信息,请检查/etc/exports是否配置错误
```

4)在使用NFS服务进行文件共享之前，需要使用RPC（Remote Procedure Call远程过程调用服务将NFS服务器的IP地址和端口号信息发送给客户端。因此，在启动NFS服务之前，需要先重启并启用rpcbind服务程序,同时都加入开机自启动

```java
#加入开机自启
[root@nfs ~]# systemctl enable rpcbind nfs-server
#启动服务
[root@nfs ~]# systemctl restart rpcbind nfs-server
```

## 5.NFS挂载卸载

(web/backup)NFS客户端的配置步骤也十分简单。先使用showmount命令,查询NFS服务器的远程共享信息，其输出格式为“共享的目录名称 允许使用客户端地址”。

```java
1.安装客户端工具,仅启动rpcbind服务
[root@nfs-client ~]# yum -y install nfs-utils rpcbind
[root@nfs-client ~]# systemctl restart rpcbind
2.客户端使用showmount -e查看远程服务器rpc提供的可挂载nfs信息
[root@nfs-client ~]# showmount -e 172.16.1.31
Export list for 172.16.1.31:
/data 172.16.1.0/24
3.在NFS客户端创建一个挂载目录, 使用mount命令并结合-t参数, 指定要挂载的文件系统的类型, 并在命令后面写上服务器的IP地址, 以及服务器上的共享目录, 最后需要写上要挂载到本地系统(客户端)的目录。
[root@nfs-client ~]# mkdir /nfsdir
[root@nfs-client ~]# mount -t nfs 172.16.1.31:/data /nfsdir 
#查看挂载信息(mount也可以查看)
[root@nfs-client ~]# df –h
Filesystem           Size  Used Avail Use% Mounted on
/dev/sda3             62G  845M   58G   2% /
tmpfs                244M     0  244M   0% /dev/shm
/dev/sda1            190M   26M  155M  14% /boot
172.16.1.31:/data   62G  880M   58G   2% /nfsdir
4.挂载成功后可以进行增删改操作
#使用客户端往nfs存储写入
[root@nfs-client ~]# echo "nfs-client" >> /nfsdir/test.txt 
#检查nfs服务端是否存在客户端创建的新文件
[root@nfs-client ~]# cat /data/test.txt
nfs-client
5.如果希望NFS文件共享服务能一直有效，则需要将其写入到fstab文件中
[root@nfs-client ~]# vim /etc/fstab
172.16.1.31:/data /nfsdir nfs defaults 0 0
6.如果不希望使用NFS共享, 可进行卸载
[root@nfs-client ~]# umount /nfsdir 
#注意:卸载的时候如果提示”umount.nfs: /nfsdir: device is busy”  
#1.切换至其他目录, 然后在进行卸载。
#2.NFS Server宕机, 强制卸载umount -lf /nfsdir
7.在企业工作场景，通常情况NFS服务器共享的只是普通静态数据（图片、附件、视频），不需要执行suid、exec等权限，挂载的这个文件系统只能作为数据存取之用，无法执行程序，对于客户端来讲增加了安全性。例如: 很多木马篡改站点文件都是由上传入口上传的程序到存储目录。然后执行的。
#通过mount -o指定挂载参数，禁止使用suid，exec，增加安全性能
[root@nfs-client ~]# mount -t nfs -o nosuid,noexec,nodev 172.16.1.31:/data /mnt
8.有时也需要考虑性能相关参数[可选]
#通过mount -o指定挂载参数，禁止更新目录及文件时间戳挂载
[root@nfs-client ~]# mount -t nfs -o noatime,nodiratime 172.16.1.31:/data /mnt
```

## 6.NFS配置详解

执行man exports命令，然后切换到文件结尾，可以快速查看如下样例格式：

nfs共享参数
参数作用

rw*
读写权限

sync*
同时将数据写入到内存与硬盘中，保证不丢失数据

all_squash
无论NFS客户端使用什么账户访问，均映射为NFS服务器的匿名用户(常用)

anonuid*
配置all_squash使用,指定NFS的用户UID,必须存在系统

anongid*
配置all_squash使用,指定NFS的用户UID,必须存在系统

ro
只读权限

root_squash
当NFS客户端以root管理员访问时，映射为NFS服务器的匿名用户(不常用)

no_root_squash
当NFS客户端以root管理员访问时，映射为NFS服务器的root管理员(不常用)

no_all_squash
无论NFS客户端使用什么账户访问，都不进行压缩

async
优先将数据保存到内存，然后再写入硬盘；这样效率更高，但可能会丢失数据

## 6.1.验证ro权限实践

```java
1) 服务端修改rw为ro参数
[root@nfs ~]# cat /etc/exports
/data 172.16.1.0/24(ro,sync,all_squash)
[root@nfs ~]# systemctl restart nfs-server
2) 客户端验证
[root@nfs-client ~]# mount -t nfs 172.16.1.31:/data /mnt
[root@nfs-client ~]# df -h
Filesystem         Size  Used Avail Use% Mounted on
172.16.1.31:/data   98G  1.7G   97G   2% /mnt
# 发现无法正常写入文件
[root@backup mnt]# touch file
touch: cannot touch ‘file’: Read-only file system
```

## 6.2.验证all_squash、anonuid、anongid权限

```java
1) NFS服务端配置
[root@nfs ~]# cat /etc/exports
/data 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
2) 服务端需要创建对应的用户
[root@nfs ~]# groupadd -g 666 www
[root@nfs ~]# useradd -u 666 -g 666 www
[root@nfs ~]# id www
uid=666(www) gid=666(www) groups=666(www)
3) 重载nfs-server
[root@nfs ~]# systemctl restart nfs-server
[root@nfs ~]# cat /var/lib/nfs/etab 
/data   172.16.1.0/24(rw,sync,wdelay,hide,nocrossmnt,secure,root_squash,all_squash,no_subtree_check,secure_locks,acl,no_pnfs,anonuid=666,anongid=666,sec=sys,secure,root_squash,all_squash)
4) 授权共享目录为www
[root@nfs ~]# chown -R www.www /data/
[root@nfs ~]# ll -d /data/
drwxr-xr-x 3 www www 53 Sep  3 02:08 /data/
5) 客户端验证
[root@backup ~]# umount /mnt/
[root@backup ~]# mount -t nfs 172.16.1.31:/data /mnt
6) 客户端查看到的文件，身份是666
[root@backup ~]# ll /mnt/
drwxr-xr-x 2 666 666 6 Sep  3 02:08 rsync_dir
-rw-r--r-- 1 666 666 0 Sep  3 02:08 rsync_file
7) 客户端依旧能往/mnt目录下写文件
[root@backup mnt]# touch fff
[root@backup mnt]# mkdir 111
[root@backup mnt]# ll
drwxr-xr-x 2 666 666 6 Sep  3 03:05 111
-rw-r--r-- 1 666 666 0 Sep  3 03:05 fff
8) 建议：将客户端也创建一个uid为666，gid为666，统一身份，避免后续出现权限不足的情况
[root@backup mnt]# groupadd -g 666 www
[root@backup mnt]# useradd -g 666 -u 666 www
[root@backup mnt]# id www
uid=666(www) gid=666(www) groups=666(www)
9) 最后检查文件的身份
[root@backup mnt]# ll /mnt/
total 4
drwxr-xr-x 2 www www 6 Sep  3 03:05 111
-rw-r--r-- 1 www www 0 Sep  3 03:05 fff
```

## 7.NFS存储小结

## 7.1.NFS存储优点

```java
1.NFS文件系统简单易用、方便部署、数据可靠、服务稳定、满足中小企业需求。
2.NFS文件系统内存放的数据都在文件系统之上，所有数据都是能看得见。
```

## 7.2.NFS存储局限

```java
1.存在单点故障, 如果构建高可用维护麻烦web->nfs()->backup
2.NFS数据明文, 并不对数据做任何校验。
3.客户端挂载NFS服务没有密码验证, 安全性一般(内网使用)
```

## 7.3.NFS应用建议

```java
1.生产场景应将静态数据尽可能往前端推, 减少后端存储压力
2.必须将存储里的静态资源通过CDN缓存jpg\png\mp4\avi\css\js
3.如果没有缓存或架构本身历史遗留问题太大, 在多存储也无用
```

## 8.NFS案例实践

准备3台虚拟机服务器，并且请按照要求搭建配置NFS服务。

NFS服务端（A）

NFS客户端（B）

NFS客户端（C）

**1、** 在NFS服务端(A)上共享/data/w(可写)及/data/r(只读)；

**2、** 在NFS客户端(B/C)上进行挂载；

环境准备

服务器系统
角色
IP

CentOS 7.6
NfsServer(nfs)
172.16.1.31

CentOS 7.6
NfsClient(backup)
172.16.1.41

CentOS 7.6
NfsClient(web01)
172.16.1.7

## 8.1.NFS服务端配置

```java
#1.安装nfs
[root@nfs01 ~]# yum install -y nfs-utils
#2.配置nfs
[root@nfs01 ~]# cat /etc/exports
/data/r 172.16.1.0/24(ro,sync,all_squash,anonuid=666,anongid=666)
/data/w 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
#3.创建对应用户
[root@web01 ~]# groupadd -g 666 www
[root@web01 ~]# useradd -u 666 -g www www
[root@nfs01 ~]# id www
uid=666(www) gid=666(www) groups=666(www)
#4.创建共享目录
[root@nfs01 ~]# mkdir /data/{r,w} -p
[root@nfs01 ~]# chown -R www.www /data/
//5.重启NFS
[root@nfs01 ~]# systemctl restart rpcbind nfs-server
```

## 8.2.NFS-客户端配置

```java
#1.安装nfs工具
[root@backup-41 ~]# yum install nfs-utils -y
[root@backup-41 ~]# systemctl restart rpcbind
#2.准备本地挂载点目录
[root@backup-41 ~]# mkdir /data/{r,w} -p
#3.准备对应用户
[root@backup-41 ~]# groupadd -g 666 www
[root@backup-41 ~]# useradd -u 666 -g www www
[root@backup-41 ~]# id www
uid=666(www) gid=666(www) groups=666(www)
#4.查看远端共享的nfs目录
[root@backup-41 ~]# showmount -e 172.16.1.31
Export list for 172.16.1.31:
/data/w 172.16.1.0/24
/data/r 172.16.1.0/24
#5.挂载对应目录站点
[root@backup-41 ~]# mount -t nfs  172.16.1.31:/data/w /data/w/
[root@backup-41 ~]# mount -t nfs 172.16.1.31:/data/r /data/r/
[root@backup-41 ~]# df -h
Filesystem               Size  Used Avail Use% Mounted on
172.16.1.31:/data/w       50G  1.6G   49G   4% /data/w
172.16.1.31:/data/r       50G  1.6G   49G   4% /data/r
#6.测试/data/r读权限
[www@backup-41 r]$ pwd
/data/r
[www@backup-41 r]$ cat edu.com
This is Nfs to Oldboy
[www@backup-41 r]$ touch edu
touch: cannot touch ‘edu’: Read-only file system
#7.测试/data/w写权限
[root@backup-41 r]# cd /data/w/
[root@backup-41 w]# pwd
/data/w
[root@backup-41 w]# touch bbbback
[root@backup-41 w]# ll
total 0
-rw-r--r-- 1 www www 0 Jul 26 09:22 backup_w
-rw-r--r-- 1 www www 0 Jul 26 09:26 bbbback
#8.实现开机自动挂载
[root@backup-41 ~]# echo "172.16.1.31:/data/r /data/r nfs defaults 0 0" >>/etc/fstab
[root@backup-41 ~]# echo "172.16.1.31:/data/w /data/w nfs defaults 0 0" >>/etc/fstab
#注意: 当将远程挂载设备写入/etc/fstab文件后，一定要执行mount -a
[root@backup-41 ~]# mount -a
[root@backup-41 ~]# df -h
Filesystem               Size  Used Avail Use% Mounted on
172.16.1.31:/data/r       50G  1.6G   49G   4% /data/r
172.16.1.31:/data/w       50G  1.6G   49G   4% /data/w
#如果编写错误会有如下提示
[root@backup-41 ~]# mount -a
mount.nfs: access denied by server while mounting 172.16.1.31:/dataa/w
#9.卸载nfs
   1.正常卸载
[root@backup-41 ~]# umount /data/w/
   2.强制卸载
[root@backup-41 ~]# umount -lf /data/w/
```

## 8.3.NFS扩展项

```java
#1.扩展:无需重启NFS服务平滑加载配置文件
[root@nfs01 r]# cat /etc/exports
/data/r 172.16.1.0/24(ro)
/data/p 172.16.1.0/24(ro)
/data/w 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
[root@nfs01 r]# exportfs -rv
exporting 172.16.1.0/24:/data/w
exporting 172.16.1.0/24:/data/p
exporting 172.16.1.0/24:/data/r
#2.扩展:nfs客户端挂载参数
[root@backup-41 ~]# mount.nfs4 -o noatime,nodiratime,noexec,nodev,nosuid 172.16.1.31:/data/r /data/r/
#3.扩展:nfs客户端永久挂载参数
[root@backup-41 ~]# tail -2 /etc/fstab
172.16.1.31:/data/r /data/r nfs defaults,noatime,nodiratime,noexec,nodev,nosuid 0 0
172.16.1.31:/data/w /data/w nfs defaults,noatime,nodiratime,noexec,nodev,nosuid 0 0
#4.扩展:客户端检查挂载参数是否生效
[root@backup-41 ~]# mount
#等价于
[root@backup-41 ~]# cat /proc/mounts 
```
