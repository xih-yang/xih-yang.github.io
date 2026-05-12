# 05、MongoDB Linux 平台安装
- 来源：https://ddkk.com/zhuanlan/db/mongodb/5.html
- 分类：缓存数据库
- 分组：教程目录
下载地址： [https://www.mongodb.com/download-center#community](https://www.mongodb.com/download-center#community)

下载完安装包，并解压 **tgz** （以下演示的是 64 位 Linux 上的安装 ）

**1、** 下载；

```sh
    curl -O https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.9.tgz
```

**2、** 解压；

```sh
    tar -zxvf mongodb-linux-x86_64-3.4.9.tgz
```

**3、** 将解压包拷贝到指定目录；

```sh
    mv  mongodb-linux-x86_64-3.4.9 /usr/local/mongodb
```

**4、** 添加PATHMongoDB的可执行文件位于bin目录下，所以可以将其添加到**PATH**路径中；

```sh
    export PATH=<mongodb-install-directory>/bin:$PATH
```

```sh
**<mongodb-install-directory>** 是 MongoDB 的安装路径  
如本文的 **/usr/local/mongodb**
```

## 创建数据库目录

MongoDB 的数据存储在 data 目录的 db 目录下

这个目录在安装过程不会自动创建，所以需要手动创建 data 目录，并在 data 目录中创建 db 目录

以下范例中我们将 data 目录创建 / 目录下

注意：/data/db 是 MongoDB 默认的启动的数据库路径 ( –dbpath )

```sh
mkdir -p /data/db
```

## 命令行中运行 MongoDB 服务

可以在MongoDB 安装目录下的 bin 目录中执行 mongod 命令来启动 MongoDB 服务

> 如果数据库目录不是 /data/db，可以通过 –dbpath 来指定

```sh
$ ./mongod
2017-10-24T10:10:10.549+0800 I JOURNAL  [initandlisten] journal dir=/data/db/journal
2017-10-24T10:10:10.550+0800 I JOURNAL  [initandlisten] recover : no journal files present, no recovery needed
2017-10-24T10:10:10.869+0800 I JOURNAL  [initandlisten] preallocateIsFaster=true 3.16
2017-10-24T10:10:11.206+0800 I JOURNAL  [initandlisten] preallocateIsFaster=true 3.52
2017-10-24T10:10:12.775+0800 I JOURNAL  [initandlisten] preallocateIsFaster=true 7.7
```

## MongoDB 后台管理 Shell

如果需要进入 MongoDB 后台管理，可以运行 MongoDB 安装目录下的 bin 目录中的 mongo 程序

MongoDB Shell 是 MongoDB 自带的交互式 Javascript shell,用来对 MongoDB 进行操作和管理的交互式环境

当进入mongoDB 后台后，它默认会链接到 test 文档（数据库）

```sh
$ cd /usr/local/mongodb/bin
$ ./mongo
MongoDB shell version v3.4.9
connecting to: mongodb://127.0.0.1:27017
MongoDB server version: 3.4.9
> 
```

因为它是一个 JavaScript shell，所以可以运行一些简单的算术运算

```sh
> 3 * 6
18
> 1+6
7
```

现在让我们插入一些简单的数据，并对插入的数据进行检索：

```sh
> db.souyunku.insert({name:"Hello MongoDB"})
WriteResult({ "nInserted" : 1 })
> db.souyunku.find()
{ "_id" : ObjectId("5604ff74a274a611b0c990aa"), "name" : "Hello MongoDB" }
>
```

第一个命令将数字 “Hello MongoDB” 插入到 souyunku 集合的 name 字段中

## MongoDb web 用户界面

MongoDB 提供了简单的 HTTP 用户界面

如果想启用该功能，需要在启动的时候指定参数 –rest

```sh
$ ./mongod --dbpath=/data/db --rest
```

MongoDB 的 Web 界面访问端口比服务的端口多 1000，默认端口是 28017
