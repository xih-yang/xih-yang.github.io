# 验证
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/63.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
Spring提供了一个[验证器Validator接口](http://docs.spring.io/spring-framework/docs/4.2.4.RELEASE/spring-framework-reference/html/validation.html#validator)，应用的任何一层都可以使用它来做验证。在Spring MVC中，你可以配置一个全局的Validator实例，用以处理所有注解了@Valid的元素或注解了@Validated的控制器方法参数、以及/或在控制器内的@InitBinder方法中用作局部的Validator。全局验证器与局部验证器实例可以结合起来使用，提供组合验证。

Spring还[支持JSR-303/JSR-349](http://docs.spring.io/spring-framework/docs/4.2.4.RELEASE/spring-framework-reference/html/validation.html#validation-beanvalidation-overview)的Bean验证。这是通过LocalValidatorFactoryBean类实现的，它为Spring的验证器接口org.springframework.validation.Validator到Bean验证的javax.validation.Validator接口做了适配。这个类可以插入到Spring MVC的上下文中，作为一个全局的验证器，如下所述。

如果在classpath下存在Bean验证器，诸如Hibernate Validator等，那么@EnableWebMvc或``默认会自动使用LocalValidatorFactoryBean为Spring MVC应用提供Bean验证的支持。

> 有时，能将LocalValidatorFactoryBean直接注入到控制器或另外一个类中会更方便。
>
> Sometimes it’s convenient to have a LocalValidatorFactoryBean injected into
>
> acontroller or another class. The easiest way to do that is to declare your
>
> own @Bean and also mark it with @Primary in order to avoid a conflict with
>
> the one provided with the MVC Java config.
>
> If you prefer to use the one from the MVC Java config, you’ll need to override
>
> the mvcValidator method from WebMvcConfigurationSupport and declare the
>
> method to explicitly return LocalValidatorFactory rather than Validator.
>
> See Section 21.16.13, “Advanced Customizations with MVC Java
>
> Config” for information on how to switch to extend the
>
> provided configuration.

此外，你也可以配置你自己的全局Validator验证器实例：

```java
@Configuration 
@EnableWebMvc 
public class WebConfig extends WebMvcConfigurerAdapter { 
    @Override 
    public Validator getValidator(); { 
        // return "global" validator 
    } 
} 
```

XML中做法如下：

```xml
<?xml version="1.0" encoding="UTF-8"?> 
<beans xmlns="http://www.springframework.org/schema/beans" 
    xmlns:mvc="http://www.springframework.org/schema/mvc" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:schemaLocation=" 
        http://www.springframework.org/schema/beans 
        http://www.springframework.org/schema/beans/spring-beans.xsd 
        http://www.springframework.org/schema/mvc 
        http://www.springframework.org/schema/mvc/spring-mvc.xsd"> 
    <mvc:annotation-driven validator="globalValidator"/> 
</beans> 
```

若要同时使用全局验证和局部验证，只需添加一个（或多个）局部验证器即可：

```java
@Controller 
public class MyController { 
    @InitBinder 
    protected void initBinder(WebDataBinder binder) { 
        binder.addValidators(new FooValidator()); 
    } 
} 
```

做完这个最少的配置之后，任何时候只要方法中有参数注解了@Valid或@Validated，配置的验证器就会自动对它们做验证。任何无法通过的验证都会被自动报告为错误并添加到BindingResult对象中去，你可以在方法参数中声明它并获取这些错误，同时这些错误也能在Spring MVC的HTML视图中被渲染。
