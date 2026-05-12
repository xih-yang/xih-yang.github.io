# 09、Spring Boot 3.x 特性-类型安全的配置属性
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/9.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
SpringBoot 提供`@ConfigurationProperties`和`@Value`注解，可以把属性绑定到JavaBean中。

使用`@Value("${property}")`注解注入配置属性有时可能很麻烦，特别是在处理多个属性或数据本质上是分层嵌套的情况。

## 一、 JavaBean属性绑定

通过@ConfigurationProperties注解可以把属性配置文件内容绑定到JaveBean中,如下所示：

```java
@Component
@ConfigurationProperties("my.service")
public class MyProperties {
    private boolean enabled;
    private InetAddress remoteAddress;
    private final Security security = new Security();
    // getters / setters...
    public static class Security {
        private String username;
        private String password;
        private List<String> roles = new ArrayList<>(Collections.singleton("USER"));
        // getters / setters...
    }
}
```

上述`POJO`定义了以下属性:

```java
#默认为false
my.service.enabled=false 
#可以从String强制转换类型
my.service.remote-address=127.0.0.1
#嵌套类型security,此处也可以独立成SecurityProperties
my.service.security.username=jack
my.service.security.password=123456
my.service.security.roles=admin,normal
```

使用时直接使用Spring提供的Bean注入注解即可:

```java
@RestController
public class TestExternalizedConfigController {
    @Autowired
    private MyProperties myProperties;
    @RequestMapping(value = "/config")
    public Object test() {
        return myProperties.toString();
    }
}
```

结果:

```java
MyProperties{
     enabled=true, remoteAddress=/127.0.0.1, security=Security{
     username='jack', password='123456', roles=[admin, normal]}}
```

## 二、构造函数绑定

上面的例子可以用类属性不可变重写:

```java
@ConfigurationProperties("my.service")
public class MyProperties {
    private final boolean enabled;
    private final InetAddress remoteAddress;
    private final Security security;
    public MyProperties(boolean enabled, InetAddress remoteAddress, Security security) {
        this.enabled = enabled;
        this.remoteAddress = remoteAddress;
        this.security = security;
    }
    public boolean isEnabled() {
        return this.enabled;
    }
    public InetAddress getRemoteAddress() {
        return this.remoteAddress;
    }
    public Security getSecurity() {
        return this.security;
    }
    public static class Security {
        private final String username;
        private final String password;
        private final List<String> roles;
        public Security(String username, String password, @DefaultValue("USER") List<String> roles) {
            this.username = username;
            this.password = password;
            this.roles = roles;
        }
        public String getUsername() {
            return this.username;
        }
        public String getPassword() {
            return this.password;
        }
        public List<String> getRoles() {
            return this.roles;
        }
    }
}
```

上述代码中，只有一个构造函数那么程序使用构造函数绑定。意思就是绑定器将找到一个构造函数，其中包含你希望绑定的参数。如果你的类有多个构造函数，`@ConstructorBinding`注解可以用来指定构造函数绑定使用哪个构造函数。

如果选择不绑定具有单个参数化构造函数的类的构造函数，必须用`@Autowired`注释构造函数。 如果你使用的是Java 16或更高版本，可以将构造函数绑定与`Records`一起使用。除非你的记录有多个构造函数，否则没有必要使用`@ConstructorBinding`。构造函数绑定类(如上面示例中的`Security`)的嵌套成员也将通过它们的构造函数进行绑定。

可以在构造函数参数和`Record`组件上使用`@DefaultValue`指定默认值,转换服务将注解的String值强制转换为缺失属性的目标类型。

默认情况下，如果没有属性绑定到`Security`，则`MyProperties`实例将包含一个`null`的`Security`。如果你希望返回一个非null的Security实例，即使没有属性绑定到它，你可以使用一个空的`@DefaultValue`注释:

```java
public MyProperties(boolean enabled, InetAddress remoteAddress, @DefaultValue Security security) {
    this.enabled = enabled;
    this.remoteAddress = remoteAddress;
    this.security = security;
}
```

注意点:

> 要使用构造函数绑定，必须使用@EnableConfigurationProperties或配置属性扫描来启用类。
>
> 由常规Spring机制创建的bean(例如@Component bean、使用@Bean方法创建的bean或使用@Import加载的bean)不能使用构造函数绑定。
>
> 不建议使用带有@ConfigurationProperties的java.util.Optional，因为它主要用于作为返回类型。因此，它不太适合配置属性注入。为了与其他类型的属性保持一致，如果你确实声明了一个可选属性并且它没有值，那么将会绑定null而不是Empty Optional。

## 三、@ConfigurationProperties

### 1.启用@ConfigurationProperties注解

Spring Boot提供了绑定`@ConfigurationProperties`类型并将其注册为bean的基础设施。可以在类上启用配置属性，也可以启用配置属性扫描(`@EnableConfigurationProperties`)，其工作方式与组件扫描类似。

有时候，带有`@ConfigurationProperties`注释的类可能不适合扫描，例如，如果你正在开发自己的自动配置，或者你想有条件地启用它们。再者组件扫描的方式(`@Component` bean、使用`@Bean`方法创建的bean或使用`@Import`加载的bean)不能使用构造函数绑定。

在这些情况下，使用`@EnableConfigurationProperties`注解指定要处理的类型列表。这可以在任何`@Configuration`类上执行，如下例所示:

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(SomeProperties.class)
public class MyConfiguration {
}
```

如果要使用配置属性扫描，请向应用程序添加`@ConfigurationPropertiesScan`注释。通常，它被添加到用`@SpringBootApplication`注释的主应用程序类中，但也可以添加到任何`@Configuration`类中。

默认情况下，扫描将从声明注释的类的包中进行。如果想定义要扫描的特定包，可以这样做，如下所示:

```java
@SpringBootApplication
@ConfigurationPropertiesScan({
      "com.example.app", "com.example.another" })
public class MyApplication {
```

> 当使用配置属性扫描(@ConfigurationPropertiesScan)或通过@Enableconconfigurationproperties注册@ConfigurationProperties bean时,这个bean有一个规范的name:

-，其中是在@ConfigurationProperties(prefix="")注释中指定的环境键前缀,是bean的完全限定名。
>
> 如果注解不提供任何前缀，则只使用bean的完全限定名。
>
> 上面例子中的bean名称是com.example.app-com.example.app.SomeProperties。

建议`@ConfigurationProperties`只处理环境变量，特别是不从上下文中注入其他bean。在特殊情况下，可以使用setter注入或框架提供的任何`*Aware`接口(如`EnvironmentAware`，如果你需要访问`Environment`)。如果仍然希望使用构造函数注入其他bean，则必须使用`@Component`注解配置属性bean，并使用基于`javabean`的属性绑定。

### 2.使用@ConfigurationProperties注解

这种配置风格与`SpringApplication`的外部`YAML`配置配合得特别好，如下面的例子所示:

```java
my:
  service:
    remote-address: 192.168.1.1
    security:
      username: "admin"
      roles:
      - "USER"
      - "ADMIN"
```

要使用`@ConfigurationProperties` bean，可以像注入其他bean一样注入它们，如下面的例子所示(`构造函数注入`):

```java
@Service
public class MyService {
    private final SomeProperties properties;
    public MyService(SomeProperties properties) {
        this.properties = properties;
    }
    public void openConnection() {
        Server server = new Server(this.properties.getRemoteAddress());
        server.start();
        // ...
    }
    // ...
}
```

使用`@ConfigurationProperties`还可以生成元数据文件，可以被ide用来为你自己的自定义配置属性key提供自动完成功能。[配置元数据](/zhuanlan/j2ee/springboot/8/3.html)

### 3.@ConfigurationProperties校验

当`@ConfigurationProperties`类被Spring的`@Validated`注解修饰时，Spring Boot都会尝试验证它们。

你可以`JSR-303 javax.validation`注解直接在配置类上进行修饰。要做到这一点，请确保在你的类路径上有一个兼容的`JSR-303`实现，然后在你的字段中添加约束注解，如下所示:

```java
@ConfigurationProperties("my.service")
@Validated
public class MyProperties {
    @NotNull
    private InetAddress remoteAddress;
    // getters/setters...
}
```

为了确保嵌套属性触发验证，即使没有找到属性，关联的字段必须用`@Valid`进行注释。下面的示例是在前面的`MyProperties`示例的基础上构建的:

```java
@ConfigurationProperties("my.service")
@Validated
public class MyProperties {
    @NotNull
    private InetAddress remoteAddress;
    @Valid
    private final Security security = new Security();
    // getters/setters...
    public static class Security {
        @NotEmpty
        private String username;
        // getters/setters...
    }
}
```

还可以通过创建一个名为`configurationPropertiesValidator`的bean定义来添加一个自定义的`Spring Validator`。`@Bean`方法应该声明为静态的。配置属性验证器是在应用程序生命周期的早期创建的，将`@Bean`方法声明为静态方法可以在不实例化`@Configuration`类的情况下创建bean。这样做可以避免任何可能由早期实例化引起的问题。

## 四、三方配置

除了使用`@ConfigurationProperties`来注解类之外，还可以在公共的`@Bean`方法上使用它。当想要将属性绑定到无法控制的第三方组件时，这样做特别有用。

要从`Environment`属性配置一个bean，需要将`@ConfigurationProperties`添加到它的bean注册中，如下所示:

```java
@Configuration(proxyBeanMethods = false)
public class ThirdPartyConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "another")
    public AnotherComponent anotherComponent() {
        return new AnotherComponent();
    }
}
```

任何用`another`前缀定义的JavaBean属性都以类似于前面的`SomeProperties`示例的方式映射到`AnotherComponent` bean上。

## 五、宽松绑定

Spring Boot使用一些宽松的规则将`Environment`属性绑定到`@ConfigurationProperties` bean，因此，`Environment`属性名和bean属性名之间不需要精确匹配， 常见示例包括用短横线分隔的环境属性(例如，`context-path`绑定到`contextPath`)，和大写的`Environment`属性(例如，`PORT`绑定到`port`)。

例如，考虑以下`@ConfigurationProperties`类:

```java
@ConfigurationProperties(prefix = "my.main-project.person")
public class MyPersonProperties {
    private String firstName;
    public String getFirstName() {
        return this.firstName;
    }
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
}
```

在上面的代码中，可以使用以下属性名:

Property
描述

my.main-project.person.first-name
短横线推荐在.properties和.yml文件中使用

my.main-project.person.firstName
标准驼峰式语法

my.main-project.person.first_name
下划线表示法，它是.properties和.yml文件中使用的另一种格式

MY_MAINPROJECT_PERSON_FIRSTNAME
使用系统环境变量时，建议使用大写格式。

> 注解的前缀值必须是短横线格式(小写，用-分隔，如prefix = "my.main-project.person")。

属性源的宽松绑定规则

属性源
常规
列表

Properties Files
驼峰式、短横线或下划线符号
使用[]或逗号分隔值

YAML Files
驼峰式、短横线或下划线符号
标准的YAML列表语法或逗号分隔值

Environment Variables
用下划线作为分隔符的大写格式
由下划线包围的数值 从环境变量绑定

System properties
驼峰式、短横线或下划线符号
使用[]或逗号分隔值的标准列表语法

> 建议在可能的情况下，将属性存储为小写的短横线格式，例如my.person.first-name=Rod。

### 绑定Maps

当绑定到Map属性时，你可能需要使用特殊的括号符号，以便保留原始的键值。如果键没有使用`[]`, 非字母数字, `-` 或 `.` 的任何字符都会被删除。

例如，考虑将以下属性绑定到`Map`:

```java
my.map.[/key1]=value1
my.map.[/key2]=value2
my.map./key3=value3
```

对于YAML文件，需要用引号包围方括号，以便正确地解析键。

```java
my:
  map:
    "[/key1]": "value1"
    "[/key2]": "value2"
    "/key3": "value3"
```

上面的属性将绑定到一个`Map`，其中`/key1`、`/key2`和`key3`作为映射中的键。斜杠已从`key3`中删除，因为它没有被方括号包围。

当绑定到标量值时，键不需要被`[]`包围, 标量值包括枚举和`java.lang`中除了`Object`所有类型。将`a.b=c`绑定到`Map`,返回一个`Map`，其中的entry是`{"a.b"="c"}`。对于任何其他类型，如果你的键包含一个`.`。例如将`a.b=c`绑定到`Map`将返回一个`Map`，其条目是`{"a"={"b"="c"}}`而`[a.b]=c`将返回一个`entry`为`{"a.b"="c"}`的`Map`。

### 从环境变量绑定

大多数操作系统对可用于环境变量的名称都有严格的规则。例如，`Linux shell`变量只能包含字母(a到z或a到z)，数字(0到9)或下划线字符(_)。按照惯例，`Unix shell`变量的名称也应该是大写的。

Spring Boot的宽松绑定规则尽可能与这些命名限制兼容。要将标准形式的属性名称转换为环境变量名称，你可以遵循以下规则:

- 用下划线(_)替换点(.)
- 删除任何破折号(-)
- 转换为大写

例如，配置属性`spring.main.log-startup-info`将是一个名为`SPRING_MAIN_LOGSTARTUPINFO`的环境变量。

环境变量也可以在绑定到对象列表时使用。要绑定到`List`，元素索引应该在变量名中用下划线包围。例如，配置属性`my.service[0].other`将使用名为`MY_SERVICE_0_OTHER`的环境变量。

## 六、合并复杂类型

当列表内容配置在多个地方时，覆盖的工作方式是替换整个列表。

例如,`MyPojo`对象有属性`name,description`默认值为`null`,下面的例子展示了`MyProperties`中的`MyPojo`对象列表:

```java
@ConfigurationProperties("my")
public class MyProperties {
    private final List<MyPojo> list = new ArrayList<>();
    public List<MyPojo> getList() {
        return this.list;
    }
}
```

考虑以下配置:

```java
my:
  list:
  - name: "my name"
    description: "my description"
---
spring:
  config:
    activate:
      on-profile: "dev"
my:
  list:
  - name: "my another name"
```

如果`dev`配置未激活，`MyProperties.list`中包含一个`MyPojo`条目(`name="my name"`), 但是，如果启用了`dev`配置文件，列表仍然只包含一个条目(`name="my another name"，description=null`)。此配置不会向列表中添加第二个`MyPojo`实例，也不会合并项目。

当一个`List`在多个配置文件中指定时，具有最高优先级的那个(并且只有那个)将被使用。考虑以下例子:

```java
my:
  list:
  - name: "my name"
    description: "my description"
  - name: "another name"
    description: "another description"
---
spring:
  config:
    activate:
      on-profile: "dev"
my:
  list:
  - name: "my another name"
```

在上面的例子中，如果dev配置文件是激活的，MyProperties.list包含一个MyPojo条目(`name="my another name"，description=null`)。对于YAML，逗号分隔的列表和YAML列表都可以用于完全覆盖列表的内容。

对于`Map`属性，可以绑定从多个源的属性值。但是，对于多个源中的相同属性，将使用具有最高优先级的那个。

下面的例子从`MyProperties`中暴露了一个`Map`:

```java
@ConfigurationProperties("my")
public class MyProperties {
    private final Map<String, MyPojo> map = new LinkedHashMap<>();
    public Map<String, MyPojo> getMap() {
        return this.map;
    }
}
```

考虑如下配置：

```java
my:
  map:
    key1:
      name: "my name 1"
      description: "my description 1"
---
spring:
  config:
    activate:
      on-profile: "dev"
my:
  map:
    key1:
      name: "dev name 1"
    key2:
      name: "dev name 2"
      description: "dev description 2"
```

如果`dev`配置未激活,`MyProperties.map`包含一个元素(`name="my name 1",description: "my description 1"`)。

如果`dev`配置激活,`MyProperties.map`包含两个个元素(`name="my name 1",description: null 和 name: "dev name 2",description: "dev description 2"`)

> 上述合并规则适用于所有属性源的属性，而不仅仅是文件。

## 七、属性转换

当Spring Boot绑定到`@ConfigurationProperties` bean时，它试图将外部应用程序属性强制为正确的类型。如果需要自定义类型转换，可以提供一个`ConversionService` bean(使用一个名为ConversionService的bean)或自定义属性编辑器(通过`CustomEditorConfigurer` bean)或自定义转换器(使用被注解为`@ConfigurationPropertiesBinding`的bean定义)。

> 由于ConversionService bean在应用程序生命周期的早期被请求，请确保限制ConversionService使用的依赖项。
>
> 通常，你需要的任何依赖项都可能在创建时没有完全初始化。如果配置键强制转换不需要自定义Convertionservice，并且只依赖于用@ConfigurationPropertiesBinding限定的自定义转换器，则可能需要重命名自定义Convertionservice。

### 转换Duration

Spring Boot专门支持表示持续时间。如果你公开`java.time.Duration`属性，在应用程序属性中可以使用以下格式:

- 一个常规的long(使用毫秒作为默认单位，除非指定了@DurationUnit)
- java.time.Duration使用的标准ISO-8601格式
- 一种更可读的格式，其中值和单位是耦合的(10s 就是10秒)

考虑下面列子:

```java
@ConfigurationProperties("my")
public class MyProperties {
    @DurationUnit(ChronoUnit.SECONDS)
    private Duration sessionTimeout = Duration.ofSeconds(30);
    private Duration readTimeout = Duration.ofMillis(1000);
    // getters / setters...
}
```

`session`超时30秒,可以使用3`0,PT30S`和`30s`他们都是等价的。读超时时间`500ms`可以如下方式指定:`500`, `PT0.5S` 和 `500ms`。

你可以使用如下的任意单位:

- ns 纳秒
- us 微妙
- ms 毫秒
- s 秒
- m 分
- h 小时
- d 天

默认单位是毫秒，可以使用`@DurationUnit`覆盖，如上面示例所示。

如果你更喜欢使用构造函数绑定，可以公开相同的属性，如下面的示例所示

```java
@ConfigurationProperties("my")
public class MyProperties {
    // fields...
    public MyProperties(@DurationUnit(ChronoUnit.SECONDS) @DefaultValue("30s") Duration sessionTimeout,
            @DefaultValue("1000ms") Duration readTimeout) {
        this.sessionTimeout = sessionTimeout;
        this.readTimeout = readTimeout;
    }
    // getters...
}
```

### 转换Period

除了持续时间外，Spring Boot还可以使用`java.time.Period`类型。在应用程序属性中可以使用以下格式:

- 常规的int表示(使用天作为默认单位，除非指定了@PeriodUnit)
- java.time.Period使用的标准ISO-8601格式
- 更简单的格式，其中值和单位对是耦合的(1y3d表示1年3天)

简单的的格式支持如下单位：

- y 年
- m 月
- w 周
- d 天
-

> java.time.Period类型不会存储week的天数,它只是"7天"简短表示方式。

### 转换数据大小

Spring框架有一个`DataSize`值类型，它以字节表示大小。如果公开`DataSize`属性，可以在应用程序属性中使用以下格式:

- 一个常规long(使用字节作为默认单位，除非已经指定了@DataSizeUnit)
- 更可读的格式，其中值和单位是耦合的(10MB表示10兆)

考虑如下例子：

```java
@ConfigurationProperties("my")
public class MyProperties {
    @DataSizeUnit(DataUnit.MEGABYTES)
    private DataSize bufferSize = DataSize.ofMegabytes(2);
    private DataSize sizeThreshold = DataSize.ofBytes(512);
    // getters/setters...
}
```

要指定缓冲区大小为10兆字节，10和10MB是等价的。256字节的大小阈值可以指定为256或256B。

可读格式支持的单位如下：

- B
- KB
- MB
- GB
- TB

默认的单位是字节，可以使用`@DataSizeUnit`重写，如上面示例所示(`@DataSizeUnit(DataUnit.MEGABYTES)`)。

如果你更喜欢使用构造函数绑定，可以公开相同的属性，如下例所示:

```java
@ConfigurationProperties("my")
public class MyProperties {
    // fields...
    public MyProperties(@DataSizeUnit(DataUnit.MEGABYTES) @DefaultValue("2MB") DataSize bufferSize,
            @DefaultValue("512B") DataSize sizeThreshold) {
        this.bufferSize = bufferSize;
        this.sizeThreshold = sizeThreshold;
    }
    // getters...
}
```

## 八、@ConfigurationProperties vs @Value

`@Value`注释是核心容器特性，它不提供与类型安全配置属性相同的特性。下表总结了`@ConfigurationProperties`和`@Value`支持的特性:

特性
@ConfigurationProperties
@Value

宽松绑定
支持
限制

元数据支持
支持
不支持

SpEL表达式
不支持
支持

> @Value 宽松绑定限制
>
> 如果你确实想要使用@Value，建议你使用它们的规范形式来引用属性名(短横线命名-和小写字母)。这将允许Spring Boot使用与放松绑定@ConfigurationProperties时相同的逻辑。
>
> 例如@Value("{demo.item-price}")能从application.properties取到demo.item-price 和 demo.itemPrice属性值，并且能从环境变量获取DEMO_ITEMPRICE。
>
> 如果你使用@Value("{demo.itemprice}")代替，demo.item-price和DEMO_ITEMPRICE将不被考虑。

如果你为自己的组件定义了一组配置属性，建议将它们分组到带有`@ConfigurationProperties`注解的POJO中。这样做将为你提供结构化的、类型安全的对象，你可以将其注入到自己的bean中。

在解析这些文件和填充环境时，不会处理来自应用程序属性文件的`SpEL`表达式。但是，也可以在`@Value`中编写`SpEL`表达式。如果应用程序属性文件中的属性值是一个`SpEL`表达式。

## 总结

本文主要是介绍了`@ConfigurationProperties` 相关的类型安全配置,以及绑定属性的方法,以及Spring Boot绑定属性的一些宽松绑定规则,还有与`@Value`注解的对比,总之推荐使用`@ConfigurationProperties` 配置绑定到JavaBean的方式,这样提供了结构化和类型安全的对象,可以注入到任何想要使用的bean中。
