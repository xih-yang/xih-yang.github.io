# 04、Netty 源码解析 - Buffer的机制及子类
- 来源：https://ddkk.com/zhuanlan/server/netty/1/4.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

缓冲区（Buffer）：缓冲区本质上是一个可以读写数据的内存块，可以理解成是一个**容器对象（含数组）** ，该对象提供了**一组方法**，可以更轻松地使用内存块，缓冲区对象内置了一些机制，能够跟踪和记录缓冲区的状态变化情况。Channel 提供从文件、网络读取数据的渠道，但是读取或写入的数据必须经由 Buffer ，如下图所示：

## 二、Buffer类及其子类

1、在 NIO 中，Buffer 是一个顶级父类，它是一个抽象类，类的层级关系图：

**1、** ByteBuffer，存储字节数据到缓冲区；

**2、** ShortBuffer，存储短整型数据到缓冲区；

**3、** CharBuffer，存储字符数据到缓冲区；

**4、** IntBuffer，存储整型数据到缓冲区；

**5、** LongBuffer，存储长整型数据到缓冲区；

**6、** DoubleBuffer，存储小数数据到缓冲区；

**7、** FloatBuffer，存储小数数据到缓冲区；

2、Buffer 类定义了所有的缓冲区都具有的四个属性来提供关于其所包含的数据元素的信息。

```java
// Invariants: mark <= position <= limit <= capacity
private int mark = -1;
private int position = 0;
private int limit;
private int capacity;
```

属性
描述

capacity
容量，既可以容纳的最大数据量，在缓冲区创建时被设定且不能改变

limit
表示缓冲区的当前终点，不能对缓冲区超过极限的位置进行读写操作，且极限是可以修改的

position
当前位置，下一个要被读或写的元素的索引，每次读写缓冲区数据时都会改变该值，为下次读写做准备

mark
标记

3、常用方法

方法
描述

int capacity()
返回此缓冲区的容量

int position()
返回此缓冲区的位置

Buffer position(int newPosition)
设置此缓冲区的位置

int limit()
返回此缓冲区的限制

Buffer limit(int newLimit)
设置此缓冲区的限制

Buffer mark()
在此缓冲区的位置设置标记

Buffer reset()
将此缓冲区的位置重置为以前标记的位置

Buffer clear()
清除此缓冲区，即将各个标记恢复到初始状态，但是数据并没有真正擦除

Buffer flip()
反转此缓冲区

Buffer rewind()
重绕此缓冲区

int remaining()
返回当前位置与限制之间的元素数

boolean hasRemaining()
告知在当前位置和限制之间是否有元素

boolean isReadOnly()
告知此缓冲区是否为只读缓冲区

boolean hasArray()
告知此缓冲区是否具有可访问的底层实现数组

Object array()
返回此缓冲区的底层实现数组

int arrayOffset()
返回此缓冲区的底层实现数组中第一个缓冲区元素的偏移量

boolean isDirect()
告知此缓冲区是否为直接缓冲区

```java
// 从 Buffer 读取数据
intBuffer.flip(); // 将 Buffer 转换，读写切换(!!!)
intBuffer.position(1);// 1、2、3、4、5、6、7
intBuffer.limit(8);
while (intBuffer.hasRemaining()){
	System.out.println(intBuffer.get());
}
```

4、ByteBuffer

从前面可以看出对于 Java 中的基本数据类型（boolean除外），都有一个 Buffer 类型与之相对应，最常用的自然是 ByteBuffer 类（二进制数据），该类的主要方法如下：

方法
描述

ByteBuffer allocateDirect(int capacity)
创建直接缓冲区

ByteBuffer allocate(int capacity)
设置缓冲区的初始容量

ByteBuffer wrap(byte[] array)
把一个数组放到缓冲区中使用

ByteBuffer wrap(byte[] array,int offset, int length)
构造初始化位置offset和上界length的缓冲区

byte get()
从当前位置position上get，get之后，position会自动+1

byte get(int index)
从绝对位置get

ByteBuffer put(byte b)
从当前位置上put，put之后，position会自动+1

ByteBuffer put(int index, byte b)
从绝对位置上put

## 三、Buffer执行原理

1、当我们用 XxxBuffer 申请 allocate(10) 了一个缓冲区后，我们得到了一个capacity为指定参数的大小的数组缓冲区。当前我们什么都没做，position当然保持在初始0的位置，因为初始状态没有切换到读模式，没有什么需要标记其后不能读的，写只要不超过capacity就可以，所以limit放在最后，与capacity值一样。

2、当我们put()写入5个数值之后，position变为5（0到4已经写了数，若要继续写需要从5开始）。因为没有切换到读模式，所以没有什么需要声明其后不能读，写只要不超过capacity就可以，所以limit放在最后，与capacity值一样。

3、当我们需要读取我们刚才写入缓冲区的数据时，首先需要做的是调用缓冲区的flip()方法，将缓冲区切换到读模式。切换到读模式之后，我们要做的是将刚才的写入的5个数据读取出来，很自然地，postion会变回0，因为0是写入的起始位置；因为刚才只写入了5个，因此数据只写到0-4，所以从第5个开始之后的不能被读取，所以limit变成5，限定5开始之后的缓冲区空间不能够被读取。

```java
public final Buffer flip() {
	limit = position;
	position = 0;
	mark = -1;
	return this;
}
```
