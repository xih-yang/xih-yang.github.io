# 32、Redis 源码解析 - Redis 字典学习，dict.c（二）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/32.html
- 分类：缓存数据库
- 分组：教程目录
### 1 dictReplace

#### 1.1 方法说明

添加一个元素，如果该键已经存在，则丢弃旧的。

#### 1.2 方法源码

```java
/* Add an element, discarding the old if the key already exists.
 * Return 1 if the key was added from scratch, 0 if there was already an
 * element with such key and dictReplace() just performed a value update
 * operation. */
int dictReplace(dict *d, void *key, void *val)
{
    dictEntry *entry, auxentry;
    /* Try to add the element. If the key
     * does not exists dictAdd will suceed. */
    if (dictAdd(d, key, val) == DICT_OK)
        return 1;
    /* It already exists, get the entry */
    entry = dictFind(d, key);
    /* Set the new value and free the old one. Note that it is important
     * to do that in this order, as the value may just be exactly the same
     * as the previous one. In this context, think to reference counting,
     * you want to increment (set), and then decrement (free), and not the
     * reverse. */
    auxentry = *entry;
    dictSetVal(d, entry, val);
    dictFreeVal(d, &auxentry);
    return 0;
}
```

#### 1.3 代码理解

**1、** 先尝试去增加一个节点，如果增加成功则返回1；

**2、** 如果增加失败表示这个键已存在，则根据键寻找这个节点；

**3、** 先设置新值，在释放旧值；

### 2 dictGenericDelete

#### 2.1 方法说明

字典删除节点通用方法

#### 2.2 方法源码

```java
/* Search and remove an element */
static int dictGenericDelete(dict *d, const void *key, int nofree)
{
    unsigned int h, idx;
    dictEntry *he, *prevHe;
    int table;
	// 判断哈希表长度是否为 0
    if (d->ht[0].size == 0) return DICT_ERR; /* d->ht[0].table is NULL */
    if (dictIsRehashing(d)) _dictRehashStep(d);
	// 计算 hash 值
    h = dictHashKey(d, key);
	// 遍历两个 hash 表
    for (table = 0; table <= 1; table++) {
    	// 计算索引值
        idx = h & d->ht[table].sizemask;
  		// 获取节点
        he = d->ht[table].table[idx];
        prevHe = NULL;
        // 遍历相同索引位置所有节点
        while(he) {
            if (dictCompareKeys(d, key, he->key)) {
                /* Unlink the element from the list */
                if (prevHe)
                    prevHe->next = he->next;
                else
                    d->ht[table].table[idx] = he->next;
                if (!nofree) {
                    dictFreeKey(d, he);
                    dictFreeVal(d, he);
                }
                // 释放节点，并且节点使用数量减一
                zfree(he);
                d->ht[table].used--;
                return DICT_OK;
            }
            prevHe = he;
            he = he->next;
        }
        if (!dictIsRehashing(d)) break;
    }
    return DICT_ERR; /* not found */
}
```

#### 2.3 相关代码

##### 2.3.1 dictDelete

```java
int dictDelete(dict *ht, const void *key) {
    return dictGenericDelete(ht,key,0);
}
```

##### 2.3.2 dictDeleteNoFree

```java
int dictDeleteNoFree(dict *ht, const void *key) {
    return dictGenericDelete(ht,key,1);
}
```

#### 2.4 代码理解

**1、** 判断哈希表长度是否为0，为0的话直接返回错误；

**2、** 判断当前是否正在进行rehash中，如果是的话则进行一步rehash操作；

**3、** 计算要删除节点的hash值；

**4、** 遍历两个哈希表，都要进行相应地删除操作；

**5、** 根据hash值和掩码计算出键的索引值位置；

**6、** 遍历索引值位置所有的节点，比较键是否相同，找到该节点；

**7、** 找到节点之后释放节点，并且让哈希表的数量减1；

**8、** 如果正在rehash中，则不删除第二个哈希表中的节点；

### 3 dictFind

#### 3.1 方法说明

寻找一个哈希节点，如果找到就返回哈希节点，没有返回 NULL。

#### 3.2 方法源码

```java
dictEntry *dictFind(dict *d, const void *key)
{
    dictEntry *he;
    unsigned int h, idx, table;
    if (d->ht[0].size == 0) return NULL; /* We don't have a table at all */
    if (dictIsRehashing(d)) _dictRehashStep(d);
    h = dictHashKey(d, key);
    for (table = 0; table <= 1; table++) {
        idx = h & d->ht[table].sizemask;
        he = d->ht[table].table[idx];
        while(he) {
            if (dictCompareKeys(d, key, he->key))
                return he;
            he = he->next;
        }
        if (!dictIsRehashing(d)) return NULL;
    }
    return NULL;
}
```

#### 3.3 方法理解

**1、** 判断哈希表长度是否为0，为0的话直接返回错误；

**2、** 判断当前是否正在进行rehash中，如果是的话则进行一步rehash操作；

**3、** 计算要删除节点的hash值；

**4、** 遍历两个哈希表；

**5、** 根据hash值和掩码计算出键的索引值位置；

**6、** 遍历索引值位置所有的节点，比较键是否相同，如果找到则返回该节点；

**7、** 如果正在rehash中，遍历完第1个哈希表之后没找到则返回NULL；

### 4 学习总结

**1、** 本节主要学习了字典中的dictReplace、dictGenericDelete、dictFind三个方法；

**2、** 可以看到的字典中大部分的代码都会判断当前是否进行rehash动作；

**3、** 如果正在进行rehash动作的话，会进行一步的rehash动作；

**4、** 如果正在进行rehash动作的话，不会删除第二个哈希表的节点；

**5、** 可以发现大部分的方法都是一样的流程，计算哈希值，计算索引值，遍历索引节点；
