# 04、Lombok 实战教程 - @Getter 和 @Setter | 如何优雅的进行对象的getter和setter操作
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/4.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

你可以用`@Getter`和`@Setter`来注解任何字段，让`lombok`自动生成默认的`getter/setter`。

如果字段名为`foo`，一个默认的`getter`则被命名为`getFoo`（如果字段的类型是布尔型，则被称为`isFoo`）。一个默认的setter被命名为`setFoo`，返回`void`，并且需要一个与字段类型相同的参数。它只是将字段设置为这个值。

生成的`getter/setter`方法访问级别将是`public`，除非你明确指定一个`AccessLevel`，如下面的例子中所示。合法的访问级别是`PUBLIC`、`PROTECTED`、`PACKAGE`和`PRIVATE`。

你也可以给一个类加上`@Getter`和`@Setter`注解。在这种情况下，就好像你用注解来注解该类中的所有非静态字段一样。

要把注释放在生成的方法上，你可以使用`onMethod=@__({@AnnotationsHere});`要把注释放在生成的`setter`方法的唯一参数上，你可以使用`onParam=@__({@AnnotationsHere})` 。不过要小心! 这是一个实验性的功能。更多细节请看关于`onX`功能的文档。

`Lombokv1.12.0`中的新功能：该字段上的`javadoc`现在将被复制到生成的`getter`和`setter`。通常，复制所有文本，`@return`移动到`getter`，而`@param`行移动到`setter`。移动意味着：从字段的`javadoc`中删除。还可以为每个`getter/setter`定义唯一的文本。为此，创建一个名为`GETTER`和`SETTER`的“`section`”。`section`是`javadoc`中包含`2`个或多个破折号的一行，然后是文本“`GETTER`”或“`SETTER`”，后跟`2`个或多个破折号，行上没有其他内容。如果使用`section`，则不再对该节执行`@return`和`@param`剥离（将`@return`或`@param`行移到`section`中）。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
public class GetterSetterExample {
  /**
   * Age of the person. Water is wet.
   * 
   * @param age New value for this person's age. Sky is blue.
   * @return The current value of this person's age. Circles are round.
   */
  @Getter @Setter private int age = 10;
  /**
   * Name of the person.
   * -- SETTER --
   * Changes the name of this person.
   * 
   * @param name The new value.
   */
  @Setter(AccessLevel.PROTECTED) private String name;
  @Override public String toString() {
    return String.format("%s (age: %d)", name, age);
  }
}
```

### 2. Java 标准写法

```java
public class GetterSetterExample {
  /**
   * Age of the person. Water is wet.
   */
  private int age = 10;
  /**
   * Name of the person.
   */
  private String name;
  @Override public String toString() {
    return String.format("%s (age: %d)", name, age);
  }
  /**
   * Age of the person. Water is wet.
   *
   * @return The current value of this person's age. Circles are round.
   */
  public int getAge() {
    return age;
  }
  /**
   * Age of the person. Water is wet.
   *
   * @param age New value for this person's age. Sky is blue.
   */
  public void setAge(int age) {
    this.age = age;
  }
  /**
   * Changes the name of this person.
   *
   * @param name The new value.
   */
  protected void setName(String name) {
    this.name = name;
  }
}
```

## 三、支持的配置项

`lombok.accessors.chain` = [`true` | `false`] (默认: `false`)

如果设置为`true`，生成的`setter`将返回该值（而不是`void`）。`@Accessors`注释的显式配置链参数优先于此设置。

`lombok.accessors.fluent` = [`true` | `false`] (默认: `false`)

若设置为`true`，生成的`getter`和`setter`将不会以`bean`标准[`get`、`is`或`set`]作为前缀；相反，这些方法将使用与字段相同的名称（减去前缀）。`@Accessors`注释的显式配置链参数优先于此设置。

`lombok.accessors.prefix` += 字段前缀 (默认: `empty list`)

这是一个列表属性；可以用`+=`操作符添加条目。从父级配置文件中继承的前缀可以用`-=`操作符删除。`Lombok`将从一个字段的名称中剥离任何匹配的字段前缀，以确定要生成的`getter/setter`的名称。例如，如果`m`是这个设置中列出的前缀之一，那么一个名为`mFoobar`的字段将导致一个名为`getFoobar()`的获取器，而不是`getMFoobar()`。明确配置的`@Accessors`注解的前缀参数优先于此设置。

`lombok.getter.noIsPrefix` = [`true` | `false`] (默认: `false`)

如果设置为`true`，为布尔字段生成的`getter`将使用`get`前缀，而不是默认的`is`前缀，任何调用`getter`的生成代码，如`@ToString`，也将使用`get`而不是`is`。

`lombok.setter.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Setter`的任何使用标记为`warning`或`error`（如果已配置）。

`lombok.getter.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Getter`的任何使用标记为`warning`或`error`（如果已配置）。

`lombok.copyableAnnotations` = [完全限定类型的列表] (默认: `empty list`)

`Lombok`会把这些注解中的任何一个从字段复制到`setter`参数和`getter`方法中。请注意，`Lombok` "开箱即用 "了一堆注释，这些注释是已知的可复制的。所有流行的`nullable`/`nonnull`注解。

## 四、附属说明

在生成方法名时，如果字段的第一个字符是小写字母，就会被冠以大写字母，否则就不作修改。然后，`get/set/is`是前缀。

如果有任何方法已经存在，并且具有相同的名称（不区分大小写）和相同的参数数量，则不会生成任何方法。例如，如果已经有了`getFoo(String...x)`方法，那么`getFoo()`就不会被生成，尽管从技术上来说，有可能生成该方法。这个注意事项的存在是为了防止混淆。如果因为这个原因跳过了方法的生成，将会发出一个警告。`Varargs`算作`0`到`N`个参数。你可以用`@lombok.experimental.Tolerate`标记任何方法，以便从`lombok`中隐藏它们。

对于以`is`开头，后面紧跟一个大写字母的布尔字段，生成的`getter`名称没有任何前缀。

`boolean`的任何变化都会导致使用`get`前缀而不是`is`前缀；例如，返回`java.lang.Boolean`的结果是`get`前缀，而不是`is`前缀。

一些来自流行库的注释表示非空，例如`javax.annotation.Nonnull`，如果在字段上存在，会导致在生成的`setter`中进行明确的空检查。

各种众所周知的关于可空性的注解，比如`org.eclipse.jdt.annotation.NonNull`，会被自动复制到正确的地方（`getters`的方法，`setters`的参数）。你可以通过`lombok`配置键`lombok.copyableAnnotations`来指定应该总是被复制的额外注解。

你可以用`@Getter`或`@Setter`注释来注解一个类。这样做等同于用该注解来注解该类中的所有非静态字段。对字段的`@Getter/@Setter`注解优先于对类的注解。

使用`AccessLevel.NONE`访问级别不会产生任何结果。它只在与`@Data`或全类的`@Getter或@Setter`结合时有用。

`@Getter`也可以用于枚举`@Setter`不能，不是出于技术原因，而是出于实际原因：在枚举上设置`Setter`是一个非常糟糕的主意。
