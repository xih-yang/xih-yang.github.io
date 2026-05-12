# 05、Java12 新特性 - teeing方法
- 来源：https://ddkk.com/zhuanlan/java/java12/5.html
- 分类：Java 12 新特性
- 分组：教程目录
Java 12 向Stream API的Collectors中引入了一种新方法，可以对集合执行两种不同的操作，然后合并结果。以下代码为其语法结构

```java
Collector<T, ?, R> teeing(
   Collector<? super T, ?, R1> downstream1,
   Collector<? super T, ?, R2> downstream2, 
   BiFunction<? super R1, ? super R2, R> merger
)
```

这里我们对一个集合执行不同的函数，然后使用合并 BiFunction 合并结果。

## Java12 teeing方法示例

ApiTester.java

```java
package com.yiidian;
import java.util.stream.Collectors;
import java.util.stream.Stream;
public class APITester {
   public static void main(String[] args) {
      double mean
         = Stream.of(1, 2, 3, 4, 5, 6, 7)
            .collect(Collectors.teeing(
               Collectors.summingDouble(i -> i), Collectors.counting(),
               (sum, n) -> sum / n));
      System.out.println(mean);
   }
}
```

输出结果为

```java
4.0
```
