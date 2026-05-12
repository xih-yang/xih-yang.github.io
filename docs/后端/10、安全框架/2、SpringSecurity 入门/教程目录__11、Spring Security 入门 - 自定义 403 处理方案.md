# 11、Spring Security 入门 - 自定义 403 处理方案
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/11.html
- 分类：安全框架
- 分组：教程目录
使用 Spring Security 时经常会看见 403（无权限），默认情况下显示的效果如下：

而在实际项目中可能都是一个异步请求，显示上述效果对于用户就不是特别友好了。Spring Security 支持自定义权限受限。

### 1.新建类

新建类实现 AccessDeniedHandler

```java
@Component
public class MyAccessDeniedHandler implements AccessDeniedHandler {
	@Override
	public void handle(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AccessDeniedException e) throws IOException, ServletException {
		httpServletResponse.setStatus(HttpServletResponse.SC_FORBIDDEN); httpServletResponse.setHeader("Content-Type","application/json;charset=utf-8") ;
		PrintWriter out = httpServletResponse.getWriter();
		out.write("{\"status\":\"error\",\"msg\":\"权限不足，请联系管理 员!\"}");
		out.flush();
		out.close();
	}
}
```

### 2.修改配置类

配置类中重点添加异常处理器。设置访问受限后交给哪个对象进行处理

myAccessDeniedHandler 是在配置类中进行自动注入的

```java
//异常处理
http.exceptionHandling()
	.accessDeniedHandler(myAccessDeniedHandler);
```
