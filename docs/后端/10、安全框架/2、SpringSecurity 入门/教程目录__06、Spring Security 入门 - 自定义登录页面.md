# 06、Spring Security 入门 - 自定义登录页面
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/6.html
- 分类：安全框架
- 分组：教程目录
虽然 Spring Security 给我们提供了登录页面，但是对于实际项目中，大多喜欢使用自己的登录页面。所以 Spring Security 中不仅仅提供了登录页面，还支持用户自定义登录页面。实现过程也比较简单，只需要修改配置类即可

### 1.编写登录页面

编写登录页面，登录页面中``的 action 不编写对应控制器也可以

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>内容</title>
</head>
<body>
	<form action="/login" method="post">
		<input type="text" name="username"/>
		<input type="password" name="password"/>
		<input type="submit" value="提交"/>
	</form>
</body>
</html>
```

### 2.修改配置类

修改配置类中主要是设置哪个页面是登录页面。配置类需要继承 WebSecurityConfigurerAdapte,并重写 configure 方法

successForwardUrl()登录成功后跳转地址

loginPage() 登录页面

loginProcessingUrl 登录页面表单提交地址，此地址可以不真实存在。

antMatchers():匹配内容

permitAll():允许

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		// 表单认证
		http.formLogin()
			.loginProcessingUrl("/login") //当发现/login 时认为是登录，需要执行 UserDetailsServiceImpl
			.successForwardUrl("/toMain") //此处是 post 请求
			.loginPage("/login.html");
		// url 拦截
		http.authorizeRequests()
			.antMatchers("/login.html").permitAll() //login.html 不需要被认证
			.anyRequest().authenticated();//所有的请求都必须被认证。必须登录后才能访问。
		//关闭 csrf 防护
		http.csrf().disable();
	}
	@Bean
	public PasswordEncoder getPe(){
		return new BCryptPasswordEncoder();
	}
}
```

### 3.编写控制器

编写控制器，当用户登录成功后跳转 toMain 控制器。编写完成控制器后编写 main.html。页面中随意写上一句话表示 main.html 页面内容即可。而之前的/login 控制器方法是不执行的，所以可以删除了

```java
@Controller
public class LoginController {
	// 该方法不会被执行
	// @RequestMapping("/login")
	// public String login(){
		// System.out.println("执行了 login 方法");
		//return "redirect:main.html";
	//}
	@PostMapping("/toMain")
	public String toMain(){
		return "redirect:/main.html";
	}
}
```
