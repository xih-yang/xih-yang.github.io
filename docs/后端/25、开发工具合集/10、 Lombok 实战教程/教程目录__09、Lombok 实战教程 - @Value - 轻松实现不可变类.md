# 09、Lombok 实战教程 - @Value | 轻松实现不可变类
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/9.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

在`lombok v0.11.4`中，`@Value`被作为实验性功能引入。

自`lombok v0.11.8`以来，`@Value`不再意味着`@With`。

自`lombok v0.12.0`以来，`@Value`被提升为`lombok`主包。

`@Value`是[@Data](/zhuanlan/tools/lombok/1/8.html)的不可更改变体；默认情况下，所有字段都是`private`和`final`的，并且不会生成`setter`。默认情况下，类本身也是`final`的，因为不可变性不是可以强加给子类的东西。与`@Data`一样，还生成了有用的`toString()`、`equals()`和`hashCode()`方法，每个字段都得到一个getter方法，并且还生成了一个覆盖每个参数（除了在字段声明中初始化的`final`字段）的构造函数。

实际上，`@Value`是以下内容的缩写：`final @ToString @EqualsAndHashCode @AllArgsConstructor @FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE) @Getter`，除了明确包括任何相关方法的实现，只是意味着该部分不会被生成，也不会发出警告。例如，如果你写了你自己的`toString`，不会发生错误，`lombok`也不会生成`toString`。另外，任何显式构造函数，无论参数列表如何，都意味着`lombok`不会生成一个构造函数。如果你确实想让`lombok`生成所有参数的构造函数，请在类中添加`@AllArgsConstructor`。注意，如果`@Builder`和`@Value`都在一个类上，`@Builder`想做的包的私有所有参数构造函数会 "胜过"`@Value`想做的公共构造函数。你可以用`@lombok.experimental.Tolerate`来标记任何构造函数或方法，以便从`lombok`中隐藏它们。

我们可以使用字段上的显式访问级别或者使用 `@NonFinal` 或 `@PackagePrivate` 注解来覆盖 `final-by-default` 和 `private-by-default` 行为。`@NonFinal`也可以在一个类上使用，以删除`final`关键字。

可以通过明确使用该注解来覆盖构成`@Value`的任何 "零件"的任何默认行为。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.experimental.NonFinal;
import lombok.experimental.Value;
import lombok.experimental.With;
import lombok.ToString;
@Value public class ValueExample {
  String name;
  @With(AccessLevel.PACKAGE) @NonFinal int age;
  double score;
  protected String[] tags;
  @ToString(includeFieldNames=true)
  @Value(staticConstructor="of")
  public static class Exercise<T> {
    String name;
    T value;
  }
}
```

### 2. Java 标准写法

```java
import java.util.Arrays;
public final class ValueExample {
  private final String name;
  private int age;
  private final double score;
  protected final String[] tags;
  @java.beans.ConstructorProperties({
     "name", "age", "score", "tags"})
  public ValueExample(String name, int age, double score, String[] tags) {
    this.name = name;
    this.age = age;
    this.score = score;
    this.tags = tags;
  }
  public String getName() {
    return this.name;
  }
  public int getAge() {
    return this.age;
  }
  public double getScore() {
    return this.score;
  }
  public String[] getTags() {
    return this.tags;
  }
  @java.lang.Override
  public boolean equals(Object o) {
    if (o == this) return true;
    if (!(o instanceof ValueExample)) return false;
    final ValueExample other = (ValueExample)o;
    final Object this$name = this.getName();
    final Object other$name = other.getName();
    if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
    if (this.getAge() != other.getAge()) return false;
    if (Double.compare(this.getScore(), other.getScore()) != 0) return false;
    if (!Arrays.deepEquals(this.getTags(), other.getTags())) return false;
    return true;
  }
  @java.lang.Override
  public int hashCode() {
    final int PRIME = 59;
    int result = 1;
    final Object $name = this.getName();
    result = result * PRIME + ($name == null ? 43 : $name.hashCode());
    result = result * PRIME + this.getAge();
    final long $score = Double.doubleToLongBits(this.getScore());
    result = result * PRIME + (int)($score >>> 32 ^ $score);
    result = result * PRIME + Arrays.deepHashCode(this.getTags());
    return result;
  }
  @java.lang.Override
  public String toString() {
    return "ValueExample(name=" + getName() + ", age=" + getAge() + ", score=" + getScore() + ", tags=" + Arrays.deepToString(getTags()) + ")";
  }
  ValueExample withAge(int age) {
    return this.age == age ? this : new ValueExample(name, age, score, tags);
  }
  public static final class Exercise<T> {
    private final String name;
    private final T value;
    private Exercise(String name, T value) {
      this.name = name;
      this.value = value;
    }
    public static <T> Exercise<T> of(String name, T value) {
      return new Exercise<T>(name, value);
    }
    public String getName() {
      return this.name;
    }
    public T getValue() {
      return this.value;
    }
    @java.lang.Override
    public boolean equals(Object o) {
      if (o == this) return true;
      if (!(o instanceof ValueExample.Exercise)) return false;
      final Exercise<?> other = (Exercise<?>)o;
      final Object this$name = this.getName();
      final Object other$name = other.getName();
      if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
      final Object this$value = this.getValue();
      final Object other$value = other.getValue();
      if (this$value == null ? other$value != null : !this$value.equals(other$value)) return false;
      return true;
    }
    @java.lang.Override
    public int hashCode() {
      final int PRIME = 59;
      int result = 1;
      final Object $name = this.getName();
      result = result * PRIME + ($name == null ? 43 : $name.hashCode());
      final Object $value = this.getValue();
      result = result * PRIME + ($value == null ? 43 : $value.hashCode());
      return result;
    }
    @java.lang.Override
    public String toString() {
      return "ValueExample.Exercise(name=" + getName() + ", value=" + getValue() + ")";
    }
  }
}
```

## 三、支持的配置项

`lombok.value.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Value`的任何用法标记为警告或错误（如果已配置）。

`lombok.noArgsConstructor.extraPrivate` = [`true` | `false`] (默认: `false`)

如果为`true`，`lombok`将为任何`@Value`注释类生成一个私有的无参数构造函数，该构造函数将所有字段设置为默认值（`null/0/false`）。

## 四、附属说明

查找有关`@Value`的“零件”的文档：[@ToString](/zhuanlan/tools/lombok/1/5.html)、[@EqualsAndHashCode](/zhuanlan/tools/lombok/1/6.html)、[@AllArgsConstructor](/zhuanlan/tools/lombok/1/7.html)、[@FieldDefaults](https://projectlombok.org/features/experimental/FieldDefaults) 和 [@Getter](/zhuanlan/tools/lombok/1/4.html)。

对于具有泛型的类，将静态方法用作构造函数是很有用的，因为通过静态方法推断泛型参数在 `java6` 中有效并且避免了必须使用菱形运算符。虽然您可以通过应用显式 `@AllArgsConstructor(staticConstructor="of")` 注释来强制执行此操作，但还有 `@Value(staticConstructor="of")` 功能，它将使生成的所有参数构造函数私有，并生成公共静态名为 `of` 的方法是此私有构造函数的包装器。

各种众所周知的关于空性的注解会导致插入空检查并将其复制到相关位置（例如 `getter` 的方法，以及构造函数和 `setter` 的参数）。有关更多信息，请参阅 [Getter/Setter](/zhuanlan/tools/lombok/1/4.html) 文档的附属说明。

`@Value` 是一个从 `v0.11.4` 到 `v0.11.9` 的实验性功能（如`@lombok.experimental.Value`）。它已被移至核心包中。旧注释仍然存在（并且是别名）。不过，它最终会在未来的版本中被删除。

无法使用`@FieldDefaults`来“`undo`”注释类中字段的 `private-by-default` 和`final-by-default`方面。在类中的字段上使用`@NonFinal`和`@PackagePrivate`来重写此行为。
