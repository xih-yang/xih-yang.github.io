# 19、Memcached stats slabs 命令
- 来源：https://ddkk.com/zhuanlan/db/memcached/19.html
- 分类：缓存数据库
- 分组：教程目录
Memcached stats slabs 命令用于显示各个 slab 的信息，包括chunk的大小、数目、使用情况等

## 语法

```sh
stats slabs
```

### 范例

```sh
flush_all
OK
set site 0 1000 11
ddkk.com
STORED
set age 0 1000 2
28
STORED
stats sizes
STAT 96 2
END
stats slabs  # stats slabs 命令
STAT 1:chunk_size 96  # 只用到了 slab 1 
STAT 1:chunks_per_page 10922
STAT 1:total_pages 1
STAT 1:total_chunks 10922
STAT 1:used_chunks 2
STAT 1:free_chunks 10920
STAT 1:free_chunks_end 0
STAT 1:mem_requested 151
STAT 1:get_hits 0
STAT 1:cmd_set 2
STAT 1:delete_hits 0
STAT 1:incr_hits 0
STAT 1:decr_hits 0
STAT 1:cas_hits 0
STAT 1:cas_badval 0
STAT 1:touch_hits 0
STAT active_slabs 1
STAT total_malloced 1048512
END
```
