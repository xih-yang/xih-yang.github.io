# 20、Java并发编程 - 原子引用AtomicReference与AtomicStampedReferenc
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/20.html
- 分类：Java并发
- 分组：教程目录
## 20、原子引用：AtomicReference

> 原子类 AtomicInteger 的ABA问题谈谈？原子更新引用知道吗？

CAS会导致 ABA的问题！

CAS算法的前提是：取出内存中某个时刻的数据，比较并交换！ 在这个时间差内有可能数据被修改！

如下示例：

```java
package com.interview.concurrent.cas;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:CAS带来的ABA问题
 * @date 2023/2/25 17:10
 */
public class CasAbaQuestionDemo {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger atomicInteger = new AtomicInteger(5);
        /**
         *  @description:A线程已经将5修改为其他数
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:23
         */
        new Thread(() -> {
            atomicInteger.compareAndSet(5,200);
        },"A").start();
        /**
         *  @description:C线程是小偷，偷偷的改动数据，然后又改回原来的5
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:23
         */
        new Thread(() -> {
            atomicInteger.compareAndSet(200,210);
            atomicInteger.compareAndSet(210,5);
        },"C").start();
        /**
         *  @description:B线程希望将5修改为1024，
         *  按照原理，期望值已经被A修改为200，B线程应该要修改失败，
         *  但是出现了小偷C线程，它将期望值又改成了5，导致B线程能成功的修改，还发现不了C的存在
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:21
         */
        new Thread(() -> {
            atomicInteger.compareAndSet(5,1024);
        },"B").start();
        //确保上面的三个线程都执行完
        TimeUnit.SECONDS.sleep(5);
        System.out.println(atomicInteger.get());  //1024
    }
}
```

**尽管CAS操作成功！但是不代表这个过程就是没有问题的！**

解决此问题，我们可以使用乐观锁（添加版本号）来解决，我们还可以通过带时间戳的原子引用来解决！接下来针对原子引用进行讲解。

> 原子引用 AtomicReference:

> 带有版本号、时间戳的原子引用，类似乐观锁！

如下示例：

```java
package com.interview.concurrent.cas;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicStampedReference;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 *  AtomicReference 原子引用
 *  AtomicStampedReference 加了时间戳  类似于乐观锁！ 通过版本号
 * @date 2023/2/25 17:43
 */
public class CasAbaAtomicStampedReference {
    public static void main(String[] args) throws InterruptedException {
        AtomicStampedReference<Integer> atomicStampedReference = new AtomicStampedReference<>(5, 1);
        /**
         *  @description:A线程已经将5修改为其他数
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:23
         */
        new Thread(() -> {
            //获得版本号
            System.out.println("A stamp 01=>"+atomicStampedReference.getStamp());
            atomicStampedReference.compareAndSet(5,200,atomicStampedReference.getStamp(),atomicStampedReference.getStamp() + 1);
        },"A").start();
        /**
         *  @description:C线程是小偷，偷偷的改动数据，然后又改回原来的5
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:23
         */
        new Thread(() -> {
            // 保证上面的线程先执行完毕！
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            //获得版本号
            System.out.println("C stamp 01=>"+atomicStampedReference.getStamp());
            atomicStampedReference.compareAndSet(200,210,atomicStampedReference.getStamp(),atomicStampedReference.getStamp() + 1);
            System.out.println("C stamp 02=>"+atomicStampedReference.getStamp());
            atomicStampedReference.compareAndSet(210,5,atomicStampedReference.getStamp(),atomicStampedReference.getStamp() + 1);
            System.out.println("C stamp 03=>"+atomicStampedReference.getStamp());
        },"C").start();
        /**
         *  @description:B线程希望将5修改为1024，
         *  期望值已经被A修改为200，由于添加了时间戳，B线程修改失败
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 17:21
         */
        new Thread(() -> {
            // 保证上面的线程先执行完毕！
            try {
                TimeUnit.SECONDS.sleep(7);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            //获得版本号
            System.out.println("B stamp 01=>"+atomicStampedReference.getStamp());
            boolean isSuccess = atomicStampedReference.compareAndSet(5, 1024, atomicStampedReference.getStamp(), atomicStampedReference.getStamp() + 1);
            System.out.println("线程B执行成功了吗？" + isSuccess);
            System.out.println("B 最新的stamp："+atomicStampedReference.getStamp());
            System.out.println("B 当前的最新值："+atomicStampedReference.getReference());
        },"B").start();
    }
}
```

线程B将修改失败，运行效果如下：

解决ABA 问题： AtomicStampedReference
