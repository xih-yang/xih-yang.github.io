# 18、Redis 源码解析 - Redis 学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/18.html
- 分类：缓存数据库
- 分组：教程目录
### 1 方法列表

```java
zskiplistNode *zslCreateNode(int level, double score, robj *obj)
zskiplist *zslCreate(void)
void zslFreeNode(zskiplistNode *node)
void zslFree(zskiplist *zsl)
int zslRandomLevel(void)
zskiplistNode *zslInsert(zskiplist *zsl, double score, robj *obj)
void zslDeleteNode(zskiplist *zsl, zskiplistNode *x, zskiplistNode **update)
int zslDelete(zskiplist *zsl, double score, robj *obj)
static int zslValueGteMin(double value, zrangespec *spec)
static int zslValueLteMax(double value, zrangespec *spec)
int zslIsInRange(zskiplist *zsl, zrangespec *range)
zskiplistNode *zslFirstInRange(zskiplist *zsl, zrangespec *range)
zskiplistNode *zslLastInRange(zskiplist *zsl, zrangespec *range)
unsigned long zslDeleteRangeByScore(zskiplist *zsl, zrangespec *range, dict *dict)
unsigned long zslDeleteRangeByLex(zskiplist *zsl, zlexrangespec *range, dict *dict)
unsigned long zslDeleteRangeByRank(zskiplist *zsl, unsigned int start, unsigned int end, dict *dict)
unsigned long zslGetRank(zskiplist *zsl, double score, robj *o)
zskiplistNode* zslGetElementByRank(zskiplist *zsl, unsigned long rank)
static int zslParseRange(robj *min, robj *max, zrangespec *spec)
int zslParseLexRangeItem(robj *item, robj **dest, int *ex)
static int zslParseLexRange(robj *min, robj *max, zlexrangespec *spec)
void zslFreeLexRange(zlexrangespec *spec)
int compareStringObjectsForLexRange(robj *a, robj *b)
static int zslLexValueGteMin(robj *value, zlexrangespec *spec)
static int zslLexValueLteMax(robj *value, zlexrangespec *spec)
int zslIsInLexRange(zskiplist *zsl, zlexrangespec *range)
zskiplistNode *zslFirstInLexRange(zskiplist *zsl, zlexrangespec *range) 
zskiplistNode *zslLastInLexRange(zskiplist *zsl, zlexrangespec *range)
double zzlGetScore(unsigned char *sptr)
robj *ziplistGetObject(unsigned char *sptr)
int zzlCompareElements(unsigned char *eptr, unsigned char *cstr, unsigned int clen)
unsigned int zzlLength(unsigned char *zl)
void zzlNext(unsigned char *zl, unsigned char **eptr, unsigned char **sptr)
void zzlPrev(unsigned char *zl, unsigned char **eptr, unsigned char **sptr)
int zzlIsInRange(unsigned char *zl, zrangespec *range)
unsigned char *zzlFirstInRange(unsigned char *zl, zrangespec *range)
unsigned char *zzlLastInRange(unsigned char *zl, zrangespec *range)
static int zzlLexValueGteMin(unsigned char *p, zlexrangespec *spec)
static int zzlLexValueLteMax(unsigned char *p, zlexrangespec *spec)
int zzlIsInLexRange(unsigned char *zl, zlexrangespec *range)
unsigned char *zzlFirstInLexRange(unsigned char *zl, zlexrangespec *range)
unsigned char *zzlLastInLexRange(unsigned char *zl, zlexrangespec *range)
unsigned char *zzlFind(unsigned char *zl, robj *ele, double *score)
unsigned char *zzlDelete(unsigned char *zl, unsigned char *eptr)
unsigned char *zzlInsertAt(unsigned char *zl, unsigned char *eptr, robj *ele, double score)
unsigned char *zzlInsert(unsigned char *zl, robj *ele, double score)
unsigned char *zzlDeleteRangeByScore(unsigned char *zl, zrangespec *range, unsigned long *deleted)
unsigned char *zzlDeleteRangeByLex(unsigned char *zl, zlexrangespec *range, unsigned long *deleted)
unsigned char *zzlDeleteRangeByRank(unsigned char *zl, unsigned int start, unsigned int end, unsigned long *deleted)
/*-----------------------------------------------------------------------------
 * Common sorted set API
 *----------------------------------------------------------------------------*/
unsigned int zsetLength(robj *zobj) 
void zsetConvert(robj *zobj, int encoding)
void zaddGenericCommand(redisClient *c, int flags) 
void zaddCommand(redisClient *c)
void zincrbyCommand(redisClient *c)
void zremCommand(redisClient *c)
void zremrangeGenericCommand(redisClient *c, int rangetype)
void zremrangebyrankCommand(redisClient *c)
void zremrangebyscoreCommand(redisClient *c)
void zremrangebylexCommand(redisClient *c)
void zuiInitIterator(zsetopsrc *op)
void zuiClearIterator(zsetopsrc *op)
int zuiLength(zsetopsrc *op)
int zuiNext(zsetopsrc *op, zsetopval *val)
int zuiLongLongFromValue(zsetopval *val)
robj *zuiObjectFromValue(zsetopval *val)
int zuiBufferFromValue(zsetopval *val)
int zuiFind(zsetopsrc *op, zsetopval *val, double *score)
int zuiCompareByCardinality(const void *s1, const void *s2)
inline static void zunionInterAggregate(double *target, double val, int aggregate)
void zunionInterGenericCommand(redisClient *c, robj *dstkey, int op)
void zunionstoreCommand(redisClient *c)
void zinterstoreCommand(redisClient *c) 
void zrangeGenericCommand(redisClient *c, int reverse)
void zrangeCommand(redisClient *c)
void zrevrangeCommand(redisClient *c)
void genericZrangebyscoreCommand(redisClient *c, int reverse)
void zrangebyscoreCommand(redisClient *c)
void zrevrangebyscoreCommand(redisClient *c)
void zcountCommand(redisClient *c)
void zlexcountCommand(redisClient *c)
void genericZrangebylexCommand(redisClient *c, int reverse)
void zrangebylexCommand(redisClient *c)
void zrevrangebylexCommand(redisClient *c)
void zcardCommand(redisClient *c)
void zscoreCommand(redisClient *c)
void zrankGenericCommand(redisClient *c, int reverse)
void zrankCommand(redisClient *c)
void zrevrankCommand(redisClient *c)
void zscanCommand(redisClient *c)
```

### 2 学习总结

**1、** 有序集合使用了两种数据结构来实现，一种是压缩表，一种是跳跃表；

**2、** 使用跳跃表的时候，还会使用字典来保存分值；

**3、** 使用zadd命令的时候，分值在前面，成员在后面；

**4、** zadd命令有几个可选参数nx、xx、ch、incr；

**5、** zadd命令的可选参数nx和xx不能同时使用；

**6、** zadd命令的可选参数incr真能用于一个成员；

**7、** zadd命令和zincrby命令都是调用了zaddGenericCommand这个方法；

**8、** zadd命令的返回结果会根据可选参数的不同而不同；

**9、** zrangeCommand和zrevrangeCommand两个方法都调用了zrangeGenericCommand这个方法；

**10、** getrangeCommand、lrangeCommand、zrangeCommand三者的遍历逻辑相同；

**11、** zremCommand在移出元素的时候，如果使用了跳跃表也会将在哈希表中移出响应的成员；

### 3 学习感悟

#### 3.1 疲惫感

在连续学习了前面几个源代码之后，再来学习t_zset.c，确实会有点疲惫感,当然疲惫来自方方面面，因为本身读源码其实就是比较累的一件事，再加上还要写学习笔记博客，怎么样才能写好学习笔记也是比较头疼的事情，好在终于坚持了下来，终于学习完了五种数据类型的源码，不可谓是柳暗花明又一村，但是我知道前面还有很长的路要走，写完这篇，应该要暂时休息一下，要好好总结下最近半个月的学习，并且修正一些博客内容，尽量让每篇学习笔记更加完善。

#### 3.2 陌生感

在学习前面几种数据类型的时候，很多命令因为经常用，还不算太陌生，但是到了有序集合这里，源代码中很多命令我都没有用过甚至是见过，一种陌生感油然而生，就连普通的zadd命令，竟然都有好几种可选命令可以使用，表示还是太年轻，还是要多多熟悉下有序集合的相关命令。

在这种情况下，我没有选择太多的代码去阅读，还是优先选择了一些我们常用且熟悉的命令的源代码来学习，这样方便我们进入状态，而不至于因为过多晦涩难懂的代码，阻止了我们前进的脚步。

#### 3.3 数据结构

在学习完几种数据类型之后，可以发现这几种数据类型都普遍采用了多种数据结构来实现的方式，关于具体的数据结构内容我并没有在前面的学习篇章里具体学习和讲解，为了是降低学习难度，和一个大方向先搞清楚这些代码在做什么，不过在这次修整一番之后，会开始学习这几种数据结构对应的几个数据结构的源代码来学习，想必到时应该会更有趣并且难度也会上升不少，但是对于之前的学习可以起到很大补充和深入地作用，并且相信可以解开不少疑问。
