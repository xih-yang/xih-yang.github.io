# 转换与格式化
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/62.html
- 分类：J2EE框架
- 分组：14、配置Spring MVC
数字的Number类型和日期Date类型的格式化是默认安装了的，包括@NumberFormat注解和@DateTimeFormat注解。如果classpath路径下存在Joda Time依赖，那么完美支持Joda Time的时间格式化库也会被安装好。如果要注册定制的格式化器或转换器，请覆写addFormatters方法：

```java
@Configuration 
@EnableWebMvc 
public class WebConfig extends WebMvcConfigurerAdapter { 
    @Override 
    public void addFormatters(FormatterRegistry registry) { 
        // Add formatters and/or converters 
    } 
} 
```

使用MVC命名空间时，``也会进行同样的默认配置。要注册定制的格式化器和转换器，只需要提供一个转换服务ConversionService：

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
    <mvc:annotation-driven conversion-service="conversionService"/> 
    <bean id="conversionService" 
            class="org.springframework.format.support.FormattingConversionServiceFactoryBean"> 
        <property name="converters"> 
            <set> 
                <bean class="org.example.MyConverter"/> 
            </set> 
        </property> 
        <property name="formatters"> 
            <set> 
                <bean class="org.example.MyFormatter"/> 
                <bean class="org.example.MyAnnotationFormatterFactory"/> 
            </set> 
        </property> 
        <property name="formatterRegistrars"> 
            <set> 
                <bean class="org.example.MyFormatterRegistrar"/> 
            </set> 
        </property> 
    </bean> 
</beans> 
```

> 关于如何使用格式化管理器FormatterRegistrar，请参考 8.6.4 FormatterRegistrar SPI一节，以及FormattingConversionServiceFactoryBean的文档。
