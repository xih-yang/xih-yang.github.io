# 06、SpringSecurity 基础 - 认证授权结果处理
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/6.html
- 分类：安全框架
- 分组：教程目录
## 1.认证结果处理

### 1.1.认证成功处理

在传统的应用中，认证成功后页面需要跳转到认证成功页面或者跳转到个人中心页，但是在前后端分离的项目通常是使用Ajax请求完成认证，这时候我们需要返回一个JSON结果告知前端认证结果，然后前端自行跳转页面。

要做到上述功能，我们需要自定义认证成功处理器实现`AuthenticationSuccessHandler`接口复写 `onAuthenticationSuccess`方法，该方法其中一个参数是Authentication ，他里面封装了认证信息,用户信息UserDetails等，我们需要在这个方法中使用Response写出json数据即可

**1.导入JSON依赖**

```xml
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>fastjson</artifactId>
  <version>1.2.50</version>
</dependency>
```

**2.定义AuthenticationSuccessHandler**

定义类实现AuthenticationSuccessHandler接口复写onAuthenticationSuccess方法，实现自己的认证成功结果处理

```java
public class MyAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    @Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) 
throws IOException, ServletException {
        response.setContentType("application/json;charset=utf-8");
        Map map = new HashMap<>();
        map.put("success",true);
        map.put("message","认证成功");
        map.put("data",authentication);
        response.getWriter().print(JSON.toJSONString(map));
        response.getWriter().flush();
        response.getWriter().close();
    }
}
```

**3.配置AuthenticationSuccessHandler**

在SpringSecurity配置定义的AuthenticationSuccessHandler

```java
http.formLogin()
//.successForwardUrl("/loginSuccess") // 设置登陆成功页
.successHandler(new MyAuthenticationSuccessHandler)
...
```

### 1.2.认证失败结果处理

自定义登录失败的处理，需要实现AuthenticationFailureHandler接口，复写onAuthenticationFailure方法实现自己的认证失败结果处理

**1.定义认证失败处理器**

```java
public class MyAuthenticationFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
	    response.setContentType("application/json;charset=utf-8");
        Map map = new HashMap<>();
        map.put("success",false);
        map.put("message","认证失败");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.getWriter().print(JSON.toJSONString(map));
        response.getWriter().flush();
        response.getWriter().close();
    }
}
```

**2.配置处理器**

```java
http.formLogin()
.failureHandler(new MyAuthenticationFailureHandler)
...
```

## 2.授权结果处理

### 1.授权失败处理

当用户请求资源服务的资源时，需要进行用户的认证和授权检查，当认证或授权检查失败，我们需要要返回自己的失败结果信息，可以通过HttpSecurity设置授权失败结果处理器,内部通过 ExceptionTranslationFilter 调用AuthenticationEntryPoint实现匿名用户授权失败结果处理， ExceptionTranslationFilter 通过 AccessDeniedHandler来处理授权失败结果处理。

**1.定义认证检查失败处理**

定义AccessDeineHandler 用来解决认证过的用户访问无权限资源时的异常

```java
public class DefaultAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        String result = JSON.toJSONString(AjaxResult.me().setSuccess(false).setMessage("无访问权限"));
        response.setContentType("text/html;charset=utf-8");
        PrintWriter writer = response.getWriter();
        writer.print(result);
        writer.flush();
        writer.close();
    }
}
```

**2.定义AuthenticationEntryPoint**

AuthenticationEntryPoint 用来解决匿名用户访问无权限资源时的异常

```java
public class MyAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
        e.printStackTrace();
        httpServletResponse.setContentType("application/json;charset=utf-8");
        Map<String,Object> result = new HashMap<>();
        result.put("success",false);
        result.put("message","登录失败，用户名或密码错误["+e.getMessage()+"]");
        httpServletResponse.getWriter().print(JSONUtils.toJSONString(result));
    }
}
```

**3.配置异常处理器**

配置异常处理器

```java
httpSecurity.exceptionHandling()
 .accessDeniedHandler(new DefaultAccessDeniedHandler ())
.authenticationEntryPoint(new MyAuthenticationEntryPoint()) //身份认证验证失败配置
```
