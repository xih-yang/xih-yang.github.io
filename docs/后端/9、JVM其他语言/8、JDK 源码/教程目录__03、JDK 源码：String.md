# 03、JDK 源码：String
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/3.html
- 分类：JDK 源码
- 分组：教程目录
在JDK中，String的使用频率和被研究的程度都非常高，所以接下来我只说一些比较重要的内容。

## 一、String类的概述

String类的声明如下：

```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence
```

类被final修饰，所以String类不能被继承。实现了3个接口。CharSequence有字符相关操作的默认实现方法。

## 二、String类的属性和方法介绍

两个重要的属性：

```java
/** The value is used for character storage. */
private final char value[];
/** Cache the hash code for the string */
private int hash; // Default to 0
```

字符数组value[]中存的就是字符串对应的每个字符，注意也是用final修饰的，所以说字符串是不可变的。

构造方法一大队，都是为了给字符数组赋值的：

equals方法：

```java
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

hashcode方法：

```java
public int hashCode() {
    int h = hash;
    if (h == 0 && value.length > 0) {
        char val[] = value;
        for (int i = 0; i < value.length; i++) {
            h = 31 * h + val[i];
        }
        hash = h;
    }
    return h;
}
```

还有很多其他方法，大部分对字符串的操作，都是生成一个新的字符串，对原来的字符串并无影响。

## 三、String在jdk8新增的方法

```java
public static String join(CharSequence delimiter, CharSequence... elements) {
    Objects.requireNonNull(delimiter);
    Objects.requireNonNull(elements);
    // Number of elements not likely worth Arrays.stream overhead.
    StringJoiner joiner = new StringJoiner(delimiter);
    for (CharSequence cs: elements) {
        joiner.add(cs);
    }
    return joiner.toString();
}
```

join方法作用是将字符序列数组或集合通过分割符delimiter连接成一个字符串。第一个方法使用的是可变参数，第二个方法使用的可迭代参数，通过遍历数组或集合将数组元素或集合元素添加到StringBuilder，添加前会先加入一个分割符delimiter,然后将StringBuilder中的内容返回。
