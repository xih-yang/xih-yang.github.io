# 03、Java并发编程 - 基础（乐观锁与CAS）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/3.html
- 分类：Java并发
- 分组：教程目录
## CAS乐观锁

## 1.1 思考

看下⾯代码进⾏思考，此时number前⾯是加了volatile关键字修饰的，volatile不保证原⼦性，那么使⽤AtomicInteger是如何保证原⼦性的？这⾥的原理是什么？CAS

```java
class MyData {
	volatile int number = 0;
	AtomicInteger atomicInteger=new AtomicInteger();
	public void addPlusPlus(){
		number++;
	}
	public void addAtomic(){
		atomicInteger.getAndIncrement();
	}
	public void setTo60() {
		this.number = 60;
	}
}
```

**CAS的全称为Compare-And-Swap，⽐较并交换，是⼀种很重要的同步思想。它是⼀条CPU并发原语。**

它的功能是判断主内存某个位置的值是否为跟期望值⼀样，相同就进⾏修改，否则⼀直重试，直到⼀致为⽌。`这个过程是原⼦的。`

看下⾯这段代码，思考运⾏结果是

```java
/**
 * CAS的全称为Compare-And-Swap，比较并交换，是一种很重要的同步思想。它是一条CPU并发原语。
 * 它的功能是判断主内存某个位置的值是否为跟期望值一样，相同就进行修改，否则一直重试，直到一致为止。这个过程是原子的。
 */
public class CASDemo {
    public static void main(String[] args) {
        AtomicInteger atomicInteger = new AtomicInteger(5);
        //CAS操作
        System.out.println(atomicInteger.compareAndSet(5, 2000)+"\t最终值:"+ atomicInteger.get());
        System.out.println(atomicInteger.compareAndSet(5, 1024)+"\t最终值:"+ atomicInteger.get());
    }
}
```

第⼀次修改，期望值为5，主内存也为5，修改成功，为2020。第⼆次修改，期望值为5，主内存为2020，修改失败，需要重新获取主内存的值 。

查看`AtomicInteger.getAndIncrement()` ⽅法，发现其没有加 `synchronized` 也实现了同步。这是为什么？

native：本地方法是C语言编写的，Unsafe这个类的几乎全是native方法，也就是说这个类是和电脑硬件打交道的。

C语言是可以直接操作计算机内存地址的，JAVA本身是不可以直接操作，但是Java中这个Unsafe类是可以直接操作计算机中的内存地址和CPU。

CAS并发原语体现在JAVA语⾔中就是sum.misc.Unsafe类中的各个⽅法。看⽅法源码，调⽤UnSafe类中的CAS⽅法，JVM会帮我们实现出**CAS汇编指令**。这是⼀种完全依赖于硬件的功能，通过它实现了原⼦操作。再次强调，由于CAS是⼀种系统原语，`原语属于操作系统⽤语范畴，是由若⼲条指令组成的，⽤于完成某个功能的⼀个过程，并且原语的执⾏是连续的，在执⾏过程中不允许被中断，也就是说CAS是⼀条CPU的原⼦指令，不会造成所谓的数据不⼀致问题。`

## 1.2 动画演示

乐观锁：不加锁，假设没有冲突去完成某项操作，如果因为冲突失败就重试，直到成功为止。其实现方式有一种比较典型的就是Compare and Swap( CAS )。

CAS机制当中使用了3个基本操作数：内存地址V，旧的预期值A，要修改的新值B。

更新一个变量的时候，只有当变量的预期值A和内存地址V当中的实际值相同时，才会将内存地址V对应的值修改为B。

这样说或许有些抽象，我们来看一个例子：

**1、** 在内存地址V当中，存储着值为10的变量；

**2、** 此时线程1想要把变量的值增加1对线程1来说，旧的预期值A=10，要修改的新值B=11；

**3、** 在线程1要提交更新之前，另一个线程2抢先一步，把内存地址V中的变量值率先更新成了11；

**4、** 线程1开始提交更新，首先进行A和地址V的实际值比较（Compare），发现A不等于V的实际值，提交失败；

**5、** 线程1重新获取内存地址V的当前值，并重新计算想要修改的新值此时对线程1来说，A=11，B=12这个重新尝试的过程被称为自旋；

**6、** 这一次比较幸运，没有其他线程改变地址V的值线程1进行Compare，发现A和地址V的实际值是相等的；

**7、** 线程1进行SWAP，把地址V的值替换为B，也就是12；

从思想上来说，Synchronized属于悲观锁，悲观地认为程序中的并发情况严重，所以严防死守。CAS属于乐观锁，乐观地认为程序中的并发情况不那么严重，所以让线程不断去尝试更新。

## 1.3 CAS底层原理

**AtomicInteger内部的重要参数**

**1. Unsafe**

是CAS的核⼼类，由于Java⽅法⽆法直接访问底层系统，需要通过本地（native）⽅法来访问，Unsafe相当于⼀个后门，基于该类可以直接操作特定内存的数据。Unsafe类存在于sum.misc包中，其内部⽅法操作可以像C的指针⼀样直接操作内存，因此Java中CAS操作的执⾏依赖于Unsafe类的⽅法。

注意Unsafe类中的所有⽅法都是native修饰的，也就是说Unsafe类中的⽅法都直接调⽤操作系统底层资源执⾏相应任务

**2. 变量valueOffset**，表示该变量值在内存中的偏移地址，因为Unsafe就是根据内存偏移地址获取数据的。

**3. 变量value⽤volatile修饰**，保证了多线程之间的内存可⻅性。

> 本地方法native想和计算机C语言打交道，他们中间要通过Java和C语言交互的规范，这个规范叫JNI（Java Native Interface）

`AtomicInteger.getAndIncrement()` 调⽤了 `Unsafe.getAndAddInt()` ⽅法。 Unsafe 类的⼤部分⽅法都是 native 的，⽤来像C语⾔⼀样从底层操作内存。

C语句代码JNI，对应java⽅法 `public final native boolean compareAndSwapInt(Object var1, long var2, int var4, int var5)`

> 下面这段代码不是C语言代码，而是C语言中的.h头文件里面的一个接口说明的代码

```java
//JNIENV *env：C语言的一个指针，JNI环境指针，这个指针不是我们这边提供的
//jobject unsafe：不安全类对象，代表的就是我们java中的Unsafe类
//jlong obj：obj就是上面Unsafe.compareAndSwapInt方法的第一个入参对象的地址值
//jlong offset，jint e,jint x：依次对应compareAndSwapInt方法的入参
UNSAFE_ENTRY(jboolean, Unsafe_CompareAndSwapInt(JNIEnv *env, jobject unsafe, jlong obj, jlong offset,jint e, jint x))
	UnsafeWrapper("Unsafe_CompareAndSwapInt");
	oop p = JNIHandles::resolve(obj);//c语言中根据地址获取对象
	jint* addr = (jint *)index_oop_from_field_offset_long(p, offset);//根据对象和属性偏移量获取对应属性在物理内存中的真实地址
	return (jint)(Atomic::cmpxchg(x,addr,e))==e;
UNSAFE_END
//先想办法拿到变量value在内存中的地址addr。
//通过Atomic::cmpxchg实现⽐较替换，其中参数x是即将更新的值，参数e是原内存的值。
```

这个⽅法的var1和var2，就是根据**对象**和**偏移量**得到在**主内存的快照值**var5。然后 `compareAndSwapInt` ⽅法通过var1和var2得到**当前主内存的实际值**。如果这个**实际值**跟**快照值**相等，那么就更新主内存的值为var5+var4。如果不等，那么就⼀直循环，⼀直获取快照，⼀直对⽐，直到实际值和快照值相等为⽌。

> 参数介绍
>
>
> var1 AtomicInteger对象本身
> var2 该对象属性value值的引⽤地址
> var4 需要变动的数量
> var5 是通过var1和var2，根据对象和偏移量得到在主内存的快照值var5

⽐如有A、B两个线程，⼀开始都从主内存中拷⻉了原值为3，A线程执⾏到 var5=this.getIntVolatile ，即var5=3。此时A线程挂起，B修改原值为4，B线程执⾏完毕，由于加了volatile，所以这个修改是⽴即可⻅的。A线程被唤醒，执⾏ this.compareAndSwapInt() ⽅法，发现这个时候主内存的值不等于快照值3，所以继续循环，重新从主内存获取。

> CAS + voliate 实现乐观锁

## 1.4 CAS缺点

CAS实际上是⼀种⾃旋锁

- **1. CPU开销较大**

在并发量比较高的情况下，如果许多线程反复尝试更新某一个变量，却又一直更新不成功，循环往复，会给CPU带来很大的压力。
- **2. 不能保证代码块的原子性**

`CAS机制所保证的只是一个变量的原子性操作，而不能保证多个共享变量或整个代码块的原子性。`比如需要保证3个变量共同进行原子性的更新，就不得不使用Synchronized了。
- 引出了**ABA问题**。

## 1.5 CAS会导致"ABA问题"

所谓ABA问题，就是CAS算法实现需要取出内存中某时刻的数据并在当下时刻⽐较并替换，这⾥存在⼀个时间差，那么这个时间差可能带来意想不到的问题。

⽐如，⼀个线程B 从内存位置Value中取出2，这时候另⼀个线程A 也从内存位置Value中取出2，并且线程A 进⾏了⼀些操作将值变成了5，然后线程A ⼜再次将值变成了2，这时候线程B 进⾏CAS操作发现内存中仍然是2，然后线程B 操作成功。

`尽管线程B的CAS操作成功，但是不代表这个过程就是没有问题的。`

- 有这样的需求，⽐如CAS，只注重头和尾，只要⾸尾⼀致就接受。
- 但是有的需求，还看重过程，中间不能发⽣任何修改，这就引出了 AtomicStampedReference 原⼦标记引⽤。

> 先看AtomicReference

### AtomicReference原⼦引⽤

`AtomicInteger` 对整数进⾏原⼦操作，如果是⼀个POJO呢？可以⽤ `AtomicReference` 来包装这个POJO，使其操作原⼦化。

```java
public class AtomicReferenceDemo {
    public static void main(String[] args) {
        User user1 = new User("Jack",25);
        User user2 = new User("Tom",21);
        AtomicReference<User> atomicReference = new AtomicReference<>();
        atomicReference.set(user1);
        //CAS操作
        System.out.println(atomicReference.compareAndSet(user1,user2)+"\t"+atomicReference.get()); // true
        //CAS操作
        System.out.println(atomicReference.compareAndSet(user1,user2)+"\t"+atomicReference.get()); //false
    }
}
```

**原理：**

和AtomicInteger类似，底层利用unsafe.compareAndSwapObject

### ABA问题的解决(AtomicStampedReference 类似于时间戳)

```java
ThreadA		100 1			2020 2
ThreadB 	100 1	111 2 	100 3
```

> 线程A获取变量100，此时版本号为1，线程B也获取变量100，版本号为1，然后更新为111，此时版本号为2，之后又将变量更新回100，但是此时版本号已经是3了，虽然值还是100，这时线程A拿着版本号1的变量100想更新是不会成功的。

使⽤`AtomicStampedReference` 类可以解决ABA问题。这个类维护了⼀个“**版本号**”Stamp，`在进⾏CAS操作的时候，不仅要⽐较当前值，还要⽐较版本号。只有两者都相等，才执⾏更新操作。`

解决ABA问题的关键⽅法：

> 参数说明：
>
>
> V expectedReference, 预期值引⽤
> V newReference, 新值引⽤
> int expectedStamp， 预期值时间戳、版本号
> int newStamp, 新值时间戳 、版本号

真正进行CAS比较的时候，就像比较一个普通对象一样：

**效果演示：**

```java
/**
 * ABA问题
 */
public class ABADemo {
    static AtomicReference<Integer> atomicReference = new AtomicReference<>(100);
    //带有时间戳的原子引用 (共享内存值100， 版本号为1)
    static AtomicStampedReference<Integer> atomicStampedReference = new AtomicStampedReference<>(100, 1);
    public static void main(String[] args) {
        System.out.println("========ABA问题的产生=========");
        new Thread(()->{
            //CAS
            atomicReference.compareAndSet(100, 111);
            //CAS
            atomicReference.compareAndSet(111, 100);
        }, "t1").start();
        new Thread(()->{
            try {
            	TimeUnit.SECONDS.sleep(1); 
           	} catch (InterruptedException e) {
           		e.printStackTrace(); 
        	}
            //CAS
            System.out.println(atomicReference.compareAndSet(100, 2020) +"\t"+atomicReference.get());
        }, "t2").start();
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("=========ABA问题的解决===========");
        new Thread(()->{
            //获取第一次的版本号
            int stamp = atomicStampedReference.getStamp();
            System.out.println(Thread.currentThread().getName()+"\t第一次版本号"+ stamp);
            //CAS
            try {
            	TimeUnit.SECONDS.sleep(1); 
           	} catch (InterruptedException e) {
           		e.printStackTrace(); 
          	}
            atomicStampedReference.compareAndSet(
                    100,
                    111,
                    atomicStampedReference.getStamp(),
                    atomicStampedReference.getStamp()+1
            );
            System.out.println(Thread.currentThread().getName()+"\t第二次版本号："+ atomicStampedReference.getStamp());
            //CAS
            atomicStampedReference.compareAndSet(
                    111,
                    100,
                    atomicStampedReference.getStamp(),
                    atomicStampedReference.getStamp()+1
            );
            System.out.println(Thread.currentThread().getName()+"\t第三次版本号："+ atomicStampedReference.getStamp());
        }, "t3").start();
        new Thread(()->{
            //获取第一次的版本号
            int stamp = atomicStampedReference.getStamp();
            System.out.println(Thread.currentThread().getName()+"\t第一次版本号"+ stamp);
            //CAS
            try {
            	TimeUnit.SECONDS.sleep(3); 
           	} catch (InterruptedException e) {
           		e.printStackTrace(); 
          	}
            boolean result = atomicStampedReference.compareAndSet(
                    100,
                    2020,
                    stamp,
                    stamp + 1
            );
            System.out.println(
                    Thread.currentThread().getName()
                    +"\t修改是否成功："+result
                    +"\t当前最新的版本号："+atomicStampedReference.getStamp()
                    +"\t当前最新的值："+atomicStampedReference.getReference()
            );
        }, "t4").start();
    }
}
```
