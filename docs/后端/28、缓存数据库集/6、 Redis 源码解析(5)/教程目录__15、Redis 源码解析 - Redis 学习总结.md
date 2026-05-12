# 15、Redis 源码解析 - Redis 学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/15.html
- 分类：缓存数据库
- 分组：教程目录
### 1 方法列表

```java
robj *setTypeCreate(robj *value)
int setTypeAdd(robj *subject, robj *value)
int setTypeRemove(robj *setobj, robj *value)
int setTypeIsMember(robj *subject, robj *value) 
setTypeIterator *setTypeInitIterator(robj *subject)
void setTypeReleaseIterator(setTypeIterator *si)
int setTypeNext(setTypeIterator *si, robj **objele, int64_t *llele)
robj *setTypeNextObject(setTypeIterator *si)
int setTypeRandomElement(robj *setobj, robj **objele, int64_t *llele)
unsigned long setTypeSize(robj *subject)
void setTypeConvert(robj *setobj, int enc)
void saddCommand(redisClient *c)
void sremCommand(redisClient *c)
void smoveCommand(redisClient *c) 
void sismemberCommand(redisClient *c)
void scardCommand(redisClient *c)
void spopCommand(redisClient *c)
void srandmemberWithCountCommand(redisClient *c)
void srandmemberCommand(redisClient *c)
int qsortCompareSetsByCardinality(const void *s1, const void *s2)
int qsortCompareSetsByRevCardinality(const void *s1, const void *s2)
void sinterGenericCommand(redisClient *c, robj **setkeys, unsigned long setnum, robj *dstkey)
void sinterCommand(redisClient *c)
void sinterstoreCommand(redisClient *c) 
void sunionDiffGenericCommand(redisClient *c, robj **setkeys, int setnum, robj *dstkey, int op)
void sunionCommand(redisClient *c)
void sunionstoreCommand(redisClient *c)
void sdiffCommand(redisClient *c)
void sdiffstoreCommand(redisClient *c)
void sscanCommand(redisClient *c)
```

### 2 学习总结

**1、** 集合类型有两种底层数据结构，一种是整数集合，一种是哈希表；

**2、** 集合类型再添加元素的时候，会判断是否要转变数据结构；

**3、** 是否要转变数据结构判断标准是，集合长度是否超过配置，集合元素类型是否不为数字；

**4、** sadd和srem都可以同时操作多个元素；

**5、** checkType方法定义在object.c中，主要逻辑时判断对象的类型和传入的类型是否相等；

**6、** spop是从集合中随机弹出一个元素；

### 3 学习感悟

Redis中集合类型的底层数据结构也是有两种类型，一种是整数集合，一种是哈希表，经过前面几种数据类型的学习，想必对作者这种使用两种数据结构来实现某种数据类型已经习惯了。

整数集合顾名思义，如果集合当中存的都是数字的话，使用整数集合无疑更加节省内存，但是当集合数量和元素类型不是数字，就会转换成哈希表来实现。
