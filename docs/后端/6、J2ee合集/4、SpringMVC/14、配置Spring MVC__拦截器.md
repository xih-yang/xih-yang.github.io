# 拦截器
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/64.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
你可以配置处理器拦截器HandlerInterceptors或web请求拦截器WebRequestInterceptors等拦截器，并配置它们拦截所有进入容器的请求，或限定到符合特定模式的URL路径。

在MVC Java编程配置下注册拦截器的方法：

```java
@Configuration 
@EnableWebMvc 
public class WebConfig extends WebMvcConfigurerAdapter { 
    @Override 
    public void addInterceptors(InterceptorRegistry registry) { 
        registry.addInterceptor(new LocaleInterceptor()); 
        registry.addInterceptor(new ThemeInterceptor()).addPathPatterns("/**").excludePathPatterns("/admin/**"); 
        registry.addInterceptor(new SecurityInterceptor()).addPathPatterns("/secure/*"); 
    } 
} 
```

在MVC XML命名空间下，则使用``元素：

```xml
<mvc:interceptors> 
    <bean class="org.springframework.web.servlet.i18n.LocaleChangeInterceptor"/> 
    <mvc:interceptor> 
        <mvc:mapping path="/**"/> 
        <mvc:exclude-mapping path="/admin/**"/> 
        <bean class="org.springframework.web.servlet.theme.ThemeChangeInterceptor"/> 
    </mvc:interceptor> 
    <mvc:interceptor> 
        <mvc:mapping path="/secure/*"/> 
        <bean class="org.example.SecurityInterceptor"/> 
    </mvc:interceptor> 
</mvc:interceptors> 
```
