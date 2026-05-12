# 23、Linux 实战 - 文件系统及常用命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/23.html
- 分类：服务器框架
- 分组：教程目录
## 文件系统

### Linux文件系统的特性

- super block(超级块)：

记录整个文件系统的信息，包括block和inode的总量，已经使用的inode和block的数量，未使用的inode和block的数量，block和inode的大小，文件系统的挂载时间，最近一次的写入时间，最近一次的磁盘校验时间。
- block group(块组)：

除了超级块以外，剩下的分区空间还有数量巨大的块，这些块的数量太多，管理起来不方便，Linux便将剩下的磁盘又分为了块组，块组方便了系统对磁盘的管理，由于磁盘被划分为若干组，因此上层访问数据时碰撞的概率就会大大减小，从而提升文件系统的整体性能。
- date block(数据块，也称作block)：

用来实际保存数据的，block的大小(1KB、2KB、4KB)和数量在格式化后就已经决定不能改变，除非重新格式化，每个block只能保存一个文件的数据，文件数据小于一个block块，那么剩下的空间不能再保存数据，若是大于一个block块，就用多个block块来保存。
- inde(i节点)：

用来记录文件的权限(r、w、x)，文件的所有者和属组，文件的大小，文件的状态改变时间，文件的最近一次读取时间，文件的最近一次修改时间，文件的数据的真正保存时间，文件的数据的真正保存的block编号，每个文件需要占用一个inode。

### Linux常用的文件系统

文件系统
描述

ext
Linux中最早的文件系统。

ext2
ext的升级版本，Red Hat 7.2版本以前的系统默认都是ext2文件系统。

ext3
是ext2的升级版本，最大的区别就是带日志功能，以便系统突然停止时提高文件系统的可靠性。

ext4
是ext3文件系统的升级版，ext4再性能、伸缩性和可靠性等方面进行了大量改进，并且还向下兼容ext3，是CentOS6.x的默认文件系统。

XFS
XFS最早是针对IRIX系统开发，是一个高性能的日志型文件系统，能够在断电以及操作系统崩溃的情况下保证文件系统数据的一致性，它是一个64位的文件系统，后来进行开源并移植到了Linux操作系统中，目前CentOS7.x将XFS+LVM作为默认的文件系统，据官方称，XFS对大文件的读写性能较好。

swap
swap是Linux中用于交换分区的文件系统(类似于Windows中的虚拟内存)。

NFS
网络文件系统的缩写，是一种用来实现不同主机之间文件共享的一种网络服务，本地主机可以通过挂载的港式使用远程共享的资源。

iso9660
光盘的标准文件系统。

fat
Windows下的fat16文件系统，在Linux中识别位fat。

vfat
Windows下的fat32文件系统，在Linux中识别位vfat，支持最大32GB的分区和最大4GB的文件。

## 常用的硬盘管理命令

### df命令

统计空间大小信息。

命令格式：

```java
[root@ddkk.com ~]# df -ahT
```

常用选项：

- -a：显示特殊文件系统，这些文件系统几乎都是保存在内存中，如/proc，因为是挂载在内存中的，所以占用量为0
- -h：单位不再使用KB，而是换算成习惯单位
- -T：多出了文件系统类型一列

### du命令

统计文件大小，ls -l命令显示目录大小时只能统计目录单独大小，而不能统计目录下文件大小总和，du命令可以实现这一功能。

命令格式：

```java
[root@ddkk.com ~]# du 选项 目录或文件名
```

常用选项：

- -a：显示每个子文件的磁盘占用量，默认只统计子目录的磁盘占用量
- -h：使用习惯单位显示磁盘占用量，如KB、MB、GB等
- -s：使用总占用量，而不列出子目录和子文件的占用量

### fsck文件系统修复命令

fsck命令是系统自带的一条命令，如果在意外关机或者系统崩溃后可以修复的话，fsck命令就会在开机时自动执行修复文件系统。

```java
[root@ddkk.com ~]# fsck -y /dev/sda1
#自动修复
```

### 显示磁盘状态

```java
[root@ddkk.com ~]# dumpe2fs 选项 磁盘分区
#详细显示磁盘状态以及分出的块组
```

常用选项：

- -h：只看磁盘分区的信息不看块组

例：

```java
[root@ddkk.com ~]# dumpe2fs -h /dev/sda2
dumpe2fs 1.45.6 (20-Mar-2020)
Filesystem volume name:   <none>                                  卷标名
Last mounted on:          /                                       挂载点
Filesystem UUID:          71577b29-baae-4109-8436-558b7fc032e0    UUID
Filesystem magic number:  0xEF53
Filesystem revision:    1 (dynamic)
Filesystem features:      has_journal ext_attr resize_inode dir_index filetype needs_recovery extent 64bit flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum
Filesystem flags:         signed_directory_hash 
Default mount options:    user_xattr acl                          挂载参数
Filesystem state:         clean                                   文件系统状态，正常
Errors behavior:          Continue
Filesystem OS type:       Linux
Inode count:              1171456
Block count:              4679424                                块总数
Reserved block count:     233971
Free blocks:              4111905
Free inodes:              1127647
First block:              0
Block size:               4096                                   块大小
Fragment size:            4096
Group descriptor size:    64
Reserved GDT blocks:      1024
Blocks per group:         32768
Fragments per group:      32768
Inodes per group:         8192                                    inode点数
Inode blocks per group:   512
Flex block group size:    16
Filesystem created:       Fri Oct 15 00:12:12 2021
Last mount time:          Tue Jan 25 04:32:36 2022
Last write time:          Tue Jan 25 04:32:31 2022
Mount count:              13
Maximum mount count:      -1
Last checked:             Fri Oct 15 00:12:12 2021
Check interval:           0 (<none>)
Lifetime writes:          7539 MB
Reserved blocks uid:      0 (user root)
Reserved blocks gid:      0 (group root)
First inode:              11
Inode size:	          256                                         inode大小
Required extra isize:     32
Desired extra isize:      32
Journal inode:            8
First orphan inode:       655914
Default directory hash:   half_md4
Directory Hash Seed:      9242f857-4197-4192-910c-8092ee135c6a
Journal backup:           inode blocks
Checksum type:            crc32c
Checksum:                 0x8eaa9471
Journal features:         journal_incompat_revoke journal_64bit journal_checksum_v3
Journal size:             128M
Journal length:           32768
Journal sequence:         0x00002856
Journal start:            1
Journal checksum type:    crc32c
Journal checksum:         0x88847f03
```

### 常看文件的详细时间

```java
[root@ddkk.com ~]# stat  文件名
[root@ddkk.com ~]# stat anaconda-ks.cfg 
  文件：anaconda-ks.cfg
  大小：1134      	块：8          IO 块：4096   普通文件
设备：802h/2050d	Inode：138164      硬链接：1
权限：(0600/-rw-------)  Uid：(    0/    root)   Gid：(    0/    root)
环境：system_u:object_r:admin_home_t:s0
最近访问：2022-01-22 03:59:27.844481855 -0500
最近更改：2021-10-15 00:20:30.073663646 -0400
最近改动：2021-10-15 00:20:30.073663646 -0400
创建时间：2021-10-15 00:20:29.732644006 -0400
```

### 判断文件类型

```java
[root@ddkk.com ~]# file 文件名
#判断文件类型
[root@ddkk.com ~]# type 命令名
#判断命令类型
```

例：

```java
[root@ddkk.com ~]# type cd
cd 是 shell 内建
[root@ddkk.com ~]# file anaconda-ks.cfg 
anaconda-ks.cfg: ASCII text
```
