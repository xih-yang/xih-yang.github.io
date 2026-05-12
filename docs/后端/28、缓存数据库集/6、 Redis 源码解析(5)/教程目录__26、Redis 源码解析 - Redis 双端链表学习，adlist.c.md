# 26、Redis 源码解析 - Redis 双端链表学习，adlist.c
- 来源：https://ddkk.com/zhuanlan/db/redis/5/26.html
- 分类：缓存数据库
- 分组：教程目录
### 1 listCreate

#### 1.1 方法说明

创建一个双端链表。

#### 1.2 方法源代码

```java
	list *listCreate(void)
	{
	    struct list *list;
	    if ((list = zmalloc(sizeof(*list))) == NULL)
	        return NULL;
	    list->head = list->tail = NULL;
	    list->len = 0;
	    list->dup = NULL;
	    list->free = NULL;
	    list->match = NULL;
	    return list;
	}
```

#### 1.3 方法理解

**1、** 先声明一个双端链表的结构体指针；

**2、** 为这个指针分配内存；

**3、** 链表相关属性初始化；

**4、** 返回链表指针；

### 2 listRelease

#### 2.1 方法说明

释放整个双端链表。

#### 2.2 方法源代码

```java
/* Free the whole list.
 *
 * This function can't fail. */
void listRelease(list *list)
{
    unsigned long len;
    listNode *current, *next;
    current = list->head;
    len = list->len;
    while(len--) {
        next = current->next;
        if (list->free) list->free(current->value);
        zfree(current);
        current = next;
    }
    zfree(list);
}
```

#### 2.3 方法理解

**1、** 获取双端链表的头节点和链表的节点数量；

**2、** 开始遍历链表节点；

**3、** 如果链表存在释放函数，则调用释放函数；

**4、** 释放当前节点内存；

**5、** 释放整个链表；

### 3 listAddNodeHead

#### 3.1 方法说明

向链表头部添加一个节点。

#### 3.2 方法源代码

```java
/* Add a new node to the list, to head, containing the specified 'value'
 1. pointer as value.
 2.  3. On error, NULL is returned and no operation is performed (i.e. the
 4. list remains unaltered).
 5. On success the 'list' pointer you pass to the function is returned. */
list *listAddNodeHead(list *list, void *value)
{
    listNode *node;
	//分配内存
    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    //将值的指针赋值给节点的value属性
    node->value = value;
	//如果链表节点数量为0
    if (list->len == 0) {
        list->head = list->tail = node;//将链表头指针和尾指针都指向新节点
        node->prev = node->next = NULL;//将新节点的前指针和后指针都指向NULL
    }
    //如果链表包含节点
	else {
        node->prev = NULL;    //将新节点的前指针指向NULL
        node->next = list->head;//将新节点的后指针指向链表的原头节点
        list->head->prev = node;//将链表的原头节点的前指针指向新节点
        list->head = node;//将链表的头指针指向新的节点
    }
    list->len++;//链表的节点数量加1
    return list;
}
```

#### 3.3 方法理解

**1、** 创建一个新的链表节点；

**2、** 将节点的值赋值给节点的value属性；

**3、** 如果链表没有节点，则将链表的头尾指针指向新节点，并将新节点的前后指针指向NULL；

**4、** 如果链表由节点，则将新节点的后指针指向原先的头节点，并将链表的头指针指向新的节点；

**5、** 链表节点数量加1；

如果对C语言指针不了解的同学，可能要去熟悉一下C语言有关指针相关的知识，要不然后面很多代码都是和指针相关，这里看似很多箭头其实大体意思就是把新加的节点放到链表的头部去，那么原先的头部节点肯定就不能再是头结点了，所以要调整相关节点和链表的指针。

### 4 listAddNodeTail

#### 4.1 方法说明

向链表尾部添加一个节点。

#### 4.2 方法源代码

```java
/* Add a new node to the list, to tail, containing the specified 'value'
 * pointer as value.
 *
 * On error, NULL is returned and no operation is performed (i.e. the
 * list remains unaltered).
 * On success the 'list' pointer you pass to the function is returned. */
list *listAddNodeTail(list *list, void *value)
{
    listNode *node;
    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    node->value = value;
    if (list->len == 0) {
        list->head = list->tail = node;//将链表头指针和尾指针都指向新节点
        node->prev = node->next = NULL;//将新节点的后指针指向链表的头节点
    } else {
        node->prev = list->tail;//将新节点的前指针指向链表原尾节点
        node->next = NULL;//将新节点的后指针指向NULL
        list->tail->next = node;//将链表原尾节点的后指针指向新的节点
        list->tail = node;//将链表的尾指针指向新的节点
    }
    list->len++;
    return list;
}
```

#### 4.3 方法理解

这个方法和 listAddNodeHead 大致相同，如果链表没有节点那么它们的操作是一样的，有节点会调整尾节点和链表的相关指针，目的是为了让新节点成为新的尾节点，能理解 listAddNodeHead 方法的话，这个方法也是一样的。

### 5 listInsertNode

#### 5.1 方法说明

向链表中某个节点前面或者后面添加一个新的节点。

#### 5.2 方法源代码

```java
list *listInsertNode(list *list, listNode *old_node, void *value, int after) {
    listNode *node;
    if ((node = zmalloc(sizeof(*node))) == NULL)
        return NULL;
    node->value = value;
	//如果位置是后面
    if (after) {
        node->prev = old_node;//将新节点的前指针指向老节点
        node->next = old_node->next;//将新节点的后指针指向老节点的后指针
		//如果老节点的是尾节点，则将尾指针指向新节点
        if (list->tail == old_node) {
            list->tail = node;
        }
    } 
	//如果位置是前面
	else {
        node->next = old_node;//将新节点的后指针指向老节点
        node->prev = old_node->prev;//将新节点的前指针指向老节点的前指针
		//如果老节点的是头节点，则将头指针指向新节点
        if (list->head == old_node) {
            list->head = node;
        }
    }
	//如果新节点的前指针不是NULL
    if (node->prev != NULL) {
        node->prev->next = node;//将新节点前面的节点的后指针指向自己
    }
    if (node->next != NULL) {
        node->next->prev = node;//将新节点后面的节点的前指针指向自己
    }
    list->len++;
    return list;
}
```

#### 5.3 方法理解

这个方法也是添加新的节点，不过不同于之前的 listAddNodeHead 和 listAddNodeTail，前面两个方法是在头部和尾部添加节点也就是最多影响一个老的节点，但是这个方法是在链表中间添加节点所以可能会影响两个节点，所以需要调整前后被影响的节点让它们的前后指针能执行自己，新节点的前后指针也能指向它们。

连续学习三个添加节点的方法，想必大家对这种链表添加节点的套路已经开始熟悉起来，无非就是调一调指针就好。

### 6 listDelNode

#### 6.1 方法说明

从链表中删除一个节点。

#### 6.2 方法源代码

```java
/* Remove the specified node from the specified list.
 * It's up to the caller to free the private value of the node.
 *
 * This function can't fail. */
void listDelNode(list *list, listNode *node)
{
	//如果被删除的节点前面有节点
    if (node->prev)
        node->prev->next = node->next;//将被删除节点前面的节点的后指针，指向被删除节点的后一个节点。
    else
        list->head = node->next;//将链表头指针，指向被删除节点的后一个节点。
	//如果被删除的节点后面有节点
    if (node->next)
        node->next->prev = node->prev;//将被删除节点后面的节点的前指针，指向被删除节点的前一个节点。
    else
        list->tail = node->prev;//将链表尾指针，指向被删除节点的前一个节点。
    if (list->free) list->free(node->value);
    zfree(node);
    list->len--;
}
```

#### 6.3 方法理解

这个方法其实和之前几个添加节点的方法核心逻辑差不多，都是调节指针，相当于一个逆向的操作过程，添加节点的时候是把前后节点和自己关联起来，删除节点的时候是把前后节点对自己解除关联，如果影响到了头尾节点的变化还要修改链表的头尾指针。

### 7 迭代器相关方法

#### 7.1 方法说明

迭代器主要是用来遍历链表的，包括listGetIterator、listReleaseIterator、listRewind、listRewindTail、listNext几个方法。

#### 7.2 方法源代码

```java
/* Returns a list iterator 'iter'. After the initialization every
 * call to listNext() will return the next element of the list.
 *
 * This function can't fail. */
listIter *listGetIterator(list *list, int direction)
{
	//声明一个迭代器指针
    listIter *iter;
	//分配内存
    if ((iter = zmalloc(sizeof(*iter))) == NULL) return NULL;
 	//如果遍历方向是头部开始
    if (direction == AL_START_HEAD)
        iter->next = list->head;//迭代器后指针指向链表的头节点
    else
        iter->next = list->tail;//迭代器后指针指向链表的尾节点
	//赋值迭代器方向
    iter->direction = direction;
    return iter;
}
/* Release the iterator memory */
//释放链表迭代器
void listReleaseIterator(listIter *iter) {
    zfree(iter);
}
/* Create an iterator in the list private iterator structure */
//将迭代器重置为一个头部开始的迭代器
void listRewind(list *list, listIter *li) {
    li->next = list->head;
    li->direction = AL_START_HEAD;
}
//将迭代器重置为一个尾部开始的迭代器
void listRewindTail(list *list, listIter *li) {
    li->next = list->tail;
    li->direction = AL_START_TAIL;
}
//获取下一个节点
listNode *listNext(listIter *iter)
{
    listNode *current = iter->next;
    if (current != NULL) {
        if (iter->direction == AL_START_HEAD)
            iter->next = current->next;
        else
            iter->next = current->prev;
    }
    return current;
}
```

#### 7.3 方法理解

这是有关于链表遍历的一系列方法，分别有 listGetIterator、listReleaseIterator、listRewind、listRewindTail、listNext。

遍历的思路应该是先通过listGetIterator获取一个迭代器，然后调用 listNext 来获取当前的节点，并将迭代器的next属性更新为下一个节点，而遍历的方向就是通过迭代器里 direction 属性来控制，获取到下一个节点之后会将下一个节点重新更新到next属性中。

### 8 总结

**1、** 链表中添加节点的方法有listAddNodeHead、listAddNodeTail、listInsertNode；

**2、** 链表中删除节点的方法有listDelNode；

**3、** 链表新增或者删除节点需要调整被影响节点的前后指针，如果还影响了头尾节点，则还需要调整链表的头尾指针；

**4、** 链表遍历相关的迭代器方法有listGetIterator、listReleaseIterator、listRewind、listRewindTail；

**5、** 链表遍历主要靠listNext方法来获取下一个节点；
