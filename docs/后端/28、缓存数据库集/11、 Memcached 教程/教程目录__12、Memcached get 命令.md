# 12、Memcached get 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/12.html
- 分类：缓存数据库
- 分组：教程目录
Memcached get 命令获取存储在 **键(key)** 中的 **数据值(value)**

## 语法

```sh
get key
```

多个key 使用空格隔开

```sh
get key1 key2 key3
```

- key ： 键值对 key-value 结构中的 key，用于查找缓存值

如果key 不存在，则返回空

### 范例

#### 1. get 单个 key

这个范例中，我们设置键 site 的值为 ddkk.com 存活时间设置为 1000 秒

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

#### 2. get 多个 key

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
get site age
VALUE site 0 11
ddkk.com
VALUE age 0 2
28
END
```

#### 3. get 一个不存在的 key 返回空

```sh
flush_all
OK
get site
END
```

#### 4. get 多个key，有一个key不存在，则那个key 返回空

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
get site age
VALUE site 0 11
ddkk.com
END
```
