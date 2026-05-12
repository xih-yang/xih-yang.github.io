# 16、Spring Boot 3.x - Servlet Web应用程序开发(Spring MVC)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/16.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot非常适合web应用程序开发。您可以使用嵌入的`Tomcat`、`Jetty`、`Undertow`或`Netty`创建一个自包含的HTTP服务器。大多数`web`应用程序使用`spring-boot-starter-web`模块来快速启动和运行。

如果想构建基于`servlet`的`web`应用程序，您可以利用Spring Boot对`Spring MVC`的自动配置。

## 一、Spring Web MVC

Spring Web MVC框架(通常被称为“`Spring MVC`”)是一个“模型-视图-控制器”Web框架。Spring MVC使用注解`@Controller`或`@RestController` bean来处理传入的`HTTP`请求。控制器中的方法通过使用`@RequestMapping`注释映射到`HTTP`。详细可以参考[Spring MVC官方文档](https://docs.spring.io/spring-framework/docs/6.0.0-M3/reference/html/index.html)。

### 1.示例

```java
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
```

代码如下（示例）：

```java
@RestController
@RequestMapping("/hello")
public class HelloWordController {
    @GetMapping("/get")
    public ResponseEntity httpGet() {
        return ResponseEntity.ok("http get");
    }
    @PostMapping("/post")
    public ResponseEntity postGet() {
        return ResponseEntity.ok("http post");
    }
    @DeleteMapping("/delete")
    public ResponseEntity deleteGet() {
        return ResponseEntity.ok("http delete");
    }
    @PutMapping("/put")
    public ResponseEntity putGet() {
        return ResponseEntity.ok("http put");
    }
}
```

Spring Web MVC包括`WebMvc.Fn`，一种轻量级函数式编程模型，其中函数用于路由和处理请求。它是基于注解的编程模型的替代方案，但在其他方面运行在相同的`DispatcherServlet`上[参考官网](https://docs.spring.io/spring-framework/docs/6.0.0-M3/reference/html/web.html#webmvc-fn)。

代码如下（示例）：

```java
@Component
public class MyUserHandler {
    public ServerResponse getUser(ServerRequest request) {
        ...
        return ServerResponse.ok().build();
    }
    public ServerResponse getUserCustomers(ServerRequest request) {
        ...
        return ServerResponse.ok().build();
    }
    public ServerResponse deleteUser(ServerRequest request) {
        ...
        return ServerResponse.ok().build();
    }
}
```

```java
@Configuration(proxyBeanMethods = false)
public class MyRoutingConfiguration {
    private static final RequestPredicate ACCEPT_JSON = accept(MediaType.APPLICATION_JSON);
    @Bean
    public RouterFunction<ServerResponse> routerFunction(MyUserHandler userHandler) {
        return route()
                .GET("/{user}", ACCEPT_JSON, userHandler::getUser)
                .GET("/{user}/customers", ACCEPT_JSON, userHandler::getUserCustomers)
                .DELETE("/{user}", ACCEPT_JSON, userHandler::deleteUser)
                .build();
    }
}
```

> 你可以定义任意数量的RouterFunction bean来模块化路由器的定义。如果需要应用优先级，可以对bean进行排序。

### 2.Spring MVC 自动配置

Spring Boot为Spring MVC提供了可以很好地与大多数应用程序一起工作的自动配置。 自动配置在Spring默认配置的基础上增加了以下特性:

**1、** 包含`ContentNegotiatingViewResolver`和`BeanNameViewResolver`bean；

> ContentNegotiatingViewResolver视图解析器,同样的内容数据来呈现不同的View。
>
> BeanNameViewResolver视图解析器，用于返回自定义的视图。

**1、** 支持对静态资源的处理，包括对`webjar`的支持；

**2、** 自动注册`Converter`、`GenericConverter`和`Formatter`bean；

**3、** 支持`HttpMessageConverters`；

**4、** 自动注册`MessageCodesResolver`；

**5、** 静态`index.html`的支持；

**6、** 自动使用`ConfigurableWebBindingInitializer`bean；

### 3.HttpMessageConverters

Spring MVC使用HttpMessageConverter接口来转换HTTP请求和响应。默认情况下是开箱即用，例如，对象可以自动转换为JSON(通过使用Jackson库)或XML(如果可用，则使用Jackson XML扩展;如果Jackson XML扩展不可用，则使用JAXB)，默认情况下，字符串以UTF-8编码。

Spring Boot自带的JSON格式转换，HttpMessageConverter实现有如下几种:

`MappingJackson2HttpMessageConverter(默认)`

`JsonbHttpMessageConverter`

`GsonHttpMessageConverter`

可以使用属性`spring.mvc.converters.preferred-json-mapper`选择具体的`josn`(`jackson`,`gson`,`jsonb`)转换方式。

如果你需要添加或自定义转换器，你可以使用Spring Boot的`HttpMessageConverters`类，如下所示:

```java
@Configuration(proxyBeanMethods = false)
public class MyHttpMessageConvertersConfiguration {
    @Bean
    public HttpMessageConverters customConverters() {
        HttpMessageConverter<?> additional = new AdditionalHttpMessageConverter();
        HttpMessageConverter<?> another = new AnotherHttpMessageConverter();
        return new HttpMessageConverters(additional, another);
    }
}
```

### 4.JSON序列化和反序列化

如果你使用`Jackson`来序列化和反序列化`JSON`数据， 你可能想写自己的`JsonSerializer`和`JsonDeserializer`类。自定义序列化器通常通过模块注册到`Jackson`。但是Spring Boot提供了一个替代的`@JsonComponent`注解[参考序列化器注册到Jackson](https://github.com/FasterXML/jackson-docs/wiki/JacksonHowToCustomSerializers)，可以更容易地直接注册Spring bean。

你可以直接在`JsonSerializer`、`JsonDeserializer`或`KeyDeserializer`实现上使用`@JsonComponent`注解。你也可以在包含序列化器/反序列化器作为内部类的类上使用它，如下面的例子所示:

```java
@JsonComponent
public class MyJsonComponent {
    public static class Serializer extends JsonSerializer<MyObject> {
        @Override
        public void serialize(MyObject value, JsonGenerator jgen, SerializerProvider serializers) throws IOException {
            jgen.writeStartObject();
            jgen.writeStringField("name", value.getName());
            jgen.writeNumberField("age", value.getAge());
            jgen.writeEndObject();
        }
    }
    public static class Deserializer extends JsonDeserializer<MyObject> {
        @Override
        public MyObject deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException {
            ObjectCodec codec = jsonParser.getCodec();
            JsonNode tree = codec.readTree(jsonParser);
            String name = tree.get("name").textValue();
            int age = tree.get("age").intValue();
            return new MyObject(name, age);
        }
    }
}
```

`ApplicationContext`中的所有`@JsonComponent` bean都会自动注册到`Jackson`。因为`@JsonComponent`是用`@Component`元注解的，所以通常的组件扫描规则也适用。Spring Boot还提供了`JsonObjectSerializer`和`JsonObjectDeserializer`基类，它们在序列化对象时提供了标准`Jackson`版本的替代方案。

如下代码所示：

```java
@JsonComponent
public class MyJsonComponent {
    public static class Serializer extends JsonObjectSerializer<MyObject> {
        @Override
        protected void serializeObject(MyObject value, JsonGenerator jgen, SerializerProvider provider)
                throws IOException {
            jgen.writeStringField("name", value.getName());
            jgen.writeNumberField("age", value.getAge());
        }
    }
    public static class Deserializer extends JsonObjectDeserializer<MyObject> {
        @Override
        protected MyObject deserializeObject(JsonParser jsonParser, DeserializationContext context, ObjectCodec codec,
                JsonNode tree) throws IOException {
            String name = nullSafeValue(tree.get("name"), String.class);
            int age = nullSafeValue(tree.get("age"), Integer.class);
            return new MyObject(name, age);
        }
    }
}
```

### 5.MessageCodesResolver

Spring MVC有一个从`绑定错误`(`BindingResult`)中生成错误代码来渲染错误消息的策略:`MessageCodesResolver`。如果你设置了`spring.mvc.message-codes-resolver-format`属性为`PREFIX_ERROR_CODE`或`POSTFIX_ERROR_CODE`。Spring Boot会创建一个 `DefaultMessageCodesResolver.Format`。

`DefaultMessageCodesResolver`是 `MessageCodesResolver`接口的默认实现。

将为对象错误创建两个消息代码, 按照如下顺序:

```java
1.: code + "." + object name
2.: code
```

将为字段规范创建四个消息代码, 按照如下顺序:

```java
1.: code + "." + object name + "." + field
2.: code + "." + field
3.: code + "." + field type
4.: code
```

例如,对于错误代码 “typeMismatch”, 对象名 “user”, 字段 “age”:

```java
1. try "typeMismatch.user.age"
2. try "typeMismatch.age"
3. try "typeMismatch.int"
4. try "typeMismatch"
```

因此，这个解析算法可以用来显示绑定错误的特定消息，比如"`required`"和"`typeMismatch`":

在obejct+field级别("age"字段,仅在"user"对象上)

在field级别(全部的"age"字段，无论对象名称是什么)

或在一般级别（所有字段，在任何对象上）。

对于数组、List或Map属性，将生成特定元素和整个集合的代码。假设在对象“user”中有一个数组“groups”的字段“name”:

```java
1. try "typeMismatch.user.groups[0].name"
2. try "typeMismatch.user.groups.name"
3. try "typeMismatch.groups[0].name"
4. try "typeMismatch.groups.name"
5. try "typeMismatch.name"
6. try "typeMismatch.java.lang.String"
7. try "typeMismatch"
```

### 6.静态资源

默认情况下，Spring Boot在`classpath`中从一个名为`/static` (或 `/public` 或 `/resources` 或 `/META-INF/resources`)或者`ServletContext`根目录获取静态内容。

它使用了Spring MVC中的`ResourceHttpRequestHandler`，这样你就可以通过添加自己的`WebMvcConfigurer`和覆盖`addResourceHandlers`方法来修改该行为。

默认情况下，资源映射在`/**`上,但是你可以使用`spring.mvc.static-path-pattern` 属性来调优。

例如，将所有资源重新定位到`/resources/**`，可以实现如下操作:

```java
spring:
  mvc:
    static-path-pattern: "/resources/**"
```

你也可以使用s`pring.web.resources.static-locations` 自定义静态资源路径(替换默认的位置),根servlet上下文路径“`/`”也会自动添加为一个位置。

除了前面提到的“标准”静态资源位置之外，还有一种针对`Webjars`内容的特殊情况。

任何路径在`/webjars/**`的资源，如果是以`webjars`格式打包的，都是从`jar`文件中提供的。[什么是webjars](https://www.webjars.org/)

> 如果你的应用被打包成一个jar，不要使用src/main/webapp目录。尽管该目录是一个通用标准，但它只适用于war打包，而且如果你生成一个jar，大多数构建工具都会静默地忽略它。

Spring Boot还支持Spring MVC提供的高级资源处理特性，允许使用像缓存破坏静态资源或为`webjar`使用版本无关`url`这样的特性。

要为`webjar`使用版本无关的`url`，请添加`webjar -locator-core`依赖项。然后声明你的`webjar`。

以jQuery为例, 声明 `/webjars/jquery/jquery.min.js` 得到`/webjars/jquery/x.y.z/jquery.min.js`,`x.y.z` 就是 `webjar` 版本。

### 7.欢迎页

Spring Boot支持静态和模板欢迎页面。它首先在配置的静态内容位置中查找`index.html`文件。如果没有找到，则查找索引模板。如果找到其中一个，它将自动用作应用程序的欢迎页面。

### 8.路径匹配和内容协商

Spring MVC可以通过查看请求路径并将其与应用程序中定义的映射进行匹配，从而将传入的`HTTP`请求映射到处理程序(例如，`Controller`方法上的`@GetMapping`注解)。

默认情况下，Spring Boot选择禁用后缀模式匹配,这意味着像“`GET /projects/spring-boot.json`”这样的请求将不匹配`@GetMapping("/projects/spring-boot")`的映射。 这个特性主要用于过去HTTP客户端没有发送正确的“Accept”请求头; 我们需要确保向客户端发送正确的内容类型。如今，内容协商更加可靠。

代替使用后缀匹配，我们可以使用查询参数来确保像“`GET /projects/spring-boot?format=json`"将被映射到`@GetMapping("/projects/spring-boot")`:

```java
spring:
  mvc:
    contentnegotiation:
      favor-parameter: true
```

或者如果你喜欢使用不同的参数名:

```java
spring:
  mvc:
    contentnegotiation:
      favor-parameter: true
      parameter-name: "myparam"
```

`GET /projects/spring-boot?myparam=json`

大多数标准媒体类型都是开箱即用的，但你也可以定义新的类型:

```java
spring:
  mvc:
    contentnegotiation:
      media-types:
        markdown: "text/markdown"
```

后缀模式匹配已弃用，并将在未来的版本中删除。如果你理解了这些注意事项，并且仍然希望你的应用程序使用后缀模式匹配，下面的配置是必需的:

```java
spring:
  mvc:
    contentnegotiation:
      favor-path-extension: true
    pathmatch:
      use-suffix-pattern: true
```

或者，与其打开所有后缀模式，还不如只支持已注册后缀模式:

```java
spring:
  mvc:
    contentnegotiation:
      favor-path-extension: true
    pathmatch:
      use-registered-suffix-pattern: true
```

从Spring Framework 5.3开始，Spring MVC支持几种将请求路径与控制器处理程序匹配的实现策略。它以前只支持`AntPathMatcher(默认)`)策略，但现在也提供了`PathPatternParser`。Spring Boot现在提供了一个配置属性来选择和选择新的策略:

```java
spring:
  mvc:
    pathmatch:
      matching-strategy: "path-pattern-parser"
```

`PathPatternParser`是一个优化的实现，但是限制了一些路径模式变体的使用，并且与后缀模式匹配不兼容(`spring.mvc.pathmatch.use-suffix-pattern`, `spring.mvc.pathmatch.use-registered-suffix-pattern`)或者用servlet前缀映射DispatcherServlet(`spring.mvc.servlet.path`)

### 9.ConfigurableWebBindingInitializer

Spring MVC使用`WebBindingInitializer`为特定的请求初始化`WebDataBinder`。如果你创建了自己的`ConfigurableWebBindingInitializer``@Bean`, Spring Boot会自动配置Spring MVC来使用它。

### 10.模版引擎

除了REST web服务之外，您还可以使用Spring MVC来提供动态HTML内容。Spring MVC支持各种模板技术，包括`Thymeleaf`、`FreeMarker`和`jsp`。此外，许多其他模板引擎也包含它们自己的Spring MVC集成。

Spring Boot包括对以下模板引擎的自动配置支持:

**1、**`FreeMarker`；

**2、**`Groovy`；

**3、**`Thymeleaf`；

**4、**`Mustache`；

当你使用这些带有默认配置的模板引擎之一时，你的模板将自动从src/main/resources/templates中获得。

### 11.错误处理

默认情况下，Spring Boot提供了一个`/error`映射，以一种合理的方式处理所有错误，它被注册为`servlet`容器中的“全局”错误页。

对于机器客户端(`client`)，它生成一个JSON响应，其中包含错误、HTTP状态和异常消息的详细信息。

对于浏览器客户端，有一个“`whitelabel`”错误视图，它以HTML格式呈现相同的数据(要定制它，请添加一个解析错误的视图)。

`server.error` 属性可以设置自定义默认错误处理行为。

完全替换默认行为,你可以实现`ErrorController`并注册该类型的`bean`定义，或者添加`ErrorAttributes`类型的`bean`以使用现有机制，替换其内容。

`BasicErrorController`可以用作自定义`ErrorController`的基类，如果你想为新的`content-type`添加处理程序`(默认是专门处text/html，并为其他所有内容提供回退)`，这个非常有用。为此，扩展`BasicErrorController`，添加一个带有`@RequestMapping`的公共方法，该方法具有一个`produces`属性，并创建新类型的bean。

下面例子新增`content-type`为`text/markdown`异常处理。

```java
public class CustomErrorController extends BasicErrorController {
    private ErrorAttributes errorAttributes;
    public CustomErrorController(ErrorAttributes errorAttributes, ErrorProperties errorProperties) {
        super(errorAttributes, errorProperties);
        this.errorAttributes = errorAttributes;
    }
    @RequestMapping(value = "/error", produces = "text/markdown")
    @ResponseBody
    public Map<String, Object> errorPageHandler(HttpServletRequest request, HttpServletResponse response) {
        ServletWebRequest requestAttributes = new ServletWebRequest(request);
        Map<String, Object> errorMap = this.errorAttributes.getErrorAttributes(requestAttributes, ErrorAttributeOptions.defaults());
        return errorMap;
    }
}
```

你也可以定义一个带`@ControllerAdvice`注解的类来定制`JSON`内容，以返回特定的控制器和/或异常类型，如下所示:

```java
@ControllerAdvice(basePackageClasses = SomeController.class)
public class MyControllerAdvice extends ResponseEntityExceptionHandler {
    @ResponseBody
    @ExceptionHandler(MyException.class)
    public ResponseEntity<?> handleControllerException(HttpServletRequest request, Throwable ex) {
        HttpStatus status = getStatus(request);
        return new ResponseEntity<>(new MyErrorBody(status.value(), ex.getMessage()), status);
    }
    private HttpStatus getStatus(HttpServletRequest request) {
        Integer code = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        HttpStatus status = HttpStatus.resolve(code);
        return (status != null) ? status : HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
```

在前面的例子中，如果由与`SomeController`在同一个包中定义的控制器抛出`YourException`，则使用CustomErrorType POJO的JSON表示，而不是`ErrorAttributes`表示。

#### 自定义错误页面

如果您想要显示给定状态码的自定义`HTML`错误页面，您可以将文件添加到`/error`目录。错误页面可以是静态`HTML`(即添加在任何静态资源目录下)，也可以使用模板构建。文件的名称应该是确切的状态码或序列掩码。

例如，要将404映射到一个静态HTML文件，你的目录结构应该如下:

```java
src/
 +- main/
     +- java/
     |   + <source code>
     +- resources/
         +- public/
             +- error/
             |   +- 404.html
             +- <other public assets>
```

使用`FreeMarker`模板映射所有`5xx`错误，你的目录结构如下:

```java
src/
 +- main/
     +- java/
     |   + <source code>
     +- resources/
         +- templates/
             +- error/
             |   +- 5xx.ftlh
             +- <other templates>
```

对于更复杂的映射，你也可以添加实现`ErrorViewResolver`接口的bean，如下面的例子所示:

```java
public class MyErrorViewResolver implements ErrorViewResolver {
    @Override
    public ModelAndView resolveErrorView(HttpServletRequest request, HttpStatus status, Map<String, Object> model) {
        // Use the request or status to optionally return a ModelAndView
        if (status == HttpStatus.INSUFFICIENT_STORAGE) {
            // We could add custom model values here
            new ModelAndView("myview");
        }
        return null;
    }
}
```

你也可以使用常规的Spring MVC特性，比如`@ExceptionHandler`方法和`@ControllerAdvice`。然后`ErrorController`获取任何未处理的异常。

#### 在Spring MVC之外映射错误页面

对于不使用Spring MVC的应用程序，可以使用`ErrorPageRegistrar`接口直接注册`ErrorPages`。这种抽象直接与底层的嵌入式servlet容器一起工作，即使您没有Spring MVC `DispatcherServlet`也可以工作。

```java
@Configuration(proxyBeanMethods = false)
public class MyErrorPagesConfiguration {
    @Bean
    public ErrorPageRegistrar errorPageRegistrar() {
        return this::registerErrorPages;
    }
    private void registerErrorPages(ErrorPageRegistry registry) {
        registry.addErrorPages(new ErrorPage(HttpStatus.BAD_REQUEST, "/400"));
    }
}
```

### 12.跨域

跨源资源共享(CORS)是一个由大多数浏览器实现的W3C规范，它允许您以一种灵活的方式指定对哪种类型的跨域请求进行授权，而不是使用一些不那么安全、功能也不那么强大的方法，如IFRAME或JSONP。

从4.2版开始，Spring MVC支持`CORS`。在Spring Boot应用程序中使用带有`@CrossOrigin`注释的控制器`CORS`配置不需要任何特定的配置。全局`CORS`配置可以通过使用自定义的`addCorsMappings (CorsRegistry)`方法注册`WebMvcConfigurer` bean来定义，如下面的例子所示:

```java
@Configuration(proxyBeanMethods = false)
public class MyCorsConfiguration {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**");
            }
        };
    }
}
```

## 总结

本文主要内容是Spring Boot对Spring MVC自动配置的支持，以及一些个性化特性的实现。
