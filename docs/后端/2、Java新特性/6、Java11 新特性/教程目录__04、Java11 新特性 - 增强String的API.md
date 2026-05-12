# 04、Java11 新特性 - 增强String的API
- 来源：https://ddkk.com/zhuanlan/java/java11/4.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 为 String 引入了多项增强功能。

- String.repeat(int) ： 重复给定次数的字符串。返回连接的字符串。
- String.isBlank() ：检查字符串是否为空或只有空格。
- String.strip() ： 删除前导和尾随空格。
- String.stripLeading() ： 删除前导空格。
- String.stripTrailing() ： 删除尾随空格。
- String.lines() ： 返回多行字符串的行流。

## Java11 增强String的API 的示例

ApiTester.java

```java
import java.util.ArrayList;
import java.util.List;
public class APITester {
   public static void main(String[] args) {
      String sample = " abc ";
      System.out.println(sample.repeat(2)); // " abc  abc "
      System.out.println(sample.isBlank()); // false
      System.out.println("".isBlank()); // true
      System.out.println("   ".isBlank()); // true
      System.out.println(sample.strip()); // "abc"
      System.out.println(sample.stripLeading()); // "abc "
      System.out.println(sample.stripTrailing()); // " abc"
      sample = "This\nis\na\nmultiline\ntext.";
      List<String> lines = new ArrayList<>();
      sample.lines().forEach(line -> lines.add(line));
      lines.forEach(line -> System.out.println(line));
   }
}
```

输出结果为

```java
abc  abc 
false
true
true
abc
abc 
 abc
This
is
a
multiline
text.
```
