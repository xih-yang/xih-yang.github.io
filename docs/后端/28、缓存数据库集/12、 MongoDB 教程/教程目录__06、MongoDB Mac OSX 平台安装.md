# 06、MongoDB Mac OSX 平台安装
- 来源：https://ddkk.com/zhuanlan/db/mongodb/6.html
- 分类：缓存数据库
- 分组：教程目录
## 下载安装

MongoDB 提供了 OSX 平台上 64 位的安装包，可以在官网下载安装包

下载地址 : [https://www.mongodb.com/download-center#community](https://www.mongodb.com/download-center#community)

> 从MongoDB 3.0 版本开始只支持 OS X 10.7 (Lion) 版本及更新版本的系统

接下来我们使用 curl 命令来下载安装

```sh
$ cd /usr/local  # 进入 /usr/local
$ sudo curl -O https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.4.9.tgz
$ sudo tar -zxvf mongodb-osx-x86_64-3.4.9.tgz  # 解压
$ sudo mv mongodb-osx-x86_64-3.4.9 mongodb     # 重命名为 mongodb 目录
```

安装完成后，我们可以把 MongoDB 的二进制命令文件目录（/usr/local/mongodb/bin）添加到 PATH 路径中

使用以下命令编辑 **.bashrc**

```sh
$ vi ~/.bashrc
```

然后添加以下信息到文件末尾

```sh
export PATH=/usr/local/mongodb/bin:$PATH
```

## 使用 brew 安装

通过brew 安装 MongoDB 非常方便快捷的

```sh
$ brew install mongodb
```

如果要安装支持 TLS/SSL 版本则使用如下命令

```sh
$ brew install mongodb --with-openssl
```

安装最新开发版本

```sh
$ brew install mongodb --devel
```

## 运行 MongoDB

**1、** 首先创建一个数据库存储目录/data/db；

```sh
sudo mkdir -p /data/db
```

启动mongodb，默认数据库目录即为 /data/db

```sh
$ mongod
```

如果没有设置 PATH，则需要进入以下目录

```sh
$ cd /usr/local/mongodb/bin
$ ./mongod
```

再打开一个终端进入执行以下命令：

```sh
$ cd /usr/local/mongodb/bin 
$ ./mongo
MongoDB shell version v3.4.9
connecting to: mongodb://127.0.0.1:27017
MongoDB server version: 3.4.9
> 
```

> 如果你的数据库目录不是 /usr/local/mongodb/db ，可以通过 –dbpath 来指定
