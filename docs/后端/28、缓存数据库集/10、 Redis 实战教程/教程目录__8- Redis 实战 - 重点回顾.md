# 8- Redis 实战 - 重点回顾
- 来源：https://ddkk.com/zhuanlan/db/redis-action/8.html
- 分类：缓存数据库
- 分组：教程目录
- Redis 只会使用 C 字符串作为字面量， 在大多数情况下， Redis 使用 SDS （Simple Dynamic String，简单动态字符串）作为字符串表示。
- 比起 C 字符串， SDS 具有以下优点：

1. 常数复杂度获取字符串长度。
2. 杜绝缓冲区溢出。
3. 减少修改字符串长度时所需的内存重分配次数。
4. 二进制安全。
5. 兼容部分 C 字符串函数。
