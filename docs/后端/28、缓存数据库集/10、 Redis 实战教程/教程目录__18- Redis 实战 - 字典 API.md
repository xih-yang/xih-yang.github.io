# 18- Redis 实战 - 字典 API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/18.html
- 分类：缓存数据库
- 分组：教程目录
表4-1 列出了字典的主要操作 API 。

表4-1 字典的主要操作 API

函数
作用
时间复杂度

dictCreate
创建一个新的字典。

dictAdd
将给定的键值对添加到字典里面。

dictReplace
将给定的键值对添加到字典里面， 如果键已经存在于字典，那么用新值取代原有的值。

dictFetchValue
返回给定键的值。

dictGetRandomKey
从字典中随机返回一个键值对。

dictDelete
从字典中删除给定键所对应的键值对。

dictRelease
释放给定字典，以及字典中包含的所有键值对。
 ， N 为字典包含的键值对数量。
