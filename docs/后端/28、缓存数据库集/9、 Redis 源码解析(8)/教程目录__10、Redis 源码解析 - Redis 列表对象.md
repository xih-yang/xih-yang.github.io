# 10、Redis 源码解析 - Redis 列表对象
- 来源：https://ddkk.com/zhuanlan/db/redis/8/10.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 列表对象的结构

因为从`redis-3.2`版本开始，就使用`quicklist`作为列表键的底层实现，所以列表对象的大致结构如下图所示：

### 2. 列表对象命令介绍

命令
描述

BLPOP key1 [key2 ] timeout
移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止

BRPOP key1 [key2 ] timeout
移出并获取列表的最后一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止

BRPOPLPUSH source destination timeout
从列表中弹出一个值，将弹出的元素插入到另外一个列表中并返回它；如但果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止

LINDEX key index
通过索引获取列表中的元素

LINSERT key BEFORE[AFTER] pivot value
在列表的元素前或者后插入元素

LLEN key
获取列表长度

LPOP key
移出并获取列表的第一个元素

LPUSH key value1 [value2]
将一个或多个值插入到列表头部

LPUSHX key value
将一个或多个值插入到已存在的列表头部

LRANGE key start stop
获取列表指定范围内的元素

LREM key count value
移除列表元素

LSET key index value
通过索引设置列表元素的值

LTRIM key start stop
对一个列表进行修剪（trim），就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除

RPOP key
移除并获取列表最后一个元素

RPOPLPUSH source destination
移除列表的最后一个元素，并将该元素添加到另一个列表并返回

RPUSH key value1 [value2]
在列表中添加一个或多个值

RPUSHX key value
为已存在的列表添加值

### 2. 列表对象命令的实现

列表对象命令的实现代码在`t_list.c`源文件中.

Redis先是定义了一些最底层的函数比如`listTypePush`、`listTypePush`等等，然后在这些底层命令之上又封装了有特定功能的函数，比如阻塞和非阻塞插入和删除. 这里我们只介绍一些最底层的命令.

#### 2.1 PUSH命令

```java
#define QUICKLIST_HEAD 0
#define QUICKLIST_TAIL -1
// PUSH命令的底层实现
// 根据where（头插还是尾插），将value插入到列表中
void listTypePush(robj *subject, robj *value, int where) {
    // 对列表对象编码为quicklist类型操作
    if (subject->encoding == OBJ_ENCODING_QUICKLIST) {
        int pos = (where == LIST_HEAD) ? QUICKLIST_HEAD : QUICKLIST_TAIL;
        // 获得value编码为RAW的字符串对象
        value = getDecodedObject(value);
        // 保存value的长度
        size_t len = sdslen(value->ptr);
        // PUSH value的值到quicklist的头或尾
        quicklistPush(subject->ptr, value->ptr, len, pos);
        // value的引用计数减1
        decrRefCount(value);
    } else {
   		// 不是quicklist类型的编码则发送错误信息
        serverPanic("Unknown list encoding");
    }
}
```

#### 2.2 POP命令

```java
// POP命令底层实现
// 根据where（头还是尾），将value从列表中弹出
robj *listTypePop(robj *subject, int where) {
    long long vlong;
    robj *value = NULL;
    // 获得POP的位置，quicklist的头部或尾部
    int ql_where = where == LIST_HEAD ? QUICKLIST_HEAD : QUICKLIST_TAIL;
    // 对列表对象编码为quicklist类型操作
    if (subject->encoding == OBJ_ENCODING_QUICKLIST) {
        // 从ql_where位置POP出一个entry节点，保存在value或vlong中
        if (quicklistPopCustom(subject->ptr, ql_where, (unsigned char **)&value,
                               NULL, &vlong, listPopSaver)) {
            if (!value) // 如果弹出的entry节点是整型的
                // 则根据整型值创建一个字符串对象
                value = createStringObjectFromLongLong(vlong);
        }
    } else {
        serverPanic("Unknown list encoding");
    }
    // 返回弹出entry节点的value值
    return value;
}
```

#### 2.3 列表迭代器

其中列表对象还定义了迭代器，以及迭代时候的节点信息，这个迭代器迭代的其实是`quicklist`的节点`quicklistEntry`，`quicklist`的底层实现中，还有专门的用于迭代`quicklist`节点中`ziplist`的迭代器.

```java
// 列表类型迭代器
typedef struct {
	// 迭代器指向的对象
    robj *subject;
    // 迭代器指向对象的编码类型
    unsigned char encoding;
    // 迭代器的方向
    unsigned char direction;
    // quicklist的迭代器
    quicklistIter *iter;
} listTypeIterator;
```

```java
// 列表类型的entry结构
typedef struct {
	// 所属的列表类型迭代器
    listTypeIterator *li;
    // quicklist中的entry结构
    quicklistEntry entry;
} listTypeEntry;
```

**初始化迭代器**

```java
// 在指定的索引处初始化迭代器
listTypeIterator *listTypeInitIterator(robj *subject, long index, unsigned char direction) {
    // 分配空间
    listTypeIterator *li = zmalloc(sizeof(listTypeIterator));
    //设置迭代器的各个成员的初始值
    li->subject = subject;
    li->encoding = subject->encoding;
    li->direction = direction;
    // quicklist迭代器为空
    li->iter = NULL;
    /* LIST_HEAD means start at TAIL and move *towards* head.
     * LIST_TAIL means start at HEAD and move *towards tail. */
    // 获得迭代方向
    int iter_direction =
        direction == LIST_HEAD ? AL_START_TAIL : AL_START_HEAD;
    // 对列表对象编码为quicklist类型操作
    if (li->encoding == OBJ_ENCODING_QUICKLIST) {
        // 将迭代器和下标为index的quicklistNode结合，迭代器指向该节点
        li->iter = quicklistGetIteratorAtIdx(li->subject->ptr,
                                             iter_direction, index);
    } else {
        serverPanic("Unknown list encoding");
    }
    return li;
}
```

**更新迭代器**

```java
// 将列表类型的迭代器指向的entry保存在提供的listTypeEntry结构中，并且更新迭代器，1表示成功，0失败
int listTypeNext(listTypeIterator *li, listTypeEntry *entry) {
    // 确保对象编码类型和迭代器中encoding成员相等
    serverAssert(li->subject->encoding == li->encoding);
    // 设置listTypeEntry的entry成员关联到当前列表类型的迭代器
    entry->li = li;
    // 对列表对象编码为quicklist类型操作
    if (li->encoding == OBJ_ENCODING_QUICKLIST) {
        // 保存当前的entry到listTypeEntry的entry成员，并更新迭代器
        return quicklistNext(li->iter, &entry->entry);
    } else {
        serverPanic("Unknown list encoding");
    }
    return 0;
}
```

**返回当前迭代器指向的节点**

```java
// 返回一个节点的value对象，根据当前的迭代器
robj *listTypeGet(listTypeEntry *entry) {
    robj *value = NULL;
    // 对列表对象编码为quicklist类型操作
    if (entry->li->encoding == OBJ_ENCODING_QUICKLIST) {
    	// 创建一个字符串对象保存列表类型的entry结构所指向的entry节点的字符串值
        if (entry->entry.value) {
            value = createStringObject((char *)entry->entry.value,
                                       entry->entry.sz);
        } else {
            // 创建一个字符串对象保存列表类型的entry结构所指向的entry节点的整型值
            value = createStringObjectFromLongLong(entry->entry.longval);
        }
    } else {
        serverPanic("Unknown list encoding");
    }
    return value;
}
```

**销毁迭代器**

```java
// 销毁迭代器
void listTypeReleaseIterator(listTypeIterator *li) {
	// 释放quicklist迭代器
    zfree(li->iter);
    // 释放列表类型迭代器
    zfree(li);
}
```
