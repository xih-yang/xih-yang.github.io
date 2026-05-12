# 01、JDK 源码：阅读指引
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/1.html
- 分类：JDK 源码
- 分组：教程目录
说在最前面的话：

其实JDK源码的阅读，网上资料特别多，我阅读的最主要目的是自己学习，所以我读的可能不那么好，我的角度是从源码和源码对应的注释读起，顺便还能练练英语。

接下来准备对JDK的常见源码进行一下阅读，特整理一个学习指南出来供大家参考：

## 一、准备工作

以JDK1.8版本进行阅读。我下载的是比较新的jdk8u版本。

源码下载地址：[http://hg.openjdk.java.net/jdk8u/jdk8u/jdk/archive/78d2004f65eb.zip](http://hg.openjdk.java.net/jdk8u/jdk8u/jdk/archive/78d2004f65eb.zip)

具体下载方式请参考：[https://www.jianshu.com/p/6fe47f6a1b2a](https://www.jianshu.com/p/6fe47f6a1b2a)

下载速度太慢，提供个百度网盘：[https://pan.baidu.com/s/1MhEuyTbYc4Y-DlhSGK8P2g](https://pan.baidu.com/s/1MhEuyTbYc4Y-DlhSGK8P2g)

## 二、目录简介

#### 1.corba

> 全称：Common Object Request Broker Architecture（通用对象请求代理架构）
>
> 不常用的多语言、分布式通讯接口，基于对象-服务机制设计，类似于 JavaBean 和微软的 COM 技术。>

#### 2.hotspot

> 全称 :Java HotSpot Performance Engine（Java HotSpot性能引擎）
>
> 是Java 虚拟机的一个实现，包含了服务器版和桌面应用程序版。利用 JIT 及自适应优化技术（自动查找性能热点并进行动态优化）来提高性能。

#### 3.jaxp

> 全称: Java API for XML Processing（处理 XML 的 Java API）
>
> 提供了解析和验证 XML 文档的能力。

#### 4.jaxws

> 全称： Java API for Web Services（XML Web Services 的 Java API）
>
> JAX-WS 允许开发者选择面向 RPC（RPC-oriented）或是面向消息（Message-oriented）的方式来实现自己的 Web Services。

#### 5.jdk

> 包含了 JDK 的实现，实现源码位于 jdk/src/share 目录，其目录结构如下图所示：

**1、** classes目录包含的是Java实现，native目录包含的是C++实现；

**2、** back、instrument、javavm、npt、transport等目录包含了实现Java的基础部分的C++源码，在这里可以从最底层理解Java；

**3、** sample和demo目录包含一些示例；

#### 6.langtools

> Java 语言工具,包含 javac、javap 等实用程序的源码。

#### 7.nashorn

> JVM 上的 JavaScript 运行时，基于 JSR-223 协议，Java 开发者可在 Java 程序中嵌入 JavaScript 代码。

## 三、源码的阅读顺序

我们主要研究的是jdk源码，中间可能会穿插一些其他的c语言实现来提升逼格，而jdk源码的位置如图所示：

网上有一份整理的非常好的指引，我计划就按这个顺序来读了。

**1、** java.lang；

```java
Object
String
AbstractStringBuilder
StringBuffer
StringBuilder
Boolean
Byte
Double
Float
Integer
Long
Short
Thread
ThreadLocal
Enum
Throwable
Error
Exception
Class
ClassLoader
Compiler
System
Package
Void
Number
Math
```

**2、** java.util；

```java
AbstractList 
AbstractMap
AbstractSet 
ArrayList 
LinkedList
HashMap 
Hashtable
HashSet
LinkedHashMap
LinkedHashSet
TreeMap
TreeSet
Vector
Queue
Stack
SortedMap
SortedSet 
Collections
Arrays
Comparator
Iterator
Base64 
Date
EventListener
Random 
SubList 
Timer 
UUID 
WeakHashMap
```

**3、** java.util.concurrent；

```java
ConcurrentHashMap
Executor
AbstractExecutorService 
ExecutorService 
ThreadPoolExecutor
BlockingQueue
AbstractQueuedSynchronizer
CountDownLatch
FutureTask
Semaphore
CyclicBarrier
CopyOnWriteArrayList 
SynchronousQueue
BlockingDeque 
Callable
```

**4、** java.util.concurrent.atomic；

```java
AtomicBoolean
AtomicInteger
AtomicLong 
AtomicReference 
```

**5、** java.lang.reflect；

```java
Field
Method
```

**6、** java.lang.annotation；

```java
Annotation
Target
Inherited
Retention
Documented
ElementType
Native 
Repeatable
```

**7、** java.util.concurrent.locks；

```java
Lock 
Condition
ReentrantLock
ReentrantReadWriteLock
```

**8、** java.io；

```java
File
InputStream
OutputStream
Reader
Writer
```

**9、** java.nio；

```java
Buffer
ByteBuffer
CharBuffer
DoubleBuffer
FloatBuffer
IntBuffer
LongBuffer
ShortBuffer
```

**10、** java.sql；

```java
Connection
Driver 
DriverManager 
JDBCType 
ResultSet
Statement 
```

**11、** java.net；

```java
Socket 
ServerSocket 
URI 
URL
URLEncoder 
```

**12、** java.math；

```java
BigDecimal
BigInteger
```
