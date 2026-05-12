# 05、JDK 源码：StringBuffer
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/5.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

StringBuffer是一个线程安全的、可变的字符序列，跟String类似，但它能被修改。StringBuffer在多线程环境下可以很安全地被使用，因为它的方法都是通过synchronized关键字来修饰的。这样能保证任何操作都会以串行的方式执行。

## 二、常用方法

StringBuffer的主要操作是对字符串的追加和插入，追加是在字符串的尾部添加，而insert方法可以在指定位置添加。要注意的是，append和insert方法的操作，都发生在字符串缓冲区。

类的定义：

```java
public final class StringBuffer
extends AbstractStringBuilder
implements java.io.Serializable, CharSequence
```

StringBuffer会调用AbstractStringBuilder的构造方法进行初始化，默认的容量为16：

```java
public StringBuffer() {
    super(16);
}
//抽象父类AbstractStringBuilder的实现，构造了一个字符串缓冲区
AbstractStringBuilder(int capacity) {
    value = new char[capacity];
}
```

也可以在构造的时候传入capacity的大小。

构造的时候还能传入一个字符串或CharSequence，那么它的容量就是字符串或CharSequence的长度+16。

append()方法都是同步的，然后调用父类的append()去确定容量，执行追加操作。

还有indexOf、reverse、toString等方法，都是同步的。

## 三、StringBuffer的序列化和反序列化实现

靠如下三个私有方法实现：

```java
private static final java.io.ObjectStreamField[] serialPersistentFields =
{
    new java.io.ObjectStreamField("value", char[].class),
    new java.io.ObjectStreamField("count", Integer.TYPE),
    new java.io.ObjectStreamField("shared", Boolean.TYPE),
};
private synchronized void writeObject(java.io.ObjectOutputStream s)
    throws java.io.IOException {
    java.io.ObjectOutputStream.PutField fields = s.putFields();
    fields.put("value", value);
    fields.put("count", count);
    fields.put("shared", false);
    s.writeFields();
}
private void readObject(java.io.ObjectInputStream s)
    throws java.io.IOException, ClassNotFoundException {
    java.io.ObjectInputStream.GetField fields = s.readFields();
    value = (char[])fields.get("value", null);
    count = fields.get("count", 0);
}
```

## 四、总结

StringBuffer类比较简单，主要的实现方法都在父类中实现了，它自身主要是做了同步操作，也可以得出结论，在没有现成安全问题的环境下，不建议使用这个类，而应该去使用StringBuilder类，性能会更好。
