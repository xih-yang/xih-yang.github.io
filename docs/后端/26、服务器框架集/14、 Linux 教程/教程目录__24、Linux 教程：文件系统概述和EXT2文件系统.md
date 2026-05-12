# 24、Linux 教程：文件系统概述和EXT2文件系统
- 来源：https://ddkk.com/zhuanlan/server/linux/1/24.html
- 分类：服务器框架
- 分组：教程目录
## 文件系统概述和EXT2文件系统

## 文件系统概述

常用的文件系统有windows98前的FAT、windows2000后的NTFS、linux的Ext2/3/4、SGI的XFS文件系统等

对于传统的文件系统而言，一个分区槽只能格式化为一个文件系统，但是目前由于LVM与软件磁盘阵列技术的出现，使一个分区可以对应多个文件系统，故以下关于文件系统的讨论都不表示针对一个分区了，只是介绍文件系统的特性。

linux操作系统会将文件权限、文件属性存在inode中，一个文件对应一个inode，而文件的实际数据会被放入data block中，要读一个文件首先找到该文件的inode，就能迅速找到block，inode中记录了文件数据的实际放置block，这种读取方式就是索引式文件系统：

而光盘采用的FAT文件系统没有inode的存在，此时一个文件的存储依赖block之间的联系，读完一个block后才能找到下一个block，如果block很分散读取速度很慢：

所谓的碎片整理就是因为文件写入的block太分散，导致系统效率不高采取的措施。如果文件太过离散就会降低读取性能，这也是每个分区不宜设置过大的原因。

## EXT2文件系统

ext2系统在格式化的时候分为多个区块群组（block group），然后每个区块群组都有独立的inode和block系统，这是为了处理大量inode和block而做出的应对措施。文件系统示意图如下：

每个文件系统都有一个启动扇区（boot sector），一个block group对应一套独立系统。

### data block

这个区域是文件真正数据存放的位置，ext2所支持的block大小有1K/2K/4K，block本身也记录block编号，所以block越大可记录的编号越多，文件系统最大文件个数也就越多，同时一个文件可占用的block也越多，文件系统能容纳的最大文件限制也越大，因block大小产生的文件系统限制：

一个文件只能占用整数个block，若文件小于block，剩余容量也不能被使用了，因此如果linux平时处理的都是小于1K的文件的话，尽量设置block为1K，这样能最大程度利用磁盘空间，如果平时处理的文件较大，就适当提高block大小，以免block号码存储过多反而导致系统浪费。

用`ll`命令查看文件信息时可以发现文件大小总是1024的整数倍，这就是因为一个文件只能占用整数个block的缘故。

### inode table

每个文件都有一个inode，这里记录的是文件的权限、所有者和所属组、容量、ctime、atime、mtime和block编号。此外每个inode大小是固定为128bytes的（ext4中可以设置为256bytes），因为大小固定，所以一个inode记录的block就是有限的，linux巧妙的用多级索引的方式让一个inode存尽可能多的block：

由上图所示，一个inode会有一部分直接指向block的区域，还存在间接、双间接和三间接，也就是inode指向的block不是存储文件数据的，而是存储其他block编号的，就这样极大的扩展了一个inode可指向的block数。

对ext2来说，一个inode最多可有12个直接指向block的区域，1个间接，1个双间接和1个三间接：

直接指向的数据块一共12K，1个间接可以指向的数据块共256*1K（每个block号码大小为4bytes，相当于一个1K的block最多能存256个block号码），双间接指向的数据共256*256*1K，三间接为256*256*256*1K，加起来一共16GB，也就是block大小为1K时文件系统能容纳的最大文件大小。

如果一个文件100K，block大小为4K，那么会分配100/4+1=26个block，因为inode只能有12个直接指向，需要多分配一个block来记录剩余的block号。

### superblock

它是存储文件系统相关信息的位置，它记录了block和inode的总量，使用情况，大小，挂载时间等。一个文件系统只有一个superblock，它一般都在第一个blockgroup中，其他的blockgroup中即使有superblock也仅仅是备份而已。

### filesystem description文件系统说明

它记录了该blockgroup的起始和结束的block号码，以及记录每个区段的superblock、datablock等具体在那些block之间。

### block bitmap区块对照表和inode bitmap（inode对照表）

block bitmap记录了哪些block是空的，inode bitmap记录了哪些inode是未使用的。当新增文件时要修改这两个区域，此外还需要修改superblock，所以这些经常变动的数据被称为metadata**中介数据**。

### dumpe2fs

这个命令可以查询文件系统相关信息，使用前先用blkid命令查看所有被格式化的装置，如/dev/vda1等，然后用dumpe2fs命令后加装置名即可查看该文件系统信息，主要包括superblock信息、每个block group的信息等。但是对于CentOS7来说，预置的文件系统是xfs，需要自己切换成ex4后才能查看。

## 目录树

目录是一种特殊的文件，目录会分配到一个inode和至少一块block，inode记录目录权限和属性，以及目录的block号，而block记录在这个目录下文件的名称和被该文件占用的inode号。

由上可知，目录的inode并不记录目录下的文件名，而是block在记录目录下的文件名，只有进入block中才能对目录下文件进行更名/新增/删除，所以目录的w权限可以对其中文件更名/新增/删除。

读取一个文件/etc/passwd的流程：

通过挂载点信息找到inode号码为128的根目录inode（对XFS文件系统来说，最顶层的挂载点一般inode号为128），进入其中读取根目录的block。然后找到etc/的inode，进而找到etc/的block，然后在该block中找到/etc/passwd的inode，通过inode找到他的block读取数据。这个过程中每次找到inode有相应的r和x权限才能进入目录进行下一步操作。
