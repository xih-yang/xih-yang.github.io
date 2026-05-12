# 31、Redis 源码解析 - Redis 字典学习，dict.c（一）
- 来源：https://ddkk.com/zhuanlan/db/redis/5/31.html
- 分类：缓存数据库
- 分组：教程目录
### 1 dictCreate

#### 1.1 方法说明

创建一个新的 hash table

#### 1.2 方法源码

```java
	/* Create a new hash table */
	dict *dictCreate(dictType *type,
	        void *privDataPtr)
	{
	    dict *d = zmalloc(sizeof(*d));//分配内存
	    _dictInit(d,type,privDataPtr);//字典初始化
	    return d;
	}
```

#### 1.3 相关方法

##### 1.3.1 _dictInit

```java
	/* Initialize the hash table */
	int _dictInit(dict *d, dictType *type,
	        void *privDataPtr)
	{
	    _dictReset(&d->ht[0]);
	    _dictReset(&d->ht[1]);
	    d->type = type;
	    d->privdata = privDataPtr;
	    d->rehashidx = -1;
	    d->iterators = 0;
	    return DICT_OK;
	}
```

##### 1.3.2 _dictReset

```java
	/* Reset a hash table already initialized with ht_init().
	 * NOTE: This function should only be called by ht_destroy(). */
	static void _dictReset(dictht *ht)
	{
	    ht->table = NULL;
	    ht->size = 0;
	    ht->sizemask = 0;
	    ht->used = 0;
	}
```

#### 1.4 代码理解

**1、** 先申明一个字典结构体，并分配相应内存；

**2、** 调用_dictInit初始化字典；

**3、** 调用_dictReset初始化字典中两个哈希表；

**4、** 将哈希表中几个属性字段都设置为初始值；

### 2 dictAdd

#### 2.1 方法说明

增加一个哈希节点到哈希表中。

#### 2.2 方法源码

```java
/* Add an element to the target hash table */
int dictAdd(dict *d, void *key, void *val)
{
    dictEntry *entry = dictAddRaw(d,key);
    if (!entry) return DICT_ERR;
    dictSetVal(d, entry, val);
    return DICT_OK;
}
```

#### 2.3 相关代码

##### 2.3.1 dictAddRaw

```java
/* Low level add. This function adds the entry but instead of setting
 * a value returns the dictEntry structure to the user, that will make
 * sure to fill the value field as he wishes.
 *
 * This function is also directly exposed to the user API to be called
 * mainly in order to store non-pointers inside the hash value, example:
 *
 * entry = dictAddRaw(dict,mykey);
 * if (entry != NULL) dictSetSignedIntegerVal(entry,1000);
 *
 * Return values:
 *
 * If key already exists NULL is returned.
 * If key was added, the hash entry is returned to be manipulated by the caller.
 */
dictEntry *dictAddRaw(dict *d, void *key)
{
    int index;
    dictEntry *entry;
    dictht *ht;
	// 如果字典在进行 rahase 中，则进行一步 rahash
    if (dictIsRehashing(d)) _dictRehashStep(d);
    /* Get the index of the new element, or -1 if
     * the element already exists. */
    // 获取建的索引
    if ((index = _dictKeyIndex(d, key)) == -1)
        return NULL;
    /* Allocate the memory and store the new entry */
    // 如果在 rehash 中 则返回第二个 hash 表中
    // 将新的哈希节点加入第二个 hash 表中
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    entry = zmalloc(sizeof(*entry));
    entry->next = ht->table[index];
    ht->table[index] = entry;
    ht->used++;
    /* Set the hash entry fields. */
    //设置哈希建
    dictSetKey(d, entry, key);
    return entry;
}
```

##### 2.3.2 _dictKeyIndex

```java
/* Returns the index of a free slot that can be populated with
 * a hash entry for the given 'key'.
 * If the key already exists, -1 is returned.
 *
 * Note that if we are in the process of rehashing the hash table, the
 * index is always returned in the context of the second (new) hash table. */
static int _dictKeyIndex(dict *d, const void *key)
{
    unsigned int h, idx, table;
    dictEntry *he;
    /* Expand the hash table if needed */
    if (_dictExpandIfNeeded(d) == DICT_ERR)
        return -1;
    /* Compute the key hash value */
    h = dictHashKey(d, key);
    for (table = 0; table <= 1; table++) {
        idx = h & d->ht[table].sizemask;
        /* Search if this slot does not already contain the given key */
        he = d->ht[table].table[idx];
        while(he) {
            if (dictCompareKeys(d, key, he->key))
                return -1;
            he = he->next;
        }
        if (!dictIsRehashing(d)) break;
    }
    return idx;
}
```

#### 2.4 代码理解

**1、** 调用dictAddRaw增加一个哈希节点；

**2、** 计算键的索引值，如果该值已经存在则返回错误；

**3、** 如果正在进行rehash的话，会向第二个哈希表中新增节点；

**4、** 调用宏定义方法dictSetKey设置哈希节点的键；

**5、** 调用宏定义方法dictSetVal设置哈希节点的值；

### 3 学习总结

**1、** 增加新的哈希节点的时候，如果节点已存在则会报错；

**2、** 调用dictHashKey计算键的哈希值；

**3、** 再用哈希值与字典掩码计算出索引位置；

**4、** 遍历两个哈希表，判断键是否已存在；

**5、** 如果字典正在rehash中的话，则新增的节点会加到第二个哈希表中；

**6、** 如果字典正在rehash中的话，则会进行一步的rehash的动作；
