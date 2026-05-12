# 03、Redis 源码解析 - Redis 跳跃表
- 来源：https://ddkk.com/zhuanlan/db/redis/7/3.html
- 分类：缓存数据库
- 分组：教程目录
跳跃表是一个非常实用的数据结构,有趋近于红黑树的效率,却比红黑树简单的多.Redis中用跳跃表来作为有序set的数据结构之一,在集群中也有使用,确实是我们应该掌握的一种数据结构.redis中跳跃表的实现也是非常的经典,且十分易懂,不管从什么角度来说,于我们而言确实都是很值得学习的.

我们首先来看看基础的数据结构

```java
typedef struct zskiplistNode {
    // 成员对象 用于存储真正的值
    robj *obj;
    // 分值 我们在存储有序set是需要指定的分值
    double score;
    // 回退指针 
    struct zskiplistNode *backward;
    // 层的数据结构 跳跃表的核心
    struct zskiplistLevel {
        // 前进指针
        struct zskiplistNode *forward;
        // 跨度 用于更快的(logn)算出某节点在全部节点中的排名
        unsigned int span;
    } level[]; //默认32
} zskiplistNode;
/*
 * 跳跃表
 */
typedef struct zskiplist {
    // 表头节点和表尾节点
    struct zskiplistNode *header, *tail;
    // 表中节点的数量
    unsigned long length;
    // 表中层数最大的节点的层数
    int level;
} zskiplist;
```

```java
zskiplistNode *zslInsert(zskiplist *zsl, double score, robj *obj) {
    zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
    unsigned int rank[ZSKIPLIST_MAXLEVEL]; 
    int i, level;
    redisAssert(!isnan(score));
    // 在各个层查找节点的插入位置
    // T_wrost = O(N^2), T_avg = O(N log N)
    x = zsl->header; //获取头结点
    for (i = zsl->level-1; i >= 0; i--) {
        /* store rank that is crossed to reach the insert position */
        // 最终 rank[0] 的值加一就是新节点的前置节点的排位
		// rank其中的值就是update对应的那个节点的最终rank值 update中的值就是我们要插入新节点的前一个节点
		// 在 [8 - 10]这一层中 假如我们要插入9 update[i]就是8所对应的节点 rank[i]就是1 
        // 第一次进入的时候rank[zsl->level-1] = 0,后面起始都等于上一层的rank值
        rank[i] = i == (zsl->level-1) ? 0 : rank[i+1];
        // 沿着前进指针遍历跳跃表
        while (x->level[i].forward &&
            (x->level[i].forward->score < score ||
                // 比对分值
                (x->level[i].forward->score == score &&
                // 当分值相同时 比对成员， T = O(N)
                compareStringObjects(x->level[i].forward->obj,obj) < 0))) {
            // 记录沿途跨越了多少个节点
            rank[i] += x->level[i].span; //第i层节点的RANK
            // 移动至下一指针
            x = x->level[i].forward;
        }//退出这个循环的时候就意味着在这一层下一个节点的值大于此节点 开始进入下一层寻找
        // 记录将要和新节点相连接的节点
        update[i] = x; //记录的总是带有值的节点 就是第几层我们用了哪一个节点
    }
    /* we assume the key is not already inside, since we allow duplicated
     * scores, and the re-insertion of score and redis object should never
     * happen since the caller of zslInsert() should test in the hash table
     * if the element is already inside or not. 
     *
     * zslInsert() 的调用者会确保同分值且同成员的元素不会出现，
     * 所以这里不需要进一步进行检查，可以直接创建新元素。
     */
    // 获取一个随机值作为新节点的层数
    // 这应该是决定跳表效率的一个最直接的元素 
    //网上还有一种选法 就是抛硬币式 取一个随机数0或者1 0就继续且层数加一 1就停止 这个效率显然是比较低的
    level = zslRandomLevel(); 
    // 如果新节点的层数比表中其他节点的层数都要大
    // 那么初始化表头节点中未使用的层，并将它们记录到 update 数组中
    // 将来也指向新节点
    if (level > zsl->level) {
        // 初始化未使用层
        // T = O(1)
        for (i = zsl->level; i < level; i++) {
      //从原始最高层到新创建的最高层
            rank[i] = 0;
            update[i] = zsl->header;
            update[i]->level[i].span = zsl->length; //这些新加层的跨度开始初始化为原跳跃表长度
        }
        // 更新表中节点最大层数
        zsl->level = level;
    }
    // 创建新节点
    x = zslCreateNode(level,score,obj);
    // 将前面记录的指针指向新节点，并做相应的设置
    for (i = 0; i < level; i++) {
        // 设置新节点的 forward 指针
        x->level[i].forward = update[i]->level[i].forward;
        // 将沿途记录的各个节点的 forward 指针指向新节点
        update[i]->level[i].forward = x; 
        //上面这两步就是一个链表的插入操作 把x插入到update[i]这个结点后面
        /* update span covered by update[i] as x is inserted here */
        // 计算新节点跨越的节点数量   找到的那个节点的跨度   //0层与i层所对应update的RANK 
        x->level[i].span = update[i]->level[i].span - (rank[0] - rank[i]);
        //上面这个式子是什么意思呢 其实就是计算我们新节点的跨度 举个简单的例子
        /
         * 1 | 7 - - 10 7的span为2 RANK[1]为7
         * 0 | 7 8 - 10 RANK[0]为8 所以我们的要插入的9的span就为2-(8-7);
        */
        // 更清楚一点 其实原本的式子应该是这样的 等式两边都等于第i层最大元素的RANK
        // rank[i]+update[i]->level[i].span=rank[0]+x->level[i].span 
        // 更新新节点插入之后，沿途节点的 span 值
        // 其中的 +1 计算的是新节点 看上面的例子 很容易搞清楚
        update[i]->level[i].span = (rank[0] - rank[i]) + 1;
    }
    /* increment span for untouched levels */
    // 未接触的节点的 span 值也需要增一，这些节点直接从表头指向新节点
    for (i = level; i < zsl->level; i++) {
        update[i]->level[i].span++;
    }
    // 设置新节点的后退指针 第一个节点backward为NULL 要插入的地方不是表头的话就设置为update[0]
    // 按上面的样例来说backward就是8这个节点
    x->backward = (update[0] == zsl->header) ? NULL : update[0];
    if (x->level[0].forward)
        x->level[0].forward->backward = x;
    else
        zsl->tail = x;
    // 跳跃表的节点计数增一 成功插入
    zsl->length++;
    return x;
}
```

```java
int zslDelete(zskiplist *zsl, double score, robj *obj) {
    zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
    int i;
    // 遍历跳跃表，查找目标节点，并记录所有沿途节点
    // T_wrost = O(N^2), T_avg = O(N log N)
    x = zsl->header;
    for (i = zsl->level-1; i >= 0; i--) {
        // 遍历跳跃表的复杂度为 T_wrost = O(N), T_avg = O(log N)
        while (x->level[i].forward &&
            (x->level[i].forward->score < score ||
                // 比对分值
                (x->level[i].forward->score == score &&
                // 比对对象，T = O(N)
                compareStringObjects(x->level[i].forward->obj,obj) < 0)))
            // 沿着前进指针移动
            x = x->level[i].forward;
        // 记录沿途节点
        update[i] = x;
    }
    //以上和插入是一个逻辑
    /* We may have multiple elements with the same score, what we need
     * is to find the element with both the right score and object. 
     *
     * 检查找到的元素 x ，只有在它的分值和对象都相同时，才将它删除。
     */
    x = x->level[0].forward; //得到真正我们要找的元素
    if (x && score == x->score && equalStringObjects(x->obj,obj)) {
        // T = O(1)
        zslDeleteNode(zsl, x, update);
        // T = O(1)
        zslFreeNode(x); //把删除的结点释放内存
        return 1;
    } else {
        return 0; /* not found */
    }
    return 0; /* not found */
}
void zslDeleteNode(zskiplist *zsl, zskiplistNode *x, zskiplistNode update) {
    int i;
    // 更新所有和被删除节点 x 有关的节点的指针，解除它们之间的关系
    // T = O(1)
    for (i = 0; i < zsl->level; i++) {
        if (update[i]->level[i].forward == x) {
      //如果要删除的节点恰好是此结点的下一个
            update[i]->level[i].span += x->level[i].span - 1; //加上要删除的元素的span 再减去删除的元素本身
            update[i]->level[i].forward = x->level[i].forward; //更新forward
        } else {
            update[i]->level[i].span -= 1; //不是的话于这个元素来说不过后面少了一个元素而已
        }
    }
    // 更新被删除节点 x 后面节点的后退指针 如果要删除元素恰好是尾节点 更新tail
    if (x->level[0].forward) {
        x->level[0].forward->backward = x->backward;
    } else {
        zsl->tail = x->backward;
    }
    // 当最高层的最后一个节点被删除时更新最大层数
    // T = O(1)
    while(zsl->level > 1 && zsl->header->level[zsl->level-1].forward == NULL)
        zsl->level--;
    // 跳跃表节点计数器减一
    zsl->length--;
}
```

其实我们看到在删除的时候记录了update的值,不记录可以吗?答案当然是不行,不记录的话我们就没办法更新删除节点的前节点的属性了,比如span.

跳跃表在用作有序set的时候我们经常会有范围操作,就是ZRANGE系列的操作,那么在Redis中是如何处理范围操作的呢?

```java
typedef struct {
      //开区间 相对应的还有一个闭区间结构为zlexrangespec
    // 最小值和最大值
    double min, max;
    // 指示最小值和最大值是否*不*包含在范围之内
    // 值为 1 表示不包含，值为 0 表示包含
    int minex, maxex; /* are min or max exclusive? */
} zrangespec;
int zslIsInRange(zskiplist *zsl, zrangespec *range) {
    zskiplistNode *x;
    /* Test for ranges that will always be empty. */
    // 先排除总为空的范围值
    if (range->min > range->max ||
            (range->min == range->max && (range->minex || range->maxex)))
        return 0;
    // 检查最大分值
    x = zsl->tail;  //因为我们在跳表中保存了首尾指针 这样可以让我们O(1)获得跳表的范围
    if (x == NULL || !zslValueGteMin(x->score,range))
        return 0;
    // 检查最小分值
    x = zsl->header->level[0].forward;
    if (x == NULL || !zslValueLteMax(x->score,range))
        return 0;
    return 1;
}
//得到范围内的第一个元素
zskiplistNode *zslFirstInRange(zskiplist *zsl, zrangespec *range) {
    zskiplistNode *x;
    int i;
    /* If everything is out of range, return early. */
    //如果给定范围有一端超过了跳跃表的范围 就直接退出
    if (!zslIsInRange(zsl,range)) return NULL;
    // 遍历跳跃表，查找符合范围 min 项的节点
    x = zsl->header;
    for (i = zsl->level-1; i >= 0; i--) {
        /* Go forward while *OUT* of range. */
        while (x->level[i].forward &&
            !zslValueGteMin(x->level[i].forward->score,range))
                x = x->level[i].forward;
                //当我们找到时 while中的第二个条件就会是true 从而退出循环 x->level[0].forward就是我们要找的值
    }
    /* This is an inner range, so the next node cannot be NULL. */
    x = x->level[0].forward;
    redisAssert(x != NULL);
    /* Check if score <= max. */
    // 检查节点是否符合范围的 max 项
    // T = O(1)
    if (!zslValueLteMax(x->score,range)) return NULL;
    return x;
}
```

当然zslLastInRange和这个逻辑和实现上都是差不多的,我们再来看看范围删除是如何做到的,redis中提供了基于score和rank的删除.

```java
unsigned long zslDeleteRangeByScore(zskiplist *zsl, zrangespec *range, dict *dict) {
    zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
    unsigned long removed = 0;
    int i;
    // 记录所有和被删除节点（们）有关的节点
    // T_wrost = O(N) , T_avg = O(log N)
    x = zsl->header;
    for (i = zsl->level-1; i >= 0; i--) {
        while (x->level[i].forward && (range->minex ? //根据range区间的开闭情况有下面两种判断方式
            x->level[i].forward->score <= range->min :
            x->level[i].forward->score < range->min))
                x = x->level[i].forward; 
        update[i] = x; //这样我们可以找到每一层中第一个在范围之内的元素 记录update是为了方便更新节点的属性 比如说span
    }
    /* Current node is the last with score < or <= min. */
    // 定位到给定范围开始的第一个节点
    x = x->level[0].forward;
    /* Delete nodes while in range. */
    // 删除范围中的所有节点
    // T = O(N)
    while (x &&
           (range->maxex ? x->score < range->max : x->score <= range->max))
    {
        // 记录下个节点的指针
        zskiplistNode *next = x->level[0].forward;
        zslDeleteNode(zsl,x,update); //删除节点并更新其他节点
        dictDelete(dict,x->obj); //释放值的空间
        zslFreeNode(x); //释放节点
        removed++; 
        x = next;
    }
    return removed; //返回删除的个数
}
```

zslDeleteRangeByRank的具体逻辑与这里差不多,只有一点不同就是while循环的终止条件不同,在byRank中应该是rank<start,这样我们就可以找到满足条件的第一个值,并记录每一层中第一个范围之内的值到update数组中,方便删除.
