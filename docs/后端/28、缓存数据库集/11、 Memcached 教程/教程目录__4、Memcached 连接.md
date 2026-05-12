# 4、Memcached 连接
- 来源：https://ddkk.com/zhuanlan/db/memcached/4.html
- 分类：缓存数据库
- 分组：教程目录
可以通过 telnet 命令并指定 **主机IP** 和 **端口(port)**来连接 Memcached

## 语法

```sh
telnet HOST PORT
```

命令中的 **HOST** 和 **PORT** 为运行 Memcached 服务的 IP 和 端口。

> 11211 为所有 Memcached 服务默认的端口号

### 范例

#### 1. 连接到 127.0.0.1 上 11211 的 Memcached 服务

假设我们的 Memcached 服务运行在本机， IP 为 127.0.0.1 ,端口为 11211

那么连接到 Memcached 的命令为

```sh
telnet 127.0.0.1 11211
```

输出如下

```sh
$ telnet 127.0.0.1 11211
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
```

#### 2. 进行简单的 set 和 get 操作

```sh
$ telnet 127.0.0.1 11211    # 连接服务器
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
set site 0 1000 11          # set 命令
ddkk.com                 # 要设置的值(value)
STORED                      # 命令 执行结果
get site                    # get 命令
VALUE site 0 11             # key 的元数据
ddkk.com                 #值(value) 数据
END                         # 命令执行结束标志
quit                        # 断开与 Memcached 的连接
Connection closed by foreign host.
```
