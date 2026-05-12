# 地区更改拦截器LocaleChangeInterceptor
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/31.html
- 分类：J2EE框架
- 分组：8、地区信息
Youcan enable changing of locales by adding the LocaleChangeInterceptor to

oneof the handler mappings (see [Section 21.4, “Handler mappings”](`$`publish-21-8-mvc.html

## mvc-handlermapping “21.4 Handler mappings” )). It will detect a parameter in

therequest and change the locale. It calls setLocale() on the

LocaleResolver that also exists in the context. The following example shows

that calls to all *.view resources containing a parameter named

siteLanguage will now change the locale. So, for example, a request for the

following URL, `` will change the

site language to Dutch.

你可以在处理器映射（详见[21.4 处理器映射（Handler mappings）](http://docs.spring.io/spring-framework/docs/4.2.4.RELEASE/spring-framework-reference/html/mvc.html#mvc-handlermapping)小节）前添加一个LocaleChangeInterceptor拦截器来更改地区信息。它能检测请求中的参数，并根据其值相应地更新地区信息。它通过调用LocaleResolver的setLocale()方法来更改地区。下面的代码配置展示了如何为所有请求*.view路径并且携带了siteLanguage参数的资源请求更改地区。举个例子，一个URL为``的请求将会将站点语言更改为荷兰语。

```xml
<bean id="localeChangeInterceptor" class="org.springframework.web.servlet.i18n.LocaleChangeInterceptor"> 
    <property name="paramName" value="siteLanguage"/> 
</bean> 
<bean id="localeResolver" class="org.springframework.web.servlet.i18n.CookieLocaleResolver"/> 
<bean id="urlMapping" class="org.springframework.web.servlet.handler.SimpleUrlHandlerMapping"> 
    <property name="interceptors"> 
        <list> 
            <ref bean="localeChangeInterceptor"/> 
        </list> 
    </property> 
    <property name="mappings"> 
        <value>/**/*.view=someController</value> 
    </property> 
</bean> 
```
