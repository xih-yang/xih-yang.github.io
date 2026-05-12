# 04、Spring Boot 3.x DevTools(IDEA2021 热部署&amp;远程调试&amp;LiveReload)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/4.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot包括一组额外的工具，它们可以使应用程序开发体验更加方便。`spring-boot-devtools`模块可以包含在任何项目中，以提供额外的开发时特性。要包含`devtools`支持，请将模块依赖添加到你的项目中，如下面的Maven和Gradle清单所示:

**Maven**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

**Gradle**

```java
dependencies {
    developmentOnly("org.springframework.boot:spring-boot-devtools")
}
```

> 运行一个完整打包的应用程序devtools自动禁用。如果你的应用程序是从java -jar启动的，或者是从一个特殊的类加载器启动的，那么它就被认为是一个“生产应用程序”。你可以通过使用spring.devtools.restart.enabled系统属性来控制这种行为。 要启用devtools，不管使用什么类加载器来启动应用程序，设置-Dspring.devtools.restart.enabled=true系统属性。 在生产环境中运行devtools存在安全风险，绝对不能这样做。
>
> 若要禁用devtools，请排除该依赖或设置-Dspring.devtools.restart.enabled=false系统属性。

## 一、诊断类加载问题

如`Restart vs Reload`一节所述，重启功能是通过使用两个类加载器来实现的。对于大多数应用程序，这种方法工作得很好。然而，它有时会导致类加载问题，特别是在多模块项目中。

要诊断类加载问题是否确实是由`devtools`及其两个类加载器引起的，请尝试禁用`restart`。如果这解决了你的问题，那么定制重新启动类加载器以包括整个项目。

## 二、属性默认值

Spring Boot支持一些库使用缓存来提高性能。例如，模板引擎缓存已编译的模板，以避免重复解析模板文件。此外，Spring MVC可以在提供静态资源时向响应添加HTTP缓存头。虽然缓存在生产中非常有益，但在开发过程中可能会产生相反的效果，使你无法看到刚刚在应用程序中所做的更改。出于这个原因，`spring-boot-devtools`默认禁用缓存选项。

缓存选项通常在`application.properties`文件中设置。 例如，`Thymeleaf`提供了`spring.thymeleaf.cache`属性。`spring-boot-devtools`模块不需要手动设置这些属性，而是开发期间自动合理的配置。

下表列出了所有应用的属性:

属性名称
默认值

server.error.include-binding-errors
always

server.error.include-message
always

server.error.include-stacktrace
always

server.servlet.jsp.init-parameters.development
true

server.servlet.session.persistent
true

spring.freemarker.cache
false

spring.groovy.template.cache
false

spring.h2.console.enabled
true

spring.mustache.cache
false

spring.mvc.log-resolved-exception
true

spring.reactor.debug
true

spring.template.provider.cache
false

spring.thymeleaf.cache
false

spring.web.resources.cache.period
0

spring.web.resources.chain.cache
false

> 如果你不想应用默认属性，你可以在application.properties中将spring.devtools.add-properties设置为false。

因为在开发Spring MVC和Spring WebFlux应用程序时需要更多关于`web`请求的信息，`devtools`建议为`web`日志组启用`DEBUG`日志。这将为你提供有关传入请求、哪个处理程序正在处理它、响应结果和其他细节的信息。如果你希望记录所有请求的详细信息(包括可能敏感的信息)，你可以打开`spring.mvc.log-request-details`或`spring.codec.log-request-details`配置属性。

## 三、自动重启

当类路径上的文件发生变化时，使用`spring-boot-devtools`的应用程序将自动重新启动。当在`IDE`中工作时，这可能是一个有用的特性，因为它为代码更改提供了一个非常快速的反馈循环。 默认情况下，类路径中指向目录的任何文件都会受到监视，以防止更改。请注意，某些资源(如静态资产和视图模板)不需要重新启动应用程序。

**触发重启**

因为`DevTools`监控类路径资源，所以触发重启的唯一方法就是`classpath`。无论你使用的是IDE还是构建插件，修改后的文件都必须重新编译才能触发重启。更新`classpath`的方式取决于你使用的工具:

**1、** 在Eclipse中，保存修改后的文件会导致更新`classpath`并触发重新启动；

**2、** 在IntelliJIDEA中，构建项目(`Build+→+BuildProject)`具有相同的效果；

**3、** 如果使用构建插件，`Maven`运行`mvncompile`或`Gradle`运行`gradlebuild`将触发重启；

下面已IDEA为例：

> DevTools依赖于应用程序上下文的shutdown钩子来在重启期间关闭它。如果你禁用了关闭钩子，它将无法正常工作(SpringApplication.setRegisterShutdownHook(false))。
>
> DevTools需要定制ApplicationContext使用的ResourceLoader。如果你的应用程序已经提供了一个，那么它将被包装。不支持在ApplicationContext上直接覆盖getResource方法。

> 重启 vs 重新加载
>
> Spring Boot提供的重启技术通过使用两个类加载器来工作。不变的类(例如，那些来自第三方jar的类)被加载到基类加载器中。
>
> 正在开发的类被加载到一个重新启动的类加载器中。 当应用程序重新启动时，将丢弃重新启动类加载器，并创建一个新的类加载器。
>
> 这种方法意味着应用程序重启通常比“冷启动”快得多，因为基类加载器已经可用并填充了。 如果您发现应用程序重新启动不够快或遇到类加载问题，
>
> 你可以考虑重新加载技术，比如ZeroTurnaround的JRebel。它们的工作方式是在 装入类时重写类，使它们更易于重新装入。

### 增量变化日志报表

默认情况下，每次应用程序重新启动时，都会记录一个显示评估增量的报告。 该报告显示在你进行更改(例如添加或删除`bean`以及设置配置属性)时对应用程序自动配置的更改。

若要禁用报表的日志记录，请设置以下属性:

```java
spring:
  devtools:
    restart:
      log-condition-evaluation-delta: false
```

### 排除资源

某些资源在被更改时不一定需要触发重新启动。 例如，`Thymeleaf`模板可以就地编辑。默认情况下，更改`/META-INF/maven`、`/META-INF/resources`、`/resources`、`/static`、`/public`或`/templates`中的资源不会触发重启，但会触发实时重新加载。

如果你想定制这些排除，你可以使用`spring.devtools.restart.exclude`属性。例如，只排除`/static`和`/public`，你可以设置以下属性:

```java
spring:
  devtools:
    restart:
      exclude: "static/**,public/**"
```

如果你想保留这些默认值并添加额外的排除，请使用`spring.devtools.restart.additional-exclude`属性。

### 监听更多路径

当你对不在类路径上的文件进行更改时，可能希望重新启动或重新加载应用程序。为此，使用`spring.devtools.restart.additional-paths`属性配置额外的路径来监视更改。 你可以使用前面描述的`spring.devtools.restart.exclude`属性来控制附加路径下的更改是否会触发完全重启或实时重新加载。

### 禁止重启

如果你不想使用重启特性，你可以使用`spring.devtools.restart.enabled`属性禁用它。在大多数情况下，可以在应用程序中设置此属性。属性(这样做仍然初始化重启类加载器，但它不监视文件更改)。

如果您需要完全禁用重启支持(例如，因为它不能与特定的库一起工作)， 在调用`SpringApplication.run(…)`之前，你需要设置`spring.devtools.restart.enabled`系统属性为`false`，如下所示:

```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        System.setProperty("spring.devtools.restart.enabled", "false");
        SpringApplication.run(MyApplication.class, args);
    }
}
```

### 使用trigger file

如果你使用的IDE不断编译更改的文件，那么你可能更喜欢只在特定时间触发重新启动。 为此，你可以使用“trigger file”，这是一个特殊的文件，当你希望真正触发重新启动检查时，必须修改它。

要使用触发器文件，请将spring.devtools.restart.trigger-file属性设置为触发器文件的名称(不包括任何路径)。

触发器文件必须出现在classpath中的某个位置。

例如，如果你有一个项目的结构如下:

```java
src
+- main
   +- resources
      +- .reloadtrigger
```

那么你的触发器文件属性就是:

```java
spring:
  devtools:
    restart:
      trigger-file: ".reloadtrigger"
```

重启将只发生在`src/main/resources/.reloadtrigger`更新。

有些`ide`具有一些特性，使你无需手动更新触发器文件。Spring Tools Eclipse和IntelliJ IDEA (Ultimate Edition)都有这样的支持。使用Spring Tools，你可以在控制台视图中使用“`reload`”按钮(只要你的触发器文件名为`.reloadtrigger`)。

对于IntelliJ IDEA，若要更新正在运行的应用程序，请在主菜单中选择“Run | Debugging Actions | update application⌘F10”，或在“`Services`”工具窗口中选择你的应用程序，单击“`update application`”。根据你的需要，你可以配置执行此操作时IDE将执行的操作。

### 定制重启类加载器

如前所述，重启功能是通过使用两个类加载器来实现的。如果这会导致问题，你可能需要定制由哪个类加载器加载的内容。

默认情况下，IDE中任何打开的项目都是用“`restart`”类加载器加载的，而任何常规的`.jar`文件都是用“`base`”类加载器加载的。如果你使用`mvn spring-boot:run`或`gradle bootRun`，情况也是如此:包含你的`@SpringBootApplication`的项目是用“`restart`”类加载器加载的，其他所有东西都是用“`base`”类加载器加载的。

你可以通过创建一个`META-INF/spring-devtools.properties`文件来指示Spring Boot用一个不同的类加载器来加载项目的一部分。 这个 `spring-devtools.properties` 文件可以包含前缀属性 `restart.exclude` 和 `restart.include`. `include`元素是应该上拉到“`restart`”类加载器中的项，而`exclude`元素是应该下推到“`base`”类加载器中的项。

属性的值是一个应用于类路径的`regex`模式，如下所示:

```java
restart:
  exclude:
    companycommonlibs: "/mycorp-common-[\\w\\d-\\.]+\\.jar"
  include:
    projectcommon: "/mycorp-myproj-[\\w\\d-\\.]+\\.jar"
```

### 限制

对于通过使用标准`ObjectInputStream`反序列化的对象，重新启动功能不能很好地工作。如果你需要反序列化数据，你可能需要结合使用`Spring`的`ConfigurableObjectInputStream`和`Thread.currentThread(). getcontextclassloader()`。

## 四、IDEA2021热部署

### 引入依赖

```java
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <!--参数非常关键-->
            <optional>true</optional>
        </dependency>
          <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
               <!--这个参数也非常关键-->
                    <fork>true</fork>
                </configuration>
            </plugin>
```

### 代码修改自动编译方式

idea 设置

修改java文件，自动重新自动。

### trigger file方式

**idea配置**

**1、** 从主菜单选择`Run|EditConfigurations`；

**2、** 选择自己项目，然后选择Modifyoptions->On‘Upate’action；

**3、** 新建文件`.reloadtirgger`；

**4、** 代码更改完成后，选择Run|DebuggingActions|UpdateApplication；

## 五、LiveReload(实时重新加载)

`spring-boot-devtools`模块包括一个嵌入式`LiveReload`服务器，当资源发生变化时，可以使用它触发浏览器刷新。livereload.com为Chrome, Firefox和Safari提供免费的livereload.com浏览器扩展。

> 你一次只能运行一个LiveReload服务器。在启动应用程序之前，确保没有其他LiveReload服务器正在运行。如果从IDE启动多个应用程序，只有第一个应用程序支持liverload。

> 要在文件更改时触发LiveReload，必须启用“自动重启”。

## 六、配置文件系统监视器

`FileSystemWatcher`的工作方式是在一个特定的时间间隔内轮询类更改，然后等待一个预定义的静默期，以确保不再有更改。由于Spring Boot完全依赖IDE来编译和复制文件到Spring Boot可以读取它们的位置，你可能会发现有些时候，当`devtools`重新启动应用程序时，某些更改没有反映出来。如果您经常观察这样的问题，请尝试增加`spring.devtools.restart.poll-interval`和`spring.devtools.restart.quiet-period`参数的值，使其适合你开发。

```java
spring:
  devtools:
    restart:
      poll-interval: "2s"
      quiet-period: "1s"
```

被监视的类路径目录现在每2秒查询一次更改，并保持1秒的静默期，以确保没有其他类更改。

## 七、远程应用

Spring Boot开发工具并不局限于本地开发。在远程运行应用程序时，还可以使用几个特性。远程支持是可选择的，因为启用它可能会带来安全风险。它应该只在可信任的网络上运行或使用SSL保护时启用。如果这两个选项对你来说都不可用，你就不应该使用DevTools的远程支持。永远不应该在生产部署中启用支持。

要启用它，你需要确保`devtools`包含在重新打包的归档文件中，如下所示:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludeDevtools>false</excludeDevtools>
            </configuration>
        </plugin>
    </plugins>
</build>
```

然后需要设置`spring.devtools.remote.secret`属性。与任何重要的密码或秘密一样，该值应该是唯一的和强的，这样就不会被猜测或强制使用。

远程`devtools`支持分为两部分提供:接受连接的服务器端端点和在`IDE`中运行的客户端应用程序。当设置了`spring.devtools.remote.secret`属性时，服务器组件将自动启用。客户端组件必须手动启动。

> Spring WebFlux应用不支持远程devtools。

### 运行远程客户端应用程序

远程客户端应用程序被设计为在IDE中运行。你需要使用与你所连接的远程项目相同的类路径运行`org.springframework.boot.devtools.RemoteSpringApplication`。应用程序的唯一必需参数是它所连接到的远程`URL`。

例如，如果你正在使用Eclipse或Spring Tools，并且你有一个名为my-app的项目已经部署到云服务器，你将做以下操作:

**1、** 运行菜单选择`RunConfigurations…`；

**2、** 创建一个`“launchconfiguration”`的JAVA应用；

**3、** 选择my-app项目；

**4、** 使用`org.springframework.boot.devtools.RemoteSpringApplication`作为主类；

**5、** 将远程`URL`添加到`Program`参数；

由于远程客户机使用与实际应用程序相同的类路径，因此可以直接读取应用程序属性。这就是读取`spring.devtools.remote.secret`属性并将其传递给服务器进行身份验证的方式。

建议使用“`https://`”作为连接协议，这样流量就会被加密，密码就不会被拦截。

如果你需要使用代理来访问远程应用程序，请配置`spring.devtools.remote.proxy.host`和`spring.devtools.remote.proxy.port`属性。

## IDEA远程调试

**1、** SpringBoot默认打包不会包含`devtools`，`pom.xml`需要修改如下；

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <!--打包时不排除Devtools-->
        <excludeDevtools>false</excludeDevtools>
    </configuration>
```

**2、**`application.yml`文件，添加`devtools`的远程访问密钥；

```java
spring:
  devtools:
    remote:
      secret: laopeng123
```

**3、** 添加测试接口；

```java
  @RequestMapping("/hello")
    public ResponseEntity hello() {
        return ResponseEntity.ok("laopeng");
    }
```

**4、** 将项目部署打包部署；

访问接口http://localhost:9090/hello

**5、** 添加一个启动配置，启动类为`org.springframework.boot.devtools.RemoteSpringApplication`，配置如下：；

**6、** 启动远程客户端；

**7、** 修改接口内容；

```java
 @RequestMapping("/hello")
    public ResponseEntity hello() {
        return ResponseEntity.ok("laopeng我被修改了");
    }
```

**8、** Rebuild本地项目；

**9、** 访问远程接口；

远程热部署成功！
