# 12、JDK 源码：Enum
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/12.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Enum是所有Jav中枚举类的基类。详细的介绍在Java语言规范中有说明。

值得注意的是，java.util.EnumSet和java.util.EnumMap是Enum的两个高效实现，分别用于set和map。

## 二、代码解析

类定义：是个抽象类

```java
public abstract class Enum<E extends Enum<E>> implements Comparable<E>, Serializable
```

两个私有属性：

```java
private final String name;
private final int ordinal;
```

name是枚举常量的名称；ordinal指的是枚举常量的序号，初始通常从0开始。它被设计用于复杂的基于枚举的数据结构，如使用EnumSet和EnumMap的时候。

两个属性对应的方法：

```java
public final String name() {
    return name;
}
public final int ordinal() {
    return ordinal;
}
```

这两个方法可以返回属性对应的值，但文档建议使用toString方法来获取更加友好的名称。这两个方法主要用于设计在特殊的情况下，起正确性不会因版本而发生变化。

valueOf方法：

```java
public static <T extends Enum<T>> T valueOf(Class<T> enumType,String name) {
    T result = enumType.enumConstantDirectory().get(name);
    if (result != null)
        return result;
    if (name == null)
        throw new NullPointerException("Name is null");
    throw new IllegalArgumentException(
        "No enum constant " + enumType.getCanonicalName() + "." + name);
}
```

这个方法返回定义的枚举常量的指定名称。

枚举在开发中用的也比较多，通常开发我们都要自己定义不同的枚举。
