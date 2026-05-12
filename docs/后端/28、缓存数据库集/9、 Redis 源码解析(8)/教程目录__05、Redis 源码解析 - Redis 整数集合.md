# 05、Redis 源码解析 - Redis 整数集合
- 来源：https://ddkk.com/zhuanlan/db/redis/8/5.html
- 分类：缓存数据库
- 分组：教程目录
### 1. 介绍

整数集合`（intset）`是集合键的底层实现之一，当一个集合`只包含整数值元素`，并且这个集合的`元素数量不多`时，Redis就会使用整数集合作为集合键的底层实现.

`intset`可以保存类型为`int16_ t`、`int32_ t`或者`int64_ t`的整数值，并且保证集合中不会出现重复元素.

### 2. 整数集合的实现

Redis中`inset`结构定义在`intset.h`和`intset.c`中.

```java
// 16位，2个字节，表示范围-32,768~32,767
#define INTSET_ENC_INT16 (sizeof(int16_t))
// 32位，4个字节，表示范围-2,147,483,648~2,147,483,647
#define INTSET_ENC_INT32 (sizeof(int32_t))
// 64位，8个字节，表示范围-9,223,372,036,854,775,808~9,223,372,036,854,775,807
#define INTSET_ENC_INT64 (sizeof(int64_t))
// 整数集合
typedef struct intset {
	// 编码方式
    uint32_t encoding;
    // 集合元素数量
    uint32_t length;
    // 保存元素的数组，元素类型并不一定是ini8_t类型
    int8_t contents[];
} intset;
```

- encoding属性表示contents数组储存元素的类型，虽然intset结构把contents属性声明为int8_t类型的数组，但是可以看源码中的宏定义，其实contents并不保存int8_t类型的元素. 只保存范围更大的三种类型.
- length属性记录的是contents数组的长度.
- contents数组保存实际的元素，各个元素从小到大有序地排列.

如下图，分别是一个储存`INTSET_ENC_INT16`类型和一个储存`INTSET_ENC_INT64`类型的整数集合：

### 3. 升级

每当我们要将一个新元素添加到整数集合里面，并且新元素的类型比整数集合现有所有元素的类型都要长时，整数集合需要先进行升级（upgrade），然后才能将新元素添加到整数集合里面.

#### 3.1 升级步骤

**升级三步骤**

**1、** 根据新元素的类型，扩展整数集合底层数组的空间大小，并为新元素分配空间.；

**2、** 将底层数组现有的所有元素都转换成与新元素相同的类型，并将类型转换后的元素放置到正确的位上，而且在放置元素的过程中，需要继续维持底层数组的有序性质不变.；

**3、** 将新元素添加到底层数组里面.；

比如现在要向一个储存`int16_t`类型的整数集合中添加一个`int32_t`类型的元素：

每个元素占用`16`位，一共是`3 * 16 = 48位`，下图是每个元素在这48位里的位置：

现在我们要插入一个整数值`65535`，它是`int32_t`类型的，所以程序需要对整数集合进行升级.

第一步是扩展整数集合底层数组的空间大小，并为新元素分配空间，`int32_t`类型的元素占`32`位空间，所以新数组一共占`4 * 32 = 128位`空间，如下图所示：

第二步是将原来数组中的元素转换成`int32_t`类型，然后将转换后的元素放到正确的位上面：

第三步是将新元素添加到底层数组里面：

最后将整数集合的`encoding`属性的值从`INTSET_ENC_INT16`改为`INTSET_ENC_INT32`，然后将`length`属性的值从3改为4.

设置完之后的整数集合如图所示：

#### 3.2 升级的优点

##### 3.2.1 提升灵活性

因为C语言是静态类型语言，为了避免类型错误，我们通常不会将两种不同类型的值放在同一个数据结构里面.

但是，因为整数集合可以通过自动升级底层数组来适应新元素，所以我们可以随意地将`int16_ t`、`int32_t`或者`int64_t`类型的整数添加到集合中，而不必担心出现类型错误，这种做法非常灵活.

##### 3.2.2 节约内存

整数集合既可以让集合能同时保存三种不同类型的值，又可以确保升级操作只会在有需要的时候（添加更大类型的值）进行，这可以尽量节省内存.

#### 3.3 升级源码

**获取新元素的编码**

```java
// 下述宏定义在stdint.h文件中
#define INT16_MAX            INT16_C(32767)
#define INT16_MIN          (-INT16_C(32767)-1)
# define INT32_MAX           INT32_C(2147483647)
# define INT32_MIN         (-INT32_C(2147483647)-1)
// 返回合适v的编码方式
static uint8_t _intsetValueEncoding(int64_t v) {
	// 如果超出32位所能表示数值的范围则返回 INTSET_ENC_INT64
    if (v < INT32_MIN || v > INT32_MAX)
        return INTSET_ENC_INT64;
    // 如果超出16位所能表示数值的范围则返回 INTSET_ENC_INT32
    else if (v < INT16_MIN || v > INT16_MAX)
        return INTSET_ENC_INT32;
    else
        return INTSET_ENC_INT16;
}
```

**重新分配内存空间**

`intrev32ifbe()`函数定义在`endianconv.h`文件中，目的是将大端字节序转换为小端字节序，使得使用大端字节序的机器也能正常使用Redis.

```java
// 调整集合的内存空间大小
static intset *intsetResize(intset *is, uint32_t len) {
	// 计算数组的大小
    uint32_t size = len*intrev32ifbe(is->encoding);
    // 分配空间
    is = zrealloc(is,sizeof(intset)+size);
    return is;
}
```

**获取指定下标的值**

```java
// 根据编码方式enc，返回在集合is中下标为pos的元素
static int64_t _intsetGetEncoded(intset *is, int pos, uint8_t enc) {
    int64_t v64;
    int32_t v32;
    int16_t v16;
    if (enc == INTSET_ENC_INT64) {
    	// 从下标pos开始的内存空间拷贝64bit的数据到v64
        memcpy(&v64,((int64_t*)is->contents)+pos,sizeof(v64));
        memrev64ifbe(&v64);
        return v64;
    } else if (enc == INTSET_ENC_INT32) {
    	// 从下标pos开始的内存空间拷贝32bit的数据到v32
        memcpy(&v32,((int32_t*)is->contents)+pos,sizeof(v32));
        memrev32ifbe(&v32);
        return v32;
    } else {
     //16位编码
    	// 从下标pos开始的内存空间拷贝16bit的数据到v16
        memcpy(&v16,((int16_t*)is->contents)+pos,sizeof(v16));
        memrev16ifbe(&v16);
        return v16;
    }
}
```

**设置下标pos的值为value**

这个函数实际上就是把原来的元素转换成新的编码类型，然后将转换后的元素放到正确的位上面.

```java
// 根据集合is设置的编码方式，设置下标为pos的值为value
static void _intsetSet(intset *is, int pos, int64_t value) {
	// 获取集合设置的编码方式
    uint32_t encoding = intrev32ifbe(is->encoding);
    if (encoding == INTSET_ENC_INT64) {
    	// 设置下标pos的值为value
    	// 这里contents数组已经被 (int64_t*) 强制转化成了新的编码类型，做赋值的时候，value也会被转化成对应的类型
        ((int64_t*)is->contents)[pos] = value;
        // 转换大小端
        memrev64ifbe(((int64_t*)is->contents)+pos);
    } else if (encoding == INTSET_ENC_INT32) {
        ((int32_t*)is->contents)[pos] = value;
        memrev32ifbe(((int32_t*)is->contents)+pos);
    } else {
        ((int16_t*)is->contents)[pos] = value;
        memrev16ifbe(((int16_t*)is->contents)+pos);
    }
}
```

**升级**

```java
// 根据value的编码方式，对整数集合is的编码格式升级
static intset *intsetUpgradeAndAdd(intset *is, int64_t value) {
	// 当前集合的编码方式
    uint8_t curenc = intrev32ifbe(is->encoding);
    // 得到value合适的编码方式
    uint8_t newenc = _intsetValueEncoding(value);
    // 集合元素数量
    int length = intrev32ifbe(is->length);
    // 如果value小于0，则要将value添加到数组最前端，因此为移动1个编码长度
    int prepend = value < 0 ? 1 : 0;   
    // 更新集合is的编码方式
    is->encoding = intrev32ifbe(newenc);
    // 根据新的编码方式重新设置内存空间大小
    is = intsetResize(is, intrev32ifbe(is->length)+1);
    // 从后往前开始升级，可以使值不会被覆盖
    //_intsetGetEncoded() 得到下标为length的值
    //_intsetSet() 把原来的元素转换成新的编码类型，然后将转换后的元素放到正确的位上面
    // 如果是负数，prepend就等于1，原来的元素刚好都向后移动一个位置
    while(length--)
        _intsetSet(is,length+prepend,_intsetGetEncoded(is,length,curenc));
    // 在开头或者结尾放置新值
    // value是负数，要放在最前端
    if (prepend)
    	// 设置下标为0的值为value
        _intsetSet(is,0,value);
    else
    	// value为正数，设置最末尾+1的值为value
        _intsetSet(is,intrev32ifbe(is->length),value);
     // 数组元素加1
    is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
    return is;
}
```

### 4. 降级

整数集合不支持降级操作，一旦对数组进行了升级，编码就会一直保持升级后的状态.

### 5. 部分源码剖析

#### 5.1 创建一个空集合

```java
// 创建一个空集合
intset *intsetNew(void) {
	// 分配空间
    intset *is = zmalloc(sizeof(intset));
    // 设置编码方式，默认为 INTSET_ENC_INT16
    is->encoding = intrev32ifbe(INTSET_ENC_INT16);
    // 集合为空
    is->length = 0;
    return is;
}
```

#### 5.2 查找元素

```java
// 返回1表示value是集合中的元素，否则返回0
uint8_t intsetFind(intset *is, int64_t value) {
	// 获得value适合的编码类型   
    uint8_t valenc = _intsetValueEncoding(value);
    // 如果value的编码格式小于集合的编码格式且value在集合中已存在，返回1，其中任何一个不成立返回0
    return valenc <= intrev32ifbe(is->encoding) && intsetSearch(is,value,NULL);
}
```

```java
// 找到is集合中值为value的下标，返回1，并保存在pos中，没有找到返回0，并将pos设置为value可以插入到数组的位置
// 因为集合是有序的，所以使用的是二分查找
static uint8_t intsetSearch(intset *is, int64_t value, uint32_t *pos) {
    int min = 0, max = intrev32ifbe(is->length)-1, mid = -1;
    int64_t cur = -1;
	// 空集合返回0
    if (intrev32ifbe(is->length) == 0) {
        if (pos) *pos = 0;
        return 0;
    } else {
        // value不在数组区间中的情况
        // value大于数组中的最大值
        if (value > _intsetGet(is,intrev32ifbe(is->length)-1)) {
        	// 将pos设置为数组末尾
            if (pos) *pos = intrev32ifbe(is->length);
            return 0;
        // value小于数组的最小值
        } else if (value < _intsetGet(is,0)) {
         	// pos可以是下标为0的位置
            if (pos) *pos = 0;
            return 0;
        }
    }
	// 有序集合中进行二分查找
    while(max >= min) {
    	// (min + max) / 2，找到中间数的下标
        mid = ((unsigned int)min + (unsigned int)max) >> 1;
        // 获得下标为mid的值cur
        cur = _intsetGet(is,mid);
        if (value > cur) {
            min = mid+1;
        } else if (value < cur) {
            max = mid-1;
        } else {
            break;
        }
    }
		// 找到这个值
    if (value == cur) {
    	// 设置pos为找到的位置，返回1
        if (pos) *pos = mid;
        return 1;
    } else {
    	 // 此时min和max相等，所以pos可以设置为min或max，返回0
        if (pos) *pos = min;
        return 0;
    }
}
```

#### 5.3 移动元素

```java
// 向前或向后移动指定下标范围内的数组元素
// 插入或者删除元素会使用这个API
static void intsetMoveTail(intset *is, uint32_t from, uint32_t to) {
    void *src, *dst;
    // 获得要移动的元素的个数
    uint32_t bytes = intrev32ifbe(is->length)-from;
    // 获得集合is的默认编码方式
    uint32_t encoding = intrev32ifbe(is->encoding);
	// 判断不同的编码格式
    if (encoding == INTSET_ENC_INT64) {
    	// 获得要被移动范围的起始地址
        src = (int64_t*)is->contents+from;
        // 获得要被移动到的目的地址
        dst = (int64_t*)is->contents+to;
        // 计算要移动多少个字节
        bytes *= sizeof(int64_t);
    } else if (encoding == INTSET_ENC_INT32) {
        src = (int32_t*)is->contents+from;
        dst = (int32_t*)is->contents+to;
        bytes *= sizeof(int32_t);
    } else {
        src = (int16_t*)is->contents+from;
        dst = (int16_t*)is->contents+to;
        bytes *= sizeof(int16_t);
    }
    // 从src开始移动bytes个字节到dst
    // C语言库函数
    memmove(dst,src,bytes);
}
```

#### 5.4 添加元素

```java
// 将value添加到is集合中，如果成功success被设置为1否则为0
intset *intsetAdd(intset *is, int64_t value, uint8_t *success) {
	// 获得value适合的编码类型
    uint8_t valenc = _intsetValueEncoding(value);
    uint32_t pos;
    // 设置success默认为1
    if (success) *success = 1;
	// 如果value的编码类型大于集合的编码类型
    if (valenc > intrev32ifbe(is->encoding)) {
  		// 升级集合，并且将value加入集合，该步骤必定成功
        return intsetUpgradeAndAdd(is,value);   
    } else {
    	// 查找value，若果value已经存在，intsetSearch返回1,如果不存在，pos保存value可以插入的位置
        if (intsetSearch(is,value,&pos)) {
        	// value存在，success设置为0
            if (success) *success = 0;
            return is;
        }
        //value在集合中不存在，且pos保存可以插入的位置
        // 调整集合大小
        is = intsetResize(is,intrev32ifbe(is->length)+1);
        // 如果pos不是在数组末尾则要移动调整集合
        if (pos < intrev32ifbe(is->length)) intsetMoveTail(is,pos,pos+1);
    }
		// 设置pos下标的值为value
    _intsetSet(is,pos,value);
    // 集合节点数量加1
    is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
    return is;
}
```

#### 5.5 删除元素

```java
// 从集合中删除value，删除成功success设置为1，失败为0
intset *intsetRemove(intset *is, int64_t value, int *success) {
	// 获得value适合的编码类型
    uint8_t valenc = _intsetValueEncoding(value);
    uint32_t pos;
    // 设置success默认为0
    if (success) *success = 0;
    // 如果value的编码格式小于集合的编码格式且value在集合中已存在，pos保存着下标
    if (valenc <= intrev32ifbe(is->encoding) && intsetSearch(is,value,&pos)) {
    	// 备份当前集合元素数量
        uint32_t len = intrev32ifbe(is->length);
		// 删除成功，设置success为1
        if (success) *success = 1;
		// 如果不是最后一个元素，则移动元素覆盖掉被删除的元素
        if (pos < (len-1)) intsetMoveTail(is,pos+1,pos);
       	// 缩小大小
        is = intsetResize(is,len-1);
        // 更新集合元素个数
        is->length = intrev32ifbe(len-1);
    }
    return is;
}
```
