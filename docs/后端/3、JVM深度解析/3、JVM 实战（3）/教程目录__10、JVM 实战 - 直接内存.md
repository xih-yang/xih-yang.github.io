# 10、JVM 实战 - 直接内存
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/10.html
- 分类：JVM 实战
- 分组：教程目录
**我们知道 在jdk8 之后,Hotspot 将 方法区的实现改为元空间,直接使用本地内存,下面就来详细了解一下**

## 1. 直接内存的概述

**1、** 不是虚拟机运行时数据区的一部分，也不是《Java虚拟机规范》中定义的内存区域；

**2、** 直接内存是在Java堆外的、直接向系统申请的内存区间；

**3、****起源于NIO**，通过存在堆中的DirectByteBuffer操作Native内存；

**4、** 通常，访问直接内存的速度会优于Java堆即读写性能高因此出于性能考虑，读写频繁的场合可能会考虑使用直接内存；

**5、** Java的NIO库允许Java程序使用直接内存，用于数据缓冲区；

**NIO操作本地内存演示:**

```java
/**
 * 查看直接内存的占用与释放
 */
public class BufferTest {
    private static final int BUFFER = 1024 * 1024 * 1024;//1GB
    public static void main(String[] args){
        //直接分配本地内存空间
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(BUFFER);
        System.out.println("直接内存分配完毕，请求指示！");
        Scanner scanner = new Scanner(System.in);
        scanner.next();
        System.out.println("直接内存开始释放！");
        byteBuffer = null;
        System.gc();
        scanner.next();
    }
}
```

运行程序,查看进程 ,占用1GB的内存

释放后,内存减少1GB

## 2. 直接内存和jvm内存的区别

原来采用BIO的架构，在读写本地文件时，我们使用的是jvm分配的内存,需要从用户态切换成内核态

而NIO中的 DirectByteBuffer 直接操作 本地内存 操作磁盘,省去用户态和内核态之间的切换消耗

## 3. 直接内存中OOM

直接内存也可能导致OutofMemoryError异常`java.lang.OutOfMemoryError: Direct buffer memory`

由于直接内存在Java堆外，因此它的大小不会直接受限于-Xmx指定的最大堆大小，但是系统内存是有限的，Java堆和直接内存的总和依然受限于操作系统能给出的最大内存。

直接内存的缺点为：

- 分配回收成本较高
- 不受JVM内存回收管理

直接内存大小可以通过MaxDirectMemorySize设置 (不影响元空间的大小)

如果不指定，默认与堆的最大值-Xmx参数值一致

**在上面的 DirectByteBuffer 中,其底层也是通过 Unsafe 类来开辟 直接内存的,下面用反射的方式 直接进行分配**

```java
public class MaxDirectMemorySizeTest {
    private static final long _1MB = 1024 * 1024;
    public static void main(String[] args) throws IllegalAccessException {
        Field unsafeField = Unsafe.class.getDeclaredFields()[0];
        unsafeField.setAccessible(true);
        Unsafe unsafe = (Unsafe)unsafeField.get(null);
        while(true){
            unsafe.allocateMemory(_1MB);
        }
    }
}
```

无限的分配 直接内存,报错信息:

```java
Exception in thread "main" java.lang.OutOfMemoryError
	at sun.misc.Unsafe.allocateMemory(Native Method)
	at com.atguigu.java.MaxDirectMemorySizeTest.main(MaxDirectMemorySizeTest.java:20)
```
