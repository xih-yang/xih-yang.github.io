# 21、Memcached flush_all 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/21.html
- 分类：缓存数据库
- 分组：教程目录
Memcached flush_all 命令用于清空缓存。

也就是删除缓存中的所有 **key=>value(键=>值)** 对

## 语法

```sh
flush_all [time] [noreply]
```

- **time** 参数是可选的，单位秒。 如果设置了值，则表示 Memcached 将在这个时间后才执行清空操作
- **noreply** 参数是可选的，如果设置了值，则表示 Memcached 服务不用返回信息

> flush_all noreply 命令没有任何效果的,因为它本来就没数据返回

## 范例

#### 1 . 不带任何参数

```sh
set site 0 1000 11
ddkk.com
STORED
get site
VALUE site 0 11
ddkk.com
END
flush_all
OK
get site
END
```

#### 2. 10s 后清空缓存

```sh
set site 0 1000 11
ddkk.com
STORED
get site
VALUE site 0 11
ddkk.com
END
flush_all 10  # 设置 10秒后清空缓存
OK
get site   # 立刻获取有返回
VALUE site 0 11
ddkk.com
END
get site  # 等待10s后获取则没有返回
END
```
