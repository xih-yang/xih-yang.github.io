# 03、Java JUC源码分析 - 原子变量-AtomicIntegerFieldUpdater
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/3.html
- 分类：Java并发
- 分组：教程目录
原子变量-AtomicIntegerFieldUpdater/AtomicLongFieldUpdater/AtomicReferenceFieldUpdater

如果我们系统中已经有某个类的变量定义为volatile了，现在为了保证对这个变量的原子性操作，就可以尝试使用这几个类，举个栗子：

```java
import sun.reflect.Reflection;
public class AtomicFieldIncr {
    //这里最好是public volatile，不要加final、static
    //修饰符最好也不要为protected，private，涉及调用者访问被调用者的access问题
    public volatile int idx;
    public AtomicFieldIncr(){
    }
    public int getIdx(){
        //0,-1返回Reflection本身
        System.out.println(Reflection.getCallerClass(0));
        System.out.println(Reflection.getCallerClass(-1));
        //1返回自己
        System.out.println(Reflection.getCallerClass(1));
        //2，空返回调用者
        System.out.println(Reflection.getCallerClass(2));
        System.out.println(Reflection.getCallerClass());
        return this.idx;
    }
    public void setIdx(int idx){
        this.idx = idx;
    }
}
```

```java
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
public class AtomicIntegerFieldUpdaterTest {
    public static void main(String[] args) {
        AtomicFieldIncr atomicFieldIncr = new AtomicFieldIncr();
        AtomicIntegerFieldUpdater<AtomicFieldIncr> atomicFieldUpdater = AtomicIntegerFieldUpdater.newUpdater(AtomicFieldIncr.class , "idx");
        atomicFieldUpdater.set(atomicFieldIncr, 3);
        System.out.println(atomicFieldIncr.getIdx());
        atomicFieldUpdater.compareAndSet(atomicFieldIncr, 3, 4);
        System.out.println(atomicFieldIncr.getIdx());
    }
}
```

结果为：

```java
class sun.reflect.Reflection
class sun.reflect.Reflection
class com.nettyrpc.juc.AtomicFieldIncr
class com.nettyrpc.juc.AtomicIntegerFieldUpdaterTest
class com.nettyrpc.juc.AtomicIntegerFieldUpdaterTest
3
class sun.reflect.Reflection
class sun.reflect.Reflection
class com.nettyrpc.juc.AtomicFieldIncr
class com.nettyrpc.juc.AtomicIntegerFieldUpdaterTest
class com.nettyrpc.juc.AtomicIntegerFieldUpdaterTest
4
```

还是以AtomicIntegerFieldUpdater开始，AtomicIntegerFieldUpdater本身为abstract，内部提供static实现AtomicIntegerFieldUpdaterImpl，看下AtomicIntegerFieldUpdater的构造函数：

```java
/**
tclass就是被调用类，也就是需要变量原子操作的类
fieldName：tclass中volatile变量
*/
public static <U> AtomicIntegerFieldUpdater<U> newUpdater(Class<U> tclass, String fieldName) {
//Reflection.getCallerClass()获取我们的调用类
    return new AtomicIntegerFieldUpdaterImpl<U>(tclass, fieldName, Reflection.getCallerClass());
}
```

AtomicIntegerFieldUpdater定义了一些抽象方法，跟普通AtomicInteger一样，没什么多余的方法。

看下AtomicIntegerFieldUpdaterImpl的构造函数：

```java
//被调用类中volatile变量的偏移量
private final long offset;
//被调用类
private final Class<T> tclass;
//调用类
private final Class cclass;
AtomicIntegerFieldUpdaterImpl(Class<T> tclass, String fieldName, Class<?> caller) {
    Field field = null;
    int modifiers = 0;
    try {
        field = tclass.getDeclaredField(fieldName);
        modifiers = field.getModifiers();
//校验volatile变量的访问权限
//被调用者类中的volatile变量一般定义成public volatile不会有问题，如果是其他需要注意     
        sun.reflect.misc.ReflectUtil.ensureMemberAccess(
            caller, tclass, null, modifiers);
        sun.reflect.misc.ReflectUtil.checkPackageAccess(tclass);
    } catch (Exception ex) {
        throw new RuntimeException(ex);
    }
//检验变量类型跟是否是volatile，获取变量的偏移量
    Class fieldt = field.getType();
    if (fieldt != int.class)
        throw new IllegalArgumentException("Must be integer type");
    if (!Modifier.isVolatile(modifiers))
        throw new IllegalArgumentException("Must be volatile type");
    this.cclass = (Modifier.isProtected(modifiers) &&
                   caller != tclass) ? caller : null;
    this.tclass = tclass;
    offset = unsafe.objectFieldOffset(field);
}
```

最主要的是检查调用者对被调用者的volatile变量的访问权限问题，绝对不要定义成static/final，修饰符的问题还是看权限，具体反射校验代码只找到了openjdk的源码，可以自己跟下过程

http://www.docjar.com/html/api/sun/reflect/Reflection.java.html

http://www.docjar.com/html/api/sun/reflect/misc/ReflectUtil.java.html。

类中对于变量的原子操作，大概流程都一样，先做校验，主要是校验你传入的类是否跟之前保存的被调用的类型一致，然后再调用unsafe的底层操作：

```java
public boolean compareAndSet(T obj, int expect, int update) {
    if (obj == null || obj.getClass() != tclass || cclass != null) fullCheck(obj);
    return unsafe.compareAndSwapInt(obj, offset, expect, update);
}
private void fullCheck(T obj) {
    if (!tclass.isInstance(obj))
        throw new ClassCastException();
    if (cclass != null)
        ensureProtectedAccess(obj);
}
private void ensureProtectedAccess(T obj) {
    if (cclass.isInstance(obj)) {
        return;
    }
    throw new RuntimeException(
        new IllegalAccessException("Class " +
            cclass.getName() +
            " can not access a protected member of class " +
            tclass.getName() +
            " using an instance of " +
            obj.getClass().getName()
        )
    );
}
```

AtomicLongFieldUpdater跟AtomicIntegerFieldUpdater不一样的是需要判断底层是否支持long的cas操作。

```java
public static <U> AtomicLongFieldUpdater<U> newUpdater(Class<U> tclass, String fieldName) {
    Class<?> caller = Reflection.getCallerClass();
    if (AtomicLong.VM_SUPPORTS_LONG_CAS)
        return new CASUpdater<U>(tclass, fieldName, caller);
    else
        return new LockedUpdater<U>(tclass, fieldName, caller);
}
```

如果底层支持就跟 AtomicIntegerFieldUpdater处理方式一样，如果不支持就在原子操作的时候通过synchronized加锁实现：

```java
public boolean compareAndSet(T obj, long expect, long update) {
    if (obj == null || obj.getClass() != tclass || cclass != null) fullCheck(obj);
    synchronized (this) {
        long v = unsafe.getLong(obj, offset);
        if (v != expect)
            return false;
        unsafe.putLong(obj, offset, update);
        return true;
    }
}
```

AtomicReferenceFieldUpdater因为要保证被调用者类中volatile类型引用的原子操作，所以构造函数中需要传入引用类型的class，其他类同。

```java
/**
tclass:被调用者
vclass:volatile变量的引用类型
*/
public static <U, W> AtomicReferenceFieldUpdater<U,W> newUpdater(Class<U> tclass, Class<W> vclass, String fieldName) {
    return new AtomicReferenceFieldUpdaterImpl<U,W>(tclass,
                                                    vclass,
                                                    fieldName,
                                                    Reflection.getCallerClass());
}
```
