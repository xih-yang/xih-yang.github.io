# 15、Lombok 实战教程 - @Log | 如何优雅的进行日志记录
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/15.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

在`lombok v0.10`中添加了各种`@Log`的变体。`lombok 0.10`中的新内容：你可以用`log`注解来注解任何类，让`lombok`生成一个`logger`字段。

该`logger`被命名为`log`，字段的类型取决于你选择了哪一个`logger`。

`lombok v1.16.24`中的新内容：增加了谷歌的`FluentLogger`（通过`@Flogger`）。

`lombok v1.18.10`中的新功能：增加了`@CustomLog`，让你可以通过配置如何用配置键来创建任何日志记录器。

您将`@Log`的变体放在类中（以适用于您使用的日志系统的为准）；然后，您有一个静态的`final log`字段，按照您使用的日志框架通常规定的方式进行初始化，然后您可以使用它来编写日志语句。

有多种选择可供选择：

**@CommonsLog**

```java
private static final org.apache.commons.logging.Log log = org.apache.commons.logging.LogFactory.getLog(LogExample.class);
```

`@Flogger`

```java
private static final com.google.common.flogger.FluentLogger log = com.google.common.flogger.FluentLogger.forEnclosingClass();
```

`@JBossLog`

```java
private static final org.jboss.logging.Logger log = org.jboss.logging.Logger.getLogger(LogExample.class);
```

`@Log`

```java
private static final java.util.logging.Logger log = java.util.logging.Logger.getLogger(LogExample.class.getName());
```

`@Log4j`

```java
private static final org.apache.log4j.Logger log = org.apache.log4j.Logger.getLogger(LogExample.class);
```

`@Log4j2`

```java
private static final org.apache.logging.log4j.Logger log = org.apache.logging.log4j.LogManager.getLogger(LogExample.class);
```

`@Slf4j`

```java
private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LogExample.class);
```

`@XSlf4j`

```java
private static final org.slf4j.ext.XLogger log = org.slf4j.ext.XLoggerFactory.getXLogger(LogExample.class);
```

`@CustomLog`

```java
private static final com.foo.your.Logger log = com.foo.your.LoggerFactory.createYourLogger(LogExample.class);
```

这个选项要求你在`lombok.config`文件中添加一个配置，指定`@CustomLog`应该做什么。

例如：`lombok.log.custom.declaration = com.foo.your.Logger com.foo.your.LoggerFactory.createYourLog(TYPE)(TOPIC)` 这将产生上述语句。

首先是一个类型，即你的记录器的类型，然后是一个空格，然后是你的记录器工厂的类型，然后是一个点，然后是记录器工厂方法的名称，然后是1或2个参数定义；最多一个带有`TOPIC`的定义，最多一个没有`TOPIC`的定义。每个参数定义都以括号内的逗号分隔的参数种类列表的形式指定。这些选项是 `TYPE`（传递这个`@Log`装饰的类型，作为一个类），`NAME`（传递这个`@Log`装饰的类型的完全合格的名称），`TOPIC`（传递在`@CustomLog`注释上设置的明确选择的主题字符串），以及`NULL`（传递空）。

`logger`类型是可选的；如果省略，则使用`logger`工厂类型。（因此，如果`logger`类具有创建`logger`的静态方法，则可以缩短`logger`定义）。

`@CustomLog`的主要目的是支持你的内部私有日志框架。

默认情况下，`logger`的主题（或名称）将是用`@Log`注解的类的（名称）。这可以通过指定`topic`参数进行定制。例如: `@XSlf4j(topic="reporting")`。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.extern.java.Log;
import lombok.extern.slf4j.Slf4j;
@Log
public class LogExample {
  public static void main(String... args) {
    log.severe("Something's wrong here");
  }
}
@Slf4j
public class LogExampleOther {
  public static void main(String... args) {
    log.error("Something else is wrong here");
  }
}
@CommonsLog(topic="CounterLog")
public class LogExampleCategory {
  public static void main(String... args) {
    log.error("Calling the 'CounterLog' with a message");
  }
}
```

### 2. Java 标准写法

```java
public class LogExample {
  private static final java.util.logging.Logger log = java.util.logging.Logger.getLogger(LogExample.class.getName());
  public static void main(String... args) {
    log.severe("Something's wrong here");
  }
}
public class LogExampleOther {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LogExampleOther.class);
  public static void main(String... args) {
    log.error("Something else is wrong here");
  }
}
public class LogExampleCategory {
  private static final org.apache.commons.logging.Log log = org.apache.commons.logging.LogFactory.getLog("CounterLog");
  public static void main(String... args) {
    log.error("Calling the 'CounterLog' with a message");
  }
}
```

## 三、支持的配置项

`lombok.log.fieldName` = 一个标识符 (默认: `log`).

默认情况下，生成的记录器字段名为“`log`”，但您可以使用此设置将其更改为其他名称。

`lombok.log.fieldIsStatic` = [`true` | `false`] (默认: `true`)

通常情况下，生成的记录器是一个静态字段。通过设置此键为`false`，生成的字段将是一个实例字段。

`lombok.log.custom.declaration` = `LoggerType LoggerFactoryType.loggerFactoryMethod(loggerFactoryMethodParams)(`*loggerFactoryMethodParams*`)`

配置在使用`@CustomLog`时要生成什么。(斜体部分是可选的)。 `loggerFactoryMethodParams`是一个用逗号分隔的列表，可以传递0到任意数量的参数种类。有效的种类：`TYPE`、`NAME`、`TOPIC`和`NULL`。你可以为没有设置明确主题的情况（不要在参数列表中包括`TOPIC`）和设置明确主题的情况（在列表中包括`TOPIC`参数）包含一个参数定义。

`lombok.log.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`会将各种日志注释的任何使用标记为警告或错误（如果已配置）。

`lombok.log.custom.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.CustomLog`的使用标记为警告或错误。

`lombok.log.apacheCommons.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.apachecommons.CommonsLog`的使用标记为警告或错误。

`lombok.log.flogger.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.flogger.Flogger`的使用标记为警告或错误。

`lombok.log.jbosslog.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.jbosslog.JBossLog`的使用标记为警告或错误。

`lombok.log.javaUtilLogging.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.java.Log`的使用标记为警告或错误。

`lombok.log.log4j.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.log4j.Log4j`的使用标记为警告或错误。

`lombok.log.log4j2.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.log4j.Log4j2`的使用标记为警告或错误。

`lombok.log.slf4j.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.slf4j.Slf4j`的使用标记为警告或错误。

`lombok.log.xslf4j.flagUsage` = [`warning` | `error`] (默认: `not set`)

如果配置了，`Lombok`会将任何对`@lombok.extern.slf4j.XSlf4j`的使用标记为警告或错误。

## 四、附属说明

如果一个名为`log`的字段已经存在，将发出警告，并且不会生成代码。

`lombok`的多样化日志注释的一个未来功能是找到对`logger`字段的调用，如果所选的日志框架支持它，并且日志级别可以在编译时从日志调用中确定，则用`if`语句来保护它。这样，如果日志语句最终被忽略，就可以完全避免对日志字符串的潜在大量的计算。这确实意味着你不应该在你的日志表达式中加入任何其他操作。
