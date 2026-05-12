# 08、JDK 源码：Byte
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/8.html
- 分类：JDK 源码
- 分组：教程目录
## 一、抽象类Number

类继承关系

这里面的原子类、BigDecimal后面都会详细介绍。

属性和抽象方法

## 二、概述

所有的属性，最小-128，最大127，SIZE和BYTES代码比特值的二进制补码长度。

一个静态内部类做缓存

```java
private static class ByteCache {
    private ByteCache(){}
    static final Byte cache[] = new Byte[-(-128) + 127 + 1];
    static {
        for(int i = 0; i < cache.length; i++)
            cache[i] = new Byte((byte)(i - 128));
    }
}
```

## 三、常见方法

#### compare

```java
public static int compare(byte x, byte y) {
    return x - y;
}
```

#### toUnsignedInt、toUnsignedLong

将一个byte转换为一个无符号的int值，跟0xff做与运算

```java
public static int toUnsignedInt(byte x) {
    return ((int) x) & 0xff;
}
```

#### valueOf，参数radix代表进制

```java
public static Byte valueOf(String s, int radix)
    throws NumberFormatException {
    return valueOf(parseByte(s, radix));
}
```

#### decode：将字符串解码WieByte类型

支持二进制，八进制，十六进制，会调用Integer的decode方法进行处理，默认十进制，关于这个方法后面再讲。

请参考：[https://blog.csdn.net/m0_37609579/article/details/103558588](/zhuanlan/java/jvm/12/10.html)

```java
public static Byte decode(String nm) throws NumberFormatException {
    int i = Integer.decode(nm);
    if (i < MIN_VALUE || i > MAX_VALUE)
        throw new NumberFormatException(
                "Value " + i + " out of range from input " + nm);
    return valueOf((byte)i);
}
```

也有一些强转成基本数据类型的方法，都很简单

```java
 public byte byteValue() {
    return value;
}
public short shortValue() {
    return (short)value;
}
public int intValue() {
    return (int)value;
}
public long longValue() {
    return (long)value;
}
public float floatValue() {
    return (float)value;
}
public double doubleValue() {
    return (double)value;
}
public String toString() {
    return Integer.toString((int)value);
}
```

#### hashCode就是该byte对应的int值

```java
public static int hashCode(byte value) {
    return (int)value;
}
```

没有了，很简单的一个类。
