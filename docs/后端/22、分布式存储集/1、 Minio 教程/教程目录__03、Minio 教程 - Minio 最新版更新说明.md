# 03、Minio 教程 - Minio 最新版更新说明
- 来源：https://ddkk.com/zhuanlan/filestorage/minio/1/3.html
- 分类：分布式存储
- 分组：教程目录
### 前言

众所周知，Minio的更新速度非常快，从Github中可以看到，基本都是几天就发布了一个新版本，因为公司服务器使用的是2020年的版本，在更新到2021年的最新版本时，发现了一些比较大的变化，特地写文章记录下，避免其他人踩坑。

### 启动命令

更新时使用了老版本的启动命令，发现控制台有很多警告信息。

#### 1. 设置用户名和密码的参数名过时

```java
WARNING: MINIO_ACCESS_KEY and MINIO_SECRET_KEY are deprecated.
         Please use MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
```

在之前使用MINIO_ACCESS_KEY和MINIO_SECRET_KEY设置用户名及密码的参数名过时了，最新的参数为MINIO_ROOT_USER、MINIO_ROOT_PASSWORD。

参数名换成了更加易懂的名称，之前的标记为过时了，所以设置用户时，需要注意。。。

#### 2. 控制台端口

**警告信息**：控制台端点正在侦听动态端口（63827），请使用【–console-address “:PORT” 】命令选择一个静态的端口。

```java
WARNING: Console endpoint is listening on a dynamic port (63827), please use --console-address ":PORT" to choose a static port.
```

之前我们Minio服务和控制台，都是使用的9000端口：

但是现在貌似不行了，控制台访问的端口和Minio服务的端口分开了，这样我们需要给控制台设置另外一个端口，而不能继续使用9000去访问了。

#### 解决报错信息

根据警告提示，设置新的用户名及密码参数，然后指定控制台的端口为9001，修改后的minio.cmd脚本为以下内容：

```java
# 设置用户名
set MINIO_ROOT_USER=admin
# 设置密码（8位）
set MINIO_ROOT_PASSWORD=admin123
# 指定启动端口(未指定默认9000)、控制台端口90001及存储位置
minio.exe  server  --address :9000 --console-address :9001 D:\tools\minio\data
```

重新启动，发现警告信息已排除，并且打印了minio服务API地址，控制台地址，及登录用户名密码。

### 控制台改版

升级并启动以后登录，发现控制台和之前的不一样了，多了很多内容。貌似是将mc管理界面和控制台整合在一起了。

之前的只有存储桶相关界面及操作。

接下来我们对每个菜单大概分析下。

#### Dashboard

添加了一个简单的仪表盘。分别为当前存储桶总数、已使用空间大小、所有的存储对象总数。

#### USER/Object Browser

Object Browser对象浏览，之前的控制台就对应了这个菜单。

在这里可以创建存储桶、查看对象信息、删除对象、下载等功能。

#### USER/Service Accounts

Service Accounts管理当前服务账号，可以创建、删除、修改密码等。

#### ADMIN/ Buckets

ADMIN就是管理员菜单，在Buckets菜单中，主要是管理存储桶。可以创建、删除、远程同步、设置访问策略等功能。

#### ADMIN/ Users

Users主要是管理用户，可以创建、删除、设置权限等。

#### ADMIN/ Groups

Groups主要是管理组，可以将用户划分到一组中统一管理。

#### ADMIN/ IAM Policies

Policies主要是管理访问策略（也就是权限），默认已经提供了多种策略，还可以自定义。

也可以查看策略详情，指定用户或者用户组具有当前权限。

#### ADMIN/ Settings

Settings中可以配置通知、钩子、基础设置等功能。

#### Tools

Tools主要提供了日志、监控、跟踪、诊断等维护功能。

#### 其他

其他的就是许可证、文档等菜单了。
