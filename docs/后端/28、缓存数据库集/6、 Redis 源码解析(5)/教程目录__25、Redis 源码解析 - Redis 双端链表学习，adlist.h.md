# 25、Redis 源码解析 - Redis 双端链表学习，adlist.h
- 来源：https://ddkk.com/zhuanlan/db/redis/5/25.html
- 分类：缓存数据库
- 分组：教程目录
### 前言

学习完SDS之后，我们了解了Redis字符串的底层数据结构，对Redis在提升性能的一些处理上有了一些简单的了解，这是一个非常不错的开始，但这还是冰山一角，我们还有很多知识我们需要去学习。

相信学习完SDS之后，大家和我一样应该有了不少信心，数据结构也不是那么难对吧，接下来我们要学习的是双端链表，它是实现列表的底层数据结构之一，只要我们弄清楚双端链表再回过头去温习下之前我们学习过的列表的一些方法，想必就能更加清楚了。

Redis将双端链表的代码放在了adlist.h和adlist.c两个文件中，这里有个小疑问为什么文件名是adlist呢？其实可以从两个源代码中的开头找到答案。

```java
	 adlist.h - A generic doubly linked list implementation
```

翻译过来的意思，一个通用的双向链表实现

### 1 双端链表

学习过数据结构的小伙伴应该很清楚双端链表是个啥东西，这里就简单的概述一下双端链表，先有一个简单的概念再看代码就能更容易一些。

首先链表类似我们平常看到的链条一样，是用一个个的节点连接起来的东西。

清楚了链表是什么东西之后，再来理解双端链表就方便了，双端链表是指每个节点都有指向前一个节点和后一个节点的指针，这样的话链表就可以在两个方向上遍历，那单链表就一个指向后一个节点的指针也就是只能向后遍历。

### 2 结构体定义

说的再多不如直接上代码，让我们来看看Redis中是怎么实现的吧。

```java
/* Node, List, and Iterator are the only data structures used currently. */
//双端链表节点结构体定义
typedef struct listNode {
    struct listNode *prev;//上一个节点的指针
    struct listNode *next;//下一个节点的指针
    void *value;//指向值的指针
} listNode;
typedef struct list {
    listNode *head; //指向头节点的指针
    listNode *tail; //指向尾节点的指针
    void *(*dup)(void *ptr); //指向一个复制函数的指针
    void (*free)(void *ptr);//指向一个释放函数的指针
    int (*match)(void *ptr, void *key);//指向一个匹配函数的指针
    unsigned long len;//节点的数量
} list;
```

这里有两个结构体，分别是listNode 和 list ，一个是链接节点，一个是链表。

链表节点中总共有3个属性，一个是指向上一个节点的指针，一个是指向下一个节点的指针，最后还有一个指向值的指针，有了这三个属性就可以组织起一个简单的链表节点，同时也能将其他节点串联起来。

链表中总共有6个属性，前面两个好理解，一个是指向头节点的指针，一个指向尾节点指针，后面3个有点难理解，目前只要先知道指向3个函数就可以，分别是复制、释放、匹配函数。最后还有一个节点数量的属性，显然通过这个属性可以快速获取链表节点的数量。

### 3 adlist.h 学习

#### 3.1 adlist.h 源代码

```java
#ifndef __ADLIST_H__
#define __ADLIST_H__
/* Node, List, and Iterator are the only data structures used currently. */
typedef struct listNode {
    struct listNode *prev;
    struct listNode *next;
    void *value;
} listNode;
typedef struct listIter {
    listNode *next;
    int direction;
} listIter;
typedef struct list {
    listNode *head;
    listNode *tail;
    void *(*dup)(void *ptr);
    void (*free)(void *ptr);
    int (*match)(void *ptr, void *key);
    unsigned long len;
} list;
/* Functions implemented as macros */
#define listLength(l) ((l)->len)
#define listFirst(l) ((l)->head)
#define listLast(l) ((l)->tail)
#define listPrevNode(n) ((n)->prev)
#define listNextNode(n) ((n)->next)
#define listNodeValue(n) ((n)->value)
#define listSetDupMethod(l,m) ((l)->dup = (m))
#define listSetFreeMethod(l,m) ((l)->free = (m))
#define listSetMatchMethod(l,m) ((l)->match = (m))
#define listGetDupMethod(l) ((l)->dup)
#define listGetFree(l) ((l)->free)
#define listGetMatchMethod(l) ((l)->match)
/* Prototypes */
list *listCreate(void);
void listRelease(list *list);
list *listAddNodeHead(list *list, void *value);
list *listAddNodeTail(list *list, void *value);
list *listInsertNode(list *list, listNode *old_node, void *value, int after);
void listDelNode(list *list, listNode *node);
listIter *listGetIterator(list *list, int direction);
listNode *listNext(listIter *iter);
void listReleaseIterator(listIter *iter);
list *listDup(list *orig);
listNode *listSearchKey(list *list, void *key);
listNode *listIndex(list *list, long index);
void listRewind(list *list, listIter *li);
void listRewindTail(list *list, listIter *li);
void listRotate(list *list);
/* Directions for iterators */
#define AL_START_HEAD 0
#define AL_START_TAIL 1
#endif /* __ADLIST_H__ */
```

#### 3.2 listIter

在源代码中除了能看到listNode和list还发现一个结构体，listIter这是一个链表迭代器的结构体的定义，用于遍历链表的时候使用。

```java
typedef struct listIter {
    listNode *next;
    int direction;
} listIter;
/* Directions for iterators */
#define AL_START_HEAD 0
#define AL_START_TAIL 1
```

listIter中只有两个属性，一个指向下一个节点的指针，一个是表示方向的值,方向的定义分别是AL_START_HEAD 和 AL_START_TAIL ，表示从头部开始还是尾部开始。

#### 3.2 宏方法

在源代码中直接使用宏定义了一些方法，让我们来看下这些方法大概做什么的。

```java
#define listLength(l) ((l)->len)
#define listFirst(l) ((l)->head)
#define listLast(l) ((l)->tail)
#define listPrevNode(n) ((n)->prev)
#define listNextNode(n) ((n)->next)
#define listNodeValue(n) ((n)->value)
#define listSetDupMethod(l,m) ((l)->dup = (m))
#define listSetFreeMethod(l,m) ((l)->free = (m))
#define listSetMatchMethod(l,m) ((l)->match = (m))
#define listGetDupMethod(l) ((l)->dup)
#define listGetFree(l) ((l)->free)
#define listGetMatchMethod(l) ((l)->match)
```

- listLength：获取列表节点的数量，返回列表的len属性。
- listFirst：获取列表头节点的指针，返回列表的head属性。
- listLast：获取列表尾节点的指针，返回列表的tail属性。
- listPrevNode：获取上一个节点的指针，返回列表的prev属性。
- listNextNode：获取下一个节点的指针，返回列表的next属性。
- listNodeValue：获取节点值的指针，返回列表的value属性。
- listSetDupMethod：设置复制函数。
- listSetFreeMethod：设置释放函数。
- listSetMatchMethod：设置匹配函数。
- listGetDupMethod：获取复制函数。
- listGetFree：获取释放函数。
- listGetMatchMethod：获取匹配函数。

#### 3.3 方法签名

```java
list *listCreate(void);
void listRelease(list *list);
list *listAddNodeHead(list *list, void *value);
list *listAddNodeTail(list *list, void *value);
list *listInsertNode(list *list, listNode *old_node, void *value, int after);
void listDelNode(list *list, listNode *node);
listIter *listGetIterator(list *list, int direction);
listNode *listNext(listIter *iter);
void listReleaseIterator(listIter *iter);
list *listDup(list *orig);
listNode *listSearchKey(list *list, void *key);
listNode *listIndex(list *list, long index);
void listRewind(list *list, listIter *li);
void listRewindTail(list *list, listIter *li);
void listRotate(list *list);
```

- listCreate：创建一个链表。
- listRelease：释放一个链表。
- listAddNodeHead：向列表头部添加一个节点。
- listAddNodeTail：向列表尾部添加一个节点。
- listInsertNode：向列表中某个节点前后添加一个节点。
- listDelNode：删除一个节点。
- listGetIterator：获取列表迭代器。
- listNext：获取下一个列表。
- listReleaseIterator：释放列表迭代器。
- listDup：复制一个列表。
- listSearchKey：搜索某个节点。
- listIndex：通过索引返回一个节点。
- listRewind：迭代器重置到头部。
- listRewindTail：迭代器重置到尾部。
- listRotate：链表翻转 。

### 4 学习总结

**1、** listNode是链表节点的结构体定义，它有三个属性，分别是上一个节点的指针、下一个节点的指针、值的指针；

**2、** list是链表的结构体定义，它有六个熟悉，分别头尾节点的指针，还有三个函数的指针，最后是列表节点的数量；

**3、** listIter是链表迭代器的结构体定义，它有两个熟悉，一个是下一个节点的指针，另一个是遍历方向；

**4、** sds.h里有一些宏方法，例如listLength、listFirst、listLast、listPrevNode、listNextNode、listNodeValue；
