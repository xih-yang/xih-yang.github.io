# 07、Java11 新特性 - Optional类
- 来源：https://ddkk.com/zhuanlan/java/java11/7.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 向 Optional 类引入了新方法 isEmpty() 来检查值是否存在。如果值存在，则 isEmpty() 返回 false，否则返回 true。

它可以用作 isPresent() 方法的替代方法，该方法通常需要否定以检查值是否不存在。

## Java11 Optional类 的示例

ApiTester.java

```java
import java.util.Optional;
public class APITester {
   public static void main(String[] args) {		
      String name = null;
      System.out.println(!Optional.ofNullable(name).isPresent());
      System.out.println(Optional.ofNullable(name).isEmpty());
      name = "Joe";
      System.out.println(!Optional.ofNullable(name).isPresent());
      System.out.println(Optional.ofNullable(name).isEmpty());
   }
}
```

输出结果为

```java
true
true
false
false
```
