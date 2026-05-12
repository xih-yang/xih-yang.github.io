# 10、Memcached prepend 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/10.html
- 分类：缓存数据库
- 分组：教程目录
Memcached prepend 命令用于向已存在 **key(键)** 的 **value(数据值)** 前面追加数据

## 语法

```sh
prepend key flags exptime bytes [noreply]
value
```

### 参数说明

- **key：** 键值 key-value 结构中的 key
- **flags** ：可以包括键值对的整型参数，客户机使用它存储关于键值对的额外信息
- **exptime** ：在缓存中保存键值对的时间长度（以秒为单位，0 表示永远）
- **bytes** ：在缓存中存储的字节数
- **noreply**: 可选，该参数告知服务器不需要返回数据
- **value** ：存储的值（始终位于第二行）（可直接理解为key-value结构中的value）

### 返回值说明

- 如果数据添加成功，返回 **STORED**
- 如果键不存在，返回 **NOT_STORED**
- 如果执行错误，返回 **CLIENT_ERROR**

## 范例

#### 1. 如果数据添加成功返回 **STORED

```sh
flush_all
OK
set site 0 1000 7
souyunku.cn
STORED
get site
VALUE site 0 7
souyunku.cn
END
prepend site 0 1000 4
www.
STORED   # 添加成功
get site
VALUE site 0 11
ddkk.com
END
```

#### 2. 如果键不存在，返回 **NOT_STORED

```sh
flush_all
OK
prepend site 0 1000 4
www.
NOT_STORED
```
