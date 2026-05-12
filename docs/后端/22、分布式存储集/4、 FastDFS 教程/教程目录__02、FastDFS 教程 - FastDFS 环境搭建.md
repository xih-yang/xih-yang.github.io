# 02、FastDFS 教程 - FastDFS 环境搭建
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/2.html
- 分类：分布式存储
- 分组：教程目录
## 一、FastDFS 安装

### 1. 安装前的准备

**检查 Linux 上是否安装了 gcc、libevent、libevent-devel**

`yum list installed | grep gcc`

`yum list installed | grep libevent`

`yum list installed | grep libevent-devel`

**如果没有安装，则需进行安装**

`yum install gcc libevent libevent-devel -y`

### 2. 安装 libfastcommon 库

libfastcommon 库是 FastDFS 文件系统运行需要的公共 C 语言函数库

为了与FastDFS 5.11 这一版本相兼容，我们这里使用是 v1.0.36 版本

下载地址：[https://github.com/happyfish100](https://github.com/happyfish100)

**A、将下载好的 libfastcommon 文件上传到 Linux (/home/soft)**

**B、解压下载下来的 tar.gz 压缩包到当前目录**

`tar -zxvf libfastcommon-1.0.36.tar.gz`

**C、执行 make 脚本进行编译**

> 注意： make 编译的时候如果报错，需解决错误后再次进行 make，通常发生错误是由于Linux 缺少某些依赖库导致，根据错误提示解决错误

**D、执行make install进行安装**

`./make.sh install`

至此libfastcommon 库安装完毕

### 3. 安装 FastDFS

FastDFS 没有 Windows 版本，不能在 Windows 下使用。

FastDFS 需要安装部署在 Linux 环境下，我们这里使用的是 fastdfs-5.11 版本

下载地址：[https://github.com/happyfish100/fastdfs/archive/V5.11.tar.gz](https://github.com/happyfish100/fastdfs/archive/V5.11.tar.gz)

**A、将下载好的 FastDFS 文件上传到 Linux (/home/soft)**

**B、解压下载下来的tar.gz压缩包到当前目录**

`tar -zxvf fastdfs-5.11.tar.gz`

**C、切换到 fastdfs-5.11 目录执行 make 脚本进行编译**

`./make.sh`

**D、执行 make install 进行安装**

`./make.sh install`

至此FastDFS 安装完成

所有编译出来的文件存放在 /usr/bin 目录下

所有配置文件存放在 /etc/fdfs 目录下

### 4. 查看安装

**A、查看FastDFS相关的可执行程序**

`ll/usr/bin/fdfs*`

/usr/bin是Linux的环境变量，可通过echo $PATH查看

**B、查看FastDFS的配置文件**

`ll/etc/fdfs/`

另外注意需要把解压后的 fastdfs-5.11/conf 目录下的两个文件拷贝到 /etc/fdfs/ ，否则后续会有很多问题不好解决。

`cphttp.conf /etc/fdfs/`

`cpmime.types /etc/fdfs/`

这两个文件后续需要用到，所以我们先拷贝过去。

## 二、FastDFS 配置

**去掉 /etc/fdfs/ 目录下 FastDFS 配置文件的后缀名**

**修改 tracker.conf 文件**

默认指向的 FastDFS 作者**余庆**的目录，因为在我们的机器上不存在，所有手动改一下。

`base_path=/opt/fastdfs/tracker`

配置tracker存储数据的目录

**修改 storage.conf 文件**

base_path=/opt/fastdfs/storagestorage存储数据目录

store_path0=/opt/fastdfs/storage/files真正存放文件的目录

tracker_server=192.168.160.133:22122注册当前存储节点的跟踪器地址

**在Linux 服务器上创建上面指定的目录**

```java
/opt/fastdfs/tracker
/opt/fastdfs/storage
/opt/fastdfs/storage/files
```

## 三、FastDFS 启动

FastDFS服务启动需要启动两个脚本：

**A、启动FastDFS的tracker服务**

任意目录下执行：`fdfs_trackerd /etc/fdfs/tracker.conf`

**B、启动FastDFS的storage服务**

在任意目录下执行：`fdfs_storaged /etc/fdfs/storage.conf`

**查看启动进程**

有启动的执行命令即为启动成功

**查看storage是否已经注册到了tracker下**

执行：`fdfs_monitor /etc/fdfs/storage.conf·`

如看到这样的信息，则注册成功

**首次启动storage后，会在配置的路径下创建存储文件的目录**

## 四、FastDFS 重启

**重启 tracker**

`fdfs_trackerd /etc/fdfs/tracker.conf restart`

**重启storage**

`fdfs_storaged /etc/fdfs/storage.conf restart`

## 五、FastDFS 关闭

**关闭tracker执行命令**

在任意目录下执行：`fdfs_trackerd /etc/fdfs/tracker.conf stop`

**关闭storage执行命令**

在任意目录下执行：`fdfs_storaged /etc/fdfs/storage.conf stop`

**或者 kill 关闭 fastdfs，但不建议在线上使用 kill -9 强制关闭，因为可能会导致文件信息不同步问题**

## 六、FastDFS 测试

FastDFS 安装完成之后，可以使用 fdfs_test 脚本测试文件上传

测试之前，需要修改 client.conf 配置文件，修改两个配置

- base_path=/opt/fastdfs/client
- tracker_server=192.168.160.133:22122

在/opt/fastdfs/ 目录下创建 client

**测试文件上传**

A、准备需要上传的文件

B、执行上传命令 `fdfs_test /etc/fdfs/client.conf upload /root/test.txt`

C、切换到存储目录查看文件上传情况

**FastDFS生成的文件目录结构及名称示例**

**测试文件删除**

`fdfs_delete_file /etc/fdfs/client.conf group1/要删除的文件路径`

**注意**

- 没有搭建集群默认只有一个组group1
- 后缀名包含-m的为属性文件(meta)
- 在Linux中并没有磁盘一说,是虚拟的
