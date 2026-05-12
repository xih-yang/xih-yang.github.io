# 27- Redis 实战 - 整数集合 API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/27.html
- 分类：缓存数据库
- 分组：教程目录
表6-1 列出了整数集合的操作 API 。

表6-1 整数集合 API

函数
作用
时间复杂度

intsetNew
创建一个新的整数集合。

intsetAdd
将给定元素添加到整数集合里面。

intsetRemove
从整数集合中移除给定元素。

intsetFind
检查给定值是否存在于集合。
因为底层数组有序，查找可以通过二分查找法来进行， 所以复杂度为  。

intsetRandom
从整数集合中随机返回一个元素。

intsetGet
取出底层数组在给定索引上的元素。

intsetLen
返回整数集合包含的元素个数。

intsetBlobLen
返回整数集合占用的内存字节数。

|
