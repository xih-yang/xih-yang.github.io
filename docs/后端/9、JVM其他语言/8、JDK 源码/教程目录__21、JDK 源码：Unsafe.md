# 21、JDK 源码：Unsafe
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/21.html
- 分类：JDK 源码
- 分组：教程目录
接下来再看一个JDK中比较特殊的类Unsafe。

## 一、概述

Java和C++语言的一个重要区别就是Java中我们无法直接操作一块内存区域，不能像C++中那样可以自己申请内存和释放内存。Java中的Unsafe类为我们提供了类似C++手动管理内存的能力。

Unsafe类，全限定名是`sun.misc.Unsafe`，从名字中我们可以看出来这个类对普通程序员来说是“危险”的，一般应用开发者不会用到这个类。它不属于Java标准。但是很多Java的基础类库，包括一些被广泛使用的高性能开发库都是基于Unsafe类开发的，比如Netty、Cassandra、Hadoop、Kafka等。Unsafe类在提升Java运行效率，增强Java语言底层操作能力方面起了很大的作用。

Unsafe类使Java拥有了像指针一样操作内存的能力，但同时也带来了指针问题。过度的使用Unsafe类会使得出错的几率变大，因此Java官方并不建议使用的，官方文档也几乎没有。Oracle正在计划从Java中去掉Unsafe类，如果真是如此影响就太大了。

## 二、类介绍

Unsafe类是"final"的，不允许继承。且构造函数是private的。

```java
public final class Unsafe {
    private static native void registerNatives();
    static {
        registerNatives();
        sun.reflect.Reflection.registerMethodsToFilter(Unsafe.class, "getUnsafe");
    }
    private Unsafe() {}
    private static final Unsafe theUnsafe = new Unsafe();
    ....
}
```

Unsafe可以通过静态方法getUnsafe()来进行实例化，源码如下：

```java
@CallerSensitive
public static Unsafe getUnsafe() {
    Class<?> caller = Reflection.getCallerClass();
    if (!VM.isSystemDomainLoader(caller.getClassLoader()))
        throw new SecurityException("Unsafe");
    return theUnsafe;
}
```

Unsafe类做了限制，如果是普通的调用的话，它会抛出一个SecurityException异常；只有由主类加载器(BootStrap classLoader)加载的类才能调用这个类中的方法。最简单的使用方式是基于反射获取Unsafe实例。示例如下：

```java
publice static Unsafe getUnsafe(){
    try {
        Field field = Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        Unsafe unsafe = (Unsafe) field.get(null);
        return unsafe;
    } catch (Exception e) {
        e.printStackTrace();
    }
    return null;
}
```

## 三、常见方法介绍

#### 1.直接内存操作。

该部分包括了allocateMemory（分配内存）、reallocateMemory（重新分配内存）、copyMemory（拷贝内存）、freeMemory（释放内存 ）、getAddress（获取内存地址）、addressSize、pageSize、getInt（获取内存地址指向的整数）、getIntVolatile（获取内存地址指向的整数，并支持volatile语义）、putInt（将整数写入指定内存地址）、putIntVolatile（将整数写入指定内存地址，并支持volatile语义）、putOrderedInt（将整数写入指定内存地址、有序或者有延迟的方法）等方法。getXXX和putXXX包含了各种基本类型的操作。

利用copyMemory方法，我们可以实现一个通用的对象拷贝方法，无需再对每一个对象都实现clone方法，当然这通用的方法只能做到对象浅拷贝。

#### 2.非常规的对象实例化。

allocateInstance()方法提供了另一种创建实例的途径。通常我们可以用new或者反射来实例化对象，使用allocateInstance()方法可以直接生成对象实例，且无需调用构造方法和其它初始化方法。

这在对象反序列化的时候会很有用，能够重建和设置final字段，而不需要调用构造方法。

#### 3.操作类、对象、变量。

这部分包括了staticFieldOffset（静态域偏移）、defineClass（定义类）、defineAnonymousClass（定义匿名类）、ensureClassInitialized（确保类初始化）、objectFieldOffset（对象域偏移）等方法。

通过这些方法我们可以获取对象的指针，通过对指针进行偏移，我们不仅可以直接修改指针指向的数据（即使它们是私有的），甚至可以找到JVM已经认定为垃圾、可以进行回收的对象。

#### 4.数组操作。

这部分包括了arrayBaseOffset（获取数组第一个元素的偏移地址）、arrayIndexScale（获取数组中元素的增量地址）等方法。arrayBaseOffset与arrayIndexScale配合起来使用，就可以定位数组中每个元素在内存中的位置。

由于Java的数组最大值为Integer.MAX_VALUE，使用Unsafe类的内存分配方法可以实现超大数组。实际上这样的数据就可以认为是C数组，因此需要注意在合适的时间释放内存。

#### **5.多线程同步。**包括锁机制、CAS操作等。

这部分包括了monitorEnter、tryMonitorEnter、monitorExit、compareAndSwapInt、compareAndSwap等方法。

其中monitorEnter、tryMonitorEnter、monitorExit已经被标记为deprecated，不建议使用。

Unsafe类的CAS操作可能是用的最多的，它为Java的锁机制提供了一种新的解决办法，比如AtomicInteger等类都是通过该方法来实现的。compareAndSwap方法是原子的，可以避免繁重的锁机制，提高代码效率。这是一种乐观锁，通常认为在大部分情况下不出现竞态条件，如果操作失败，会不断重试直到成功。

#### 6.线程相关。

这部分包括了park、unpark等方法。

将一个线程进行挂起是通过park方法实现的，调用 park后，线程将一直阻塞直到超时或者中断等条件出现。unpark可以终止一个挂起的线程，使其恢复正常。整个并发框架中对线程的挂起操作被封装在 LockSupport类中，LockSupport类中有各种版本pack方法，但最终都调用了Unsafe.park()方法。

#### 7.内存屏障。

这部分包括了loadFence、storeFence、fullFence等方法。这是在Java 8新引入的，用于定义内存屏障，避免代码重排序。

loadFence() 表示该方法之前的所有load操作在内存屏障之前完成。同理storeFence()表示该方法之前的所有store操作在内存屏障之前完成。fullFence()表示该方法之前的所有load、store操作在内存屏障之前完成。

## 四、Unsafe的使用方法

#### 1.使用Unsafe实例化一个类

假如我们有一个简单的类如下：

```java
class User {
    int age;
    public User() {
        this.age = 10;
    }
}
```

如果我们通过构造方法实例化这个类，age属性将会返回10。

```java
User user1 = new User();
// 打印10
System.out.println(user1.age);
```

如果我们调用Unsafe来实例化呢？

```java
User user2 = (User) unsafe.allocateInstance(User.class);
// 打印0
System.out.println(user2.age);
```

age将返回0，因为Unsafe.allocateInstance()只会给对象分配内存，并不会调用构造方法，所以这里只会返回int类型的默认值0。

#### 2.修改私有字段的值

```java
public class UnsafeTest {
    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException, InstantiationException {
        Field f = Unsafe.class.getDeclaredField("theUnsafe");
        f.setAccessible(true);
        Unsafe unsafe = (Unsafe) f.get(null);
        User user = new User();
        Field age = user.getClass().getDeclaredField("age");
        unsafe.putInt(user, unsafe.objectFieldOffset(age), 20);
        // 打印20
        System.out.println(user.getAge());
    }
}
class User {
    private int age;
    public User() {
        this.age = 10;
    }
    public int getAge() {
        return age;
    }
}
```

一旦我们通过反射调用得到字段age，我们就可以使用Unsafe将其值更改为任何其他int值。（当然，这里也可以通过反射直接修改）

#### 3.抛出checked异常

我们知道如果代码抛出了checked异常，要不就使用try...catch捕获它，要不就在方法签名上定义这个异常，但是，通过Unsafe我们可以抛出一个checked异常，同时却不用捕获或在方法签名上定义它。

```java
    // 使用正常方式抛出IOException需要定义在方法签名上往外抛
    public static void readFile() throws IOException {
        throw new IOException();
    }
    // 使用Unsafe抛出异常不需要定义在方法签名上往外抛
    public static void readFileUnsafe() {
        unsafe.throwException(new IOException());
    }
```

#### 4.CompareAndSwap操作

JUC下面大量使用了CAS操作，它们的底层是调用的Unsafe的CompareAndSwapXXX()方法。这种方式广泛运用于无锁算法，与java中标准的悲观锁机制相比，它可以利用CAS处理器指令提供极大的加速。

比如，我们可以基于Unsafe的compareAndSwapInt()方法构建线程安全的计数器。

```java
class Counter {
    private volatile int count = 0;
    private static long offset;
    private static Unsafe unsafe;
    static {
        try {
            Field f = Unsafe.class.getDeclaredField("theUnsafe");
            f.setAccessible(true);
            unsafe = (Unsafe) f.get(null);
            offset = unsafe.objectFieldOffset(Counter.class.getDeclaredField("count"));
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
    }
    public void increment() {
        int before = count;
        // 失败了就重试直到成功为止
        while (!unsafe.compareAndSwapInt(this, offset, before, before + 1)) {
            before = count;
        }
    }
    public int getCount() {
        return count;
    }
}
```

我们定义了一个volatile的字段count，以便对它的修改所有线程都可见，并在类加载的时候获取count在类中的偏移地址。

在increment()方法中，我们通过调用Unsafe的compareAndSwapInt()方法来尝试更新之前获取到的count的值，如果它没有被其它线程更新过，则更新成功，否则不断重试直到成功为止。

我们可以通过使用多个线程来测试我们的代码：

```java
Counter counter = new Counter();
ExecutorService threadPool = Executors.newFixedThreadPool(100);
// 起100个线程，每个线程自增10000次
IntStream.range(0, 100)
    .forEach(i->threadPool.submit(()->IntStream.range(0, 10000)
    .forEach(j->counter.increment())));
threadPool.shutdown();
Thread.sleep(2000);
// 打印1000000
System.out.println(counter.getCount());
```

## 五、Unsafe的使用建议

建议先看这个知乎帖子第一楼R大的回答：[为什么JUC中大量使用了sun.misc.Unsafe 这个类，但官方却不建议开发者使用](https://www.zhihu.com/question/29266773?sort=created)。

使用Unsafe要注意以下几个问题：

- 1、Unsafe有可能在未来的Jdk版本移除或者不允许Java应用代码使用，这一点可能导致使用了Unsafe的应用无法运行在高版本的Jdk。
- 2、Unsafe的不少方法中必须提供原始地址(内存地址)和被替换对象的地址，偏移量要自己计算，一旦出现问题就是JVM崩溃级别的异常，会导致整个JVM实例崩溃，表现为应用程序直接crash掉。
- 3、Unsafe提供的直接内存访问的方法中使用的内存不受JVM管理(无法被GC)，需要手动管理，一旦出现疏忽很有可能成为内存泄漏的源头。

暂时总结出以上三点问题。Unsafe在JUC(java.util.concurrent)包中大量使用(主要是CAS)，在netty中方便使用直接内存，还有一些高并发的交易系统为了提高CAS的效率也有可能直接使用到Unsafe。总而言之，Unsafe类是一把双刃剑。

## 六、附录

Unsafe类完整源码，来自于jdk-78d2004f65eb：

```java
/*
 * Copyright (c) 2000, 2013, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Oracle designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Oracle in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */
package sun.misc;
import java.security.*;
import java.lang.reflect.*;
import sun.reflect.CallerSensitive;
import sun.reflect.Reflection;
/**
 * A collection of methods for performing low-level, unsafe operations.
 * Although the class and all methods are public, use of this class is
 * limited because only trusted code can obtain instances of it.
 *
 * @author John R. Rose
 * @seegetUnsafe
 */
public final class Unsafe {
    private static native void registerNatives();
    static {
        registerNatives();
        sun.reflect.Reflection.registerMethodsToFilter(Unsafe.class, "getUnsafe");
    }
    private Unsafe() {}
    private static final Unsafe theUnsafe = new Unsafe();
    /**
     * Provides the caller with the capability of performing unsafe
     * operations.
     *
     * <p> The returned <code>Unsafe</code> object should be carefully guarded
     * by the caller, since it can be used to read and write data at arbitrary
     * memory addresses.  It must never be passed to untrusted code.
     *
     * <p> Most methods in this class are very low-level, and correspond to a
     * small number of hardware instructions (on typical machines).  Compilers
     * are encouraged to optimize these methods accordingly.
     *
     * <p> Here is a suggested idiom for using unsafe operations:
     *
     * <blockquote><pre>
     * class MyTrustedClass {
     *   private static final Unsafe unsafe = Unsafe.getUnsafe();
     *   ...
     *   private long myCountAddress = ...;
     *   public int getCount() { return unsafe.getByte(myCountAddress); }
     * }
     * </pre></blockquote>
     *
     * (It may assist compilers to make the local variable be
     * <code>final</code>.)
     *
     * @exception  SecurityException  if a security manager exists and its
     *             <code>checkPropertiesAccess</code> method doesn't allow
     *             access to the system properties.
     */
    @CallerSensitive
    public static Unsafe getUnsafe() {
        Class<?> caller = Reflection.getCallerClass();
        if (!VM.isSystemDomainLoader(caller.getClassLoader()))
            throw new SecurityException("Unsafe");
        return theUnsafe;
    }
    /// peek and poke operations
    /// (compilers should optimize these to memory ops)
    // These work on object fields in the Java heap.
    // They will not work on elements of packed arrays.
    /**
     * Fetches a value from a given Java variable.
     * More specifically, fetches a field or array element within the given
     * object <code>o</code> at the given offset, or (if <code>o</code> is
     * null) from the memory address whose numerical value is the given
     * offset.
     * <p>
     * The results are undefined unless one of the following cases is true:
     * <ul>
     * <li>The offset was obtained from {@linkobjectFieldOffset} on
     * the {@link java.lang.reflect.Field} of some Java field and the object
     * referred to by <code>o</code> is of a class compatible with that
     * field's class.
     *
     * <li>The offset and object reference <code>o</code> (either null or
     * non-null) were both obtained via {@linkstaticFieldOffset}
     * and {@linkstaticFieldBase} (respectively) from the
     * reflective {@link Field} representation of some Java field.
     *
     * <li>The object referred to by <code>o</code> is an array, and the offset
     * is an integer of the form <code>B+N*S</code>, where <code>N</code> is
     * a valid index into the array, and <code>B</code> and <code>S</code> are
     * the values obtained by {@linkarrayBaseOffset} and {@link
     *arrayIndexScale} (respectively) from the array's class.  The value
     * referred to is the <code>N</code><em>th</em> element of the array.
     *
     * </ul>
     * <p>
     * If one of the above cases is true, the call references a specific Java
     * variable (field or array element).  However, the results are undefined
     * if that variable is not in fact of the type returned by this method.
     * <p>
     * This method refers to a variable by means of two parameters, and so
     * it provides (in effect) a <em>double-register</em> addressing mode
     * for Java variables.  When the object reference is null, this method
     * uses its offset as an absolute address.  This is similar in operation
     * to methods such as {@linkgetInt(long)}, which provide (in effect) a
     * <em>single-register</em> addressing mode for non-Java variables.
     * However, because Java variables may have a different layout in memory
     * from non-Java variables, programmers should not assume that these
     * two addressing modes are ever equivalent.  Also, programmers should
     * remember that offsets from the double-register addressing mode cannot
     * be portably confused with longs used in the single-register addressing
     * mode.
     *
     * @param o Java heap object in which the variable resides, if any, else
     *        null
     * @param offset indication of where the variable resides in a Java heap
     *        object, if any, else a memory address locating the variable
     *        statically
     * @return the value fetched from the indicated Java variable
     * @throws RuntimeException No defined exceptions are thrown, not even
     *         {@link NullPointerException}
     */
    public native int getInt(Object o, long offset);
    /**
     * Stores a value into a given Java variable.
     * <p>
     * The first two parameters are interpreted exactly as with
     * {@linkgetInt(Object, long)} to refer to a specific
     * Java variable (field or array element).  The given value
     * is stored into that variable.
     * <p>
     * The variable must be of the same type as the method
     * parameter <code>x</code>.
     *
     * @param o Java heap object in which the variable resides, if any, else
     *        null
     * @param offset indication of where the variable resides in a Java heap
     *        object, if any, else a memory address locating the variable
     *        statically
     * @param x the value to store into the indicated Java variable
     * @throws RuntimeException No defined exceptions are thrown, not even
     *         {@link NullPointerException}
     */
    public native void putInt(Object o, long offset, int x);
    /**
     * Fetches a reference value from a given Java variable.
     * @seegetInt(Object, long)
     */
    public native Object getObject(Object o, long offset);
    /**
     * Stores a reference value into a given Java variable.
     * <p>
     * Unless the reference <code>x</code> being stored is either null
     * or matches the field type, the results are undefined.
     * If the reference <code>o</code> is non-null, car marks or
     * other store barriers for that object (if the VM requires them)
     * are updated.
     * @seeputInt(Object, int, int)
     */
    public native void putObject(Object o, long offset, Object x);
    /** @seegetInt(Object, long) */
    public native boolean getBoolean(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putBoolean(Object o, long offset, boolean x);
    /** @seegetInt(Object, long) */
    public native byte    getByte(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putByte(Object o, long offset, byte x);
    /** @seegetInt(Object, long) */
    public native short   getShort(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putShort(Object o, long offset, short x);
    /** @seegetInt(Object, long) */
    public native char    getChar(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putChar(Object o, long offset, char x);
    /** @seegetInt(Object, long) */
    public native long    getLong(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putLong(Object o, long offset, long x);
    /** @seegetInt(Object, long) */
    public native float   getFloat(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putFloat(Object o, long offset, float x);
    /** @seegetInt(Object, long) */
    public native double  getDouble(Object o, long offset);
    /** @seeputInt(Object, int, int) */
    public native void    putDouble(Object o, long offset, double x);
    /**
     * This method, like all others with 32-bit offsets, was native
     * in a previous release but is now a wrapper which simply casts
     * the offset to a long value.  It provides backward compatibility
     * with bytecodes compiled against 1.4.
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public int getInt(Object o, int offset) {
        return getInt(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putInt(Object o, int offset, int x) {
        putInt(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public Object getObject(Object o, int offset) {
        return getObject(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putObject(Object o, int offset, Object x) {
        putObject(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public boolean getBoolean(Object o, int offset) {
        return getBoolean(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putBoolean(Object o, int offset, boolean x) {
        putBoolean(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public byte getByte(Object o, int offset) {
        return getByte(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putByte(Object o, int offset, byte x) {
        putByte(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public short getShort(Object o, int offset) {
        return getShort(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putShort(Object o, int offset, short x) {
        putShort(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public char getChar(Object o, int offset) {
        return getChar(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putChar(Object o, int offset, char x) {
        putChar(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public long getLong(Object o, int offset) {
        return getLong(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putLong(Object o, int offset, long x) {
        putLong(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public float getFloat(Object o, int offset) {
        return getFloat(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putFloat(Object o, int offset, float x) {
        putFloat(o, (long)offset, x);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public double getDouble(Object o, int offset) {
        return getDouble(o, (long)offset);
    }
    /**
     * @deprecated As of 1.4.1, cast the 32-bit offset argument to a long.
     * See {@linkstaticFieldOffset}.
     */
    @Deprecated
    public void putDouble(Object o, int offset, double x) {
        putDouble(o, (long)offset, x);
    }
    // These work on values in the C heap.
    /**
     * Fetches a value from a given memory address.  If the address is zero, or
     * does not point into a block obtained from {@linkallocateMemory}, the
     * results are undefined.
     *
     * @seeallocateMemory
     */
    public native byte    getByte(long address);
    /**
     * Stores a value into a given memory address.  If the address is zero, or
     * does not point into a block obtained from {@linkallocateMemory}, the
     * results are undefined.
     *
     * @seegetByte(long)
     */
    public native void    putByte(long address, byte x);
    /** @seegetByte(long) */
    public native short   getShort(long address);
    /** @seeputByte(long, byte) */
    public native void    putShort(long address, short x);
    /** @seegetByte(long) */
    public native char    getChar(long address);
    /** @seeputByte(long, byte) */
    public native void    putChar(long address, char x);
    /** @seegetByte(long) */
    public native int     getInt(long address);
    /** @seeputByte(long, byte) */
    public native void    putInt(long address, int x);
    /** @seegetByte(long) */
    public native long    getLong(long address);
    /** @seeputByte(long, byte) */
    public native void    putLong(long address, long x);
    /** @seegetByte(long) */
    public native float   getFloat(long address);
    /** @seeputByte(long, byte) */
    public native void    putFloat(long address, float x);
    /** @seegetByte(long) */
    public native double  getDouble(long address);
    /** @seeputByte(long, byte) */
    public native void    putDouble(long address, double x);
    /**
     * Fetches a native pointer from a given memory address.  If the address is
     * zero, or does not point into a block obtained from {@link
     *allocateMemory}, the results are undefined.
     *
     * <p> If the native pointer is less than 64 bits wide, it is extended as
     * an unsigned number to a Java long.  The pointer may be indexed by any
     * given byte offset, simply by adding that offset (as a simple integer) to
     * the long representing the pointer.  The number of bytes actually read
     * from the target address maybe determined by consulting {@link
     *addressSize}.
     *
     * @seeallocateMemory
     */
    public native long getAddress(long address);
    /**
     * Stores a native pointer into a given memory address.  If the address is
     * zero, or does not point into a block obtained from {@link
     *allocateMemory}, the results are undefined.
     *
     * <p> The number of bytes actually written at the target address maybe
     * determined by consulting {@linkaddressSize}.
     *
     * @seegetAddress(long)
     */
    public native void putAddress(long address, long x);
    /// wrappers for malloc, realloc, free:
    /**
     * Allocates a new block of native memory, of the given size in bytes.  The
     * contents of the memory are uninitialized; they will generally be
     * garbage.  The resulting native pointer will never be zero, and will be
     * aligned for all value types.  Dispose of this memory by calling {@link
     *freeMemory}, or resize it with {@linkreallocateMemory}.
     *
     * @throws IllegalArgumentException if the size is negative or too large
     *         for the native size_t type
     *
     * @throws OutOfMemoryError if the allocation is refused by the system
     *
     * @seegetByte(long)
     * @seeputByte(long, byte)
     */
    public native long allocateMemory(long bytes);
    /**
     * Resizes a new block of native memory, to the given size in bytes.  The
     * contents of the new block past the size of the old block are
     * uninitialized; they will generally be garbage.  The resulting native
     * pointer will be zero if and only if the requested size is zero.  The
     * resulting native pointer will be aligned for all value types.  Dispose
     * of this memory by calling {@linkfreeMemory}, or resize it with {@link
     *reallocateMemory}.  The address passed to this method may be null, in
     * which case an allocation will be performed.
     *
     * @throws IllegalArgumentException if the size is negative or too large
     *         for the native size_t type
     *
     * @throws OutOfMemoryError if the allocation is refused by the system
     *
     * @seeallocateMemory
     */
    public native long reallocateMemory(long address, long bytes);
    /**
     * Sets all bytes in a given block of memory to a fixed value
     * (usually zero).
     *
     * <p>This method determines a block's base address by means of two parameters,
     * and so it provides (in effect) a <em>double-register</em> addressing mode,
     * as discussed in {@linkgetInt(Object,long)}.  When the object reference is null,
     * the offset supplies an absolute base address.
     *
     * <p>The stores are in coherent (atomic) units of a size determined
     * by the address and length parameters.  If the effective address and
     * length are all even modulo 8, the stores take place in 'long' units.
     * If the effective address and length are (resp.) even modulo 4 or 2,
     * the stores take place in units of 'int' or 'short'.
     *
     * @since 1.7
     */
    public native void setMemory(Object o, long offset, long bytes, byte value);
    /**
     * Sets all bytes in a given block of memory to a fixed value
     * (usually zero).  This provides a <em>single-register</em> addressing mode,
     * as discussed in {@linkgetInt(Object,long)}.
     *
     * <p>Equivalent to <code>setMemory(null, address, bytes, value)</code>.
     */
    public void setMemory(long address, long bytes, byte value) {
        setMemory(null, address, bytes, value);
    }
    /**
     * Sets all bytes in a given block of memory to a copy of another
     * block.
     *
     * <p>This method determines each block's base address by means of two parameters,
     * and so it provides (in effect) a <em>double-register</em> addressing mode,
     * as discussed in {@linkgetInt(Object,long)}.  When the object reference is null,
     * the offset supplies an absolute base address.
     *
     * <p>The transfers are in coherent (atomic) units of a size determined
     * by the address and length parameters.  If the effective addresses and
     * length are all even modulo 8, the transfer takes place in 'long' units.
     * If the effective addresses and length are (resp.) even modulo 4 or 2,
     * the transfer takes place in units of 'int' or 'short'.
     *
     * @since 1.7
     */
    public native void copyMemory(Object srcBase, long srcOffset,
                                  Object destBase, long destOffset,
                                  long bytes);
    /**
     * Sets all bytes in a given block of memory to a copy of another
     * block.  This provides a <em>single-register</em> addressing mode,
     * as discussed in {@linkgetInt(Object,long)}.
     *
     * Equivalent to <code>copyMemory(null, srcAddress, null, destAddress, bytes)</code>.
     */
    public void copyMemory(long srcAddress, long destAddress, long bytes) {
        copyMemory(null, srcAddress, null, destAddress, bytes);
    }
    /**
     * Disposes of a block of native memory, as obtained from {@link
     *allocateMemory} or {@linkreallocateMemory}.  The address passed to
     * this method may be null, in which case no action is taken.
     *
     * @seeallocateMemory
     */
    public native void freeMemory(long address);
    /// random queries
    /**
     * This constant differs from all results that will ever be returned from
     * {@linkstaticFieldOffset}, {@linkobjectFieldOffset},
     * or {@linkarrayBaseOffset}.
     */
    public static final int INVALID_FIELD_OFFSET   = -1;
    /**
     * Returns the offset of a field, truncated to 32 bits.
     * This method is implemented as follows:
     * <blockquote><pre>
     * public int fieldOffset(Field f) {
     *     if (Modifier.isStatic(f.getModifiers()))
     *         return (int) staticFieldOffset(f);
     *     else
     *         return (int) objectFieldOffset(f);
     * }
     * </pre></blockquote>
     * @deprecated As of 1.4.1, use {@linkstaticFieldOffset} for static
     * fields and {@linkobjectFieldOffset} for non-static fields.
     */
    @Deprecated
    public int fieldOffset(Field f) {
        if (Modifier.isStatic(f.getModifiers()))
            return (int) staticFieldOffset(f);
        else
            return (int) objectFieldOffset(f);
    }
    /**
     * Returns the base address for accessing some static field
     * in the given class.  This method is implemented as follows:
     * <blockquote><pre>
     * public Object staticFieldBase(Class c) {
     *     Field[] fields = c.getDeclaredFields();
     *     for (int i = 0; i < fields.length; i++) {
     *         if (Modifier.isStatic(fields[i].getModifiers())) {
     *             return staticFieldBase(fields[i]);
     *         }
     *     }
     *     return null;
     * }
     * </pre></blockquote>
     * @deprecated As of 1.4.1, use {@linkstaticFieldBase(Field)}
     * to obtain the base pertaining to a specific {@link Field}.
     * This method works only for JVMs which store all statics
     * for a given class in one place.
     */
    @Deprecated
    public Object staticFieldBase(Class<?> c) {
        Field[] fields = c.getDeclaredFields();
        for (int i = 0; i < fields.length; i++) {
            if (Modifier.isStatic(fields[i].getModifiers())) {
                return staticFieldBase(fields[i]);
            }
        }
        return null;
    }
    /**
     * Report the location of a given field in the storage allocation of its
     * class.  Do not expect to perform any sort of arithmetic on this offset;
     * it is just a cookie which is passed to the unsafe heap memory accessors.
     *
     * <p>Any given field will always have the same offset and base, and no
     * two distinct fields of the same class will ever have the same offset
     * and base.
     *
     * <p>As of 1.4.1, offsets for fields are represented as long values,
     * although the Sun JVM does not use the most significant 32 bits.
     * However, JVM implementations which store static fields at absolute
     * addresses can use long offsets and null base pointers to express
     * the field locations in a form usable by {@linkgetInt(Object,long)}.
     * Therefore, code which will be ported to such JVMs on 64-bit platforms
     * must preserve all bits of static field offsets.
     * @seegetInt(Object, long)
     */
    public native long staticFieldOffset(Field f);
    /**
     * Report the location of a given static field, in conjunction with {@link
     *staticFieldBase}.
     * <p>Do not expect to perform any sort of arithmetic on this offset;
     * it is just a cookie which is passed to the unsafe heap memory accessors.
     *
     * <p>Any given field will always have the same offset, and no two distinct
     * fields of the same class will ever have the same offset.
     *
     * <p>As of 1.4.1, offsets for fields are represented as long values,
     * although the Sun JVM does not use the most significant 32 bits.
     * It is hard to imagine a JVM technology which needs more than
     * a few bits to encode an offset within a non-array object,
     * However, for consistency with other methods in this class,
     * this method reports its result as a long value.
     * @seegetInt(Object, long)
     */
    public native long objectFieldOffset(Field f);
    /**
     * Report the location of a given static field, in conjunction with {@link
     *staticFieldOffset}.
     * <p>Fetch the base "Object", if any, with which static fields of the
     * given class can be accessed via methods like {@linkgetInt(Object,
     * long)}.  This value may be null.  This value may refer to an object
     * which is a "cookie", not guaranteed to be a real Object, and it should
     * not be used in any way except as argument to the get and put routines in
     * this class.
     */
    public native Object staticFieldBase(Field f);
    /**
     * Detect if the given class may need to be initialized. This is often
     * needed in conjunction with obtaining the static field base of a
     * class.
     * @return false only if a call to {@code ensureClassInitialized} would have no effect
     */
    public native boolean shouldBeInitialized(Class<?> c);
    /**
     * Ensure the given class has been initialized. This is often
     * needed in conjunction with obtaining the static field base of a
     * class.
     */
    public native void ensureClassInitialized(Class<?> c);
    /**
     * Report the offset of the first element in the storage allocation of a
     * given array class.  If {@linkarrayIndexScale} returns a non-zero value
     * for the same class, you may use that scale factor, together with this
     * base offset, to form new offsets to access elements of arrays of the
     * given class.
     *
     * @seegetInt(Object, long)
     * @seeputInt(Object, long, int)
     */
    public native int arrayBaseOffset(Class<?> arrayClass);
    /** The value of {@code arrayBaseOffset(boolean[].class)} */
    public static final int ARRAY_BOOLEAN_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(boolean[].class);
    /** The value of {@code arrayBaseOffset(byte[].class)} */
    public static final int ARRAY_BYTE_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(byte[].class);
    /** The value of {@code arrayBaseOffset(short[].class)} */
    public static final int ARRAY_SHORT_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(short[].class);
    /** The value of {@code arrayBaseOffset(char[].class)} */
    public static final int ARRAY_CHAR_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(char[].class);
    /** The value of {@code arrayBaseOffset(int[].class)} */
    public static final int ARRAY_INT_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(int[].class);
    /** The value of {@code arrayBaseOffset(long[].class)} */
    public static final int ARRAY_LONG_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(long[].class);
    /** The value of {@code arrayBaseOffset(float[].class)} */
    public static final int ARRAY_FLOAT_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(float[].class);
    /** The value of {@code arrayBaseOffset(double[].class)} */
    public static final int ARRAY_DOUBLE_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(double[].class);
    /** The value of {@code arrayBaseOffset(Object[].class)} */
    public static final int ARRAY_OBJECT_BASE_OFFSET
            = theUnsafe.arrayBaseOffset(Object[].class);
    /**
     * Report the scale factor for addressing elements in the storage
     * allocation of a given array class.  However, arrays of "narrow" types
     * will generally not work properly with accessors like {@link
     *getByte(Object, int)}, so the scale factor for such classes is reported
     * as zero.
     *
     * @seearrayBaseOffset
     * @seegetInt(Object, long)
     * @seeputInt(Object, long, int)
     */
    public native int arrayIndexScale(Class<?> arrayClass);
    /** The value of {@code arrayIndexScale(boolean[].class)} */
    public static final int ARRAY_BOOLEAN_INDEX_SCALE
            = theUnsafe.arrayIndexScale(boolean[].class);
    /** The value of {@code arrayIndexScale(byte[].class)} */
    public static final int ARRAY_BYTE_INDEX_SCALE
            = theUnsafe.arrayIndexScale(byte[].class);
    /** The value of {@code arrayIndexScale(short[].class)} */
    public static final int ARRAY_SHORT_INDEX_SCALE
            = theUnsafe.arrayIndexScale(short[].class);
    /** The value of {@code arrayIndexScale(char[].class)} */
    public static final int ARRAY_CHAR_INDEX_SCALE
            = theUnsafe.arrayIndexScale(char[].class);
    /** The value of {@code arrayIndexScale(int[].class)} */
    public static final int ARRAY_INT_INDEX_SCALE
            = theUnsafe.arrayIndexScale(int[].class);
    /** The value of {@code arrayIndexScale(long[].class)} */
    public static final int ARRAY_LONG_INDEX_SCALE
            = theUnsafe.arrayIndexScale(long[].class);
    /** The value of {@code arrayIndexScale(float[].class)} */
    public static final int ARRAY_FLOAT_INDEX_SCALE
            = theUnsafe.arrayIndexScale(float[].class);
    /** The value of {@code arrayIndexScale(double[].class)} */
    public static final int ARRAY_DOUBLE_INDEX_SCALE
            = theUnsafe.arrayIndexScale(double[].class);
    /** The value of {@code arrayIndexScale(Object[].class)} */
    public static final int ARRAY_OBJECT_INDEX_SCALE
            = theUnsafe.arrayIndexScale(Object[].class);
    /**
     * Report the size in bytes of a native pointer, as stored via {@link
     *putAddress}.  This value will be either 4 or 8.  Note that the sizes of
     * other primitive types (as stored in native memory blocks) is determined
     * fully by their information content.
     */
    public native int addressSize();
    /** The value of {@code addressSize()} */
    public static final int ADDRESS_SIZE = theUnsafe.addressSize();
    /**
     * Report the size in bytes of a native memory page (whatever that is).
     * This value will always be a power of two.
     */
    public native int pageSize();
    /// random trusted operations from JNI:
    /**
     * Tell the VM to define a class, without security checks.  By default, the
     * class loader and protection domain come from the caller's class.
     */
    public native Class<?> defineClass(String name, byte[] b, int off, int len,
                                       ClassLoader loader,
                                       ProtectionDomain protectionDomain);
    /**
     * Define a class but do not make it known to the class loader or system dictionary.
     * <p>
     * For each CP entry, the corresponding CP patch must either be null or have
     * the a format that matches its tag:
     * <ul>
     * <li>Integer, Long, Float, Double: the corresponding wrapper object type from java.lang
     * <li>Utf8: a string (must have suitable syntax if used as signature or name)
     * <li>Class: any java.lang.Class object
     * <li>String: any object (not just a java.lang.String)
     * <li>InterfaceMethodRef: (NYI) a method handle to invoke on that call site's arguments
     * </ul>
     * @params hostClass context for linkage, access control, protection domain, and class loader
     * @params data      bytes of a class file
     * @params cpPatches where non-null entries exist, they replace corresponding CP entries in data
     */
    public native Class<?> defineAnonymousClass(Class<?> hostClass, byte[] data, Object[] cpPatches);
    /** Allocate an instance but do not run any constructor.
        Initializes the class if it has not yet been. */
    public native Object allocateInstance(Class<?> cls)
        throws InstantiationException;
    /** Lock the object.  It must get unlocked via {@linkmonitorExit}. */
    @Deprecated
    public native void monitorEnter(Object o);
    /**
     * Unlock the object.  It must have been locked via {@link
     *monitorEnter}.
     */
    @Deprecated
    public native void monitorExit(Object o);
    /**
     * Tries to lock the object.  Returns true or false to indicate
     * whether the lock succeeded.  If it did, the object must be
     * unlocked via {@linkmonitorExit}.
     */
    @Deprecated
    public native boolean tryMonitorEnter(Object o);
    /** Throw the exception without telling the verifier. */
    public native void throwException(Throwable ee);
    /**
     * Atomically update Java variable to <tt>x</tt> if it is currently
     * holding <tt>expected</tt>.
     * @return <tt>true</tt> if successful
     */
    public final native boolean compareAndSwapObject(Object o, long offset,
                                                     Object expected,
                                                     Object x);
    /**
     * Atomically update Java variable to <tt>x</tt> if it is currently
     * holding <tt>expected</tt>.
     * @return <tt>true</tt> if successful
     */
    public final native boolean compareAndSwapInt(Object o, long offset,
                                                  int expected,
                                                  int x);
    /**
     * Atomically update Java variable to <tt>x</tt> if it is currently
     * holding <tt>expected</tt>.
     * @return <tt>true</tt> if successful
     */
    public final native boolean compareAndSwapLong(Object o, long offset,
                                                   long expected,
                                                   long x);
    /**
     * Fetches a reference value from a given Java variable, with volatile
     * load semantics. Otherwise identical to {@linkgetObject(Object, long)}
     */
    public native Object getObjectVolatile(Object o, long offset);
    /**
     * Stores a reference value into a given Java variable, with
     * volatile store semantics. Otherwise identical to {@linkputObject(Object, long, Object)}
     */
    public native void    putObjectVolatile(Object o, long offset, Object x);
    /** Volatile version of {@linkgetInt(Object, long)}  */
    public native int     getIntVolatile(Object o, long offset);
    /** Volatile version of {@linkputInt(Object, long, int)}  */
    public native void    putIntVolatile(Object o, long offset, int x);
    /** Volatile version of {@linkgetBoolean(Object, long)}  */
    public native boolean getBooleanVolatile(Object o, long offset);
    /** Volatile version of {@linkputBoolean(Object, long, boolean)}  */
    public native void    putBooleanVolatile(Object o, long offset, boolean x);
    /** Volatile version of {@linkgetByte(Object, long)}  */
    public native byte    getByteVolatile(Object o, long offset);
    /** Volatile version of {@linkputByte(Object, long, byte)}  */
    public native void    putByteVolatile(Object o, long offset, byte x);
    /** Volatile version of {@linkgetShort(Object, long)}  */
    public native short   getShortVolatile(Object o, long offset);
    /** Volatile version of {@linkputShort(Object, long, short)}  */
    public native void    putShortVolatile(Object o, long offset, short x);
    /** Volatile version of {@linkgetChar(Object, long)}  */
    public native char    getCharVolatile(Object o, long offset);
    /** Volatile version of {@linkputChar(Object, long, char)}  */
    public native void    putCharVolatile(Object o, long offset, char x);
    /** Volatile version of {@linkgetLong(Object, long)}  */
    public native long    getLongVolatile(Object o, long offset);
    /** Volatile version of {@linkputLong(Object, long, long)}  */
    public native void    putLongVolatile(Object o, long offset, long x);
    /** Volatile version of {@linkgetFloat(Object, long)}  */
    public native float   getFloatVolatile(Object o, long offset);
    /** Volatile version of {@linkputFloat(Object, long, float)}  */
    public native void    putFloatVolatile(Object o, long offset, float x);
    /** Volatile version of {@linkgetDouble(Object, long)}  */
    public native double  getDoubleVolatile(Object o, long offset);
    /** Volatile version of {@linkputDouble(Object, long, double)}  */
    public native void    putDoubleVolatile(Object o, long offset, double x);
    /**
     * Version of {@linkputObjectVolatile(Object, long, Object)}
     * that does not guarantee immediate visibility of the store to
     * other threads. This method is generally only useful if the
     * underlying field is a Java volatile (or if an array cell, one
     * that is otherwise only accessed using volatile accesses).
     */
    public native void    putOrderedObject(Object o, long offset, Object x);
    /** Ordered/Lazy version of {@linkputIntVolatile(Object, long, int)}  */
    public native void    putOrderedInt(Object o, long offset, int x);
    /** Ordered/Lazy version of {@linkputLongVolatile(Object, long, long)} */
    public native void    putOrderedLong(Object o, long offset, long x);
    /**
     * Unblock the given thread blocked on <tt>park</tt>, or, if it is
     * not blocked, cause the subsequent call to <tt>park</tt> not to
     * block.  Note: this operation is "unsafe" solely because the
     * caller must somehow ensure that the thread has not been
     * destroyed. Nothing special is usually required to ensure this
     * when called from Java (in which there will ordinarily be a live
     * reference to the thread) but this is not nearly-automatically
     * so when calling from native code.
     * @param thread the thread to unpark.
     *
     */
    public native void unpark(Object thread);
    /**
     * Block current thread, returning when a balancing
     * <tt>unpark</tt> occurs, or a balancing <tt>unpark</tt> has
     * already occurred, or the thread is interrupted, or, if not
     * absolute and time is not zero, the given time nanoseconds have
     * elapsed, or if absolute, the given deadline in milliseconds
     * since Epoch has passed, or spuriously (i.e., returning for no
     * "reason"). Note: This operation is in the Unsafe class only
     * because <tt>unpark</tt> is, so it would be strange to place it
     * elsewhere.
     */
    public native void park(boolean isAbsolute, long time);
    /**
     * Gets the load average in the system run queue assigned
     * to the available processors averaged over various periods of time.
     * This method retrieves the given <tt>nelem</tt> samples and
     * assigns to the elements of the given <tt>loadavg</tt> array.
     * The system imposes a maximum of 3 samples, representing
     * averages over the last 1,  5,  and  15 minutes, respectively.
     *
     * @params loadavg an array of double of size nelems
     * @params nelems the number of samples to be retrieved and
     *         must be 1 to 3.
     *
     * @return the number of samples actually retrieved; or -1
     *         if the load average is unobtainable.
     */
    public native int getLoadAverage(double[] loadavg, int nelems);
    // The following contain CAS-based Java implementations used on
    // platforms not supporting native instructions
    /**
     * Atomically adds the given value to the current value of a field
     * or array element within the given object <code>o</code>
     * at the given <code>offset</code>.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param delta the value to add
     * @return the previous value
     * @since 1.8
     */
    public final int getAndAddInt(Object o, long offset, int delta) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!compareAndSwapInt(o, offset, v, v + delta));
        return v;
    }
    /**
     * Atomically adds the given value to the current value of a field
     * or array element within the given object <code>o</code>
     * at the given <code>offset</code>.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param delta the value to add
     * @return the previous value
     * @since 1.8
     */
    public final long getAndAddLong(Object o, long offset, long delta) {
        long v;
        do {
            v = getLongVolatile(o, offset);
        } while (!compareAndSwapLong(o, offset, v, v + delta));
        return v;
    }
    /**
     * Atomically exchanges the given value with the current value of
     * a field or array element within the given object <code>o</code>
     * at the given <code>offset</code>.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param newValue new value
     * @return the previous value
     * @since 1.8
     */
    public final int getAndSetInt(Object o, long offset, int newValue) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!compareAndSwapInt(o, offset, v, newValue));
        return v;
    }
    /**
     * Atomically exchanges the given value with the current value of
     * a field or array element within the given object <code>o</code>
     * at the given <code>offset</code>.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param newValue new value
     * @return the previous value
     * @since 1.8
     */
    public final long getAndSetLong(Object o, long offset, long newValue) {
        long v;
        do {
            v = getLongVolatile(o, offset);
        } while (!compareAndSwapLong(o, offset, v, newValue));
        return v;
    }
    /**
     * Atomically exchanges the given reference value with the current
     * reference value of a field or array element within the given
     * object <code>o</code> at the given <code>offset</code>.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param newValue new value
     * @return the previous value
     * @since 1.8
     */
    public final Object getAndSetObject(Object o, long offset, Object newValue) {
        Object v;
        do {
            v = getObjectVolatile(o, offset);
        } while (!compareAndSwapObject(o, offset, v, newValue));
        return v;
    }
    /**
     * Ensures lack of reordering of loads before the fence
     * with loads or stores after the fence.
     * @since 1.8
     */
    public native void loadFence();
    /**
     * Ensures lack of reordering of stores before the fence
     * with loads or stores after the fence.
     * @since 1.8
     */
    public native void storeFence();
    /**
     * Ensures lack of reordering of loads or stores before the fence
     * with loads or stores after the fence.
     * @since 1.8
     */
    public native void fullFence();
    /**
     * Throws IllegalAccessError; for use by the VM.
     * @since 1.8
     */
    private static void throwIllegalAccessError() {
       throw new IllegalAccessError();
    }
}
```
