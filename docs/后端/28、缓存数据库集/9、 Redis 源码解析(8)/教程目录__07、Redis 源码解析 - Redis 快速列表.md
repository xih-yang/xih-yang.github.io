# 07、Redis 源码解析 - Redis 快速列表
- 来源：https://ddkk.com/zhuanlan/db/redis/8/7.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

之前我们介绍了链表结构和压缩列表结构，它们是列表键的底层实现方式，但是链表的附加空间有点高，因为`prev`和`next`指针会占掉一部分的空间（64位系统占用`8 + 8 = 16`字节）.而且链表的每个节点都是单独分配内存，会加剧内存的碎片化.

所以在`redis-3.2`版本开始，Redis使用`quicklist`作为列表键的底层实现.

### 2. quicklist实现

`quicklist`实际上是`zipList`和`linkedList`的混合体，它把`zipList`放在`linkedList`的每个结点中，实现紧凑存储.

#### 2.1 quicklist表头结构

```java
typedef struct quicklist {
    // 指向头部(最左边)quicklist节点的指针
    quicklistNode *head;
    // 指向尾部(最右边)quicklist节点的指针
    quicklistNode *tail;
    // ziplist节点计数器
    unsigned long count;
    // quicklist节点计数器
    unsigned int len;
    // 保存ziplist的大小，配置文件设定，占16bits
    int fill : 16;
    // 节点压缩程度，配置文件设定，占16bits，0表示不压缩
    unsigned int compress : 16;
} quicklist;
```

其中`fill`和`compress`属性是可以配置的，在`redis.conf`文件中.

- fill属性对应的配置：list-max-ziplist-size -2
- 当数字为负数时，表示下列含义：

`-1`表示每个quicklistNode节点的ziplist字节大小不能超过`4kb`.
- `-2`表示每个quicklistNode节点的ziplist字节大小不能超过`8kb`（默认）.
- `-3`表示每个quicklistNode节点的ziplist字节大小不能超过`16kb`.
- `-4`表示每个quicklistNode节点的ziplist字节大小不能超过`32kb`.
- `-5`表示每个quicklistNode节点的ziplist字节大小不能超过`64kb`.

当数字为正数时，表示下列含义：

- 表示ziplist结构能包含的`entry`的最大个数，最大值为`2 ^ 15`.

`compress`属性对应的配置：`list-compress-depth 0`

`0`表示不压缩（默认）.

`1`表示quicklist列表的两端各有`1`个节点不压缩，中间的节点压缩.

`2`表示quicklist列表的两端各有`2`个节点不压缩，中间的节点压缩.

`3`表示quicklist列表的两端各有`3`个节点不压缩，中间的节点压缩.

最大值为`2 ^ 16`.

#### 2.2 quicklist节点结构

```java
typedef struct quicklistNode {
    struct quicklistNode *prev;     //前驱节点指针
    struct quicklistNode *next;     //后继节点指针
    // 不设置压缩数据参数时指向一个ziplist结构，设置压缩数据参数指向quicklistLZF结构
    unsigned char *zl;
    // 压缩列表ziplist的总长度
    unsigned int sz;
    // ziplist中的节点数，占16 bits长度
    unsigned int count : 16;
    // 表示是否采用LZF压缩算法压缩quicklist节点，1表示不采用，2表示采用，占2 bits长度
    unsigned int encoding : 2;
    // 表示一个quicklistNode节点是否采用ziplist结构保存数据，2表示采用，1表示不采用，默认是2，占2bits长度
    unsigned int container : 2;
    // 标记quicklist是否压缩过，占1bit长度
    // 如果recompress为1，则等待被再次压缩
    unsigned int recompress : 1;
    // 测试时使用
    unsigned int attempted_compress : 1;
    // 额外扩展位，占10bits长度
    unsigned int extra : 10;
} quicklistNode;
```

#### 2.3 被压缩过的ziplist

```java
typedef struct quicklistLZF {
    // 表示被LZF算法压缩后的ziplist的大小
    unsigned int sz;
    // 保存压缩后的ziplist的数组，柔性数组
    char compressed[];
} quicklistLZF;
```

#### 2.4 quicklistEntry

```java
// 管理quicklist中quicklistNode节点中ziplist信息的结构
typedef struct quicklistEntry {
	// 指向所属的quicklist的指针
    const quicklist *quicklist;
    // 指向所属的quicklistNode节点的指针
    quicklistNode *node;
    // 指向当前ziplist结构的指针  
    unsigned char *zi;
     // 指向当前ziplist结构的字符串vlaue成员      
    unsigned char *value;
    // 指向当前ziplist结构的整数value成员   
    long long longval;            
    // 保存当前ziplist结构的字节数大小
    unsigned int sz;
    // 保存相对ziplist的偏移量
    int offset;
} quicklistEntry;
```

### 3. 常用操作

#### 3.1 插入

quicklist可以选择在头部或者尾部进行插入，对应的API是`quicklistPushHead`和`quicklistPushTail`：

```java
int quicklistPushHead(quicklist *quicklist, void *value, size_t sz) {
	// 备份头结点地址
    quicklistNode *orig_head = quicklist->head;
    // 如果ziplist可以插入entry节点
    if (likely(
            _quicklistNodeAllowInsert(quicklist->head, quicklist->fill, sz))) {
        quicklist->head->zl =
        	// 将节点push到头部
            ziplistPush(quicklist->head->zl, value, sz, ZIPLIST_HEAD);
        // 更新quicklistNode记录ziplist大小的sz
        quicklistNodeUpdateSz(quicklist->head);
    } else {
    	// 如果不能插入entry节点到ziplist
    	// 新创建一个quicklistNode节点
        quicklistNode *node = quicklistCreateNode();
        //将entry节点push到新创建的quicklistNode节点中
        node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_HEAD);
		// 更新ziplist的大小sz
        quicklistNodeUpdateSz(node);
        // 将新创建的节点插入到头节点前
        _quicklistInsertNodeBefore(quicklist, quicklist->head, node);
    }
    // 更新quicklistNode计数器
    quicklist->count++;
    // 更新entry计数器
    quicklist->head->count++;
    // 如果改变头节点指针则返回1，否则返回0
    return (orig_head != quicklist->head);
}
```

```java
int quicklistPushTail(quicklist *quicklist, void *value, size_t sz) {
    quicklistNode *orig_tail = quicklist->tail;
    // 如果ziplist可以插入entry节点
    if (likely(
            _quicklistNodeAllowInsert(quicklist->tail, quicklist->fill, sz))) {
        quicklist->tail->zl =
       		// 将节点push到尾部
            ziplistPush(quicklist->tail->zl, value, sz, ZIPLIST_TAIL);
        // 更新quicklistNode记录ziplist大小的sz
        quicklistNodeUpdateSz(quicklist->tail);
    } else {
    	// 新创建一个quicklistNode节点
        quicklistNode *node = quicklistCreateNode();
        // 将entry节点push到新创建的quicklistNode节点中
        node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_TAIL);
		// 更新ziplist的大小sz
        quicklistNodeUpdateSz(node);
        // 将新创建的节点插入到尾节点后
        _quicklistInsertNodeAfter(quicklist, quicklist->tail, node);
    }
    // 更新quicklistNode计数器
    quicklist->count++;
    // 更新entry计数器
    quicklist->tail->count++;
    // 如果改变尾节点指针则返回1，否则返回0
    return (orig_tail != quicklist->tail);
}
```
