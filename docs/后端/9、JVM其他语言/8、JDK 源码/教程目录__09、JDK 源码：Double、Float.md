# 09、JDK 源码：Double、Float
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/9.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

这个千篇一律，Double是对基本数据类型double的包装，里面包含了double类型的字段。这个类也提供了一些将String和double转换为Double的方法，还有一些处理double的方法。

作者是：

```java
 * @author  Lee Boynton
 * @author  Arthur van Hoff
 * @author  Joseph D. Darcy
 * @since JDK1.0
```

## 二、属性

提供了很多属性值，如下：

正无穷：POSITIVE_INFINITY：Double.longBitsToDouble(0x7ff0000000000000L)

负无穷：NEGATIVE_INFINITY：Double.longBitsToDouble(0xfff0000000000000L)

非数字：Not-a-Number (NaN)：Double.longBitsToDouble(0x7ff8000000000000L)

最大值：MAX_VALUE：Double.longBitsToDouble(0x7fefffffffffffffL)

单精度最小值：MIN_NORMAL：Double.longBitsToDouble(0x0010000000000000L)

双精度最小值：MIN_VALUE：Double.longBitsToDouble(0x1L)

最大指数：MAX_EXPONENT：1023

最小指数：MIN_EXPONENT：-1022

## 三、主要方法

toString：很简单

toHexString：将double转换为16进制字符串，就是StringBuilder的字符串拼接：

```java
public static String toHexString(double d) {
if (!isFinite(d) )
    //如果是NaN或是无穷，直接返回对应的字符串形式
    return Double.toString(d);
else {
        //初始化最大长度：24
        StringBuilder answer = new StringBuilder(24);
        if (Math.copySign(1.0, d) == -1.0)    // value is negative,
            answer.append("-");                  // so append sign info
        answer.append("0x");
        d = Math.abs(d);
        if(d == 0.0) {
            answer.append("0.0p0");
        } else {
            boolean subnormal = (d < DoubleConsts.MIN_NORMAL);
            // Isolate significand bits and OR in a high-order bit
            // so that the string representation has a known
            // length.
            long signifBits = (Double.doubleToLongBits(d)
                               & DoubleConsts.SIGNIF_BIT_MASK) |
                0x1000000000000000L;
            // Subnormal values have a 0 implicit bit; normal
            // values have a 1 implicit bit.
            answer.append(subnormal ? "0." : "1.");
            // Isolate the low-order 13 digits of the hex
            // representation.  If all the digits are zero,
            // replace with a single 0; otherwise, remove all
            // trailing zeros.
            String signif = Long.toHexString(signifBits).substring(3,16);
            answer.append(signif.equals("0000000000000") ? // 13 zeros
                          "0":
                          signif.replaceFirst("0{1,12}$", ""));
            answer.append('p');
            // If the value is subnormal, use the E_min exponent
            // value for double; otherwise, extract and report d's
            // exponent (the representation of a subnormal uses
            // E_min -1).
            answer.append(subnormal ?
                          DoubleConsts.MIN_EXPONENT:
                          Math.getExponent(d));
        }
        return answer.toString();
    }
}
```

判断是否为NaN

```java
    public static boolean isNaN(double v) {
        return (v != v);
    }
```

判断是否无限

```java
    public static boolean isInfinite(double v) {
        return (v == POSITIVE_INFINITY) || (v == NEGATIVE_INFINITY);
    }
```

判断是否有限

```java
    public static boolean isFinite(double d) {
        return Math.abs(d) <= DoubleConsts.MAX_VALUE;
    }
```

haseCode被重写了

```java
    public static int hashCode(double value) {
        long bits = doubleToLongBits(value);
        return (int)(bits ^ (bits >>> 32));
    }
```

doubleToLongBits：很多方法中用到了这个方法，理解为将double转换为64位的long即可

- 根据IEEE 754浮点“双格式”位布局返回指定浮点值的表示。
- 位63（由掩码0x8000000000000000L选择的位）表示浮点数的符号。 位62-52（由掩码0x7ff0000000000000L选择的位）表示指数。 位51-0（由掩码0x000fffffffffffffL选择的位）表示浮点数的有效数（有时称为尾数）。
- 如果参数为无穷大，则结果为0x7ff0000000000000L 。
- 如果参数为负无穷大，则结果为0xfff0000000000000L 。
- 如果参数是NaN，结果是0x7ff8000000000000L 。
- 在所有情况下，结果是long整数，当给予[longBitsToDouble(long)](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/Double.html#longBitsToDouble-long-)方法时，将产生与doubleToLongBits的参数相同的浮点值（除了所有NaN值都被折叠为单个“规范”NaN值）。

```java
    public static long doubleToLongBits(double value) {
        long result = doubleToRawLongBits(value);
        // Check for NaN based on values of bit fields, maximum
        // exponent and nonzero significand.
        if ( ((result & DoubleConsts.EXP_BIT_MASK) ==
              DoubleConsts.EXP_BIT_MASK) &&
             (result & DoubleConsts.SIGNIF_BIT_MASK) != 0L)
            result = 0x7ff8000000000000L;
        return result;
    }
```

doubleToRawLongBits：与`doubleToLongBits`方法不同， `doubleToRawLongBits`不会将编码NaN的所有位模式折叠到单个“规范”NaN值。是一个native的方法了。

```java
public static native long doubleToRawLongBits(double value);
```

compare：重写比较，注意Double.NaN返回是0

```java
    public static int compare(double d1, double d2) {
        if (d1 < d2)
            return -1;           // Neither val is NaN, thisVal is smaller
        if (d1 > d2)
            return 1;            // Neither val is NaN, thisVal is larger
        // Cannot use doubleToRawLongBits because of possibility of NaNs.
        long thisBits    = Double.doubleToLongBits(d1);
        long anotherBits = Double.doubleToLongBits(d2);
        return (thisBits == anotherBits ?  0 : // Values are equal
                (thisBits < anotherBits ? -1 : // (-0.0, 0.0) or (!NaN, NaN)
                 1));                          // (0.0, -0.0) or (NaN, !NaN)
    }
```

还有三个运算方法

```java
sum，max，min
```

## 三、Float

Float与Double非常类似，不再单独讲解
