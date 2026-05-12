# 32- Redis 实战 - 压缩列表 API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/32.html
- 分类：缓存数据库
- 分组：教程目录
表7-4 列出了所有用于操作压缩列表的 API 。

表7-4 压缩列表 API

函数
作用
算法复杂度

ziplistNew
创建一个新的压缩列表。

ziplistPush
创建一个包含给定值的新节点， 并将这个新节点添加到压缩列表的表头或者表尾。
平均  。

ziplistInsert
将包含给定值的新节点插入到给定节点之后。
平均  。

ziplistIndex
返回压缩列表给定索引上的节点。

ziplistFind
在压缩列表中查找并返回包含了给定值的节点。
因为节点的值可能是一个字节数组， 所以检查节点值和给定值是否相同的复杂度为  。

ziplistNext
返回给定节点的下一个节点。

ziplistPrev
返回给定节点的前一个节点。

ziplistGet
获取给定节点所保存的值。

ziplistDelete
从压缩列表中删除给定的节点。
平均  。

ziplistDeleteRange
删除压缩列表在给定索引上的连续多个节点。
平均  。

ziplistBlobLen
返回压缩列表目前占用的内存字节数。

ziplistLen
返回压缩列表目前包含的节点数量。
节点数量小于 65535 时  。

因为ziplistPush 、 ziplistInsert 、 ziplistDelete 和 ziplistDeleteRange 四个函数都有可能会引发连锁更新， 所以它们的最坏复杂度都是  。
