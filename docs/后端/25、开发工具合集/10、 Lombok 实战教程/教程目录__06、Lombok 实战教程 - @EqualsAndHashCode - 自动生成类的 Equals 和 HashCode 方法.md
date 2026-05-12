# 06、Lombok 实战教程 - @EqualsAndHashCode | 自动生成类的 Equals 和 HashCode 方法
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/6.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

任何类的定义都可以用`@EqualsAndHashCode`来注释，让`lombok`生成`equals(Object other)`和`hashCode()`方法的实现。默认情况下，它将使用所有非静态、非瞬时的字段，但是你可以通过用`@EqualsAndHashCode.Include`或`@EqualsAndHashCode.Exclude`标记类型成员来修改哪些字段被使用（甚至指定各种方法的输出被使用）。另外，你可以通过用`@EqualsAndHashCode.Include`标记它们并使用`@EqualsAndHashCode(onlyExplicitlyIncluded = true)`来精确指定你希望使用的字段或方法。

如果将`@EqualsAndHashCode`应用于一个子类，这个功能就变得有点棘手了。通常情况下，为这类自动生成`equals`和`hashCode`方法是个坏主意，因为父类也定义了字段，这些字段也需要`equals/hashCode`代码，但这些代码不会被生成。通过设置`callSuper`为`true`，你可以在生成的方法中包含你的父类的`equals`和`hashCode`方法。对于`hashCode`，`super.hashCode()`的结果被包含在哈希算法中，而在`equals`，如果父类实现认为它不等于传入的对象，生成的方法将返回`false`。请注意，并非所有的`equals`实现都能正确处理这种情况。然而，`lombok`生成的`equals`实现会正确处理这种情况，所以如果你的父类也有一个`lombok`生成的`equals`方法，你可以安全地调用它。如果你有一个明确的父类，你将被迫为`callSuper`提供一些值，以确认你已经考虑了它；如果不这样做，将导致一个警告。

当你不扩展任何东西（其实扩展了`java.lang.Object`）时，将`callSuper`设置为`true`是一个编译时错误，因为它将使生成的`equals()`和`hashCode()`实现具有与简单地从`java.lang.Object`继承这些方法一样的行为：只有相同的对象才会互相相等，并且会有相同的`hashCode`。当你扩展另一个类时，不把`callSuper`设置为`true`会产生一个警告，因为除非父类没有（重要的）字段，否则`lombok`不能为你生成一个考虑到你的父类所声明的字段的实现。你需要编写你自己的实现，或者依靠`callSuper`的链式工具。你也可以使用`lombok.equalsAndHashCode.callSuper`配置键。

`Lombok 0.10`中的新内容：除非你的类是`final`并且扩展了`java.lang.Object`，否则`lombok`会生成一个`canEqual`方法，这意味着`JPA`代理仍然可以和他们的基类相等，但是添加新状态的子类不会破坏等价合约。本文将解释为什么需要这样一个方法的复杂原因：[如何在Java中编写一个等价方法](https://www.artima.com/lejava/articles/equality.html)。如果一个层次结构中的所有类都是`scala`案例类和带有`lombok`生成的等价方法的类的混合体，那么所有的等价都会 “正常工作”。如果你需要写你自己的`equals`方法，如果你改变了`equals`和`hashCode`，你应该总是覆盖`canEqual`。

`Lombok 1.14.0`中的新增功能：要在`equals`(如果相关，还有`canEqual`)方法的另一个参数上添加注释，可以使用`onParam=@_u({@AnnotationsHere})`。不过要小心！这是一个实验特性。有关更多详细信息，请参阅有关`onX`功能的文档。

`Lombok 1.18.16`中的新内容：生成的`hashCode()`的结果可以通过设置`cacheStrategy`为`CacheStrategy.NEVER`以外的值进行缓存。如果注释类的对象可以以任何方式被修改，从而导致`hashCode()`的结果改变，请不要使用这个方法。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.EqualsAndHashCode;
@EqualsAndHashCode
public class EqualsAndHashCodeExample {
  private transient int transientVar = 10;
  private String name;
  private double score;
  @EqualsAndHashCode.Exclude private Shape shape = new Square(5, 10);
  private String[] tags;
  @EqualsAndHashCode.Exclude private int id;
  public String getName() {
    return this.name;
  }
  @EqualsAndHashCode(callSuper=true)
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
public class EqualsAndHashCodeExample {
  private transient int transientVar = 10;
  private String name;
  private double score;
  private Shape shape = new Square(5, 10);
  private String[] tags;
  private int id;
  public String getName() {
    return this.name;
  }
  @Override public boolean equals(Object o) {
    if (o == this) return true;
    if (!(o instanceof EqualsAndHashCodeExample)) return false;
    EqualsAndHashCodeExample other = (EqualsAndHashCodeExample) o;
    if (!other.canEqual((Object)this)) return false;
    if (this.getName() == null ? other.getName() != null : !this.getName().equals(other.getName())) return false;
    if (Double.compare(this.score, other.score) != 0) return false;
    if (!Arrays.deepEquals(this.tags, other.tags)) return false;
    return true;
  }
  @Override public int hashCode() {
    final int PRIME = 59;
    int result = 1;
    final long temp1 = Double.doubleToLongBits(this.score);
    result = (result*PRIME) + (this.name == null ? 43 : this.name.hashCode());
    result = (result*PRIME) + (int)(temp1 ^ (temp1 >>> 32));
    result = (result*PRIME) + Arrays.deepHashCode(this.tags);
    return result;
  }
  protected boolean canEqual(Object other) {
    return other instanceof EqualsAndHashCodeExample;
  }
  public static class Square extends Shape {
    private final int width, height;
    public Square(int width, int height) {
      this.width = width;
      this.height = height;
    }
    @Override public boolean equals(Object o) {
      if (o == this) return true;
      if (!(o instanceof Square)) return false;
      Square other = (Square) o;
      if (!other.canEqual((Object)this)) return false;
      if (!super.equals(o)) return false;
      if (this.width != other.width) return false;
      if (this.height != other.height) return false;
      return true;
    }
    @Override public int hashCode() {
      final int PRIME = 59;
      int result = 1;
      result = (result*PRIME) + super.hashCode();
      result = (result*PRIME) + this.width;
      result = (result*PRIME) + this.height;
      return result;
    }
    protected boolean canEqual(Object other) {
      return other instanceof Square;
    }
  }
}
```

## 三、支持的配置项

`lombok.equalsAndHashCode.doNotUseGetters` = [`true` | `false`] (默认: `false`)

如果设置为`true`，`lombok`在生成`equals`和`hashCode`方法时将直接访问字段而不是使用`getters`（如果有的话）。注释参数 “`doNotUseGetters`”，如果明确指定的话，将优先于这个设置。

`lombok.equalsAndHashCode.callSuper` = [`call` | `skip` | `warn`] (默认: `warn`)

如果设置为`call`，`lombok`将为子类生成对`hashCode`和`equals`的父类实现的调用。如果设置为`skip`，则不会产生这样的调用。默认行为`warn`和`skip`一样，只是多了一个额外的警告。

`lombok.equalsAndHashCode.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@EqualsAndHashCode`的任何使用标记为警告或错误（如果已配置）。

## 四、附属说明

`Arrays`是 "深度 "比较/哈希编码，这意味着包含自己的数组将导致`StackOverflow`错误。不过，这种行为与`ArrayList`等没有区别。

您可以放心地假设所使用的`hashCode`实现不会在`lombok`的不同版本之间发生变化，但是这种保证并不是一成不变的；如果使用另一种哈希算法可以显著提高性能，那么将在未来的版本中进行替换。

出于相等的目的，浮点数和双精度浮点数的`2`个`NaN`（不是数字）值被视为相等，虽然`'NaN==NaN`’返回`false`。这类似于`java.lang.Double`的`equals`方法，并且实际上是确保将对象与自身的精确副本进行比较时返回`true`表示相等所必需的。

如果有任何名为`hashCode`或`equals`的方法，无论其返回类型如何，都不会被生成，而是发出一个警告。这两个方法需要彼此同步，除非`lombok`生成所有的方法，否则无法保证，因此如果一个或两个方法已经存在，你总是会得到一个警告。你可以用`@lombok.experimental.Tolerate`标记任何方法，以便从`lombok`中隐藏它们。

尝试排除不存在或无论如何都会被排除的字段（由于它们是静态或瞬态的）会在命名字段上产生警告。

如果一个方法被标记为包含，并且它与一个字段有相同的名称，那么它将取代该字段（方法被包含，字段被排除）。

在`lombok 1.16.22`之前，包含/排除可以通过`@EqualsAndHashCode`注解的`of`和`exclude`参数完成。这种旧式的包含机制仍然被支持，但在未来将被废弃。

默认情况下，任何以$符号开头的变量都被自动排除。你只能通过用`@EqualsAndHashCode.Include`标记它们来包括它们。

如果一个要包含的字段存在一个getter，它将被调用，而不是使用一个直接的字段引用。这种行为可以使用字段引用：

```java
@EqualsAndHashCode(doNotUseGetters = true)
```

如果您已经通过`lombok.config`键`lombok.addNullAnnotations`配置了`nullity`注释风格，则生成的`equals`方法以及任何`canEqual`方法的参数都将使用可为`Null`的注释进行注释。如果将`@NonNullByDefault`样式注释与严格的空性检查结合使用，则需要执行此操作。
