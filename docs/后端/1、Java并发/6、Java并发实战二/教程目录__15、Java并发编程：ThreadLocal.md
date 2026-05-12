# 15、Java并发编程：ThreadLocal
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/15.html
- 分类：Java并发
- 分组：教程目录
**ThreadLocal简介**

ThreadLocal翻译过来就是线程本地变量，初学者可能以为ThreadLocal是指一个Thread，其实说白了，ThreadLocal就是一个成员变量，只不过这是一个特殊的变量——变量值总是与当前线程（调用Thread.currentThread()得到）相关联。既然ThreadLocal是一个变量，那么其作用是是什么呢？说得抽象点就是提供了线程封闭性，说得具体点就是为每个使用该变量的线程提供一个变量的副本，这样每个使用该变量的线程都有一个副本，从而将线程之间对变量的访问隔离开来了，对变量的操作互不影响。

当访问共享的可变数据时（因为还有final类型的不可变数据），通常会使用同步机制，因为同步需要加锁，所以在效率上可能会收到影响。一种避免使用同步的方式就是不共享数据。因为在单线程内访问数据就不需要考虑同步。这就是对线程封闭的解释，同时也是ThreadLocal设计的核心思想。当某个对象被线程封闭在一个线程内部时，该对象就自动实现了线程安全性。ThreadLocal具体做了什么事呢？它使线程中的某个值与当前线程关联在一起，实现“一处设置处处调用”。

所以对比同步机制与ThreadLocal，可以得出同步通过加锁的方式实现了线程数据共享，也就是以时间换空间，而ThreadLocal则是以变量副本的方式通过以空间换时间的手段实现线程数据共享。

**设计一个ThreadLocal**

根据上面的描述，设计ThreadLocal的关键在于将值与访问该值的对象，也就是当前线程，关联起来。下面的代码实现了这一功能：

```java
package com.ddkk.patchwork.concurrency.r0408;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-8.
 */
public class DemoThreadLocal {
    /**
     * 用来关联值与当前线程的Map
     */
    private Map<Thread,Object> localMap = Collections.synchronizedMap(new HashMap<Thread, Object>());
    /**
     * 设置值与线程关联
     * @param copyValue
     */
    public void set(Object copyValue){
        //1、key为当前访问值的线程，value为值的副本
        localMap.put(Thread.currentThread(),copyValue);
    }
    /**
     * 得到当前线程关联的值
     * @return
     */
    public Object get(){
        //获取当前线程
        Thread currentThread = Thread.currentThread();
        //根据当前线程得到值
        Object value = localMap.get(currentThread);
        if (value == null || !localMap.containsKey(currentThread)){
            value = initialValue();
            localMap.put(currentThread,value);
        }
        return value;
    }
    /**
     * 对值进行初始化
     * @return
     */
    protected Object initialValue() {
        return null;
    }
}
```

这大概就是一个最简单版本的ThreadLocal了，在使用的时候把DemoThreadLocal作为内部私有的不可变类，就可以实现“一处设置处处调用”的简单功能了。但是在工程实践中，设计需要考虑的问题多得多，设计也就更复杂。

**ThreadLocal的设计原理**

ThreadLocal通常用于**防止对可变的单实例变量或者全局变量进行共享**。在单线程中往往可能使用一个全局的数据库连接，这样就可以避免在每次调用每个方法时都需要实例化该数据库连接。通常在JDBC中使用的数据库连接就使用到了ThreadLocal，每个线程都有一个属于自己的数据库连接，达到了线程隔离的目的。代码通常是这样的：

```java
package com.ddkk.patchwork.concurrency.r0408;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-8.
 */
public class ConnectionManager {
    private static ThreadLocal<Connection> connectionHolder = new ThreadLocal<Connection>() {
        @Override
        protected Connection initialValue() {
            Connection conn = null;
            try {
                conn = DriverManager.getConnection(
                        "jdbc:mysql://localhost:3306/test", "username",
                        "password");
            } catch (SQLException e) {
                e.printStackTrace();
            }
            return conn;
        }
    };
    public static Connection getConnection() {
        return connectionHolder.get();
    }
    public static void setConnection(Connection conn) {
        connectionHolder.set(conn);
    }
}
```

上面的代码也演示了如何使用ThreadLocal，下面就分析一下ThreadLocal是如何实现将当前线程与访问的值关联起来的？其实原理和简化版的实现是一样的，都是通过一个map，不过在ThreadLocal的实现中，是**ThreadLocalMap**，它是ThreadLocal的一个变量，看代码就知道了：

```java
    public void set(T value) {
        //得到当前线程
        Thread t = Thread.currentThread();
        //根据当前线程得到一个map
        ThreadLocalMap map = getMap(t);
        //如果map不为空则调用set进行关联
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
    }
```

上面的代码与简化版实现如出一辙，首先根据当前线程得到ThreadLocalMap对象，如果map不为空则直接将当前线程与value（访问的值）关联起来；如果map为空则创建一个ThreadLocalMap。

通过源码可以发现ThreadLocalMap是ThreadLocal类的一个静态内部类，它实现了键值对的设置和获取（对比Map对象来理解），每个线程中都有一个独立的ThreadLocalMap副本，它所存储的值只能被当前线程读取和修改。ThreadLocal类通过操作每一个线程特有的ThreadLocalMap副本，从而实现了变量访问在不同线程中的隔离。因为每个线程的变量都是自己特有的，完全不会有并发错误。还有一点就是，ThreadLocalMap存储的键值对中的键是this对象指的是ThreadLocal对象，而值就是你所设置的对象了（这里是Connection）。

```java
    ThreadLocal.ThreadLocalMap threadLocals = null;
    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }
```

从代码可以看到，getMap就是获取一个名为threadLocals的变量，而这个变量的类型就是ThreadLocalMap，这就是说对于每个不同的线程都有一个ThreadLocalMap。这样每个线程都有一个ThreadLocalMap，就可以实现线程之间的的隔离了。所以线程对变量的操作实际上都在各自的ThreadLocalMap保存一份该值的副本。下面我们看看在ThreadLocalMap是如何设置的：

```java
private void set(ThreadLocal<?> key, Object value) {
            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);
            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                ThreadLocal<?> k = e.get();
                if (k == key) {
                    e.value = value;
                    return;
                }
                if (k == null) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }
            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }
```

如果熟悉HashMap，这实际上就是HashMap的一个put操作：首先在Entry数组中判读是否存在key为传入的key的Entry，如果存在则覆盖；如果key为null则进行替换。如果上述条件都不满足则创建一个Entry对象放入Entry数组中。

接下来，看看get方法是如何实现的：

```java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }
    private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
        return value;
    }
```

在获取和当前线程绑定的值时，ThreadLocalMap对象是以this指向的ThreadLocal对象为键进行查找的，这和前面set()方法的代码是相呼应的。如果之前通过this作为key找到了则直接返回，如果没有找到则调用setInitialValue()方法。该方法首先得到在实现代码初始化的value（在我们的代码中Connection，也就是说value是Connection），然后执行和之前set方法一样的操作。

由于ThreadLocal使用的时候每个线程都有自己的ThreadLocalMap，那么是否会出现OOM的问题呢？答案可以在以下的源码中得到答案：

```java
static class Entry extends WeakReference<ThreadLocal<?>> {
            Object value;
            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

可以看到Entry对象是一个弱引用，根据弱引用的特点：在垃圾回收器线程扫描它所管辖的内存区域的过程中，一旦发现了只具有弱引用的对象，不管当前内存空间足够与否，都会回收它的内存。所以在线程终止后，ThreadLocalMap对象就会被当做垃圾回收掉，自然也就不用担心内存泄露的问题了。

**一个完整的ThreadLocal例子**

```java
package com.ddkk.patchwork.concurrency.r0408;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-8.
 */
public class PersonThreadLocalDemo {
    private static final ThreadLocal<Person> personLocal = new ThreadLocal<>();
    private static final Random ran = new Random();
    private static final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    /**
     * 不同的线程并发修改Person的age属性
     */
    static class Wokrer implements Runnable{
        @Override
        public void run() {
            doExec();
        }
        private void doExec() {
            System.out.println(Thread.currentThread().getName() + " start task at "
                    + format.format(new Date()));
            //不同的线程会会将age属性设置成不同的值
            int age = ran.nextInt(20);
            Person p = getPerson();
            //设置年龄
            p.setAge(age);
            System.out.println(Thread.currentThread().getName() + ": set age to " + p.getAge() + " at "
                + format.format(new Date()));
            try {
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(Thread.currentThread().getName() + ": get age " + p.getAge() + " at "
                + format.format(new Date()));
        }
        protected Person getPerson() {
            Person p = personLocal.get();
            if (p == null){
                p = new Person();
                personLocal.set(p);
            }
            return p;
        }
    }
    public static void main(String[] args){
        Wokrer wokrer = new Wokrer();
        new Thread(wokrer,"worker-1").start();
        new Thread(wokrer,"worker-2").start();
    }
}
```

运行结果如下：

**ThreadLocal小结**

**1、** ThreadLocal是指线程本地变量，不是指Thread；

**2、** ThreadLocal使用场合主要解决多线程中数据数据因并发产生不一致问题也就是说如果想每个线程都在操作共享数据的时候不互相影响，但是又不想使用同步解决，那么ThreadLocal会是你的菜；

**3、** ThreadLocal实现线程隔离的核心在于为每个访问该值的线程都创建了一个ThreadLocalMap，这样不同的线程在操作共享数据时可以不互相影响；

**4、** 与synchronized的区别：synchronized用于线程间的数据共享，而ThreadLocal则用于线程间的数据隔离两者使用的领域不同，ThreadLocal并不是为了替代synchronized而出现的，而且ThreadLocal不能实现原子性，因为ThreadLocal的ThreadLocalMap的操作实际的作用范围是单线程，与多线程没有任何关系；

**5、** 在多线程情况下使用ThreadLocal而创建的ThreadLocalMap是否会出现内存溢出：答案是不会因为存储数据的Entry是弱引用，线程执行结束后会自动被垃圾回收；
