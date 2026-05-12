# 24、Redis 源码解析 - Redis sds学习总结
- 来源：https://ddkk.com/zhuanlan/db/redis/5/24.html
- 分类：缓存数据库
- 分组：教程目录
### 1 学习回顾

[Redis 源码解析 - Redis sds学习，sds.h](/zhuanlan/db/redis/5/22.html?spm=1001.2014.3001.5502)

[Redis 源码解析 - Redis sds学习，sds.c（一）](/zhuanlan/db/redis/5/22.html?spm=1001.2014.3001.5502)

[Redis 源码解析 - Redis sds学习，sds.c（二）](/zhuanlan/db/redis/5/23.html?spm=1001.2014.3001.5502)

### 2 学习概括

#### 2.1 SDS

```java
typedef char *sds;
struct sdshdr {
    unsigned int len;
    unsigned int free;
    char buf[];
};
```

**1、** SDS是动态字符串（SimpleDynamicString，SDS）的简称；

**2、** SDS包含len、free、buf三个属性，分别代表字符串长度、可分配空间、字符数组；

**3、** 源代码中的sds是char*的别名，也是代表字符数组的指针；

#### 2.2 SDS相关方法

**1、** sdslen方法，返回sds的字符串长度；

**2、** sdsavail方法，返回sds剩余空间；

**3、** sdsnewlen方法，创建一个新的sds字符串；

**4、** sdsempty方法，创建一个空的sds字符串；

**5、** sdsnew方法，调用sdsnewlen，创建一个新的字符串；

**6、** sdsfree方法，释放sds的内存；

**7、** sdsclear方法，清空sds字符串内容；

**8、** sdsMakeRoomFor方法，动态扩容，为sds增加空闲空间；

**9、** sdsIncrLen方法，sds增加字符串长度；

**10、** sdscatlen方法，在sds尾部拼接另一个字符串；

**11、** sdscat方法，调用sdscatlen，拼接另一个字符串；

**12、** sdscatsds方法，调用sdscatlen，拼接另一个字符串；

### 3 学习总结

**1、** 动态字符串（SimpleDynamicString，SDS）是Redis专门设计的一种字符串数据结构；

**2、** SDS结构包含len、free、buf三个属性，分别代表字符串长度、可分配空间、字符数组；

**3、** SDS通过访问len属性可以快速得到字符串的长度，而不是需要遍历字符串每个字符到结尾；

**4、** SDS通过记录free属性，可以查询当前sds还有多少分配空间，这样可以避免反复分配内存空间；

**5、** sds.h头文件里定义sds的结构体定义，还有sdslen、sdsavail方法，还有一些方法签名；

**6、** sds结构需要增加字符串长度的时候会先调用sdsMakeRoomFor方法进行动态扩容；

**7、** 动态扩容有两种选择，一种方法是翻倍，一种加1M空间；

**8、** 一般操作了字符串都会变动sds的len和free属性，两者一般是一加一减的关系；

**9、** 每次变更sds都会在字符尾部设置结束符；

### 4 学习感悟

原本我以为很简单字符串，没想到Redis都对字符串做了重新设计，叫做简单动态字符串SDS，在保持原有字符串的基础上又附加了长度和空闲空间两个属性。

长度属性，不仅可以使获取字符串长度时间复杂度变为O（1），还可以配合和空闲空间属性做一些联动计算逻辑，一般增加了长度就要减少空闲空间，减少了长度，就要增加空闲空间。

空闲空间属性，可以用来帮助SDS控制存储空间，节省更改字符串重新分配内存空间的次数，要知道Redis追求高性能，如果反复重新分配内存肯定会影响性能。

说到空闲空间的话，就要说道SDS一个非常重要的扩容机制，每次更改字符串如果字符串长度超过空闲长度的话，就要对进行扩容动作，扩容动作有两种方式，一种是将新的字符串长度翻倍，一种是在新长度上再加1M的空间。

在Redis里的字符串都是用SDS来存储，所以了解这个数据结构，可以方便阅读其他的代码，不至于在处于懵逼的状态。
