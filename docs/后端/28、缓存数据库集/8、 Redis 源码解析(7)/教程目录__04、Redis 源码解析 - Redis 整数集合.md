# 04、Redis 源码解析 - Redis 整数集合
- 来源：https://ddkk.com/zhuanlan/db/redis/7/4.html
- 分类：缓存数据库
- 分组：教程目录
整数集合是集合键的底层实现之一,它其中提供了"升级"机制来节省内存,但带来的是当升级时要进行的O(N)的拷贝.它只运用在集合都是整数且数量不多的时候,整数不必多说,数量不多是因为其插入的复杂度是O(N),当数据多了以后是巨慢无比的.

```java
typedef struct intset {
    // 编码方式
    uint32_t encoding; //初始编码为INTSET_ENC_INT16
    // 集合包含的元素数量
    uint32_t length;
    // 保存元素的数组 这里是整数集合的核心,可以进行动态扩容
    int8_t contents[];
} intset;
```

```java
intset *intsetAdd(intset *is, int64_t value, uint8_t *success) {
    // 计算编码 value 所需的长度,当所插入的数的范围区间大于当前的编码范围区间的时候进行扩容
    uint8_t valenc = _intsetValueEncoding(value);
    uint32_t pos;
    // 默认设置插入为成功
    if (success) *success = 1;
    /* Upgrade encoding if necessary. If we need to upgrade, we know that
     * this value should be either appended (if > 0) or prepended (if < 0),
     * because it lies outside the range of existing values. */
    // 如果 value 的编码比整数集合现在的编码要大
    // 那么表示 value 必然可以添加到整数集合中
    // 开始升级 也就是把当前集合内的转换为范围更大的编码 比如数字从32位存储成64位
    if (valenc > intrev32ifbe(is->encoding)) {
      //进行升级
        /* This always succeeds, so we don't need to curry *success. */
        // T = O(N)
        return intsetUpgradeAndAdd(is,value); 
    } else {
		//证明到这里的时候我们不需要升级
        /* Abort if the value is already present in the set.
         * This call will populate "pos" with the right position to insert
         * the value when it cannot be found. */
        // 在整数集合中查找 value ，看他是否存在：
        // - 如果存在，那么将 *success 设置为 0 ，并返回未经改动的整数集合
        // - 如果不存在，那么可以插入 value 的位置将被保存到 pos 指针中
        //   等待后续程序使用
        if (intsetSearch(is,value,&pos)) {
      //从现有的集合中查找value 如果找到的话设置其插入的索引为pos.
            if (success) *success = 0;
            return is;
        }
        // 运行到这里，表示 value 不存在于集合中
        // 为 value 在集合中分配空间
        // 这里面使用了zrmalloc,这会保存扩容前的数据,这也是为什么结构体最后一个数据要保存一个指针的原因吧
        is = intsetResize(is,intrev32ifbe(is->length)+1);
        // 那么需要对现有元素的数据进行移动，空出 pos 上的位置，用于设置新值
        // 举个例子
        // 如果数组为：
        // | x | y | z | ? |
        //     |<----->|
        // 而新元素 n 的 pos 为 1 ，那么数组将移动 y 和 z 两个元素
        // | x | y | y | z |
        //         |<----->|
        // 这样就可以将新元素设置到 pos 上了：
        // | x | n | y | z |
        // T = O(N)
        if (pos < intrev32ifbe(is->length)) intsetMoveTail(is,pos,pos+1); 
        //这里其实就是如果插入的位置不是末尾的话,因为这是set,所以我们需要保证有序.所以要把插入后面的元素移动一格
    }
    // 将新值设置到底层数组的指定位置中
    _intsetSet(is,pos,value); 
    // 增一集合元素数量的计数器
    is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
    // 返回添加新元素后的整数集合
    return is;
}
```

这里面我们可以看到诸如intrev32ifbe这样的函数,这是什么呢?这其实是为了同一编码,为了能在你的机器是大端的时候也能正常使用redis.我们来看看intrev32ifbe这类函数的实现.

```java
#if (BYTE_ORDER == LITTLE_ENDIAN)
#define memrev16ifbe(p)
#define memrev32ifbe(p)
#define memrev64ifbe(p)
#define intrev16ifbe(v) (v)
#define intrev32ifbe(v) (v)
#define intrev64ifbe(v) (v)
#else
#define memrev16ifbe(p) memrev16(p)
#define memrev32ifbe(p) memrev32(p)
#define memrev64ifbe(p) memrev64(p)
#define intrev16ifbe(v) intrev16(v)
#define intrev32ifbe(v) intrev32(v)
#define intrev64ifbe(v) intrev64(v)
#endif
uint16_t intrev16(uint16_t v) {
    memrev16(&v);
    return v;
}
uint32_t intrev32(uint32_t v) {
    memrev32(&v);
    return v;
}
uint64_t intrev64(uint64_t v) {
    memrev64(&v);
    return v;
}
void memrev16(void *p) {
    unsigned char *x = p, t;
    t = x[0];
    x[0] = x[1];
    x[1] = t;
}
/* Toggle the 32 bit unsigned integer pointed by *p from little endian to
 * big endian */
void memrev32(void *p) {
    unsigned char *x = p, t;
    t = x[0];
    x[0] = x[3];
    x[3] = t;
    t = x[1];
    x[1] = x[2];
    x[2] = t;
}
/* Toggle the 64 bit unsigned integer pointed by *p from little endian to
 * big endian */
void memrev64(void *p) {
    unsigned char *x = p, t;
    t = x[0];
    x[0] = x[7];
    x[7] = t;
    t = x[1];
    x[1] = x[6];
    x[6] = t;
    t = x[2];
    x[2] = x[5];
    x[5] = t;
    t = x[3];
    x[3] = x[4];
    x[4] = t;
}
```

我们可以看到实现其实是非常简单的,其实就是去检测我们的机器是大端小端,然后执行不同的函数,这样能够保证我们的机器内一定是小端的,这也使我们大多人的机器配置.

接下来我们来看看当我们需要改变编码的时候要进行的操作intsetUpgradeAndAdd.

```java
static intset *intsetUpgradeAndAdd(intset *is, int64_t value) {
    // 当前的编码方式
    uint8_t curenc = intrev32ifbe(is->encoding);
    // 新值所需的编码方式
    uint8_t newenc = _intsetValueEncoding(value);
    // 当前集合的元素数量
    int length = intrev32ifbe(is->length);
	//显然如果触发了整数集合的升级 新值插入的元素只有两种情况 0 和 length
    int prepend = value < 0 ? 1 : 0; //这里是个bug吗?如果数组中都是负数且要插入一个负数中最大的值的时候不就出问题了吗
    // 插入到前面的话prepend为1 后面的话为0
    /* First set new encoding and resize */
    // 更新集合的编码方式
    is->encoding = intrev32ifbe(newenc);
    // 根据新编码对集合（的底层数组）进行空间调整
    // T = O(N)
    is = intsetResize(is,intrev32ifbe(is->length)+1);
    /* Upgrade back-to-front so we don't overwrite values.
     * Note that the "prepend" variable is used to make sure we have an empty
     * space at either the beginning or the end of the intset. */
    // 根据集合原来的编码方式，从底层数组中取出集合元素
    // 然后再将元素以新编码的方式添加到集合中
    // 当完成了这个步骤之后，集合中所有原有的元素就完成了从旧编码到新编码的转换
    // 因为新分配的空间都放在数组的后端，所以程序先从后端向前端移动元素
    // 举个例子，假设原来有 curenc 编码的三个元素，它们在数组中排列如下：
    // | x | y | z | 
    // 当程序对数组进行重分配之后，数组就被扩容了（符号 ？ 表示未使用的内存）：
    // | x | y | z | ? |   ?   |   ?   |
    // 这时程序从数组后端开始，重新插入元素：
    // | x | y | z | ? |   z   |   ?   |
    // | x | y |   y   |   z   |   ?   |
    // |   x   |   y   |   z   |   ?   |
    // 最后，程序可以将新元素添加到最后 ？ 号标示的位置中：
    // |   x   |   y   |   z   |  new  |
    // 上面演示的是新元素比原来的所有元素都大的情况，也即是 prepend == 0
    // 当新元素比原来的所有元素都小时（prepend == 1），调整的过程如下：
    // | x | y | z | ? |   ?   |   ?   |
    // | x | y | z | ? |   ?   |   z   |
    // | x | y | z | ? |   y   |   z   |
    // | x | y |   x   |   y   |   z   |
    // 当添加新值时，原本的 | x | y | 的数据将被新值代替
    // |  new  |   x   |   y   |   z   |
    // 这里其实就是最重点的地方,正如上面所说,我们需要把分布在前面字节上的值均分在整个整数集合上
    while(length--)                         //以当前编码方式取出相应位置上的值
        _intsetSet(is,length+prepend,_intsetGetEncoded(is,length,curenc)); //
    /* Set the value at the beginning or the end. */
    // 设置新值，根据 prepend 的值来决定是添加到数组头还是数组尾
    if (prepend) //显然当升级的时候,只有两个位置可以进行插入
        _intsetSet(is,0,value);
    else
        _intsetSet(is,intrev32ifbe(is->length),value);
    // 更新整数集合的元素数量
    is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
    return is;
}
```

我们再来看看删除的函数intsetRemove,其中包含的操作大多数在add中我们已经看到.

```java
intset *intsetRemove(intset *is, int64_t value, int *success) {
    // 计算 value 的编码方式
    uint8_t valenc = _intsetValueEncoding(value);
    uint32_t pos;
    // 默认设置标识值为删除失败
    if (success) *success = 0;
	//进行两个判断,首先是我们要删除的值在编码的范围区间内,其次要在集合中找到这样一个值 这里的查找是一个二分查找
    if (valenc <= intrev32ifbe(is->encoding) && intsetSearch(is,value,&pos)) {
        // 取出集合当前的元素数量
        uint32_t len = intrev32ifbe(is->length);
        /* We know we can delete */
        // 设置标识值为删除成功
        if (success) *success = 1; 
        if (pos < (len-1)) intsetMoveTail(is,pos+1,pos); //删除一个值,当然要把后面的值向前移动了
        // 缩小数组的大小，移除被删除元素占用的空间
        // T = O(N)
        is = intsetResize(is,len-1);
        // 更新集合的元素数量
        is->length = intrev32ifbe(len-1);
    }
    return is;
}
```

上面提到了insertSearch是一个二分查找,这也没什么说的,毕竟数据的存储是单调的,我们来看看insertSearch的实现吧

```java
static uint8_t intsetSearch(intset *is, int64_t value, uint32_t *pos) {
    int min = 0, max = intrev32ifbe(is->length)-1, mid = -1;
    int64_t cur = -1;
    /* The value can never be found when the set is empty */
    // is为空的时候直接退出
    if (intrev32ifbe(is->length) == 0) {
        if (pos) *pos = 0;
        return 0;
    } else {
        /* Check for the case where we know we cannot find the value,
         * but do know the insert position. */
        //为什么这里有这么一步呢?原因就是我们不仅需要判断value是否存在,还需要更新pos的位置
        // 因为底层数组是有序的，如果 value 比数组中最后一个值都要大
        // 那么 value 肯定不存在于集合中，
        // 并且应该将 value 添加到底层数组的最末端 
        if (value > _intsetGet(is,intrev32ifbe(is->length)-1)) {
            if (pos) *pos = intrev32ifbe(is->length);
            return 0;
        // 因为底层数组是有序的，如果 value 比数组中最前一个值都要小
        // 那么 value 肯定不存在于集合中，
        // 并且应该将它添加到底层数组的最前端
        } else if (value < _intsetGet(is,0)) {
            if (pos) *pos = 0;
            return 0;
        }
    }
	//一个很平常的二分 在一组元素里面找一个,且用符号去比较
    while(max >= min) {
        mid = (min+max)/2;
        cur = _intsetGet(is,mid);
        if (value > cur) {
            min = mid+1;
        } else if (value < cur) {
            max = mid-1;
        } else {
            break;
        }
    }
	//找到的话就返回1 且设置pos为mid,也就是找到想下标
    if (value == cur) {
        if (pos) *pos = mid;
        return 1;
    } else {
        if (pos) *pos = min; //如果没找到我们也需要更新pos 当然就插在偏小的那边啦.
        return 0;
    }
}
```

整数集合剩下的操作就基本是运用上面所说过的函数和策略来执行的,也就是intsetFind,intsetRandom,intsetLen,intsetBloblen,intsetGet这些函数,实现都非常的好懂,有兴趣的朋友可以再了解一下.
