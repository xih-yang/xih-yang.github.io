# 18、Lombok 实战教程 - @FieldDefaults | 通过Lombok设置字段默认值
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/18.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`@FieldDefaults`是在`lombok v0.11.4`中作为实验性功能引入的。

实验原因：

- 新功能；不确定这是否破坏了足够的模板。
- 如果您可以将其粘贴在package-info.java包上以设置该包中所有类的默认值，那就太好了。
- @Value 的部分工作，这是实验性的。

当前状态：积极 - 目前我们认为此功能可能会很快退出实验状态，不会发生变化或发生微小变化。

## 二、简介

`@FieldDefaults`注解可以为被注解的类或枚举中的每个字段添加访问修饰符（`public`, `private`, 或 `protected`）。它还可以为注释的类或枚举中的每个字段添加`final`。

要给每个（实例）字段添加`final`，使用`@FieldDefaults(makeFinal=true)`。任何必须保持非`final`的字段可以用`@NonFinal`（也在`lombok.experimental`包中）来注释。

要给每个（实例）字段添加一个访问修饰符，请使用`@FieldDefaults(level=AccessLevel.PRIVATE)`。任何还没有访问修饰符的字段（即任何看起来像包私有访问的字段）都被改变为具有适当的访问修饰符。任何必须保持包私有的字段都可以用`@PackagePrivate`来注释（也在`lombok.experimental`包中）。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.experimental.PackagePrivate;
@FieldDefaults(makeFinal=true, level=AccessLevel.PRIVATE)
public class FieldDefaultsExample {
  public final int a;
  int b;
  @NonFinal int c;
  @PackagePrivate int d;
  FieldDefaultsExample() {
    a = 0;
    b = 0;
    d = 0;
  }
}
```

### 2. Java 标准写法

```java
public class FieldDefaultsExample {
  public final int a;
  private final int b;
  private int c;
  final int d;
  FieldDefaultsExample() {
    a = 0;
    b = 0;
    d = 0;
  }
}
```

## 四、支持的配置项

`lombok.fieldDefaults.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@FieldDefaults`的任何使用标记为警告或错误（如果已配置）。

`lombok.fieldDefaults.defaultPrivate` = [`true` | `false`] (默认: `false`)

(自`1.16.8`起)如果设置为 “`true`”，被编译的源中的每个类或枚举中的每个字段都将被标记为私有，除非它有一个明确的访问修改器或`@PackagePrivate`注解，或者有一个明确的`@FieldDefaults`注解来覆盖这个配置键。

`lombok.fieldDefaults.defaultFinal` = [`true` | `false`] (默认: `false`)

(自`1.16.8`起)如果设置为 “`true`”，被编译的源中的每个类或枚举中的每个字段都将被标记为`final`，除非它有`@NonFinal`注释，或者有明确的`@FieldDefaults`注释来覆盖这个配置键。

## 五、附属说明

像其他接触字段的`lombok`处理程序一样，任何名字以美元（`$`）符号开头的字段都会被完全跳过。这样的字段根本就不会被修改。
