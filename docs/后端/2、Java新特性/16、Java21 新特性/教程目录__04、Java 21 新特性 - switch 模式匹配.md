# 04、Java 21 新特性 - switch 模式匹配
- 来源：https://ddkk.com/zhuanlan/java/java21/4.html
- 分类：Java 21 新特性
- 分组：教程目录
通过switch表达式和语句的模式匹配来增强Java编程语言。通过将模式匹配扩展到switch，可以针对多个模式测试表达式，每个模式都有一个特定的操作，从而可以简洁、安全地表达复杂的面向数据的查询。

## Switch 匹配增强

该功能首次在 Java SE 17 中预览，在在此版本中成为永久性功能。这意味着它可以在任何为 Java SE 21 编译的程序中使用，而无需启用预览功能。

```java
package git.snippets.jdk21;
/**
 * switch类型增强匹配
 * 无须增加预览参数
 * @since 21
 */
public class SwitchMatchTest {
    public static void main(String[] args) {
        switchMatch(3);
        switchMatch("HELLO");
        switchMatch("hello world");
        switchMatch(null);
    }
    static void switchMatch(Object obj) {
        switch (obj) {
            case String s when s.length() > 5 -> System.out.println(s.toUpperCase());
            case String s -> System.out.println(s.toLowerCase());
            case Integer i -> System.out.println(i * i);
            case null -> System.out.println("null obj");
            default -> {
            }
        }
    }
}
```
