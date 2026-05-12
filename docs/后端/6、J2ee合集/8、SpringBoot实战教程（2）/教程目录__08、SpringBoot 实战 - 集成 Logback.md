# 08、SpringBoot 实战 - 集成 Logback
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/8.html
- 分类：J2EE框架
- 分组：教程目录
## 1. 简介

**Logback**：是由 log4j 创始人设计的一个开源日志组件。

- **Logback官网：**[https://logback.qos.ch/](https://logback.qos.ch/)
- **Logback文档：**[https://logback.qos.ch/documentation.html](https://logback.qos.ch/documentation.html)

**Logback 模块：**

- logback-core：提供了 Logback 的核心功能，是另外两个组件的基础。
- logback-classic：实现了 Slf4j 的 API，所以当想配合 Slf4j 使用时，需要引入 logback-classic。
- logback-access：为了集成 Servlet 环境而准备的，可提供 HTTP-access 的日志接口。

**Logback 是要与 Slf4j 结合起来使用。**

**Slf4j：** Simple Logging Facade for Java，充当各种日志框架（例如：java.util.loggin、logback、log4j）的简单外观或抽象，允许最终用户在部署时插入所需的日志框架。

- **Slf4j 官网：**[https://www.slf4j.org/](https://www.slf4j.org/)
- **Slf4j 文档：**[https://www.slf4j.org/manual.html](https://www.slf4j.org/manual.html)

## 2. 项目结构

## 3. 配置文件

### 3.1 Maven

**spring boot依赖：**

在Web 项目中，我们直接引入 `spring-boot-starter-web` 依赖即可。因为 `spring-boot-starter-web` 包含 `spring-boot-starter` 包含 `spring-boot-starter-logging`，所以我们只需要引入 web 组件即可。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**spring native依赖：**

```xml
<properties>
	<slf4j.version>1.7.32</slf4j.version>
    <logback.version>1.2.5</logback.version>
</properties>
<dependencies>
	<!-- slf4j -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    <!-- logback -->
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-core</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-access</artifactId>
        <version>${logback.version}</version>
    </dependency>
</dependencies>
```

### 3.2 logback-spring.xml

**注意：这里使用了 spring.profiles.active，那么配置文件中必须要指定该配置，不然日志会不输出！**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <contextName>${APP_NAME}</contextName>
    <springProperty name="APP_NAME" scope="context" source="spring.application.name"/>
    <springProperty name="LOG_FILE" scope="context" source="logging.file" defaultValue="../logs"/>
    <springProperty name="LOG_POINT_FILE" scope="context" source="logging.file" defaultValue="../logs/point"/>
    <springProperty name="LOG_MAXFILESIZE" scope="context" source="logback.filesize" defaultValue="50MB"/>
    <springProperty name="LOG_FILEMAXDAY" scope="context" source="logback.filemaxday" defaultValue="7"/>
    <springProperty name="ServerIP" scope="context" source="spring.cloud.client.ip-address" defaultValue="0.0.0.0"/>
    <springProperty name="ServerPort" scope="context" source="server.port" defaultValue="0000"/>
    <!-- 彩色日志 -->
    <!-- 彩色日志依赖的渲染类 -->
    <conversionRule conversionWord="clr" converterClass="org.springframework.boot.logging.logback.ColorConverter"/>
    <conversionRule conversionWord="wex"
                    converterClass="org.springframework.boot.logging.logback.WhitespaceThrowableProxyConverter"/>
    <conversionRule conversionWord="wEx"
                    converterClass="org.springframework.boot.logging.logback.ExtendedWhitespaceThrowableProxyConverter"/>
    <!-- 彩色日志格式 -->
    <property name="CONSOLE_LOG_PATTERN"
              value="%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} [%clr(%X{traceId}){yellow},%clr(%X{X-B3-TraceId}){yellow}] %clr(%level){blue} %clr(%logger){cyan} %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/>
<!--              value="[${APP_NAME}:${ServerIP}:${ServerPort}] %clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} [%clr(%X{traceId}){yellow},%clr(%X{X-B3-TraceId}){yellow}] %clr(%level){blue} %clr(${PID}){magenta} %clr([%thread]){orange} %clr(%logger){cyan} %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/> -->
    <property name="CONSOLE_LOG_PATTERN_NO_COLOR"
              value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{traceId},%X{X-B3-TraceId}] %level %logger %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/>
    <!-- 控制台日志 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <withJansi>true</withJansi>
        <encoder>
            <pattern>${CONSOLE_LOG_PATTERN}</pattern>
            <charset>UTF-8</charset>
        </encoder>
        <filter class="com.demo.example.config.MyLogBackFilter"/>
    </appender>
    <!-- 按照每天生成常规日志文件 -->
    <!-- 不用的时候注释掉，防止生成无用的空白文件 -->
<!--    <appender name="ERROR" class="ch.qos.logback.core.rolling.RollingFileAppender">-->
<!--        <file>${LOG_FILE}/${APP_NAME}-error.log</file>-->
<!--        <!– 基于时间的分包策略 –>-->
<!--        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">-->
<!--            <fileNamePattern>${LOG_FILE}/${APP_NAME}-error.%d{yyyy-MM-dd}.%i.log</fileNamePattern>-->
<!--            <maxFileSize>100MB</maxFileSize>-->
<!--            <!–保留时间,单位:天–>-->
<!--            <maxHistory>60</maxHistory>-->
<!--        </rollingPolicy>-->
<!--        <encoder>-->
<!--            <pattern>${CONSOLE_LOG_PATTERN_NO_COLOR}</pattern>-->
<!--            <charset>UTF-8</charset>-->
<!--        </encoder>-->
<!--        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">-->
<!--            <MaxFileSize>100MB</MaxFileSize>-->
<!--        </triggeringPolicy>-->
<!--        <filter class="ch.qos.logback.classic.filter.LevelFilter"><!– 只打印错误日志 –>-->
<!--            <level>ERROR</level>-->
<!--            <onMatch>ACCEPT</onMatch>-->
<!--            <onMismatch>DENY</onMismatch>-->
<!--        </filter>-->
<!--    </appender>-->
    <!-- 按照每天生成常规日志文件 -->
    <!-- 不用的时候注释掉，防止生成无用的空白文件 -->
<!--    <appender name="INFO" class="ch.qos.logback.core.rolling.RollingFileAppender">-->
<!--        <file>${LOG_FILE}/${APP_NAME}-info.log</file>-->
<!--        <!– 基于时间的分包策略 –>-->
<!--        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">-->
<!--            <fileNamePattern>${LOG_FILE}/${APP_NAME}-info.%d{yyyy-MM-dd}.%i.log</fileNamePattern>-->
<!--            <maxFileSize>100MB</maxFileSize>-->
<!--            <!–保留时间,单位:天–>-->
<!--            <maxHistory>60</maxHistory>-->
<!--        </rollingPolicy>-->
<!--        <encoder>-->
<!--            <pattern>${CONSOLE_LOG_PATTERN_NO_COLOR}</pattern>-->
<!--            <charset>UTF-8</charset>-->
<!--        </encoder>-->
<!--        <filter class="ch.qos.logback.classic.filter.LevelFilter">-->
<!--            <level>INFO</level>-->
<!--            <onMatch>ACCEPT</onMatch>-->
<!--            <onMismatch>DENY</onMismatch>-->
<!--        </filter>-->
<!--    </appender>-->
    <!-- 按照每天生成常规日志文件 -->
    <appender name="ALL" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_FILE}/${APP_NAME}/${APP_NAME}.jar.log</file>
        <!-- 基于时间的分包策略 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_FILE}/${APP_NAME}/${APP_NAME}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <!--保留时间,单位:天-->
            <maxHistory>60</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>${CONSOLE_LOG_PATTERN_NO_COLOR}</pattern>
            <charset>UTF-8</charset>
        </encoder>
    </appender>
    <!-- 增加无关日志的显示等级 -->
    <logger name="com.ulisesbocchio" level="INFO"/>
    <logger name="com.netflix" level="INFO"/>
    <logger name="com.zaxxer.hikari" level="INFO"/>
    <logger name="com.baomidou" level="INFO"/>
    <logger name="org" level="INFO"/>
    <logger name="_org" level="INFO"/>
    <logger name="io" level="INFO"/>
    <!-- 设置输出级别 -->
    <!-- 如果不需要根据环境区分配置，则不需要使用springPorfile -->
<!--    <root>-->
<!--        <appender-ref ref="STDOUT"/>-->
<!--        <appender-ref ref="ALL"/>-->
<!--    </root>-->
    <!-- 根据环境区分 -->
    <!-- 设置输出级别，开发环境(根据spring.profiles.active判断) -->
    <springProfile name="dev">
        <root level="DEBUG">
            <appender-ref ref="STDOUT"/>
            <appender-ref ref="ALL"/>
<!--            <appender-ref ref="ERROR"/>-->
<!--            <appender-ref ref="INFO"/>-->
        </root>
    </springProfile>
    <!-- 设置输出级别，生产环境(根据spring.profiles.active判断) -->
    <springProfile name="prod">
        <root level="DEBUG">
<!--            <appender-ref ref="STDOUT"/>-->
            <appender-ref ref="ALL"/>
<!--            <appender-ref ref="ERROR"/>-->
<!--            <appender-ref ref="INFO"/>-->
        </root>
    </springProfile>
</configuration>
```

### 3.3 application.yml

```java
spring:
  application:
    name: spring-boot-logback 用于生成日志文件名
  profiles:
    active: dev 用于根据环境输出不同日志级别
```

## 4. 自定义输出级别

```java
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;
import java.util.Arrays;
import java.util.List;
/**
 * <p> @Title MyLogBackFilter
 * <p> @Description 定制控制台日志过滤器
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/1/6 11:15
 */
public class MyLogBackFilter extends Filter<ILoggingEvent> {
    private final List<Level> SHOW_LEVELS = Arrays.asList(Level.ERROR, Level.WARN, Level.INFO, Level.DEBUG, Level.TRACE);
    @Override
    public FilterReply decide(ILoggingEvent event) {
        // 指定打印日志类（供控制台用）
        if (event.getLoggerName().contains("org.springframework.boot")
                && !event.getLoggerName().contains("org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration")
                && !event.getLoggerName().contains("org.springframework.boot.autoconfigure.security.reactive.ReactiveUserDetailsServiceAutoConfiguration")) {
            // 打印启动信息
            return FilterReply.ACCEPT;
        } else if (SHOW_LEVELS.contains(event.getLevel())) {
            // 打印异常信息
            return FilterReply.ACCEPT;
        } else {
            return FilterReply.DENY;
        }
    }
}
```

## 5. 测试地址

**测试地址：**[http://localhost:8080/tUser/findAll](http://localhost:8080/tUser/findAll)

**指定日志路径：** java -jar -Dlogging.file=/home/app/data/weblogs

## 6. 部分内容没有输出到日志文件中问题处理

e.printStackTrace() 和 System.out.println() 不会输出到日志。

如果要输出到日志，需要增加如下依赖：

```xml
<!-- System.out System.err 转 info -->
<dependency>
    <groupId>uk.org.lidalia</groupId>
    <artifactId>sysout-over-slf4j</artifactId>
    <version>1.0.2</version>
</dependency>
```

启动类中进行如下设置：

```java
public static void main(String[] args) {
    // 加入这行代码时system.out输出为info日志
    SysOutOverSLF4J.sendSystemOutAndErrToSLF4J();
    // 启动应用
    SpringApplication.run(SpringbootDemoApplication.class, args);
}
```

## 7.根据开发、测试、生产环境采用不同的配置

修改SpringBoot项目中 `application.yml` 文件，来加载不同的logback.xml文件。

```java
loggin:
	# 这里替换成你的logback配置文件名称，classpath:不能丢
	config: classpath:logback-dev.xml
```

## 8.补充1：控制台和日志文件中都不输出日志

**问题分析：**

这是因为 `logback-spring.xml` 配置文件中使用了 `` 标签，当 `spring.profiles.active` 配置没有设置的时候，logback 不知道应该加载哪个配置，所以干脆不输出日志了。

**解决方案：**

修改系统配置文件，增加`spring.profiles.active` 配置即可。

## 9.补充2：启动报错java.lang.ClassNotFoundException: org.fusesource.jansi.WindowsAnsiOutputStream

虽然报错之后程序也正常启动了，但是我们还是要解决这个问题。

**报错截图：**

**详细报错信息：**

```java
Connected to the target VM, address: '127.0.0.1:58824', transport: 'socket'
22:22:30,546 |-INFO in ch.qos.logback.classic.LoggerContext[APP_NAME_IS_UNDEFINED] - Could NOT find resource [logback-test.xml]
22:22:30,547 |-INFO in ch.qos.logback.classic.LoggerContext[APP_NAME_IS_UNDEFINED] - Could NOT find resource [logback.groovy]
22:22:30,548 |-INFO in ch.qos.logback.classic.LoggerContext[APP_NAME_IS_UNDEFINED] - Found resource [logback.xml] at [file:/D:/IdeaProjects/SpringBootExamples/springboot-logback/logback-integration/log-spring-boot-starter/target/classes/logback.xml]
22:22:30,677 |-INFO in ch.qos.logback.classic.joran.action.ConfigurationAction - debug attribute not set
22:22:30,689 |-INFO in ch.qos.logback.classic.joran.action.ContextNameAction - Setting logger context name as [APP_NAME_IS_UNDEFINED]
22:22:30,695 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@4:87 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@5:99 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@6:111 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@7:107 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@8:105 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@9:117 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-ERROR in ch.qos.logback.core.joran.spi.Interpreter@10:97 - no applicable action for [springProperty], current ElementPath  is [[configuration][springProperty]]
22:22:30,696 |-INFO in ch.qos.logback.core.joran.action.ConversionRuleAction - registering conversion word clr with class [org.springframework.boot.logging.logback.ColorConverter]
22:22:30,696 |-INFO in ch.qos.logback.core.joran.action.ConversionRuleAction - registering conversion word wex with class [org.springframework.boot.logging.logback.WhitespaceThrowableProxyConverter]
22:22:30,696 |-INFO in ch.qos.logback.core.joran.action.ConversionRuleAction - registering conversion word wEx with class [org.springframework.boot.logging.logback.ExtendedWhitespaceThrowableProxyConverter]
22:22:30,701 |-INFO in ch.qos.logback.core.joran.action.AppenderAction - About to instantiate appender of type [ch.qos.logback.core.ConsoleAppender]
22:22:30,704 |-INFO in ch.qos.logback.core.joran.action.AppenderAction - Naming appender as [STDOUT]
22:22:30,707 |-INFO in ch.qos.logback.core.joran.action.NestedComplexPropertyIA - Assuming default type [ch.qos.logback.classic.encoder.PatternLayoutEncoder] for [encoder] property
22:22:30,756 |-INFO in ch.qos.logback.core.ConsoleAppender[STDOUT] - Enabling JANSI WindowsAnsiOutputStream for the console.
22:22:30,758 |-WARN in ch.qos.logback.core.ConsoleAppender[STDOUT] - Failed to create WindowsAnsiOutputStream. Falling back on the default stream. ch.qos.logback.core.util.DynamicClassLoadingException: Failed to instantiate type org.fusesource.jansi.WindowsAnsiOutputStream
	at ch.qos.logback.core.util.DynamicClassLoadingException: Failed to instantiate type org.fusesource.jansi.WindowsAnsiOutputStream
	at 	at ch.qos.logback.core.util.OptionHelper.instantiateByClassNameAndParameter(OptionHelper.java:69)
	at 	at ch.qos.logback.core.util.OptionHelper.instantiateByClassNameAndParameter(OptionHelper.java:40)
	at 	at ch.qos.logback.core.ConsoleAppender.getTargetStreamForWindows(ConsoleAppender.java:88)
	at 	at ch.qos.logback.core.ConsoleAppender.start(ConsoleAppender.java:79)
	at 	at ch.qos.logback.core.joran.action.AppenderAction.end(AppenderAction.java:90)
	at 	at ch.qos.logback.core.joran.spi.Interpreter.callEndAction(Interpreter.java:309)
	at 	at ch.qos.logback.core.joran.spi.Interpreter.endElement(Interpreter.java:193)
	at 	at ch.qos.logback.core.joran.spi.Interpreter.endElement(Interpreter.java:179)
	at 	at ch.qos.logback.core.joran.spi.EventPlayer.play(EventPlayer.java:62)
	at 	at ch.qos.logback.core.joran.GenericConfigurator.doConfigure(GenericConfigurator.java:165)
	at 	at ch.qos.logback.core.joran.GenericConfigurator.doConfigure(GenericConfigurator.java:152)
	at 	at ch.qos.logback.core.joran.GenericConfigurator.doConfigure(GenericConfigurator.java:110)
	at 	at ch.qos.logback.core.joran.GenericConfigurator.doConfigure(GenericConfigurator.java:53)
	at 	at ch.qos.logback.classic.util.ContextInitializer.configureByResource(ContextInitializer.java:75)
	at 	at ch.qos.logback.classic.util.ContextInitializer.autoConfig(ContextInitializer.java:150)
	at 	at org.slf4j.impl.StaticLoggerBinder.init(StaticLoggerBinder.java:84)
	at 	at org.slf4j.impl.StaticLoggerBinder.<clinit>(StaticLoggerBinder.java:55)
	at 	at org.slf4j.LoggerFactory.bind(LoggerFactory.java:150)
	at 	at org.slf4j.LoggerFactory.performInitialization(LoggerFactory.java:124)
	at 	at org.slf4j.LoggerFactory.getILoggerFactory(LoggerFactory.java:417)
	at 	at org.slf4j.LoggerFactory.getLogger(LoggerFactory.java:362)
	at 	at org.slf4j.LoggerFactory.getLogger(LoggerFactory.java:388)
	at 	at uk.org.lidalia.sysoutslf4j.context.LoggingSystemRegister.<clinit>(LoggingSystemRegister.java:35)
	at 	at uk.org.lidalia.sysoutslf4j.context.SysOutOverSLF4J.<clinit>(SysOutOverSLF4J.java:48)
	at 	at com.demo.TLogEurekaApplication.main(TLogEurekaApplication.java:14)
Caused by: java.lang.ClassNotFoundException: org.fusesource.jansi.WindowsAnsiOutputStream
	at 	at java.net.URLClassLoader.findClass(URLClassLoader.java:381)
	at 	at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
	at 	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331)
	at 	at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
	at 	at ch.qos.logback.core.util.OptionHelper.instantiateByClassNameAndParameter(OptionHelper.java:56)
	at 	... 24 common frames omitted
```

**解决方案：**

其实这种情况只是一个logback的重命名问题，将 `logback.xml` 文件名修改为 `logback-spring.xml` 就好了。

**logback.xml --> logback-spring.xml**

整理完毕，完结撒花~ 🌻
