# 07、Spring Security 入门 - 认证过程其他常用配置
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/7.html
- 分类：安全框架
- 分组：教程目录
### 1.失败跳转

表单处理中成功会跳转到一个地址，失败也可以跳转到一个地址中

#### 1.1 编写页面

在 src/main/resources/static 下新建 fail.html 并编写如下内容

```xml
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Title</title>
</head>
<body>
	操作失败，请重新登录. <a href="/login.html">跳转</a>
</body>
</html>
```

#### 1.2 修改表单配置

在配置方法中表单认证部分添加 failureForwardUrl()方法，表示登录失败跳转的 url。此处依然是 POST 请求，所以跳转到可以接收 POST 请求的控制器/fail 中

```java
// 表单认证
http.formLogin()
	.loginProcessingUrl("/login") //当发现/login 时认为是登录，需要执行 UserDetailsServiceImpl
	.successForwardUrl("/toMain") //此处是 post 请求
	.failureForwardUrl("/fail") //登录失败跳转地址
	.loginPage("/login.html");
```

#### 1.3 添加控制器方法

在控制器类中添加控制器方法，方法映射路径/fail。此处要注意：由于是 POST 请求访问/fail。所以如果返回值直接转发到 fail.html 中，及时有效果，控制台也会报警告，提示 fail.html 不支持 POST 访问方式

```java
@PostMapping("/fail")
public String fail(){
	return "redirect:/fail.html";
}
```

#### 1.4 设置 fail.html 不需要认证

认证失败跳转到 fail.html 页面中，所以必须配置 fail.html 不需要被认证。需要修改配置类中内容

```java
// url 拦截
http.authorizeRequests()
	.antMatchers("/login.html").permitAll() //login.html 不需要被认证
	.antMatchers("/fail.html").permitAll() //fail.html 不需要被认证
	.anyRequest().authenticated();//所有的请求都必须被认证。必须登录后才能访问
```

### 2.设置请求账户和密码的参数名

#### 2.1 源码简介

当进行登录时会执行 UsernamePasswordAuthenticationFilter 过滤器

usernamePasrameter:账户参数名

passwordParameter:密码参数名

postOnly=true:默认情况下只允许 POST 请求

#### 2.2 修改配置

```java
// 表单认证
http.formLogin()
	.loginProcessingUrl("/login") //当发现/login 时认为是登录，需要执行 UserDetailsServiceImpl
	.successForwardUrl("/toMain") //此处是 post 请求
	.failureForwardUrl("/fail") //登录失败跳转地址
	.loginPage("/login.html")
	.usernameParameter("myusername")
	.passwordParameter("mypassword");
```

#### 2.3 修改页面

修改 login.html

```xml
<form action = "/login" method="post">
	用户名：<input type="text" name="myusername"/><br/>
	密码:<input type="password" name="mypassword"/><br/>
	<input type="submit" value="登录"/>
</form>
```

### 3.自定义登录成功处理器

#### 3.1 源码分析

使用 successForwardUrl()时表示成功后转发请求到地址。内部是 通过 successHandler（）方法进行控制成功后交给哪个类进行处

ForwardAuthenticationSuccessHandler 内部就是最简单的请求转发。由于是请求转发，当遇到需要跳转到站外或在前后端分离的项目中就无法使用了

当需要控制登录成功后去做一些事情时，可以进行自定义认证成功控制器

#### 3.2 代码实现

#### 3.2.1 自定义类

新建类 com.dqcgm.handler.MyAuthenticationSuccessHandler 编写如下：

```java
public class MyAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
	@Override
	public void onAuthenticationSuccess(HttpServletRequest httpServletRequest,HttpServletResponse httpServletResponse, Authentication authentication) throws IOException, ServletException {
		//Principal 主体，存放了登录用户的信息
		User user = (User)authentication.getPrincipal();
		System.out.println(user.getUsername());
		System.out.println(user.getPassword());//密码输出为 null
		System.out.println(user.getAuthorities());
		//重定向到百度。这只是一个示例，具体需要看项目业务需求
		httpServletResponse.sendRedirect("http://www.baidu.com");
	}
}
```

##### 3.2.2 修改配置项

使用 successHandler()方法设置成功后交给哪个对象进行处理

```java
// 表单认证
http.formLogin()
	.loginProcessingUrl("/login") //当发现/login 时认为是登录，需要执行 UserDetailsServiceImpl
	.successHandler(new MyAuthenticationSuccessHandler())
	//.successForwardUrl("/toMain") //此处是 post 请求
	.failureForwardUrl("/fail") //登录失败跳转地址
	.loginPage("/login.html");
```

### 4.自定义登录失败处理器

#### 4.1 源码分析

failureForwardUrl()内部调用的是 failureHandler()方法

ForwardAuthenticationFailureHandler 中也是一个请求转发，并在 request 作用域中设置 SPRING_SECURITY_LAST_EXCEPTION 的 key，内容为异常对象

#### 4.2 代码实现

##### 4.2.1 新建控制器

新建 com.dqcgm.handler.MyForwardAuthenticationFailureHandler 实现 AuthenticationFailureHandler。在方法中添加重定向语句

```java
public class MyForwardAuthenticationFailureHandler implements AuthenticationFailureHandler {
	@Override
	public void onAuthenticationFailure(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
		httpServletResponse.sendRedirect("/fail.html");
	}
}
```

##### 4.2.2 修改配置类

修改配置类中表单登录部分。设置失败时交给失败处理器进行操作。failureForwardUrl 和 failureHandler 不可共存

```java
// 表单认证
http.formLogin()
	.loginProcessingUrl("/login") //当发现/login 时认为是登录，需 要执行 UserDetailsServiceImpl
	.successHandler(new MyAuthenticationSuccessHandler())
	//.successForwardUrl("/toMain") //此处是 post 请求
	.failureHandler(new MyForwardAuthenticationFailureHandler())
	.failureForwardUrl("/fail") //登录失败跳转地址
	.loginPage("/login.html");
```
