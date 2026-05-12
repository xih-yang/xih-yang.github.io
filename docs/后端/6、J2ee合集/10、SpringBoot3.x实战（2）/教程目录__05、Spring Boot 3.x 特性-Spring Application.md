# 05、Spring Boot 3.x 特性-Spring Application
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/5.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
`SpringApplication`类是Spring Boot应用程序启动的核心，它提供了一种便捷的方式( `SpringApplication.run()`)从 `main`方法启动整个Spring应用程序。默认情况下，SpringApplication将执行以下步骤引导应用程序:

**1、** 创建一个`ApplicationContext`实例；

**2、** 注册一个`CommandLinePropertySource`以将命令行参数作为Spring属性；

**3、** 刷新应用程序上下文，加载所有单例bean；

**4、** 触发`CommandLineRunner`beans；

### 1.SpringApplication使用

```java
@SpringBootApplication
public class SpringapplicationDetailApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringapplicationDetailApplication.class, args);
    }
}
```

启动程序看到以下的内容输出.

```java
 .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _ | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::             (v3.0.0-M2)
2022-04-11 00:37:50.001  INFO 74256 --- [           main] m.r.s.SpringapplicationDetailApplication : Starting SpringapplicationDetailApplication using Java 17.0.2 with PID 74256 
2022-04-11 00:37:50.003  INFO 74256 --- [           main] m.r.s.SpringapplicationDetailApplication : No active profile set, falling back to 1 default profile: "default"
2022-04-11 00:37:50.539  INFO 74256 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-04-11 00:37:50.546  INFO 74256 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2022-04-11 00:37:50.546  INFO 74256 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/10.0.18]
2022-04-11 00:37:50.604  INFO 74256 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2022-04-11 00:37:50.606  INFO 74256 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 567 ms
2022-04-11 00:37:50.831  INFO 74256 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-04-11 00:37:50.838  INFO 74256 --- [           main] m.r.s.SpringapplicationDetailApplication : Started SpringapplicationDetailApplication in 1.058 seconds (JVM running for 1.43)
```

默认情况下，会显示`INFO`日志消息，包括一些相关的启动细节，比如启动应用程序的用户。如果你需要设置除`INFO`之外的日志级别，请参见日志级别进行设置。应用程序版本是使用来自主应用程序类包的实现版本来确定的。可以通过将`spring.main.log-startup-info`设置为`false`来关闭启动信息日志记录。这也将关闭应用程序的active profiles的日志记录。

> 要在启动时添加额外的日志记录，你可以在SpringApplication的子类中重写logStartupInfo(boolean),

### 2.应用启动失败

如果应用程序启动失败，注册的`failureanalyzer`将有机会提供专用的错误消息和具体的操作来提示修复问题。例如，如果您在端口8080上启动一个web应用程序，并且该端口已经被使用，应该会看到类似如下的消息:

```java
Identify and stop the process that is listening on port 8080 or configure this application to listen on another port.
```

Spring Boot提供了大量的`FailureAnalyzer`实现,也可以自定义 [自定义FailureAnalyzer](http://csdn.net)。

如果没有故障分析器能够处理异常，可以显示打印堆栈信息，方便知道具体发生了什么错误。只需要把`org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener`类启用debug属性或启用debug日志，如果用jar启动可以使用如下方式：`$ java -jar myproject-0.0.1-SNAPSHOT.jar --debug`

### 3.懒加载

`SpringApplication`允许延迟初始化应用程序。当启用了延迟初始化时，bean将在需要时创建，而不是在应用程序启动时创建。因此，启用延迟初始化可以减少应用程序启动所需的时间。在web应用程序中，启用延迟初始化会导致许多web相关的bean直到收到HTTP请求才被初始化。

延迟初始化的一个缺点是，它会延迟发现应用程序的错误问题。如果配置错误的bean是延迟初始化的，那么在启动期间将不再发生错误，问题只会在bean初始化时才会变得明显。还必须注意确保JVM有足够的内存来容纳应用程序的所有bean，而不仅仅是那些在启动期间被初始化的bean。由于这些原因**默认情况下不启用延迟初始化**。

使用延迟初始化三种方式:

```java
  //延迟加载bean方法1
        SpringApplicationBuilder lazyInitialization = new SpringApplicationBuilder(SpringapplicationDetailApplication.class);
        lazyInitialization.lazyInitialization(true).run(args);
 //延迟加载bean方法2
        SpringApplication application = new SpringApplication(SpringapplicationDetailApplication.class);
        application.setLazyInitialization(true);
        application.run(args);
//延迟加载bean方法3 application.properties
spring.main.lazy-initialization=true
```

如果希望针对某一个bean配置延迟加载，可以使用注解`@Lazy()`,参数默认true。

```java
    @Bean
    //应用启动时bean不初始化，使用时菜初始化
    @Lazy()
    public CustomerBean customerBean() {
        return new CustomerBean();
    }
```

### 4.自定义启动Banner

Spring Boot应用程序在启动时，日志会显示如下内容:

```java
 .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _ | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::             (v3.0.0-M2)
```

这个banner内容是可以自定义。在项目`resource`目录中添加一个`banner.txt`文件,文件中添加需要启动时展示的内容。如果为了美观可以从[https://www.bootschool.net/ascii](https://www.bootschool.net/ascii)输入自己想要生存的内容,然后复制到banner.txt即可。例如复制以下内容到`resource/banner.txt`:

```java
.-. .-..---..-.   .-.   .----. .---..---..---. .-..-..-..---. .--..----..----..---. .---.
| |=| || |- | |__ | |__ | || |  \ \ | |-'| |-`< | || . || |'_ |-`< | || || || || |'   -||
-' -'---'----'----'----' ---'-'  -'-'-'-'-'-'-/ --'----'----' -'  ---'
${spring-boot.version}
```

启动应用程序看到如下结果 :

在banner.txt文件中可以使用以下变量,获取对应系统属性值。

变量
描述

${application.version}
应用版本号: 1.0.0

${application.formatted-version}
应用格式化版本号:v1.0.0

${spring-boot.version}
spring boot 版本号3.0.0-M2

${spring-boot.formatted-version}
spring boot 格式化版本号v3.0.0-M2.

${Ansi.NAME} (or ${AnsiColor.NAME}, ${AnsiBackground.NAME}, ${AnsiStyle.NAME})
NAME是ANSI转义代码的名称。具体详情参考AnsiPropertySource。

${application.title}
应用程序的标题，定义在MANIFEST

除了使用文件的形式设置启动的banner内容,还可以使用代码的方式实现：

```java
 SpringApplication application = new SpringApplication(SpringapplicationDetailApplication.class);
        application.setBanner(new Banner() {
            @Override
            public void printBanner(Environment environment, Class<?> sourceClass, PrintStream out) {
                out.println("我是用代码设置的banner");
            }
        });
        application.run(args);
```

`spring.main.banner-mode`属性可以控制banner输出，它有三个方式`console`输出到控制台（默认值）,`log`输出到日志,`off`直接关闭不输出。

### 5.定制SpringApplication

如果SpringApplication的默认值不符合你的需求，你可以创建一个本地实例并对其进行定制。例如，要关闭banner，你可以这样写:

```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(MyApplication.class);
        application.setBannerMode(Banner.Mode.OFF);
        application.run(args);
    }
}
```

> 传递给SpringApplication的构造函数参数是Spring
>
> bean的配置源。在大多数情况下，这些是对@Configuration类的引用，但它们也可以是对@Component类的直接引用。

也可以使用application.properties来配置`SpringApplication`,详细配置见外部配置

### 6.流畅的构建器API

如果你需要构建一个`ApplicationContext`层次结构(具有父/子关系的多个上下文)，或者你更喜欢使用一个流畅的构建器API，你可以使用`SpringApplicationBuilder`。

```java
new SpringApplicationBuilder()
        .sources(Parent.class)
        .child(Application.class)
        .bannerMode(Banner.Mode.OFF)
        .run(args);
```

在创建ApplicationContext层次结构时存在一些限制。例如，Web组件必须包含在子上下文中，父上下文中和子上下文中都使用相同的Environment。非必要情况下使用`SpringApplication`静态方法更方便。

### 7.Web环境

`SpringApplication` 总会创建正确的 `ApplicationContext`。用来确定`WebApplicationType`的算法如下：

- 如果存在Spring MVC,那么使用AnnotationConfigServletWebServerApplicationContext
- 如果不存在Spring MVC,但是存在Spring WebFlux,那么使用AnnotationConfigReactiveWebServerApplicationContext
- 其它的使用AnnotationConfigApplicationContext

如果在同一个应用程序中使用`Spring MVC`和`Spring WebFlux`中的`WebClient`，那么默认情况下会使用`Spring MVC`。可以通过调用`setWebApplicationType(WebApplicationType)`轻松覆盖它。也可以通过调用`setApplicationContextClass(…)`来完全控制`ApplicationContext`类型。

### 8.访问程序参数

如果需要访问传递给`SpringApplication.run()`的应用程序参数，你可以注入`org.springframework.boot.ApplicationArguments` bean。`ApplicationArguments`接口提供了对原始`String[]`参数以及解析过的选项和非选项参数的访问，如下例所示

```java
@Component
public class MyBean {
    public MyBean(ApplicationArguments args) {
        boolean debug = args.containsOption("debug");
        List<String> files = args.getNonOptionArgs();
        if (debug) {
            System.out.println(files);
        }
        // if run with "--debug logfile.txt" prints ["logfile.txt"]
    }
}
```

Spring Boot启动时向Spring Environment注册一个`CommandLinePropertySource`。你也可以通过使用`@Value`注释注入单个应用程序参数。

### 9.ApplicationRunner & CommandLineRunner

如果需要在`SpringApplication`启动后运行一些特定的代码，可以实现`ApplicationRunner`或`CommandLineRunner`接口。这两个接口以相同的方式工作，并提供一个`run`方法，该方法在`SpringApplication.run()`完成之前被调用。

这个约定非常适合于那些在应用程序启动后但在它开始接受流量之前运行的任务。

`CommandLineRunner`接口以字符串数组的形式提供对应用程序参数的访问，而`ApplicationRunner`使用前面讨论过的`ApplicationArguments`接口。

```java
@Component
@Order(1)
public class MyCommandLineRunner implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("MyCommandLineRunner...." + args);
    }
}
```

```java
@Component
@Order(2)
public class MyApplicationRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.printf("MyApplicationRunner..");
    }
}
```

如果定义了几个`CommandLineRunner`或`ApplicationRunner bean`，它们必须以特定的顺序调用，你可以另外实现`org.springframework.core.Ordered`接口或使用`org.springframework.core.annotation.Order`注解。

### 10.应用程序退出

每个`SpringApplication`都向JVM注册一个关闭钩子，以确保`ApplicationContext`在退出时优雅地关闭。所有标准的`Spring`生命周期回调(比如`DisposableBean`接口或`@PreDestroy`注释)都可以被使用。此外，如果`bean`希望在调用`SpringApplication.exit()`时返回特定的退出代码，则可以实现`org.springframework.boot.ExitCodeGenerator`接口。然后，可以将这个退出代码传递给`System.exit()`以将其作为状态代码返回，如下面的示例所示

```java
@SpringBootApplication
public class MyApplication {
    @Bean
    public ExitCodeGenerator exitCodeGenerator() {
        return () -> 42;
    }
    public static void main(String[] args) {
        System.exit(SpringApplication.exit(SpringApplication.run(MyApplication.class, args)));
         //Process finished with exit code 42
    }
}
```

此外，`ExitCodeGenerator`接口也可以通过异常实现。当遇到这样的异常时，`Spring Boot`返回由实现的`getExitCode()`方法提供的退出代码。

```java
   @Bean
    public ExitCodeExceptionMapper exitCodeExceptionMapper(){
        return exception -> {
            if(exception instanceof NullPointerException){
                return -1;
            }
            return 0;
        };
    }
```
