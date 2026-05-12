# 内容协商
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/65.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
Youcan configure how Spring MVC determines the requested media types from the

request. The available options are to check the URL path for a file extension,

check the “Accept” header, a specific query parameter, or to fall back on a

default content type when nothing is requested. By default the path extension

inthe request URI is checked first and the “Accept” header is checked second.

TheMVC Java config and the MVC namespace register json, xml, rss,

atom by default if corresponding dependencies are on the classpath.

Additional path extension-to-media type mappings may also be registered

explicitly and that also has the effect of whitelisting them as safe

extensions for the purpose of RFD attack detection (see the section called

“Suffix Pattern Matching and RFD” for more detail).

Below is an example of customizing content negotiation options through the MVC

Java config:

```java
_@Configuration_ 
_@EnableWebMvc_ 
public class WebConfig extends WebMvcConfigurerAdapter { 
    _@Override_ 
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) { 
        configurer.mediaType("json", MediaType.APPLICATION_JSON); 
    } 
} 
```

Inthe MVC namespace, the `` element has a content- negotiation-manager attribute, which expects a ContentNegotiationManager

that in turn can be created with a ContentNegotiationManagerFactoryBean:

```xml
<mvc:annotation-driven content-negotiation-manager="contentNegotiationManager"/> 
<bean id="contentNegotiationManager" class="org.springframework.web.accept.ContentNegotiationManagerFactoryBean"> 
    <property name="mediaTypes"> 
        <value> 
            json=application/json 
            xml=application/xml 
        </value> 
    </property> 
</bean> 
```

Ifnot using the MVC Java config or the MVC namespace, you’ll need to create

aninstance of ContentNegotiationManager and use it to configure

RequestMappingHandlerMapping for request mapping purposes, and

RequestMappingHandlerAdapter and ExceptionHandlerExceptionResolver for

content negotiation purposes.

Note that ContentNegotiatingViewResolver now can also be configured with a

ContentNegotiationManager, so you can use one shared instance throughout

Spring MVC.

Inmore advanced cases, it may be useful to configure multiple

ContentNegotiationManager instances that in turn may contain custom

ContentNegotiationStrategy implementations. For example you could configure

ExceptionHandlerExceptionResolver with a ContentNegotiationManager that

always resolves the requested media type to "application/json". Or you may

want to plug a custom strategy that has some logic to select a default content

type (e.g. either XML or JSON) if no content types were requested.
