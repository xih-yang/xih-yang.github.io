# 17、Java并发编程 - volatile 详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/17.html
- 分类：Java并发
- 分组：教程目录
## 17、volatile

**volatile是不错的机制，但是也不能保证原子性。**

### 17.1. volatile 可见性

> 代码验证可见性

```java
package com.interview.concurrent.volatiles;
import java.util.concurrent.TimeUnit;
/**
 *  @description:测试volatile的可见性
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/26 17:54
 */
public class VolatileVisibility {
    // volatile 读取的时候去主内存中读取在最新值！
    private volatile static int num = 0;
    public static void main(String[] args) throws InterruptedException {
      // Main线程
        new Thread(()->{
            /**
             *  @description:
             *  由于num添加了volatile,所以线程每次读取都会去主内存中读取
             *  @author DDKK.COM 弟弟快看，程序员编程资料站
             *  @date 2023/2/26 17:54
             */
            while (num==0){
            }
        }).start();
        TimeUnit.SECONDS.sleep(1);
        num = 1;
        System.out.println(num);
    }
}
```

### 17.2. volatile 不保证原子性

> 验证 volatile 不保证原子性

#### 17.2.1. volatile 不保证原子性的原因分析

原子性：ACID 不可分割！完整，要么同时失败，要么同时成功！

```java
package com.interview.concurrent.volatiles;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:验证volatile的原子性
 * @date 2023/2/26 17:55
 */
public class VolatileAcid {
    private volatile static  int num = 0;
    public static void main(String[] args) {
        for (int i = 1; i <= 20; i++) {
            new Thread(()->{
                for (int j = 1; j <= 1000; j++) {
                    add();  // 20 * 1000 = 20000
                }
            },String.valueOf(i)).start();
        }
        // main线程等待上面执行完成，判断线程存活数   2
        while (Thread.activeCount()>2){
      // main  gc
            //线程放弃当前分得的 CPU 时间，但是不使线程阻塞
            Thread.yield();
        }
        System.out.println(Thread.currentThread().getName()+" "+num);
    }
    public static void  add(){
        num++;
    }
}
```

运行效果如下:

运行效果并不是我们预期中的20000，这是什么原因呢？

因为numm++ 不是原子操作，而volatile也不保证原子性操作。

分析VolatileAcid类在堆中运行的字节码

使用命令查看类运行的字节码

```java
javap -c xxx.class
```

num++被拆分成三部分，在这三者之间又会有其他进程进来读取原始值，做加1操作。怎么解决呢？看下文分解

#### 17.2.2. volatile 不保证原子性解决方案

解决方案：

1、使用synchronized:前面已经说过；

2、使用原子性类工具java.util.concurrent.atomic

使用atomic解决原子性问题，示例代码如下：

```java
package com.interview.concurrent.volatiles;
import java.util.concurrent.atomic.AtomicInteger;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:使用atomic解决原子性
 * @date 2023/2/26 18:29
 */
public class AtomicIntegerAcid {
    private volatile static AtomicInteger num = new AtomicInteger();
    public static void  add(){
        num.getAndIncrement(); // 等价于 num++
    }
    public static void main(String[] args) {
        for (int i = 1; i <= 20; i++) {
            new Thread(()->{
                for (int j = 1; j <= 1000; j++) {
                    add();  // 20 * 1000 = 20000
                }
            },String.valueOf(i)).start();
        }
        // main线程等待上面执行完成，判断线程存活数   2
        while (Thread.activeCount()>2){
      // main  gc
            //线程放弃当前分得的 CPU 时间，但是不使线程阻塞
            Thread.yield();
        }
        System.out.println(Thread.currentThread().getName()+" "+num);
    }
}
```

### 17.3. volatile 禁止 指令重排讲解

#### 17.3.1. 什么是指令重排

计算机在执行程序之后，为了提高性能，编译器和处理器会进行指令重排！

处理在指令重排的时候必须要考虑**数据之间的依赖性！**

**指令重排：程序最终执行的代码，不一定是按照你写的顺序来的！**

```java
int x = 11;  // 语句1
int y = 12;  // 语句2
x = y + 5;   // 语句3
y = x*x ;    // 语句4
//怎么执行
1234
2134
1324
// 请问语句4 能在语句3前面执行吗？ 能
```

加深: int x,y,a,b = 0;

线程1
线程2

x = a;
y = b;

b = 1;
a = 2;

x = 0, y = 0

假设编译器进行了指令重排，就会出现如下效果！

线程1
线程2

b = 1;
a = 2;

x = a;
y =b；

x =2，y=1

```java
package com.interview.concurrent.volatiles;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：指令重排
 * 两个线程交替执行的！
 * @date 2023/2/26 18:38
 */
public class InstructionReset {
    public static void main(String[] args) {
        InstructionWare instructionWare = new InstructionWare();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                instructionWare.m1();
            }
        },"A").start();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                instructionWare.m2();
            }
        },"B").start();
    }
}
class InstructionWare{
    int a = 0;
    boolean flag = false;
    public void m1(){
       // A
        flag = true;   // 语句2
        a = 1;         // 语句1
    }
    public void m2(){
       // B
        if (flag){
            a = a + 5;  // 语句3
            System.out.println("m2=>"+a);
        }
    }
}
```

由于有指令重排的问题，语句3可能在语句1先执行，这样就导致最终结果a = 5而不是6！

**volatite： 能实现禁止指令重排！**

#### 17.3.2. volatile实现禁止指令重排原理：内存屏障。

volatile实现禁止指令重排原理：**内存屏障**。

**内存屏障**： 作用于CPU的指令，主要作用两个：

1、 保证特定的操作执行顺序；

2、保证某些变量的内存可见性。

**禁止指令重排，能保证线程的安全性**

语句1先执行，这样就导致最终结果a = 5而不是6！

**volatite： 能实现禁止指令重排！**
