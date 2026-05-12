# 8、Memcached replace 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/8.html
- 分类：缓存数据库
- 分组：教程目录
Memcached replace 命令用于替换已存在的 **key(键)** 的 **value(数据值)**

### 语法

```sh
replace key flags exptime bytes [noreply]
value
```

### 参数说明

- **key** : 键值 key-value 结构中的 key，用于查找缓存值。
- **flags** ：可以包括键值对的整型参数，客户机使用它存储关于键值对的额外信息
- **exptime** ：在缓存中保存键值对的时间长度（以秒为单位，0 表示永远）
- **bytes** ：在缓存中存储的字节数
- **noreply** ：可选, 该参数告知服务器不需要返回数据
- **value** ：存储的值（始终位于第二行）（可直接理解为key-value结构中的value）

### 返回值说明

- 如果数据替换成功，返回 **STORED**
- 如果键不存在，返回 **NOT_STORED**
- 如果执行错误，返回 **CLIENT_ERROR**

### 范例

#### 1. 数据替换成功，返回 **STORED

```sh
flush_all
OK
set greeting 0 1000 11
hello,world
STORED
replace greeting 0 1000  17
hello,ddkk.com
STORED
```

#### 2. 如果键不存在，返回 NOT_STORED

```sh
flush_all
OK
replace greeting 0 1000 17
hello,ddkk.com
NOT_STORED
```
