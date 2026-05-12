# 06、Java JUC 源码分析 - ThreadLocal
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/6.html
- 分类：Java并发
- 分组：教程目录
## 1、简单了解ThreadLocal

ThreadLocal是JDK包提供的一个类，它提供了线程本地变量，也就是说如果你创建了一个ThreadLocal变量，那么访问这个变量的每个线程都会有一个这个变量的副本。当多个线程操作这个变量的时候，其实是操作自己的副本变量，也就是每个线程所拥有的本地变量，这样就避免了线程安全访问的问题。当创建了一个ThreadLocal变量后，每个线程都会复制一个变量到自己的本地内存。

如果你还不是太理解，我这里来打个比方。线程就相当于一个人一样，而线程要做的事相当于一个任务，任务来了，人来处理，处理完毕之后，再处理下一个任务。人身上是不是有很多口袋，人刚开始准备处理任务的时候，我们把任务的编号放在处理者的口袋中，然后处理者一路携带着，处理过程中如果需要用到这个编号，直接从口袋中获取就可以了。那么刚好java中线程设计的时候也考虑到了这些问题，Thread对象中就有很多口袋，用来放东西。Thread类中有这么一个变量：

> ThreadLocal.ThreadLocalMap threadLocals = null;

这个就是用来操作Thread中所有口袋的东西，ThreadLocalMap源码中有一个数组（有兴趣的可以去看一下源码），对应处理者身上很多口袋一样，数组中的每个元素对应一个口袋。

如何来操作Thread中的这些口袋呢，java为我们提供了一个类ThreadLocal，ThreadLocal对象用来操作Thread中的某一个口袋，可以向这个口袋中放东西、获取里面的东西、清除里面的东西，这个口袋一次性只能放一个东西，重复放东西会将里面已经存在的东西覆盖掉。

## 2、使用ThreadLocal的简单示例

话不多说，直接上代码，看代码才能知道怎么用。

```java
public class ThreadLocalTest {
    //1.创建ThreadLocal变量 为Sring类型
    public static ThreadLocal<String> localVariable = new ThreadLocal<>();
    //2.创建一个打印ThreadLocal的方法
    public static void printThreadLcoal(String str){
        //打印当前线程的ThreadLocal变量的值
        System.out.println(str+":"+localVariable.get());
        //清除ThreadLocal的值
        localVariable.remove();
    }
    public static void main(String[] args) {
        //1.创建线程One
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                //设置One线程的ThreadLocal值
                localVariable.set("ThreadOne local variable");
                //将One线程的ThreadLocal值打印出来
                printThreadLcoal("threadOne");
                //打印清除之后的ThreadLocal的值
                System.out.println("ThreadOne remove after"+":"+localVariable.get());
            }
        });
        //1.创建线程Two
        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                //设置Two线程的ThreadLocal值
                localVariable.set("ThreadTwo local variable");
                //将Two线程的ThreadLocal值打印出来
                printThreadLcoal("threadTwo");
                //打印清除之后的ThreadLocal的值
                System.out.println("ThreadTwo remove after"+":"+localVariable.get());
            }
        });
        //启动线程
        threadOne.start();
        threadTwo.start();
    }
}
```

代码里面都有注释，相信大家都能看懂。其中无非就是set和get还有remove几个方法。

## 3、从源码深入理解ThreadLocal

从上面我们可以知道，ThreadLocal是用来操作口袋的，也就是往口袋里面装东西，拿东西的。而口袋又是属于线程的。所以让我们先来看看Thread的源码中有关口袋的定义：

```java
/* ThreadLocal values pertaining to this thread. This map is maintained
 * by the ThreadLocal class. */
ThreadLocal.ThreadLocalMap threadLocals = null;
/*
 * InheritableThreadLocal values pertaining to this thread. This map is
 * maintained by the InheritableThreadLocal class.
 */
ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
```

翻译一下注释里面的内容：第一段是与此线程相关的threadlocal值。此映射由threadlocal类维护。第二段是与此线程相关的可继承的threadlocal值。此映射由threadlocal类维护。

单看翻译好像不太能理解哦。我这里解释一下，其实这就是在Thread类里面定义了两个变量，是Map类型的，也就是键值对形式存在的，也就是我们所说的口袋。每个线程都会有的。我们ThreadLocal操作的正是这两个成员变量。只有当线程第一次调用ThreadLocal的set或者get方法时才会创建他们，也就是实例化。

接下来我们来看看ThreadLocal是怎样往口袋里面装东西的。下面是源码：代码的解释也在下面

```java
public void set(T value) {
    //获取当前线程
    Thread t = Thread.currentThread();
    //获取当前线程的Map，也就是拿到线程的口袋
    ThreadLocalMap map = getMap(t);
    //判断口袋里面是否为空
    if (map != null)
        //不是空的，就把当前ThreadLocal对象作为key，value值自己给定
        map.set(this, value);
    else
        //是空的就创建一个Map
        createMap(t, value);
}
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}
void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

下面看看他怎么获得口袋里面的东西吧

```java
public T get() {
    //获得当前线程
    Thread t = Thread.currentThread();
    //获得当前线程的口袋
    ThreadLocalMap map = getMap(t);
    //判断Map是否为空
    if (map != null) {
        //通过当前ThreadLocal对象找到对应的value
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}
//设置初始值，并返回初始值，这里的初始值为null
private T setInitialValue() {
    //将null赋值给value，initialValue()返回的就是null
    T value = initialValue();
    //获取当前线程
    Thread t = Thread.currentThread();
    //获得口袋
    ThreadLocalMap map = getMap(t);
    //日常判断一下口袋是否为空
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    //返回null
    return value;
}
```

## 4、ThreadLocal不支持继承性

先来看一段代码吧

```java
public class ThreadLocalExtendTest {
    //1.创建ThreadLocal变量 为Sring类型
    public static ThreadLocal<String> localVariable = new ThreadLocal<>();
    public static void main(String[] args) {
        //在父线程的口袋里面加入HelloWorld
        localVariable.set("Hello World");
        //创建并启动子线程
        new Thread(new Runnable() {
            @Override
            public void run() {
                //输出子线程口袋里面的值
                System.out.println("child:"+localVariable.get());
            }
        }).start();
        //输出父线程口袋里面的值
        System.out.println("main:"+localVariable.get());
    }
}
```

输出结果：

> main:Hello World
>
> child:null

从上面的代码来看，ThreadLocal在父线程中被设置后，在子线程里面是获取不到，因为这是两个不同的线程，只有父线程口袋里装了东西，子线程却并没有继承父线程的口袋，所以ThreadLocal并没有继承性。
