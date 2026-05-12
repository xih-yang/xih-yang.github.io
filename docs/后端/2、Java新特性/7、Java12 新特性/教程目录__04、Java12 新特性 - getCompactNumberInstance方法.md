# 04、Java12 新特性 - getCompactNumberInstance方法
- 来源：https://ddkk.com/zhuanlan/java/java12/4.html
- 分类：Java 12 新特性
- 分组：教程目录
Java 12 引入了紧凑格式，我们可以将十进制、货币或百分比的长数字格式化为短格式或长格式。例如 1000 到 1K。以下语法说明了其用法：

```java
NumberFormat formatter = NumberFormat.getCompactNumberInstance(
   Locale.US, NumberFormat.Style.SHORT);
   System.out.println(formatter.format(1000)
);
```

## Java12 getCompactNumberInstance方法示例

ApiTester.java

```java
package com.yiidian;
import java.text.NumberFormat;
import java.util.Locale;
public class APITester {
   public static void main(String[] args) {
      NumberFormat formatter = NumberFormat.getCompactNumberInstance(
         Locale.US, NumberFormat.Style.LONG);
      System.out.println(formatter.format(1000));
      System.out.println(formatter.format(1000000));
      formatter = NumberFormat.getCompactNumberInstance(
         Locale.US, NumberFormat.Style.SHORT);
      System.out.println(formatter.format(1000));
      System.out.println(formatter.format(1000000));
   }
}
```

输出结果为

```java
1 thousand
1 million
1K
1M
```
