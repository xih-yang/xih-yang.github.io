# 02、Java并发编程 - 基础（临界资源、线程安全、JAVA内存模型、volatile关键字）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/2.html
- 分类：Java并发
- 分组：教程目录
## 一、临界资源

临界资源是一次仅允许一个进程使用的共享资源。各进程采取互斥的方式，实现共享的资源称作临界资源。属于临界资源的硬件有，打印机，磁带机等；软件有消息队列，变量，数组，缓冲区等。诸进程间采取互斥方式，实现对这种资源的共享。

```java
public class Counter {
	protected long count = 0;
	public void add(long value){
		this.count = this.count + value;
	}
}
```

## 二、线程安全

## 2.1 基本概念

**何谓竞态条件**

当两个线程竞争同一资源时，如果对资源的访问顺序敏感，就称存在竞态条件。

导致竞态条件发生的代码区称作临界区。

在临界区中使用适当的同步就可以避免竞态条件，如使用synchronized或者加锁机制。

**何谓线程安全**

允许被多个线程同时执行的代码称作线程安全的代码。线程安全的代码不包含竞态条件。

## 2.2 对象的安全

### 局部基本类型变量

局部变量存储在线程自己的栈中。也就是说，局部变量永远也不会被多个线程共享。所以，基础类型的局部变量是线程安全的。下面是基础类型的局部变量的一个例子：

```java
public class ThreadTest {
	public static void main(String[]args){
		MyThread share = new MyThread();
		for (int i=0;i<50;i++){
			new Thread(share,"线程"+i).start();
		}
	}
}
class MyThread implements Runnable{
	public void run() {
		int a=0;
		++a;
		System.out.println(Thread.currentThread().getName()+":"+a);
	}
}
```

无论多少个线程对run()方法中的基本类型a执行++a操作，只是更新当前线程栈的值，不会影响其他线程，也就是不共享数据；

### 局部的对象引用

对象的局部引用和基础类型的局部变量不太一样，`尽管引用本身没有被共享，但引用所指的对象并没有存储在线程的栈内。所有的对象都存在共享堆中。`

如果在某个方法中创建的对象不会逃逸出（即该对象不会被其它方法获得，也不会被非局部变量引用到）该方法，那么它就是线程安全的。

实际上，哪怕将这个对象作为参数传给其它方法，只要别的线程获取不到这个对象，那它仍是线程安全的。

```java
public void method1(){
	LocalObject localObject = new LocalObject();
	localObject.callMethod();
	method2(localObject);
}
public void method2(LocalObject localObject){
	localObject.setValue("value");
}
```

### 对象成员(成员变量)

对象成员存储在堆上。如果两个线程同时更新同一个对象的同一个成员，那这个代码就不是线程安全的。

```java
public class ThreadTest {
	public static void main(String[]args){
		NotThreadSafe sharedInstance = new NotThreadSafe();
		new Thread(new MyRunnable(sharedInstance)).start();
		new Thread(new MyRunnable(sharedInstance)).start();
	}
}
class MyRunnable implements Runnable{
	NotThreadSafe instance = null;
	public MyRunnable(NotThreadSafe instance){
		this.instance = instance;
	}
	public void run(){
		this.instance.add(" "+Thread.currentThread().getName());
		System.out.println(this.instance.builder.toString());
	}
}
class NotThreadSafe{
	StringBuilder builder = new StringBuilder();
	public void add(String text){
		this.builder.append(text);
	}
}
```

如果两个线程同时调用同一个NotThreadSafe实例上的add()方法，就会有竞态条件问题。

多次执行，发现结果是不确定的：

即变量对线程的访问顺序是敏感的，有临界资源，产生了竞态条件

## 2.3 不可变性

通过创建不可变的共享对象来保证对象在线程间共享时不会被修改，从而实现线程安全。如下示例：

```java
public class ImmutableValue{
	private int value = 0;
	public ImmutableValue(int value){
		this.value = value;
	}
	public int getValue(){
		return this.value;
	}
}
```

请注意ImmutableValue类的成员变量 value 是通过构造函数赋值的，并且在类中没有set方法。这意味着一旦ImmutableValue实例被创建， value 变量就不能再被修改，这就是不可变性。但你可以通过getValue()方法读取这个变量的值。

## 三、Java内存模型

Java内存模型即Java Memory Model，简称JMM。JMM定义了Java 虚拟机(JVM)在计算机内存(RAM)中的工作方式。JVM是整个计算机虚拟模型，所以JMM是隶属于JVM的。

## 3.1 线程之间的通信

线程的通信是指线程之间以何种机制来交换信息。在命令式编程中，线程之间的通信机制有两种`共享内存`和`消息传递`。

在共享内存的并发模型里，线程之间共享程序的公共状态，线程之间通过写-读内存中的公共状态来隐式进行通信，典型的共享内存通信方式就是通过共享对象进行通信。

在消息传递的并发模型里，线程之间没有公共状态，线程之间必须通过明确的发送消息来显式进行通信，在java中典型的消息传递方式就是wait()和notify()。

## 3.2 线程之间的同步

同步是指程序用于控制不同线程之间操作发生相对顺序的机制。

在共享内存并发模型里，同步是显式进行的。程序员必须显式指定某个方法或某段代码需要在线程之间互斥执行。

在消息传递的并发模型里，由于消息的发送必须在消息的接收之前，因此同步是隐式进行的。

Java的并发采用的是共享内存模型

Java线程之间的通信总是隐式进行，整个通信过程对程序员完全透明。如果编写多线程程序的Java程序员不理解隐式进行的线程之间通信的工作机制，很可能会遇到各种奇怪的内存可见性问题。

## 3.3 Java内存模型结构

Java内存模型(简称JMM)，JMM决定一个线程对共享变量的写入何时对另一个线程可见。从抽象的角度来看，JMM定义了线程和主内存之间的抽象关系：线程之间的共享变量存储在主内存（main memory）中，每个线程都有一个私有的本地内存（local memory），本地内存中存储了该线程以读/写共享变量的副本。本地内存是JMM的一个抽象概念，并不真实存在。它涵盖了缓存，写缓冲区，寄存器以及其他的硬件和编译器优化。

每个Java线程都有⾃⼰的**⼯作内存**。操作数据，⾸先从主内存中读，得到⼀份拷⻉，操作完毕后再写回到主内存。

由于JVM运⾏程序的实体是线程，⽽每个线程创建时JVM都会为其创建⼀个⼯作内存（有些地⽅称为栈空间），⼯作内存是每个线程的私有数据区域，⽽Java内存模型中规定所有变量都存储在主内存，主内存是共享内存区域，所有线程都可以访问，但线程对变量的操作（读取赋值等）必须在⼯作内存中进⾏，⾸先要将变量从主内存拷⻉到⾃⼰的⼯作内存空间，然后对变量进⾏操作，操作完成后再将变量写回主内存，不能直接操作主内存中的变量，各个线程中的⼯作内存中存储着主内存中的变量副本拷⻉，因此不同的线程间⽆法访问对⽅的⼯作内存，线程间的通信（传值）必须通过主内存来完成，期间要访问过程如下图：

从上图来看，线程A与线程B之间如要通信的话，必须要经历下面2个步骤：

**1、** 首先，线程A把本地内存A中更新过的共享变量刷新到主内存中去；

**2、** 然后，线程B到主内存中去读取线程A之前已更新过的共享变量；

JVM栈、堆里面的对象 在计算机内存里面的对应关系：

JVM中的栈 — 计算机中的寄存器

JVM中的堆 — 计算机中的内存

JMM可能带来**可⻅性**、**原⼦性**和**有序性**问题。

所谓可⻅性，就是某个线程对主内存内容的更改，应该⽴刻通知到其它线程。

所谓原⼦性，是指⼀个操作是不可分割的，不能执⾏到⼀半，就不执⾏了。

所谓有序性，就是指令是有序的，不会被重排。

## 四、volatile关键字

volatile 关键字是Java提供的⼀种**轻量级同步机制**。在多处理器环境下，可以保证共享变量的可见性。它不会引起线程上下文的切换和调度，正确的使用volatile，比synchronized的使用和执行成本更低。

- 它能够保证**可⻅性**和**有序性**
- 但是不能保证**原⼦性**
- 能够禁⽌指令重排

> 并发编程的三个问题：可见性、原子性、有序性

## 4.1 可见性

可见性，是指线程之间的可见性，一个线程修改的状态对另一个线程是可见的。也就是一个线程修改一个共享变量时，另一个线程马上就能看到。比如：用volatile修饰的变量，就会具有可见性。

volatile修饰的变量不允许线程内部缓存和重排序，即直接修改内存。所以对其他线程是可见的。但是这里需要注意一个问题，volatile只能让被他修饰内容具有可见性，但不能保证它具有原子性。比如 volatile int a = 0；之后有一个操作 a++；这个变量a具有可见性，但是a++ 依然是一个非原子操作，也就是这个操作同样存在线程安全问题。

在Java 中可以通过 volatile、synchronized 和 final 实现可见性。

### 案例演示可见性问题

```java
/**
 * volatile关键字是Java提供的一种轻量级同步机制。
 *
 * 它能够保证 可见性 和 有序性
 * 但是不能保证 原子性
 * 禁止指令重排(编辑器优化的重排、指定并行的重排、内存系统的重排)
 */
class MyData{
    int number = 0;
    //volatile int number = 0;
    public void setTo60(){
        this.number = 60;
    }
}
public class VolatileDemo {
    public static void main(String[] args) {
        volatileVisibilityDemo();
    }
    /**
     * 演示可见性操作
     */
    private static void volatileVisibilityDemo() {
        System.out.println("演示可见性操作");
        MyData myData = new MyData();//资源类
        //启动一个线程，操作共享数据
        new Thread(()->{
            System.out.println(Thread.currentThread().getName() +"执行了");
            try {
                TimeUnit.SECONDS.sleep(3);
                myData.setTo60();
                System.out.println(Thread.currentThread().getName()+"\t 更新number的值:" +myData.number);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        },"ThreadA").start();
        //main主线程
        while(myData.number == 0){
            //main线程持有共享数据的拷贝，一直为0
        }
        System.out.println(Thread.currentThread().getName()+"\t main线程获取number值： " + myData.number);
    }
}
```

MyData 类是资源类，⼀开始number变量没有⽤volatile修饰，所以程序运⾏的结果是：

虽然⼀个线程把number修改成了60，但是main线程持有的仍然是最开始的0，所以⼀直循环，程序不会结束。

如果对number添加了volatile修饰，运⾏结果是：

可⻅某个线程对number的修改，会⽴刻反映到主内存上。

[关于可见性大家还有误区的问题 Thread.sleep对其的影响讨论](https://bbs.csdn.net/topics/396428958)

### happens-before原则

这里简单描述一下可见性的底层原理：happens-before

JSR-133 内存模型使用 happens-before 的概念来阐述操作之间的内存可见性。在 JMM 中，如果一个操作执行的结果需要对另一个操作可见，那么这两个操作之间必须要存在 happens-before 关系。这里提到的两个操作既可以是在一个线程之内，也可以是在不同线程之间。

与程序员密切相关的 happens-before 规则如下：

- 程序顺序规则：一个线程中的每个操作，happens-before 于该线程中的任意后续操作。
- 监视器锁规则：对一个监视器的解锁，happens-before 于随后对这个监视器的加锁。
- volatile 变量规则：对一个 volatile 域的写，happens-before 于任意后续对这个 volatile 域的读。
- 传递性：如果 A happens-before B，且 B happens-before C，那么 A happens-before C。

注意，两个操作之间具有 happens-before 关系，并不意味着前一个操作必须要在后一个操作之前执行！happens-before 仅仅要求前一个操作（执行的结果）对后一个操作可见，且前一个操作按顺序排在第二个操作之前（the first is visible to and ordered before the second）。

happens-before 与 JMM 的关系如下图所示：

如上图所示，一个 happens-before 规则对应于一个或多个编译器和处理器重排序规则。

更多详细内容可以参考：[《深入理解 Java 内存模型》读书笔记](http://www.54tianzhisheng.cn/2018/02/28/Java-Memory-Model/)

## 4.2 原子性

原⼦性指的是什么意思？

不可分割，完整性，即某个线程正则做某个具体业务时，中间不可以被加塞或者被分割。需要整体完整，要么同时成功，要么同时失败。

原子是世界上的最小单位，具有不可分割性。比如 a=0；（a非long和double类型） 这个操作是不可分割的，那么我们说这个操作是原子操作。再比如：a++； 这个操作实际是a = a + 1；是可分割的，所以他不是一个原子操作。非原子操作都会存在线程安全问题，需要我们使用同步技术（sychronized）来让它变成一个原子操作。一个操作是原子操作，那么我们称它具有原子性。java的concurrent包下提供了一些原子类，我们可以通过阅读API来了解这些原子类的用法。比如：AtomicInteger、AtomicLong、AtomicReference等。

在Java 中 可以通过 synchronized 和在 lock、unlock 中操作保证原子性。

### 案例演示原子性问题

```java
/**
 * volatile关键字是Java提供的一种轻量级同步机制。
 *
 * 它能够保证 可见性 和 有序性
 * 但是不能保证 原子性
 * 禁止指令重排(编辑器优化的重排、指定并行的重排、内存系统的重排)
 */
class MyData{
    volatile int number = 0;
	//此时number前⾯已经加了volatile，但是不保证原⼦性
    public void addPlusPlus(){
        number++;
    }
}
public class VolatileDemo {
    public static void main(String[] args) {
        atomicDemo();
    }
    /**
     * 原子性操作
     */
    private static void atomicDemo() {
        System.out.println("原子性测试");
        MyData myData = new MyData();
        //创建20个线程
        for (int i = 0; i <20; i++) {
            new Thread(()->{
                //让每个线程对变量number ++ ，1000遍
                for (int j = 0; j < 1000; j++) {
                    myData.addPlusPlus();
                }
            },String.valueOf(i)).start();
        }
        while(Thread.activeCount() > 2){
      //main, gc
            Thread.yield();//线程礼让
        }
        System.out.println(Thread.currentThread().getName() + "\t int类型的number最终值：" + myData.number);
    }
}
```

可以看到 `volatile 并不能保证操作的原⼦性`。这是因为，number++的操作，会形成3条指令。通过javap -c 查看字节码文件：

```java
javap -c 包名.类名
```

找到对应的addPlusPlus方法：

```java
javap -c MyData
public void addPlusPlus();
	Code:
		0: aload_0
		1: dup
		2: getfield2 // Field number:I //从主内存中读取变量入栈，放入局部变量表
		5: iconst_1                      //常量1入栈，放入局部变量表
		6: iadd                          //进行相加操作
		7: putfield2 // Field number:I //将结果刷新到主内存
		10: return
```

假设有3个线程，分别执⾏number++，都先从主内存中拿到最开始的值，number=0，然后三个线程分别进⾏操作。假设线程0执⾏完毕，number=1，也⽴刻通知到了其它线程，但是此时线程1、2已经拿到了number=0，所以结果就是写覆盖，线程1、2也将number变成1。

### 解决方案

上面到演示中，我们发现volatile关键字并不能解决原子性问题，我们可以通过如下两个方案保证原子性：

**1. 对 addPlusPlus() ⽅法加锁，限制变量number同一时刻只允许一个线程访问。比如用synchronized：**

```java
public synchronized void addPlusPlus(){
    number++;
}
```

**2. 使⽤ java.util.concurrent.AtomicInteger 原子类。**

```java
/**
 * volatile关键字是Java提供的一种轻量级同步机制。
 *
 * 它能够保证 可见性 和 有序性
 * 但是不能保证 原子性
 * 禁止指令重排(编辑器优化的重排、指定并行的重排、内存系统的重排)
 */
class MyData{
    //int number = 0;
    volatile int number = 0;
    AtomicInteger atomicInteger = new AtomicInteger();
    public void addPlusPlus(){
        number++;
    }
    public void addAtomic(){
        atomicInteger.getAndIncrement();
    }
}
public class VolatileDemo {
    public static void main(String[] args) {
        atomicDemo();
    }
    /**
     * 原子性操作
     */
    private static void atomicDemo() {
        System.out.println("原子性测试");
        MyData myData = new MyData();
        //创建20个线程
        for (int i = 0; i <20; i++) {
            new Thread(()->{
                //让每个线程对变量number ++ ，1000遍
                for (int j = 0; j < 1000; j++) {
                    myData.addPlusPlus();
                    myData.addAtomic();
                }
            },String.valueOf(i)).start();
        }
        while(Thread.activeCount() > 2){
      //main, gc
            Thread.yield();
        }
        System.out.println(Thread.currentThread().getName() + "\t int类型的number最终值：" + myData.number);
        System.out.println(Thread.currentThread().getName() + "\t atomicInteger类型的最终值：" + myData.atomicInteger);
    }
}
```

结果：可⻅，由于 volatile 不能保证原⼦性，出现了线程重复写的问题，最终结果⽐20000⼩。⽽AtomicInteger 可以保证原⼦性。

## 4.3 有序性

### 指令重排序

计算机在执⾏程序时，为了提⾼性能，编译器和处理器（CPU）常常会对指令做重排，⼀般分以下三种：

编译器优化的重排：java编译器代码重排

指令并行的重排：CPU指令集重排

内存系统的重排：内存执行的时候重排

所谓指令重排序，就是出于优化考虑，CPU执⾏指令的顺序跟程序员⾃⼰编写的顺序不⼀致。就好⽐⼀份试卷，题号是⽼师规定的，是程序员规定的，但是考⽣（CPU）可以先做选择，也可以先做填空。

volatile可以保证有序性，也就是防⽌指令重排序。

- 重排序在单线程环境⾥⾯确保程序最终执⾏结果和代码顺序执⾏的结果⼀致；
- 处理器在进⾏重排序时必须要考虑指令之间的数据依赖性；
- 多线程环境中线程交替执⾏，由于编译器优化重排的存在，两个线程中使⽤的变量能否保证⼀致性是⽆法确定的，结果⽆法预测。

### 如何保证有序性

Java 语言提供了 volatile 和 synchronized 两个关键字来保证线程之间操作的有序性，volatile 是因为其本身包含“禁止指令重排序”的语义，synchronized 是由“一个变量在同一个时刻只允许一条线程对其进行 lock 操作”这条规则获得的，此规则决定了持有同一个对象锁的两个同步块只能串行执行。

Java语言提供了一种稍弱的同步机制，即volatile变量，用来确保将变量的更新操作通知到其他线程。当把变量声明为volatile类型后，编译器与运行时都会注意到这个变量是共享的，因此不会将该变量上的操作与其他内存操作一起重排序。volatile变量不会被缓存在寄存器或者对其他处理器不可见的地方，因此在读取volatile类型的变量时总会返回最新写入的值。

在访问volatile变量时不会执行加锁操作，因此也就不会使执行线程阻塞，因此volatile变量是一种比sychronized关键字更轻量级的同步机制。

当一个变量定义为 volatile 之后，将具备两种特性：

- 保证此变量对所有的线程的可见性，这里的“可见性”，如本文开头所述，当一个线程修改了这个变量的值，volatile 保证了新值能立即同步到主内存，以及每次使用前立即从主内存刷新。但普通变量做不到这点，普通变量的值在线程间传递均需要通过主内存来完成。
- 禁止指令重排序优化。有volatile修饰的变量，赋值后多执行了一个“load addl `$`0x0, (%esp)”操作，这个操作相当于一个内存屏障（指令重排序时不能把后面的指令重排序到内存屏障之前的位置），**只有一个CPU访问内存时，并不需要内存屏障**；（什么是指令重排序：是指CPU采用了允许将多条指令不按程序规定的顺序分开发送给各相应电路单元处理。）

### 案例演示有序性问题

观看下⾯代码，在多线程场景下，说出最终值a的结果是多少？ 1,5或者6

我们采⽤ volatile 可实现禁⽌指令重排优化，从⽽避免多线程环境下程序出现乱序执⾏的现象

```java
/**
 * volatile可以保证 有序性，也就是防止 指令重排序。
 *
 * 单线程环境里面确保程序最终执行结果和代码顺序执行的结果一致；
 * 处理器在进行重排序时必须要考虑指令之间的数据依赖性；
 * 多线程环境中线程交替执行，由于编译器优化重排的存在，两个线程中使用的变量能否保证一致性是无法确定的，结果无法预测。
 */
public class ResortSeqDemo {
    int a=0;
    boolean flag=false;
    /*
    多线程下由于flag=true和a=1没有依赖关系，所以可以进行重排序
    因此flag=true有可能先执行，还没走到a=1就被挂起。
    这时其它线程进入method02判断flag=true，修改a的值=5，而不是6。
     */
    public void method01(){
        a=1;
        flag=true;
    }
    public void method02(){
        if (flag){
            a+=5;
        	System.out.println("*****最终值a: "+a);
        }  
    }
    public static void main(String[] args) {
        ResortSeqDemo resortSeq = new ResortSeqDemo();
        new Thread(()->{
     resortSeq.method01();},"ThreadA").start();
        new Thread(()->{
     resortSeq.method02();},"ThreadB").start();
    }
}
```

> 出现问题概率很低，演示不出来。。。但是肯定会有隐患的。

### volatile 原理

我们先来了解⼀个概念，**内存屏障**（Memory Barrier）⼜称内存栅栏，是⼀个CPU指令，volatile底层就是⽤CPU的**内存屏障**（Memory Barrier）指令来实现的，它有两个作⽤

- ⼀个是保证特定操作的顺序性
- ⼆是保证变量的可⻅性。

由于编译器和处理器都能够执⾏指令重排优化。所以，如果在指令间插⼊⼀条Memory Barrier则会告诉编译器和CPU，不管什么指令都不能和这条Memory Barrier指令重排序，也就是说通过`插⼊内存屏障可以禁⽌在内存屏障前后的指令进⾏重排序优化`。内存屏障另外⼀个作⽤是`强制刷出各种CPU的缓存数据，因此任何CPU上的线程都能读到这些数据的最新版本`。

[《深入理解 Java 内存模型》读书笔记](http://www.54tianzhisheng.cn/2018/02/28/Java-Memory-Model/#%E5%86%85%E5%AD%98%E5%B1%8F%E9%9A%9C%E6%8C%87%E4%BB%A4)

[一文解决内存屏障](https://www.jianshu.com/p/64240319ed60)

## 4.4 哪些地⽅⽤到过volatile？

### 单例模式的安全问题

传统

```java
/**
 * 单例设计模式的安全问题
 * 常见的DCL（Double Check Lock）双端检查模式虽然加了同步，但是在多线程下依然会有线程安全问题。
 */
public class SingletonDemo {
    private static SingletonDemo instance = null;
    private SingletonDemo() {
        System.out.println(Thread.currentThread().getName() +"\t SingletonDemo构造方法执行了");
    }
    public static SingletonDemo getInstance(){
        if (instance == null) {
	        instance = new SingletonDemo();
        }
        return instance;
    }
    public static void main(String[] args) {
        //main线程操作
        System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
    }
}
```

改为多线程操作测试

```java
/**
 * 单例设计模式的安全问题
 * 常见的DCL（Double Check Lock）双端检查模式虽然加了同步，但是在多线程下依然会有线程安全问题。
 */
public class SingletonDemo {
    private static volatile SingletonDemo instance = null;
    private SingletonDemo() {
        System.out.println(Thread.currentThread().getName() +"\t SingletonDemo构造方法执行了");
    }
    public static SingletonDemo getInstance(){
        if (instance == null) {
            instance = new SingletonDemo();
        }
        return instance;
    }
    public static void main(String[] args) {
        //main线程操作
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        //多线程测试
        for (int i = 0; i < 10; i++) {
            new Thread(()->{
                SingletonDemo.getInstance();
            },String.valueOf(i)).start();
        }
    }
}
```

调整后，采⽤常⻅的DCL（Double Check Lock）双端检查模式加了同步，但是在多线程下依然会有线程安全问题。

```java
/**
 * 单例设计模式的安全问题
 * 常见的DCL（Double Check Lock）双端检查模式虽然加了同步，但是在多线程下依然会有线程安全问题。
 */
public class SingletonDemo {
    private static SingletonDemo instance = null;
    private SingletonDemo() {
        System.out.println(Thread.currentThread().getName() +"\t SingletonDemo构造方法执行了");
    }
    public static SingletonDemo getInstance(){
        if (instance == null) {
            synchronized (SingletonDemo.class){
                if (instance == null) {
                    instance = new SingletonDemo();
                }
            }
        }
        return instance;
    }
    public static void main(String[] args) {
        //main线程操作
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        // System.out.println(SingletonDemo.getInstance() == SingletonDemo.getInstance());
        //多线程测试
        for (int i = 0; i < 10; i++) {
            new Thread(()->{
                SingletonDemo.getInstance();
            },String.valueOf(i)).start();
        }
    }
}
```

这个漏洞⽐较tricky，很难捕捉，但是是存在的。 instance=new SingletonDemo(); 可以⼤致分为三步

```java
instance = new SingletonDemo();
public static thread.SingletonDemo getInstance();
	Code:
		0: getstatic11 // Field instance:Lthread/SingletonDemo;
		3: ifnonnull 37
		6: ldc12 // class thread/SingletonDemo
		8: dup
		9: astore_0
		10: monitorenter
		11: getstatic11 // Field instance:Lthread/SingletonDemo;//获取静态变量instance
		14: ifnonnull 27 //判断instance是否为null
		17: new12 // class thread/SingletonDemo //步骤1，开辟内存空间，获取地址
		20: dup
		21: invokespecial13 // Method "<init>":()V //步骤2,通过地址在对应的内存空间上执行构造，初始化对象
		24: putstatic11 // Field instance:Lthread/SingletonDemo;//步骤3，将地址赋值给instance变量
底层Java Native Interface中的C语⾔代码内容，开辟空间的步骤
memory = allocate(); //步骤1.分配对象内存空间
instance(memory); //步骤2.初始化对象
instance = memory; //步骤3.设置instance指向刚分配的内存地址，此时instance != null
```

**剖析：**

**在多线程的环境下，由于有指令重排序的存在，DCL（双端检锁）机制不⼀定线程安全，我们可以加⼊volatile可以禁⽌指令重排。**

原因在与某⼀个线程执⾏到第⼀次检测，读取到的instance不为null时，`instance的引⽤对象可能没有完成初始化。`

> 内存空间分配时，实例变量会被赋予默认值(零值)。之后才会执行构造方法，这是两步。

```java
memory = allocate(); //步骤1. 分配对象内存空间
instance(memory); //步骤2.初始化对象
instance = memory; //步骤3.设置instance指向刚分配的内存地址，此时instance != null
```

`步骤2和步骤3不存在数据依赖关系`，⽽且⽆论重排前还是重排后，程序的执⾏结果在单线程中并没有改变，因此这种重排优化是允许的。

```java
memory = allocate(); //步骤1. 分配对象内存空间
instance = memory; //步骤3.设置instance指向刚分配的内存地址，此时instance != null，但是对象还没有初始化完成！
instance(memory); //步骤2.初始化对象
```

但是指令重排只会保证串⾏语义的执⾏⼀致性（单线程），并不关⼼多线程的语义⼀致性。`所以，当⼀条线程访问instance不为null时，由于instance实例未必已初始化完成，也就造成了线程安全问题。`

```java
public static SingletonDemo getInstance(){
	if (instance == null) {
		synchronized (SingletonDemo.class){
			if (instance == null) {
				instance = new SingletonDemo(); //多线程情况下，可能发⽣指令重排
			}
		}
	}
	return instance;
}
```

如果发⽣指定重排，那么，

- 此时内存已经分配，那么 instance=memory 不为null。
- 碰巧，若遇到线程此时挂起，那么 instance(memory) 还未执⾏，对象还未初始化。
- 导致了 instance!=null ，所以两次判断都跳过，最后返回的 instance 还没初始化。

解决的⽅法就是对 `singletondemo` 对象添加上 `volatile` 关键字，禁⽌指令重排。

```java
private static volatile SingletonDemo singletonDemo=null;
```

总结：

JMM模型，线程间如何通信

JMM带来的问题：可见性、原子性、有序性

voliate原理（解决了可见性、有序性）、内存屏障阻止重排序
