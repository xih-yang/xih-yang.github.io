# 13、Lombok 实战教程 - @With | 通过重新构造对象修改不可变属性
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/13.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@Wither`是在`lombok v0.11.4`中作为实验性功能引入的。

在`lombok v1.18.10`中，`@Wither`被改名为`@With`，并从实验包中移出，进入核心包。

对于一个不可变的属性来说，替代`setter`的第二种方法是构造一个对象的克隆，但这个字段有一个新值。产生这种克隆的方法正是`@With`所产生的：一个`withFieldName(newValue)`方法，它产生一个除了相关字段的新值以外的克隆。

例如，如果你创建了`public class Point { private final int x, y; }`，`setters`就没有意义了，因为这些字段是`final`的。`@With`可以为你生成一个`withX(int newXValue)`方法，该方法将返回一个新的点，其`x`的值为`newXValue`，`y`的值与原`y`相同。

`@With`依赖于所有字段的构造函数以完成其工作。如果这个构造函数不存在，你的`@With`注解将导致一个编译时错误信息。你可以使用`Lombok`自己的`@AllArgsConstructor`，或者因为`@Value`也会自动产生一个所有字段的构造函数，你也可以使用它。当然，如果你手动编写这个构造函数也是可以接受的。它必须包含所有的非静态字段，以相同的词法顺序。

与`@Setter`一样，如果希望生成的`with`方法不是`public`，则可以指定访问级别：`@With(level = AccessLevel.PROTECTED)`.与`@Setter`一样，你也可以在一个类型上加上`@With`注解，这意味着为每个字段（甚至是非`final`字段）生成一个`with`方法。

要将注释放在生成的方法上，您可以使用 `onMethod=@__({@AnnotationsHere})`。不过要小心！这是一个实验性功能。有关更多详细信息，请参阅 `onX` 功能的文档。

字段上的 `javadoc` 将被复制到生成的方法中。通常，所有文本都被复制，`@param` 移动到 `with` 方法，而 `@return` 行从 `with` 方法的 `javadoc` 中删除。移动的意思是：从字段的 `javadoc` 中删除。也可以为 `with` 方法的 `javadoc` 定义唯一的文本。为此，您创建了一个名为 `WITH` 的“`section`”。`section`是您的 `javadoc` 中的一行，包含 `2` 个或更多破折号，然后是文本“`WITH`”，后跟 `2` 个或更多破折号，并且该行上没有其他任何内容。如果您使用`section`，则不再执行该部分的 `@return` 和 `@param` 剥离/复制（将 `@param` 行移到该部分中）。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.NonNull;
import lombok.With;
public class WithExample {
  @With(AccessLevel.PROTECTED) @NonNull private final String name;
  @With private final int age;
  public WithExample(String name, int age) {
    if (name == null) throw new NullPointerException();
    this.name = name;
    this.age = age;
  }
}
```

### 2. Java 标准写法

```java
import lombok.NonNull;
public class WithExample {
  private @NonNull final String name;
  private final int age;
  public WithExample(String name, int age) {
    if (name == null) throw new NullPointerException();
    this.name = name;
    this.age = age;
  }
  protected WithExample withName(@NonNull String name) {
    if (name == null) throw new java.lang.NullPointerException("name");
    return this.name == name ? this : new WithExample(name, age);
  }
  public WithExample withAge(int age) {
    return this.age == age ? this : new WithExample(name, age);
  }
}
```

## 三、支持的配置项

`lombok.with.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`会将`@With`的任何用法标记为警告或错误（如果已配置）。

## 四、附属说明

无法为静态字段生成`With`方法，因为这毫无意义。

可以为抽象类生成`With`方法，但这会生成一个具有适当签名的抽象方法。

当对一个类型应用`@With`时，静态字段和名称以`$`开头的字段将被跳过。

在生成方法名时，如果字段的第一个字符是小写字母，就会被冠以大写字母，否则就不作修改。然后，以 "`with`"为前缀。

如果有任何方法已经存在，并且具有相同的名称（不区分大小写）和相同的参数数量，则不会生成任何方法。例如，`withX(int x)`如果已经有一个`withX(String...x)`的方法，将不会被生成，尽管从技术上来说，有可能生成该方法。这个注意事项的存在是为了防止混淆。如果一个方法的生成因为这个原因而被跳过，将会发出一个警告。可变参数算作`0`到`N`个参数。

各种众所周知的关于`nullity`的注释会导致`null`检查被插入，并将被复制到参数中。更多信息请看[Getter/Setter](/zhuanlan/tools/lombok/1/4.html)文档的附属说明。

如果您已通过 `lombok.config` 键 `lombok.addNullAnnotations` 配置了`nullity`注释风格，则方法或返回类型（适用于所选风格）将使用非空注释进行注释。
