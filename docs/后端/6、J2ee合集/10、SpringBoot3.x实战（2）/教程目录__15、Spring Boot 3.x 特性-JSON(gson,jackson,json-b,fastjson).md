# 15、Spring Boot 3.x 特性-JSON(gson,jackson,json-b,fastjson)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/15.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Boot提供了与三个`JSON`映射库的集成:

- Gson
- Jackson
- JSON-B

`Jackson` 是首选的默认库。

在[Spring Boot 3.x- Servlet Web应用程序开发(Spring MVC)](/zhuanlan/j2ee/springboot/8/16.html)文中有介绍过：

> Spring MVC使用HttpMessageConverter接口来转换HTTP请求和响应。默认情况下是开箱即用，例如，对象可以自动转换为JSON(通过使用Jackson库)或XML(如果可用，则使用Jackson XML扩展;如果Jackson XML扩展不可用，则使用JAXB)，默认情况下，字符串以UTF-8编码。

Spring Boot自带的`JSON`格式转换，`HttpMessageConverter`实现有如下几种:

**1、**`MappingJackson2HttpMessageConverter(默认)`；

**2、**`JsonbHttpMessageConverter`；

**3、**`GsonHttpMessageConverter`；

可以使用属性`spring.mvc.converters.preferred-json-mapper`选择具体的`josn`(`jackson`,`gson`,`jsonb`)转换方式。

## 一、Jackson

`Jackson`是`spring-boot-starter-json`的一部分, 提供了`Jackson`的自动配置。当`Jackson`位于类路径中时，将自动配置`ObjectMapper`。Spring Boot并且提供了几个配置属性，用于定制`ObjectMapper`的配置。

> 当引入spring-boot-starter-web依赖时，同时包含了spring-boot-starter-json。所以一般无需单独的引入。

下面例子使用默认的`Jackson`，使接口输出内容为`json`格式。

引入`web`依赖：

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

新建接口：

```java
@RestController
public class TestJsonController {
    @RequestMapping(value = "/user/detail")
    public User user() {
        return new User(1024l, "hello", "word");
    }
    @Data
    @AllArgsConstructor
    class User implements Serializable {
        private Long id;
        private String firstName;
        private String lastName;
    }
}
```

访问接口输出以下内容：

无需任何的额外配置就可以集成`Jackson`,这些都归根于Spring Boot的自动配置：

Spring MVC(客户端和服务器端)使用`HttpMessageConverters`在`HTTP`交换中协商内容转换。如果`Jackson`位于类路径中，则已经获得了`Jackson2ObjectMapperBuilder`提供的默认转换器，该转换器的实例已为你自动配置。

`ObjectMapper`(`XmlMapper`)实例(默认创建)具有以下自定义属性:

**1、** MapperFeature.DEFAULT_VIEW_INCLUSION禁用；

**2、** DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES禁用；

**3、** SerializationFeature.WRITE_DATES_AS_TIMESTAMPS禁用；

你可以通过使用环境配置`ObjectMapper`和`XmlMapper`实例。`Jackson`提供了一套广泛的`开/关`特性，可用于配置其处理的各个方面。这些特性在6个枚举中描述(在`Jackson`中)，它们映射到环境中的属性:

枚举
属性
值
说明

com.fasterxml.jackson.databind.SerializationFeature
spring.jackson.serialization.
true, false
序列化特性开关

com.fasterxml.jackson.databind.DeserializationFeature
spring.jackson.deserialization.
true, false
反序列化特性开关

com.fasterxml.jackson.core.JsonGenerator.Feature
spring.jackson.generator.
true, false
JsonGenerator可切换特性开关

com.fasterxml.jackson.databind.MapperFeature
spring.jackson.mapper.
true, false
ObjectMapper特性开关

com.fasterxml.jackson.core.JsonParser.Feature
spring.jackson.parser.
true, false
JsonParser特性开关

com.fasterxml.jackson.annotation.JsonInclude.Include
spring.jackson.default-property-inclusion
always, non_null, non_absent, non_default, non_empty
定义在序列化中包含Java Bean的哪些属性

常用属性配置：

```java
# 属性命名策略，PropertyNamingStrategy常量，SNAKE_CASE驼峰转下划线
spring.jackson.property-naming-strategy=SNAKE_CASE
# @JsonFormat的格式转换
spring.jackson.date-format=yyyy-MM-dd HH:mm:ss
#设置全局时区
spring.jackson.time-zone=GMT+8
#属性null值处理方式，非空才序列化
spring.jackson.default-property-inclusion=non_null
#枚举类SerializationFeature
#Date转换成timestamp
spring.jackson.serialization.write-dates-as-timestamps=true
#对象为null报错
spring.jackson.serialization.fail-on-empty-beans=true
#枚举类DeserializationFeature
#反序列化不存在属性时是否报错，默认true
spring.jackson.deserialization.fail-on-unknown-properties=false
#使用getter取代setter探测属性，如类中含getName()但不包含name属性与setName()，json输出包含name。默认false
spring.jackson.mapper.use-getters-as-setters=true
#枚举类JsonParser.Feature
#是否允许出现单引号，默认false
spring.jackson.parser.allow-single-quotes=true
```

## 二、Gson

当`Gson`在类路径上时，会自动配置`Gson Bean`。`spring.gson.*`提供自定义配置属性。要获得更多的控制,可以使用一个或多个`GsonBuilderCustomizer Bean`。

引入依赖，需要排除默认的`jackson`依赖，然后加入`gson`依赖：

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-json</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
</dependency>
```

常用配置

```java
# 序列化Date对象时使用的格式。
spring.gson.date-format=yyyy-MM-dd HH:mm:ss
#是否禁用HTML字符转义，如'<'，'>'等。
spring.gson.disable-html-escaping=true
#是否在序列化过程中排除内部类。
spring.gson.disable-inner-class-serialization=false
#是否启用复杂映射键(即非原语)的序列化
spring.gson.enable-complex-map-key-serialization=false
#在序列化或反序列化时，是否排除所有没有\"Expose\"注释的字段
spring.gson.exclude-fields-without-expose-annotation=true
#在序列化和反序列化期间应用于对象字段的命名策略 FieldNamingPolicy
spring.gson.field-naming-policy=UPPER_CAMEL_CASE
#是否通过在输出前加上一些特殊文本来生成不可执行的JSON。
spring.gson.generate-non-executable-json=false
#是否对不符合RFC 4627的JSON进行宽容的解析。
spring.gson.lenient=false
# Long类型和long类型的序列化策略。LongSerializationPolicy
spring.gson.long-serialization-policy=DEFAULT
# 是否输出适合页面的序列化JSON以进行漂亮的打印。
spring.gson.pretty-printing=true
# 是否序列化空字段。
spring.gson.serialize-nulls=true
```

## 三、JSON-B

当`JSON-B API`和实现在类路径上时，将自动配置一个`Json Bean`。首选的`JSON-B`实现是`Eclipse Yasson`，它提供了依赖项管理。

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-json</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.eclipse</groupId>
    <artifactId>yasson</artifactId>
    <version>2.0.4</version>
</dependency>
```

## 四、Fastjson

`fastjson` 是阿里巴巴的开源`JSON`解析库，它可以解析 `JSON` 格式的字符串，支持将 `JavaBean` 序列化为 `JSON` 字符串，也可以从 `JSON` 字符串反序列化到 `JavaBean`。

因为`fastjson`不是Spring Boot官方默认的`json`库，因此需要自定义`HttpMessageConverter`，`fastjosn`默认提供了跟spring集成的`HttpMessageConverter`实现：`FastJsonHttpMessageConverter`

引入依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-json</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.79</version>
</dependency>
```

```java
public class FastJsonHttpMessageConverter extends AbstractHttpMessageConverter<Object> implements GenericHttpMessageConverter<Object> {
  }
```

所以只需要自动创建`FastJsonHttpMessageConverter`，覆盖默认的`HttpMessageConverter`。

```java
@Configuration
public class FastJsonGlobalConfig {
    @Bean
    FastJsonHttpMessageConverter getconvers(){
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();
        FastJsonConfig jsonConfig = new FastJsonConfig();
        jsonConfig.setCharset(Charset.forName("UTF-8"));
        jsonConfig.setDateFormat("yyyy-MM-dd HH:mm:ss");
        converter.setFastJsonConfig(jsonConfig);
        converter.setDefaultCharset(Charset.forName("Utf-8"));
        return converter;
    }
}
```

还可以使用`WebMvcConfigurer`方式配置：

```java
@Configuration
public class WebMvcConfigurer extends WebMvcConfigurerAdapter {
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();
        FastJsonConfig jsonConfig = new FastJsonConfig();
        jsonConfig.setCharset(Charset.forName("UTF-8"));
        jsonConfig.setDateFormat("yyyy-MM-dd HH:mm:ss");
        converter.setFastJsonConfig(jsonConfig);
        converter.setDefaultCharset(Charset.forName("Utf-8"));
        converters.add(0, converter);
    }
}
```
