# 17、Lombok 实战教程 - @ExtensionMethod | 向现有类型中添加方法
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/17.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`@ExtensionMethod`是在`lombok v0.11.2`中作为实验性功能引入的。

原因：

- 对代码风格的影响很大。
- 想用实用程序方法来扩展公共类，但到目前为止，lombok还没有一个适合这种运行时依赖关系的好的分发方法。
- 对eclipse的影响相当大，自动完成e.d.在netbeans中还不能工作。
- @ExtensionMethod在方法上是否合法？它应该在包上合法吗？
- 这个功能有更多与之相关的错误，而这是一个很大的维护负担。

当前状态：保持 - 目前我们觉得这个功能不会很快脱离实验状态，但它不会有明显的变化，对它的支持也不可能在未来的`lombok`版本中被删除。

## 二、简介

你可以制作一个包含一堆`public`, `static`方法的类，这些方法都至少有一个参数。这些方法将扩展第一个参数的类型，就像它们是实例方法一样，使用`@ExtensionMethod`特性。

例如，如果你创建了 `public static String toTitleCase(String in) { ... }`，你可以使用`@ExtensionMethod`特性，让它看起来像`java.lang.String`类有一个名为`toTitleCase`的方法，它没有参数。静态方法的第一个参数填补了实例方法中`this`的这个角色。

所有`public`、`static`、至少有一个类型不是原始的参数的方法都被认为是扩展方法，每个方法都将被注入第一个参数的类型的名字空间，就像它们是实例方法一样。就像上面的例子，一个看起来像：`foo.toTitleCase()`的调用被替换为`ClassContainingYourExtensionMethod.toTitleCase(foo);`。注意，如果`foo`是空的，实际上并不是一个即时的`NullPointerException` —— 它像其他参数一样被传递。

你可以向`@ExtensionMethod`注解传递任意数量的类；它们都将被搜索到扩展方法。这些扩展方法适用于被注解的类中的任何代码。

`Lombok`（目前）没有任何运行时依赖，这意味着`lombok`（目前）没有提供任何有用的扩展方法，所以你必须自己制作。然而，这里有一个可能会激发你的想象力。

```java
public class ObjectExtensions {
	public static <T> T or(T object, T ifNull) {
		return object != null ? object : ifNull;
	}
}
```

有了上面的类，如果你在类定义中加入`@ExtensionMethod(ObjectExtensions.class)`，你就可以写。

```java
String x = null;
System.out.println(x.or("Hello, World!"));
```

上面的代码不会因为`NullPointerException`而失败；它实际上会输出`Hello, World!`

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.experimental.ExtensionMethod;
@ExtensionMethod({
     java.util.Arrays.class, Extensions.class})
public class ExtensionMethodExample {
  public String test() {
    int[] intArray = {
     5, 3, 8, 2};
    intArray.sort();
    String iAmNull = null;
    return iAmNull.or("hELlO, WORlD!".toTitleCase());
  }
}
class Extensions {
  public static <T> T or(T obj, T ifNull) {
    return obj != null ? obj : ifNull;
  }
  public static String toTitleCase(String in) {
    if (in.isEmpty()) return in;
    return "" + Character.toTitleCase(in.charAt(0)) +
        in.substring(1).toLowerCase();
  }
}
```

### 2. Java 标准写法

```java
public class ExtensionMethodExample {
  public String test() {
    int[] intArray = {
     5, 3, 8, 2};
    java.util.Arrays.sort(intArray);
    String iAmNull = null;
    return Extensions.or(iAmNull, Extensions.toTitleCase("hELlO, WORlD!"));
  }
}
class Extensions {
  public static <T> T or(T obj, T ifNull) {
    return obj != null ? obj : ifNull;
  }
  public static String toTitleCase(String in) {
    if (in.isEmpty()) return in;
    return "" + Character.toTitleCase(in.charAt(0)) +
        in.substring(1).toLowerCase();
  }
}
```

## 四、支持的配置项

`lombok.extensionMethod.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@ExtensionMethod`的任何使用标记为警告或错误（如果已配置）。

## 五、附属说明

调用被重写为对扩展方法的调用；静态方法本身没有被内联。因此，扩展方法必须在编译时和运行时都存在。

泛型完全应用于找出扩展方法。即如果您的扩展方法的第一个参数是 `List`，那么任何与之兼容的表达式都会有你的扩展方法，但其他类型的`List`不会。所以， `List` 不会得到它，但 `List` 会。
