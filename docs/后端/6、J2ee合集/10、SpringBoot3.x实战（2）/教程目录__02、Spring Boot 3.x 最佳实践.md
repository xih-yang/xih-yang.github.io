# 02、Spring Boot 3.x 最佳实践
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/2.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot不需要任何特定的代码布局。然而有一些最佳实践可以提供帮助。

### 代码结构

**1、** 使用默认的包；

当一个类没有包含包声明时,它会默认在"default package"中。通常不建议使用“default package”，应该避免使用。它可能会导致Spring Boot应用程序使用`@ComponentScan`, `@ConfigurationPropertiesScan`, `@EntityScan`, 或者 `@SpringBootApplication` 注解时,读取每个jar中的每个类。

**2、** 定位应用程序主类；

通常建议将主应用程序类放在根包中。`@SpringBootApplication`注释通常放在主类上， 它还隐式地为某些项目定义了一个基本的“search package”。例如，如果你正在编写一个JPA应用程序，那么`@SpringBootApplication`注解类的包将用于搜索`@Entity`项。使用根包还允许组件扫描只应用于你的项目。

下面一个典型的代码布局:

```java
com
 +- example
     +- myapplication
         +- FirstSpringboot3MavenApplication.java
         |
         +- customer
         |   +- Customer.java
         |   +- CustomerController.java
         |   +- CustomerService.java
         |   +- CustomerRepository.java
         |
         +- order
             +- Order.java
             +- OrderController.java
             +- OrderService.java
             +- OrderRepository.java
```

`FirstSpringboot3MavenApplication.java`定义了`main`方法,并且启用了`@SpringBootApplication`注解,如下所示:

```java
@SpringBootApplication
public class FirstSpringboot3MavenApplication {
    public static void main(String[] args) {
        SpringApplication.run(FirstSpringboot3MavenApplication.class, args);
    }
}
```

> 如果你不想使用@SpringBootApplication，那么它导入的@EnableAutoConfiguration和@ComponentScan注释定义了该行为，因此也可以使用它们。

### 配置类

Spring Boot支持基于java的配置。虽然可以将`SpringApplication`与XML源一起使用，但通常建议你的主配置源是一个`@Configuration`类。通常定义`main`方法的类是首选的`@Configuration`。

#### 导入额外的配置

你不需要把所有的`@Configuration`放到一个类中。`@Import`注释可用于导入其他配置类。或者你可以使用`@ComponentScan`自动扫描所有Spring组件，包括`@Configuration`类。

#### 导入XML配置

如果你必须使用基于XML的配置，建议你仍然从`@Configuration`类开始。然后可以使用`@ImportResource`注释来加载XML配置文件。

### 自动配置

Spring Boot自动配置尝试基于添加的jar依赖项自动配置Spring应用程序。例如，如果HSQLDB在你的类路径上，并且你没有手动配置任何数据库连接bean，那么Spring Boot会自动配置内存中的数据库。 你需要通过向你的`@Configuration`类添加`@EnableAutoConfiguration`或`@SpringBootApplication`注解来选择自动配置。

> 你应该只添加一个@SpringBootApplication或@EnableAutoConfiguration注释。通常建议你只将其中一个添加到你的主类@Configuration中。

#### 逐步替代自动配置

自动配置非侵入性。在任何时候，你都可以开始定义自己的配置，以替换自动配置的特定部分。例如，如果你添加自己的DataSource bean，默认的嵌入式数据库支持就会消失。

如果你需要了解当前应用的自动配置及其原因，请使用–debug开关启动应用程序。这样做将启用一组核心日志记录器的调试日志，并将条件报告记录到控制台。

```java
Positive matches:
-----------------
   AopAutoConfiguration matched:
      - @ConditionalOnProperty (spring.aop.auto=true) matched (OnPropertyCondition)
   AopAutoConfiguration.ClassProxyingConfiguration matched:
      - @ConditionalOnMissingClass did not find unwanted class 'org.aspectj.weaver.Advice' (OnClassCondition)
      - @ConditionalOnProperty (spring.aop.proxy-target-class=true) matched (OnPropertyCondition)
   DispatcherServletAutoConfiguration matched:
      - @ConditionalOnClass found required class 'org.springframework.web.servlet.DispatcherServlet' (OnClassCondition)
      - found 'session' scope (OnWebApplicationCondition)
```

#### 禁用特定的自动配置类

如果你发现你不想要某些特定的自动配置类被应用，你可以使用`@SpringBootApplication`的`exclude`属性禁用它们。如下所示:

```java
@SpringBootApplication(exclude = {
      DataSourceAutoConfiguration.class })
public class FirstSpringboot3MavenApplication {
}
```

如果类不在类路径上，则可以使用注释的`excludeName`属性并指定完全限定名。如果你更喜欢使用`@EnableAutoConfiguration`而不是`@SpringBootApplication`, `exclude`和`excludeName`也可以使用。最后，您还可以通过使用`spring.autoconfigure.exclude`属性来控制要排除的自动配置类列表。

> 即使自动配置类是public，单自动配置类被认为是公共API的唯一方面是类的名称，可用于禁用自动配置。这些类的实际内容，例如嵌套的配置类或bean方法，仅供内部使用，不建议直接使用它们。

### Spring Beans 和依赖注入

你可以自由地使用任何标准Spring Framework技术来定义`bean`及其注入的依赖项。通常建议使用**构造函数**注入来连接依赖关系，使用`@ComponentScan`来查找`bean`。

如果你像上面建议的那样架构你的代码(应用程序主类在根包),你可以在没有任何参数的情况下添加`@ComponentScan`，或者使用`@SpringBootApplication`注释来隐式地包含它。所有应用程序组件(`@Component`、`@Service`、`@Repository`、`@Controller`等)都自动注册为Spring bean。

下面的例子一个`OneService Bean`，它使用构造函数注入来获取一个必需的 `TwoService Bean`:

```java
@Service
public class OneServiceImpl implements OneService {
    private final TwoService twoService;
    public OneServiceImpl(TwoService twoService) {
        this.twoService = twoService;
    }
}
```

如果一个`bean`有多个构造函数，你需要用`@Autowired`标记你想让Spring使用的构造函数:

```java
@Service
public class OneServiceImpl implements OneService {
    private final TwoService twoService;
    @Autowired
    public OneServiceImpl(TwoService twoService) {
        this.twoService = twoService;
    }
    public OneServiceImpl(TwoService twoService, PrintStream printStream) {
        this.twoService = twoService;
    }
}
```

> TwoService构造函数注入被标记成final，表示后续不能被修改。

### @SpringBootApplication

大多数Spring Boot开发者喜欢他们的应用程序使用自动配置、组件扫描，并且能够在“application class”上定义额外的配置。`@SpringBootApplication`注解可以启用着三个特性:

**1、**`@EnableAutoConfiguration`:启用自动配置；

**2、**`@ComponentScan`:在应用所在的包上启用@Component扫描；

**3、**`@SpringBootConfiguration`:支持在上下文中注册额外的bean或导入额外的配置类一个Spring标准`@Configuration`的替代方案,它可以在集成测试中帮助配置检测；

```java
//相同效果 @SpringBootConfiguration @EnableAutoConfiguration @ComponentScan
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

这些特性都不是强制性的，你可以选择用它所支持的任何特性来替换这个注解。例如，你可能不想在你的应用程序中使用组件扫描或配置属性扫描:

```java
@SpringBootConfiguration(proxyBeanMethods = false)
@EnableAutoConfiguration
@Import({
      SomeConfiguration.class, AnotherConfiguration.class })
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

在本例中，MyApplication与其他Spring Boot应用程序一样，只是@Component注解的类和@ConfigurationProperties注解的类不会自动检测到，用户定义的bean会显式导入(`SomeConfiguration.class, AnotherConfiguration.class` )。
