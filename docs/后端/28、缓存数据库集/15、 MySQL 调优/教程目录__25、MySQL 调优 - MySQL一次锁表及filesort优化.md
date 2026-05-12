# 25、MySQL 调优 - MySQL一次锁表及filesort优化
- 来源：https://ddkk.com/zhuanlan/db/mysql/3/25.html
- 分类：缓存数据库
- 分组：教程目录
## 一. 问题描述

朋友的数据库应用最近反馈比较慢。

他的需求是首先获取表的一行数据，为了避免并发的冲突，先锁定，然后再更新数据的状态。

## 二. 解决方案

锁定语句

```java
SELECT id,col1
FROM tab_name
WHERE status=0 and isread=0  and id >=501 
ORDER BY col2 LIMIT 1 FOR UPDATE;
```

这个语句的需求是更新前把行锁住，避免丢失更新或重复更新。

那么问题来了，status和isread两列都没索引，导致这个语句是全表锁，并发高的情况下，获取全表锁的资源开销就真的太大了。

观察了数据的分布后，给status列创建了索引，表锁变为行锁。

最后观察两天日志，问题依旧。

**查下执行计划:**

原来是根据col2列排序导致的，和朋友确认了下，可以根据id进行排序，直接在索引上就完成了排序，问题最终解决。
