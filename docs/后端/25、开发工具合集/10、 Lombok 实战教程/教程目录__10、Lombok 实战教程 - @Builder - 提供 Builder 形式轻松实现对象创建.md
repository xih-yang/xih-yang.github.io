# 10、Lombok 实战教程 - @Builder | 提供 Builder 形式轻松实现对象创建
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/10.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

在`lombok v0.12.0`中，`@Builder`被作为实验性功能引入。

`@Builder`获得了`@Singular`的支持，并从`lombok v1.16.0`开始晋升为`lombok`主包。

在`lombok v1.16.16`中增加了`@Builder.Default`功能。

`@Builder(builderMethodName = "")`从`lombok v1.18.8`开始是合法的（并且会抑制生成`builder`方法）。

从`lombok v1.18.8`开始，`@Builder(access = AccessLevel.PACKAGE)`是合法的（并将生成具有指定访问级别的构建器类、构建器方法等）。

`@Builder`注解可以为你的类产生复杂的构建器`API`。

`@Builder`让你自动产生让你的类可实例化所需的代码，如：

```java
Person.builder()
.name("Adam Savage")
.city("San Francisco")
.job("Mythbusters")
.job("Unchained Reaction")
.build();
```

`@Builder`可以被放在一个类上，或者一个构造函数上，或者一个方法上。虽然 "在类上 "和 "在构造函数上 "的模式是最常见的使用情况，但`@Builder`最容易用 "方法 "的使用情况来解释。

使用`@Builder`注释的方法（从现在开始称为`target`）会导致生成以下 7 件事：

- 名为FooBuilder的内部静态类，具有与静态方法（称为构建器）相同的类型参数。
- 在构建器中： target的每个参数一个私有的非静态非final字段。
- 在构建器中：一个包私有无参数空构造函数。
- 在构建器中： target的每个参数的类似“setter”的方法：它与该参数具有相同的类型和相同的名称。它返回构建器本身，以便可以链接setter调用，如上例所示。
- 在构建器中：一个合理的 toString() 实现。
- 在包含target的类中：一个builder()方法，它可以创建一个新的builder实例。

如果该元素已经存在（不考虑参数个数并只查看名称），则每个列出的生成元素将被静默跳过。这包括构建器本身：如果该类已经存在，`lombok` 将简单地开始在这个已经存在的类中注入字段和方法，当然除非要注入的字段/方法已经存在。但是，您不能在构建器类上放置任何其他方法（或构造函数）来生成 `lombok` 注释；例如，您不能将 `@EqualsAndHashCode` 放在构建器类上。

`@Builder`可以为集合参数/字段生成所谓的 '`singular`'方法。这些方法只取一个元素而不是整个列表，并将该元素添加到列表中。比如说：

```java
Person.builder()
.job("Mythbusters")
.job("Unchained Reaction")
.build();
```

将导致`List jobs` 字段中有 `2` 个字符串。要获得此行为，需要使用`@Singular`对字段/参数进行注释。该功能有[自己的文档](https://projectlombok.org/features/Builder#singular)。

现在"方法 "模式已经很清楚了，在构造函数上加上`@Builder`注解的功能也很类似；实际上，构造函数只是静态方法，它有一个特殊的语法来调用它们。它们的 "返回类型 "是它们构造的类，它们的类型参数与该类本身的类型参数相同。

最后，将`@Builder`应用到一个类中，就好像你在该类中添加了`@AllArgsConstructor(access = AccessLevel.PACKAGE)`，并将`@Builder`注解应用到这个所有参数构造函数中。这只在你没有自己编写任何显式构造函数时有效。如果你有一个显式构造函数，请把 `@Builder` 注解放在构造函数上，而不是放在类上。请注意，如果你把`@Value`和`@Builder`都放在一个类上，`@Builder`想要生成的`package-private`构造函数就会 “获胜”，并抑制`@Value`想要生成的构造函数。

如果使用`@Builder`生成构建器来产生你自己类的实例（除非将`@Builder`添加到一个不返回你自己类型的方法中，否则总是如此），你可以使用`@Builder(toBuilder = true)`在你的类中也生成一个名为`toBuilder()`的实例方法；它创建一个新的构建器，开始时使用这个实例的所有值。你可以在参数（如果是构造函数或方法）或字段（如果是类型上的`@Builder`）上加上`@Builder.ObtainVia`注解，以表明该字段/参数的值是通过其他方式从这个实例中获得的。例如，你可以指定一个要调用的方法：`@Builder.ObtainVia(method = "calculateFoo")`。

构建器类的名字是`FoobarBuilder`，其中`Foobar`是目标返回类型的简化、大小写形式–也就是说，在构造函数和类型上`@Builder`的类型名称，以及在方法上`@Builder`的返回类型的名称。例如，如果`@Builder`被应用于一个名为`com.yoyodyne.FancyList`的类，那么构建器的名字将是`FancyListBuilder`。如果`@Builder`被应用于一个返回`void`的方法，那么构建器将被命名为`VoidBuilder`。

`builder`的可配置方面有：

- 构建器的类名（默认：返回类型 + ‘Builder’）
- build()方法的名称（默认值：“build”）
- build()方法的名称（默认值：“build”）
- 如果你想要toBuilder() （默认：关闭）
- 所有生成元素的访问级别（默认：public）。
- （不鼓励）如果您希望构建器的“set”方法具有前缀，即 Person.builder().setName("Jane").build() 而不是 Person.builder().name("Jane").build () 以及它应该是什么。

所有选项都从其默认值更改的示例用法：

```java
@Builder(builderClassName = "HelloWorldBuilder", buildMethodName = "execute", builderMethodName = "helloWorld", toBuilder = true, access = AccessLevel.PRIVATE, setterPrefix = "set")
```

想用`Jackson`这个`JSON/XML`工具来使用您的构建器？我们已经为您准备好了。请查看[@Jacksonized](https://projectlombok.org/features/experimental/Jacksonized)功能。

### @Builder.Default

如果某个字段/参数在构建会话中从未被设置过，那么它总是得到`0 / null / false`。如果你把`@Builder`放在一个类上（而不是一个方法或构造函数），你可以直接在字段上指定默认值，并用`@Builder.Default`注释该字段：

```java
@Builder.Default private final long created = System.currentTimeMillis();
```

### @Singular

通过用`@Singular`注解对其中一个参数（如果用`@Builder`注解方法或构造函数）或字段（如果用`@Builder`注解类）进行注解，`lombok`将把该构建器节点视为一个集合，并生成两个 "`adder` "方法，而不是一个 "`setter` "方法。一个是向集合添加一个元素，另一个是向集合添加另一个集合的所有元素。没有生成`setter`，只是设置集合（替换已经添加的东西）。还会生成一个’`clear`‘方法。这些’`singular`'构建器非常复杂，以保证以下属性：

- 当调用build()时，产生的集合将是不可变的。
- 在调用build()后，调用一个’adder’方法或’clear’方法不会修改任何已经生成的对象，而且，如果build()后来被再次调用，就会生成另一个集合，其中包含自创建builder以来添加的所有元素。
- 所产生的集合将被压缩到最小的可行格式，同时保持高效。

`@Singular`只能应用于`lombok`已知的集合类型。目前，支持的类型有：

- [java.util](https://docs.oracle.com/javase/8/docs/api/java/util/package-summary.html):
- `Iterable`、`Collection`和`List`（在一般情况下由一个压缩的不可修改的`ArrayList`支持）。
- `Set`、`SortedSet`和`NavigableSet`（在一般情况下，由一个大小适中的不可修改的`HashSet`或`TreeSet`支持）。
- `Map`、`SortedMap`和`NavigableMap`（在一般情况下由一个大小适中的不可修改的`HashMap`或`TreeMap`支持）。
- [Guava’s com.google.common.collect](https://github.com/google/guava):
- `ImmutableCollection`和`ImmutableList`（由`ImmutableList`的构建器功能支持）。
- `ImmutableSet`和`ImmutableSortedSet`（由这些类型的构建器功能支持）。
- `ImmutableMap`、`ImmutableBiMap`和`ImmutableSortedMap`（由这些类型的构建器功能支持）。
- `ImmutableTable`（由`ImmutableTable`的构建器功能支持）。

如果你的标识符是用普通英语写的，`lombok`假定任何带有`@Singular`的集合的名字是英语复数，并且会尝试自动将这个名字单数化。如果这是可行的，`add-one`方法将使用这个名字。例如，如果你的集合被称为`statuses`，那么`add-one`方法将自动被称为`status`。你也可以通过将单数形式作为参数传递给注解来明确指定你的标识符的单数形式，像这样：`@Singular("axis") List axes;`.

如果`lombok`不能将你的标识符单数化，或者它是模糊的，`lombok`将产生一个错误，并迫使你明确指定单数名称。

下面的片段没有显示`lombok`为`@Singular`字段/参数生成的内容，因为它相当复杂。你可以在[这里](https://projectlombok.org/features/builderSingular)查看一个片段。

如果同时使用`setterPrefix = "with"`，生成的名称是，例如：`withName`（添加1个名称），`withNames`（添加许多名称），和`clearNames`（重置所有名称）。

通常情况下，生成的’复数形式’方法（接收一个集合，并添加这个集合中的每个元素）会像`@NonNull`那样检查是否传递了`null`（默认情况下，抛出一个`NullPointerException`，并给出适当的消息）。然而，你也可以告诉`lombok`忽略这样的集合（因此，什么都不加，立即返回）：`@Singular(ignoreNullCollections = true.`

### Jackson

你可以通过自己制作构建器类来定制部分构建器，例如在构建器类中添加另一个方法，或者在构建器类中注释一个方法。`Lombok`会生成所有你没有手动添加的东西，并把它放到这个构建器类中。例如，如果你想配置`jackson`来使用一个集合的特定子类型，你可以这样写：

```java
@Value @Builder
@JsonDeserialize(builder = JacksonExample.JacksonExampleBuilder.class)
public class JacksonExample {
	@Singular(nullBehavior = NullCollectionBehavior.IGNORE) private List<Foo> foos;
	@JsonPOJOBuilder(withPrefix = "")
	public static class JacksonExampleBuilder implements JacksonExampleBuilderMeta {
	}
	private interface JacksonExampleBuilderMeta {
		@JsonDeserialize(contentAs = FooImpl.class) JacksonExampleBuilder foos(List<? extends Foo> foos)
	}
}
```

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.Builder;
import lombok.Singular;
import java.util.Set;
@Builder
public class BuilderExample {
  @Builder.Default private long created = System.currentTimeMillis();
  private String name;
  private int age;
  @Singular private Set<String> occupations;
}
```

### 2. Java 标准写法

```java
import java.util.Set;
public class BuilderExample {
  private long created;
  private String name;
  private int age;
  private Set<String> occupations;
  BuilderExample(String name, int age, Set<String> occupations) {
    this.name = name;
    this.age = age;
    this.occupations = occupations;
  }
  private static long $default$created() {
    return System.currentTimeMillis();
  }
  public static BuilderExampleBuilder builder() {
    return new BuilderExampleBuilder();
  }
  public static class BuilderExampleBuilder {
    private long created;
    private boolean created$set;
    private String name;
    private int age;
    private java.util.ArrayList<String> occupations;
    BuilderExampleBuilder() {
    }
    public BuilderExampleBuilder created(long created) {
      this.created = created;
      this.created$set = true;
      return this;
    }
    public BuilderExampleBuilder name(String name) {
      this.name = name;
      return this;
    }
    public BuilderExampleBuilder age(int age) {
      this.age = age;
      return this;
    }
    public BuilderExampleBuilder occupation(String occupation) {
      if (this.occupations == null) {
        this.occupations = new java.util.ArrayList<String>();
      }
      this.occupations.add(occupation);
      return this;
    }
    public BuilderExampleBuilder occupations(Collection<? extends String> occupations) {
      if (this.occupations == null) {
        this.occupations = new java.util.ArrayList<String>();
      }
      this.occupations.addAll(occupations);
      return this;
    }
    public BuilderExampleBuilder clearOccupations() {
      if (this.occupations != null) {
        this.occupations.clear();
      }
      return this;
    }
    public BuilderExample build() {
      // complicated switch statement to produce a compact properly sized immutable set omitted.
      Set<String> occupations = ...;
      return new BuilderExample(created$set ? created : BuilderExample.$default$created(), name, age, occupations);
    }
    @java.lang.Override
    public String toString() {
      return "BuilderExample.BuilderExampleBuilder(created = " + this.created + ", name = " + this.name + ", age = " + this.age + ", occupations = " + this.occupations + ")";
    }
  }
}
```

## 三、支持的配置项

`lombok.builder.className` = [一个`java`标识符，带有一个可选的星号，表示返回类型名称的位置。] (默认: `*Builder`)

除非你用`builderClassName`参数明确地挑选构建器的类名，否则就会选择这个名字；名字中的任何星号都会被替换成相关的返回类型。

`lombok.builder.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Builder`的任何使用标记为警告或错误（如果已配置）。

`lombok.singular.useGuava` = [`true` | `false`] (默认: `false`)

如果为`true`，`lombok`将使用`guava`的`ImmutableXxx`构建器和类型来实现`java.util`集合接口，而不是基于`Collections.unmodifiableXxx`创建实现。如果你使用这个设置，你必须确保`guava`在`classpath`和`buildpath`上确实可用。如果你的字段/参数有`guava`的`ImmutableXxx`类型之一，就会自动使用`guava`。

`lombok.singular.auto` = [`true` | `false`] (默认: `true`)

如果是`true`（这是默认的），`lombok`会自动尝试将你的标识符名称单数化，假设它是一个常见的英文复数。如果是`false`，你必须总是明确地指定单数名称，如果你不这样做，`lombok`会产生一个错误（如果你用英语以外的语言写代码，这很有用）。

## 四、附属说明

`@Singular`对`java.util.NavigableMap/Set`的支持只在你用`JDK1.8`或更高版本编译时有效。

你不能手动提供`@Singular`节点的部分或全部内容；`lombok`生成的代码对它来说太复杂了。如果你想手动控制与某些字段或参数相关的构建器代码（部分），不要使用`@Singular`，并手动添加你需要的一切。

排序的集合（`java.util`：`SortedSet`、`NavigableSet`、`SortedMap`、`NavigableMap` 和 `guava`: `ImmutableSortedSet`, `ImmutableSortedMap`）要求集合的类型参数具有自然顺序（实现`java.util.Comparable`）。没有办法在构建器中传递一个显式的比较器来使用。

如果目标集合来自`java.util`包，即使集合是一个`set`或`map`，`ArrayList`也被用来存储添加的元素作为`@Singular`标记字段的调用方法。因为`lombok`确保生成的集合是被压缩的，无论如何都必须构建一个新的`set`或`map`的支持实例，在构建过程中把数据存储为`ArrayList`比把它存储为`map`或`set`更有效率。这种行为在外部是不可见的，这是当前`java.util`对`@Singular``@Builder`的实现细节。

当`toBuilder = true`应用于方法时，任何被注释的方法本身的类型参数也必须显示在返回类型中。

`@Builder.Default`字段上的初始化器被移除并存储在一个静态方法中，以保证如果在构建中指定一个值，这个初始化器根本不会被执行。这确实意味着初始化器不能引用`this`、`super`或任何非静态成员。如果`lombok`为你生成一个构造函数，它也会用初始化器初始化这个字段。

在构建器中生成的表示有`@Builder.Default`设置的字段叫做`propertyName$value；`另外还生成了一个叫做`propertyName$set`的布尔字段来跟踪它是否已经被设置。这是一个实现细节；不要编写与这些字段交互的代码。相反，如果你想在构建器内部的自定义方法中设置该属性，请调用生成的`builder-setter`方法。

关于空性的各种众所周知的注释会导致插入空检查，并将其复制到生成器的“`setter`”方法的参数中。有关更多信息，请参阅[Getter/Setter](/zhuanlan/tools/lombok/1/4.html)文档的附属说明。

你可以抑制生成`builder()`方法，例如，因为你只想要`toBuilder()`的功能，通过使用。`@Builder(builderMethodName = "")`。当你这样做时，任何关于缺少`@Builder.Default`注解的警告都会消失，因为当只使用`toBuilder()`来生成构建器实例时，这样的警告并不相关。

你可以使用`@Builder`来复制构造函数：`foo.toBuilder().build()`会产生一个浅层克隆。如果你只是想要这个功能，可以考虑抑制构建器方法的生成，使用：`@Builder(toBuilder = true, builderMethodName = "")`。

由于`javac`处理静态导入的方式很特别，试图对静态`builder()`方法进行非星形静态导入是行不通的。要么使用星形静态导入。`import static TypeThatHasABuilder.*;`或者不要静态导入构建器方法。

如果将访问级别设置为`PROTECTED`，那么在构建者类内部生成的所有方法实际上都会被生成为公共的；在内部类中，`protected`关键字的含义是不同的，`PROTECTED`所表示的精确行为（允许同一包中的任何源的访问，以及来自外部类的任何子类的访问，用`@Builder`标记是不可能的，而将内部成员标记为`public`是我们可以得到的最接近的。

如果你通过`lombok.config`键`lombok.addNullAnnotations`配置了一个`nullity`注释的风格，任何为`@Singular`标记的属性生成的复数形式的构建器方法（这些复数形式的方法采取某种集合并添加所有元素）会在参数上得到一个`nullity`注释。你通常会得到一个非空的注释，但如果你把对作为集合传递的空的行为配置为`IGNORE`，则会生成一个可空的注释。
