# Servlet 3.0下的MultipartResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/39.html
- 分类：J2EE框架
- 分组：10、Spring的multipart（文件上传）支持
要使用基于Servlet 3.0的多路传输转换功能，你必须在web.xml中为DispatcherServlet添加一个multipart-config元素，或者通过Servlet编程的方法使用javax.servlet.MultipartConfigElement进行注册，或你自己定制了自己的Servlet类，那你必须使用javax.servlet.annotation.MultipartConfig对其进行注解。其他诸如最大文件大小或存储位置等配置选项都必须在这个Servlet级别进行注册，因为Servlet 3.0不允许在解析器MultipartResolver的层级配置这些信息。

当你通过以上任一种方式启用了Servlet 3.0多路传输转换功能，你就可以把一个StandardServletMultipartResolver解析器添加到你的Spring配置中去了：

```xml
<bean id="multipartResolver" class="org.springframework.web.multipart.support.StandardServletMultipartResolver"> 
</bean> 
```
