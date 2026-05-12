# 28、Linux 实战 - LVM逻辑卷管理
- 来源：https://ddkk.com/zhuanlan/server/linux/5/28.html
- 分类：服务器框架
- 分组：教程目录
## LVM逻辑卷管理

### 简介

LVM是 Logical Volume Manager（逻辑卷管理）的简写，它是Linux环境下对磁盘分区进行管理的一种机制，可以动态调整分区大小。

- 物理卷(PV)：就是真正的物理硬盘或分区。
- 卷组(VG)：将多个物理卷合起来就组成了卷组，组成同一个卷组的物理卷可以是同一个硬盘的不同分区，也可以是不同硬盘上的不同分区，可以把卷组想象成一个逻辑硬盘。
- 逻辑卷(LV)：卷组是一个逻辑硬盘，硬盘必须分区后才能使用，这个分区我们称为逻辑卷。逻辑卷可以格式化和写入数据，可以把逻辑卷想象成分区。
- 物理拓展(PE)：PE使用来保存数据的最小单元，我们的数据实际上都是写入PE当中，PE的大小是可以配置的，默认是4MB。

### 建立LVM

#### 步骤

**1、** 将物理硬盘分成分区，当然也可以是整块物理硬盘；

**2、** 然后把物理分区建立成物理卷，也可以直接把整块硬盘建立为物理卷；

**3、** 把物理卷整合成卷组，卷组也可以调整大小；

**4、** 把卷组划分成逻辑卷，逻辑卷也可以调整大小，可以把逻辑卷想象成分区，也需要格式化和挂载；

#### 物理卷管理

注：boot分区必须放在标准分区中，而不能放在LVM卷组分区中，否则无法启动。

**1、****硬盘分区**；

使用fdisk交互命令进行分区，只是最后需要把文件系统改为LVM，从83改成8e。
**2、****建立物理卷**；

```java
[root@ddkk.com ~]# pvcreate 设备文件名
```

若没有此命令，安装lvm2即可。

查看物理卷：

```java
[root@ddkk.com ~]# pvscan
或
[root@ddkk.com ~]# pvdisplay
```

例：

```java
[root@ddkk.com ~]# pvcreate /dev/sdb5
  Physical volume "/dev/sdb5" successfully created.
[root@ddkk.com ~]# pvcreate /dev/sdb6
  Physical volume "/dev/sdb6" successfully created.
[root@ddkk.com ~]# pvcreate /dev/sdb7
  Physical volume "/dev/sdb7" successfully created.
```

#### 卷组管理

**1、****建立卷组**；

```java
[root@ddkk.com ~]# vgcreate 选项 卷组名 物理卷名
```

选项：

- -s PE大小：指定PE的大小，单位可以是MB，GB，TB等，如果不写，默认为4MB。

例：

```java
[root@ddkk.com ~]# vgcreate -s 4MB wvg /dev/sdb5 /dev/sdb6
Volume group "wvg" successfully created
#将/dev/sdb5、/dev/sdb6整合成一个卷组，PE大小为4MB，卷组名为wvg。
```

**1、****查看卷组**：；

```java
[root@ddkk.com ~]# vgscan
或
[root@ddkk.com ~]# vgdisplay
```

**1、****卷组扩容**；

```java
#将/dev/sdb7加入到卷组wvg中
[root@ddkk.com ~]# vgextend wvg /dev/sdb7
  Volume group "wvg" successfully extended
```

**1、****减小卷组容量**；

```java
[root@ddkk.com ~]# vgreduce 卷组名 分区名
```

理论上可以用vgreduce命令减小卷组容量，但尽量不要这样，因为可能会造成数据丢失。

**1、****删除卷组**；

```java
[root@ddkk.com ~]# vgremove 卷组名
```

#### 逻辑卷管理

**1、****建立逻辑卷**；

```java
[root@ddkk.com ~]# lvcreate 选项 -n 逻辑卷名 卷组名
```

常用选项：

- -L 容量：指定逻辑卷大小。
- -l 个数：按照PE个数指定逻辑卷大小，这个参数需要换算容量，太麻烦。
- -n 逻辑卷名：指定逻辑卷名。

例：

```java
创建一个大小为5G的逻辑卷，卷名为ulv1。
[root@ddkk.com ~]# lvcreate -L 5G -n ulv1 wvg
  Logical volume "ulv1" created.
```

**1、****查看逻辑卷**；

```java
[root@ddkk.com ~]# lvscan
或
[root@ddkk.com ~]# lvdisplay
```

**1、****调整逻辑卷大小**；

```java
[root@ddkk.com ~]# lvresize 选项 逻辑卷设备文件名
```

选项：

- -L 容量：安装容量调整大小，单位KB、GB、TB等，使用+代表增加空间，-号代表减少空间，如果直接写容量，代表设定逻辑卷大小为指定大小。
- -l 个数：按照PE大小调整逻辑卷大小。

调整大小后运行以下命令：

```java
[root@ddkk.com ~]# resize2fs 选项 设备文件名 调整的大小
```

选项：
-f：强制调整

例：

```java
[root@ddkk.com ~]# lvresize -L 5.5G /dev/wvg/ulv1
  Size of logical volume wvg/ulv1 changed from 5.00 GiB (1280 extents) to 5.50 GiB (1408 extents).
  Logical volume wvg/ulv1 successfully resized.
```

**1、****删除逻辑卷**；

```java
[root@ddkk.com ~]# lvremove 逻辑卷设备文件名
```

创建好逻辑卷之后就可以正常挂载和使用了。
