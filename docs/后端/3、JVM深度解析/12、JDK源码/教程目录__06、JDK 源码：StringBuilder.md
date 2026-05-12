# 06、JDK 源码：StringBuilder
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/6.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

StringBuilder是一个可变的字符串序列，这个类被设计去兼容StringBuffer类的API，但不保证线程安全性，是StringBuffer单线程情况下的一个替代实现。在可能的情况 ，建议，在代码中优先使用，因为它的实现更快。

## 二、常见方法

主要的方法是append和insert方法，有很多重载，以便接受任何类型的数据。一个是从尾部追加，一个是从任意位置插入。

一样的，StringBuilder在容量不够的情况下，会调用父类的扩容方法进行扩容，公式为：新容量取原容量的2倍加2和入参minCapacity中较大者。

类的定义如下：

```java
public final class StringBuilder
    extends AbstractStringBuilder
    implements java.io.Serializable, CharSequence
```

构造方法中一样的，默认容量为16，如果你构造的时候传入一个字符串，那容量就为字符串的长度+16。

append方法和insert方法都没有加同步关键字synchronized。

也有delete、replace、reverse、toString等方法。

## 三、序列化方法

```java
private void writeObject(java.io.ObjectOutputStream s)
    throws java.io.IOException {
    s.defaultWriteObject();
    s.writeInt(count);
    s.writeObject(value);
}
private void readObject(java.io.ObjectInputStream s)
    throws java.io.IOException, ClassNotFoundException {
    s.defaultReadObject();
    count = s.readInt();
    value = (char[]) s.readObject();
}
```

## 四、Stringbuffer和StringBuilder的toString方法比较

StringBuffer的：

```java
public synchronized String toString() {
    if (toStringCache == null) {
        toStringCache = Arrays.copyOfRange(value, 0, count);
    }
    return new String(toStringCache, true);
}
```

使用到了String的一个protected方法，在同一个包下，所以可以使用：

```java
 /*
* Package private constructor which shares value array for speed.
* this constructor is always expected to be called with share==true.
* a separate constructor is needed because we already have a public
* String(char[]) constructor that makes a copy of the given char[].
*/
String(char[] value, boolean share) {
    // assert share : "unshared not supported";
    this.value = value;
}
```

从代码中我们可以看出，该方法和 String(char[] value)有两点区别，第一个，该方法多了一个参数： boolean share，其实这个参数在方法体中根本没被使用，也给了注释，目前不支持使用false，只使用true。那么可以断定，加入这个share的只是为了区分于String(char[] value)方法，不加这个参数就没办法定义这个函数，只有参数不能才能进行重载。那么，第二个区别就是具体的方法实现不同。我们前面提到过，String(char[] value)方法在创建String的时候会用到 会用到Arrays的copyOf方法将value中的内容逐一复制到String当中，而这个String(char[] value, boolean share)方法则是直接将value的引用赋值给String的value。

一般的做法如下：

```java
this.value = Arrays.copyOf(value, value.length);
```

这样的好处就是性能好、共享内部数组节约内存。而且这个方法在外部也调用不到，不会破坏String的不可变特性。

StringBuilder的：

```java
public String toString() {
    //Create a copy, don't share the array
    return new String(value, 0, count);
}
```
