# 16、Lombok 实战教程 - @Accessors | 自定义getters和setters的生成格式
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/16.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

在`lombok v0.11.0`中，`@Accessors`被作为实验性功能引入。

添加原因：

- 我们可能希望将这些功能集成到一个更完整的属性支持概念中。
- 新功能 - 社区反馈。

当前状态：中性 - 预计会有一些变化。这些变化是为了向后兼容，但应该从实验性功能开始。

- 开放的功能请求：以小写字母开头的属性的命名行为，后面是大写字母。一半的规范、工具和lombok用户喜欢把名为uLimit的字段变成getULimit（包括lombok），另一半则转向喜欢getuLimit。@Accessors可以参与任何解决这一要求的更新。
- 开放功能请求：更多地控制命名访问器；例如，解决创造性命名的布尔属性：将 boolean wasRunning 转换为 boolean wasRunning() 而不是 boolean isWasRunning()，以及更广泛的前缀支持。如果解决此功能请求，将涉及@Accessors。
- @Accessors目前没有从字段@Accessors注解 "级联 "到类级@Accessors注解，但它确实 "级联 "到lombok.config。改变这一点并不困难，但是向后不兼容。它不可能破坏很多现有的代码，但在该功能脱离实验状态之前，需要对此作出决定。

## 二、简介

`@Accessors`注解被用来配置`lombok`如何生成和寻找`getters`和`setters`。

默认情况下，`lombok`遵循`bean`规范的`getter`和`setter`。例如，一个名为`pepper`的字段的`getter`是`getPepper`。然而，有些人可能想打破`Bean`的规范，以便最终得到更漂亮的`API`。`@Accessors`让你做到这一点。

有些程序员喜欢为他们的字段使用前缀，例如他们写`fPepper`而不是`pepper`。我们强烈反对这样做，因为你无法对前缀的有效性进行单元测试，而且重构脚本可能会把字段变成局部变量或方法名称。此外，如果你想让这些信息即时可见，你的工具（比如你的编辑器）可以照顾到以某种方式呈现标识符的问题。尽管如此，你也可以通过`@Accessors`列出你的项目使用的前缀。

因此，`@Accessors`有3个选项：

- fluent - 布尔值。默认值：false。如果为true，pepper的getter就是pepper()，setter就是pepper(T newValue)。此外，如果指定，那么chain默认为true。
- chain - 布尔值。如果为true，则生成的setter返回该值，而不是void。默认值：false，如果fluent=true，默认值为true。
- prefix - 一个字符串的列表。如果存在，字段必须以这些前缀中的任何一个为前缀。每个字段名依次与列表中的每个前缀进行比较，如果发现匹配，则剥离前缀以创建该字段的基本名称。在列表中包含一个空字符串是合法的，这将总是匹配的。对于属于字母的字符，前缀后面的字符不能是小写字母，即pepper甚至不能与前缀p匹配，但pEpper可以匹配（这意味着这个字段的基本名称是epper）。

`@Accessors`注解在类型和字段上都是合法的；如果存在的话，适用的注解是字段上的，否则就是类上的。当一个字段上的`@Accessors`注解存在时，字段所在的类上的任何`@Accessors`注解都会被完全忽略，甚至对于没有配置在字段上的`@Accessors`的属性。这与任何`lombok.config`配置键相反，这些配置键在任何明确的`@Accessors`注解没有指定的情况下作为后备默认。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.experimental.Accessors;
import lombok.Getter;
import lombok.Setter;
@Accessors(fluent = true)
public class AccessorsExample {
  @Getter @Setter
  private int age = 10;
}
class PrefixExample {
  @Accessors(prefix = "f") @Getter
  private String fName = "Hello, World!";
}
```

### 2. Java 标准写法

```java
public class AccessorsExample {
  private int age = 10;
  public int age() {
    return this.age;
  }
  public AccessorsExample age(final int age) {
    this.age = age;
    return this;
  }
}
class PrefixExample {
  private String fName = "Hello, World!";
  public String getName() {
    return this.fName;
  }
}
```

## 四、支持的配置项

`lombok.accessors.chain` = [`true` | `false`] (默认: `false`)

如果设置为true，任何没有`@Accessors`注解的类，或者有，但该注解没有明确的`chain`参数值，将像`@Accessors(chain = true)`存在一样行事。

`lombok.accessors.chain` = [`true` | `false`] (默认: `false`)

如果设置为`true`，任何没有`@Accessors`注解的类，或者有，但该注解没有明确的`fluent`参数值的类，将像`@Accessors(fluent = true)`存在一样行事。

`lombok.accessors.prefix` += 字段前缀 (默认: `empty list`)

这是一个列表属性；可以用`+=`操作符添加条目。从父级配置文件中继承的前缀可以用`-=`操作符删除。任何没有`@Accessors`注解的类，或者有，但该注解没有明确的`prefix`参数值的类，将像`@Accessors(prefix = {配置中列出的前缀})`一样行事。

`lombok.accessors.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Accessors`的任何使用标记为警告或错误（如果已配置）。

## 五、附属说明

最近的`@Accessors`注解也被用于`lombok`中寻找`getters`的各种方法，比如`@EqualsAndHashCode`。

如果提供了一个前缀列表，而一个字段没有以其中一个开头，那么这个字段会被`lombok`完全跳过，并且会产生一个警告。
