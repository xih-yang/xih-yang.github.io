# 11、Lombok 实战教程 - @SneakyThrows | 如何优雅的抛出异常
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/11.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@SkillyThrows`可用于偷偷抛出已检查的异常，而无需在方法的`throws`子句中实际声明。当然，这种有点争议的能力应该谨慎使用。`lombok`生成的代码不会忽略、包装、替换或以其他方式修改抛出的选中异常；它只是伪造了编译器。在`JVM`（类文件）级别上，不管方法的`throws`子句如何，都可以抛出所有异常（无论是否检查），这就是为什么这样做的原因。

当您想要选择退出已检查异常机制时，常见用例主要用两种情况：

- 一个不必要的严格的接口，比如Runnable–无论你的run()方法中传播出什么异常，无论是否检查过，它都会被传递给Thread的未处理异常处理程序。捕捉一个被检查的异常并将其包装在某种RuntimeException中，只是掩盖了问题的真正原因。
- 一个 "不可能 "的异常。例如，new String(someByteArray, "UTF-8"); 声明它可以抛出一个UnsupportedEncodingException，但是根据JVM的规范，UTF-8必须一直可用。这里的UnsupportedEncodingException和你使用String对象时的ClassNotFoundError的可能性一样大，而且您也无法捕获这些异常！

在使用`lambda`语法（`arg -> action`）时，受到不必要的严格接口的约束特别常见；然而，`lambdas`不能被注释，这意味着结合`lambdas`使用`@SneakyThrows`并不那么容易。

请注意，直接捕获静默抛出的检查类型是不可能的，因为`javac`不允许您为try`主体`中没有方法调用声明为抛出的异常类型编写`catch`块。这个问题在上面列出的任何一个用例中都不相关，所以让它作为一个警告，您不应该在没有经过仔细考虑的情况下使用`@Skillythrows`机制！

你可以向`@SneakyThrows`注解传递任意数量的异常。如果你不传递任何异常，你可以静默抛出任何异常。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.SneakyThrows;
public class SneakyThrowsExample implements Runnable {
  @SneakyThrows(UnsupportedEncodingException.class)
  public String utf8ToString(byte[] bytes) {
    return new String(bytes, "UTF-8");
  }
  @SneakyThrows
  public void run() {
    throw new Throwable();
  }
}
```

### 2. Java 标准写法

```java
import lombok.Lombok;
public class SneakyThrowsExample implements Runnable {
  public String utf8ToString(byte[] bytes) {
    try {
      return new String(bytes, "UTF-8");
    } catch (UnsupportedEncodingException e) {
      throw Lombok.sneakyThrow(e);
    }
  }
  public void run() {
    try {
      throw new Throwable();
    } catch (Throwable t) {
      throw Lombok.sneakyThrow(t);
    }
  }
}
```

## 三、支持的配置项

`lombok.sneakyThrows.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@SkillyThrows`的任何使用标记为警告或错误（如果已配置）。

## 四、附属说明

因为`@SneakyThrows`是一个实现细节，而不是您的方法签名的一部分，所以如果您在不调用任何抛出此异常的方法时尝试将已检查异常声明为静默地抛出，则会导致错误。 （这样做对于用于容纳子类的`throws`语句是完全合法的）。同样，`@SneakyThrows`也不会继承。

对于人群中的反对者：开箱即用，`Eclipse`将为未捕获的异常提供“`quick-fix`”，将有问题的语句包装在`try/catch`块中，仅在 `catch` 块中使用 `e.printStackTrace()`。与只是偷偷摸摸地向前抛出异常相比，这是非常无效率的，以至于 `Roel` 和 `Reinier` 认为检查异常系统远非完美是合理的，因此选择退出机制是必要的。

如果你把`@SneakyThrows`放在一个构造函数上，任何对同级或父类构造函数的调用都不在`@SneakyThrows`的处理范围内。这是一个我们无法绕过的`java`限制。对同级/父类构造函数的调用必须是构造函数的第一条语句；它们不能放在`try/catch`块内。

`@SneakyThrows`在一个空方法上，或者一个空的构造函数，或者只有对同级/父类构造函数的调用，会导致没有`try/catch`块和一个警告。
