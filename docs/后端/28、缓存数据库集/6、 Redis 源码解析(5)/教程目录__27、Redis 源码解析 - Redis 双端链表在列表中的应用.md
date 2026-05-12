# 27、Redis 源码解析 - Redis 双端链表在列表中的应用
- 来源：https://ddkk.com/zhuanlan/db/redis/5/27.html
- 分类：缓存数据库
- 分组：教程目录
前几天我们学习了双端链表的源代码，想必大家已经清楚了不少有关链表的操作，这个时候再回想一下之前我们学习的数据结构列表的代码，我们知道双端链表是实现列表的数据结构之一，所以源代码里有很多关于链表的操作，今天我们就来回顾下列表的源代码，并探索下双端链表在列表的中的应用，通过这次发现我们能对列表的源代码学习就更加深入了。

今天我们要学习的源代码涉了好几个文件，不过都是我们之前阅读过的，分别是t_list.c、adlist.h、adlist.c。

### 1 listCreate

listCreate 是双端链表中用来创建一个链表的方法，看下他在列表中在哪里用到过。

#### 1.1 listTypeConvert

```java
void listTypeConvert(robj *subject, int enc) {
    listTypeIterator *li;
    listTypeEntry entry;
    redisAssertWithInfo(NULL,subject,subject->type == REDIS_LIST);
    if (enc == REDIS_ENCODING_LINKEDLIST) {
        list *l = listCreate(); //创建一个双端列表
        listSetFreeMethod(l,decrRefCountVoid);
        /* listTypeGet returns a robj with incremented refcount */
        li = listTypeInitIterator(subject,0,REDIS_TAIL);
        while (listTypeNext(li,&entry)) listAddNodeTail(l,listTypeGet(&entry));
        listTypeReleaseIterator(li);
        subject->encoding = REDIS_ENCODING_LINKEDLIST;
        zfree(subject->ptr);
        subject->ptr = l;
    } else {
        redisPanic("Unsupported list conversion");
    }
}
```

listTypeConvert 这个方法是列表用来转换数据结构的，核心逻辑是如果要进行转换的数据编码是双端链表，那么就创建一个链表，并进行相关转换动作。

### 2 listAddNodeHead

listAddNodeHead 是双端链表中用来向链表头部添加一个节点。

#### 2.1 listTypePush

```java
/* The function pushes an element to the specified list object 'subject',
 * at head or tail position as specified by 'where'.
 *
 * There is no need for the caller to increment the refcount of 'value' as
 * the function takes care of it if needed. */
void listTypePush(robj *subject, robj *value, int where) {
    /* Check if we need to convert the ziplist */
    listTypeTryConversion(subject,value);
    if (subject->encoding == REDIS_ENCODING_ZIPLIST &&
        ziplistLen(subject->ptr) >= server.list_max_ziplist_entries)
            listTypeConvert(subject,REDIS_ENCODING_LINKEDLIST);
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        int pos = (where == REDIS_HEAD) ? ZIPLIST_HEAD : ZIPLIST_TAIL;
        value = getDecodedObject(value);
        subject->ptr = ziplistPush(subject->ptr,value->ptr,sdslen(value->ptr),pos);
        decrRefCount(value);
    } else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        if (where == REDIS_HEAD) {
            listAddNodeHead(subject->ptr,value);
        } else {
            listAddNodeTail(subject->ptr,value);
        }
        incrRefCount(value);
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

listTypePush 是列表用来向列表推入成员的一个方法，根据不同的数据编码选择不同的逻辑，当数据编码是双端链表的时候，会根据压入成员的位置来选择是listAddNodeHead 还是listAddNodeTail 方法，传入的参数是链表的指针，和要压入的值。

当初学习到这段代码的时候，怕上手太难我们就简单的过了一下，不过在我们学习了双端链表的源代码，在回过头看这段代码是不是有种了然于胸的感觉，原来列表推入成员就是在双端链表结构中新增加了一个节点，新增的节点会引起被影响节点的指针指向的调整。

这样一来我们对这个方法的学习程度不知不觉又提升了不少，等后面在学习压缩列表的时候，再回头来看，就能全面掌握了。

### 3 listAddNodeTail

listAddNodeHead 是双端链表中用来向链表尾部添加一个节点。

#### 3.1 listTypeConvert

```java
void listTypeConvert(robj *subject, int enc) {
    listTypeIterator *li;
    listTypeEntry entry;
    redisAssertWithInfo(NULL,subject,subject->type == REDIS_LIST);
    if (enc == REDIS_ENCODING_LINKEDLIST) {
        list *l = listCreate(); //创建一个双端列表
        listSetFreeMethod(l,decrRefCountVoid);
        /* listTypeGet returns a robj with incremented refcount */
        li = listTypeInitIterator(subject,0,REDIS_TAIL);
        while (listTypeNext(li,&entry)) listAddNodeTail(l,listTypeGet(&entry));
        listTypeReleaseIterator(li);
        subject->encoding = REDIS_ENCODING_LINKEDLIST;
        zfree(subject->ptr);
        subject->ptr = l;
    } else {
        redisPanic("Unsupported list conversion");
    }
}
```

一看这不是老熟人，又是这个方法，在代码中我们能看到具体的一行代码使用了listAddNodeTail方法。

```java
        li = listTypeInitIterator(subject,0,REDIS_TAIL);
        while (listTypeNext(li,&entry)) listAddNodeTail(l,listTypeGet(&entry));
```

这段代码的逻辑是遍历列表的每个成员，把他们一个个推入到新建的链表结构里，为了保持之前的顺序就使用了向链表尾部添加的节点的方法，而不是向头部。

listTypeInitIterator这个方法构建了一个从头部开始，方向向后的迭代器，listTypeNext这个方法会按照向后的方向从压缩表中一个个拿出成员的值，并将拿出的值用listAddNodeTail放到链表中，全部成员转移完成之后，再讲列表的数据编码改为双端链表，并释放掉之前的压缩表。

#### 3.2 listTypePush

```java
else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        if (where == REDIS_HEAD) {
            listAddNodeHead(subject->ptr,value);
        } else {
            listAddNodeTail(subject->ptr,value);
        }
        incrRefCount(value);
    }
```

listAddNodeTail和listAddNodeHead都在这个方法中使用到，唯一的区别就是插入的位置不同。

### 4 listInsertNode

listAddNodeHead 是双端链表中用来向链表某个节点的前面或者后面插入一个新的节点。

#### 4.1 listTypeInsert

```java
void listTypeInsert(listTypeEntry *entry, robj *value, int where) {
    robj *subject = entry->li->subject;
    if (entry->li->encoding == REDIS_ENCODING_ZIPLIST) {
        value = getDecodedObject(value);
        if (where == REDIS_TAIL) {
            unsigned char *next = ziplistNext(subject->ptr,entry->zi);
            /* When we insert after the current element, but the current element
             * is the tail of the list, we need to do a push. */
            if (next == NULL) {
                subject->ptr = ziplistPush(subject->ptr,value->ptr,sdslen(value->ptr),REDIS_TAIL);
            } else {
                subject->ptr = ziplistInsert(subject->ptr,next,value->ptr,sdslen(value->ptr));
            }
        } else {
            subject->ptr = ziplistInsert(subject->ptr,entry->zi,value->ptr,sdslen(value->ptr));
        }
        decrRefCount(value);
    } else if (entry->li->encoding == REDIS_ENCODING_LINKEDLIST) {
        if (where == REDIS_TAIL) {
            listInsertNode(subject->ptr,entry->ln,value,AL_START_TAIL);
        } else {
            listInsertNode(subject->ptr,entry->ln,value,AL_START_HEAD);
        }
        incrRefCount(value);
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

listTypeInsert 这个方法被pushxGenericCommand调用，用于rpushx、lpushx、linsert命令，核心逻辑先找到要插入节点的位置，然后调用双端链表的listInsertNode，修改被影响节点的指针指向。

### 5 listDelNode

listDelNode是双端链表中用来删除某个节点。

#### 5.1 listTypePop

```java
robj *listTypePop(robj *subject, int where) {
    robj *value = NULL;
    if (subject->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *p;
        unsigned char *vstr;
        unsigned int vlen;
        long long vlong;
        int pos = (where == REDIS_HEAD) ? 0 : -1;
        p = ziplistIndex(subject->ptr,pos);
        if (ziplistGet(p,&vstr,&vlen,&vlong)) {
            if (vstr) {
                value = createStringObject((char*)vstr,vlen);
            } else {
                value = createStringObjectFromLongLong(vlong);
            }
            /* We only need to delete an element when it exists */
            subject->ptr = ziplistDelete(subject->ptr,&p);
        }
    } else if (subject->encoding == REDIS_ENCODING_LINKEDLIST) {
        list *list = subject->ptr;
        listNode *ln;
        if (where == REDIS_HEAD) {
            ln = listFirst(list);
        } else {
            ln = listLast(list);
        }
        if (ln != NULL) {
            value = listNodeValue(ln);
            incrRefCount(value);
            listDelNode(list,ln);
        }
    } else {
        redisPanic("Unknown list encoding");
    }
    return value;
}
```

listTypePop 是列表用来弹出一个成员的方法，如果数据编码是双端链表的话，则会根据弹出的位置来调用双端链表的listFirst或者listLast方法，分别获取链表的头部节点或者尾部节点，如果获取到的话就调用listDelNode这个方法删除节点。

#### 5.2 listTypeDelete

```java
void listTypeDelete(listTypeEntry *entry) {
    listTypeIterator *li = entry->li;
    if (li->encoding == REDIS_ENCODING_ZIPLIST) {
        unsigned char *p = entry->zi;
        li->subject->ptr = ziplistDelete(li->subject->ptr,&p);
        /* Update position of the iterator depending on the direction */
        if (li->direction == REDIS_TAIL)
            li->zi = p;
        else
            li->zi = ziplistPrev(li->subject->ptr,p);
    } else if (entry->li->encoding == REDIS_ENCODING_LINKEDLIST) {
        listNode *next;
        if (li->direction == REDIS_TAIL)
            next = entry->ln->next;
        else
            next = entry->ln->prev;
        listDelNode(li->subject->ptr,entry->ln);
        li->ln = next;
    } else {
        redisPanic("Unknown list encoding");
    }
}
```

listTypeDelete是列表中用来删除成员的方法，在lrem命令中会使用到。

### 6 总览

链表方法
列表调用处

listCreate
listTypeConvert

listAddNodeHead
listTypePush

listAddNodeTail
listTypePush、listTypeConvert

listInsertNode
listTypeInsert

listDelNode
listTypePop、listTypeDelete、lremCommand、ltrimCommand

### 7 总结

经过一番探究，其实我们可以发现链表的数据结构和列表的操作还是比较契合的。

**1、** 支持头尾操作，例如压入成员和弹出成员；

**2、** 支持顺序插入，每个成员之间的顺序是有序的；

**3、** 支持顺序遍历，可以按照插入的顺序遍历出成员；
