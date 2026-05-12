# 11、调优实战 - 什么是OOM
- 来源：https://ddkk.com/zhuanlan/java/jvm/9/11.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 内存泄漏与内存溢出

- 内存泄漏（Memory Leak）：程序无法释放已经申请的内存空间；（多次内存泄漏会导致内存溢出）
- 内存溢出（Out Of Memory）：一直往JVM内存中存放数据，存不下了就会发生溢出；（程序在申请内存时，没有足够的内存空间可供申请）

就我们的Java应用而言，最常见的系统挂掉的原因也就是内存溢出，简称OOM。

## 2. 哪些区域会发生OOM

在前面已经介绍过了Java系统在jvm中的运行流程，这里就不再进行详细的介绍了；只简略介绍一下与本文相关的运行流程。

我们平常写Java代码，写的是什么？

其实就是写的一个个的类，然后在这一个个的类中去 定义各种变量、方法，通过if else等条件控制语句来实现各种各样的业务逻辑。

那我们的类写完了，就需要运行这个类，也就是需要jvm执行你写的类；那它首先得把类加载到内存中来，具体的类加载机制这里也不再展开介绍。

## 2.1 Metaspace

在jvm的内存模型中，有一块叫做 Metaspace（元数据空间）的区域，它会用来存放 **系统中定义的各种类的元数据信息、JDK自身内置的一些类的元数据信息等**；

既然是存放类的元数据信息，那如果类有很多，是不是就会导致Metadata区域发生OOM？

## 2.2 Java虚拟机栈

虽然我们写的Java程序都是一个个的类，但是我们具体的业务逻辑，一般都是封装在类中的各个方法里面的。

在jvm把类加载到内存之后，怎么执行里面的代码呢？

jvm会通过main()线程去执行**默认的启动方法 main()方法，然后main()方法去调用其他的各个方法来实现不同的业务逻辑**。

我们在实现业务逻辑的时候，通常都会在方法里面定义一些局部变量，然后方法本身会记录一些操作数栈，方法出口等信息，那这些东西是被记录在什么地方的呢？

在jvm的内存模型中，有一块叫做java虚拟机栈的地方，每个线程都有一个自己的固定大小的虚拟机栈，也就是 栈内存；

**某个线程只要调用一个方法，就会为这个方法创建一个栈帧，这个栈帧中包含了上面的局部变量、操作数栈、方法出口等信息；然后将这个栈帧放入到线程的虚拟机栈里面去**。

那既然每个线程的虚拟机栈的大小是有限的，如果调用方法太多，或者方法中的局部变量等东西太多，是不是就会导致虚拟机栈发生OOM（StackOverflow）？

（这里还有一个本地方法栈，原理是类似的，只是它是Native方法而已）

## 2.3 Java 堆

最后，我们在方法中实现各种业务逻辑，肯定是要频繁地创建一些对象的；比如创建对象来插入到数据库，或者从数据库读取出数据映射到对象上什么的。

这些对象，都是存放在Java堆中的；而Java堆的大小一般也是通过参数来设定的，也就是固定的；

所以当生成的对象太多了，是不是就会导致Java堆发生OOM？

## 2.4 直接内存（堆外内存）

这里先简单介绍一下ByteBuffer和DirectByteBuffer：

- ByteBuffer：字节缓冲区，它有两种实现：
- HeapByteBuffer：使用jvm堆内存的字节缓冲区；（对应 ByteBuffer源码中的 allocate()方法）
- DirectByteBuffer：使用堆外内存，不受jvm堆大小限制；（对应 ByteBuffer源码中的allocateDirect()方法）
- DirectByteBuffer：ByteBuffer对于使用堆外内存的实现，堆外内存直接使用unsafe方法请求堆外内存空间，读写数据；
- 源码：

```java
public abstract class ByteBuffer extends Buffer implements Comparable<ByteBuffer> {
   // ... 省略
   public static ByteBuffer allocateDirect(int capacity) {
       return new DirectByteBuffer(capacity);
   }
   // ... 省略
}
```

DirectByteBuffer与堆外内存的关系：

- 我们使用allocateDirect()方法生成的DirectByteBuffer对象，本身是存储在jvm堆中的，但是会在堆外内存中划分一块内存区域与这个对象关联起来；
- 在YGC或者FGC 回收 DirectByteBuffer对象的时候，会通过虚引用来释放它关联的堆外内存空间（由Cleaner类实现）；
- Java NIO 在每次分配堆外内存会进行判断，如果堆外内存空间不足时，使用System.gc()尝试释放内存，再次进行判断；

堆外内存空间大小设置：

- 有一个jvm参数可以指定堆外内存大小：-XX:MaxDirectMemorySize=512m;
- 但是如果没有手动指定时，用我们前面介绍的获取jvm参数的默认值命令：java -XX:+PrintFlagsFinal -version | grep MaxDirectMemorySize获取到的大小为0；

其实它这里是使用了VM类中代码来指定的大小：

```java
public class VM {
    private static long directMemory = 64 * 1024 * 1024;
    public static long maxDirectMemory() {
        return directMemory;
    }
}
```

也就是说堆外内存默认大小为64M；如果指定了jvm参数，就使用指定的大小值；

所以，既然堆外内存的大小是有限制的，如果我们在代码中使用了 ByteBuffer的allocateDirect()方法来申请堆外内存，并且没有及时回收 DirectByteBuffer对象来释放堆外内存的话；是不是就会导致堆外内存发生OOM？

所以总的来说，jvm运行模型中，唯一不会发生OOM的区域是 程序计数器。

这里再用一张图片来总结jvm的运行流程，包括 类编译和加载、main线程执行mian()方法、虚拟机栈内容、创建对象及存储到堆、垃圾回收过程、对象晋升老年代等：
