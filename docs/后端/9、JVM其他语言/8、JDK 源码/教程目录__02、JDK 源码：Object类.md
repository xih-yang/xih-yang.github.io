# 02、JDK 源码：Object类
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/2.html
- 分类：JDK 源码
- 分组：教程目录
## 引言

我们都知道，在Java中，Object是所有类的超类，所有的类其实都是隐含继承自Object类的，所以extends Object默认是不用写的，当然你写了也不会错。所有的类都可以使用Object类中的方法，下面我们按源码的顺序分别来介绍。

Object类中的常用方法有：toString(),getClass(),hashCode(),equals(),clone(),finalize()，其中，定义为final类型，不能重写的方法：getClass(),notify(),notifyAll(),wait()。

Object类中有部分方法是由native关键字修饰的，这代表使用native关键字说明这个方法是原生函数，也就是这个方法是用C/C++语言实现的，并且被编译成了DLL，由java去调用。这些函数的实现体在DLL中，JDK的源代码中并不包含，你应该是看不到的。对于不同的平台它们也是不同的。这也是java的底层机制，实际上java就是在不同的平台上调用不同的native方法实现对操作系统的访问的。所以native关键字的函数都是操作系统实现的。

#### 1.registerNatives方法

```java
    private static native void registerNatives();
    static {
        registerNatives();
    }
```

native修饰的方法，通常有c或c++实现。这个方法表示的是在类被加载时，调用 registerNatives()方法进行一些跟系统有关的方法调用，而这个方法的实现就在java.dll中（里面会根据不同系统来执行不同的底层操作）。

下面是JDK1.6中关联的C语言代码（来自OpenJDK 6）：

```java
static JNINativeMethod methods[] = {
    {"hashCode",    "()I",                    (void *)&JVM_IHashCode},
    {"wait",        "(J)V",                   (void *)&JVM_MonitorWait},
    {"notify",      "()V",                    (void *)&JVM_MonitorNotify},
    {"notifyAll",   "()V",                    (void *)&JVM_MonitorNotifyAll},
    {"clone",       "()Ljava/lang/Object;",   (void *)&JVM_Clone},
};
JNIEXPORT void JNICALL
Java_java_lang_Object_registerNatives(JNIEnv *env, jclass cls)
{
    (*env)->RegisterNatives(env, cls,
                            methods, sizeof(methods)/sizeof(methods[0]));
}
```

#### 2.getClass方法

```java
public final native Class<?> getClass();
```

getClass返回运行时的类类型，final修饰不能被子类继承，native表示也不是由Java实现的。一般与getName方法一起使用。它能获取类的定义信息，然后通过反射的方式获取类的元信息和方法信息，包括函数和字段。

#### 3.hashCode方法

```java
public native int hashCode();
```

hashCode被native修饰为本地方法，该方法返回该对象的哈希码值，重写了equals方法一般都要重写hashCode方法。注意下面几点：

**1、** hashCode的存在主要是用于查找的快捷性，如Hashtable，HashMap等，hashCode是用来在散列存储结构中确定对象的存储地址的；

**2、** 如果两个对象相同，就是满足于equals(Java.lang.Object)方法，那么这两个对象的hashCode一定要相同；

**3、** 如果对象的equals方法被重写，那么对象的hashCode也尽量重写，并且产生hashCode使用的对象，一定要和equals方法中使用的一致，否则就会违反上面第2点；

**4、** 两个对象的hashCode相同，并不一定表示两个对象就相同，也就是不一定适用于equals(java.lang.Object)方法，只能够说明这两个对象在散列存储结构中，如Hashtable，他们“存放在同一个篮子里”；

#### 4.equals方法

```java
public boolean equals(Object obj) {
    return (this == obj);
}
```

equals直接判断this和obj的值是否相等，即判断两个对象是否为同一个对象，通过==判断，表示只有当两个对象的内存地址值是相同的他们才是同一个对象。如果你希望两个不同地址但内容相同的对象在进行equals方法比较时，就需要对equals方法进行重写。比如String的equals就重写了，分为两个逻辑，先比较==，如果相等直接返回true；如果不等接下来再把字符串分成字符数组，一个一个字符进行比较，如果字符都相等，也返回true，代码如下：

```java
    //被String重写的equals方法
    public boolean equals(Object anObject) {
        if (this == anObject) {
            return true;
        }
        if (anObject instanceof String) {
            String anotherString = (String)anObject;
            int n = value.length;
            if (n == anotherString.value.length) {
                char v1[] = value;
                char v2[] = anotherString.value;
                int i = 0;
                while (n-- != 0) {
                    if (v1[i] != v2[i])
                        return false;
                    i++;
                }
                return true;
            }
        }
        return false;
    }
```

#### 5.clone方法

```java
protected native Object clone() throws CloneNotSupportedException;
```

clone被native修饰为本地方法，protected保护方法，实现对象的浅拷贝，只有实现了Cloneable接口才可以调用该方法，否则抛出CloneNotSupportedException异常。

在某些场景中，我们需要获取到一个对象的拷贝用于某些处理。这时候就可以用到Java中的Object.clone方法进行对象复制，得到一个一模一样的新对象。但是在实际使用过程中会发现：当对象中含有可变的引用类型属性时，在复制得到的新对象对该引用类型属性内容进行修改，原始对象响应的属性内容也会发生变化，这就是"浅拷贝"的现象。表明浅拷贝在拷贝引用类型属性时，只拷贝了该属性的引用。如果希望拷贝后的对象是完全的新对象，那就需要重写clone方法或者采用序列化的方式进行对象的复制。

#### 6.toString方法

```java
    public String toString() {
        return getClass().getName() + "@" + Integer.toHexString(hashCode());
    }
```

toString方法返回一个字符串，类名+@+哈希值的16进制无符号整数形式。该方法用得比较多，一般子类都有覆盖。

#### 7.notify方法

```java
public final native void notify();
```

notify被native修饰为本地方法，不可被重写，该方法唤醒在该对象上等待的某个线程。

#### 8.notifyAll方法

```java
public final native void notifyAll();
```

notifyAll被native修饰为本地方法，不可被重写，该方法唤醒在该对象上等待的所有线程。

### 9.wait(long timeout)方法

```java
public final native void wait(long timeout) throws InterruptedException;
```

wait被native修饰为本地方法，不可被重写，调用该方法后当前线程进入睡眠状态，让当前线程等待，使线程等待指定长的时间（毫秒）。在其他线程调用了notify或是notifyAll方法或是达到指定的时长，该线程就可以被调度。其他线程调用了interrupt中断该线程，就抛出一个InterruptedException异常。

#### 10.wait(long timeout, int nanos)方法

```java
public final void wait(long timeout, int nanos) throws InterruptedException {
    if (timeout < 0) {
        throw new IllegalArgumentException("timeout value is negative");
    }
    if (nanos < 0 || nanos > 999999) {
        throw new IllegalArgumentException(
                            "nanosecond timeout value out of range");
    }
    if (nanos >= 500000 || (nanos != 0 && timeout == 0)) {
        timeout++;
    }
    wait(timeout);
}
```

wait不可被重写，和wait(long timeout)方法本质相同，允许更好地控制在放弃之前等待通知的时间，实时量，以毫微秒计算，计算公式如下：1000000*timeout+nanos，特别是wait(0, 0) 表示和wait(0)相同，当前线程必须拥有该对象的监视器。

#### 11.wait方法

```java
public final void wait() throws InterruptedException {
    wait(0);
} 
```

实际上调用的是wait(long timeout)方法只不过timeout传的是0，只有调用了notify或是notifyAll方法，线程才会被唤醒。

#### 12.finalize方法

```java
protected void finalize() throws Throwable {}
```

该方法是protected方法，子类可以覆盖该方法以实现资源清理工作，GC在回收对象之前调用该方法，它是一个空实现方法。该方法与C++中的析构函数不是对应的。C++中的析构函数调用的时机是确定的（对象离开作用域或delete掉），但Java中的finalize的调用具有不确定性。调用这个方法只是建议gc去调用这个方法，但是还是不能保证一定会被调用。

finalize的执行周期：当对象变成(GC Roots)不可达时，GC会判断该对象是否覆盖了finalize方法，若未覆盖，则直接将其回收。否则，若对象未执行过finalize方法，将其放入F-Queue队列，由一低优先级线程执行该队列中对象的finalize方法。执行finalize方法完毕后，GC会再次判断该对象是否可达，若不可达，则进行回收，否则，对象“复活”。
