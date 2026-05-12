# 默认配置的定制化
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/61.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
在MVC Java编程配置方式下，如果你想对默认配置进行定制，你可以自己实现WebMvcConfigurer接口，要么继承WebMvcConfigurerAdapter类并覆写你需要定制的方法：

```java
@Configuration 
@EnableWebMvc 
public class WebConfig extends WebMvcConfigurerAdapter { 
    // Override configuration methods... 
} 
```

在MVC XML命名空间下，如果你想对默认配置进行定制，请查看``元素支持的属性和子元素。你可以查看[Spring MVC XML schema](http://schema.spring.io/mvc/spring-mvc.xsd)，或使用IDE的自动补全功能来查看有哪些属性和子元素是可以配置的。
