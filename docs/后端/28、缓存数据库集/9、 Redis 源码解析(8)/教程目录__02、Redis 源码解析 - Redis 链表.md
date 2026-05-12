# 02、Redis 源码解析 - Redis 链表
- 来源：https://ddkk.com/zhuanlan/db/redis/8/2.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

链表在Redis中的应用非常广泛，比如列表键的底层实现之一就是链表. 当一个列表键包含了数量比较多的元素，又或者列表键中包含的元素都是比较长的字符串时，Redis就会使用链表作为列表键的底层实现（短的话用压缩列表）.

除了链表键之外，发布与订阅、慢查询、监视器等功能也用到了链表，Redis 服务器本身还使用链表来保存多个客户端的状态信息，以及使用链表来构建客户端输出缓冲区（outputbuffer）.

在redis中，链表结构被实现为双端链表，因此，在头部和尾部进行的操作就会非常快.

### 2. 链表的实现

Redis的链表结构被定义在`adlist.h`和`adlist.c`中.

#### 2.1 链表节点的实现

```java
typedef struct listNode {
	// 前驱节点
    struct listNode *prev;
    // 后继节点
    struct listNode *next;
    // 万能指针，用于保存节点的值
    void *value;
} listNode;
```

多个listNode可以通过prev和next指针组成双端链表，好处是可以让获取某个节点的前驱节点和后继节点的复杂度为`O(1)`.

#### 2.2 表头的实现

Redis还为双端链表提供了一个表头，用于存放链表的信息：

```java
typedef struct list {
	// 链表头结点指针
    listNode *head;   
    // 链表尾结点指针      
    listNode *tail;         
    // 下面的三个函数指针就像类中的成员函数一样
    // 复制链表节点保存的值
    void *(*dup)(void *ptr);   
    // 释放链表节点保存的值 
    void (*free)(void *ptr);
    // 比较链表节点所保存的节点值和另一个输入的值是否相等   
    int (*match)(void *ptr, void *key); 
    // 链表长度计数器
    unsigned long len;
} list;
```

下图是一个由表头和三个节点组成的链表：

### 3. 双端链表的优点

**1. 双端**

链表节点带有prev和next指针，获取某个节点的前置节点和后置节点的复杂度都是`O(1)`.

**2. 无环**

表头节点的prev指针和表尾节点的next指针都指向NULL，对链表的访问以NULL为终点.

**3. 带表头指针和表尾指针**

通过list结构的head指针和tail指针，程序获取链表的表头节点和表尾节点的复杂度为`O(1)`.

**4. 带链表长度计数器**

程序使用list结构的len属性来对list持有的链表节点进行计数，程序获取链表中节点数量的复杂度为`O(1)`.

**5. 多态**

链表节点使用`void*`指针来保存节点值，并且可以通过list结构的`dup`、`free`、`match`三个属性为节点值设置类型特定函数，所以链表可以用于保存各种不同类型的值.

### 4. 部分源码剖析

#### 4.1 迭代器

Redis为双端链表封装了一个迭代器，可以使用迭代器对链表执行遍历操作.

```java
// 正向迭代
#define AL_START_HEAD 0
// 反向迭代    
#define AL_START_TAIL 1     
typedef struct listIter {
	// 迭代器当前指向的节点
    listNode *next;
    // 迭代方向，可以取以下两个值：AL_START_HEAD 和 AL_START_TAIL
    int direction;
} listIter;
```

```java
// 为list创建一个迭代器iterator
listIter *listGetIterator(list *list, int direction) {
    listIter *iter;
	// 为迭代器申请空间
    if ((iter = zmalloc(sizeof(*iter))) == NULL) return NULL;
    // 设置迭代指针的起始位置
    if (direction == AL_START_HEAD)     
        iter->next = list->head;
    else
        iter->next = list->tail;
    // 设置迭代方向
    iter->direction = direction;        
    return iter;
}
// 销毁迭代器
void listReleaseIterator(listIter *iter) {
    zfree(iter);
}
// 将迭代器li重置为list的头结点并且设置为正向迭代
void listRewind(list *list, listIter *li) {
	// 设置迭代指针的起始位置
    li->next = list->head;
    // 设置迭代方向从头到尾           
    li->direction = AL_START_HEAD;      
}
// 将迭代器li重置为list的尾结点并且设置为反向迭代
void listRewindTail(list *list, listIter *li) {
	// 设置迭代指针的起始位置
    li->next = list->tail;        
    // 设置迭代方向从尾到头      
    li->direction = AL_START_TAIL;
}
// 返回迭代器iter指向的当前节点并更新iter
listNode *listNext(listIter *iter) {
	// 备份当前迭代器指向的节点
    listNode *current = iter->next; 
    if (current != NULL) {
	    // 根据迭代方向更新迭代指针
        if (iter->direction == AL_START_HEAD)   
            iter->next = current->next;
        else
            iter->next = current->prev;
    }
    // 返回备份的当前节点地址
    return current;     
}
```

#### 4.2 链表的创建和销毁

```java
// 创建一个表头
list *listCreate(void)  {
    struct list *list;
    // 为表头分配内存
    if ((list = zmalloc(sizeof(*list))) == NULL)
        return NULL;
    // 初始化表头
    list->head = list->tail = NULL;
    list->len = 0;
    list->dup = NULL;
    list->free = NULL;
    list->match = NULL;
	// 返回表头
    return list;    
}
```

```java
// 销毁list表头和链表
void listRelease(list *list) {
    unsigned long len;
    listNode *current, *next;
	// 备份头节点地址
    current = list->head;
    // 备份链表元素个数，使用备份操作防止更改原有信息
    len = list->len;
    // 遍历链表
    while(len--) {
        next = current->next;
        // 如果设置了list结构的释放函数，则调用该函数释放节点值
        if (list->free) list->free(current->value);
        zfree(current);
        current = next;
    }
    // 最后释放表头
    zfree(list);
}
```

#### 4.3 头插和尾插

```java
// 将value添加到list链表的头部
list *listAddNodeHead(list *list, void *value) {
    listNode *node;
	// 为新节点分配空间
    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    // 设置node的value值
    node->value = value;
	// 将node头插到空链表
    if (list->len == 0) {
        list->head = list->tail = node;
        node->prev = node->next = NULL;
    } else {
    	// 将node头插到非空链表
        node->prev = NULL;
        node->next = list->head;
        list->head->prev = node;
        list->head = node;
    }
	// 链表元素计数器加1
    list->len++;    
    return list;
}
```

```java
// 将value添加到list链表的尾部
list *listAddNodeTail(list *list, void *value) {
    listNode *node;
	// 为新节点分配空间
    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    // 设置node的value值
    node->value = value;
    // 将node尾插到空链表
    if (list->len == 0) {
        list->head = list->tail = node;
        node->prev = node->next = NULL;
    } else {
	    // 将node头插到非空链表
        node->prev = list->tail;
        node->next = NULL;
        list->tail->next = node;
        list->tail = node;
    }
    // 更新链表节点计数器
    list->len++;
    return list;
}
```

#### 4.4 根据某个节点的位置插入一个值

```java
// 在list中，根据after在old_node节点前后插入值为value的节点
list *listInsertNode(list *list, listNode *old_node, void *value, int after) {
    listNode *node;
	// 为新节点分配空间
    if ((node = zmalloc(sizeof(*node))) == NULL) 
        return NULL;
    // 设置node的value值
    node->value = value;
	// after 非零，则将节点插入到old_node的后面
    if (after) {
        node->prev = old_node;
        node->next = old_node->next;
        // 目标节点如果是链表的尾节点，更新list的tail指针
        if (list->tail == old_node) {
            list->tail = node;
        }
    } else {
	    // after 为零，则将节点插入到old_node的前面
        node->next = old_node;
        node->prev = old_node->prev;
        // 如果节点如果是链表的头节点，更新list的head指针
        if (list->head == old_node) {
            list->head = node;
        }
    }
    // 如果有，则更新node的前驱节点的指针
    if (node->prev != NULL) {
        node->prev->next = node;
    }
    // 如果有，则更新node的后继节点的指针
    if (node->next != NULL) {
        node->next->prev = node;
    }
    // 更新链表节点计数器
    list->len++;
    return list;
}
```

#### 4.5 删除节点

```java
void listDelNode(list *list, listNode *node) {
	// 更新node的前驱节点的指针
    if (node->prev) 
        node->prev->next = node->next;
    else
        list->head = node->next;
    // 更新node的后继节点的指针
    if (node->next) 
        node->next->prev = node->prev;
    else
        list->tail = node->prev;
	// 如果设置了list结构的释放函数，则调用该函数释放节点值
    if (list->free) list->free(node->value);
    // 释放节点
    zfree(node);
    // 更新链表节点计数器
    list->len--;
}
```

#### 4.6 查找节点

```java
// 在list中查找value为key的节点并返回
listNode *listSearchKey(list *list, void *key)
{
    listIter *iter;
    listNode *node;
	// 创建迭代器
    iter = listGetIterator(list, AL_START_HEAD);
    // 迭代整个链表
    while((node = listNext(iter)) != NULL) {
    	// 如果设置list结构中的match方法，则用该方法比较
        if (list->match) {
            if (list->match(node->value, key)) {
	            // 如果找到，释放迭代器返回node地址
                listReleaseIterator(iter);
                return node;
            }
        } else {
            if (key == node->value) {
                listReleaseIterator(iter);
                return node;
            }
        }
    }
    // 释放迭代器
    listReleaseIterator(iter);
    return NULL;
}
```

```java
// 返回下标为index的节点地址
listNode *listIndex(list *list, long index) {
    listNode *n;
    if (index < 0) {
    	// 如果下标为负数，从链表尾部开始
        index = (-index)-1;
        n = list->tail;
        while(index-- && n) n = n->prev;
    } else {
        n = list->head;
        // 如果下标为正数，从链表头部开始
        while(index-- && n) n = n->next;
    }
    return n;
}
```

#### 4.7 拷贝链表

```java
// 拷贝表头为orig的链表并返回
list *listDup(list *orig)
{
    list *copy;
    listIter *iter;
    listNode *node;
	// 创建一个表头
    if ((copy = listCreate()) == NULL)
        return NULL;
    // 设置新建表头的处理函数
    copy->dup = orig->dup;
    copy->free = orig->free;
    copy->match = orig->match;
    // 迭代整个orig的链表
    // 为orig定义一个迭代器并设置迭代方向
    iter = listGetIterator(orig, AL_START_HEAD);
	// 迭代器根据迭代方向不停迭代
    while((node = listNext(iter)) != NULL) {
        void *value;
        // 复制节点值到新节点
        if (copy->dup) {
	        // 如果定义了list结构中的dup指针，则使用该方法拷贝节点值
            value = copy->dup(node->value); 
            if (value == NULL) {
                listRelease(copy);
                listReleaseIterator(iter);
                return NULL;
            }
        } else
	        // 获得当前node的value值
            value = node->value;
		// 将node节点尾插到copy表头的链表中
        if (listAddNodeTail(copy, value) == NULL) {
            listRelease(copy);
            listReleaseIterator(iter);
            return NULL;
        }
    }
    // 自行释放迭代器
    listReleaseIterator(iter);
    // 返回拷贝副本
    return copy;
}
```
