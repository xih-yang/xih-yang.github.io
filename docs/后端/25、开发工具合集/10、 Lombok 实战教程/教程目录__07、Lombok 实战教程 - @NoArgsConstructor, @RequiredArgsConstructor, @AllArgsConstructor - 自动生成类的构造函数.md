# 07、Lombok 实战教程 - @NoArgsConstructor, @RequiredArgsConstructor, @AllArgsConstructor | 自动生成类的构造函数
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/7.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

这组`3`个注释生成一个构造函数，该构造函数将为某些字段接受`1`个参数，并将该参数简单地分配给该字段。

`@NoArgsConstructor`将生成一个没有参数的构造函数。如果这是不可能的（因为有`final`字段），将产生一个编译器错误，除非使用`@NoArgsConstructor(force = true)`，那么所有最终字段将被初始化为`0 / false / null`。对于有约束条件的字段，如`@NonNull`字段，不会产生检查，所以要注意这些约束条件一般不会被满足，直到这些字段在以后被正确初始化。某些`java`构造，如`hibernate`和服务提供者接口，需要一个无`args`构造函数。这个注解主要是与`@Data`或其他构造函数生成注解结合使用。

`@RequiredArgsConstructor`为每个需要特殊处理的字段生成一个具有`1`个参数的构造函数。所有未初始化的`final`字段都会获得一个参数，以及任何标记为`@NonNull`且未在声明位置初始化的字段。对于标记为`@NonNull`的字段，还将生成显式`null`检查。如果用于标记为`@NonNull`的字段的任何参数包含`null`，则构造函数将抛出`NullPointerException`。参数的顺序与字段在类中的显示顺序相匹配。

`@AllArgsConstructor`为你的类中的每个字段生成一个带有`1`个参数的构造函数。标有`@NonNull`的字段会导致对这些参数的空值检查。

这些注解中的每一个都允许另一种形式，即生成的构造函数始终是私有的，并生成一个额外的静态工厂方法，该方法围绕私有构造函数。这种模式是通过为注解提供`staticName`值来启用的，像这样。`@RequiredArgsConstructor(staticName="of")`。这样的静态工厂方法将推断出泛型，与普通构造函数不同。这意味着你的`API`用户会得到写`MapEntry.of("foo", 5)`而不是更长的`new MapEntry("foo", 5)`。

要在生成的构造函数上加上注释，你可以使用`onConstructor=@__({@AnnotationsHere})`，但要小心，这是一个实验性的功能。更多细节请参见关于`onX`功能的文档。

与大多数其他`lombok`注释不同，显式构造函数的存在并不会阻止这些注释生成自己的构造函数。这意味着您可以编写自己的专用构造函数，并让`lombok`生成样板。如果出现冲突（其中一个构造函数的签名与`lombok`生成的签名相同），则会发生编译器错误。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.NonNull;
@RequiredArgsConstructor(staticName = "of")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class ConstructorExample<T> {
  private int x, y;
  @NonNull private T description;
  @NoArgsConstructor
  public static class NoArgsExample {
    @NonNull private String field;
  }
```

### 2. Java 标准写法

```java
public class ConstructorExample<T> {
  private int x, y;
  @NonNull private T description;
  private ConstructorExample(T description) {
    if (description == null) throw new NullPointerException("description");
    this.description = description;
  }
  public static <T> ConstructorExample<T> of(T description) {
    return new ConstructorExample<T>(description);
  }
  @java.beans.ConstructorProperties({
     "x", "y", "description"})
  protected ConstructorExample(int x, int y, T description) {
    if (description == null) throw new NullPointerException("description");
    this.x = x;
    this.y = y;
    this.description = description;
  }
  public static class NoArgsExample {
    @NonNull private String field;
    public NoArgsExample() {
    }
  }
}
```

## 三、支持的配置项

`lombok.anyConstructor.addConstructorProperties` = [`true` | `false`] (默认: `false`)

如果设置为`true`，那么`lombok`将为生成的构造函数添加`@java.beans.ConstructorProperties`

`lombok.[allArgsConstructor|requiredArgsConstructor|noArgsConstructor].flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`会将相关注释（`@AllArgsConstructor`、`@RequiredArgsConstructor`或`@NoArgsConstructor`）的任何使用标记为警告或错误（如果已配置）。

`lombok.anyConstructor.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`会将生成注释的`3`个构造函数中的任何一个的使用标记为警告或错误（如果已配置）。

`lombok.copyableAnnotations` = [完全限定类型的列表] (默认: `empty list`)

`Lombok`会将这些注释从字段复制到构造函数参数、`setter`参数和`getter`方法。请注意，`lombok`附带了一系列可复制的“开箱即用”注释：所有流行的`nullable/nonnull`注释。

`lombok.noArgsConstructor.extraPrivate` = [`true` | `false`] (默认: `false`)

如果为`true`，`lombok`将为任何`@Value`或`@Data`注释类生成一个私有的无参数构造函数，该构造函数将所有字段设置为默认值（`null/0/false`）。

## 四、附属说明

即使一个字段被明确地初始化为`null`，`lombok`也会认为避免`null`的要求得到了满足，并且不会将该字段视为一个 "`required`"的参数。我们的假设是，如果你明确地将`null`赋值给一个你已经标记为`@NonNull`的字段，你一定知道你在做什么。

对于没有参数的构造函数，永远不会生成`@java.beans.ConstructorProperties`注释。这也解释了`@NoArgsConstructor`缺少`suppressConstructorProperties`注释方法的原因。生成的静态工厂方法也不能获取`@ConstructorProperty`，因为此注释只能添加到实际构造函数中。

`@XArgsConstructor`也可以用在枚举定义上。生成的构造函数将总是私有的，因为非私有的构造函数在枚举中是不合法的。你不需要指定`AccessLevel.PRIVATE`。

关于空性的各种众所周知的注释会导致插入空检查并将其复制到参数。有关更多信息，请参阅[Getter/Setter](/zhuanlan/tools/lombok/1/4.html)文档的附属说明。

当构造函数由`@Data`、`@Value`或任何其他`lombok`注解生成时，`flagUsage`配置键不会触发。
