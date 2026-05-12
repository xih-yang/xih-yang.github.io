# 07、JDK 源码：Boolean
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/7.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

这个类依然是Arthur van Hoff这哥们写的，是对基本数据类型boolean的一个包装，源码的注释说的很清楚：

```java
An object of type Boolean contains a single field whose type is boolean.这个类中有个属性的类型是基本类型boolean
```

这个类为boolean提供了很多boolean和String互相转换的方法，以及提供了当处理boolean的时的一些常量和方法。

## 二、常见方法

#### 1.类定义如下：

```java
public final class Boolean implements java.io.Serializable,Comparable<Boolean>
```

#### 2.五个属性

```java
//对应于基本类型boolean中的true
public static final Boolean TRUE = new Boolean(true);
public static final Boolean FALSE = new Boolean(false);
// 表示基本布尔型的类对象
public static final Class<Boolean> TYPE = (Class<Boolean>) Class.getPrimitiveClass("boolean");
//The value of the Boolean.
private final boolean value;
/** use serialVersionUID from JDK 1.0.2 for interoperability */
private static final long serialVersionUID = -3665804199014368530L;
```

#### 3.构造方法：

```java
public Boolean(boolean value) {
    this.value = value;
}
```

但这个构造方法一般情况下很少被用到，都是使用他的静态工厂方法valueOf(boolean)的，这个工厂方法有更好的时空间性能优势。此外，还提供了一个字符串参数的构造：

```java
public Boolean(String s) {
    this(parseBoolean(s));
}
```

具体逻辑在方法parseBoolean中，

```java
public static boolean parseBoolean(String s) {
    //传入的字符串非空并且为忽略大小写的true时，返回true，否则返回false
    return ((s != null) && s.equalsIgnoreCase("true"));
}
```

静态构造工厂（官方文档就是这么叫的），性能好：

```java
public static Boolean valueOf(boolean b) {
    return (b ? TRUE : FALSE);
}
//String参数的
public static Boolean valueOf(String s) {
    return parseBoolean(s) ? TRUE : FALSE;
}
```

#### 4.hashCode方法，一个是1231，一个是1237

```java
public static int hashCode(boolean value) {
    return value ? 1231 : 1237;
}
```

## 5.equals

```java
public boolean equals(Object obj) {
    if (obj instanceof Boolean) {
        return value == ((Boolean)obj).booleanValue();
    }
    return false;
}
```

#### 6.getBoolean

从系统参数中获取参数名对应的值，如果是“true”就返回true。否则抛出参数异常或空指针异常。

```java
public static boolean getBoolean(String name) {
    boolean result = false;
    try {
        result = parseBoolean(System.getProperty(name));
    } catch (IllegalArgumentException | NullPointerException e) {
    }
    return result;
}
```

#### 7.compare

比较两个布尔值是否相等，相等返回0，否则第一个参数是true返回1，第一个参数是false返回-1。

## 三、特殊点的方法

三个逻辑方法：

```java
public static boolean logicalAnd(boolean a, boolean b) {
    return a && b;
}
public static boolean logicalOr(boolean a, boolean b) {
    return a || b;
}
public static boolean logicalXor(boolean a, boolean b) {
    return a ^ b;
}
```
