# 05、Lombok 实战教程 - @ToString | 自动生成类的 ToString 方法
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/5.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

任何类定义都可以用`@ToString`注释，以使`lombok`生成`ToString()`方法的实现。默认情况下，它将按顺序打印您的类名以及每个字段，并用逗号分隔。

通过设置`includeFieldNames`参数为`true`，你可以为`toString()`方法的输出增加一些清晰度（但也有相当的长度）。

默认情况下，所有非静态字段将被打印。如果你想跳过某些字段，你可以用`@ToString.Exclude`来注释这些字段。另外，你可以通过使用`@ToString(onlyExplicitlyIncluded = true)`，然后用`@ToString.Include`标记你想包括的每个字段，来准确指定你希望使用的字段。

通过设置`callSuper`为`true`，你可以在输出中包含`toString`的父类实现的输出。请注意，`java.lang.Object`中`toString()`的默认实现几乎是没有意义的，所以你可能不想这样做，除非你正在扩展另一个类。

你也可以在你的`toString`中包含一个方法调用的输出。只有没有参数的实例（非静态）方法可以被包含。要做到这一点，请用`@ToString.Include`标记该方法。

你可以通过`@ToString.Include(name = "其他名字")`改变用于识别成员的名称，你也可以通过`@ToString.Include(rank = -1)`改变成员的打印顺序。没有等级的成员被认为等级为`0`，等级较高的成员被首先打印，相同等级的成员按照它们在源文件中出现的顺序打印。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.ToString;
@ToString
public class ToStringExample {
  private static final int STATIC_VAR = 10;
  private String name;
  private Shape shape = new Square(5, 10);
  private String[] tags;
  @ToString.Exclude private int id;
  public String getName() {
    return this.name;
  }
  @ToString(callSuper=true, includeFieldNames=true)
  public static class Square extends Shape {
    private final int width, height;
    public Square(int width, int height) {
      this.width = width;
      this.height = height;
    }
  }
}
```

### 2. Java 标准写法

```java
import java.util.Arrays;
public class ToStringExample {
  private static final int STATIC_VAR = 10;
  private String name;
  private Shape shape = new Square(5, 10);
  private String[] tags;
  private int id;
  public String getName() {
    return this.name;
  }
  public static class Square extends Shape {
    private final int width, height;
    public Square(int width, int height) {
      this.width = width;
      this.height = height;
    }
    @Override public String toString() {
      return "Square(super=" + super.toString() + ", width=" + this.width + ", height=" + this.height + ")";
    }
  }
  @Override public String toString() {
    return "ToStringExample(" + this.getName() + ", " + this.shape + ", " + Arrays.deepToString(this.tags) + ")";
  }
}
```

## 三、支持的配置项

`lombok.toString.includeFieldNames` = [`true` | `false`] (默认: `true`)

通常，`lombok`为每个字段生成一个`toString`响应的片段，形式为`fieldName = fieldValue`。如果这个设置为`false`，`lombok`将省略字段的名称，并简单地部署所有字段值的逗号分隔的列表。注释参数 “`includeFieldNames`”，如果明确指定，将优先于这个设置。

`lombok.toString.doNotUseGetters` = [`true` | `false`] (默认: `false`)

如果设置为`true`，`lombok`在生成`toString`方法时将直接访问字段而不是使用`getters`（如果有的话）。注释参数 “`doNotUseGetters`”，如果明确指定的话，将优先于这个设置。

`lombok.toString.callSuper` = [`call` | `skip` | `warn`] (默认: `skip`)

如果设置为`call`，则如果您的类扩展了某些内容，`lombok`将生成对`toString`的父类实现的调用。如果设置为`skip`，则不会生成此父类调用。如果设置为`warn`，则也不会生成此父类调用，但`lombok`会生成警告来告诉您。

`lombok.toString.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@ToString`的任何使用标记为警告或错误（如果已配置）。

## 四、附属说明

如果有任何名为`toString`的方法没有参数，无论返回类型如何，都不会生成任何方法，而是发出一个警告，解释说你的`@ToString`注解什么都没做。你可以用`@lombok.experimental.Tolerate`来标记任何方法，以便从`lombok`中隐藏它们。

`Arrays`是通过`Arrays.deepToString`打印的，这意味着包含自己的数组将导致`StackOverflowErrors`。不过，这种行为与`ArrayList`等没有区别。

如果一个方法被标记为包含，并且它与一个字段有相同的名字，它将取代该字段的`toString`输出（该方法被包含，该字段被排除，并且该方法的输出被打印在该字段将被打印的地方）。

在`lombok 1.16.22`之前，包含/排除可以通过`@ToString`注解的`of`和`exclude`参数完成。这种旧式的包含机制仍然被支持，但在未来将被废弃。

在一个成员上同时有`@ToString.Exclude`和`@ToString.Include`会产生一个警告；在这种情况下，该成员将被排除。

我们不承诺在`lombok`版本之间保持生成的`toString()`方法的输出相同。你不应该把你的`API`设计成让其他代码被迫解析你的`toString()`输出。

默认情况下，任何以`$`符号开头的变量都被自动排除。你只能通过使用`@ToString.Include`注解来包含它们。

如果存在要包含的字段的`getter`，则将调用它，而不是使用直接字段引用。这种行为可以直接字段引用：

```java
@ToString(doNotUseGetters = true)
```

`@ToString`也可以用于枚举定义。

如果您已经通过`lombok.config`键`lombok.addNullAnnotations`配置了空值注释风格，则方法或返回类型（根据所选风格而定）将使用非`null`注释进行注释。
