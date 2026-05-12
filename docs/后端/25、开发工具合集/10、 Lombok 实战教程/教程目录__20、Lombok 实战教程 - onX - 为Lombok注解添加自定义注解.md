# 20、Lombok 实战教程 - onX | 为Lombok注解添加自定义注解
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/20.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`onX`是在`lombok v0.11.8`中作为实验性功能引入的。

实验因为：

- 丑陋的语法。这个功能的语法不是最佳的，但它是可能工作的最不曲折的语法（目前！）。
- 可能java 9会提供（更多）更好的方式来支持这个功能。
- 不确定因素。未来版本的javac可能会破坏这个功能，我们可能无法恢复它。

当前状态：不确定–目前我们觉得这个功能不能脱离实验状态。

## 二、简介

这个功能被认为是 “变通状态”–它的存在是为了让那些没有这个功能就无法工作的`lombok`用户无论如何都能使用这个功能。如果我们找到一个更好的方法来实现这个功能，或者未来的某个java版本引入了一个替代策略，这个功能可以在没有一个合理的废弃期的情况下消失。另外，这个功能可能在未来的javac版本中无法使用。使用时请自行斟酌。

大多数使`lombok`生成方法或构造函数的注解可以被配置为使`lombok`在生成的代码中的元素上添加自定义注解。

`@Getter`、`@Setter`和`@Wither`支持`onMethod`选项，这将把列出的注释放在生成的方法上。

`@AllArgsConstructor`、`@NoArgsConstructor`和`@RequiredArgsConstructor`支持`onConstructor`选项，它将把列出的注释放在生成的构造函数上。

除了`onMethod`之外，`@Setter`和`@Wither`还支持`onParam`；列出的注解将被放在生成的方法的唯一参数上。`@EqualsAndHashCode`也支持`onParam`；列出的注释将被放置在生成的`equals`方法的唯一参数上，以及任何生成的`canEqual`方法。

语法有点奇怪，取决于你所使用的`javac`。

在`javac7`上，要使用3个`onX`特性中的任何一个，你必须用`@__(@AnnotationGoesHere)`来包装要应用到构造函数/方法/参数的注释。要应用多个注释，请使用`@__({@Annotation1, @Annotation2})`。注释本身显然也可以有参数。

在`javac8`及以上版本中，你可以在`onMethod`、`onParam`或`onConstructor`后面加一个下划线。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import javax.inject.Inject;
import javax.persistence.Id;
import javax.persistence.Column;
import javax.validation.constraints.Max;
@AllArgsConstructor(onConstructor=@__(@Inject))
public class OnXExample {
//  @Getter(onMethod=@__({@Id, @Column(name="unique-id")})) //JDK7
//  @Setter(onParam=@__(@Max(10000))) //JDK7
  @Getter(onMethod_={
     @Id, @Column(name="unique-id")}) //JDK8
  @Setter(onParam_=@Max(10000)) //JDK8
  private long unid;
}
```

### 2. Java 标准写法

```java
import javax.inject.Inject;
import javax.persistence.Id;
import javax.persistence.Column;
import javax.validation.constraints.Max;
public class OnXExample {
  private long unid;
  @Inject
  public OnXExample(long unid) {
    this.unid = unid;
  }
  @Id @Column(name="unique-id")
  public long getUnid() {
    return unid;
  }
  public void setUnid(@Max(10000) long unid) {
    this.unid = unid;
  }
}
```

## 四、支持的配置项

`lombok.onX.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果已配置，`Lombok`会将`onX`的任何使用标记为警告或错误。

## 五、附属说明

这个奇怪的语法的原因是为了让这个功能在`javac 7`编译器中工作；`@__`类型是对注解类型`__`（双下划线）的注解引用，它实际上并不存在；这使得`javac 7`由于错误而延迟中止编译过程，因为有可能一个注解处理器后来会创建`__`类型。相反，`lombok`应用了注解并删除了引用，这样错误就不会真正发生。重点是。`__`类型必须不存在，否则这个特性就不能工作。在罕见的情况下，`__`类型确实存在（并且被导入或在包中），你可以简单地添加更多的下划线。技术上来说，任何不存在的类型都可以工作，但是为了保持一致性和可读性，并捕捉错误的使用，如果’`wrapper`'注解除了一系列下划线之外，`lombok`认为这是一个错误。

在`javac8`中，上述功能应该工作，但是由于`javac8`中的一个`bug`，它没有工作。然而，从`javac8`开始，如果参数名在注解类型中不存在，编译会进行到`lombok`可以修复它的阶段。

重申：这一特征随时可能消失；如果您使用此功能，当我们找到更好的实现此功能的方法时，或者如果`javac`的未来版本迫使我们在没有其他选择的情况下完全删除此功能时，请准备好调整代码。

`onX`参数在任何类型范围的变体上都是不合法的。例如，一个类上的`@Getter`注解不支持`onMethod`。
