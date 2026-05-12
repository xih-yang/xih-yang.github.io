# 26、Linux 实战 - swap分区
- 来源：https://ddkk.com/zhuanlan/server/linux/5/26.html
- 分类：服务器框架
- 分组：教程目录
## swap分区

Linux中的swap分区相当于Windows中的虚拟内存，在物理内存不足时当做内存使用。

### 查看swap分区大小

swap分区是无法用df命令查看的，可以用free命令来查看：

```java
[root@ddkk.com ~]# free -h
              total        used        free      shared  buff/cache   available
Mem:          782Mi       216Mi       339Mi       5.0Mi       225Mi       438Mi
Swap:         2.0Gi          0B       2.0Gi
#total：总大小  used：已用大小   free：空闲大小  buff：缓冲区和缓存大小  available：可用大小
#-h选项：人性化显示
```

### 分配swap分区

```java
[root@ddkk.com ~]# fdisk /dev/sdb          用fdisk命令创建swap分区
欢迎使用 fdisk (util-linux 2.32.1)。
更改将停留在内存中，直到您决定将更改写入磁盘。
使用写入命令前请三思。
命令(输入 m 获取帮助)：n                       创建分区
分区类型
   p   主分区 (0个主分区，0个扩展分区，4空闲)
   e   扩展分区 (逻辑分区容器)
选择 (默认 p)：p                               
分区号 (1-4, 默认  1): 1
第一个扇区 (2048-41943039, 默认 2048): 2048
上个扇区，+sectors 或 +size{K,M,G,T,P} (2048-41943039, 默认 41943039): +1G
创建了一个新分区 1，类型为“Linux”，大小为 1 GiB。
命令(输入 m 获取帮助)：p                        列出分区
Disk /dev/sdb：20 GiB，21474836480 字节，41943040 个扇区
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0xf059268e
设备       启动  起点    末尾    扇区 大小 Id 类型
/dev/sdb1        2048 2099199 2097152   1G 83 Linux
命令(输入 m 获取帮助)：t                        修改分区文件系统为82：swap分区类型
已选择分区 1
Hex 代码(输入 L 列出所有代码)：82
已将分区“Linux”的类型更改为“Linux swap / Solaris”。
命令(输入 m 获取帮助)：p
Disk /dev/sdb：20 GiB，21474836480 字节，41943040 个扇区
单元：扇区 / 1 * 512 = 512 字节
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0xf059268e
设备       启动  起点    末尾    扇区 大小 Id 类型
/dev/sdb1        2048 2099199 2097152   1G 82 Linux swap / Solaris
命令(输入 m 获取帮助)：w
分区表已调整。
将调用 ioctl() 来重新读分区表。
正在同步磁盘。
```

### 格式化swap分区

格式化swap分区所需要的命令和其他格式化命令不一样，需要用到mkswap命令。

```java
[root@ddkk.com ~]# mkswap /dev/sdb1
正在设置交换空间版本 1，大小 = 1024 MiB (1073737728  个字节)
无标签，UUID=9359a16a-6737-465a-9d10-d180b4e5c2e7
```

### 增加swap分区

将新创建的swap分区加到已经使用的swap分区中需要用到swapon命令。

```java
[root@ddkk.com ~]# free -h
              total        used        free      shared  buff/cache   available
Mem:          782Mi       214Mi       294Mi       5.0Mi       273Mi       436Mi
Swap:         2.0Gi          0B       2.0Gi
[root@ddkk.com ~]# swapon /dev/sdb1
[root@ddkk.com ~]# free -h
              total        used        free      shared  buff/cache   available
Mem:          782Mi       215Mi       293Mi       5.0Mi       273Mi       435Mi
Swap:         3.0Gi          0B       3.0Gi
```

swapon命令新增的swap分区仅仅是暂时的，需要投入使用需要修改/etc/fstab文件。

```java
UUID=9359a16a-6737-465a-9d10-d180b4e5c2e7 swap                    swap    defaults        0 0
```
