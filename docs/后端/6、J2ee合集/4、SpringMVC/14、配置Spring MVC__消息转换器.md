# 消息转换器
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/71.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
使用MVC Java编程配置方式时，如果你想替换Spring MVC提供的默认转换器，完全定制自己的HttpMessageConverter，这可以通过覆写[configureMessageConverters()](http://docs.spring.io/spring-framework/docs/4.2.4.RELEASE/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurerAdapter.html#configureMessageConverters-java.util.List-)方法来实现。如果你只是想定制一下，或者想在默认转换器之外再添加其他的转换器，那么可以通过覆写[extendMessageConverters()](http://docs.spring.io/spring-framework/docs/4.2.4.RELEASE/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurerAdapter.html#extendMessageConverters-java.util.List-)方法来实现。

下面是一段例子，它使用定制的ObjectMapper构造了新的Jackson的JSON和XML转换器，并用它们替换了默认提供的转换器：

```java
    @Configuration 
    @EnableWebMvc 
    public class WebConfiguration extends WebMvcConfigurerAdapter { 
        @Override 
        public void configureMessageConverters(List<HttpMessageConverter<?>> converters) { 
            Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder() 
                    .indentOutput(true) 
                    .dateFormat(new SimpleDateFormat("yyyy-MM-dd")) 
                    .modulesToInstall(new ParameterNamesModule()); 
            converters.add(new MappingJackson2HttpMessageConverter(builder.build())); 
            converters.add(new MappingJackson2XmlHttpMessageConverter(builder.xml().build())); 
        } 
    } 
```

在上面的例子中，Jackson2ObjectMapperBuilder用于为MappingJackson2HttpMessageConverter和MappingJackson2XmlHttpMessageConverter转换器创建公共的配置，比如启用tab缩进、定制的日期格式，并注册了一个模块[jackson-module-parameter-names](https://github.com/FasterXML/jackson-module-parameter-names)用于获取参数名（Java 8新增的特性）

> 除了jackson- dataformat-xml，要启用Jackson XML的tab缩进支持，还需要一个woodstox-core-asl依赖。

还有其他有用的Jackson模块可以使用：

**1、** [jackson-datatype-money][]：提供了对javax.money类型的支持（非官方模块）；

**2、** [jackson-datatype-hibernate][]：提供了Hibernate相关的类型和属性支持（包含懒加载aspects）；

在XML做同样的事也是可能的：

```xml
<mvc:annotation-driven> 
    <mvc:message-converters> 
        <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"> 
            <property name="objectMapper" ref="objectMapper"/> 
        </bean> 
        <bean class="org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter"> 
            <property name="objectMapper" ref="xmlMapper"/> 
        </bean> 
    </mvc:message-converters> 
</mvc:annotation-driven> 
<bean id="objectMapper" class="org.springframework.http.converter.json.Jackson2ObjectMapperFactoryBean" 
      p:indentOutput="true" 
      p:simpleDateFormat="yyyy-MM-dd" 
      p:modulesToInstall="com.fasterxml.jackson.module.paramnames.ParameterNamesModule"/> 
<bean id="xmlMapper" parent="objectMapper" p:createXmlMapper="true"/> 
```

dataformat-xml%22
[jackson-datatype-money]: https://github.com/zalando/jackson-datatype-money
[jackson-datatype-hibernate]: https://github.com/FasterXML/jackson-datatype-hibernate
