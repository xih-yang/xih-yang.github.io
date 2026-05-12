# 01、Lombok 实战教程 - val 和 var的使用 | 像 JavaScript 一样的去声明变量
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/1.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

### 1. val

`val`是在`lombok 0.10`中引入的。

您可以使用`val`作为局部变量声明的类型，而不是实际编写该类型。执行此操作时，将从初始值设定项表达式推断类型。局部变量也将成为最终变量。此功能仅适用于局部变量和`foreach`循环，而不适用于字段。初始值设定项表达式是必需的。

`val`实际上是一种排序的“类型”，在`lombok`包中作为一个真正的类存在。必须导入它才能使`val`工作（或使用`lombok.val`作为类型）。局部变量声明中存在此类型会触发添加`final`关键字以及复制初始化表达式的类型，从而覆盖“伪”`val`类型。

> 警告：此功能目前在NetBeans中不起作用。

### 2. var

`var`是在`lombok 1.16.12`中作为实验性功能引入的。

`var`的工作原理与`val`完全相同，只是局部变量没有标记为`final`。

类型仍然完全是从强制初始值设定项表达式派生的，任何进一步的赋值，尽管现在是合法的（因为变量不再是最终的），都不会被用来确定合适的类型。

例如，`var x = "Hello"; x = Color.RED;` 不起作用；`x`的类型将被推断为`java.lang.String`，因此，`x = Color.RED`的赋值将失败。如果`x`的类型被推断为`java.lang.Object`，这段代码就会被编译，但这不是`var`的工作方式。

### 3. 区别

`var`和`val`的区别在于：`val`修饰的局部变量没有被标记为`final`。

`var`在`lombok 1.16.20`中被提升为主包；考虑到`JEP 286`建立的期望，而`lombok`对`var`的处理遵循了这些期望，我们决定提升`var`，尽管这个特性仍然有争议。

`Lombok 1.18.22`中的新功能：`val`被替换为`final var`。

## 二、示例比较

### 1. Lombok 写法

```java
import java.util.ArrayList;
import java.util.HashMap;
import lombok.val;
public class ValExample {
  public String example() {
    val example = new ArrayList<String>();
    example.add("Hello, World!");
    val foo = example.get(0);
    return foo.toLowerCase();
  }
  public void example2() {
    val map = new HashMap<Integer, String>();
    map.put(0, "zero");
    map.put(5, "five");
    for (val entry : map.entrySet()) {
      System.out.printf("%d: %s\n", entry.getKey(), entry.getValue());
    }
  }
}
```

### 2. Java 标准写法

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
public class ValExample {
  public String example() {
    final ArrayList<String> example = new ArrayList<String>();
    example.add("Hello, World!");
    final String foo = example.get(0);
    return foo.toLowerCase();
  }
  public void example2() {
    final HashMap<Integer, String> map = new HashMap<Integer, String>();
    map.put(0, "zero");
    map.put(5, "five");
    for (final Map.Entry<Integer, String> entry : map.entrySet()) {
      System.out.printf("%d: %s\n", entry.getKey(), entry.getValue());
    }
  }
}
```

## 三、支持的配置项

`lombok.val.flagUsage = [warning | error]` (默认: 未设置)

如果配置，`Lombok`会将`val`的任何使用标记为`warning`或`error`。

`lombok.var.flagUsage = [warning | error]` (默认: 未设置)

如果配置，`Lombok`会将`var`的任何使用标记为`warning`或`error`。

## 四、附属说明

对于复合类型，将推断最常见的超类，而不是任何共享接口。例如`bool ? new HashSet() : new ArrayList()`是一个具有复合类型的表达式。其结果既是`AbstractCollection`，也是`Serializable`。推断的类型将是`AbstractCollection`，因为它是一个类，而`Serializable`是一个接口。

在不明确的情况下，例如初始化表达式为 `null`时，会推断出`java.lang.Object`。
