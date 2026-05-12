# 08、Java11 新特性 - Predicate接口
- 来源：https://ddkk.com/zhuanlan/java/java11/8.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 向 Predicate 接口引入了新方法 not() 来否定类似于 negate 方法的现有谓词。

## Java11 Predicate接口 的示例

ApiTester.java

```java
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;
public class APITester {
   public static void main(String[] args) {		
      List<String> tutorialsList = Arrays.asList("Java", "\n", "HTML", " ");
      List<String> tutorials = tutorialsList.stream()
         .filter(Predicate.not(String::isBlank))
         .collect(Collectors.toList());
      tutorials.forEach(tutorial -> System.out.println(tutorial));
   }
}
```

输出结果为

```java
Java
HTML
```
