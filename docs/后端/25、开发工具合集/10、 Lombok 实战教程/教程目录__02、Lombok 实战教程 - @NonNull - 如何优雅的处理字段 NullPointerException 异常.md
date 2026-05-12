# 02、Lombok 实战教程 - @NonNull | 如何优雅的处理字段 NullPointerException 异常
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/2.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@NonNull`在`lombok v0.11.10`中被引入。

你可以在一个记录组件上使用`@NonNull`，或者一个方法或构造函数的参数。`lombok`将为你生成一个`null`检查语句。

`Lombok`始终将字段上通常命名为`@NonNull`的各种注释视为一个信号，以便在`Lombok`为您生成整个方法或构造函数时生成`null`检查，例如通过`@Data`。但是，对参数或记录组件使用`lombok`自己的`@lombok.NonNull`会导致在该方法的顶部插入`null`检查。

`null`检查看起来像`if (param == null) throw new NullPointerException("param is marked @NonNull but is null");` 并将被插入到方法的最顶端。对于构造函数，`null`检查将被插入到任何明确的`this()`或`super()`调用之后。对于记录组件，`null`检查将被插入到 "紧凑构造函数 "中（完全没有参数列表的构造函数），如果你没有构造函数，它将被生成。如果你已经写出了长形式的记录构造函数（参数与你的组件完全匹配），那么什么也不会发生–你将不得不注释这个长形式构造函数的参数。

如果顶部已经有一个`null`检查，则不会产生额外的`null`检查。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.NonNull;
public class NonNullExample extends Something {
  private String name;
  public NonNullExample(@NonNull Person person) {
    super("Hello");
    this.name = person.getName();
  }
}
```

### 2. Java 标准写法

```java
import lombok.NonNull;
public class NonNullExample extends Something {
  private String name;
  public NonNullExample(@NonNull Person person) {
    super("Hello");
    if (person == null) {
      throw new NullPointerException("person is marked @NonNull but is null");
    }
    this.name = person.getName();
  }
}
```

## 三、支持的配置项

`lombok.nonNull.exceptionType = [NullPointerException | IllegalArgumentException | JDK | Guava | Assertion]` (默认: `NullPointerException`).

当`lombok`生成一个`null`检查`if`语句时，默认情况下，会抛出一个`java.lang.NullPointerException`，并将 "`字段名 is marked non-null but is null`"作为异常信息。然而，你可以在这个配置键中使用`IllegalArgumentException`，让`lombok`用这个消息来代替抛出这个异常。通过使用`Assertion`，将生成一个具有相同消息的`assert`语句。`JDK`或`Guava`键的结果是调用这两个框架的标准`null`检查方法：`java.util.Objects.requireNonNull([field name], "[field name] is marked non-null but is null");`或者`com.google.common.base.Preconditions.checkNotNull([field name], [field name] is marked non-null but is null");`分别。

`lombok.nonNull.flagUsage = [warning | error]` (默认: 未设置)

如果配置了，`Lombok`会将`@NonNull`的任何使用标记为`warning`或`error`。

## 四、附属说明

`Lombok`对于已经存在`null`检查的检测方案，包括扫描`if`语句或`assert`语句，这些语句看起来就像`lombok`自己的。任何作为`if`语句的 "`then` "部分的 "`throws` "语句，无论是否在大括号中，都算在内。对任何名为`requireNonNull`或`checkNotNull`的方法的调用都算。`if`语句的条件必须与`PARAMNAME == null`完全一致；`assert`语句必须与`PARAMNAME != null`完全一致。对`requireNonNull`风格的方法的调用必须是独立的（一个只是调用该方法的语句），或者必须是赋值或变量声明语句的表达。你的方法中的第一个语句如果不是这样的`null`检查，就会停止检查`null`检查的过程。

虽然`@Data`和其他方法生成的`lombok`注解会在各种众所周知的注解上触发，这些注解标志着字段决不能是`@NonNull`，但这个功能只在`lombok`包中的`lombok`自己的`@NonNull`注解上触发。

在一个原始参数上的`@NonNull`会导致一个警告。将不会生成空值检查。

在一个抽象方法的参数上的`@NonNull`曾经产生一个警告；从`1.16.8`版本开始，这种情况不再出现，以承认`@NonNull`也有文档作用的概念。出于同样的原因，你可以将一个方法注释为`@NonNull`；这是允许的，不产生警告，也不产生任何代码。

##
