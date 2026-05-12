# 25、Linux 实战 - parted分区命令
- 来源：https://ddkk.com/zhuanlan/server/linux/5/25.html
- 分类：服务器框架
- 分组：教程目录
## 修改GPT分区

Linux中有两种常用的分区表MBR分区表(主引导记录分区表)和GPT分区表(GUID分区表)，其中：

- MBR分区表：支持的最大分区时2TB，最多支持4个主分区，或3个主分区和1个拓展分区。
- GPT分区表：支持最大18EB的分区，最多支持128个分区，其中1个系统保留分区，127个用户自定义分区。

### parted命令

fdisk命令只支持修改MBR分区表，要分区GPT可以用parted命令。

常用交互选项：

选项
作用

print
列出当前磁盘的分区。

mklabel gpt/mklabel msdos
创建gpt或mbr分区表

mkpart
创建分区命令，后面不需要参数，全部靠交互指定

resize
调整分区大小，注意这里parted的命令只支持ext2文件系统。

rm
删除分区。

mkfs
格式化分区。

quit
退出parted命令。

注：parted命令只支持ext2文件系统，所以分区结束后可以用Linux系统命令格式化。

```java
[root@ddkk.com ~]# mkfs -t ext4 /dev/sdb1
```
