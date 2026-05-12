# 04、Java并发编程 - 基础（悲观锁与synchronized）（偏向锁、轻量级锁、锁优化）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/4.html
- 分类：Java并发
- 分组：教程目录
## Synchronized块

## 1.1 基础

Java中的同步块用synchronized标记。同步块在Java中是同步在某个对象上。所有同步在一个对象上的同步块在同时只能被一个线程进入并执行操作。所有其他等待进入该同步块的线程将被阻塞，直到执行该同步块中的线程退出。

有四种不同的同步块：

**1、** 实例方法；

**2、** 静态方法；

**3、** 实例方法中的同步块；

**4、** 静态方法中的同步块；

上述同步块都同步在不同对象上。实际需要那种同步块视具体情况而定。

### 实例方法同步

下面是一个同步的实例方法：

```java
public synchronized void add(int value){
	this.count += value;
}
```

注意在方法声明中同步（synchronized ）关键字。

Java实例方法同步是同步在拥有该方法的对象上。这样，每个实例其方法同步都同步在不同的对象上，即该方法所属的实例。只有一个线程能够在实例方法同步块中运行。如果有多个实例存在，那么一个线程一次可以在多个实例同步块中执行操作。

### 静态方法同步

静态方法同步和实例方法同步方法一样，也使用synchronized 关键字。Java静态方法同步如下示例：

```java
public static synchronized void add(int value){
	count += value;
}
```

同样，这里synchronized 关键字告诉Java这个方法是同步的。

静态方法的同步是指同步在该方法所在的`类对象`上。因为在Java虚拟机中一个类只能对应一个类对象，所以同时只允许一个线程执行同一个类中的静态同步方法。

对于不同类中的静态同步方法，一个线程可以执行每个类中的静态同步方法而无需等待。不管类中的哪个静态同步方法被调用，一个类只能由一个线程同时执行。

### 实例方法中的同步块

有时你不需要同步整个方法，而是同步方法中的一部分。Java可以对方法的一部分进行同步。在非同步的Java方法中的同步块的例子如下所示：

```java
public void add(int value){
	synchronized(this){
		this.count += value;
	}
}
```

示例使用Java同步块构造器来标记一块代码是同步的。该代码在执行时和同步方法一样。

注意Java同步块构造器用括号将对象括起来。在上例中，使用了“this”，即为调用add方法的实例本身。在同步构造器中用括号括起来的对象叫做监视器对象。上述代码使用监视器对象同步，同步实例方法使用调用方法本身的实例作为监视器对象。

一次只有一个线程能够在同步于同一个监视器对象的Java方法内执行。

下面两个例子都同步他们所调用的实例对象上，因此他们在同步的执行效果上是等效的。

```java
public class MyClass {
	public synchronized void log1(String msg1, String msg2){
		log.writeln(msg1);
		log.writeln(msg2);
	}
	public void log2(String msg1, String msg2){
		synchronized(this){
			log.writeln(msg1);
			log.writeln(msg2);
		}
	}
}
```

在上例中，每次只有一个线程能够在两个同步块中任意一个方法内执行。

如果第二个同步块不是同步在this实例对象上，那么两个方法可以被线程同时执行。

### 静态方法中的同步块

和上面类似，下面是两个静态方法同步的例子。这些方法同步在该方法所属的类对象上。

```java
public class MyClass {
	public static synchronized void log1(String msg1, String msg2){
		log.writeln(msg1);
		log.writeln(msg2);
	}
	public static void log2(String msg1, String msg2){
		synchronized(MyClass.class){
			log.writeln(msg1);
			log.writeln(msg2);
		}
	}
}
```

这两个方法不允许同时被线程访问。

如果第二个同步块不是同步在MyClass.class这个对象上。那么这两个方法可以同时被线程访问。

## 1.2 自测题

可以通过如下几个题⽬验证自己是否已经完全掌握：

**1. 标准访问，请问先打印邮件还是短信？**

```java
/**
 * 1. 标准访问，请问先打印邮件还是短信？ 邮件
 */
class Phone{
    public synchronized void sendEmail(){
        System.out.println("======sendEmail");
    }
    public synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
        Phone phone = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone.sendMessage();
        }, "t2").start();
    }
}
```

**2. 邮件⽅法暂停4秒钟，请问先打印邮件还是短信？**

```java
/**
 * 2. 邮件方法暂停4秒钟，请问先打印邮件还是短信？ 邮件
 *     对象锁
 *     ⼀个对象⾥⾯如果有多个synchronized⽅法，某⼀个时刻内，只要⼀个线程去调⽤其中的⼀synchronized⽅法了，
 *     其他的线程都只能等待，换句话说，某⼀个时刻内，只能有唯⼀⼀个线程去访问这些synchronized⽅法，
 *     锁的是当前对象this，被锁定后，其他的线程都不能进⼊到当前对象的其他的synchronized⽅法
 */
class Phone{
    public synchronized void sendEmail(){
	    try {
		    TimeUnit.SECONDS.sleep(4); 
	    } catch (InterruptedException e) {
		    e.printStackTrace(); 
	    }
        System.out.println("======sendEmail");
    }
    public synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
        Phone phone = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone.sendMessage();
        }, "t2").start();
    }
}
```

**3. 新增⼀个普通⽅法hello()请问先打印邮件还是hello？**

```java
/**
 * 3. 新增⼀个普通⽅法hello（），请问先打印邮件还是hello？ hello
 *     加个普通⽅法后发现和同步锁⽆关
 */
class Phone{
    public synchronized void sendEmail(){
	    try {
		    TimeUnit.SECONDS.sleep(4); 
	    } catch (InterruptedException e) {
		    e.printStackTrace(); 
	    }
        System.out.println("======sendEmail");
    }
    public synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
    public void hello(){
        System.out.println("say hello");
    }
}
public class LockDemo {
    public static void main(String[] args) {
        Phone phone = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone.sendMessage();
        }, "t2").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone.hello();
        }, "t3").start();
    }
}
```

**4. 两部⼿机，请问先打印邮件还是短信？**

```java
/**
 * 4. 两部⼿机，请问先打印邮件还是短信？ 短信
 *     换成两个对象后，不是同⼀把锁了，情况⽴刻变化
 */
class Phone{
    public synchronized void sendEmail(){
	    try {
		    TimeUnit.SECONDS.sleep(4); 
	    } catch (InterruptedException e) {
		    e.printStackTrace(); 
	    }
        System.out.println("======sendEmail");
    }
    public synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
		Phone phone = new Phone();
        Phone phone2 = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone2.sendMessage();
        }, "t2").start();
    }
}
```

**5. 两个静态同步⽅法，同⼀部⼿机，请问先打印邮件还是短信？**

```java
/**
 * 5. 两个静态同步⽅法，同⼀部⼿机，请问先打印邮件还是短信？ 邮件
 */
class Phone{
    public static synchronized void sendEmail(){
	    try {
		    TimeUnit.SECONDS.sleep(4); 
	    } catch (InterruptedException e) {
		    e.printStackTrace(); 
	    }
        System.out.println("======sendEmail");
    }
    public static synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
		Phone phone = new Phone();
        //Phone phone2 = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone.sendMessage();
        }, "t2").start();
    }
}
```

**6. 两个静态同步⽅法，2部⼿机，请问先打印邮件还是短信？**

```java
/**
 * 6. 两个静态同步⽅法，2部⼿机，请问先打印邮件还是短信？ 邮件
 *     全局锁
 *     synchronized实现同步的基础：java中的每⼀个对象都可以作为锁。
 *     具体表现为⼀下3中形式。
 *     对于普通同步⽅法，锁是当前实例对象，锁的是当前对象this，
 *     对于同步⽅法块，锁的是synchronized括号⾥配置的对象。
 *     对于静态同步⽅法，锁是当前类的class对象
 */
class Phone{
    public static synchronized void sendEmail(){
	    try {
		    TimeUnit.SECONDS.sleep(4); 
	    } catch (InterruptedException e) {
		    e.printStackTrace(); 
	    }
        System.out.println("======sendEmail");
    }
    public static synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
		Phone phone = new Phone();
        Phone phone2 = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
		try {
			TimeUnit.SECONDS.sleep(1); 
		} catch (InterruptedException e) {
			e.printStackTrace(); 
		}
        new Thread(()->{
            phone2.sendMessage();
        }, "t2").start();
    }
}
```

**7. 1个普通同步⽅法，1个静态同步⽅法，1部⼿机，请问先打印邮件还是短信？**

```java
/*
 * 7. 1个普通同步⽅法，1个静态同步⽅法，1部⼿机，请问先打印邮件还是短信？ 短信
 */
class Phone{
    public synchronized void sendEmail(){
        try {
      TimeUnit.SECONDS.sleep(4); } catch (InterruptedException e) {
     e.printStackTrace(); }
        System.out.println("==========sendEmail");
    }
    public static synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
        Phone phone = new Phone();
        //Phone phone2 = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
        try {
      TimeUnit.SECONDS.sleep(1); } catch (InterruptedException e) {
     e.printStackTrace(); }
        new Thread(()->{
            phone.sendMessage();
        }, "t2").start();
    }
}
```

**8. 1个普通同步⽅法，1个静态同步⽅法，2部⼿机，请问先打印邮件还有短信？**

```java
/**
* 8. 1个普通同步⽅法，1个静态同步⽅法，2部⼿机，请问先打印邮件还是短信？ 短信
*     当⼀个线程试图访问同步代码块时，它⾸先必须得到锁，退出或抛出异常时必须释放锁。
*     也就是说如果⼀个实例对象的普通同步⽅法获取锁后，该实例对象的其他普通同步⽅法必须等待获取锁的⽅法释放锁后才能获取锁，
*     可是别的实例对象的普通同步⽅法因为跟该实例对象的普通同步⽅法⽤的是不同的锁，
*     所以⽆需等待该实例对象已获取锁的普通同步⽅法释放锁就可以获取他们⾃⼰的锁。
*
*     所有的静态同步⽅法⽤的也是同⼀把锁--类对象本身，
*     这两把锁(this/class)是两个不同的对象，所以静态同步⽅法与⾮静态同步⽅法之间是不会有静态条件的。
*     但是⼀旦⼀个静态同步⽅法获取锁后，其他的静态同步⽅法都必须等待该⽅法释放锁后才
能获取锁，
*     ⽽不管是同⼀个实例对象的静态同步⽅法之间，
*     还是不同的实例对象的静态同步⽅法之间，只要它们同⼀个类的实例对象
*/
class Phone{
    public synchronized void sendEmail(){
        try {
      TimeUnit.SECONDS.sleep(4); } catch (InterruptedException e) {
     e.printStackTrace(); }
        System.out.println("==========sendEmail");
    }
    public static synchronized void sendMessage(){
        System.out.println("======sendMessage");
    }
}
public class LockDemo {
    public static void main(String[] args) {
        Phone phone = new Phone();
        Phone phone2 = new Phone();
        new Thread(()->{
            phone.sendEmail();
        }, "t1").start();
        try {
      TimeUnit.SECONDS.sleep(1); } catch (InterruptedException e) {
     e.printStackTrace(); }
        new Thread(()->{
            phone2.sendMessage();
        }, "t2").start();
    }
}
```

## 1.3 原理

### Synchronized原理

我们先通过反编译下面的代码来看看Synchronized是如何实现对代码块进行同步的：

```java
public class SynchronizedDemo {
    public void method() {
        synchronized (this) {
            System.out.println("Method 1 start");
        }
    }
}
```

反编译结果：

关于这两条指令的作用，我们直接参考JVM规范中描述：

**monitorenter ：**

```java
Each object is associated with a monitor. A monitor is locked if and only if it has an owner. The thread that executes monitorenter attempts to gain ownership of the monitor associated with objectref, as follows:
• If the entry count of the monitor associated with objectref is zero, the thread enters the monitor and sets its entry count to one. The thread is then the owner of the monitor.
• If the thread already owns the monitor associated with objectref, it reenters the monitor, incrementing its entry count.
• If another thread already owns the monitor associated with objectref, the thread blocks until the monitor's entry count is zero, then tries again to gain ownership.
```

这段话的大概意思为：

每个对象有一个监视器锁（monitor）。当monitor被占用时就会处于锁定状态，线程执行monitorenter指令时尝试获取monitor的所有权，过程如下：

- 1、如果monitor的进入数为0，则该线程进入monitor，然后将进入数设置为1，该线程即为monitor的所有者。
- 2、如果线程已经占有该monitor，只是重新进入，则进入monitor的进入数加1。（可重入锁特性）
- 3、如果其他线程已经占用了monitor，则该线程进入阻塞状态，直到monitor的进入数为0，再重新尝试获取monitor的所有权。

**monitorexit：**

```java
The thread that executes monitorexit must be the owner of the monitor associated with the instance referenced by objectref.
The thread decrements the entry count of the monitor associated with objectref. If as a result the value of the entry count is zero, the thread exits the monitor and is no longer its owner. Other threads that are blocking to enter the monitor are allowed to attempt to do so.
```

这段话的大概意思为：

- 执行monitorexit的线程必须是objectref所对应的monitor的所有者。
- 指令执行时，monitor的进入数减1，如果减1后进入数为0，那线程退出monitor，不再是这个monitor的所有者。其他被这个monitor阻塞的线程可以尝试去获取这个 monitor 的所有权。

通过这两段描述，我们应该能很清楚的看出Synchronized的实现原理，Synchronized的语义底层是通过一个monitor的对象来完成，其实wait/notify等方法也依赖于monitor对象，这就是为什么只有在同步的块或者方法中才能调用wait/notify等方法，否则会抛出java.lang.IllegalMonitorStateException的异常的原因。

我们再来看一下同步方法的反编译结果：

```java
public class SynchronizedMethod {
    public synchronized void method() {
        System.out.println("Hello World!");
    }
}
```

从反编译的结果来看，方法的同步并没有通过指令monitorenter和monitorexit来完成（理论上其实也可以通过这两条指令来实现），不过相对于普通方法，其常量池中多了**ACC_SYNCHRONIZED**标示符。JVM就是根据该标示符来实现方法的同步的：当方法调用时，调用指令将会检查方法的 ACC_SYNCHRONIZED 访问标志是否被设置，如果设置了，执行线程将先获取monitor，获取成功之后才能执行方法体，方法执行完后再释放monitor。在方法执行期间，其他任何线程都无法再获得同一个monitor对象。 其实本质上没有区别，只是方法的同步是一种隐式的方式来实现，无需通过字节码来完成。

### Synchronized底层优化

Synchronized是通过对象内部的一个叫做监视器锁（monitor）来实现的。但是监视器锁本质又是依赖于底层的操作系统的Mutex Lock来实现的。而操作系统实现线程之间的切换这就需要从用户态转换到核心态，这个成本非常高，状态之间的转换需要相对比较长的时间，这就是为什么Synchronized效率低的原因。因此，这种依赖于操作系统Mutex Lock所实现的锁我们称之为“重量级锁”。JDK中对Synchronized做的种种优化，其核心都是为了减少这种重量级锁的使用。`JDK1.6以后，为了减少获得锁和释放锁所带来的性能消耗，提高性能，引入了“轻量级锁”和“偏向锁”。`

## 1.4 Synchronized锁的存储

`synchronized用的锁存储在Java对象头（头中的Mark Word字段）`，如果对象是数组类型，则虚拟机用3个字宽存储对象头，如果对象是非数组类型，则用2字宽存储对象头，32位虚拟机，1字宽等于4字节，即32位.

Java对象头的长度

Mark Word的存储结构

锁的状态总共有四种：**无锁状态、偏向锁、轻量级锁和重量级锁**。随着锁的竞争，锁可以从偏向锁升级到轻量级锁，再升级的重量级锁（但是锁的升级是单向的，也就是说只能从低到高升级，不会出现锁的降级）。JDK 1.6中默认是开启偏向锁和轻量级锁的，我们也可以通过-XX:-UseBiasedLocking来禁用偏向锁。锁的状态保存在对象的头文件中，以32位的JDK为例：

> epoch：偏向时间戳

> 如上图Synchronized底层实际上有三种形式的锁，虽然一段代码是用Synchronized关键字做修饰的，但是具体用哪种锁，怎么竞争，这个线程怎么获取相应锁定代码执行的权限，是有不同的途径，方式的。

## 1.5 偏向锁

HotSpot[1]的作者经过研究发现，`大多数情况下，锁不仅不存在多线程竞争，而且总是由同一线程多次获得，为了让线程获得锁的代价更低而引入了偏向锁。`当一个线程访问同步块并获取锁时，会在对象头和栈帧中的锁记录里存储锁偏向的线程ID，以后该线程在进入和退出同步块时不需要进行CAS操作来加锁和解锁，只需简单地测试一下对象头的Mark Word里是否存储着指向当前线程的偏向锁。如果测试成功，表示线程已经获得了锁。如果测试失败，则需要再测试一下Mark Word中偏向锁的标识是否设置成1（表示当前是偏向锁）：如果没有设置，则使用CAS竞争锁；如果设置了，则尝试使用CAS将对象头的偏向锁指向当前线程。

> 偏向锁是锁状态中最乐观的一种锁：从始至终只有一个线程请求同一把锁

### 偏向锁的获取流程：

- （1）查看Mark Word中偏向锁的标识以及锁标志位，若是否偏向锁为1且锁标志位为01，则该锁为可偏向状态。
- （2）若为可偏向状态，则测试Mark Word中的线程ID是否与当前线程相同，若相同，表示线程已经获得了锁，进入步骤（5），如果不同，则进入（3）
- （3）如果线程ID并未指向当前线程，则通过CAS操作竞争锁（构建一个匿名偏向的mark word，尝试用CAS指令替换掉锁对象的mark word）。如果竞争成功，则将Mark Word中线程ID设置为当前线程ID，然后执行（5）；如果竞争失败，执行（4）。
- （4）如果CAS获取偏向锁失败，则表示有竞争。此时会尝试撤销偏向锁，当到达全局安全点（safepoint）时会依次做如下判断：
- 查看偏向的线程是否存活，如果已经不存活了，则直接撤销偏向锁。JVM维护了一个集合存放所有存活的线程，通过遍历该集合判断某个线程是否存活。
- 偏向的线程是否还在同步块中，如果不在了，则撤销偏向锁。我们回顾一下偏向锁的加锁流程：每次进入同步块（即执行monitorenter）的时候都会以从高往低的顺序在栈中找到第一个可用的Lock Record，将其obj字段指向锁对象。每次解锁（即执行monitorexit）的时候都会将最低的一个相关Lock Record移除掉。所以可以通过遍历线程栈中的Lock Record来判断线程是否还在同步块中。
- 以上都不满足说明偏向的线程还在同步块中，此时会进行偏向锁升级为轻量级锁的操作。
- （5）执行同步代码。

> 详细源码可参考：

[死磕Synchronized底层实现–偏向锁](https://www.jianshu.com/p/4758852cbff4)

[https://www.processon.com/view/5c25db87e4b016324f447c95](https://www.processon.com/view/5c25db87e4b016324f447c95)

### 偏向锁的撤销

`偏向锁使用了一种等到竞争出现才释放锁的机制`，所以当其他线程尝试竞争偏向锁时，持有偏向锁的线程才会释放锁。偏向锁的撤销，需要等待全局安全点（在这个时间点上没有正在执行的字节码）。它会首先暂停拥有偏向锁的线程，然后检查持有偏向锁的线程是否活着，如果线程不处于活动状态，则将对象头设置成无锁状态；如果线程仍然活着，拥有偏向锁的栈会被执行，遍历偏向对象的锁记录，栈中的锁记录和对象头的Mark Word要么重新偏向于其他线程，要么恢复到无锁或者标记对象不适合作为偏向锁，最后唤醒暂停的线程。下图中的线程1演示了偏向锁初始化的流程，线程2演示了偏向锁撤销的流程。

撤销环节：

### 偏向锁的适用场景

始终只有一个线程在执行同步块，在它没有执行完释放锁之前，没有其它线程去执行同步块，在锁无竞争的情况下使用，一旦有了竞争就升级为轻量级锁，升级为轻量级锁的时候需要撤销偏向锁，撤销偏向锁的时候会导致stop the word操作；

在有锁的竞争时，偏向锁会多做很多额外操作，尤其是撤销偏向所的时候会导致进入安全点，安全点会导致stw，导致性能下降，这种情况下应当禁用，`高并发的应用会禁用掉偏向锁。`

### 关闭偏向锁

偏向锁在Java 6和Java 7里是默认启用的，但是它在应用程序启动几秒钟之后才激活，如有必要可以使用JVM参数来关闭延迟：`-XX:BiasedLockingStartupDelay=0`。如果你确定应用程序里所有的锁通常情况下处于竞争状态，可以通过JVM参数关闭偏向锁：`-XX:- UseBiasedLocking=false`，那么程序默认会进入轻量级锁状态。

## 1.6 轻量级锁

轻量级锁原理非常简单，如果持有锁的线程能在很短时间内释放锁资源，那么那些等待竞争锁的线程就不需要做内核态和用户态之间的切换进入阻塞挂起状态，它们只需要等一等（自旋），等持有锁的线程释放锁后即可立即获取锁，这样就避免用户线程和内核的切换的消耗。

### 轻量级锁加锁

线程在执行同步块之前，JVM会先在当前线程的栈桢中创建用于存储锁记录的空间，并将对象头中的Mark Word复制到锁记录中，官方称为Displaced Mark Word。然后线程尝试使用CAS将对象头中的Mark Word替换为指向锁记录的指针。如果成功，当前线程获得锁，如果失败，表示其他线程竞争锁，当前线程便尝试使用自旋来获取锁。

轻量级锁的加锁过程：

1、当线程执行代码进入同步块时，若Mark Word为无锁状态，虚拟机先在当前线程的栈帧中建立一个名为Lock Record的空间，用于存储当前对象的Mark Word的拷贝，官方称之为“Dispalced MarkWord”，此时状态如下图：

2、复制对象头中的Mark Word到锁记录中。

3、复制成功后，虚拟机将用CAS操作将对象头的Mark Word更新为指向Lock Record的指针，并将Lock Record里的owner指针指向对象的Mark Word。如果更新成功，则执行4，否则执行5。；

4、如果更新成功，则这个线程拥有了这个锁，并将锁标志设为00，表示处于轻量级锁状态，此时状态图：

5、如果更新失败，则说明有其他线程竞争锁，当前线程便通过自旋来获取锁。自旋一定次数后还没有获得锁，那么轻量级锁就会膨胀为重量级锁，Mark Word中存储重量级锁（互斥锁）的指针，后面等待锁的线程也要进入阻塞状态。

### 轻量级锁解锁

轻量级解锁时，会使用原子的CAS操作将Displaced Mark Word替换回到对象头，如果成功，则表示没有竞争发生。如果失败，表示当前锁存在竞争，锁就会膨胀成重量级锁。

因为自旋会消耗CPU，为了避免无用的自旋（比如获得锁的线程被阻塞住了），一旦锁升级成重量级锁，就不会再恢复到轻量级锁状态。当锁处于这个状态下，其他线程试图获取锁时，都会被阻塞住，当持有锁的线程释放锁之后会唤醒这些线程，被唤醒的线程就会进行新一轮的夺锁之争。

### 轻量级锁的优缺点

轻量级锁尽可能的减少线程的阻塞，这对于锁的竞争不激烈，且占用锁时间非常短的代码块来说性能能大幅度的提升，因为自旋的消耗会小于线程阻塞挂起再唤醒的操作的消耗，这些操作会导致线程发生两次上下文切换！

但是如果锁的竞争激烈，或者持有锁的线程需要长时间占用锁执行同步块，这时候就不适合使用轻量级锁了，因为轻量级锁在获取锁前一直都是占用cpu做无用功，同时有大量线程在竞争一个锁，会导致获取锁的时间很长，线程自旋的消耗大于线程阻塞挂起操作的消耗，其它需要cpu的线程又不能获取到cpu，造成cpu的浪费。所以这种情况下我们要关闭轻量级锁；

JVM对于自旋周期的选择，jdk1.5这个限度是一定的写死的，在1.6引入了适应性轻量级锁，适应性轻量级锁意味着自旋的时间不在是固定的了，而是由前一次在同一个锁上的自旋时间以及锁的拥有者的状态来决定，基本认为一个线程上下文切换的时间是最佳的一个时间，同时JVM还针对当前CPU的负荷情况做了较多的优化

**1、** 如果平均负载小于CPUs则一直自旋；

**2、** 如果有超过(CPUs/2)个线程正在自旋，则后来线程直接阻塞；

**3、** 如果正在自旋的线程发现Owner发生了变化则延迟自旋时间（自旋计数）或进入阻塞；

**4、** 如果CPU处于节电模式则停止自旋；

**5、** 自旋时间的最坏情况是CPU的存储延迟（CPUA存储了一个数据，到CPUB得知这个数据直接的时间差）；

**6、** 自旋时会适当放弃线程优先级之间的差异；

### 轻量级锁的开启

JDK1.6中-XX:+UseSpinning开启；

-XX:PreBlockSpin=10 为自旋次数；

JDK1.7后，去掉此参数，由jvm控制；

## 1.7 重量级锁

即当有其他线程占用锁时，当前线程会进入阻塞状态。

## 1.8 其他优化

### 适应性自旋

适应性自旋（Adaptive Spinning）：从轻量级锁获取的流程中我们知道，当线程在获取轻量级锁的过程中执行CAS操作失败时，是要通过自旋来获取重量级锁的。问题在于，自旋是需要消耗CPU的，如果一直获取不到锁的话，那该线程就一直处在自旋状态，白白浪费CPU资源。解决这个问题最简单的办法就是指定自旋的次数，例如让其循环10次，如果还没获取到锁就进入阻塞状态。但是JDK采用了更聪明的方式——适应性自旋，简单来说就是线程如果自旋成功了，则下次自旋的次数会更多，如果自旋失败了，则自旋的次数就会减少。

### 锁粗化

锁粗化（Lock Coarsening）：锁粗化的概念应该比较好理解，就是将多次连接在一起的加锁、解锁操作合并为一次，将多个连续的锁扩展成一个范围更大的锁。举个例子：

```java
public class StringBufferTest {
	//全局变量有线程安全问题
    StringBuffer stringBuffer = new StringBuffer();
    public void append(){
        stringBuffer.append("a");
        stringBuffer.append("b");
        stringBuffer.append("c");
    }
}
```

这里每次调用stringBuffer.append方法都需要加锁和解锁，如果虚拟机检测到有一系列连串的对同一个对象加锁和解锁操作，就会将其合并成一次范围更大的加锁和解锁操作，即在第一次append方法时进行加锁，最后一次append方法结束后进行解锁。

### 锁消除

锁消除（Lock Elimination）：锁消除即删除不必要的加锁操作。根据代码逃逸技术，如果判断到一段代码中，堆上的数据不会逃逸出当前线程，那么可以认为这段代码是线程安全的，不必要加锁。看下面这段程序：

```java
public class Test{
    public static void main(String[] args) {
        //sb变量是局部变量，不会有线程安全问题，加锁、解锁没有意义
        StringBuffer sb = new StringBuffer();
        sb.append("a");
        sb.append("b");
        sb.append("c");
    }
}
```

此时虽然append是同步方法，但是这段程序中StringBuffer属于一个局部变量，即每个线程进入此方法都会拥有一个StringBuffer的变量，互不影响，线程安全

## 总结

> 即轻量级锁会用自旋方式获取锁，重量级锁线程会直接阻塞。
