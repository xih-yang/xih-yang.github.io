# 22、Lombok 实战教程 - @Helper | 让你可以在方法内部中写方法
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/22.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

在`lombok v1.16.6`中，`@Helper`作为一个实验性功能被引入。

实验因为：

- 具有通用函数类型的lambda提供了一种替代策略。
- 也许有一种方法可以使辅助方法的模板更少，从而使这个功能变得过时。

当前状态：未知–我们对这一功能没有足够的经验，无法对其未来做出预测。

## 二、简介

这个注解让你把方法放在方法中。你可能不知道，但是你可以在方法中声明类，并且这个类中的方法可以访问任何在声明前定义和设置的（有效的）最终局部变量或参数。不幸的是，要真正调用任何方法，你必须先建立一个这个方法局部类的实例，但这就是`@Helper`的作用，它可以帮助你解决这个问题! 用`@Helper`来注解一个方法局部类，就好像该帮助类中的所有方法都是你可以直接调用的方法，就像`java`允许方法存在于方法内部一样。

通常情况下，你必须声明你的帮助器的实例，例如：`HelperClass h = new HelperClass();` 在声明了你的助手类之后，直接调用你的助手类中的方法，用`h.helperMethod();` 。有了`@Helper`，这两件事就不再需要了。你不需要浪费一行代码来声明一个助手的实例，也不需要在所有对助手方法的调用前加上`nameOfHelperInstance`。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.experimental.Helper;
public class HelperExample {
  int someMethod(int arg1) {
    int localVar = 5;
    @Helper class Helpers {
      int helperMethod(int arg) {
        return arg + localVar;
      }
    }
    return helperMethod(10);
  }
}
```

### 2. Java 标准写法

```java
public class HelperExample {
  int someMethod(int arg1) {
    int localVar = 5;
    class Helpers {
      int helperMethod(int arg) {
        return arg + localVar;
      }
    }
    Helpers $Helpers = new Helpers();
    return $Helpers.helperMethod(10);
  }
}
```

## 四、支持的配置项

`lombok.helper.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Helper`的任何使用标记为警告或错误（如果已配置）。

## 五、附属说明

`@Helper`要求辅助类有一个无`args`的构造函数。如果不是这样的话，将会产生一个编译器错误。

目前，你的辅助类的实例在引擎下被称为`$Foo`，其中`Foo`是你的辅助类的名字。我们将来可能会改变这一点；请不要依赖这个变量的存在。我们甚至可能在以后用一个兄弟姐妹的方法来代替它。

请不要指望 `this`在辅助方法的代码中会有任何意义。你可以通过使用语法`NameOfMyClass.this`来引用真正的“`this`”。

在代码中，任何存在于辅助类方法声明下面的、与辅助类中任何方法同名的未限定的方法调用都被认为是对辅助类的调用。如果参数最终不兼容，你会得到一个编译器错误。

除非你使用的是`JDK8`或更高版本（它引入了 "`effectively final`"的概念），否则如果你想在方法的局部类中引用局部变量和参数，你必须将它们声明为`final`变量。这是`java`的限制，不是`lombok`的`@Helper`特有的东西。
