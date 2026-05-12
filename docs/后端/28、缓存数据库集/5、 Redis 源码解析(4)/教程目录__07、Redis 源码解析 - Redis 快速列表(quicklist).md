# 07、Redis 源码解析 - Redis 快速列表(quicklist)
- 来源：https://ddkk.com/zhuanlan/db/redis/4/7.html
- 分类：缓存数据库
- 分组：教程目录
## Redis 快速列表(quicklist)

### 1. 介绍

quicklist结构是在redis 3.2版本中新加的数据结构，用在**列表的底层实现。**

通过列表键查看一下：[redis 列表键命令详解](http://blog.csdn.net/men_wen/article/details/61429145)

```java
127.0.0.1:6379> RPUSH list 1 2 5 1000
"redis" "quicklist"(integer) 
127.0.0.1:6379> OBJECT ENCODING list
"quicklist"
```

quicklist结构在quicklist.c中的解释为`A doubly linked list of ziplists`意思为一个由**ziplist组成的双向链表**。

> 关于ziplist结构的剖析和注释：redis 压缩列表ziplist结构详解

首先回忆下压缩列表的特点：

- 压缩列表ziplist结构本身就是一个**连续的内存块，由表头、若干个entry节点和压缩列表尾部标识符zlend组成，通过一系列编码规则，提高内存的利用率，使用于存储整数和短字符串**。
- 压缩列表ziplist结构的缺点是：**每次插入或删除一个元素时，都需要进行频繁的调用realloc()函数进行内存的扩展或减小，然后进行数据”搬移”，甚至可能引发连锁更新，造成严重效率的损失。**

接下来介绍quicklist与ziplist的关系：

之前提到，quicklist是由ziplist组成的双向链表，链表中的每一个节点都以压缩列表ziplist的结构保存着数据，而ziplist有多个entry节点，保存着数据。相当与一个quicklist节点保存的是**一片数据，而不再是一个数据**。

例如：一个quicklist有4个quicklist节点，每个节点都保存着1个ziplist结构，每个ziplist的大小不超过8kb，ziplist的entry节点中的value成员保存着数据。

根据以上描述，总结出一下quicklist的特点：

- quicklist宏观上是一个双向链表，因此，它具有一个双向链表的有点，**进行插入或删除操作时非常方便，虽然复杂度为O(n)，但是不需要内存的复制，提高了效率，而且访问两端元素复杂度为O(1)。**
- quicklist微观上是一片片entry节点，每一片entry节点内存连续且顺序存储，可以通过**二分查找**以 ***l**o**g*2(*n*) 的复杂度进行定位**。

总体来说，quicklist给人的感觉和B树每个节点的存储方式相似。[B 树 - wiki][B _ - wiki]。

### 2. quicklist的结构实现

quicklist有关的数据结构定义在quicklist.h中。

#### 2.1 quicklist表头结构

```java
typedef struct quicklist {
    //指向头部(最左边)quicklist节点的指针
    quicklistNode *head;
    //指向尾部(最右边)quicklist节点的指针
    quicklistNode *tail;
    //ziplist中的entry节点计数器
    unsigned long count;        /* total count of all entries in all ziplists */
    //quicklist的quicklistNode节点计数器
    unsigned int len;           /* number of quicklistNodes */
    //保存ziplist的大小，配置文件设定，占16bits
    int fill : 16;              /* fill factor for individual nodes */
    //保存压缩程度值，配置文件设定，占16bits，0表示不压缩
    unsigned int compress : 16; /* depth of end nodes not to compress;0=off */
} quicklist;
```

在quicklist表头结构中，有两个成员是fill和compress，其中” : “是位域运算符，表示fill占int类型32位中的16位，compress也占16位。

fill和compress的配置文件是redis.conf。

- fill成员对应的配置：**list-max-ziplist-size -2**
- 当数字为负数，表示以下含义：
- -1 每个quicklistNode节点的ziplist字节大小不能超过4kb。（建议）
- -2 每个quicklistNode节点的ziplist字节大小不能超过8kb。（默认配置）
- -3 每个quicklistNode节点的ziplist字节大小不能超过16kb。（一般不建议）
- -4 每个quicklistNode节点的ziplist字节大小不能超过32kb。（不建议）
- -5 每个quicklistNode节点的ziplist字节大小不能超过64kb。（正常工作量不建议）
- 当数字为正数，表示：ziplist结构所最多包含的entry个数。最大值为 215。
- compress成员对应的配置：**list-compress-depth 0**
- 后面的数字有以下含义：
- 0 表示不压缩。（默认）
- 1 表示quicklist列表的两端各有1个节点不压缩，中间的节点压缩。
- 2 表示quicklist列表的两端各有2个节点不压缩，中间的节点压缩。
- 3 表示quicklist列表的两端各有3个节点不压缩，中间的节点压缩。
- 以此类推，最大为 216。

#### 2.2 quicklist节点结构

```java
typedef struct quicklistNode {
    struct quicklistNode *prev;     //前驱节点指针
    struct quicklistNode *next;     //后继节点指针
    //不设置压缩数据参数recompress时指向一个ziplist结构
    //设置压缩数据参数recompress指向quicklistLZF结构
    unsigned char *zl;
    //压缩列表ziplist的总长度
    unsigned int sz;                  /* ziplist size in bytes */
    //ziplist中包的节点数，占16 bits长度
    unsigned int count : 16;          /* count of items in ziplist */
    //表示是否采用了LZF压缩算法压缩quicklist节点，1表示压缩过，2表示没压缩，占2 bits长度
    unsigned int encoding : 2;        /* RAW==1 or LZF==2 */
    //表示一个quicklistNode节点是否采用ziplist结构保存数据，2表示压缩了，1表示没压缩，默认是2，占2bits长度
    unsigned int container : 2;       /* NONE==1 or ZIPLIST==2 */
    //标记quicklist节点的ziplist之前是否被解压缩过，占1bit长度
    //如果recompress为1，则等待被再次压缩
    unsigned int recompress : 1; /* was this node previous compressed? */
    //测试时使用
    unsigned int attempted_compress : 1; /* node can't compress; too small */
    //额外扩展位，占10bits长度
    unsigned int extra : 10; /* more bits to steal for future usage */
} quicklistNode;
```

#### 2.3 压缩过的ziplist结构—quicklistLZF

当指定使用lzf压缩算法压缩ziplist的entry节点时，quicklistNode结构的zl成员指向quicklistLZF结构

```java
typedef struct quicklistLZF {
    //表示被LZF算法压缩后的ziplist的大小
    unsigned int sz; /* LZF size in bytes*/
    //保存压缩后的ziplist的数组，柔性数组
    char compressed[];
} quicklistLZF;
```

#### 2.4 管理ziplist信息的结构quicklistEntry

和压缩列表一样，entry结构在储存时是一连串的内存块，需要将其每个entry节点的信息读取到管理该信息的结构体中，以便操作。在quicklist中定义了自己的结构。

```java
//管理quicklist中quicklistNode节点中ziplist信息的结构
typedef struct quicklistEntry {
    const quicklist *quicklist;   //指向所属的quicklist的指针
    quicklistNode *node;          //指向所属的quicklistNode节点的指针
    unsigned char *zi;            //指向当前ziplist结构的指针
    unsigned char *value;         //指向当前ziplist结构的字符串vlaue成员
    long long longval;            //指向当前ziplist结构的整数value成员
    unsigned int sz;              //保存当前ziplist结构的字节数大小
    int offset;                   //保存相对ziplist的偏移量
} quicklistEntry;
```

基于以上结构信息，我们可以得出一个quicklist结构，在空间中的大致可能的样子：

#### 2.5 迭代器结构实现

在redis的quicklist结构中，实现了自己的迭代器，用于遍历节点。

```java
//quicklist的迭代器结构
typedef struct quicklistIter {
    const quicklist *quicklist;   //指向所属的quicklist的指针
    quicklistNode *current;       //指向当前迭代的quicklist节点的指针
    unsigned char *zi;            //指向当前quicklist节点中迭代的ziplist
    long offset;                  //当前ziplist结构中的偏移量      /* offset in current ziplist */
    int direction;                //迭代方向
} quicklistIter;
```

### 3. quicklist的部分操作源码注释

quicklist.c和quicklist.h文件的注释：[redis 源码注释](https://github.com/menwengit/redis_source_annotation/blob/master/quicklist.c)

#### 3.1 插入一个entry节点

quicklist的插入：以一个已存在的entry前或后插入一个entry节点，非常的复杂，因为情况非常多。

- 当前quicklistNode节点的ziplist可以插入。
- 插入在已存在的entry前
- 插入在已存在的entry后
- 如果当前quicklistNode节点的**ziplist由于fill的配置，无法继续插入**。
- 已存在的**entry是ziplist的头节点**，当前quicklistNode节点**前驱指针不为空**，且是**尾插**
- 前驱节点**可以插入**，因此**插入在前驱节点的尾部。**
- 前驱节点**不可以插入**，因此要在**当前节点和前驱节点之间新创建一个新节点**保存要插入的entry。
- 已存在的**entry是ziplist的尾节点**，当前quicklistNode节点**后继指针不为空**，且是**前插**
- 后继节点**可以插入**，因此**插入在前驱节点的头部。**
- 后继节点**不可以插入**，因此要在**当前节点和后继节点之间新创建一个新节点**保存要插入的entry。
- 以上情况不满足，则属于将entry插入在ziplist中间的任意位置，需要**分割当前quicklistNode节点**。最后如果**能够合并，还要合并。**

```java
/* Insert a new entry before or after existing entry 'entry'.
 *
 * If after==1, the new value is inserted after 'entry', otherwise
 * the new value is inserted before 'entry'. */
//如果after为1，在已存在的entry后插入一个entry，否则在前面插入
REDIS_STATIC void _quicklistInsert(quicklist *quicklist, quicklistEntry *entry,
                                   void *value, const size_t sz, int after) {
    int full = 0, at_tail = 0, at_head = 0, full_next = 0, full_prev = 0;
    int fill = quicklist->fill;
    quicklistNode *node = entry->node;
    quicklistNode *new_node = NULL;
    if (!node) {    //如果entry为没有所属的quicklistNode节点，需要新创建
        /* we have no reference node, so let's create only node in the list */
        D("No node given!");
        new_node = quicklistCreateNode();   //创建一个节点
        //将entry值push到new_node新节点的ziplist中
        new_node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_HEAD);
        //将新的quicklistNode节点插入到quicklist中
        __quicklistInsertNode(quicklist, NULL, new_node, after);
        //更新entry计数器
        new_node->count++;
        quicklist->count++;
        return;
    }
    /* Populate accounting flags for easier boolean checks later */
    //如果node不能插入entry
    if (!_quicklistNodeAllowInsert(node, fill, sz)) {
        D("Current node is full with count %d with requested fill %lu",
          node->count, fill);
        full = 1;   //设置full的标志
    }
    //如果是后插入且当前entry为尾部的entry
    if (after && (entry->offset == node->count)) {
        D("At Tail of current ziplist");
        at_tail = 1;    //设置在尾部at_tail标示
        //如果node的后继节点不能插入
        if (!_quicklistNodeAllowInsert(node->next, fill, sz)) {
            D("Next node is full too.");
            full_next = 1;  //设置标示
        }
    }
    //如果是前插入且当前entry为头部的entry
    if (!after && (entry->offset == 0)) {
        D("At Head");
        at_head = 1;    //设置at_head表示
        if (!_quicklistNodeAllowInsert(node->prev, fill, sz)) { //如果node的前驱节点不能插入
            D("Prev node is full too.");
            full_prev = 1;      //设置标示
        }
    }
    /* Now determine where and how to insert the new element */
    //如果node不满，且是后插入
    if (!full && after) {
        D("Not full, inserting after current position.");
        quicklistDecompressNodeForUse(node);    //将node临时解压
        unsigned char *next = ziplistNext(node->zl, entry->zi); //返回下一个entry的地址
        if (next == NULL) { //如果next为空，则直接在尾部push一个entry
            node->zl = ziplistPush(node->zl, value, sz, ZIPLIST_TAIL);
        } else {            //否则，后插入一个entry
            node->zl = ziplistInsert(node->zl, next, value, sz);
        }
        node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(node);    //更新ziplist的大小sz
        quicklistRecompressOnly(quicklist, node);   //将临时解压的重压缩
    //如果node不满且是前插
    } else if (!full && !after) {
        D("Not full, inserting before current position.");
        quicklistDecompressNodeForUse(node);    //将node临时解压
        node->zl = ziplistInsert(node->zl, entry->zi, value, sz);   //前插入
        node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(node);     //更新ziplist的大小sz
        quicklistRecompressOnly(quicklist, node);   //将临时解压的重压缩
    //当前node满了，且当前已存在的entry是尾节点，node的后继节点指针不为空，且node的后驱节点能插入
    //本来要插入当前node中，但是当前的node满了，所以插在next节点的头部
    } else if (full && at_tail && node->next && !full_next && after) {
        /* If we are: at tail, next has free space, and inserting after:
         *   - insert entry at head of next node. */
        D("Full and tail, but next isn't full; inserting next node head");
        new_node = node->next;  //new_node指向node的后继节点
        quicklistDecompressNodeForUse(new_node);    //将node临时解压
        new_node->zl = ziplistPush(new_node->zl, value, sz, ZIPLIST_HEAD);  //在new_node头部push一个entry
        new_node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(new_node);    //更新ziplist的大小sz
        quicklistRecompressOnly(quicklist, new_node);   //将临时解压的重压缩
    //当前node满了，且当前已存在的entry是头节点，node的前驱节点指针不为空，且前驱节点可以插入
    //因此插在前驱节点的尾部
    } else if (full && at_head && node->prev && !full_prev && !after) {
        /* If we are: at head, previous has free space, and inserting before:
         *   - insert entry at tail of previous node. */
        D("Full and head, but prev isn't full, inserting prev node tail");
        new_node = node->prev;  //new_node指向node的后继节点
        quicklistDecompressNodeForUse(new_node);    //将node临时解压
        new_node->zl = ziplistPush(new_node->zl, value, sz, ZIPLIST_TAIL);//在new_node尾部push一个entry
        new_node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(new_node);    //更新ziplist的大小sz
        quicklistRecompressOnly(quicklist, new_node);   //将临时解压的重压缩
    //当前node满了
    //要么已存在的entry是尾节点，且后继节点指针不为空，且后继节点不可以插入，且要后插
    //要么已存在的entry为头节点，且前驱节点指针不为空，且前驱节点不可以插入，且要前插
    } else if (full && ((at_tail && node->next && full_next && after) ||
                        (at_head && node->prev && full_prev && !after))) {
        /* If we are: full, and our prev/next is full, then:
         *   - create new node and attach to quicklist */
        D("\tprovisioning new node...");
        new_node = quicklistCreateNode();   //创建一个节点
        new_node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_HEAD);  //将entrypush到new_node的头部
        new_node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(new_node);        //更新ziplist的大小sz
        __quicklistInsertNode(quicklist, node, new_node, after);    //将new_node插入在当前node的后面
    //当前node满了，且要将entry插入在中间的任意地方，需要将node分割
    } else if (full) {
        /* else, node is full we need to split it. */
        /* covers both after and !after cases */
        D("\tsplitting node...");
        quicklistDecompressNodeForUse(node);    //将node临时解压
        new_node = _quicklistSplitNode(node, entry->offset, after);//分割node成两块
        new_node->zl = ziplistPush(new_node->zl, value, sz,
                                   after ? ZIPLIST_HEAD : ZIPLIST_TAIL);//将entry push到new_node中
        new_node->count++;  //更新entry计数器
        quicklistNodeUpdateSz(new_node);        //更新ziplist的大小sz
        __quicklistInsertNode(quicklist, node, new_node, after);    //将new_node插入进去
        _quicklistMergeNodes(quicklist, node);  //左右能合并的合并
    }
    quicklist->count++;     //更新总的entry计数器
}
```

#### 3.2 push操作

push一个entry到quicklist**头节点或尾节点**中ziplist的**头部或尾部**。底层调用了ziplistPush操作。

```java
/* Add new entry to head node of quicklist.
 *
 * Returns 0 if used existing head.
 * Returns 1 if new head created. */
//push一个entry节点到quicklist的头部
//返回0表示不改变头节点指针，返回1表示节点插入在头部，改变了头结点指针
int quicklistPushHead(quicklist *quicklist, void *value, size_t sz) {
    quicklistNode *orig_head = quicklist->head; //备份头结点地址
    //如果ziplist可以插入entry节点
    if (likely(
            _quicklistNodeAllowInsert(quicklist->head, quicklist->fill, sz))) {
        quicklist->head->zl =
            ziplistPush(quicklist->head->zl, value, sz, ZIPLIST_HEAD);  //将节点push到头部
        quicklistNodeUpdateSz(quicklist->head); //更新quicklistNode记录ziplist大小的sz
    } else {        //如果不能插入entry节点到ziplist
        quicklistNode *node = quicklistCreateNode();    //新创建一个quicklistNode节点
        //将entry节点push到新创建的quicklistNode节点中
        node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_HEAD);
        quicklistNodeUpdateSz(node);    //更新ziplist的大小sz
        _quicklistInsertNodeBefore(quicklist, quicklist->head, node);   //将新创建的节点插入到头节点前
    }
    quicklist->count++;                     //更新quicklistNode计数器
    quicklist->head->count++;               //更新entry计数器
    return (orig_head != quicklist->head);  //如果改变头节点指针则返回1，否则返回0
}
/* Add new entry to tail node of quicklist.
 *
 * Returns 0 if used existing tail.
 * Returns 1 if new tail created. */
//push一个entry节点到quicklist的尾节点中，如果不能push则新创建一个quicklistNode节点
//返回0表示不改变尾节点指针，返回1表示节点插入在尾部，改变了尾结点指针
int quicklistPushTail(quicklist *quicklist, void *value, size_t sz) {
    quicklistNode *orig_tail = quicklist->tail;
    //如果ziplist可以插入entry节点
    if (likely(
            _quicklistNodeAllowInsert(quicklist->tail, quicklist->fill, sz))) {
        quicklist->tail->zl =
            ziplistPush(quicklist->tail->zl, value, sz, ZIPLIST_TAIL);  //将节点push到尾部
        quicklistNodeUpdateSz(quicklist->tail); //更新quicklistNode记录ziplist大小的sz
    } else {
        quicklistNode *node = quicklistCreateNode();        //新创建一个quicklistNode节点
        //将entry节点push到新创建的quicklistNode节点中
        node->zl = ziplistPush(ziplistNew(), value, sz, ZIPLIST_TAIL);
        quicklistNodeUpdateSz(node);        //更新ziplist的大小sz
        _quicklistInsertNodeAfter(quicklist, quicklist->tail, node);//将新创建的节点插入到尾节点后
    }
    quicklist->count++;             //更新quicklistNode计数器
    quicklist->tail->count++;       //更新entry计数器
    return (orig_tail != quicklist->tail);  //如果改变尾节点指针则返回1，否则返回0
}
```

#### 3.3 pop操作

从quicklist的头节点或尾节点的ziplist中pop出一个entry，分该entry保存的是字符串还是整数。如果字符串的话，需要传入一个函数指针，这个函数叫_quicklistSaver()，真正的pop操作还是在这两个函数基础上在封装了一次，来操作拷贝字符串的操作。

```java
/* pop from quicklist and return result in 'data' ptr.  Value of 'data'
 * is the return value of 'saver' function pointer if the data is NOT a number.
 *
 * If the quicklist element is a long long, then the return value is returned in
 * 'sval'.
 *
 * Return value of 0 means no elements available.
 * Return value of 1 means check 'data' and 'sval' for values.
 * If 'data' is set, use 'data' and 'sz'.  Otherwise, use 'sval'. */
//从quicklist的头节点或尾节点pop弹出出一个entry，并将value保存在传入传出参数
//返回0表示没有可pop出的entry
//返回1表示pop出了entry，存在data或sval中
int quicklistPopCustom(quicklist *quicklist, int where, unsigned char **data,
                       unsigned int *sz, long long *sval,
                       void *(*saver)(unsigned char *data, unsigned int sz)) {
    unsigned char *p;
    unsigned char *vstr;
    unsigned int vlen;
    long long vlong;
    int pos = (where == QUICKLIST_HEAD) ? 0 : -1;   //位置下标
    if (quicklist->count == 0)  //entry数量为0，弹出失败
        return 0;
    //初始化
    if (data)
        *data = NULL;
    if (sz)
        *sz = 0;
    if (sval)
        *sval = -123456789;
    quicklistNode *node;
    //记录quicklist的头quicklistNode节点或尾quicklistNode节点
    if (where == QUICKLIST_HEAD && quicklist->head) {
        node = quicklist->head;
    } else if (where == QUICKLIST_TAIL && quicklist->tail) {
        node = quicklist->tail;
    } else {
        return 0;           //只能从头或尾弹出
    }
    p = ziplistIndex(node->zl, pos);    //获得当前pos的entry地址
    if (ziplistGet(p, &vstr, &vlen, &vlong)) {  //将entry信息读入到参数中
        if (vstr) {     //entry中是字符串值
            if (data)
                *data = saver(vstr, vlen);  //调用特定的函数将字符串值保存到*data
            if (sz)
                *sz = vlen;                 //保存字符串长度
        } else {        //整数值
            if (data)
                *data = NULL;
            if (sval)
                *sval = vlong;  //将整数值保存在*sval中
        }
        quicklistDelIndex(quicklist, node, &p); //将该entry从ziplist中删除
        return 1;
    }
    return 0;
}
/* Return a malloc'd copy of data passed in */
//将data内容拷贝一份并返回地址
REDIS_STATIC void *_quicklistSaver(unsigned char *data, unsigned int sz) {
    unsigned char *vstr;
    if (data) {
        vstr = zmalloc(sz);     //分配空间
        memcpy(vstr, data, sz); //拷贝
        return vstr;
    }
    return NULL;
}
```
