# 10、JDK 源码：Integer（用处最多，重点讲解）
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/10.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Integer是对基本数据类型int的一个包装，类定义如下：

```java
public final class Integer extends Number implements Comparable<Integer> 
```

通过属性[MAX_VALUE](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/Integer.html#MAX_VALUE)和[MIN_VALUE](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/Integer.html#MAX_VALUE)定义了范围是：-2^31到2^31 -1.。

## 二、主要方法

#### 1.toString(int i, int radix)

第二个参数的进制，默认是10进制，进制的范围是2-36进制之间，如果传入的参数超出范围，就设置为10进制。

#### 2.toUnsignedString(int i, int radix)

无符号的字符串，调用了Long的toUnsignedString方法来实现。

#### 3.toHexString、toOctalString、toBinaryString

无符号的2/8/16进制数，如果参数为负，则无符号整数值为参数加2^32。都是调用Integer的私有方法toUnsignedString0和方法formatUnsignedInt来实现的，方法如下：

```java
private static String toUnsignedString0(int val, int shift) {
    // assert shift > 0 && shift <=5 : "Illegal shift value";
    int mag = Integer.SIZE - Integer.numberOfLeadingZeros(val);
    int chars = Math.max(((mag + (shift - 1)) / shift), 1);
    char[] buf = new char[chars];
    formatUnsignedInt(val, shift, buf, 0, chars);
    // Use special constructor which takes over "buf".
    return new String(buf, true);
}
```

#### 4.parseInt(String s, int radix)、parseInt(String s)

将一个字符串转换为int类型，传入正数负数都可以进行转换，radix不传默认是10进制。

#### 5.hashCode：就是本身

#### 6.public static Integer decode(String nm)

将`String`解码为`Integer` 。 接受以下语法给出的十进制，十六进制和八进制数：

- *DecimalNumeral*
- 0x *HexDigits*
- 0X *HexDigits*
- *HexDigits*
- 0 *OctalDigits*
-

-

```java
public static Integer decode(String nm) throws NumberFormatException {
    int radix = 10;
    int index = 0;
    boolean negative = false;
    Integer result;
    if (nm.length() == 0)
        throw new NumberFormatException("Zero length string");
    char firstChar = nm.charAt(0);
    // Handle sign, if present
    if (firstChar == '-') {
        negative = true;
        index++;
    } else if (firstChar == '+')
        index++;
    // Handle radix specifier, if present
    if (nm.startsWith("0x", index) || nm.startsWith("0X", index)) {
        index += 2;
        radix = 16;
    }
    else if (nm.startsWith("#", index)) {
        index ++;
        radix = 16;
    }
    else if (nm.startsWith("0", index) && nm.length() > 1 + index) {
        index ++;
        radix = 8;
    }
    if (nm.startsWith("-", index) || nm.startsWith("+", index))
        throw new NumberFormatException("Sign character in wrong position");
    try {
        result = Integer.valueOf(nm.substring(index), radix);
        result = negative ? Integer.valueOf(-result.intValue()) : result;
    } catch (NumberFormatException e) {
        // If number is Integer.MIN_VALUE, we'll end up here. The next line
        // handles this case, and causes any genuine format error to be
        // rethrown.
        String constant = negative ? ("-" + nm.substring(index))
                                   : nm.substring(index);
        result = Integer.valueOf(constant, radix);
    }
    return result;
}
```

#### 7.divideUnsigned、remainderUnsigned

无符号商、无符号余数

#### 8.highestOneBit、lowestOneBit

这个函数调用。使用的第一感觉就是这个函数是干什么用的，通过查看文档得知，这个函数的作用是取 i 这个数的二进制形式最左边的最高一位且高位后面全部补零，最后返回int型的结果。

用人话说：返回最高位为1, 其它位为0的数

- 如果一个数是0, 则返回0；
- 如果是负数, 则返回 -2147483648：【1000,0000,0000,0000,0000,0000,0000,0000】(二進制表示的數)；
- 如果是正数, 返回的则是跟它最靠近的比它小的2的N次方

> 比如 17：
>
> 二进制是【0000,0000,0000,0000,0000,0000,0001,0001】
>
> highestOneBit(17)返回的是最高位的1个1, 其它全是0 的二进制數：【0000,0000,0000,0000,0000,0000,0001,0000】，其实就是16。

## 三、特殊之处

#### 1.静态私有类private static class IntegerCache

-128到127之间的会被缓存，高值可以通过JVM参数java.lang.Integer.IntegerCache.high进行设置。
