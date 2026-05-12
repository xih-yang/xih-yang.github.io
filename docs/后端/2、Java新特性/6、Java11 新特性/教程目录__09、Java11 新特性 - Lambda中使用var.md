# 09、Java11 新特性 - Lambda中使用var
- 来源：https://ddkk.com/zhuanlan/java/java11/9.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 允许在 lambda 表达式中使用 var，它可用于将修饰符应用于局部变量。

```java
(@NonNull var value1, @Nullable var value2) -> value1 + value2
```

## Java11 Lambda中使用var的示例

ApiTester.java

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
@interface NonNull {}
public class APITester {
   public static void main(String[] args) {		
      List<String> tutorialsList = Arrays.asList("Java", "HTML");
      String tutorials = tutorialsList.stream()
         .map((@NonNull var tutorial) -> tutorial.toUpperCase())
         .collect(Collectors.joining(", "));
      System.out.println(tutorials);
   }
}
```

输出结果为

```java
Java
HTML
```

## Java11 Lambda中使用var的限制

在lambda 表达式中使用 var 有一定的限制。

- var 参数不能与其他参数混合使用。以下将抛出编译错误。

```java
(var v1, v2) -> v1 + v2
```

- var 参数不能与其他类型参数混合使用。以下将抛出编译错误。

```java
(var v1, String v2) -> v1 + v2
```

- var 参数只能与括号一起使用。以下将抛出编译错误。

```java
var v1 -> v1.toLowerCase()
```
