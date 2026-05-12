# 17、Java JUC 源码分析 - JUC下LockSupport类
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/17.html
- 分类：Java并发
- 分组：教程目录
## 1、初识LockSupport

这个类是java.util.concurrent.locks包下的一个线程阻塞工具类。我们打开这个类的源码，他的注释第一句就是：

```java
Basic thread blocking primitives for creating locks and other synchronization classes.
```

翻译过来：用于创建锁和其他同步类的基本线程阻塞原语。阅读了源码之后其实也不难理解这句话，其实这个类它的最主要作用是挂起和唤醒线程，而且这个工具类是创建锁和其他同步类的基础。

LockSupport这个类底层是Unsafe类来实现的，而且他的每个方法都是静态方法，方便我们直接调用。

## 2、LockSupport的常用方法及使用

再讲方法之前，有一个要注意的地方。我们的LockSupport类与每个使用它的的线程都会关联一个许可证，而且在默认情况下调用LockSupport类的方法的线程是没有许可证的。

### 2.1 void park()方法

这个方法翻译过来是停车的意思，对于我们也很好理解。线程就像一辆行驶的汽车，我们这个方法就是让线程阻塞，让这辆车停下来。

如果调用park方法的线程拿到了许可证，那么调用LockSupport.park()方法就会马上返回，否则就会被禁止参与线程调度，也就是我们所说的阻塞。其实用起来十分简单，这里我举了一个简单的例子:

```java
public class LockSupportDemo {
    public static void main(String[] args) {
        System.out.println("main thread begin");
        LockSupport.park();
        System.out.println("main thread end");
    }
}
```

如上代码，如果直接在main线程里面调用park方法，最终只会输main thread begin，然后main线程被挂起，因为在默认情况下，调用的线程是没有许可证的，所以main线程会一直阻塞。这个时候如果其他线程调用了阻塞线程的interrupt()方法，设置了中断标志或者线程被虚假唤醒，则main线程也会返回（这里是不会抛出InterruptedException的），所以在调用park方法时，最好也使用循环条件判断。

那么我们要如何唤醒呢？

### 2.2 void unpark(Thread thread)方法

其实这个方法也很简单，你可以把它理解成为给它的参数，thread线程发放许可证。当一个线程调用unpark的时候，如果参数thread线程没有持有许可证，这个时候就会让thread线程持有。如果这个线程之前因为调用了park()方法而阻塞了，那么调用了unpark()就会立即被唤醒。如果thread之前没有调用park，那么调用unpark后，在调用park也会立即唤醒。

我们把上面的代码稍作修改，你就会明白了：

```java
public class LockSupportDemo {
    public static void main(String[] args) {
        System.out.println("main thread begin");
        LockSupport.unpark(Thread.currentThread());
        LockSupport.park();
        System.out.println("main thread end");
    }
}
```

我把unpark放在了前面，这样做就会直接输出这两句话，因为我们在park方法之前，给main线程发放了我们的许可证。下面我们再来看一个例子，加深对park和unpark的理解。

```java
public class UnparkDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("子线程开始了");
                LockSupport.park();
                System.out.println("子线程结束了");
            }
        });
        //启动子线程
        thread.start();
        //主线程休眠1s
        Thread.sleep(1000);
        System.out.println("mian线程开始调用unpark");
        //给thread线程发放许可证
        LockSupport.unpark(thread);
    }
}
```

如上代码：我们首先创建了一个子线程thread，子线程启动后调用park方法，由于在默认情况下子线程是没有许可证的，所以他会把自己挂起。主线程休眠1s，是为了有充分的时间，让子线程输出"子线程开始了"。主线程执行unpark方法，参数为子线程，这样会让子线程拥有许可证，然后子线程就不会被阻塞了。

我们再来看一个例子：

```java
public class UnparkDemo2 {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("子线程开始了");
                //调用park方法挂起自己，只有线程被中断才会退出循环
                while (! Thread.currentThread().isInterrupted()){
                    LockSupport.park();
                }
                System.out.println("子线程结束了");
            }
        });
        //启动子线程
        thread.start();
        //主线程休眠1s
        Thread.sleep(1000);
        System.out.println("mian线程开始调用interrupt()");
        //中断thread线程
        thread.interrupt();
    }
}
```

如上代码。只有中断了子线程，子线程的运行才会结束，如果子线程没有中断，即使你调用了unpark，子线程也不会结束。我们也可以使用像如上代码一样的方法，来对比线程状态。

### 2.3 void parkNanos(long nanos)方法

这个方法其实和park方法类似，如果调用该方法的线程已经拿到了许可证，那么这个方法就会被立即返回，如果没有拿到许可证，那么调用的线程就会等待nanos时间后，修改为自动返回。使用起来也和park一样，十分简单。

### 2.4 void park(Object blocker)方法

带有blocker参数的park方法，当线程在没有许可证的情况下，调用park方法而被阻塞挂起，那么这个blocker就会被记录到该线程内部。使用诊断工具我们可以查看线程被阻塞的原因，诊断工具可以通过getBlocker(Thread thread)方法来获取blocker对象，所以JDK推荐我们使用带blocker的park方法，并且blocker被设置为this，这样当在打印线程堆栈排除问题时，就能知道是哪个类被阻塞了。

举个例子，如下代码：

```java
public class ParkDemo {
    public void testPark(){
        LockSupport.park();
    }
    public static void main(String[] args) {
        ParkDemo parkDemo = new ParkDemo();
        parkDemo.testPark();
    }
}
```

运行代码后，我们先不着急把它关闭。在cmd里面输入

> wmic process where caption=“java.exe” get processid,caption,commandline /value

这个命令，然后找到你当前运行的mian方法的那个进程id

然后使用jstack pid（这里的pid是你刚才查出来的id），然后你就会发现如下代码：

修改上面的java代码为：

```java
public class ParkDemo {
    public void testPark(){
        LockSupport.park(this);
    }
    public static void main(String[] args) {
        ParkDemo parkDemo = new ParkDemo();
        parkDemo.testPark();
    }
}
```

在执行如上步骤，得到的结果：

我们看到，我们使用带blocker参数的park方法，我们的堆栈会给我们更多的有关与阻塞对象的信息。

### 2.5 void parkNanos(Object blocker，long nanos)方法

这个方法相比我们的park(Object blocker)多了一个超时的时间而已，用法大致相同，这里不做过多的赘述。

### 2.6 void parkUntil(Object blocker , long deadline)方法

这个方法我们来稍微看一下源码：

```java
public static void parkUntil(Object blocker, long deadline) {
    //先获取当前线程
    Thread t = Thread.currentThread();
    //给当前线程设置blocker
    setBlocker(t, blocker);
    //等待到deadline这个时间，然后自动返回
    UNSAFE.park(true, deadline);
    //清除blocker
    setBlocker(t, null);
}
```

上述代码的deadline是一个时间点，long类型，到达了这个时间点，该方法就会自动返回。

## 3、简单例子

到这里我们常用的方法就讲的差不多了，我们来看一个小小的例子

```java
public class FIFOMutex {
    private final AtomicBoolean locked = new AtomicBoolean(false);
    private final Queue<Thread> waiters = new ConcurrentLinkedDeque<Thread>();
    public void lock(){
        boolean wasInterrupted = false;
        Thread current = Thread.currentThread();
        waiters.add(current);
        //判断当前线程是否在队首（1）
        while(waiters.peek() != current || !locked.compareAndSet(false,true)){
            LockSupport.park(this);
            //（2）
            if(Thread.interrupted()){
                wasInterrupted = true;
            }
        }
        waiters.remove();
        //（3）
        if(wasInterrupted){
            current.interrupt();
        }
    }
    public void unlock(){
        locked.set(false);
        LockSupport.unpark(waiters.peek());
    }
}
```

其实上面的代码是一个先进先出的锁，也就是只有队列的首元素可以获取锁。在代码（1）处，如果当前线程不是队首或者当前锁已经被其他线程获取了，那么就调用park方法挂起自己。

然后在代码（2）处判断，如果park方法是因为被中断而返回的，则忽略中断，并且重置中断标记，做个标记，然后再次判断当前线程是不是队首，或者当前锁是否已经被其他线程获取，如果是则继续调用park方法挂起自己。

然后在代码（3）中判断一下标记，如果标记为true则中断该线程，这个怎么理解呢？其实就是其他线程中断了该线程，虽然我对中断信号并不感兴趣，忽略他，但是不代表其他线程对该标志不感兴趣，所以要恢复一下
