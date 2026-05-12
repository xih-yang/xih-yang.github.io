# 13、Spring Boot 3.x 特性-日志
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/13.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
## Spring Boot 日志

Spring Boot对所有的内部日志使用`Commons Logging`，但是底层的日志实现是开放的。

提供了`Java Util Logging`、`Log4J2`和`Logback`的默认配置。在每种情况下，记录器都被预先配置为使用控制台输出，可选的文件输出也可用。

默认情况下，如果使用`spring-boot-starter-logging`，则使用`Logback(SLF4J)`进行日志记录。还包括了适当的`Logback`路由，以确保使用`Java Util Logging`、`Commons Logging`、`Log4J`或`SLF4J`的依赖库都能正常工作。

> Java有很多可用的日志记录框架。如果上面的列表看起来很混乱，不要担心。通常情况下，你不需要更改日志依赖项，Spring Boot默认值就可以正常工作。
>
> 当你将应用程序部署到Servlet容器或应用程序服务器时，使用Java Util logging API执行的日志不会被发送到应用程序的日志中。 这可以防止容器执行日志记录或已经部署到它的其他应用程序不会出现在应用程序的日志中。

Java日志框架详解参考以下文章:

[Java核心技术-日志(上)](https://blog.csdn.net/renpeng301/article/details/124408891)

[Java核心技术-日志(下)](https://blog.csdn.net/renpeng301/article/details/124448814)

### 日志格式化

Spring Boot的默认日志输出类似如下示例:

```java
2022-04-17 21:56:31.290  INFO 13119 --- [           main] c.e.e.ExternalizedConfigApplication      : Starting 
2022-04-17 21:56:31.292  INFO 13119 --- [           main] c.e.e.ExternalizedConfigApplication      : No active profile set, falling back to 1 default profile: "default"
2022-04-17 21:56:32.014  INFO 13119 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-04-17 21:56:32.022  INFO 13119 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2022-04-17 21:56:32.022  INFO 13119 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/10.0.18]
```

输出项如下:

- 日期和时间:毫秒精度和容易排序。
- 日志级别:ERROR、WARN、INFO、DEBUG、TRACE
- 进程标识
- 分隔符用于区分实际日志消息的开始
- 线程名:用方括号括起来(在控制台输出时可能会被截断)。
- 日志名称:这通常是源类名(通常缩写)。
- 日志信息

> Logback没有FATAL级别。它被映射到ERROR。

### 控制台输出

默认的日志配置在消息被写入时将消息回显到控制台。缺省情况下，日志级别为error、warn和info。还可以通过使用——debug标志启动应用程序来启用“debug”模式。

`$java -jar myapp.jar --debug`

你也可以在你的`application.properties`中指定`debug=true`。

当启用调试模式时，将选择核心日志记录器(嵌入式容器、Hibernate和Spring Boot)配置为输出更多信息。

启用调试模式不会将应用程序配置为使用debug级别记录所有消息。

或者，你可以通过使用——`trace`标志(或者在`application.properties`中使用`trace=true`)启动你的应用程序来启用“`trace`”模式。

这样做可以为选择的核心日志记录器(嵌入式容器、Hibernate模式生成和整个Spring组合)启用跟踪日志记录。

#### 彩色编码输出

如果您的终端支持ANSI，则使用颜色输出来提高可读性。您可以将`spring.output.ansi.enabled`设置为一个支持的值(`org.springframework.boot.ansi.AnsiOutput.Enabled`)。

枚举值
描述

DETECT
尝试检测ANSI着色功能是否可用(默认值)

ALWAYS
启用ANSI

NEVER
禁用ANSI

颜色编码是通过使用%clr转换字配置的。在最简单的形式中，转换器根据日志级别为输出着色，如下例所示:

`%clr(%5p)`

日志级别与颜色的对应关系如下表所示：

Level
Color

FATAL
Red

ERROR
Red

WARN
Yellow

INFO
Green

DEBUG
Green

TRACE
Green

或者，可以通过将颜色或样式作为转换选项提供来指定应该使用的颜色或样式。例如，要使文本变成黄色，可以使用以下设置:

```java
%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){yellow}
```

支持以下颜色:

- blue
- cyan
- faint
- green
- magenta
- red
- yellow

### 文件输出

默认情况下，`Spring Boot`只将日志记录到控制台，不写入日志文件。如果想在控制台输出之外写入日志文件，需要设置`logging.file.name`或`logging.file.path`属性(例如，在`application.properties`中)。

下面列表显示`logging.*` 属性如何一起使用:

logging.file.name
logging.file.path
例子
描述

无
无

控制台输出

特定文件
无
my.log
写入指定的日志文件。名称可以是确切的位置或相对于当前目录。

无
特定目录
/var/log
将spring.log写入指定目录。名称可以是确切的位置或相对于当前目录。

默认当日志文件达到`10M`时会归档，重新输出到新文件中，并且与控制台输出一样，默认记录`ERROR`-level、`WARN`-level和`INFO`-level消息。

> 日志属性独立于实际的日志基础设施。因此，特定的配置键(例如Logback的logback.configurationFile)不被Spring Boot管理。

### 文件归档

如果正在使用`Logback`，可以在`application.properties`或`application.yaml`中对日志归档进行设置。

对于所有其他日志系统，需要自己直接配置归档设置(例如，如果使用`Log4J2`，则可以添加`Log4J2.xml`或`Log4J2-spring.xml`文件)。

支持以下归档属性设置:

Name
Description

logging.logback.rollingpolicy.file-name-pattern
用于创建日志归档的文件名方式

logging.logback.rollingpolicy.clean-history-on-start
是否应该在应用程序启动时进行日志归档清理。

logging.logback.rollingpolicy.max-file-size
归档前日志文件的最大大小(默认10m)

logging.logback.rollingpolicy.total-size-cap
在删除日志文件之前，日志文件的最大容量(默认0)

logging.logback.rollingpolicy.max-history
保留的归档日志文件的最大数量(默认为7)。

### 日志级别

所有支持的日志系统都可以在`Spring Environment`中(例如`application.properties`)使用`logging.level.=`设置日志级别,

其中级别为`TRACE`、`DEBUG`、`INFO`、`WARN`、`ERROR`、`FATAL`或`OFF`之一。`root logger`可以使用`logging.level.root`配置。

如下`application.properties`设置日志级别：

```java
logging.level.root=warn
logging.level.org.springframework.web=debug
logging.level.org.hibernate=error
```

还可以使用环境变量设置日志记录级别。例如，`LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB`=DEBUG将`org.springframework.web`设置为`DEBUG`。

> 上述方法只适用于包级日志记录。由于宽松绑定总是将环境变量转换为小写，因此不可能以这种方式为单个类配置日志记录。如果需要为类配置日志记录，可以使用SPRING_APPLICATION_JSON变量。

### 日志组

能够将相关的日志记录分组在一起以便能够同时配置是有时候非常有用的。例如，通常可能会更改所有与`Tomcat`相关的日志记录的日志级别，但是不容易记住顶级包名。

为了解决这个问题，Spring Boot允许您在Spring环境中定义日志组。例如可以通过将“tomcat”组添加到application.properties中来定义它:

```java
logging.group.tomcat=org.apache.catalina,org.apache.coyote,org.apache.tomcat
```

定义之后，可以用一行代码更改组中所有日志的级别:

```java
logging.level.tomcat=trace
```

Spring Boot包括以下可以开箱即用的预定义日志组:

Name
Loggers

web
org.springframework.core.codec, org.springframework.http, org.springframework.web, org.springframework.boot.actuate.endpoint.web, org.springframework.boot.web.servlet.ServletContextInitializerBeans

sql
org.springframework.jdbc.core, org.hibernate.SQL, org.jooq.tools.LoggerListener

### 日志关闭Hook

为了在应用程序终止时释放日志记录资源，提供了一个关闭钩子，它将在JVM退出时触发日志系统清理。除非将应用程序部署为war文件，否则此关闭钩子将自动注册。如果应用程序具有复杂的上下文层次结构，那么关闭钩子可能不能满足你的需求。

禁用日志关闭钩子,直接使用底层日志系统提供的选项。例如`Logback`提供了上下文选择器，允许在自己的上下文中创建每个`Logger`。可以使`logging.register-shutdown-hook`属性来禁用关闭钩子,设置为`false`将禁用注册。你可以在`application.properties`或 `application.yaml`文件中设置。

```java
#默认true
logging.register-shutdown-hook=false
```

### 自定义日志配置

可以通过在`classpath`中包含适当的库来激活各种日志记录系统,并且可以通过在`classpath`的根目录或`Spring Environment`属性指定的位置提供合适的配置文件来进一步定制:`logging.config`。

`logging.config=classpath:logback.xml`

你可以通过使用`org.springframework.boot.logging.LoggingSystem`系统属性来强制Spring Boot使用特定的日志系统。该值应该是`LoggingSystem`实现的完全限定类名。还可以使用`none`值完全禁用Spring Boot的日志配置( `System.setProperty("org.springframework.boot.logging.LoggingSystem","none")`)。

> 由于日志记录是在ApplicationContext创建之前初始化的，所以不可能从Spring @Configuration文件中的@PropertySources控制日志记录。更改日志记录系统或完全禁用它的惟一方法是通过系统属性。

不同日志系统加载的配置列表如下：

Logging System
Customization

Logback
logback-spring.xml, logback-spring.groovy, logback.xml, or logback.groovy

Log4j2
log4j2-spring.xml or log4j2.xml

JDK (Java Util Logging)
logging.properties

> 如果可能，建议对日志配置使用-spring方式(例如，logback-spring.xml而不是logback.xml)。如果使用标准配置位置，Spring不能完全控制日志初始化。

> 在Java Util Logging中有一些已知的类加载问题，当从一个“executable jar”中运行时，会导致问题。建议在从“executable jar”中运行时尽量避免它。

为了帮助进行自定义，一些其他属性从Spring Environment转移到System属性，如下表所示:

Spring Environment
System Property
Comments

logging.exception-conversion-word
LOG_EXCEPTION_CONVERSION_WORD
记录异常时使用的转换词

logging.file.name
LOG_FILE
如果定义了，则在默认日志配置中使用

logging.file.path
LOG_PATH
如果定义了，则在默认日志配置中使用

logging.pattern.console
CONSOLE_LOG_PATTERN
要在控制台上使用的日志模式(stdout)

logging.pattern.dateformat
LOG_DATEFORMAT_PATTERN
日志日期格式的Appender模式。

logging.charset.console
CONSOLE_LOG_CHARSET
用于控制台日志记录的字符集

logging.pattern.file
FILE_LOG_PATTERN
在文件中使用的日志模式(如果启用了LOG_FILE)

logging.charset.file
FILE_LOG_CHARSET
用于文件日志记录的字符集(如果启用了LOG_FILE)

logging.pattern.level
LOG_LEVEL_PATTERN
呈现日志级别时使用的格式(默认%5p)

PID
PID
当前进程ID

如果使用Logback，还会转移以下属性:

Spring Environment
System Property
Comments

logging.logback.rollingpolicy.file-name-pattern
LOGBACK_ROLLINGPOLICY_FILE_NAME_PATTERN
滚动日志文件名的模式(默认${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz)

logging.logback.rollingpolicy.clean-history-on-start
LOGBACK_ROLLINGPOLICY_CLEAN_HISTORY_ON_START
是否启动时清理归档日志文件。

logging.logback.rollingpolicy.max-file-size
LOGBACK_ROLLINGPOLICY_MAX_FILE_SIZE
最大日志文件大小

logging.logback.rollingpolicy.total-size-cap
LOGBACK_ROLLINGPOLICY_TOTAL_SIZE_CAP
要保留的日志备份的总大小。

logging.logback.rollingpolicy.max-history
LOGBACK_ROLLINGPOLICY_MAX_HISTORY
归档日志文件的最大数量

所有支持的日志系统在解析其配置文件时都可以查询System属性，下列为不同日志系统配置例子：

- [Logback](https://github.com/spring-projects/spring-boot/tree/v3.0.0-M2/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/logback/defaults.xml)
- [Log4j2](https://github.com/spring-projects/spring-boot/tree/v3.0.0-M2/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/log4j2/log4j2.xml)
- [Java Util logging](https://github.com/spring-projects/spring-boot/tree/v3.0.0-M2/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/java/logging-file.properties)

> 如果你想在日志属性中使用一个占位符，你应该使用Spring Boot的语法，而不是底层框架的语法。值得注意的是，如果使用Logback，应该使用:作为属性名及其默认值之间的分隔符，而不是使用:-。
>
> 通过只覆盖LOG_LEVEL_PATTERN，可以将MDC和其他特别内容添加到日志行中(或者Logback使用logging.pattern.level)。例如如果你用logging.pattern.level=user:%X{user} %5p 那么默认的日志格式包含一个“user”的MDC条目(如果存在的话)，如下面的示例所示:

```java
2019-08-30 12:30:04.031 user:someone INFO 22174 --- [  nio-8080-exec-0] demo.Controller
Handling authenticated request
```

### Logback扩展

Spring Boot包含许多`Logback`扩展，可以帮助进行高级配置。可以在配置文件`logback-spring.xml`中使用这些扩展。

由于标准的`logback.xml`配置文件加载得太早不能使用扩展。需要使用`logback-spring.xml`或自定义`logging.config`属性。

> 扩展不能与Logback的配置扫描一起使用,
>
> 如果尝试这样做，对配置文件进行更改将导致记录类似以下错误之一的错误:
>
> ERROR in ch.qos.logback.core.joran.spi.Interpreter@4:71 - no applicable action for [springProperty], current ElementPath is [[configuration][springProperty]]
>
> ERROR in ch.qos.logback.core.joran.spi.Interpreter@4:71 - no applicable action for [springProfile], current ElementPath is [[configuration][springProfile]]

#### Profile配置

``标签根据激活的Spring profiles有选择地包含或排除配置部分。 Profile节点在``元素中的任何位置都支持,使用`name`属性指定`profile`名称。还可以使用复杂的表达式,例如`production & (eu-central | eu-west)`

```xml
<springProfile name="staging">
    <!--这段配置在staging环境下生效>
    <!-- configuration to be enabled when the "staging" profile is active -->
</springProfile>
<springProfile name="dev | staging">
    <!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
</springProfile>
<springProfile name="!production">
    <!-- configuration to be enabled when the "production" profile is not active -->
</springProfile>
```

#### Environment属性

`` 标签可以从Spring Environment获取属性提供给`Logback`使用,如果希望application.properties中的属性可以在`Logback`配置能使用,这个标签就非常有用了。

这个标签的工作方式跟`Logback`中的``类似。这个标签不能直接指定一个`value`,而是需要指定一个`source`(来自`Environment`)

。如果需要将属性存储在局部作用域以外的其他地方,可以使用`scop`属性设置作用范围。如果需要一个默认值(如果没有在Environment中设置该属性)那么可以使用`defaultValue`属性设置。

```xml
<springProperty scope="context" name="fluentHost" source="myapp.fluentd.host"
        defaultValue="localhost"/>
<appender name="FLUENT" class="ch.qos.logback.more.appenders.DataFluentAppender">
    <remoteHost>${fluentHost}</remoteHost>
    ...
</appender>
```

> source规则必须是短横线的命名(例如my.property-name),但是，可以使用宽松的规则将属性添加到Environment中。
