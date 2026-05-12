# 03、FastDFS 教程 - FastDFS 的 HTTP 访问
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/3.html
- 分类：分布式存储
- 分组：教程目录
## 一、概述

在文件上传的时候，上传成功的信息中有提示我们可以通过某个路径去访问上传的文件，但是我们直接访问这个路径，却不可以，那么已经上传到 FastDFS 文件系统中的文件，我们如何在浏览器中访问呢 ？

FastDFS 提供了一个 Nginx 扩展模块，利用该模块，我们可以通过 Nginx 访问已经上传到FastDFS 上的文件。

## 二、准备工作

**将FastDFS 的 Nginx 扩展模块源代码上传到 Linux 上**

**解压下载下来的 fastdfs-nginx-module-master.zip 文件**

## 三、安装 Nginx 并且添加 FastDFS 模块

因为这个模块必须在 Nginx 的安装的过程中才能添加，所有我们需要重新安装一个 Nginx，为了和原来已安装的 Nginx 进行区分，我们把新安装的 Nginx 取名为 nginx_fdfs。

A、将Nginx 的 tar 包上传到 Linux 上

B、解压上传的 Nginx 文件

C、切换至解压后的Nginx主目录，执行配置操作

`cdnginx-1.14.2`

`./configure --prefix=/usr/local/nginx_fdfs --add-module=/home/soft/fastdfs-nginx-module-master/src`

–prefix 是指定 nginx 安装路径

–add-module 指定 fastDFS 的 nginx 模块的源代码路径

D、编译并安装

执行`make` 与 `make install` 命令

## 四、FastDFS 的 Nginx 访问配置

A、将/home/soft/fastdfs-nginx-module-master/src (自己实际存放Nginx扩展模块的目录) 目录下的 mod_fastdfs.con f文件拷贝到 /etc/fdfs/ 目录下，这样才能正常启动 Nginx。

B、修改 mod_fastdfs.conf 配置文件

```java
base_path=/opt/fastdfs/nginx_mod
tracker_server=192.168.160.133:22122
url_have_group_name = true
store_path0=/opt/fastdfs/storage/files
```

C、在/opt/fastdfs/ 目录下创建 nginx_mod 目录

D、配置Nginx的配置文件

拦截请求路径中包含 /group[1-9]/M0[0-9] 的请求，用 fastdfs的Nginx 模块进行转发

```java
location ~ /group[1-9]/M0[0-9] {	
     ngx_fastdfs_module;  
}
```

`ngx_fastdfs_module`：

这个指令不是 Nginx 本身提供的，是扩展模块提供的，根据这个指令找到 FastDFS 提供的Nginx 模块配置文件，然后找到 Tracker，最终找到 Stroager

## 五、FastDFS 的 Nginx 访问启动与测试

**启动带有 FastDFS 模块的 Nginx**

**重启或启动 FastDFS 服务进程**

```java
fdfs_trackerd /etc/fdfs/tracker.conf restart
fdfs_storaged /etc/fdfs/storage.conf restart
```

**上传一个文件进行测试验证**

**浏览器输入红框中的地址访问**

当遇到400错误，

检查配置/etc/fdfs/mod_fastdfs.confurl_have_group_name=true

该配置表示访问路径中是否需要带有group1，改为true表示路径中需要有group1。
