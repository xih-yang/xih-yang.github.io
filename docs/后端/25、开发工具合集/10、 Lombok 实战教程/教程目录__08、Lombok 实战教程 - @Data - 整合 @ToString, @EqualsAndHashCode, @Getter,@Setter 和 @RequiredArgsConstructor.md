# 08、Lombok 实战教程 - @Data | 整合 @ToString, @EqualsAndHashCode, @Getter,@Setter 和 @RequiredArgsConstructor
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/8.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@Data`是一个方便的快捷注解，它将[@ToString](/zhuanlan/tools/lombok/1/5.html)、[@EqualsAndHashCode](/zhuanlan/tools/lombok/1/6.html)、[@Getter/@Setter](/zhuanlan/tools/lombok/1/4.html)和[@RequiredArgsConstructor](/zhuanlan/tools/lombok/1/7.html)的功能捆绑在一起。换句话说，`@Data`生成了所有通常与简单`POJO`（`Plain Old Java Objects`）和`Bean`相关的模板：所有字段的`getters`，所有非`final`字段的`setters`，以及适当的`toString`、`equals`和`hashCode`实现，这些都涉及到类的字段，还有一个初始化所有`final`字段的构造函数，以及所有没有初始化器的非`final`字段，这些都被标记为`@NonNull`，以确保字段永不为空。

`@Data`就像在类上有隐式的`@Getter`、`@Setter`、`@ToString`、`@EqualsAndHashCode`和`@RequiredArgsConstructor`注解一样（除非如果已经存在任何显式编写的构造函数，则不会生成任何构造函数）。但是，这些注解的参数（如`callSuper`、`includeFieldNames`和`exclude`）不能用`@Data`设置。如果你需要为这些参数中的任何一个设置非默认值，只需明确添加这些注解即可；`@Data`很聪明，会遵从这些注解。

所有生成的`getter`和`setter`的访问级别都是`public`。要覆盖访问级别，请使用显式`@Setter`或`@Getter`注释对字段或类进行注释。您还可以使用此注释（通过将其与`AccessLevel.NONE`结合使用）来禁止同时生成`getter`或`setter`。

标记为`transient`的所有字段将不考虑`hashCode`和`equals`。所有的静态字段将被完全跳过（不考虑任何生成的方法，也不会为它们生成`setter/getter`）。

如果类已经包含一个与通常生成的任何方法具有相同名称和参数数量的方法，则不会生成该方法，也不会发出警告或错误。例如，如果您已经有一个签名为`equals(AnyType param)`的方法，则不会生成`equals`方法，即使从技术上讲，由于参数类型不同，它可能是一个完全不同的方法。同样的规则也适用于构造函数（任何显式构造函数都会阻止`@Data`生成构造函数），以及`toString`、`equals`和所有`getter`和`setter`。您可以使用`@lombok.experional.permission`标记任何构造函数或方法，以对`lombok`隐藏它们。

`@Data`可以很好地处理字段的泛型参数。为了减少为有泛型的类构造对象时的模板，你可以使用`staticConstructor`参数来生成一个私有构造函数，以及一个返回新实例的静态方法。这样一来，`javac`就会推断出变量的名字。因此，通过这样的声明。`@Data(staticConstructor="of") class Foo { private T x;}` 你可以通过`Foo.of(5);`来创建`Foo`的新实例。 而不是：`new Foo(5);`。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.Setter;
import lombok.Data;
import lombok.ToString;
@Data public class DataExample {
  private final String name;
  @Setter(AccessLevel.PACKAGE) private int age;
  private double score;
  private String[] tags;
  @ToString(includeFieldNames=true)
  @Data(staticConstructor="of")
  public static class Exercise<T> {
    private final String name;
    private final T value;
  }
}
```

### 2. Java 标准写法

```java
import java.util.Arrays;
public class DataExample {
  private final String name;
  private int age;
  private double score;
  private String[] tags;
  public DataExample(String name) {
    this.name = name;
  }
  public String getName() {
    return this.name;
  }
  void setAge(int age) {
    this.age = age;
  }
  public int getAge() {
    return this.age;
  }
  public void setScore(double score) {
    this.score = score;
  }
  public double getScore() {
    return this.score;
  }
  public String[] getTags() {
    return this.tags;
  }
  public void setTags(String[] tags) {
    this.tags = tags;
  }
  @Override public String toString() {
    return "DataExample(" + this.getName() + ", " + this.getAge() + ", " + this.getScore() + ", " + Arrays.deepToString(this.getTags()) + ")";
  }
  protected boolean canEqual(Object other) {
    return other instanceof DataExample;
  }
  @Override public boolean equals(Object o) {
    if (o == this) return true;
    if (!(o instanceof DataExample)) return false;
    DataExample other = (DataExample) o;
    if (!other.canEqual((Object)this)) return false;
    if (this.getName() == null ? other.getName() != null : !this.getName().equals(other.getName())) return false;
    if (this.getAge() != other.getAge()) return false;
    if (Double.compare(this.getScore(), other.getScore()) != 0) return false;
    if (!Arrays.deepEquals(this.getTags(), other.getTags())) return false;
    return true;
  }
  @Override public int hashCode() {
    final int PRIME = 59;
    int result = 1;
    final long temp1 = Double.doubleToLongBits(this.getScore());
    result = (result*PRIME) + (this.getName() == null ? 43 : this.getName().hashCode());
    result = (result*PRIME) + this.getAge();
    result = (result*PRIME) + (int)(temp1 ^ (temp1 >>> 32));
    result = (result*PRIME) + Arrays.deepHashCode(this.getTags());
    return result;
  }
  public static class Exercise<T> {
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
    @Override public String toString() {
      return "Exercise(name=" + this.getName() + ", value=" + this.getValue() + ")";
    }
    protected boolean canEqual(Object other) {
      return other instanceof Exercise;
    }
    @Override public boolean equals(Object o) {
      if (o == this) return true;
      if (!(o instanceof Exercise)) return false;
      Exercise<?> other = (Exercise<?>) o;
      if (!other.canEqual((Object)this)) return false;
      if (this.getName() == null ? other.getValue() != null : !this.getName().equals(other.getName())) return false;
      if (this.getValue() == null ? other.getValue() != null : !this.getValue().equals(other.getValue())) return false;
      return true;
    }
    @Override public int hashCode() {
      final int PRIME = 59;
      int result = 1;
      result = (result*PRIME) + (this.getName() == null ? 43 : this.getName().hashCode());
      result = (result*PRIME) + (this.getValue() == null ? 43 : this.getValue().hashCode());
      return result;
    }
  }
}
```

## 三、支持的配置项

`lombok.data.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了`@Data`，`Lombok`会将任何对`@Data`的使用标记为警告或错误。

`lombok.noArgsConstructor.extraPrivate` = [`true` | `false`] (默认: `false`)

如果为`true`，`lombok`将为任何`@Data`注释类生成一个私有的无参数构造函数，该构造函数将所有字段设置为默认值（`null/0/false`）

## 四、附属说明

请参阅[@ToString](/zhuanlan/tools/lombok/1/5.html)、[@EqualsAndHashCode](/zhuanlan/tools/lombok/1/6.html)、[@Getter/@Setter](/zhuanlan/tools/lombok/1/4.html)和[@RequiredArgsConstructor](/zhuanlan/tools/lombok/1/7.html)的附属说明。

关于null性的各种众所周知的注释会导致插入`null`检查并将其复制到相关位置（例如`getter`的方法以及构造函数和`setter`的参数）。有关更多信息，请参阅[@Getter/@Setter](/zhuanlan/tools/lombok/1/4.html)文档的附属说明。

默认情况下，任何以`$`符号开头的变量都被自动排除。你可以通过指定一个明确的注释（例如，`@Getter`或`@ToString`）并使用 "`of` "参数来包括它们。
