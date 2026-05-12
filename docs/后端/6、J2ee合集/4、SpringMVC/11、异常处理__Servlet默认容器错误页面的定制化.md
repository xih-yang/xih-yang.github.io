# Servlet默认容器错误页面的定制化
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/1/47.html
- 分类：J2EE框架
- 分组：11、异常处理
当响应的状态码被设置为错误状态码，并且响应体中没有内容时，Servlet容器通常会渲染一个HTML错误页。若需要定制容器默认提供的错误页，你可以在web.xml中定义一个错误页面``元素。在Servlet 3规范出来之前，该错误页元素必须被显式指定映射到一个具体的错误码或一个异常类型。从Servlet 3开始，错误页不再需要映射到其他信息了，这意味着，你指定的位置就是对Servlet容器默认错误页的自定制了。

```xml
<error-page> 
    <location>/error</location> 
</error-page> 
```

这里错误页的位置所在可以是一个JSP页面，或者其他的一些URL，只要它指定容器里任意一个@Controller控制器下的处理器方法：

写回HttpServletResponse的错误信息和错误状态码可以在控制器中通过请求属性来获取：

```java
@Controller 
public class ErrorController { 
    @RequestMapping(path = "/error", produces = MediaType.APPLICATION_JSON_UTF8_VALUE) 
    @ResponseBody 
    public Map<String, Object> handle(HttpServletRequest request) { 
        Map<String, Object> map = new HashMap<String, Object>(); 
        map.put("status", request.getAttribute("javax.servlet.error.status_code")); 
        map.put("reason", request.getAttribute("javax.servlet.error.message")); 
        return map; 
    } 
} 
```

或者在JSP中这么使用:

```xml
<%@ page contentType="application/json" pageEncoding="UTF-8"%> 
{ 
    status:<%=request.getAttribute("javax.servlet.error.status_code") %>, 
    reason:<%=request.getAttribute("javax.servlet.error.message") %> 
} 
```
