# 06、FastDFS 教程 - FastDFS多节点配置
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/1/6.html
- 分类：分布式存储
- 分组：教程目录
前面几篇关于FastDFS的博客中介绍了如何在一台机器上搭建一个简易的FastDFS系统，当然在实际的应用中是不可能将所有的节点都搭建在一台机器上的，昨天用一下午的时间搭建了一个三个节点的FastDFS的系统，这里记录一下搭建的过程。

## 一、系统结构

我这里有三台机器：

机器
系统
IP

PC1
CentOS6.5
192.168.1.31

PC2
Ubuntu14.04
192.168.1.32

PC3
Ubuntu14.04
192.168.1.33

我将PC1当做tracker服务器，PC2和PC3作为group1中的两台Storage服务器，所以他们的结构是这样的：

## 二、安装

**1、安装libevent**

三台机器都要安装libevent，在libevent安装之前要确保你的机器上有C的编译器，我的Centos上竟然没有gcc，所以我先安装了一个gcc，然后其他的步骤都是按照之前的博客中介绍的那样进行安装即可。[http://blog.csdn.net/xingjiarong/article/details/50559761](http://blog.csdn.net/xingjiarong/article/details/50559761)

**2、安装FastDFS**

接着按照博客中的步骤安装FastDFS，其中两台Ubuntu系统的机器需要按照博客中的步骤更改配置文件，但是CentOS不需要修改，直接make就行了。

## 三、配置

**1、配置tracker**

编辑PC1上的tracker.conf,详细的修改过程按照这篇博客：[http://blog.csdn.net/xingjiarong/article/details/50559768](http://blog.csdn.net/xingjiarong/article/details/50559768)，配置完成后进行启动。

我在启动时出现了如下的错误：

```java
fdfs_trackerd: error while loading shared libraries: 
libevent-2.0.so.5: cannot open shared object file: No such file or directory
```

经过谷歌，通过下面的方法顺利解决：

```java
ln -s /usr/lib/libevent-2.0.so.5 /usr/lib64/libevent-2.0.so.5
```

你还可以通过下面的方法来判断是否启动成功：

```java
netstat -anp |grep 22122
```

如果出现类似的信息则说明启动成功了。

```java
tcp 0 0 0.0.0.0:22122  0.0.0.0:* LISTEN 13092/fdfs_trackerd
```

**2、配置storage.conf**

对PC2和PC3上的storage.conf进行修改，方法按照配置tracker的那篇博客，需要注意的是，tracker_server要写成PC1的ip地址：

```java
tracker_server=192.168.1.31:22122
```

在我配置完成后启动storage的时候，执行命令就会卡住，我去看了一下log文件中，发现有这个错误：

```java
ERROR - file: storage_ip_changed_dealer.c, line: 180, connect to tracker server 
192.168.1.31:22122 fail, errno: 113, error info: No route to host
```

我检查了我的tracker_server地址，发现是对的，但是我记得我对PC1配置过防火墙，所以关掉防火墙之后就可以了。

## 四、测试

测试方法按照这篇博客：[http://blog.csdn.net/xingjiarong/article/details/50560605](http://blog.csdn.net/xingjiarong/article/details/50560605)，注意要写对tracker_server的地址，一般你的服务都启动了之后是不会有什么问题，可以试一下。

五、关于Web Server

FastDFS可以使用的Web服务器有apache和nginx两种，网上说nginx比较轻量级，但是我还没找到一篇比较好的博客，等我搞好了一定给大家分享，之前是装过apache的，就在刚刚测试的那篇博客里，但是这次我按照那篇博客，对PC2和PC3两台机器进行了配置，配置成功后输入PC2和PC3的IP地址是可以访问到apache主页的，但是却提示找不到FastDFS中M00下的文件，有知道的还请留言告诉一声，谢谢！
