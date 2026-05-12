# 15、Spring Boot - 中的日志管理
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/15.html
- 分类：J2EE框架
- 分组：教程目录
- Spring Boot 默认使用 Logback 组件作为日志管理。Logback 是由 log4j 创始人设计的一个开源日志组件。
- 在 Spring Boot 项目中我们不需要额外的添加 Logback 的依赖，因为在 spring-boot-starter 或者 spring-boot-starter-web 中已经包含了 Logback 的依赖。

## 1.Logback 读取配置文件的步骤

- 在 classpath 下查找文件 logback-test.xml
- 如果文件不存在，则查找 logback.xml
- 如果两个文件都不存在，LogBack 用 BasicConfiguration 自动对自己进行最小化配置，这样既实现了上面我们不需要添加任何配置就可以输出到控制台日志信息。

## 2.添加 Logback 配置文件

## 3.配置Logback

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<configuration>
    <!--定义日志文件的存储地址 勿在 LogBack 的配置中使用相对路径-->
    <property name="LOG_HOME" value="${catalina.base}/logs/"/>
    <!-- 控制台输出 -->
    <appender name="Stdout" class="ch.qos.logback.core.ConsoleAppender">
        <!-- 日志输出编码 -->
        <layout class="ch.qos.logback.classic.PatternLayout">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{
     50} - %msg%n
            </pattern>
        </layout>
    </appender>
    <!-- 按照每天生成日志文件 -->
    <appender name="RollingFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!--日志文件输出的文件名-->
            <FileNamePattern>${
     LOG_HOME}/server.%d{
     yyyy-MM-dd}.log</FileNamePattern>
            <MaxHistory>30</MaxHistory>
        </rollingPolicy>
        <layout class="ch.qos.logback.classic.PatternLayout">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{
     50} - %msg%n
            </pattern>
        </layout>
        <!--日志文件最大的大小-->
        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
            <MaxFileSize>10MB</MaxFileSize>
        </triggeringPolicy>
    </appender>
    <!-- 日志输出级别 -->
    <root level="info">
        <appender-ref ref="Stdout"/>
        <appender-ref ref="RollingFile"/>
    </root>
    <!--日志异步到数据库 -->
    <!--     <appender name="DB" class="ch.qos.logback.classic.db.DBAppender">
            日志异步到数据库
            <connectionSource class="ch.qos.logback.core.db.DriverManagerConnectionSource">
               连接池
               <dataSource class="com.mchange.v2.c3p0.ComboPooledDataSource">
                  <driverClass>com.mysql.jdbc.Driver</driverClass>
                  <url>jdbc:mysql://127.0.0.1:3306/databaseName</url>
                  <user>root</user>
                  <password>root</password>
                </dataSource>
            </connectionSource>
      </appender> -->
</configuration>
```

## 4.在代码中使用 Logback

```java
@RestController
@RequestMapping("/logback")
public class HelloController {
    private final static Logger logger = LoggerFactory.getLogger(HelloController.class);
    @Value("${msg}")
    private String msg;
    @RequestMapping("/showInfo")
    public String showInfo() {
        logger.info("记录日志");
        return "Hello Logback " + msg;
    }
}
```

## 5.在配置文件中屏蔽指定包的日志记录

```java
#屏蔽指定包中的日志输出 
logging.level.org=off
```
