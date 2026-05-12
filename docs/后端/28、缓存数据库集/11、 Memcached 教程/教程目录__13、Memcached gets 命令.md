# 13、Memcached gets 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/13.html
- 分类：缓存数据库
- 分组：教程目录
Memcached gets 命令获取带有 CAS 令牌存 的 **value(数据值)** ，

## 语法

```sh
gets key
```

多个key 使用空格隔开:

```sh
gets key1 key2 key3
```

- key ：键值 key-value 结构中的 key，用于查找缓存值

返回结果中，最后一列的数字为 **CAS** 令牌

如果key 不存在，则返回空

### 范例

使用gets 命令的输出结果中，在最后一列的数字 1 代表了 key 为 DDKK.COM 弟弟快看，程序员编程资料站 的 CAS 令牌

只 **gets** 一个 key

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
gets site
VALUE site 0 11 18
ddkk.com
END
```

#### gets** 多个 key

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
gets site age
VALUE site 0 11 18
ddkk.com
VALUE age 0 2 19
28
END
```

#### gets** 多个 key 中有一个 key 不存在

那么不存在的那个 key 则不会返回任何信息

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
gets site age name
VALUE site 0 11 18
ddkk.com
VALUE age 0 2 19
28
END
```

#### gets** 一个不存在的 key

```sh
flush_all
OK
gets site
END
```
