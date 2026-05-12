# 02、Java 19 新特性 - switch 类型匹配增强（第三次预览）
- 来源：https://ddkk.com/zhuanlan/java/java19/2.html
- 分类：Java 19 新特性
- 分组：教程目录
首次引入这个功能是在[Java SE 17][]

```java
switch (obj) {
  case String s && s.length() > 5 -> System.out.println(s.toUpperCase())。
  ...
}
```

我们可以在 switch 语句中检查一个对象是否属于某个特定的类，以及它是否有额外的特征（比如在例子中：长于五个字符）。

在Java SE 19 中，我们必须使用新的关键字 when 来代替 &&

完整代码如下

```java
package git.snippets.jdk19;
/**
 * switch 增强 第三次预览
 * 需要增加 --enable-preview参数
 * @since 19
 */
public class SwitchEnhancedTest {
    public static void main(String[] args) {
        checkObjSince19("hello world");
    }
    public static void checkObjSince19(Object when) {
        // when 是一个所谓的 "上下文关键字"，因此只在一个 case 标签中具有意义。如果你的代码中有名称为 "when "的变量或方法，你不需要改变它们。
        switch (when) {
            case String s when s.length() > 5 -> System.out.println(s.toUpperCase());
            case String s -> System.out.println(s.toLowerCase());
            case Integer i -> System.out.println(i * i);
            default -> {
            }
        }
    }
}
```

when 是一个所谓的 “上下文关键字”，因此只在一个 case 标签中具有意义。如果你的代码中有名称为 "when "的变量或方法，你不需要改变它们。
