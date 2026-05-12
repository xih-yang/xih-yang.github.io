# 09、Java JUC 源码分析 - Unsafe类和JAVA指令重排序
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/9.html
- 分类：Java并发
- 分组：教程目录
## 1、Unsafe类

### 1.1初识Unsafe

Unsafe类它是用来干什么的呢？可能从名字上来看，他是一个不安全的类。那为什么不安全呢？这个类不安全为什么又要使用呢？可能有一连串的问题，我们来一一解答。

Unsafe是位于sun.misc包下的一个类，主要提供一些用于执行低级别、不安全操作的方法，如直接访问系统内存资源、自主管理内存资源等，这些方法在提升Java运行效率、增强Java语言底层资源操作能力方面起到了很大的作用。但由于Unsafe类中的方法都是native方法，他们使用JNI的方式访问本地的C++实现库，也就是说，它使Java语言拥有了类似C语言指针一样操作内存空间的能力，这无疑也增加了程序发生相关指针问题的风险。在程序中过度、不正确使用Unsafe类会使得程序出错的概率变大，使得Java这种安全的语言变得不再“安全”，因此对Unsafe的使用一定要慎重。

那么Unsafe能够做那些事呢？Unsafe提供的API大致可分为 **内存操作** 、**CAS**、**Class相关**、**对象操作**、**线程调度**、**系统信息获取**、**内存屏障**、**数组操作**等几类。可以看出来这些API操作的都是很底层的东西，都是JAVA避免让用户直接操作的。

### 1.2如何使用Unsafe

如果要使用一个类，那么我们就必须要知道他是如何构造的。那么我们先来看看源码吧。下面的源码是我简化过的，真正的源码远比这个多得多，简化过后我们可以看得更清楚，他是如何构造的。

```java
public final class Unsafe {
  // 单例对象
  private static final Unsafe theUnsafe;
  private Unsafe() {
  }
  @CallerSensitive
  public static Unsafe getUnsafe() {
    Class var0 = Reflection.getCallerClass();
    if(!VM.isSystemDomainLoader(var0.getClassLoader())) {
      throw new SecurityException("Unsafe");
    } else {
      return theUnsafe;
    }
  }
}
```

从代码中可以看出，Unsafe类为单例实现，提供静态方法getUnsafe获取Unsafe实例。但是使用getUnsafe这个方法内部会判断当前调用者是否是由系统类加载器加载的，如果不是系统类加载器加载的，会抛出`SecurityException`异常。也就是说，如果你自己写一个类，提供一个main方法，在里面写这样的代码：

```java
public class UnsafeDemo {
    public static void main(String[] args) {
        Unsafe unsafe = Unsafe.getUnsafe();
    }
}
```

那么你就会发生这样的错误：

因为我们自己写的类使用的是AppClassLoader加载的，getUnsafe()这个方法里面做了一层判断，如果不是系统类加载器加载的就会报错。那么我们该如何获得Unsafe的实例对象呢？聪明的你肯定想到了，那就是反射。我们学过反射，通过反射可以获取到`Unsafe`中的`theUnsafe`字段的值，这样可以获取到Unsafe对象的实例。代码如下：

```java
public class UnsafeDemo2 {
    static Unsafe unsafe;
    static {
        try {
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            field.setAccessible(true);
            unsafe = (Unsafe)field.get(null);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        System.out.println(unsafe);
    }
}
```

那么我们再来思考一下，为什么要有这个判断呢？提供了这个方法，我们又不可以使用。

我们想一下，如果没有那个判断的限制，那么我们的应用程序就可以随意使用Unsafe做事情，而Unsafe直接操作内存，是极其不安全的，因为他绕开了JVM，所以JDK开发组特意做了这个限制，不让开发人员在正规渠道使用Unsafe类，而是在rt.jar包里面的核心类里面使用Unsafe。

### 1.3Unsafe中的CAS操作

通过查看源码，我们可以发现Unsafe类里面有三个CAS的方法（CAS我在上一篇博客讲过了，不知道的可以我的上一篇博客）

```java
public final native boolean compareAndSwapObject(Object obj, long valueOffset, Object expect, Object update);
public final native boolean compareAndSwapInt(Object obj, long valueOffset, int expect, int update);
public final native boolean compareAndSwapLong(Object obj, long valueOffset, long expect, long update);
```

其实三个方法的实现原理大同小异，只是操作的数据类型不同。我们就拿Long举例，也就是第三个方法。CAS的方法有四个参数分别是：对象的内存位置，对象中的变量偏移量，变量的预期值，变量的新的值。这个方法的意思是，比较对象obj中内存偏移量为valueOffset的变量，他的值和expect是否相等。相等则把update的值替换对象obj中内存偏移量为valueOffset的变量的值。

> 说一下offset，offeset为字段的偏移量，每个对象有个地址，offset是字段相对于对象地址的偏移量，对象地址记为baseAddress，字段偏移量记为offeset，那么字段对应的实际地址就是baseAddress+offeset，所以cas通过对象、偏移量就可以去操作字段对应的值了。

### 1.4Unsafe中的原子操作

原子操作方法，就是这些简单的方法都是可以保证方法内部操作的原子性

```java
/**
 * int类型值原子操作，对var2地址对应的值做原子增加操作(增加var4)
 *
 * @param var1 操作的对象
 * @param var2 var2字段内存地址偏移量
 * @param var4 需要加的值
 * @return
 */
public final int getAndAddInt(Object var1, long var2, int var4) {
    int var5;
    do {
        var5 = this.getIntVolatile(var1, var2);
    } while (!this.compareAndSwapInt(var1, var2, var5, var5 + var4));
    return var5;
}
/**
 * long类型值原子操作，对var2地址对应的值做原子增加操作(增加var4)
 *
 * @param var1 操作的对象
 * @param var2 var2字段内存地址偏移量
 * @param var4 需要加的值
 * @return 返回旧值
 */
public final long getAndAddLong(Object var1, long var2, long var4) {
    long var6;
    do {
        var6 = this.getLongVolatile(var1, var2);
    } while (!this.compareAndSwapLong(var1, var2, var6, var6 + var4));
    return var6;
}
/**
 * int类型值原子操作方法，将var2地址对应的值置为var4
 *
 * @param var1 操作的对象
 * @param var2 var2字段内存地址偏移量
 * @param var4 新值
 * @return 返回旧值
 */
public final int getAndSetInt(Object var1, long var2, int var4) {
    int var5;
    do {
        var5 = this.getIntVolatile(var1, var2);
    } while (!this.compareAndSwapInt(var1, var2, var5, var4));
    return var5;
}
/**
 * long类型值原子操作方法，将var2地址对应的值置为var4
 *
 * @param var1 操作的对象
 * @param var2 var2字段内存地址偏移量
 * @param var4 新值
 * @return 返回旧值
 */
public final long getAndSetLong(Object var1, long var2, long var4) {
    long var6;
    do {
        var6 = this.getLongVolatile(var1, var2);
    } while (!this.compareAndSwapLong(var1, var2, var6, var4));
    return var6;
}
/**
 * Object类型值原子操作方法，将var2地址对应的值置为var4
 *
 * @param var1 操作的对象
 * @param var2 var2字段内存地址偏移量
 * @param var4 新值
 * @return 返回旧值
 */
public final Object getAndSetObject(Object var1, long var2, Object var4) {
    Object var5;
    do {
        var5 = this.getObjectVolatile(var1, var2);
    } while (!this.compareAndSwapObject(var1, var2, var5, var4));
    return var5;
}
```

这些方法都十分简单，且方法内部通过自旋的CAS操作实现的，这些方法都可以保证操作的数据在多线程环境中的原子性，正确性。

## 2、JAVA指令重排序

### 2.1认识指令重排序

JAVA内存模型允许编译器和处理器对指令重排序以提高运行性能，并且**只会对不存在数据依赖的指令进行重排序** 。在单线程下重排序可以保证最终执行的结果与程序顺序执行的结果一致，但是多线程就会出现问题。为什么呢？我么来看一个简单地例子。

```java
public class UnsafeDemo3 {
    public static void main(String[] args) {
        int a = 1;//(1)
        int b = 2;//(2)
        int c = a + b;//(3)
    }
}
```

在如上代码中，变量c的值依赖a和b的值，所以重排序以后更够保证（3）操作在（2）（1）操作之前执行，但是1和2操作谁先执行就不一定了，在单线程中，（2）和（1）谁先执行并不会影响c的结果，但是多线程就不同了。看如下代码：

```java
public class Demo extends Thread{
    public static class ReadThread extends Thread {
        public void run() {
            while (!Thread.currentThread().isInterrupted()) {
                if (ready) {
     //(1)
                    System.out.println(num + num);//(2)
                }
                System.out.println("read Thread...");
            }
        }
    }
    public static class WriteThread extends Thread{
        public void run(){
            num = 2;//(3)
            ready = true;//(4)
            System.out.println("WriteThread set over...");
        }
    }
    private static int num = 0;
    private static boolean ready=false;
    public static void main(String[] args) throws InterruptedException {
        ReadThread rt = new ReadThread();
        rt.start();
        WriteThread wt = new WriteThread();
        wt.start();
        Thread.sleep(100);
        rt.interrupt();
        System.out.println("main exit");
    }
}
```

仔细看上述代码，，如上述代码，在不考虑内存可见性问题的情况下一定会输出4吗？答案是不一定。由于我们的1、2、3、4步操作之间不存在依赖关系，所以WritenThread的（3）（4）可能会被重排序，执行顺序变为先执行（4）在执行（3），在多线程情况下，执行（4）之后，线程可能已经执行了（1），并且在（3）之前，执行（2），这个时候就会打印0。

重排序会在多线程下导致非预期的执行结果，那么该怎么办呢？使用volatile关键字修饰ready，就可以避免重排序和内存可见性问题。写volatile变量时，可以确保volatile写之前的操作不会被编译器重排序到volatile写之后。读volatile变量时，可以确保volatile读之后的操作不会被编译器重排序到volatile读之前。
