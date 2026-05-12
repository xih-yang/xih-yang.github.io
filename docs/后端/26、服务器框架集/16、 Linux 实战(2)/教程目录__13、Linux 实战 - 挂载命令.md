# 13、Linux 实战 - 挂载命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/13.html
- 分类：服务器框架
- 分组：教程目录
## mount命令

Linux中所有存储设备都必须要挂载才能使用。

执行权限：所有用户。

```java
[root@ddkk.com ~]# mount [-l]
#查询系统中已经挂载的设备，-l会显示卷标名称
[root@ddkk.com ~]# mount -a   
#依据配置文件/etc/fstab的内容，自动挂载，/etc/fstab是很重要的文件，开机是系统自动挂载存储设备时要使用，mount -a可以检测配置文件是否正确，依据检测修改文件
[root@ddkk.com ~]# mount [-t 文件系统] [-L 卷标名] [-o 特殊选项] 设备文件名 挂载点
......
```

常用选项：

选项
作用

-t 文件系统
加入文件系统类型来指定挂载的类型，可以ext3、ext4.iso9600等文件系统。

-L 卷标名
挂载指定卷标哦的分区，而不是安装设备文件名挂载。

-o 特殊选项
可以指定挂载的额外选项，比如读写权限、同步异步等，如果不指定，则默认值生效。

## 挂载光盘

光盘挂载的前提依然是指定光盘的设备文件名，不同的Linux版本，设备文件名并不相同，我所使用的CentOS8，光盘设备文件名是/dev/sr0，但不论哪个系统都有软链接/dev/cdrom，可以作为光盘的设备文件名。

```java
[root@ddkk.com ~]# ll /dev/cdrom /dev/sr0
lrwxrwxrwx. 1 root root      3 1月  11 06:06 /dev/cdrom -> sr0
brw-rw----. 1 root cdrom 11, 0 1月  11 06:06 /dev/sr0
```

正常情况下，使用/dev/sr0和/dev/cdrom挂载都是一样的，不过有些时候，系统出现故障，进程加载不完全，进入单用户模式时，软链接不生效，无法使用/dev/cdrom，所以建议使用/dev/sr0。

- 挂载光盘

```java
[root@ddkk.com ~]# mount -t iso9660 /dev/sr0 /mnt/cdrom
```

- 卸载光盘

```java
[root@ddkk.com ~]# umount /dev/sr0
[root@ddkk.com ~]# umount /mnt/cdrom
#因为设备文件名与挂载点已经连接到一起，所以卸载哪一个都可以，umount和unmount都可以，都是卸载命令。
```

**注意事项**：

- 使用完之后必须卸载，如果不卸载，真实光驱是无法弹出的，虚拟机光驱有可能报错，不能使用。
- 挂载目录必须是空目录，准备好的目录挂载点在挂载之后就会被设备文件所取代，无法在系统中访问，占用资源且无法使用，所以挂载目录必须是空目录。

## 挂载U盘

U盘和硬盘共用文件名，所以U盘的设备文件名不是固定的，需要手工查询。

```java
[root@ddkk.com ~]# fdisk -l   使用fdisk -l命令来识别电脑中的硬盘
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
Disk /dev/sdb：14.4 GiB，15500083200 字节，30273600 个扇区   这里识别的是我16G的U盘
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x00000000
设备       启动    起点    末尾    扇区  大小 Id 类型
/dev/sdb1  *         64 7505903 7505840  3.6G  0 空
/dev/sdb2       7505904 7514095    8192    4M ef EFI (FAT-12/16/32)
#因为之前安装系统，所以U盘被分区了
```

挂载U盘：

```java
[root@ddkk.com ~]# mount -t vfat -o iocharset=utf8 /dev/sdb1 /mnt/usb
#vfat：我的U盘由于被重新分区，所以不是Fat文件系统，一般Windows下的U盘文件系统为Fat32格式。
#iocharset=utf8：指定中文编码，以防出现中文乱码，注意Linux纯字符界面是不支持中文的，这是为了在远程终端上能正常显示中文
```

卸载U盘：

```java
[root@ddkk.com ~]# umount /dev/sdb1
[root@ddkk.com ~]# umount /mnt/usb
```

## 挂载NTFS分区

### Linux的几种驱动加载的方式

- 驱动直接放入系统内核之中，这种驱动主要是系统加载必须的驱动，数量较少。
- 驱动以模块的形式放入硬盘，大多数驱动都已这种形式保存，保存位置在/lib/modules/4.18.0-338.el8.x86_64/kernel/drivers中，“4.18.0-338.el8.x86_64”是内核版本。
- 驱动可以被Linux识别，但是系统认为着这种驱动一般不常用，默认不加载，用到这种驱动的时候需要重新编译内核，NTFS文件系统就是这样一种情况。
- 硬件不能被Linux内核识别，需要手工安装驱动，当然需要厂商已经提供了该硬件对Linux的驱动，否则就需要自己开发驱动了。

### 使用NTFS-3G安装NTFS文件系统模块

- 首先需要在官网下载源代码，然后进行安装
- 挂载ntfs设备

```java
[root@ddkk.com ~]#mount -t ntfs-3g /dev/sdb1 /mnt/ntfs
```
