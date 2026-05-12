# 23、Lombok 实战教程 - @FieldNameConstants | 为你的字段生成一个以字段名称为值的常量
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/23.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`@FieldNameConstants`在`lombok v1.16.22`中作为实验性功能引入。

`@FieldNameConstants`在`lombok v1.18.4`中被重新设计。

`lombok.config`选项`lombok.fieldNameConstants.uppercase = true`被添加到`lombok v1.18.8`中。

实验原因：

- 新功能；不确定这是否破坏了现有的模板。

当前状态：中立 - 作为一个刚刚推出的功能，仍在收集反馈。

## 二、简介

`@FieldNameConstants`注解生成了一个内部类型，它为你的类中的每个字段包含一个常量；或者是字符串常量（字段标记为`public static final`，类型为`java.lang.String`），或者如果你愿意，一个枚举类型，每个字段有一个值–为枚举变体编写`@FieldNameConstants(asEnum = true)`。`@FieldNameConstants`对于各种调度和序列化框架很有用。常量字段（无论是枚举值还是字符串常量）的名字总是和字段一模一样的，包括大写和所有，除非你在`lombok.config`文件中设置了`lombok.fieldNameConstants.uppercase = true`选项；在这种情况下，`lombok`会尝试将名字变成大写字母。

生成的内部类型默认叫做`Fields`，是`public`。你可以通过`@FieldNameConstants(innerTypeName = "FieldNames", access = AccessLevel.PACKAGE)`来修改，例如。默认的内部类型名称也可以通过配置键`lombok.fieldNameConstants.innerTypeName`修改。生成的字段总是`public`。

必须应用于类（或枚举，虽然你很少想这么做）。默认包括所有非瞬时的、非静态的字段。你可以在字段中使用`@FieldNameConstants.Include` + `@FieldNameConstants(onlyExplicitlyIncluded = true)`，或者使用`@FieldNameConstants.Exclude`进行更细粒度的控制。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.experimental.FieldNameConstants;
import lombok.AccessLevel;
@FieldNameConstants
public class FieldNameConstantsExample {
  private final String iAmAField;
  private final int andSoAmI;
  @FieldNameConstants.Exclude private final int asAmI;
}
```

### 2. Java 标准写法

```java
public class FieldNameConstantsExample {
  private final String iAmAField;
  private final int andSoAmI;
  private final int asAmI;
  public static final class Fields {
    public static final String iAmAField = "iAmAField";
    public static final String andSoAmI = "andSoAmI";
  }
}
```

## 四、支持的配置项

`lombok.fieldNameConstants.flagUsage` = [`warning` | `error`] (默认: not set)

`Lombok`将`@FieldDefaults`的任何使用标记为警告或错误（如果已配置）。

`lombok.fieldNameConstants.innerTypeName` =一个字符串(默认: ‘`Fields`’)

`lombok`生成的内部类型的名称可以通过这个配置键来控制。

`lombok.fieldNameConstants.uppercase` = [`true` | `false`] (默认: `false`)

如果为`true`，则尝试将生成的字段大写。

## 五、附属说明

从`lombok v1.18.6`开始，`lombok`会自动跳过生成已经存在的东西。你可以自己定义内部的`Fields`枚举/类，在这种情况下，`lombok`会添加所有你没有自己写的`enum constants` / `public static final fields`。

从`lombok v1.16.22`到`lombok v1.18.2`，这个功能在类型内部直接生成常量；例如，这些字段的名称会把字段`exampleFieldName`变成`public static final String FIELD_EXAMPLE_FIELD_NAME = "exampleFieldName";`。前缀和后缀（这里是`FIELD_`，以及空字符串）是可配置的。从`lombok v1.18.4`开始，这个功能已经被重新设计为生成一个上述的内部类型。

任何接受字符串的`lombok`注解的参数都需要提供实际的字符串文本；你不能引用由`@FieldNameConstants`生成的常数。如果你想使用`@FieldNameConstants`来填写`@ToString`和类似的`lombok`注解的参数或排除参数，请使用`@ToString.Include` / `@ToString.Exclude`等系统来代替；这些在这些功能的页面上有描述。

像其他接触字段的`lombok`处理程序一样，任何名字以美元（`$`）符号开头的字段都会被完全跳过。这样的字段根本就不会被修改。静态字段也会被跳过。
