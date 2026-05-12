# 27、Redis 源码解析 - Redis Radix tree 源码解析
- 来源：https://ddkk.com/zhuanlan/db/redis/7/27.html
- 分类：缓存数据库
- 分组：教程目录
我相信**Radix Tree**是一个很多人都听过，知道但是没实际用过的“神秘”的数据结构，OS中address space使用它来存储地址到page的映射；Redis中用它来存储slot对应的的所有key信息，在ACL中存储user到struct User的映射，命令表中的ID分配，即命令名为key，ID为val；以及作为stream的主要数据结构，但是它究竟什么时候用，有什么优点，能答上来的人就少了。

Radix Tree实际上可以看作是一个压缩版的Tire Tree，可以最大规模的减少存储的内存消耗，并且查询的时间复杂度也是O(k)，k为存储的key的最长长度。在短字符串多重复前缀时作为key可提供极其优秀的性能与内存消耗。常见的比如一串定长ID作为key时（雪花生成的ID最前面是时间戳，显然重复就比较多）。

## 算法解析

主要聊聊插入的算法，这里主要参考源码中antirez的注释，这里可以再吹一下大哥，注释写的真漂亮！

直接看算法很难理解，需要辅助以代码。

插入主要分为种情况：

**1、****键已经存在在radix树中了**；

**2、****找到的节点为压缩节点，并且匹配压缩节点中下标时冲突**；

**3、****找到的节点为压缩节点且为key的前缀，此时只需要插入一个节点就可以了**；

**4、****找到的节点不是压缩节点，直接排序后插入**；

假设初始树结构如下：

```java
 /*
 *     "ANNIBALE" -> "SCO" -> []
 */
```

第二步的详细算法如下，以下四种情况匹配：

```java
/*
 * 1) Inserting "ANNIENTARE"
 *
 *               |B| -> "ALE" -> "SCO" -> []
 *     "ANNI" -> |-|
 *               |E| -> (... continue algo ...) "NTARE" -> []
 *
 * 2) Inserting "ANNIBALI"
 *
 *                  |E| -> "SCO" -> []
 *     "ANNIBAL" -> |-|
 *                  |I| -> (... continue algo ...) []
 *
 * 3) Inserting "AGO" (Like case 1, but set iscompr = 0 into original node)
 *
 *            |N| -> "NIBALE" -> "SCO" -> []
 *     |A| -> |-|
 *            |G| -> (... continue algo ...) |O| -> []
 *
 * 4) Inserting "CIAO"
 *
 *     |A| -> "NNIBALE" -> "SCO" -> []
 *     |-|
 *     |C| -> (... continue algo ...) "IAO" -> []
 */
```

**1、****保存当前压缩节点的NEXT指针（子元素的指针，一直存在于压缩节点)**；

**2、****创建“splitnode”，将压缩节点处的非公共字母作为子节点**；

a.**用“splitnode”替换旧节点**；

b. **拆分压缩节点（也重新分配它）以包含冲突点的字符。更改子指针以连接到split node。如果新的压缩节点 len 仅为 1，则将 iscompr 设置为 0。**

a.**如果后缀len（拆分字符后原始压缩节点的剩余字符串长度）非零，则创建“后缀节点”如果后缀节点只有一个字符集iscompr为0，否则iscompr为1将后缀节点子指针设置为NEXT**；

b. **如果后缀len为零，只需使用NEXT作为后缀指针。**

**5、****将split节点的child[0]设置为postfix节点**；

**6、****将“splitnode”设置为当前节点，在child[1]处设置当前索引，并照常继续插入算法**；

第三步的详细算法如下：

```java
 	 /* Inserting "ANNI"
     *
     *     "ANNI" -> "BALE" -> "SCO" -> []
     */
```

SPLITPOS为匹配冲突点的字符。

比如我们插入"ANNIBBLE", “ANNIANTARE”,这个值就是“B”。

**1、****保存当前压缩节点的NEXT指针**；

**2、****创建一个包含从$SPLITPOS到结尾的所有字符的“后缀节点”使用$NEXT作为后缀节点子指针如果后缀节点长度为1，则将iscompr设置为0将节点设置为具有新插入键的关联值的键**；

**3、****修剪当前节点以包含第一个$SPLITPOS字符通常，如果新节点长度仅为1，则将iscompr设置为0采用原始节点中的iskey/关联值**；

**4、****将后缀节点设置为步骤1中创建的修剪节点的唯一子指针**；

删除有兴趣的朋友可以自己了解下。

遍历在代码中就是简单的深搜。

## 源码解析

### 基础数据结构

```java
typedef struct rax {
    raxNode *head;		// 头节点
    uint64_t numele;	// 元素总数
    uint64_t numnodes;	// 总节点数
} rax;
typedef struct raxNode {
    uint32_t iskey:1;     // 节点是否为key
    uint32_t isnull:1;    // 节点是否为null，为key可以为null
    uint32_t iscompr:1;   // 是否是压缩节点
    uint32_t size:29;     // 节点存储的字符数
    unsigned char data[]; // 存储字节点对应的信息，压缩节点和非压缩节点不一样，可以参考[1]
} raxNode;
typedef struct raxIterator {
    int flags;				// 遍历时会添加的标记位
    rax *rt;                // 我们所遍历的radix树
    unsigned char *key;     // 遍历过程中当前节点
    void *data;             // key关联的data
    size_t key_len;         // key的长度
    size_t key_max;         // key的最大有效范围
    unsigned char key_static_string[RAX_ITER_STATIC_LEN];	// 短key的时候用这个而不是动态分配
    raxNode *node;          // 节点返回值
    raxStack stack;         // 记录遍历过程中的调用栈
    raxNodeCallback node_cb; /* callback */
} raxIterator;
typedef struct raxStack {
	// 和上面的key一个路数，短数组优化
    void **stack; /* Points to static_items or an heap allocated array. */
    size_t items, maxitems; /* Number of items contained and total space. */
    /* Up to RAXSTACK_STACK_ITEMS items we avoid to allocate on the heap
     * and use this static array of pointers instead. */
    void *static_items[RAX_STACK_STATIC_ITEMS];
    int oom; /* True if pushing into this stack failed for OOM at some point. */
} raxStack;
```

### raxGenericInsert

```java
/*
 * @rax: radix树本身
 * @s: 键的字符串
 * @len: 键的字符串的长度
 * @data: 要插入的值
 * @old: 如果键存在的话把旧的键返回出去
 * @overwrite: 如果键已经存在是否需要overwrite
 **/
int raxGenericInsert(rax *rax, unsigned char *s, size_t len, void *data, void **old, int overwrite) {
    size_t i;	// 代表在radix树中找到不匹配的那个字符时在s中的下标是多少
    int j = 0;  // 代表在radix树中找到的不匹配的那个字符的节点中在第几个字符不匹配
    // h存储找到的节点，plink存储其父节点，因为radix的组织形式，h存在plink必存在
    raxNode *h, **parentlink;
    debugf("### Insert %.*s with value %p\n", (int)len, s, data);
    // 执行查找过程，核心代码只有一个循环，可以说非常巧妙了
    i = raxLowWalk(rax,s,len,&h,&parentlink,&j,NULL);
	// 这个判断条件代表这个键已经存在在radix树中了
	// 或者匹配结束点不在一个压缩节点的中间，所以可以用这个节点当作key
    if (i == len && (!h->iscompr || j == 0 /* not in the middle if j is 0 */)) {
        debugf("### Insert: node representing key exists\n");
        // 第二种情况下我们需要分配内存
        if (!h->iskey || (h->isnull && overwrite)) {
            h = raxReallocForData(h,data);
            if (h) memcpy(parentlink,&h,sizeof(h));
        }
        if (h == NULL) {
            errno = ENOMEM;
            return 0;
        }
        // 第一种情况直接根据overwrite更新就可以了
        // 其实是这样的条件 h->iskey && (!h->isnull || !overwrite)
        if (h->iskey) {
            if (old) *old = raxGetData(h);
            if (overwrite) raxSetData(h,data);
            errno = 0;
            return 0; /* Element already exists. */
        }
        /* Otherwise set the node as a key. Note that raxSetData()
         * will set h->iskey. */
        // 其实这里的判断条件是这样的
        // !h->iskey 
        raxSetData(h,data);
        rax->numele++;
        return 1; /* Element inserted. */
    }
	// 这里不得不说下antriez是真的大佬，注释写的简直无法挑剔，这部分代码大哥用注释把算法脉络梳理的非常清楚
	// 因为篇幅不放在代码中说，后面专门说说这部分的算法。
    /* ------------------------- ALGORITHM 1 --------------------------- */
    // 找的节点为压缩节点且i!=len,证明需要进行拆分
    if (h->iscompr && i != len) {
        debugf("ALGO 1: Stopped at compressed node %.*s (%p)\n",
            h->size, h->data, (void*)h);
        debugf("Still to insert: %.*s\n", (int)(len-i), s+i);
        debugf("Splitting at %d: '%c'\n", j, ((char*)h->data)[j]);
        debugf("Other (key) letter is '%c'\n", s[i]);
        /* 1: Save next pointer. */
        raxNode **childfield = raxNodeLastChildPtr(h);
        raxNode *next;
        memcpy(&next,childfield,sizeof(next));
        debugf("Next is %p\n", (void*)next);
        debugf("iskey %d\n", h->iskey);
        if (h->iskey) {
            debugf("key value is %p\n", raxGetData(h));
        }
        /* Set the length of the additional nodes we will need. */
        size_t trimmedlen = j;
        size_t postfixlen = h->size - j - 1;
        // h为key的话说明当前节点存在val，也就说分裂后的第一个节点为key
        // 显然trimmedlen为零是splitnode为key，否则trimmedlen为key
        // 这条语句必须理解透彻
        int split_node_is_key = !trimmedlen && h->iskey && !h->isnull;
        size_t nodesize;
        /* 2: Create the split node. Also allocate the other nodes we'll need
         *    ASAP, so that it will be simpler to handle OOM. */
        // splitnode只包含一个节点
        raxNode *splitnode = raxNewNode(1, split_node_is_key);
        raxNode *trimmed = NULL;
        raxNode *postfix = NULL;
		// 正常的分配内存
        if (trimmedlen) {
            nodesize = sizeof(raxNode)+trimmedlen+raxPadding(trimmedlen)+
                       sizeof(raxNode*);
            if (h->iskey && !h->isnull) nodesize += sizeof(void*);
            trimmed = rax_malloc(nodesize);
        }
        if (postfixlen) {
            nodesize = sizeof(raxNode)+postfixlen+raxPadding(postfixlen)+
                       sizeof(raxNode*);
            postfix = rax_malloc(nodesize);
        }
        /* OOM? Abort now that the tree is untouched. */
        if (splitnode == NULL ||
            (trimmedlen && trimmed == NULL) ||
            (postfixlen && postfix == NULL))
        {
            rax_free(splitnode);
            rax_free(trimmed);
            rax_free(postfix);
            errno = ENOMEM;
            return 0;
        }
        // 无论哪种情况splitnode总是有一位有效
        splitnode->data[0] = h->data[j];
        if (j == 0) {
            /* 3a: Replace the old node with the split node. */
            // 当前节点要被splitnode换掉了，一个节点分裂为splitnode和postfix
            if (h->iskey) {
                void *ndata = raxGetData(h);
                raxSetData(splitnode,ndata);
            }
            memcpy(parentlink,&splitnode,sizeof(splitnode));
        } else {
            /* 3b: Trim the compressed node. */
            // 当前节点被Trim换掉，一个节点分裂为trim，splitnode，postfix或者trim，splitnode
            trimmed->size = j;
            memcpy(trimmed->data,h->data,j);
            trimmed->iscompr = j > 1 ? 1 : 0;
            trimmed->iskey = h->iskey;
            trimmed->isnull = h->isnull;
            if (h->iskey && !h->isnull) {
                void *ndata = raxGetData(h);
                raxSetData(trimmed,ndata);
            }
            raxNode **cp = raxNodeLastChildPtr(trimmed);
            memcpy(cp,&splitnode,sizeof(splitnode));
            memcpy(parentlink,&trimmed,sizeof(trimmed));
            parentlink = cp; /* Set parentlink to splitnode parent. */
            rax->numnodes++;
        }
        /* 4: Create the postfix node: what remains of the original
         * compressed node after the split. */
        if (postfixlen) {
            /* 4a: create a postfix node. */
            postfix->iskey = 0;
            postfix->isnull = 0;
            postfix->size = postfixlen;
            postfix->iscompr = postfixlen > 1;
            // 如果postfix存在的话把postfix和next连起来
            memcpy(postfix->data,h->data+j+1,postfixlen);
            raxNode **cp = raxNodeLastChildPtr(postfix);
            memcpy(cp,&next,sizeof(next));
            rax->numnodes++;
        } else {
            /* 4b: just use next as postfix node. */
           	// postfix为NULL，显然对于第三步创建的节点来说把postfix设置成next最方便
           	// 对第五步隐藏复杂性
            postfix = next;
        }
        /* 5: Set splitnode first child as the postfix node. */
        raxNode **splitchild = raxNodeLastChildPtr(splitnode);
        memcpy(splitchild,&postfix,sizeof(postfix));
        // 连接splitnode和postfix
        /* 6. Continue insertion: this will cause the splitnode to
         * get a new child (the non common character at the currently
         * inserted key). */
        rax_free(h);
        h = splitnode;
        // 把h当作现在的节点。原节点分裂完成，接下来开始插入我们新加入的节点
    } else if (h->iscompr && i == len) {
    /* ------------------------- ALGORITHM 2 --------------------------- */
        debugf("ALGO 2: Stopped at compressed node %.*s (%p) j = %d\n",
            h->size, h->data, (void*)h, j);
        /* Allocate postfix & trimmed nodes ASAP to fail for OOM gracefully. */
        // 为postfix和trimmed分配内存
        size_t postfixlen = h->size - j;
        size_t nodesize = sizeof(raxNode)+postfixlen+raxPadding(postfixlen)+
                          sizeof(raxNode*);
        if (data != NULL) nodesize += sizeof(void*);
        raxNode *postfix = rax_malloc(nodesize);
        nodesize = sizeof(raxNode)+j+raxPadding(j)+sizeof(raxNode*);
        if (h->iskey && !h->isnull) nodesize += sizeof(void*);
        raxNode *trimmed = rax_malloc(nodesize);
        if (postfix == NULL || trimmed == NULL) {
            rax_free(postfix);
            rax_free(trimmed);
            errno = ENOMEM;
            return 0;
        }
        /* 1: Save next pointer. */
        raxNode **childfield = raxNodeLastChildPtr(h);
        raxNode *next;
        memcpy(&next,childfield,sizeof(next));
        /* 2: Create the postfix node. */
        postfix->size = postfixlen;
        postfix->iscompr = postfixlen > 1;
        // 这个地方的代码是真的骚
        // 乍一看没考虑data为null，把isnull错误的设置为零
        // 且data为null的话会导致没分配最后的数据指针，直接设置可能会有问题
        // 但是大哥用raxSetData和raxNodeLastChildPtr顺序解决一切问题
        postfix->iskey = 1;
        postfix->isnull = 0;
        memcpy(postfix->data,h->data+j,postfixlen);
        raxSetData(postfix,data);
        raxNode **cp = raxNodeLastChildPtr(postfix);
        memcpy(cp,&next,sizeof(next));
        rax->numnodes++;
        /* 3: Trim the compressed node. */
        trimmed->size = j;
        trimmed->iscompr = j > 1;
        trimmed->iskey = 0;
        // 这里的设置貌似有些问题，应该设置为1的，不然如过
        trimmed->isnull = 0;
        memcpy(trimmed->data,h->data,j);
        memcpy(parentlink,&trimmed,sizeof(trimmed));
        if (h->iskey) {
            void *aux = raxGetData(h);
            raxSetData(trimmed,aux);
        }
        /* Fix the trimmed node child pointer to point to
         * the postfix node. */
        // 把trimmed插入到postfix后面
        cp = raxNodeLastChildPtr(trimmed);
        memcpy(cp,&postfix,sizeof(postfix));
        /* Finish! We don't need to continue with the insertion
         * algorithm for ALGO 2. The key is already inserted. */
        rax->numele++;
        rax_free(h);
        return 1; /* Key inserted. */
    }
    /* We walked the radix tree as far as we could, but still there are left
     * chars in our string. We need to insert the missing nodes. */
    // 分裂步骤我们搞完了，接下来要插入新节点
    // 别看是个while，其实只跑两个循环
    while(i < len) {
        raxNode *child;
        /* If this node is going to have a single child, and there
         * are other characters, so that that would result in a chain
         * of single-childed nodes, turn it into a compressed node. */
        if (h->size == 0 && len-i > 1) {
            debugf("Inserting compressed node\n");
            size_t comprsize = len-i;
            if (comprsize > RAX_NODE_MAX_SIZE)
                comprsize = RAX_NODE_MAX_SIZE;
            // 给n realloc并创建子节点
            raxNode *newh = raxCompressNode(h,s+i,comprsize,&child);
            if (newh == NULL) goto oom;
            h = newh;
            memcpy(parentlink,&h,sizeof(h));
            parentlink = raxNodeLastChildPtr(h);
            i += comprsize;
        } else {
        	// 这个在第一步跑，创建splitnode的子节点
            debugf("Inserting normal node\n");
            raxNode **new_parentlink;
            raxNode *newh = raxAddChild(h,s[i],&child,&new_parentlink);
            if (newh == NULL) goto oom;
            h = newh;
            memcpy(parentlink,&h,sizeof(h));
            parentlink = new_parentlink;
            i++;
        }
        rax->numnodes++;
        h = child;
    }
    // 给新节点relloc并拷贝data
    raxNode *newh = raxReallocForData(h,data);
    if (newh == NULL) goto oom;
    h = newh;
    if (!h->iskey) rax->numele++;
    raxSetData(h,data);
    memcpy(parentlink,&h,sizeof(h));
    return 1; /* Element inserted. */
oom:
    /* This code path handles out of memory after part of the sub-tree was
     * already modified. Set the node as a key, and then remove it. However we
     * do that only if the node is a terminal node, otherwise if the OOM
     * happened reallocating a node in the middle, we don't need to free
     * anything. */
    if (h->size == 0) {
        h->isnull = 1;
        h->iskey = 1;
        rax->numele++; /* Compensate the next remove. */
        assert(raxRemove(rax,s,i,NULL) != 0);
    }
    errno = ENOMEM;
    return 0;
}
```

### raxSeek

```java
int raxSeek(raxIterator *it, const char *op, unsigned char *ele, size_t len) {
    int eq = 0, lt = 0, gt = 0, first = 0, last = 0;
	// 这里要提一点，RAX_ITER_EOF标志看代码就是表示没有找到我们需要的元素
	// raxSeek函数结束以后用flags判断是否找到需要的元素
	// flags带RAX_ITER_EOF表示没有找到值
    it->stack.items = 0; /* Just resetting. Initialized by raxStart(). */
    it->flags |= RAX_ITER_JUST_SEEKED;	// 设置下标记位
    it->flags &= ~RAX_ITER_EOF;			// 把EOF的标记去掉
    it->key_len = 0;
    it->node = NULL;
    /* Set flags according to the operator used to perform the seek. */
    if (op[0] == '>') {
        gt = 1;
        if (op[1] == '=') eq = 1;
    } else if (op[0] == '<') {
        lt = 1;
        if (op[1] == '=') eq = 1;
    } else if (op[0] == '=') {
        eq = 1;
    } else if (op[0] == '^') {
        first = 1;
    } else if (op[0] == '$') {
        last = 1;
    } else {
        errno = 0;
        return 0; /* Error. */
    }
    /* If there are no elements, set the EOF condition immediately and
     * return. */
    if (it->rt->numele == 0) {
        it->flags |= RAX_ITER_EOF;
        return 1;
    }
    if (first) {
        /* Seeking the first key greater or equal to the empty string
         * is equivalent to seeking the smaller key available. */
        return raxSeek(it,">=",NULL,0);
    }
    if (last) {
        /* Find the greatest key taking always the last child till a
         * final node is found. */
        it->node = it->rt->head;
        // 看名字应该是最大的节点，但其实匹配的过程很裸
        // 就是压缩节点取全部的数据，非压缩节点取最后一个字符
        if (!raxSeekGreatest(it)) return 0;
        assert(it->node->iskey);
        it->data = raxGetData(it->node);
        return 1;
    }
    /* We need to seek the specified key. What we do here is to actually
     * perform a lookup, and later invoke the prev/next key code that
     * we already use for iteration. */
    int splitpos = 0;
    // 在rt查找ele对应的值，并设置key上的不匹配的index和node上不匹配的index
    size_t i = raxLowWalk(it->rt,ele,len,&it->node,NULL,&splitpos,&it->stack);
    /* Return OOM on incomplete stack info. */
    if (it->stack.oom) return 0;
	// 找到一个完全匹配的点，且其存在key，可以参考raxGenericInsert第一个判断条件
    if (eq && i == len && (!it->node->iscompr || splitpos == 0) &&
        it->node->iskey)
    {
     	// 把key的数据插入到Iterator中的it->key中，这里有一个短字符串优化，让我想起std::string的15字节了
        if (!raxIteratorAddChars(it,ele,len)) return 0; /* OOM. */
        it->data = raxGetData(it->node);
    } else if (lt || gt) {
   		// 第一个条件需要完全匹配和设置eq，
        /* Exact key not found or eq flag not set. We have to set as current
         * key the one represented by the node we stopped at, and perform
         * a next/prev operation to seek. To reconstruct the key at this node
         * we start from the parent and go to the current node, accumulating
         * the characters found along the way. */
        // 继续入栈，这里栈的作用就显现出来了，就是实现lt
        // 但是底下这里的，逻辑有点迷，看起来只是为了重建it->key，那为什么不使用i直接用key更新呢？
        // 交了个PR：#9115，看看会不会merge吧
        if (!raxStackPush(&it->stack,it->node)) return 0; // 入栈为了迎合下面那个child
        for (size_t j = 1; j < it->stack.items; j++) {
            raxNode *parent = it->stack.stack[j-1];
            raxNode *child = it->stack.stack[j];
            if (parent->iscompr) {
     	// 压缩节点的显然需要拷贝size个字符
                if (!raxIteratorAddChars(it,parent->data,parent->size))
                    return 0;
            } else {
                raxNode **cp = raxNodeFirstChildPtr(parent);
                unsigned char *p = parent->data;
                while(1) {
                    raxNode *aux;
                    memcpy(&aux,cp,sizeof(aux));
                    if (aux == child) break;
                    cp++;
                    p++;
                }
                if (!raxIteratorAddChars(it,p,1)) return 0;
            }
        }
        raxStackPop(&it->stack);
        /* We need to set the iterator in the correct state to call next/prev
         * step in order to seek the desired element. */
        debugf("After initial seek: i=%d len=%d key=%.*s\n",
            (int)i, (int)len, (int)it->key_len, it->key);
        if (i != len && !it->node->iscompr) {
        	// 非压缩节点中中间匹配不成功的时候
            if (!raxIteratorAddChars(it,ele+i,1)) return 0;
            debugf("Seek normal node on mismatch: %.*s\n",
                (int)it->key_len, (char*)it->key);
            it->flags &= ~RAX_ITER_JUST_SEEKED; // 寻找节点的时候清除SEEKED标志
            if (lt && !raxIteratorPrevStep(it,1)) return 0;
            // 对于理解radix tree 很重要的两个函数，描述取大于/小于当前key的下一个
            // raxSeek解析完以后看raxIteratorNextStep
            // 算法和红黑树里取prev/next很相似
            if (gt && !raxIteratorNextStep(it,1)) return 0;
            it->flags |= RAX_ITER_JUST_SEEKED; /* Ignore next call. */
        } else if (i != len && it->node->iscompr) {
            debugf("Compressed mismatch: %.*s\n",
                (int)it->key_len, (char*)it->key);
            /* In case of a mismatch within a compressed node. */
            // 和上面的逻辑差不多，不过手动执行了下向上查找的过程
            int nodechar = it->node->data[splitpos];
            int keychar = ele[i];
            it->flags &= ~RAX_ITER_JUST_SEEKED;
            if (gt) {
                /* If the key the compressed node represents is greater
                 * than our seek element, continue forward, otherwise set the
                 * state in order to go back to the next sub-tree. */
                // 分裂点的值大于我们传入的ele，直接下一个完事
                if (nodechar > keychar) {
                    if (!raxIteratorNextStep(it,0)) return 0;
                } else {
     	// 否则的话就需要加上此节点，找比现在构造的这个key大的第一个元素，此元素肯定大于ele
               		// 我个人认为这里这里添加字符只是为了适配raxIteratorNextStep中的删字符操作
               		// 所以我把这里改成（it->node = raxStackPop(&it->stack);），
               		// 但是lt改了以后过不了测试，gdb出来是因为越界，特判零就可以了
                    if (!raxIteratorAddChars(it,it->node->data,it->node->size))
                        return 0;
                    if (!raxIteratorNextStep(it,1)) return 0;
                }
            }
            if (lt) {
                /* If the key the compressed node represents is smaller
                 * than our seek element, seek the greater key in this
                 * subtree, otherwise set the state in order to go back to
                 * the previous sub-tree. */
                if (nodechar < keychar) {
                    if (!raxSeekGreatest(it)) return 0;
                    it->data = raxGetData(it->node);
                } else {
                	// 这里有一些条件没考虑到，换成（it->node = raxStackPop(&it->stack);）就暴毙了
                    if (!raxIteratorAddChars(it,it->node->data,it->node->size))
                        return 0;
                    // prev相比于next来说简单一点，因为只需要先树根走，next两侧则都有可能
                    // 看过测试了，这里key_len可能等于零，进去-1就暴毙了，所以这里判断下为零就可以
                    // 但是那样子做不如现有的简洁,但是显然更高效一点，交个PR试试，毕竟搞出来解决方法花了一下午，一番带薪学习
                    // 交了个PR:#9120，看看社区如何看待这个问题
                    if (!raxIteratorPrevStep(it,1)) return 0;
                }
            }
            it->flags |= RAX_ITER_JUST_SEEKED; /* Ignore next call. */
        } else {
            debugf("No mismatch: %.*s\n",
                (int)it->key_len, (char*)it->key);
            /* If there was no mismatch we are into a node representing the
             * key, (but which is not a key or the seek operator does not
             * include 'eq'), or we stopped in the middle of a compressed node
             * after processing all the key. Continue iterating as this was
             * a legitimate key we stopped at. */
            it->flags &= ~RAX_ITER_JUST_SEEKED;
            if (it->node->iscompr && it->node->iskey && splitpos && lt) {
                /* If we stopped in the middle of a compressed node with
                 * perfect match, and the condition is to seek a key "<" than
                 * the specified one, then if this node is a key it already
                 * represents our match. For instance we may have nodes:
                 *
                 * "f" -> "oobar" = 1 -> "" = 2
                 *
                 * Representing keys "f" = 1, "foobar" = 2. A seek for
                 * the key < "foo" will stop in the middle of the "oobar"
                 * node, but will be our match, representing the key "f".
                 *
                 * So in that case, we don't seek backward. */
                // 最完美的情况，直接拿值就可以了 
                it->data = raxGetData(it->node);
            } else {
            	// ele的值匹配完了，但是没匹配到想要的值，找上一个或者下一个就可以
                if (gt && !raxIteratorNextStep(it,0)) return 0;
                if (lt && !raxIteratorPrevStep(it,0)) return 0;
            }
            it->flags |= RAX_ITER_JUST_SEEKED; /* Ignore next call. */
        }
    } else {
        // 设置了等于但是没匹配上的情况
        it->flags |= RAX_ITER_EOF;
        return 1;
    }
    return 1;
}
```

### raxIteratorNextStep

```java
// 这里的noup其实比较难懂
// 个人的理解就是为false的时候直接找比当前key大的就好，否则需要找一个较大的父节点，看代码好懂些
int raxIteratorNextStep(raxIterator *it, int noup) {
    if (it->flags & RAX_ITER_EOF) {
        return 1;
    } else if (it->flags & RAX_ITER_JUST_SEEKED) {
        it->flags &= ~RAX_ITER_JUST_SEEKED;
        return 1;
    }
    /* Save key len, stack items and the node where we are currently
     * so that on iterator EOF we can restore the current key and state. */
    // 保存初始值，在没有匹配成功时执行恢复操作
    size_t orig_key_len = it->key_len;
    size_t orig_stack_items = it->stack.items;
    raxNode *orig_node = it->node;
    while(1) {
    	// 孩子节点的数量
        int children = it->node->iscompr ? 1 : it->node->size;
        if (!noup && children) {
            debugf("GO DEEPER\n");
            /* Seek the lexicographically smaller key in this subtree, which
             * is the first one found always going towards the first child
             * of every successive node. */
            // 查找子树中字典序较小的第一个元素
            if (!raxStackPush(&it->stack,it->node)) return 0;
            raxNode **cp = raxNodeFirstChildPtr(it->node);
            if (!raxIteratorAddChars(it,it->node->data,
                it->node->iscompr ? it->node->size : 1)) return 0;
            memcpy(&it->node,cp,sizeof(it->node));
            /* Call the node callback if any, and replace the node pointer
             * if the callback returns true. */
            if (it->node_cb && it->node_cb(&it->node))
                memcpy(cp,&it->node,sizeof(it->node));
          	// 如果是key的话直接返回，否则的话继续向下遍历
            if (it->node->iskey) {
                it->data = raxGetData(it->node);
                return 1;
            }
        } else {
            // 我们完成了上一个子树的探索，此时将切换到新的子树
            // 向上直到找到一个节点，该节点的子节点按字典顺序表示大于当前key
            // 当然noup控制着第一次进来的行为
            // 有一说一，这个函数能写不出错确实是很厉害的，大哥牛逼
            while(1) {
                int old_noup = noup;
               	// 搜索到最后发现是head，还没找到，此时设置RAX_ITER_EOF，这很重要
               	// RAX_ITER_EOF用来判断是否可以找到，下面写个小demo简单测试下
                if (!noup && it->node == it->rt->head) {
                    it->flags |= RAX_ITER_EOF;
                    it->stack.items = orig_stack_items;
                    it->key_len = orig_key_len;
                    it->node = orig_node;
                    return 1;
                }
                /* If there are no children at the current node, try parent's
                 * next child. */
                unsigned char prevchild = it->key[it->key_len-1];
                if (!noup) {
     	// 此节点没有孩子，回到栈上的上一个节点
                    it->node = raxStackPop(&it->stack);
                } else {
                    noup = 0;
                }
                // 把key中此节点的数据全部删除
                int todel = it->node->iscompr ? it->node->size : 1;
                raxIteratorDelChars(it,todel);
                /* Try visiting the next child if there was at least one
                 * additional child. */
                // 这里注意只有非压缩节点才会比较，压缩节点直接跳过
                // 因为压缩节点后面肯定就是我们刚刚抛弃的那个键
                if (!it->node->iscompr && it->node->size > (old_noup ? 0 : 1)) {
                    raxNode **cp = raxNodeFirstChildPtr(it->node);
                    int i = 0;
                    while (i < it->node->size) {
                        debugf("SCAN NEXT %c\n", it->node->data[i]);
                      	// 父节点中找到一个大于当前节点的子树，非压缩节点
                      	// 当然不用纠结prevchild为什么取[it->key_len-1]了，因为非压缩节点最多一个字母被记录
                        if (it->node->data[i] > prevchild) break;
                        i++;
                        cp++;
                    }
                    if (i != it->node->size) {
                        debugf("SCAN found a new node\n");
                        raxIteratorAddChars(it,it->node->data+i,1);
                        if (!raxStackPush(&it->stack,it->node)) return 0;
                        memcpy(&it->node,cp,sizeof(it->node));
                        /* Call the node callback if any, and replace the node
                         * pointer if the callback returns true. */
                        if (it->node_cb && it->node_cb(&it->node))
                            memcpy(cp,&it->node,sizeof(it->node));
                        if (it->node->iskey) {
                            it->data = raxGetData(it->node);
                            return 1;
                        }
                        break;
                    }
                }
            }
        }
    }
}
```

### 小例子

还记得我们上面提到的`RAX_ITER_EOF`有个小例子吗？不记得也没关系，`ctrl + f`一下就可以了，

```java
int main() {
    rax *radixTree;
    radixTree = raxNew();
    char *vector[] = {
     "ANNIBBLE",
                      "ANNIANTARE",
                      "ANNIANTBDE"};
    char *data[] = {
     "111",
                    "222"};
    void *old = NULL;
    for (int i = 0; i < sizeof(vector)/sizeof(char*); ++i) {
        raxInsert(radixTree, vector[i], strlen(vector[i]), data[i], &old);
    }
    if (old != NULL) {
        printf("%s\n", (char*)old);
    }
    raxIterator ri;
    raxStart(&ri,radixTree);
    //char item[] = "ANNIBADE";   // non-compress node
    char item[] = "ANNIC";
    raxSeek(&ri,">=",item,strlen(item));
    printf("key : %.*s, data : %s flag:%d\n", ri.key_len ,ri.key, ri.data, ri.flags);
    return 0;
}
// gcc -std=c99 -g -lm main.c rax.c -DRAX_DEBUG_MSG
```

中间的`debugf`信息就不打印了，直接看结果：

```java
key : ANNIC, data : (null) flag:3
```

显然搜不到的情况，这是显示了个什么玩意？看了上面代码的朋友就很清楚为什么出现这样的问题，原因是 `raxIteratorNextStep`之前`raxIteratorAddChars`了一下，在`(!noup && it->node == it->rt->head)` 判断处设置了EOF。

所以足以看出`raxSeek`是使用`flags`判断是否查找成功的。

这里提一下rax.c中有一个很有意思的函数，即`raxShow`，可以把当前**Radix Tree**以图形化的方式显示出来。举个简单的例子:

上面那个Radix tree使用raxShow以后长这个样子：

```java
"ANNI" -> [AB]
        -(A) "NT" ->` [AB]
                       -(A) "RE" ->` []=0x406c23
                       -(B) "DE" ->` []=0x406c00
        -(B) "BLE" ->` []=0x406c1f
```

可以说是非常简单便捷了。

接下来其他函数再没什么说的了，除了`raxRemove`以外，其他的函数不是辅助函数，就是`raxInsert`和`raxSeek`的包装，相对来说都不是那么麻烦。

## 总结

Radix Tree是Redis中一个比较新的数据结构，与我而言是为了看stream部分代码所以花费了一些时间来看这里，对于一般兴趣爱好者来说当然就没必要这样了，了解下其基本原理即可。

这里可以推荐下羽洵姐的一篇短小精悍的文章[1]，不得不说图画的非常好！不是这篇文章可能还得再多花个百分之三十的时间搞懂这部分的代码。令人比较气愤的是当前网络上大多数人素质着实有待提升，沾上radix tree 源码解析这些关键字的文章基本全抄了这篇文章并且不带出处。
