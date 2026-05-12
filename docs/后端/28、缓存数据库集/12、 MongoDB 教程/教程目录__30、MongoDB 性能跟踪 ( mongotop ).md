# 30、MongoDB 性能跟踪 ( mongotop )
- 来源：https://ddkk.com/zhuanlan/db/mongodb/30.html
- 分类：缓存数据库
- 分组：教程目录
mongotop MongoDB 下的一个内置工具

mongotop 提供了一个方法，用来跟踪一个 MongoDB的实例，查看哪些大量的时间花费在读取和写入数据

mongotop 提供每个集合的水平的统计数据

默认情况下，mongotop 每秒输出一次数据

### 语法

MongoDB **mongotop** 脚本命令语法如下

```sh
$ mongotop <sleeptime> --locks
```

### 参数解析

- 指定多久输出一次数据

默认为 1 秒
- --locks

输出锁使用的情况

### 范例

#### 默认参数范例

```sh
$ mongotop
```

输出结果如下

```sh
$ mongotop 
2017-10-24T07:39:50.970+0800    connected to: 127.0.0.1
                      ns    total    read    write    2017-10-24T07:39:51+08:00
    admin.system.indexes      0ms     0ms      0ms                             
 admin.system.namespaces      0ms     0ms      0ms                             
      admin.system.roles      0ms     0ms      0ms                             
      admin.system.users      0ms     0ms      0ms                             
    admin.system.version      0ms     0ms      0ms                             
        gridfs.fs.chunks      0ms     0ms      0ms                             
         gridfs.fs.files      0ms     0ms      0ms                             
   gridfs.system.indexes      0ms     0ms      0ms                             
gridfs.system.namespaces      0ms     0ms      0ms                             
       local.startup_log      0ms     0ms      0ms
```

#### 带参数范例

```sh
$ mongotop 10
```

输出结果如下

```sh
$ mongotop 10                              
2017-10-24T07:43:41.990+0800    connected to: 127.0.0.1
                      ns    total    read    write    2017-10-24T07:43:51+08:00
    admin.system.indexes      0ms     0ms      0ms                             
 admin.system.namespaces      0ms     0ms      0ms                             
      admin.system.roles      0ms     0ms      0ms                             
      admin.system.users      0ms     0ms      0ms                             
    admin.system.version      0ms     0ms      0ms                             
        gridfs.fs.chunks      0ms     0ms      0ms                             
         gridfs.fs.files      0ms     0ms      0ms                             
   gridfs.system.indexes      0ms     0ms      0ms                             
gridfs.system.namespaces      0ms     0ms      0ms                             
       local.startup_log      0ms     0ms      0ms
                      ns    total    read    write    2017-10-24T07:44:01+08:00
    admin.system.indexes      0ms     0ms      0ms                             
 admin.system.namespaces      0ms     0ms      0ms                             
      admin.system.roles      0ms     0ms      0ms                             
      admin.system.users      0ms     0ms      0ms                             
    admin.system.version      0ms     0ms      0ms                             
        gridfs.fs.chunks      0ms     0ms      0ms                             
         gridfs.fs.files      0ms     0ms      0ms                             
   gridfs.system.indexes      0ms     0ms      0ms                             
gridfs.system.namespaces      0ms     0ms      0ms                             
       local.startup_log      0ms     0ms      0ms
```

后面的10是 参数 ，可以不使用，等待的时间长度，以秒为单位 mongotop 等待调用之间

#### 输出锁使用的情况

```sh
$ mongotop --locks
```

报告每个数据库的锁的使用中

输出结果如下

输出结果字段说明

- **ns：**

包含数据库命名空间，后者结合了数据库名称和集合。

- **db：**

包含数据库的名称。名为 . 的数据库针对全局锁定，而非特定数据库。

- **total：**

mongod 花费的时间工作在这个命名空间提供总额。

- **read：**

提供了大量的时间，这mongod花费在执行读操作，在此命名空间

- **write：**

提供这个命名空间进行写操作，这 mongod 花了大量的时间
