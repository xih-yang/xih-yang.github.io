# 5、Memcached quit 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/5.html
- 分类：缓存数据库
- 分组：教程目录
Memcached quit 命令用户关闭一个客户端连接

## 语法

```sh
quit
```

### 范例

连接到127.0.0.1 上 11211 的 Memcached 服务, 然后退出

```sh
$ telnet 127.0.0.1 11211
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
quit                                # 退出
Connection closed by foreign host.  # 从返回信息看是 Memcached 主动关闭了连接
```
