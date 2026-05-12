# 6、Memcached set 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/6.html
- 分类：缓存数据库
- 分组：教程目录
Memcached set 命令用于将 **value(数据值)** 存储在指定的 **key(键)** 中

### 语法：

```sh
set key flags exptime bytes [noreply] 
value
```

#### 范例

如果我们设置一个 key 为 site ,值为 ddkk.com, 过期时间为 1000 秒的键值对，那么命令一般如下

```sh
set site 0 1000 11
ddkk.com
```

参数说明

- **key** ： 键值 key-value 结构中的 key，用于查找缓存值。
- **flags** ：可以包括键值对的整型参数，客户机使用它存储关于键值对的额外信息
- **exptime** ：在缓存中保存键值对的时间长度（以秒为单位，0 表示永远）
- **bytes** ：在缓存中存储的字节数
- **noreply** ：可选， 该参数告知服务器不需要返回数据
- **value** ：存储的值（始终位于第二行）（可直接理解为key-value结构中的value）

### 返回值说明

- 如果数据设置成功，返回 **STORED**
- 如果 key 已经存在，不管有没有过期都会更新数据，返回值为 **STORED**
- 如果执行错误，返回 **CLIENT_ERROR**

## 范例

#### 1. 如果数据设置成功，返回 **STORED

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
get site
VALUE site 0 11
ddkk.com
END
```

#### 2. 如果 key 已经存在

如果key 已经存在，不管有没有过期都会更新数据，返回值为 **STORED**

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
get site
VALUE site 0 11
ddkk.com
END
set site 0 1000 7
souyunku.cn
STORED
get site
VALUE site 0 7
souyunku.cn
END
```
