# 27、Linux 实战 - 磁盘配额
- 来源：https://ddkk.com/zhuanlan/server/linux/5/27.html
- 分类：服务器框架
- 分组：教程目录
## 磁盘配额以及准备

### 磁盘配额作用

对用户使用磁盘空间以及存放文件个数的限制。

### 磁盘配额条件

- 内核必须支持磁盘配额

```java
[root@ddkk.com ~]# grep CONFIG_QUOTA /boot/config-4.18.0-338.el8.x86_64
CONFIG_QUOTA=y                                      
CONFIG_QUOTA_NETLINK_INTERFACE=y
# CONFIG_QUOTA_DEBUG is not set
CONFIG_QUOTA_TREE=y
CONFIG_QUOTACTL=y
CONFIG_QUOTACTL_COMPAT=y
```

- 系统中必须安装了quota工具，查看命令如下：

```java
[root@ddkk.com ~]# rpm -qa | grep quota
quota-nls-4.04-14.el8.noarch
quota-4.04-14.el8.x86_64
```

### 概念

- 用户配额和组配额，组配额不是平均分配，一般不会使用。
- 磁盘容量限制和文件个数限制，有文件个数限制是因为i节点是有限的。
- 软限制和硬限制，软限制是提醒限制，硬限制是实际限制。到了软限制不会禁止存储，但会提醒，到了硬限制就不能再存放文件了。
- 宽限时间，到达软限制之后，是有时间限制的，这个时间就是宽限时间，若这个时间内使用容量一直在软限制之上，就会将软限制变成硬限制，降低使用容量。宽限时间默认是7天。

## 磁盘配额实验

### 规划

- 首先需要准备一个分区，因为磁盘配额是针对分区使用的，不要拿重要分区做实验，在这里我重新创建了一个分区/dev/sdb2。
- 建立用户u1、u2、u3。

### 磁盘配额

**1、****开启分区上的磁盘配额功能**；

```java
[root@ddkk.com ~]# mount -o remount,usrquota,grpquota /mnt/sdb2
```

使用命令修改只是暂时生效，若要永久生效，则要修改/etc/fstab文件，改为：

```java
/dev/sdb2                                 /mnt/sdb2               ext4    defaults,usrquota,grpquota           0 0 
```

**1、****关闭selinux**；

暂时关闭：

```java
[root@ddkk.com ~]# getenforce  查询selinux当前状态
Enforcing
[root@ddkk.com ~]# setenforce 0 暂时关闭selinux
[root@ddkk.com ~]# getenforce
Permissive
```

长久关闭：

长久关闭需要修改/etc/selinux/config文件

```java
[root@ddkk.com ~]# vim /etc/selinux/config
......
SELINUX=permissive
......
```

**1、****生成磁盘配置文件**；

命令格式：

```java
[root@ddkk.com ~]# quotacheck  选项 分区名
```

常用选项：

选项
含义

-a
扫描/etc/mtab文件中的所有启用磁盘配额功能的分区，如果加入此参数，后面就不用再加分区名了。

-c
不管原有的配置文件，重新扫描并建立新的配置文件。

-u
建立用户配额的配置文件，也就是生成aquota.user文件。

-g
建立组配额的配置文件，也就是生成aquota.group文件。

-v
显示扫描过程。

-m
强制以读写的方式扫描文件系统，和-M类似，一般在扫描根分区时使用。

-f
强制扫描文件系统，并写入新的配置文件，一般扫描新添加的硬盘分区时使用。

例：

```java
[root@ddkk.com ~]# quotacheck -uv /mnt/sdb2
[root@ddkk.com ~]# ls /mnt/sdb2
aquota.user  lost+found
```

**1、****设置用户和组的配额限制**；

```java
[root@ddkk.com ~]# edquota 选项 用户名或组名
```

常用选项：

选项
作用

-u
磁盘用户配置

-g
磁盘组配置

-t
设定宽限时间

-p
复制配额限制

进入后是按vi的操作进行的，soft是软限制，hard是硬限制，blocks是当前占用的空间，不能修改。

```java
Disk quotas for user u1 (uid 1000):
  Filesystem                   blocks       soft       hard     inodes     soft     hard
  /dev/sdb2                         0          0          0          0        0        0
```

修改后：

```java
Filesystem                   blocks       soft       hard     inodes     soft     hard
  /dev/sdb2                         0       4000       5000          0        8       10
```

**1、****启动和关闭配额**；

- 启动配额

```java
[root@ddkk.com ~]# quotaon 选项 分区名
```

常用选项：

选项
作用

-a
依照etc/mtab文件启动所有的配额分区，如果不加-a，后面就一定要指定分区名。

-u
启动用户配额

-g
启动组配额

-v
显示启动过程的信息

例：

```java
[root@ddkk.com ~]# quotaon -uv /dev/sdb2
/dev/sdb2 [/mnt/sdb2]: user quotas turned on
```

- 关闭配额

```java
[root@ddkk.com ~]# quotaoff 选项 分区名
```

常用选项：

- -a：按照/etc/mtab文件关闭所有的配额分区，若不加-a，就一定要指定分区名。
- -u：关闭用户配额。
- -g：关闭组配额。

**1、****磁盘配额查询**；

```java
[root@ddkk.com ~]# quota 选项 用户名或组名
```

- -u：查询用户配额
- -g：查询组配额
- -v：显示详细信息
- -s：以习惯单位显示容量大小，人性化显示

查询整块分区：

```java
[root@ddkk.com ~]# repquota -avus
```

**1、****测试**；

```java
[u1@localhost sdb2]$ dd if=/dev/zero of=/mnt/sdb2/test bs=1M count=60
```

## 其他命令

### 复制配额

命令格式：

```java
#将用户1的配额复制到用户2
[root@ddkk.com ~]# edquota -p 用户1 -u 用户2
```

例：

```java
#将u1的配额复制到u2
[root@ddkk.com ~]# edquota -p u1 -u u2
[root@ddkk.com ~]# quota -vus u2
Disk quotas for user u2 (uid 1001): 
     Filesystem   space   quota   limit   grace   files   quota   limit   grace
      /dev/sdb2      0K   4000K   5000K               0       8      10
```

### setquota命令设置配额（非交互设置）

命令格式：

```java
[root@ddkk.com ~]# setquota 选项 用户名或组名 空间大小软限制 空间大小硬限制 文件个数软限制 文件个数硬限制 分区名
```

例：

```java
[root@ddkk.com ~]# setquota -u u3 4000 5000 8 12 /dev/sdb2
[root@ddkk.com ~]# quota -uvs u3
Disk quotas for user u3 (uid 1002): 
     Filesystem   space   quota   limit   grace   files   quota   limit   grace
      /dev/sdb2      0K   4000K   5000K               0       8      12
```

### 修改宽限时间

```java
[root@ddkk.com ~]# edquota -t
Grace period before enforcing soft limits for users:
Time units may be: days, hours, minutes, or seconds
  Filesystem             Block grace period     Inode grace period
  /dev/sdb2                     7days                  7days
```

第一个是空间大小限额宽限时间，第二个是文件个数限额宽限时间。
