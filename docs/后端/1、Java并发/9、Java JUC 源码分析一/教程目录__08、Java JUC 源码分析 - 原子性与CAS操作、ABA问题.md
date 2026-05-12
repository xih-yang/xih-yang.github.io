# 08、Java JUC 源码分析 - 原子性与CAS操作、ABA问题
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/8.html
- 分类：Java并发
- 分组：教程目录
## 1、JAVA的原子性操作

什么是Java的原子性操作呢？可能很多人都会问。一般得到的回答肯定是这样的：执行一系列操作的时候，这些操作要么全部执行，要么全部不执行。不存在这些操作只执行一部分的情况。

如果你不太理解，我来举一个很简单的例子：你去超市买东西，付款和把东西拿到手，这两个操作要么同时成功，要么同时失败，不可能你把东西拿到手了，钱却没给。这不就是白P。

## 1.1简单例子

介绍了刚才的例子以后，我们来看一个JAVA代码的例子。假如现在你要做一个计数器，就是你点击一下，会+1的那种。转换成JAVA代码就是这样的：

```java
public class ThreadNotSafeCount {
    private Long value;
    public Long getValue(){
        return value;
    }
    public void add(){
        ++value;
    }
}
```

你会觉得这样做肯定具有原子性，因为add函数里面只有一个操作 **++value**，但是事实却恰恰相反，我们并不能保证++value这个操作的原子性，使用java -c命令查看汇编代码，看看到底是为什么吧，如下:

```java
 public void add();
     Code:
     0:aload_0
     1:dup
     2:getfield
     5:lconst_1
     6:ladd
     7:putfield
     10:return
```

由此可见，**++value**这个操作由上述2、5、6、7这四个步骤组成，其中第2步是获得当前的value值，然后把这个值放到栈顶。第5步是把常量1放到栈顶。第6步把当前栈顶的两个元素的值相加，然后得到的结果放到栈顶。第7步则是把栈顶的结果赋给value这个变量。你以为简简单单一个 **++value**操作，被转换成汇编后，就不在具有原子性。

**那么怎样才能保证一个操作的原子性呢？**，最简单的方法就是使用synchronize关键字。修改后的代码如下：

```java
public class ThreadNotSafeCount {
    private Long value;
    public synchronized Long getValue(){
        return value;
    }
    public synchronized void add(){
        ++value;
    }
}
```

使用synchronize关键字确实可以实现线程安全，即内存可见性以及原子性。但是synchronize是一个独占锁，也就是只能有一个线程拥有这把锁，也就说一次只能让一个线程执行这个方法。这样加了synchronize关键字后，却大大降低了并发性。那么有没有什么更好的办法呢？答案是肯定的。接下来的CAS就会讲到。

## 2、JAVA的CAS操作

那么什么是CAS操作呢？CAS,compare and swap的缩写，中文翻译成比较并交换。这样说，大家可能不理解，我来稍微解释一下。

就那刚才计数器的例子来讲。CAS就如上图，首先我们先拿到value的这个数值，把他存到某个地方也就是我们的复制版，然后+1得到了一个全新的value，当然那个value复制版，我没没有改变他的值。这个时候我们来比较复制版的Value和真正的Value是否相等（因为要考虑到我们在执行+1的这个过程中，是否有人把原来的Value修改了），如果相等说明没有被修改（严格意义上这里相等也不能说明value没有被修改，后面会讲ABA问题），把全新的Value更新原先的Value；不相等就说明被修改了，那么此次操作就算失败了。

如果使用了CAS操作，那么我们那个计数器的代码怎么写呢？

```java
public class ThreadNotSafeCount {
    private static Long value;
    public static Long getValue(){
        return value;
    }
    public void add(){
        Long expectValue;
        do {
            expectValue = getValue();
        } while (!compareAndSwap(expectValue, expectValue + 1));
    }
    /**
     * @param expectValue 期望count的值
     * @param newValue    需要给count赋的新值
     * @return
     */
    public static synchronized boolean compareAndSwap(Long expectValue, Long newValue) {
        //判断count当前值是否和期望的expectCount一样，如果一样将newCount赋值给count
        if (getValue() == expectValue) {
            value = newValue;
            return true;
        }
        return false;
    }
}
```

这个compareAndSwap方法使用synchronized修饰了，能保证此方法是线程安全的，多线程情况下此方法是串行执行的。方法由两个参数，expectValue：表示期望的值，newValue：表示要给Value设置的新值。方法内部通过getValue()获取Value当前的值，然后与期望的值expectValue比较，如果期望的值和Value当前的值一致，则将新值newValue赋值给Value。

再看一下add()方法，方法中有个do-while循环，循环内部获取Value当前值赋值给了expectValue，循环结束的条件是compareAndSwap返回true，也就是说如果compareAndSwap如果不成功，循环再次获取Value的最新值，然后+1，再次调用compareAndSwap方法，直到compareAndSwap返回成功为止。

代码中相当于将count++拆分开了，只对最后一步加锁了，减少了锁的范围，此代码的性能是不是比直接使用synchronize快不少，还能保证结果的正确性。大家是不是感觉这个compareAndSwap方法挺好的，这东西确实很好，java中已经给我们提供了CAS的操作，而且功能非常强大。

> 很多地方说CAS操作是非阻塞的，其实系统底层进行CAS操作的时候，会判断当前系统是否为多核系统，如果是就给总线加锁，所以同一芯片上的其他处理器就暂时不能通过总线访问内存，保证了该指令在多处理器环境下的原子性。总线上锁的，其他线程执行CAS还是会被阻塞一下，只是时间可能会非常短暂，所以说CAS是非阻塞的并不正确，只能说阻塞的时间是非常短的。

## 3、JAVA的CAS操作中的ABA问题

关于CAS操作有一个非常经典的问题，叫做ABA问题。接下来我们看一幅图：

ABA问题其实很容易理解。就那计数器的例子来讲。当我们要对Value进行操作的时候，要先拿到Value这个值，然后在操作一遍，但是最终得到的全新的Value和原来的Value一样。这样就是我们的ABA，A经过B操作后得到的还是A。那么这就会导致CAS有一个漏洞。判断全新Value和原来的Value相等，也不能确定原来的Value没有被修改。

那么怎么解决呢？JDK中的AtomicStampedReference这个类给我们每个变量的状态值都配备了一个时间戳，也就是每个变量在比较值相等的同时，也会比较时间戳，这样就避免了ABA问题的产生。

记得关注我哦！下一篇文章会讲Unsafe类，有兴趣的可以期待一下哦。
