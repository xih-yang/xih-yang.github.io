# 19、Java并发编程 - 深入理解CAS
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/19.html
- 分类：Java并发
- 分组：教程目录
## 19、深入理解CAS

### 19.1. CAS是什么

> CAS : CompareAndSwarp ,比较并交换

```java
package com.interview.concurrent.cas;
        import java.util.concurrent.atomic.AtomicInteger;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述： compareAndSet  简称 CAS 比较并交换！
 * compareAndSet(int expect, int update)
 * expect:我期望原来的值是什么，如果是，就更新为update
 * @date 2023/2/25 14:46
 */
public class AtomicIntegerDemo {
    public static void main(String[] args) {
        //参数，初始值设为5
        AtomicInteger atomicInteger = new AtomicInteger(5);
        System.out.println(atomicInteger.get()); //5
        // compareAndSet  简称 CAS 比较并交换！
        // compareAndSet(int expect, int update)  expect:我期望原来的值是什么，如果是，就更新为update
        System.out.println(atomicInteger.compareAndSet(5, 1000)); //true
        System.out.println(atomicInteger.compareAndSet(5, 1000));//false
        for (int i = 0; i < 10; i++) {
            atomicInteger.getAndIncrement();
            System.out.println(atomicInteger.get());
        }
    }
}
```

### 19.2. CAS 底层原理

#### 19.2.1. 分析过程

> CAS 底层原理？如果知道，谈谈你对UnSafe的理解？

`getAndIncrement` 分析这个+1是怎么实现的

```java
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}
```

Unsafe 是java出生就自带的

```java
 @HotSpotIntrinsicCandidate
    public final int getAndAddInt(Object o, long offset, int delta) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!weakCompareAndSetInt(o, offset, v, v + delta));
        return v;
    }
```

Unsafe 就是CAS 的核心类 ！

JAVA 无法直接操作系统的底层！ 而Unsafe 是Java留的后门，可直接操作特定内存中的数据， 方法都是 native 类型，里面的所有的所有方法 ，都可以像C的指针一样直接操作内存！

#### 19.2.2. CAS本质

> 最后解释CAS 是什么

CAS是一个 CPU的 并发原语！**它的功能就是判断内存中的某个位置的值是否是预期值，如果是更新为自己指定的新值。**这个操作是原子性的，内存级别的，而且是连续的。

**CAS彻底解决 数据不一致的问题！**

> cas 源码分析

Unsafe 类中的 compareAndSwapint，是一个本地方法，该方法的实现位于 unsafe.cpp 中。

具体见unsafe.cpp

```java
UNSAFE_ENTRY(jboolean, Unsafe_CompareAndSetInt(JNIEnv *env, jobject unsafe, jobject obj, jlong offset, jint e, jint x)) {
oop p = JNIHandles::resolve(obj);
//获取对象的变量的地址
jint* addr = (jint *)index_oop_from_field_offset_long(p, offset);
//调用Atomic操作
return (jint)(Atomic::cmpxchg(x, addr, e)) == e;
} UNSAFE_END
```

先去获取一次结果，如果结果和现在不同，就直接返回，因为有其他人修改了；否则会一直尝试去修改。直到成功。

> 总结

CAS: 比较当前工作内存中的值和主内存中的值，如果相同，则执行操作，否则就一直比较直到值一致为止!

如下示例：

```java
内存值A：   旧的预期值 B    ， 想修改为 V！
如果A和B相等，就修改为V，如果不相等，就一直比较。直到值相等为止。
```

### 19.3. CAS的缺点

**CAS的缺点：**

1） CPU开销过大

在并发量比较高的情况下，如果许多线程反复尝试更新某一个变量，却又一直更新不成功，循环往复，会给CPU带来很到的压力。

2） 不能保证代码块的原子性

CAS机制所保证的只是一个变量的原子性操作，而不能保证整个代码块的原子性。比如需要保证3个变量共同进行原子性的更新，就不得不使用synchronized了。

3） ABA问题

什么是ABA问题：狸猫换太子

这是CAS机制最大的问题所在。（后面有介绍）
