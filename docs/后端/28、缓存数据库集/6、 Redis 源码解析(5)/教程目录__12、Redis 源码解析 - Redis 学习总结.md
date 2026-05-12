# 12、Redis 源码解析 - Redis 学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/12.html
- 分类：缓存数据库
- 分组：教程目录
### 1 方法列表

```java
void hashTypeTryConversion(robj *o, robj **argv, int start, int end)
void hashTypeTryObjectEncoding(robj *subject, robj **o1, robj **o2)
int hashTypeGetFromZiplist(robj *o, robj *field,
                           unsigned char **vstr,
                           unsigned int *vlen,
                           long long *vll)
int hashTypeGetFromHashTable(robj *o, robj *field, robj **value)
robj *hashTypeGetObject(robj *o, robj *field)
int hashTypeExists(robj *o, robj *field)
int hashTypeSet(robj *o, robj *field, robj *value)
int hashTypeDelete(robj *o, robj *field)
unsigned long hashTypeLength(robj *o)
hashTypeIterator *hashTypeInitIterator(robj *subject)
void hashTypeReleaseIterator(hashTypeIterator *hi)
int hashTypeNext(hashTypeIterator *hi)
void hashTypeCurrentFromZiplist(hashTypeIterator *hi, int what,
                                unsigned char **vstr,
                                unsigned int *vlen,
                                long long *vll)
void hashTypeCurrentFromHashTable(hashTypeIterator *hi, int what, robj **dst)
robj *hashTypeCurrentObject(hashTypeIterator *hi, int what)
robj *hashTypeLookupWriteOrCreate(redisClient *c, robj *key)
void hashTypeConvertZiplist(robj *o, int enc)
void hashTypeConvert(robj *o, int enc)
/*-----------------------------------------------------------------------------
 * Hash type commands
 *----------------------------------------------------------------------------*/
void hsetCommand(redisClient *c)
void hsetnxCommand(redisClient *c) 
void hmsetCommand(redisClient *c)
void hincrbyCommand(redisClient *c)
void hincrbyfloatCommand(redisClient *c)
static void addHashFieldToReply(redisClient *c, robj *o, robj *field) 
void hgetCommand(redisClient *c)
void hmgetCommand(redisClient *c)
void hdelCommand(redisClient *c)
void hlenCommand(redisClient *c)
static void addHashIteratorCursorToReply(redisClient *c, hashTypeIterator *hi, int what)
void genericHgetallCommand(redisClient *c, int flags) 
void hkeysCommand(redisClient *c) 
void hvalsCommand(redisClient *c)
void hgetallCommand(redisClient *c)
void hexistsCommand(redisClient *c)
void hscanCommand(redisClient *c)
```

### 2 学习总结

**1、** Redis中hash是两种数据结构实现的，一种是压缩表，一种是哈希表；

**2、** hset、hmset命令会判断每次设置的值是否会引起数据结构转换；

**3、** hset在设置键值对的时候，如果没有会先新建一个键值对；

**4、** hset新建和更新的时候返回值不同；

**5、** 有hashType前缀的方法，里面都包含了两种数据结构的处理逻辑；

**6、** hgetall、hvals、hkeys三个命令都会调用genericHgetallCommand方法；

**7、** hashTypeGetFromZiplist和hashTypeGetFromHashTable先根据键找到键的位置，再来获取值；

**8、** hashTypeCurrentFromZiplist和hashTypeCurrentFromHashTable直接根据当前位置获取值；

**9、** 有标记逻辑的时候，都会使用二进制运算来控制，并且这些枚举值都是01248之类；

### 3 学习感悟

#### 3.1 压缩表

在之前学习列表的源代码的时候，我们就已经看到了压缩表的身影，没想到在学习hash的时候又遇见了他，不经引起我的思考，为何作者要频频使用压缩表，不惜增加代码的复杂性也要使用压缩表来作为列表和哈希的基础数据结构，或许里面有很多历史原因，这里我没有直接去搜寻相关答案，先靠我们这几天学习的知识发挥自己的想象和思考。

通过一些遍历代码我们可以发现压缩表是连续的，意味着开辟内存起来更加方便，并且压缩表的名字意味着在存储设计上也比较节省内存，但是缺点肯定也明显，插入比较麻烦，所以在达到一定数量之后会转换成链表或者哈希表。在以前硬件比较小的情况，可能要考虑内存的节省和性能的提升，那么现在能否使用一种结构来实现某个类型呢，保持代码的简洁性岂不是美哉，当然这里面省掉的内存和提高的性能和代码简洁性相比当然有作者自己的考量，我们只是为了单纯从代码层面考虑问题。

#### 3.2 二进制

连续学习了t_string.c、t_list.c、t_hash.c 我们能发现代码里有很多二进制运算，通过这些二进制运算来实现逻辑判断，这样做的好处可以方便判断是否满足某个条件，或者传入兼容多者的参数，也是我们经常能看见的通过 | 传入多个值进去的方法。

其实在我们以后编程的时候，在美剧值不多的情况下，也可以引用这种方法，在传入参数的时候就方便的多，不过也要充分理解和熟练，要不然本末倒置反而引起代码的复杂性和难阅读性。

#### 3.3 变量命名

学习了几天源代码，发现一个小问题就是很多变量命名是否有点随意，例如c、o、new、value，单独看还好，特别时有时一个方法传的就几个单字母，完全看不懂传了什么参数，反正我个人觉得这样不好，增加了阅读的心智负担，经常看到一堆单个字母，我都要看上下文，才知道写得啥，所以变量名还是要起的见名知意一点。
