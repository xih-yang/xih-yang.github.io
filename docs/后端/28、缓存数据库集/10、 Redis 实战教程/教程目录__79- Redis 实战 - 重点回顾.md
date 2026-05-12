# 79- Redis 实战 - 重点回顾
- 来源：https://ddkk.com/zhuanlan/db/redis-action/79.html
- 分类：缓存数据库
- 分组：教程目录
## 重点回顾

- Redis 的慢查询日志功能用于记录执行时间超过指定时长的命令。
- Redis 服务器将所有的慢查询日志保存在服务器状态的 slowlog 链表中， 每个链表节点都包含一个 slowlogEntry 结构， 每个slowlogEntry 结构代表一条慢查询日志。
- 打印和删除慢查询日志可以通过遍历 slowlog 链表来完成。
- slowlog 链表的长度就是服务器所保存慢查询日志的数量。
- 新的慢查询日志会被添加到 slowlog 链表的表头， 如果日志的数量超过 slowlog-max-len 选项的值， 那么多出来的日志会被删除。
