# 18、Memcached stats items 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/18.html
- 分类：缓存数据库
- 分组：教程目录
Memcached stats items 命令用于显示各个 **slab** 中 **item** 的数目和存储时长(最后一次访问距离现在的秒数)

### 语法

```sh
stats items
```

## 范例

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
stats items
STAT items:1:number 2
STAT items:1:age 477
STAT items:1:evicted 0
STAT items:1:evicted_nonzero 0
STAT items:1:evicted_time 0
STAT items:1:outofmemory 0
STAT items:1:tailrepairs 0
STAT items:1:reclaimed 0
STAT items:1:expired_unfetched 0
STAT items:1:evicted_unfetched 0
STAT items:1:crawler_reclaimed 0
STAT items:1:crawler_items_checked 0
STAT items:1:lrutail_reflocked 0
END
```
