# 03、Netty入门 - Buffer的机制及子类
- 来源：https://ddkk.com/zhuanlan/server/netty/2/3.html
- 分类：服务器框架
- 分组：教程目录
## 缓冲区（Buffer）

缓存区（Buffer）：缓冲区本质上是一个可以读写数据的内存块，可以理解成是一个容器对象（含数组），该对象提供了一组方法，可以更轻松地使用内存块，缓冲区对象内置了一些机制，能够跟踪和记录缓冲区的状态变化情况。Channel提供从文件、网络读取数据的渠道，但是读取或写入的数据都必须经由Buffer，如图所示：

## Buffer类及其子类

**1、** 在NIO中，Buffer是一个顶层父类，它是一个抽象类，类的层级关系图如下；

**常用Buffer子类一览**

- ByteBuffer，存储字节数据到缓冲区；
- ShortBuffer，存储字符串数据到缓冲区；
- CharBuffer，存储字符数据到缓冲区；
- IntBuffer，存储整数数据到缓冲区；
- LongBuffer，存储长整型数据到缓冲区；
- DoubleBuffer，存储小数到缓冲区；
- FloatBuffer，存储小数到缓冲区。

**1、** Buffer类定义了所有的缓冲区都具有的四个属性来提供关于其所包含的数据元素的信息：

属性

描述

capacity

容量，既可以容纳的最大数据量；在缓冲区创建时被设定并且不能改变

limit

表示缓冲区的当前终点，不能对缓冲区超过极限的位置进行读写操作，且极限是可以修改的

position

位置，下一个要被读或写的元素的索引，每次读写缓冲区数据时都会改变该值，为下次读写做准备

mark

标记

示意图如下所示。

**1、** Buffer类相关方法一览；

```java
public abstract class Buffer {
    // JDK1.4时引入的api
    public final int capacity() // 返回此缓冲区
    public final int position()    // 返回此缓冲区的位置
    public final Buffer position(int newPosition)    // 设置此缓冲区的位置
    public final int limit()    // 返回此缓冲区的限制
    public final Buffer limit(int newLimit)    // 设置此缓冲区的限制
    public final Buffer mark()    // 在此缓冲区的位置设置标记
    public final Buffer reset()    // 将此缓冲区的位置重置为以前标记的位置
    public final Buffer clear()    // 清除此缓冲区，即将各个标记恢复到初始状态，但是数据并没有真正擦除
    public final Buffer flip()    // 反转此缓冲区
    public final Buffer rewind()    // 重绕此缓冲区
    public final int remaining()    // 返回当前位置和限制之间是否有元素
    public abstract boolean isReadOnly();    // 告知此缓冲区是否为只读缓冲区
    // JDK1.6时引入的api
    public abstract boolean hasArray();    // 告知此缓冲区是否具有可访问的底层实现数组
    public abstract Object array();    // 返回此缓冲区的底层实现数组
    public abstract int arrayOffset();    // 返回此缓冲区的底层实现数组中第一个缓冲区元素的偏移量
    public abstract boolean isDirect();    // 告知此缓冲区是否为直接缓冲区
}
```

**1、** ByteBuffer；

从前面可以看出对于Java中的基本数据类型（boolean除外），都有一个Buffer类型与之相对应，最常用的自然是ByteBuffer类（二进制数据），该类的主要方法如下：

```java
public abstract class ByteBuffer {
    public static ByteBuffer allocateDirect(int capacity)    // 创建直接缓冲区
    public static ByteBuffer allocate(int capacity)    // 设置缓冲区的初始容量
    public static ByteBuffer wrap(byte[] array)    // 把一个数组放到缓冲区中使用
    // 构造初始化位置offset和上界length的缓冲区
    public static ByteBuffer wrap(byte[] array, int offset, int length)
    // 缓冲区存储相关API
    public abstract byte get();    // 从当前位置position上get，get之后，position会自动+1
    public abstract byte get(int index);    // 从绝对位置get
    public abstract ByteBuffer put(byte b);    // 从当前位置上put，put之后，position会自动+1
    public abstract ByteBuffer put(int index, byte b);    // 从绝对位置上put
}
```
