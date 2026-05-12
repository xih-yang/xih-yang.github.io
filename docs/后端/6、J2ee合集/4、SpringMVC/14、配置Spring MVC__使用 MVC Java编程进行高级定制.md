# 使用 MVC Java编程进行高级定制
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/72.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
从上面许多例子你可以看到，MVC Java编程配置和MVC命名空间的方式都提供了更高抽象层级的应用配置，它不需要你对底下创建的bean有非常深入的了解，相反，这使得你能仅专注于应用需要的配置。不过，有时你可能希望对应用的更精细控制，或你就是单纯希望理解底下的配置和机制。

要做到更精细的控制，你要做的第一步就是看看底层都为你创建了哪些bean。若你使用MVC Java编程的方式进行配置，你可以看看java文档，以及WebMvcConfigurationSupport类的@Bean方法。这个类有的配置都会自动被@EnableWebMvc注解导入。事实上，如果你打开@EnableWebMvc的声明，你就会看到应用于其上的@Import注解。

精细控制的下一步是选择一个WebMvcConfigurationSupport创建的bean，定制它的属性，或你可以提供自己的一个实例。这确保做到以下两步：移除@EnableWebMvc注解以避免默认配置被自动导入，然后继承DelegatingWebMvcConfiguration类，它是WebMvcConfigurationSupport的一个子类。以下是一个例子：

```java
@Configuration 
public class WebConfig extends DelegatingWebMvcConfiguration { 
    @Override 
    public void addInterceptors(InterceptorRegistry registry){ 
        // ... 
    } 
    @Override 
    @Bean 
    public RequestMappingHandlerAdapter requestMappingHandlerAdapter() { 
        // 自己创建适配器，或者调用super让基类处理 
        // 然后在这里定制bean的一些属性 
    } 
} 
```

> 应用应该只有一个继承DelegatingWebMvcConfiguration的配置类，或只有一个@EnableWebMvc注解的类，因为它们背后注册的bean都是相同的。
>
> 使用这个方式修改bean的属性，与这节前面展示的任何高抽象层级的配置方式并不冲突。WebMvcConfigurerAdapter的子类和WebMvcConfigurer的实现都还是会被使用。
