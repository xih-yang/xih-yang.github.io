# 24、Linux 实战 - fdisk命令手工分区
- 来源：https://ddkk.com/zhuanlan/server/linux/5/24.html
- 分类：服务器框架
- 分组：教程目录
## fdisk命令手工分区

**1、****"fdisk-l"查看系统所有硬盘以及分区**；

```java
[root@ddkk.com ~]# fdisk -l
Disk /dev/sda：20 GiB，21474836480 字节，41943040 个扇区
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x5f00110e
设备       启动     起点     末尾     扇区  大小 Id 类型
/dev/sda1  *        2048   411647   409600  200M 83 Linux
/dev/sda2         411648 37847039 37435392 17.9G 83 Linux
/dev/sda3       37847040 41943039  4096000    2G 82 Linux swap / Solaris
Disk /dev/sdb：20 GiB，21474836480 字节，41943040 个扇区
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
```

**1、****"fdisk磁盘"进行磁盘分区(分区还没有分区号)**；

```java
[root@ddkk.com ~]# fdisk /dev/sdb
```

**fdisk交互指令说明**：

命令
说明

a
设置可引导标记

b
编辑bsd标签

c
设置DOS操作系统兼容标记

*d
删除一个分区

l
显示已知的文件系统类型，82为Linux swap分区，83为Linux分区

*m
显示帮助菜单

*n
新建分区

o
新建空白DOS分区表

*p
显示分区列表

*q
不保存退出

s
新建空白列表

t
改变一个分区的系统ID

u
改变显示记录单位

v
验证分区表

*w
保存退出

x
附加功能

```java
[root@ddkk.com ~]# fdisk /dev/sdb
.......
命令(输入 m 获取帮助)：n                             n开始分区
分区类型 
   p   主分区 (0个主分区，0个扩展分区，4空闲)
   e   扩展分区 (逻辑分区容器)
选择 (默认 p)：p                                    这个分区选择主分区
分区号 (1-4, 默认  1): 1                            分区号选择1
第一个扇区 (2048-41943039, 默认 2048):               开始扇区默认从2048开始
上个扇区，+sectors 或 +size{K,M,G,T,P} (2048-41943039, 默认 41943039): +2G   分2个G
创建了一个新分区 1，类型为“Linux”，大小为 2 GiB。
命令(输入 m 获取帮助)：p                              显示分区列表
Disk /dev/sdb：20 GiB，21474836480 字节，41943040 个扇区
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x14d8de40
设备       启动  起点    末尾    扇区 大小 Id 类型
/dev/sdb1        2048 4196351 4194304   2G 83 Linux
命令(输入 m 获取帮助)：w                              保存退出
分区表已调整。
将调用 ioctl() 来重新读分区表。
正在同步磁盘。
```

**1、****mkfs命令格式化分区**；

```java
[root@ddkk.com ~]# mkfs -t ext4 /dev/sdb1         格式化sdb1
mke2fs 1.45.6 (20-Mar-2020)
创建含有 524288 个块（每块 4k）和 131072 个inode的文件系统
文件系统UUID：aa27ad31-bc1f-41fa-b8f2-e2d57f6475db
超级块的备份存储于下列块： 
	32768, 98304, 163840, 229376, 294912
正在分配组表： 完成                            
正在写入inode表： 完成                            
创建日志（16384 个块）完成
写入超级块和文件系统账户统计信息： 已完成
```

**1、****挂载分区**；

```java
[root@ddkk.com ~]# mkdir /mnt/sdb1  创建空目录
[root@ddkk.com ~]# mount -t ext4 /dev/sdb1 /mnt/sdb1  挂载分区
[root@ddkk.com ~]# df -hT  查看可用空间
文件系统       类型      容量  已用  可用 已用% 挂载点
devtmpfs       devtmpfs  374M     0  374M    0% /dev
tmpfs          tmpfs     392M     0  392M    0% /dev/shm
tmpfs          tmpfs     392M  5.6M  386M    2% /run
tmpfs          tmpfs     392M     0  392M    0% /sys/fs/cgroup
/dev/sda2      ext4       18G  1.8G   15G   11% /
/dev/sda1      ext4      190M  166M   11M   95% /boot
tmpfs          tmpfs      79M     0   79M    0% /run/user/0
/dev/sdb1      ext4      2.0G  6.0M  1.8G    1% /mnt/sdb1
```

## 自动挂载

修改自动挂载分区文件 **/etc/fstab**，修改时要注意不要挂载u盘，光盘等移动存储设备，若开机时配置文件中磁盘不存在，会报错且无法进入系统。

```java
#/etc/fstab
UUID=71577b29-baae-4109-8436-558b7fc032e0 /                       ext4    defaults        1 1 
UUID=c7d6d85a-533b-447c-bbc5-3cbf3851efd6 /boot                   ext4    defaults        1 2 
UUID=44086e68-c8b7-4a64-94d7-a2350ab1c486 none                    swap    defaults        0 0 
~                                                                                              
```

- 第一列：挂载设备号UUID，每个设备的UUID是独一无二的，查看分区UUID。

```java
#查看设备的UUID
[root@ddkk.com ~]# vim /dev/disk/by-uuid
......
44086e68-c8b7-4a64-94d7-a2350ab1c486@                              --> /dev/sda3
71577b29-baae-4109-8436-558b7fc032e0@                              --> /dev/sda2
aa27ad31-bc1f-41fa-b8f2-e2d57f6475db@                              --> /dev/sdb1
c7d6d85a-533b-447c-bbc5-3cbf3851efd6@                              --> /dev/sda1
......
```

- 第二列：挂载分区
- 第三列：分区文件系统类型
- 第四列：挂载设置
- 第五列：是否备份 0不备份 1每天备份 2不定期备份
- 第六列：是否检测磁盘fsck 0不检测 1启动时检测 2启动后检测，除了根分区，其他分区一般启动后检测就可以了

## 修复启动失败

- 修复启动文件需要拿到本机，启动失败时按照要求输入密码可以继续启动。
- 启动后时无法修改文件时，此时根分区是只读模式。
- 将根分区重新以只读模式挂载。

```java
[root@ddkk.com ~]# mount -o remount,rw /
```

- 修改启动文件，重启。
