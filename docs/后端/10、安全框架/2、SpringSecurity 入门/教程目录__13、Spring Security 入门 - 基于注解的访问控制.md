# 13、Spring Security 入门 - 基于注解的访问控制
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/13.html
- 分类：安全框架
- 分组：教程目录
在 Spring Security 中提供了一些访问控制的注解。这些注解都是默认是都不可用的，需要通过@EnableGlobalMethodSecurity 进行开启后使用。

如果设置的条件允许，程序正常执行。如果不允许会报 500

这些注解可以写到 Service 接口或方法上上也可以写到 Controller 或 Controller 的方法上。通常情况下都是写在控制器方法上的，控制接口 URL 是否允许被访问。

### 1.@Secured

@Secured 是专门用于判断是否具有角色的。能写在方法或类上。参数要以 ROLE_开头。

#### 1.1 实现步骤

##### 1.1.1 开启注解

在启动类 (也可以在配置类等能够扫描的类上)上添加 @EnableGlobalMethodSecurity(securedEnabled = true)

```java
@SpringBootApplication
@EnableGlobalMethodSecurity(securedEnabled = true)
public class MyApp {
	public static void main(String [] args){
		SpringApplication.run(MyApp.class,args);
	}
}
```

##### 1.1.2 在控制器方法上添加@Secured 注解

在 LoginController 中方法上添加注解

```java
@Secured("abc")
@RequestMapping("/toMain")
public String toMain(){
	return "redirect:/main.html";
}
```

##### 1.1.3 配置类

配置类中方法配置保留最基本的配置即可

```java
protected void configure(HttpSecurity http) throws Exception {
	// 表单认证
	http.formLogin()
		.loginProcessingUrl("/login") //当发现/login 时认为是登录，需要执行 UserDetailsServiceImpl
		.successForwardUrl("/toMain") //此处是 post 请求
		.loginPage("/login.html");
	// url 拦截
	http.authorizeRequests()
		.antMatchers("/login.html").permitAll() //login.html 不需要被认证
		.anyRequest().authenticated();//所有的请求都必须被认证。必须登录后才能访问
	//关闭 csrf 防护
	http.csrf().disable();
}
```

### 2.@PreAuthorize/@PostAuthorize

@PreAuthorize 和@PostAuthorize 都是方法或类级别注解。

@PreAuthorize 表示访问方法或类在执行之前先判断权限，大多情况下都是使用这个注解，注解的参数和 access()方法参数取值相同，都是权限表达式

@PostAuthorize 表示方法或类执行结束后判断权限，此注解很少被使用到。

#### 2.1 实现步骤

##### 2.1.1 开启注解

在启动类中开启@PreAuthorize 注解。

```java
@SpringBootApplication
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class MyApp {
	public static void main(String [] args){
		SpringApplication.run(MyApp.class,args);
	}
}
```

##### 2.1.2 添加@PreAuthorize

在控制器方法上添加@PreAuthorize，参数可以是任何 access()支持的表达式

```java
@PreAuthorize("hasRole('abc')")
@RequestMapping("/toMain")
public String toMain(){
	return "redirect:/main.html";
}
```
