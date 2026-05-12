# 04、Java JUC源码分析 - 精通Synchronized底层的实现原理
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/4.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解synchronized底层的实现原理

### 1，初识synchronized

在最前面的两篇文章中，谈了java的内存模型JMM，得知了为何会出现共享变量的不安全性，同时也谈到了通过无锁的方式实现共享变量安全的CAS，但是CAS本身也存在着一定的缺陷，不能适用于大规模并发的场景下，因此从这篇开始，讲解一个通过加锁的方式来实现共享变量的安全性，就是这篇的主角 **synchronized**

synchronized同步块是java内部提供的一个内置锁，又被称为监视器锁**monitor**，其实现是通过操作系统底层的互斥量来实现的。主要是针对一些临界区中的临界资源进行上锁的操作，其使用相对来说也比较简单，主要分为类锁和实例锁。接下来谈一下这个关键字是如何使用的。

#### 1.1，类锁

顾名思义，就是将锁加在类方法或者静态代码块的上面，添加到类方法的方式如下

```java
public static Integer data = 0;
public synchronized static void increment(){
    data ++;
}
```

除了上面的加在方法上之外，还可以直接添加到同步代码块里面

```java
public static Integer data = 0;
public static void toIncrement(){
    synchronized (SynchronizedByClass.class){
        data ++ ;
    }
}
```

#### 1.2，对象锁

对象锁，指的就是加在实例方法的上面，以及实例方法中的代码块上面，添加到实例方法的方式如下

```java
public Integer decrementData = 0;
public synchronized  void decrement(){
    this.decrementData -- ;
}
```

除了加在方法上，也可以直接通过加在代码块上面的形式加在对象上面

```java
public void decrementData1(){
    synchronized (this){
        this.decrementData --;
    }
}
private String lock = "";
public void decrementData2(){
    synchronized (lock){
        this.decrementData --;
    }
}
```

### 2，synchronized在jvm的字节码指令

由于synchronized是一个关键字，因此可以通过查看其字节码指令去了解底层是如何实现的。在分析之前，需要在idea中安装一个插件 **jclasslib** ，我在jvm系列中曾经讲过这个插件如何安装以及使用：[https://zhenghuisheng.blog.csdn.net/article/details/129610963](https://zhenghuisheng.blog.csdn.net/article/details/129610963)

接下来通过一段简单的代码来分析加在方法中其底层是如何实现的

```java
public class SynchronizedJvmCode {
    public Integer data = 0;
    public synchronized void add(){
        this.data ++ ;
    }
}
```

在methods中找到这个add方法，在右边可以看到一个重要的标志：**Access flags**，其对应的值是0x0021

在jdk关键字中，详细的描述了这个flag标志的信息，0x0021对应的就是这个**ACC_SYNCHRONIAZED** 这个指令，因此显而易见，在方法上加synchronized是通过这个 ACC_SYNCHRONIAZED 标志实现的

接下来通过一段简单的代码来分析加在代码块其底层是如何实现的

```java
public class SynchronizedJvmCode {
    public Integer data = 0;
    public void add(){
        synchronized (this){
            data++ ;
        }
    }
}
```

这个add方法对应的字节码的指令如下，可以发现在这里面多两个东西，分别是**monitorenter**和**monitorexit** ，分别代表着加锁和解锁的意思，因此在代码块中就是通过这两个指令实现锁的操作的。

并且在这个字节码指令中，存在两个 **monitorexit** ，根据下面31行已经解锁了跳到后面41return了，但是后面还有字节码操作，通过第40行可以发现，就是为了防止出现异常导致死锁，类似于在try中有解锁操作，在catch中也有解锁的操作，这样不管有没有异常，都能正常解锁

```java
 0 aload_0
 1 dup
 2 astore_1
 3 monitorenter  //加锁
 4 aload_0
 5 getfield3 <com/zhs/study/juc/synchronize/SynchronizedJvmCode.data>
 8 astore_2
 9 aload_0
10 aload_0
11 getfield3 <com/zhs/study/juc/synchronize/SynchronizedJvmCode.data>
14 invokevirtual4 <java/lang/Integer.intValue>
17 iconst_1
18 iadd
19 invokestatic2 <java/lang/Integer.valueOf>
22 dup_x1
23 putfield3 <com/zhs/study/juc/synchronize/SynchronizedJvmCode.data>
26 astore_3
27 aload_2
28 pop
29 aload_1
30 monitorexit  //解锁
31 goto 41 (+10)
34 astore 4
36 aload_1
37 monitorexit  //解锁
38 aload 4
40 athrow
41 return
```

也就是说，这个加锁和解锁是jvm内部帮我们实现的，不需要我们手动去加锁解锁，相对于Lock这种显示锁，synchronized就是一把隐式锁。

总结来说就是：**如果在方法上加这个synchronized，其底层是通过ACC_SYNCHRONIAZED标志实现的，如果是在同步块上synchronized，其底层是通过monitorEnter和monitorExit实现的**。但是这两种方式都是通过jvm去调用操作系统来实现的，这样就会涉及到用户态到内核态之间的来回切换，以及会涉及到阻塞等等问题，因此这个关键字的使用也是挺耗性能的，相对于volatile来说，这个synchronized就是一把重锁。

### 3，Monitor监视器

在操作系统中，monitor又可以被称为这个**管程**，主要是帮助共享变量在并发场景下可以保证数据的安全性。在java中实现管程的方式是由synchronized关键字和wait，notify和notifyAll这三个方法共同实现的。其底层的模型架构如下

在hotspot虚拟机中，有关**Monitor**的底层实现的部分源码如下

```java
ObjectMonitor() {
    _recursions   = 0;   // 锁的重入次数 
    _object       = NULL;  //存储锁对象
    _owner        = NULL;  // 标识拥有该monitor的线程（当前获取锁的线程） 
    _WaitSet      = NULL;  // 等待线程（调用wait）组成的双向循环链表，_WaitSet是第一个节点
    _cxq          = NULL ; //多线程竞争锁会先存到这个单向链表中 （FILO栈结构）
    _EntryList    = NULL ; //存放在进入或重新进入时被阻塞的线程 (也是存竞争锁失败的线程)
```

**里面有一个锁的重入次数，表示synchronized是一把可重入锁；里面主要有三个队列，一个是双向循环列表实现的waitSet队列，里面存储的是调用wait方法释放锁之后阻塞的线程；从外面进来的大量线程在没有拿到锁的情况下，会进入这个cxq的队列里面，而cxq的数据结构是栈的方式实现，就是先进后出，表示这是一把非公平锁，并且不能保证有序性；entryList存储的是被阻塞的线程，会和cxq中的线程一起去抢锁**

接下来用一段代码来演示一下内部的整个流程，如下面这段代码，首先三个方法同时抢一把锁，此时模拟为三个线程，由于代码从上往下执行，因此这个thread1先进入cxq队列中，随后是2,3。然后3先拿到锁，有一个wait方法，会释放资源和释放锁，此时thread3就进入这个waitSet的队列里面，thread2和thread3一样，此时就剩thread1线程，就会拿到锁。

```java
private String lock = "";
public void thread1() throws InterruptedException {
    synchronized (lock){
        ...    
    }
}
public void thread2() throws InterruptedException {
    synchronized (lock){
        wait(100);
    }
}
public void thread3() throws InterruptedException {
    synchronized (lock){
        wait(300);    
    }
}
```

如果此时thread2和thread3被notifyAll给唤醒，此时这两个线程会从waitSet队列中进入entryList队列或者cxq队列，主要是根据不同策略实现的，随后这两个队列的线程再次一起去抢锁。如果entryList队列的数据为空，则直接将cxq的队列数据全部存储到entryList里面，如果entryList的数据不为空，则优先唤醒entryList里面的线程。

总而言之：**CXQ队列是线程刚从外面进来的队列，由于内部采用的是栈结构，先进后出，所以整体是一个非公平锁的操作，waitSet队列存储的是加了wait被阻塞的线程，wait是会释放资源的，当被唤醒后，会重新进入EntryList或者CXQ队列中，这取决于不同的策略实现，EntryList中线程被唤醒的优先级高于CXQ队列**

CXQ队列是一个同步等待队列，waitSet队列是一个条件等待队列。synchronized在多线程抢占锁时，采用的是cas的方式实现的。

### 4，对象的内存布局

上面有提到monitor监视器是将锁加在对象上面的，那么一个对象上面是否加锁，那就得了解一下这个java中对象的内存布局，其主要可以分为三个部分：**对象头，实例数据和对齐填充**。以下所有例子都是用64位的虚拟机

- 对象头：里面主要是会记录一些对象的hashcode，年龄，线程id，锁的标志和锁的状态等
- 实例数据：类中的一些属性信息等
- 对齐填充：每个对象所占的字节数必须是8的整数倍，否则补齐

在对象头中，又可以分为三个部分，分别是：**Mark Word，MetaData压缩指针和数组长度。**

- Mark word主要存储一些对象的hashcode，年龄，线程id，锁的标志和锁的状态等，一般占8个字节
- Klass Pointer指的是对象的压缩指针，在jdk8中默认是开启压缩指针的，一般占用4个字节，如果没有开启，则占8个字节。虚拟机通过这个指针来确定这个对象是属于哪个实例的
- 如果一个对象中存在数组，那么这个数组默认占用4个字节

因此看下面这个类，如果new一个Data这个类，那么占用的字节数如下：对象头中的markWord占8个字节，压缩指针占4个字节，数组占4个字节，实例数据age占4个字节，总共占20个字节，但是对齐填充中需要满足是8的整数倍，因此总共占**24**个字节。

```java
class Data{
    private int age;
    private int code[];
}
```

### 5，锁的几种状态

在这个markword中，会储存关于锁的信息，以jvm64位的虚拟机为代表，如下图所示。在synchronized中，主要可以分为无锁状态、偏向锁状态、轻量级锁状态和重量级状态，无锁通过001表示，偏向锁通过101表示，轻量级锁通过00表示，重量级锁通过10表示。

在这几种锁中，会随着锁的竞争激烈程度不断的变强，会从当没有线程时，处于一个无锁状态，当有一个线程时，会处于偏向锁状态，随后会随着并发的强度不断的上升锁的强度，从轻量级锁再到重量级锁，并且这是一个不可逆的过程。

#### 5.1，偏向锁

但是在jdk6开始，默认这个偏向锁是延迟开启的，因为在jvm进行类初始化等操作的时候，会使用大量的synchronized关键字，也就是说在加载阶段我们可以明确是可能存在多个线程并发的，如果还按先偏向锁再到轻量级锁，这样就可能会有部分性能问题，因此为了解决这个问题，干脆就直接从无锁到轻量级锁了，从而将这个偏向锁省略或者延迟加载。jvm默认采用的是延迟加载的，默认是在jvm虚拟机启动4s之后开始加载，也就是说，如果没有任何操作，只有在jvm启动4s后加载的对象，才有可能出现偏向锁。以下是关于jvm操作偏向锁的一些参数。

```java
//关闭延迟开启偏向锁
-XX:BiasedLockingStartupDelay=0
//禁止偏向锁
-XX:-UseBiasedLocking 
//启用偏向锁
-XX:+UseBiasedLocking 
```

当然也可以直接通过强行睡眠的方式，来解决这个偏向锁问题

```java
Thread.sleep(4000);
```

但是根据下图可以发现在偏向锁中，并没有存储这个对象hashcode的地方，因此如果在睡眠4s之后再调用这个hashcode方法，就会出现这个偏向锁撤销的情况，又由于这几种锁的状态不可逆，所以会直接从偏向锁状态升级为轻量级锁的状态，也可能会升级成重量级锁。

除了调用这个hashcode之外，也可能调用wait方法或者notifyAll方法等锁出现偏向锁失败的场景。

#### 5.2，轻量级锁

在无锁或者偏向锁中，都可能升级为轻量级锁。轻量级锁，顾名思义就是此时争取锁的线程不多，没那么激烈，或者说线程与线程之间交替执行。由于synchronized底层抢锁是过cas的方式实现，轻量级锁并不需要cas就能拿到锁，如果需要长时间cas，那么就会进行一个锁膨胀的操作，最后去获取一个monitor对象，变成重量级锁。

由于延迟偏向锁是4s后开始的，因此开启一个延迟偏向锁，随后创建一个Object对象，并且创建两个线程

```java
public static void main(String[] args) throws InterruptedException {
    //开启延迟偏向
    Thread.sleep(5000);
    //延迟4s后才开始加载的对象
    Object lock = new Object();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
	//创建线程1
    new Thread(()->{
        synchronized (lock){
            System.out.println(ClassLayout.parseInstance(lock).toPrintable());
        }
    },"thread1").start();
	//创建线程2
    new Thread(()->{
        synchronized (lock){
            System.out.println(ClassLayout.parseInstance(lock).toPrintable());
        }
    },"thread2").start();
}
```

其输出打印的结果如下，由于延迟偏向锁的开启，此时状态为101，但是此时并没有偏向哪个线程；随后第二个线程打印出来的也是101，还是延迟偏向锁，代表刚刚那个偏向锁现在已经有执向的线程了；又有了第二个线程来抢锁，随后随着锁竞争的激烈程度锁就行了升级，变成了00，就是轻量级锁。

在轻量级锁中，拿到锁的线程会将对象锁的markword存储在当前栈帧中， 而markword中存储的线程id也是当前线程的id，当有别的线程来抢锁时，需要通过cas操作，就是看是否携带这个markword以及线程的id是否匹配，如果不匹配，则需要继续自旋。而当前线程执行完成之后，需要将轻量级锁变成无锁状态，别的线程才能获取到锁，锁的不可逆指的是重量级锁到轻量级锁的不可逆，以及轻量级锁到偏向锁的不可逆。

#### 5.3，重量级锁

偏向锁和轻量级锁都是通过操作mark word来修改对象锁的状态的，但是重量级锁不一样，需要切换到内核态进行锁状态的修改，需要调用底层的moniter机制来实现。也就是说前面两个不需要加锁或者cas就能操作，后者需要用户态到内核态之间的来回切换。重量级锁就是在cas时，经过长时间轮询还是不能获取到锁，那么这个锁就会升级膨胀，随后会去获取操作系统底层的monitor对象，此时轻量级锁升级为重量级锁，并且期间需要不断的cas自旋。**只有在重量级锁需要长时间自旋，轻量级锁和偏向锁是不需要自旋的**

依旧是采用下面这段代码，再在轻量级锁那段代码上面再加一个线程thread3

```java
new Thread(()->{
    synchronized (lock){
        System.out.println(ClassLayout.parseInstance(lock).toPrintable());
    }
},"thread3").start();
```

上面的代码结果如下，可以发现前面两步开始延迟偏向锁，但是第三步开始就不一样了，因为随着锁的竞争强度的增加，从原来的00轻量级锁变成了现在的10重量级锁

重量级锁到轻量级锁的是不可逆的，但是重量级锁可以直接到无锁状态。并且根据轻量级锁和重量级锁的两段代码，可以发现并不存在无锁到偏向锁的过程，要么就是无锁，要么就是偏向锁，而且都是用01表示，表明其实这两个是互斥的。

总而言之：如果线程没有开启延迟偏向锁，那么对象刚加锁后会由无锁变成轻量级锁的状态，轻量级锁在获取锁失败的情况下就会膨胀，获取到monitor对象，随后由轻量级锁变成重量级锁，内部通过cas的方式竞争锁；如果线程开启了延迟偏向锁，那么对象会自动进入一个匿名偏向锁的状态，随后在拿到一把锁之后，对象会进入一个有指向线程id的偏向锁状态，随后通过一些列的偏向锁锁撤销等操作，随着偏向锁撤销等操作，进入无锁，轻量级锁或者重量级锁。

### 6，锁的升降级方式

上面讲了几种synchronized锁的状态，有无锁、偏向锁、轻量级锁和重量级锁这几种锁，接下来详细谈一下底层是如何进行锁升降级的。接下来以下图为主要核心讲解这几个锁之间的关系。

#### 6.1，匿名偏向锁和偏向锁关系

假设此时延迟偏向锁没有关闭，那么在4s后的延迟偏向锁开启之后创建一个锁对象，因此这个锁对象中，会有一个markword，此时该对象是处于一个偏向锁的状态，但是由于并没有线程来获取这把锁，此时执行的线程id为0，锁标志位101记录在markword中，此时的锁为一个匿名偏向锁的一个状态。很多人会觉得匿名偏向锁是一个无锁状态，其实不是，通过标志位就可以知道101，是一个偏向锁的状态，001才是无锁状态。

假设此时有一个线程进来拿这把锁(可以看5里面的例子)，那么此时还是一把偏向锁，此时对象锁obj中的markword中的线程id会指向偏向抢这把锁的线程id，该线程id为操作系统底层的id值。并且在偏向锁解锁后，不会变成无锁状态，还是一把偏向锁状态。

```java
Object obj = "";
```

#### 6.2，无锁，轻量级锁和重量级锁之间关系

1，假设在不考虑偏向锁的情况下，此时**无锁、轻量级锁和重量级锁的升级关系**是这样的：

- 首先在没有线程来竞争这把对象锁时，此时的对象锁中的markword的锁标志是001，是一个**无锁状态**；
- 当有一个线程或者线程交替执行的时候，此时对象锁会有指针指向拿到这把锁的线程，并且将markword中的值改成00，**拿到锁的线程也会将无锁时的markword保存在栈帧内部**，此时无锁状态升级成轻量级锁状态；
- 在轻量级锁中，会随着cas长时间拿不到锁而膨胀，当拿到monitor对象之后，会升级成一把**重量级锁**，此时对象锁中的markword的锁标志位10。

上面三种情况是随着线程抢锁的激烈程度增加而增加的，也有可能直接出现从无锁到重量级锁的情况，如某一时刻的并发量大，需要大量的长时间的cas，那么此时会从无锁直接升级成重量级锁。

2，**既然存在锁升级的情况，那么也肯定存在锁降级的情况，其关系如下**：

- 轻量级锁状态在释放锁的时候，如果此时没有其他线程来竞争锁，那么此时会将锁释放，并且将当前线程中保存的markword还原给初始的无锁状态。
- 重量级锁和轻量级锁一样，在释放锁时，也会将锁从重量级锁降级成无锁状态。

不存在重量级锁到轻量级锁之间的降级，这两个是不可逆的，因为有monitor对象会优先使用monitor对象。在锁降级时，当前线程会将一开始保存的初始markword还原回去，这样不管过程如何修改，最终都可以还原锁对象最初的无锁状态。

#### 6.3，偏向锁的撤销

通过上述5中的例子可以发现，当偏向锁解锁之后，还是处于偏向锁的状态，而不是无锁，因此就引入了这个偏向锁撤销的概念。还是得看着下面的这个图来解释，假设此时对象锁处于偏向锁状态，然后在内部调用hashcode方法，而此时偏向锁中并没有存储hashcode值的地方，那么就会出现三种情况

1，假设此时还是一个匿名偏向锁，如下面的lock锁，此时是一把匿名偏向锁，随后调用hashcode方法

```java
public static void main(String[] args) throws InterruptedException {
    //开启延迟偏向
    Thread.sleep(5000);
    //延迟4s后才开始加载的对象
    Object lock = new Object();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
    lock.hashCode();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
}
```

接下来查看他的打印日志，有图有真相，从101状态变成了001状态，这就是锁撤销成了无锁状态

2，假设此时是一把有偏向线程的偏向锁，随后定义两个线程，随后也是调用这个hashcode对象

```java
public static void main(String[] args) throws InterruptedException {
    //开启延迟偏向
    Thread.sleep(5000);
    //延迟4s后才开始加载的对象
    Object lock = new Object();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
    //两个线程竞争，成为轻量级锁
    new Thread(()->{
        synchronized (lock){
            //System.out.println(ClassLayout.parseInstance(lock).toPrintable());
        }
    },"thread1").start();
    new Thread(()->{
        synchronized (lock){
            System.out.println(ClassLayout.parseInstance(lock).toPrintable());
        }
    },"thread2").start();
    Thread.sleep(500);
    lock.hashCode();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
}
```

其结果很明显，第一个打印出来的是匿名偏向锁，此时还没有线程来拿锁，第二步是直接成为了00轻量级锁，随后轻量级锁释放锁成为001无锁。

3，依旧是有偏向线程id的偏向锁，在一个线程中，休眠一会再调用这个hashcode方法，最后打印日志

```java
public static void main(String[] args) throws InterruptedException {
    //开启延迟偏向
    Thread.sleep(5000);
    //延迟4s后才开始加载的对象
    Object lock = new Object();
    System.out.println(ClassLayout.parseInstance(lock).toPrintable());
    //两个线程竞争，成为轻量级锁
    new Thread(()->{
        synchronized (lock){
            System.out.println(ClassLayout.parseInstance(lock).toPrintable());
            lock.hashCode();
            System.out.println(ClassLayout.parseInstance(lock).toPrintable());
        }
    },"thread1").start();
    Thread.sleep(500);
}
```

这样就实现了从偏向锁101，撤销到重量级锁10了。

锁的撤销一般是在程序的安全点进行操作，如触发GC时，程序异常时等。

### 7，jvm对synchronized锁的优化

#### 7.1，偏向锁批量重偏向优化

在markword的偏向锁中，有一个Epoch字段，该字段主要是记录同一个对象偏向锁撤销的次数，在多线程的条件下，如果Epoch存储的值达到一定的阈值的时候，就会触发这个批量重偏向的优化操作，因为偏向锁的撤销是需要花费一定的性能的，而大量线程一直去撤销同一个偏向锁对象，因此这里就做了重偏向的优化

重偏向，简而言之就是复用的意思，原先在一个偏向锁中，其对应指向的线程id是不变的，后面在jvm内部是做了优化的，假设第一个线程里面有50个对象锁存放在list里面，第二个线程还是用list里面的这50个对象，那么当第二个线程撤销重偏向的次数达到20的时候，后面的对象会直接进行重偏向操作，就是复用第一个线程的偏向锁，从而减少偏向锁撤销所带来的性能影响。

主要是jvm会认为当前锁对象是不是重偏向错了，于是会重置锁对象的线程ThreadId

```java
intx BiasedLockingBulkRebiasThreshold   = 20   //默认偏向锁批量重偏向阈值
```

这个就有点类似于线程池中线程复用的原理，但是偏向锁在重偏向时会有对应的阈值，主要是通过jvm内部优化

#### 7.2，偏向锁批量撤销优化

这个批量撤销相对而言更好理解，因为偏向锁撤销肯定会影响性能，因此也会对这个Epoch的统计做一个阈值处理，当达到40时，JVM就会觉得这个类干脆就不用偏向锁的状态，直接进入无锁状态，从而省去锁撤销锁带来的性能问题。

```java
intx BiasedLockingBulkRevokeThreshold   = 40   //默认偏向锁批量撤销阈值
```

**批量重偏向和批量撤销主要是针对锁的优化，并且偏向锁只能重偏向一次**

#### 7.3，重量级锁自旋优化

在这几种锁中，轻量级锁和偏向锁都不存在自旋操作，只有这个重量级锁存在自旋。在自旋之前，如果直接使用阻塞的方式抢锁，那么需要不断的用户态切换到内核态去抢占，那么jvm就直接在用户态通过cas的方式进行一个锁的竞争，在用户态选出获取拿到锁的线程，随后再去调用内核态进行操作，从而避免大量线程阻塞问题。

- 在jdk6之后，可以通过参数设置来决定是否开启自旋，以及设置自旋的次数。
- 在jdk7之后，不能对这个自旋的参数就行控制，这个功能交给了jvm底层去自适应。

#### 7.4，锁粗化和锁消除

**锁粗化**指的是对同一个对象重复加锁，jvm在编译期间会进行优化操作，将多个锁变成一个锁。由于每个append内部都有一个synchronized锁，因此内部会做一个合并，将多个锁拆成一个锁

```java
StringBuffer stringBuffer = new StringBuffer();
stringBuffer.append("first").append("second").append("three);
```

在jvm中，对象有可能并不是垃圾回收器回收的，而是随着入栈出栈被销毁的，这种技术叫**逃逸分析**。逃逸分析主要有三种情况，一种是标量替换，一种是栈上分配，还有一种是同步省略。这里主要讲的就是同步省略，同步省略又被称为**锁消除**，指的就是jit即时编译器发现每次调用的方法锁的都不是同一个对象，锁了跟没锁一样，而且效率还更慢，那么就直接会将这把锁给消除。

标量替换和栈上分配可以看本人的jvm的博客[https://zhenghuisheng.blog.csdn.net/article/details/129796509](https://zhenghuisheng.blog.csdn.net/article/details/129796509)

```java
for(int i = 0; i < 100 ; i++){
    Student stu = new Student();
	//发现每次调用该方法锁的根本不是同一个对象，因此会将这个锁消除
	synchronized(stu){
    	System.out.println("helloi stu");
	}
}
```

### 8，synchronized锁误区

**详情可以查看c++底层源码**

1，锁的不可逆指的是轻量级锁到重量级锁是不可逆的，但是也存在轻量级锁到无锁或者重量级锁到无锁的状态

2，不存在无锁到偏向锁的过程，这两把锁相对独立，但是偏向锁可以撤销成无锁

3，轻量级锁中，不存在cas自旋，里面是属于线程交互执行，一旦没拿到锁，则立马升级膨胀，最后拿到monitor对象之后，直接升级成重量级锁

如有转载，请标明出处：[/zhuanlan/java/concurrency/12/4.html](/zhuanlan/java/concurrency/12/4.html)
