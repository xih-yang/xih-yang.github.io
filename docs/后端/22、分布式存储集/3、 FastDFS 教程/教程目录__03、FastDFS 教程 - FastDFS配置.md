# 03、FastDFS 教程 - FastDFS配置
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/1/3.html
- 分类：分布式存储
- 分组：教程目录
在上一节中我们一起搭建了一个单节点的FastDFS系统，但是仅仅将系统搭建起来是远远不够的，必须要对FastDFS进行配置才能使系统正确的运行。

## 一、环境声明

我们还是像上一次一样首先说一下环境。我们采用VirtualBox安装了Ubuntu 14.04 TLS 64位虚拟机，采用网桥网卡，所以虚拟机会有一个和本机在同一网段的IP地址，这么做的目的是为了配置完成后在本机访问虚拟机的服务器，检查文件是否真正的能够下载下来。

本文所有的命令均在root用户下执行。

## 二、配置Tracker Server

修改%FastDFS%/conf/tracker.conf文件,修改如下

```java
base_path=/home/xing/fastdfs  
```

可以自己指定目录位置，但目录必须存在，用于存储日志及storage server等信息，否则tracker server无法启动

如果你的http端口已经被占用了，那么就要将它改成其他的端口，默认的端口为8080，如果你的机器中8080被apache占用，那么这里也可以用8080，因为FastDFS实际上就是用的apache，我这里保持不变

```java
http.server_port=8080 
```

为系统保留的存储区域，默认为10%，这里我保持默认

```java
reserved_storage_space = 10%
```

这里是tracker server对storage server供服务的端口，使用默认的即可

```java
port=22122  
```

其他的选项都保持默认。执行下面的命令来启动Tracker Server。

```java
fdfs_trackerd %FastDFS%/conf/tracker.conf
```

进入/home/xing/fastdfs/logs/trackerd.log查看tracker的启动日志，如果看到类似的信息，则说明启动成功。

## 三、配置Storage Server

修改%FastDFS%/conf/storage.conf文件。

与tracker.conf一样，我们设置相同的目录，这个目录用来存储log和group内的相关信息。

```java
base_path=/home/xing/fastdfs  
```

文件的存储位置，在一台storage server上可以指定多个存储位置,为了便于管理我简单的将存储位置和刚刚的存储日志的目录设为一样的，其实你可以根据的自己的需要变更这个目录，上传到服务器的文件就存储在这个目录下。

```java
store_path0=/home/xing/fastdfs
```

这个服务器所属的group，必须指定，默认就为group1。

```java
group_name=group1  
```

修改成tracker server的IP和端口信息，根据自己的实际情况进行修改，每个人的都不一样。

```java
tracker_server=211.87.226.134:22122
```

配置完成后，我们使用如下的命令来启动Storage Server。

```java
fdfs_storaged %FastDFS%/conf/storage.conf
```

这个时候会创建一大堆目录，等待完成时到/home/xing/fastdfs/logs/storage.log下查看log,如果看到类似的信息就说明成功了。
