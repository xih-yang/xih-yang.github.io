# 21- Redis 实战 - 跳跃表 API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/21.html
- 分类：缓存数据库
- 分组：教程目录
表5-1 列出了跳跃表的所有操作 API 。

表5-1 跳跃表 API

函数
作用
时间复杂度

zslCreate
创建一个新的跳跃表。

zslFree
释放给定跳跃表，以及表中包含的所有节点。
 ， N 为跳跃表的长度。

zslInsert
将包含给定成员和分值的新节点添加到跳跃表中。
平均  ， N 为跳跃表长度。

zslDelete
删除跳跃表中包含给定成员和分值的节点。
平均  ， N 为跳跃表长度。

zslGetRank
返回包含给定成员和分值的节点在跳跃表中的排位。
平均  ， N 为跳跃表长度。

zslGetElementByRank
返回跳跃表在给定排位上的节点。
平均  ， N 为跳跃表长度。

zslIsInRange
给定一个分值范围（range）， 比如 0 到 15 ， 20 到 28，诸如此类， 如果给定的分值范围包含在跳跃表的分值范围之内， 那么返回 1 ，否则返回 0 。
通过跳跃表的表头节点和表尾节点， 这个检测可以用  复杂度完成。

zslFirstInRange
给定一个分值范围， 返回跳跃表中第一个符合这个范围的节点。
平均  。 N 为跳跃表长度。

zslLastInRange
给定一个分值范围， 返回跳跃表中最后一个符合这个范围的节点。
平均  。 N 为跳跃表长度。

zslDeleteRangeByScore
给定一个分值范围， 删除跳跃表中所有在这个范围之内的节点。
 ， N 为被删除节点数量。

zslDeleteRangeByRank
给定一个排位范围， 删除跳跃表中所有在这个范围之内的节点。
 ， N 为被删除节点数量。

|
