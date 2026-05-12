# 08、MongoDB 连接
- 来源：https://ddkk.com/zhuanlan/db/mongodb/8.html
- 分类：缓存数据库
- 分组：教程目录
### 启动 MongoDB 服务

经过前面的几章学习，我们知道如何 如何启动 MongoDB 服务

```sh
只需要在 MongoDB 安装目录的 bin 目录下执行 mongod 即可
```

执行启动操作后，mongodb 会输出一些必要信息后，然后等待客户端连接的建立，当连接被建立后，就会开始打印日志信息

### MongoDB 客户端

我们可以使用 MongoDB 自带的 shell 客户端 **mongo** 连接 MongoDB 服务

我们也可以使用使用 PHP 来连接 MongoDB

本教程我们会使用 **mongo** 来连接 Mongodb 服务

### 标准 URI 连接语法

```sh
mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
```

#### 选项说明

选项
说明

mongodb://
这是固定的格式，必须要指定

username:password@
可选项，如果设置，在连接数据库服务器之后，驱动都会尝试登陆这个数据库

host1
必须的指定至少一个host
host1 是这个URI唯一要填写的，它指定了要连接服务器的地址
如果要连接集群，请指定多个主机地址

portX
可选的指定端口，如果不填，默认为27017

/database
如果指定username:password@，连接并验证登陆指定数据库。若不指定，默认打开 test 数据库

?options
是连接选项。如果不使用/database，则前面需要加上/
所有连接选项都是键值对name=value，键值对之间通过&或;（分号）隔开

### options 可以包括以下选项

选项
描述

replicaSet=name
验证replica set的名称，Impliesconnect=replicaSet.

slaveOk=true|false
true:在connect=direct模式下，驱动会连接第一台机器，即使这台服务器不是主。在connect=replicaSet模式下，驱动会发送所有的写请求到主并且把读取操作分布在其他从服务器

false: 在 connect=direct模式下，驱动会自动找寻主服务器. 在connect=replicaSet 模式下，驱动仅仅连接主服务器，并且所有的读写命令都连接到主服务器。

safe=true|false
true: 在执行更新操作之后，驱动都会发送getLastError命令来确保更新成功。(还要参考 wtimeoutMS)

false: 在每次更新之后，驱动不会发送getLastError来确保更新成功

w=n
驱动添加

wtimeoutMS=ms
驱动添加

fsync=true|false
true: 驱动添加

journal=true|false
如果设置为 true, 同步到 journal (在提交到数据库前写入到实体中). 应用于 safe=true

connectTimeoutMS=ms
可以打开连接的时间

socketTimeoutMS=ms
发送和接受sockets的时间

### 范例

**1、** 连接到本地使用默认端口启动的MongoDB服务；

```sh
    mongodb://localhost
```

**2、** 通过shell连接MongoDB服务；

```sh
    $ mongo
    MongoDB shell version v3.4.9
    connecting to: mongodb://127.0.0.1:27017
    MongoDB server version: 3.4.9
```

```sh
这时候返回查看运行 **./mongod** 命令的窗口 可以看到是从哪里连接到 MongoDB 的服务器，输出如下信息
```

```sh
    2017-10-23T17:22:27.336+0800 I CONTROL  [initandlisten] allocator: tcmalloc
    2017-10-23T17:22:27.336+0800 I CONTROL  [initandlisten] options: { storage: { dbPath: "/data/db" } }
    2017-10-23T17:22:27.350+0800 I NETWORK  [initandlisten] waiting for connections on port 27017
    2017-10-23T17:22:36.012+0800 I NETWORK  [initandlisten] connection accepted from 127.0.0.1:37310 #1 (1 connection now open)
    # 上面该行表明一个来自本机的连接
    ……省略信息……
```

## MongoDB 连接语法格式

使用用户名和密码连接到 MongoDB 服务器，必须使用以下连接语法

```sh
username:password@hostname:port/dbname
```

- username 为用户名
- password 为密码
- hostname 为 IP 地址
- port 为端口号，如果省略，默认为 27017
- dbname 为数据库，如果省略，默认连接到 admin

### 范例

**1、** 使用用户名和密码连接登陆到默认数据库；

```sh
    $ ./mongo
    MongoDB shell version: 3.0.6
    connecting to: test
```

**2、** 使用用户名penglei和密码123456连接到本地的MongoDB服务上；

```sh
    mongodb://admin:123456@localhost/
```

**3、** 使用用户名和密码连接登陆到指定数据库；

```sh
    mongodb://admin:123456@localhost/test
```

### 更多连接范例

**1、** 连接本地数据库服务器，端口使用默认的；

```sh
    mongodb://localhost
```

**2、** 使用用户名penglei，密码123abc321登录localhost的admin数据库；

```sh
    mongodb://penglei:123abc321@localhost
```

**3、** 使用用户名penglei，密码123abc32q登录localhost的souyunku数据库；

```sh
    mongodb://penglei:123abc321@localhost/souyunku
```

**4、** 连接到MongoDB集群,服务器1为db1.souyunku.cn服务器2为db2.souyunku.cn；

```sh
    mongodb://db1.souyunku.cn:27017,db2.souyunku.cn:27017
```

**5、** 连接到本地集群，三台服务器端口为27017,27018,27019；

```sh
    mongodb://localhost,localhost:27018,localhost:27019
```

**6、** 连接集群三台服务器host1,host2,host3,写入操作应用在主服务器并且分布查询到从服务器；

```sh
    mongodb://host1,host2,host3/?slaveOk=true
```

**7、** 直接连接第一个服务器，无论是它是一部分或者主服务器或者从服务器；

```sh
    mongodb://host1,host2,host3/?connect=direct;slaveOk=true
```

```sh
当连接服务器有优先级，还需要列出所有服务器，可以使用上述连接方式
```

**8、** 安全模式连接到localhost；

```sh
    mongodb://localhost/?safe=true
```

**9、** 以安全模式连接到集群，并且等待至少两个复制服务器成功写入，超时时间设置为2秒；

```sh
mongodb://host1,host2,host3/?safe=true;w=2;wtimeoutMS=2000
```
