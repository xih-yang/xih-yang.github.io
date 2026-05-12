# 02、FastDFS 教程 - FastDFS安装
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/1/2.html
- 分类：分布式存储
- 分组：教程目录
在前面的一篇中，我们分析了FastDFS的架构，知道了FastDFS是由客户端，跟踪服务器和存储服务器三部分组成，下面我们就来看一下如何动手搭建一个FastDFS的环境出来。这是FastDFS的主页：[https://code.google.com/p/fastdfs/](https://code.google.com/p/fastdfs/)，上边有FastDFS的简单介绍和一些常用的下载。但是本人觉得，官网上的搭建过程过于简单，并且没有对一个异常提出解决方案，对于一个新手来说是很难搭建出一个满意的环境的，毕竟对FastDFS有较高的造诣的人也不会纠结怎么搭建环境，所以这里我总结了一下我的搭建过程和其中遇到的一些问题，希望对大家有所帮助，如果有什么问题还请大家积极指出。

## 一、环境声明

我觉得对于搭建环境的博客来说首先要做的就是声明博文中使用的环境是什么，好让看博客的人形成对照，好多的博主不说明自己的环境，一上来就开始执行命令，很多人跟着博主进行搭建，搭建了一大半了才发现自己和博主的环境根本就不一样，即浪费了时间又影响了心情。在这里我说明一下我的环境。我使用的是Ubuntu14.04 LTS 64位 作为搭建的主机，搭建单节点的FastDFS环境，注意是单节点的。我们先从最简单的入手，后边我会再写一篇如何搭建多节点的环境。为了方便恢复系统，我使用了VirtualBox虚拟了Ubuntu14.04 LTS，当然如果您想在物理机上搭建当然也可以。以下博客中出现的所有命令都在root权限下执行。

## 二、环境准备-安装libevent

FastDFS内部绑定了libevent作为http服务器，在V2.X版本以上必须安装libevent，本文安装的是V4.06版本，因此必须安装libevent。

如果已经安装了libevent，请确认安装路径是/usr ， 因为FastDFS在编译源程序时，需要到此目录下查找一些依赖文件，否则编译FastDFS会出错。如果不是，建议首先卸载libevent，然后安装到 /usr 下。本文安装的是libevent-2.0.19-stable.tar.gz，下载地址：[https://acelnmp.googlecode.com/files/libevent-2.0.19-stable.tar.gz](https://acelnmp.googlecode.com/files/libevent-2.0.19-stable.tar.gz)，按照如下的步骤进行安装。

```java
wget https://acelnmp.googlecode.com/files/libevent-2.0.19-stable.tar.gz
tar zxvf libevent-2.0.19-stable.tar.gz
./configure --prefix=/usr
make clean
make
make install
```

这样libevent就安装按成了。

## 三、安装FastDFS

**1、** 首先下载FastDFS；

```java
wget https://fastdfs.googlecode.com/files/FastDFS_v4.06.tar.gz
```

**2、** 解压缩；

```java
tar vxzf FastDFS_v4.06.tar.gz %FastDFS% 
```

注：这里的%FastDFS% 是解压目录，每个人根据自己的实际情况进行替换即可。

**3、** 修改make.sh文件；

首先执行如下命令查看一下自己的libpthread.a位于什么地方

```java
find / -name 'libpthread.a'
```

结果为：/usr/lib/x86_64-linux-gnu/libpthread.a

同样的方法查看自己的libpthread.so文件为什么什么地方

```java
find / -name 'libpthread.so'
```

结果为：/usr/lib/x86_64-linux-gnu/libpthread.so

找到make.sh中关于libpthread.a和libpthread.so的地方，在其中加入自己刚刚找到的文件位置。

原文件

```java
if [ -f /usr/lib/libpthread.so ] || [ -f /usr/local/lib/libpthread.so ] || 
[ -f /lib64/libpthread.so ] || [ -f /usr/lib64/libpthread.so ] || 
[ -f /usr/lib/libpthread.a ] || [ -f /usr/local/lib/libpthread.a ] || 
[ -f /lib64/libpthread.a ] || [ -f /usr/lib64/libpthread.a ]; then
  LIBS="$LIBS -lpthread"
```

修改后的文件

```java
if [ -f /usr/lib/libpthread.so ] || [ -f /usr/local/lib/libpthread.so ] || 
[ -f /lib64/libpthread.so ] || [ -f /usr/lib64/libpthread.so ] || 
[ -f /usr/lib/x86_64-linux-gnu/libpthread.so ]|| [ -f /usr/lib/libpthread.a ] || 
[ -f /usr/lib/x86_64-linux-gnu/libpthread.a ] || [ -f /usr/local/lib/libpthread.a ] || 
[ -f /lib64/libpthread.a ] || [ -f /usr/lib64/libpthread.a ]; then
  LIBS="$LIBS -lpthread"
```

这一步的目的是因为不同的机器pthread的类库的位置是不同的，如果不进行设置的话，在编译的时候就会出现找不到pthread等错误。

**注意：**有人的博客中写到为了支持http，要设置WITH_HTTPD=1等等，在我安装的v4.06中，FastDFS不再集成http的功能，如果想要通过http下载文件的话，需要配置单独的fastdfs-apache-module，后边的博客中我会单独说明如何配置。

**4、** 修改client/fdfs_link_library.sh.in；

找到以下的位置

将lib64改为lib，否则会出现文件不存在的错误。修改为如下所示：

**5、** 开始安装；

在FastDFS根目录下执行如下的命令进行安装，如果没有报错就说明安装成功了

```java
./make.sh
./make.sh install
```
