# 06、FastDFS 教程 - FastDFS 分布式文件系统集群
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/6.html
- 分类：分布式存储
- 分组：教程目录
## 一、部署架构图

**目的**：

如果你公司刚好用这个，那你就会搭建集群

涉及到多个 Linux，你可以更进一步熟悉一下 Linux

提升自己驾驭复杂环境的能力

## 二、环境搭建步骤

搭建一个 FastDFS 分布式文件系统集群，推荐至少部署 6 个服务器节点

### 1. 安装 6 个迷你版的 Linux

迷你版Linux 没有图形界面，占用磁盘及资源小，企业里面使用的 Linux 都是没有图形界面的 Linux，在安装的时候，最少要给每一个虚拟机分配 3.5G 的内存空间，我这里分配 5G，内存我这里分配的是 512M

**A、打开 Vmware，点击创建新的虚拟机**

**B、选择典型安装**

**C、选择安装 Linux 迷你版安装文件位置**

**D、创建账户密码**

**E、指定虚拟机名称及安装位置**

**F、为虚拟机分配磁盘空间**

**G、为虚拟机分配内存**

我是8G 内存，每个虚拟机分配 512M，因为是迷你版，所以内存消耗不会太大

**H、安装开始进行到此处时，选择打开网络连接**

这个选项点进去完成一下就好，其它配置都可以默认，但是网络一定要打开，否则虚拟机之间无法通讯，安装完毕后，重启安装的 CentOS 系统。

### 2. 在 Xshell 中创建 6 个连接，分别连向不同的 Linux

### 3. 为迷你版的 Linux 安装常用工具库

由于迷你版 Linux 缺少一些常用的工具库，操作起来不方便，推荐安装如下的工具库

- 安装 lrzsz，yum install lrzsz -y
- 安装 wget，yum install wget -y
- 安装 vim， yum install vim -y
- 安装 unzip，yum install unzip -y
- 安装 ifconfig，yum install net-tools -y

`yum install lrzsz wget vim unzip net-tools –y`

打开撰写栏，方便批量执行命令

**按照课件上安装 FastDFS 的步骤在 6 个服务器节点安装 FastDFS**

### 4. 配置两个 tracker server 服务器

为了方便操作，我们再启动一次 Xshell，一个 Xshell 操作 Tracker，另一个操作 Storage，将 Tracker 和 Storage 分开。

## 需要完成的操作 ：

①把/etc/fdfs 目录下的配置文件 .sample 后缀都去掉

②修改两个 tracker 服务器的配置文件：

> tracker.conf 修改一个地方： base_path=/opt/fastdfs/tracker
>
> 设置 tracker 的数据文件和日志目录 (需预先创建)

③创建存放数据的目录

### 5. 配置四个 storage server 服务器

每两个storage server 为一组，共两个组(group1 和 group2) ，一个组内有两个 storage server。

**①修改第一组 group1 的第一个 storage server (修改 storage.conf 配置文件)**

```java
group_name=group1  组名，根据实际情况修改，值为 group1 或 group2
base_path=/opt/fastdfs/storage  设置storage的日志目录（需预先创建）
store_path0=/opt/fastdfs/storage/files  存储路径
tracker_server=192.168.235.129:22122  tracker服务器的IP地址和端口号,配2个
tracker_server=192.168.235.130:22122
```

**②第一个组的第二个 storage 按照相同的步骤操作**

或者将第一组的配置文件下载到桌面上，然后上传覆盖第一组的第二个storage

**③第二组的两个 storage 也按照相同的步骤操作，唯一的区别是group_name=group2，**

可以在桌面上对第一个组的 storage 文件进行修改，将组名修改为group2，然后上传覆盖

至此，一个FastDFS的分布式文件系统集群就搭建好了。

**④注意：配置文件中不要出现中文，另外别忘了创建配置文件中指定的目录**

**⑤启动两个 tracker，再启动四个 storage**

**⑥关闭6个Linux防火墙，并进行测试**

测试的Java 程序中

> 修改配置文件为两个tracker
>
> 测试负载均衡：tracker.conf文件 ，修改 store_lookup=0 表示轮讯策略

### 6. 部署 Http 访问 FastDFS 上的文件

#### ① 先完成 4 个 storage server 的 Nginx 访问

这4个 Nginx 需要去 FastDFS 找对应的文件，所以需要安装 FastDFS 的 Nginx 扩展模块

**A、配置带有FastDFS扩展模块的Nginx**

> 1、在四个 storage server 上安装 Nginx，并且加入 FastDFS 扩展模块
>
> 2、修改两组 4 个 storage 的 Nginx 扩展模块配置文件 mod_fastdfs.conf

```java
base_path=/opt/fastdfs/nginx_mod保存日志目录(需提前创建)
tracker_server=192.168.230.129:22122 tracker服务器的IP地址以及端口号
tracker_server=192.168.230.130:22122
group_name=group1 当前服务器的group名，第二组应配置为group2
url_have_group_name=true    文件url中是否有group名
store_path_count=1          存储路径个数，需要和store_path个数匹配（一般不用改）
store_path0=/opt/fastdfs/storage/files   存储路径
group_count=2                  设置组的个数
```

在末尾增加2个组的具体信息：

[group1]

```java
group_name=group1
storage_server_port=23000
store_path_count=1
store_path0=/opt/fastdfs/storage/files
```

[group2]

```java
group_name=group2
storage_server_port=23000
store_path_count=1
store_path0=/opt/fastdfs/storage/files
```

**B、第一组的第二台和上面的配置一样**

**C、第二组的两台只需要把 group_name=group2 即可**

**D、至此，mod_fastdfs.conf就配置好了。**

#### ② 配置两组4个 storage 的 Nginx 拦截请求路径：

```java
location ~ /group[1-9]/M0[0-9] {
    ngx_fastdfs_module;
}
```

至此4个 storage 服务器上的 Nginx 就搭建配置OK了。

然后可以进行测试：

```java
重启storage，启动Nginx
http://192.168.119.128:80/group1/M00/00/00/wKh3jVx6FUCARyK2AAAANaS4cxw338.txt 
http://192.168.92.132:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt
http://192.168.92.133:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt
http://192.168.92.134:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt
```

**注意：每一台都可以访问到，就算是当前组中没有改文件，因为向浏览器中发送请求的时候**

- 交给 Nginx 进行 location 匹配
- 匹配上之后调用 FastDFS 的扩展模块
- 扩展模块会读取扩展模块配置文件 mod_fast.conf
- 通过扩展模块配置文件，找到对应的 Tracker，从而找到对应的文件

#### ③ 在两个 tracker server 安装 Nginx

这两个Nginx只需要做负载均衡，不要找文件，所以不需要安装扩展模块

#### ④ 配置两个 tracker server 服务器上的 Nginx 访问

部署配置 Nginx 负载均衡

```java
upstream fastdfs_storage_server {
    server 192.168.92.131:80;  
    server 192.168.92.132:80;
    server 192.168.92.133:80;  
    server 192.168.92.134:80;  
}
```

```java
#nginx拦截请求路径：
location ~ /group[1-9]/M0[0-9] {
    proxy_pass http://fastdfs_storage_server; 
}
```

至此，两个 tracker 服务器的 Nginx 就搭建配置 OK 了。

启动两个 tracker 服务器的 Nginx 进行测试。

```java
http://192.168.92.129:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt
http://192.168.92.130:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt
```

#### ⑤ 部署前端用户访问入口服务器，该 Nginx 负载均衡到后端2个tracker server

这个Nginx 也只需要做负载均衡，不要找文件，所以不需要安装扩展模块，可以对 Windows 上的 Nginx 进行配置。

部署配置 Nginx 负载均衡:

```java
upstream fastdfs_tracker_server {
    server 192.168.92.129:80;  
    server 192.168.92.130:80;  
}
#nginx拦截请求路径：
location ~ /group[1-9]/M0[0-9] {
    proxy_pass http://fastdfs_tracker_server; 
}
```

访问：`http://127.0.0.1:80/group1/M00/00/00/wKhchFv7xQeAQbrBAAAALDPVPvc081.txt`

至此，一个三层结构的 Nginx 访问架构就搭建配置 OK 了。为了保证高可用性，一般在入口出，会添加一个备用 Nginx 上，中间通过一个 KeepAlive 软件连接。

**最后，为了让服务能正常连接tracker，请关闭所有机器的防火墙：**

```java
systemctl status firewalld
systemctl disable firewalld
systemctl stop firewalld
```
