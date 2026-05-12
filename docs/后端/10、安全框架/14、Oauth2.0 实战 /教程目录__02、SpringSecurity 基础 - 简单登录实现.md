# 02、SpringSecurity 基础 - 简单登录实现
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/2.html
- 分类：安全框架
- 分组：教程目录
## 1.SpringSecurity介绍

Spring Security是一个能够为基于Spring的企业应用系统提供声明式的安全访问控制解决方案的安全框架。它提供了一组可以在Spring应用上下文中配置的Bean，充分利用了Spring IoC，DI（控制反转Inversion of Control ,DI:Dependency Injection 依赖注入）和AOP（面向切面编程）功能，为应用系统提供声明式的安全访问控制功能，减少了为企业系统安全控制编写大量重复代码的工作。

## 2.SpringSecurity入门

**1、** 搭建工程；

基于SpringBoot搭建web工程 ，项目名为“spring-security-demo”

**2、** 导入依赖；

这里继承了SpringBoot的父工程，引入SpringSecurity基础依赖

“spring-boot-starter-security”，以及集成web的依赖“spring-boot-starter-web”

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.5.RELEASE</version>
  </parent>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
```

**3、** 主配置类；

```java
@SpringBootApplication
public class ApplicationConfig {
    public static void main(String[] args) {
        SpringApplication.run(ApplicationConfig.class);
    }
}
```

**4、** Web控制器；

当用户认证成功之后会重定向到该方法，返回“登录成功”给用户

```java
@Controller
public class AuthController {
	//登录成功后重定向地址
    @RequestMapping("/loginSuccess")
    @ResponseBody
    public String loginSuccess(){
        return "登录成功";
} 
}
```

**5、** 配置SpringSecurity；

SpringSecurity提供了一个配置类WebSecurityConfigurerAdapter用来提供给程序员对SpringSecurity做自定义配置，我们需要配置如下几个信息：

- 创建UserDetailService的Bean，该组件是用来加载用户认证信息
- 配置编码器，通过该编码器对密码进行加密匹配。
- 授权规则配置，哪些资源需要什么权限…

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
     //提供用户信息，这里没有从数据库查询用户信息，在内存中模拟
    @Bean
    public UserDetailsService userDetailsService(){
        InMemoryUserDetailsManager inMemoryUserDetailsManager = 
        new InMemoryUserDetailsManager();
        inMemoryUserDetailsManager.createUser(User.withUsername("zs").password("123").authorities("admin").build());
        return inMemoryUserDetailsManager;
    }
    //密码编码器：不加密
    @Bean
    public PasswordEncoder passwordEncoder(){
        return NoOpPasswordEncoder.getInstance();
    }
    //授权规则配置
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()                                //授权配置
                .antMatchers("/login").permitAll()  //登录路径放行
                .anyRequest().authenticated()                   //其他路径都要认证之后才能访问
                .and().formLogin()                              //允许表单登录
                .successForwardUrl("/loginSuccess")             // 设置登陆成功页
                .and().logout().permitAll()                    //登出路径放行
                .and().csrf().disable();                        //关闭跨域伪造检查
    }
}
```

**6、** 测试；

浏览器访问：http://localhost:8080/login ,进入Security提供的登录页面，输入账号：zs 密码 123 完成登录，登出成功页面显示 “登录成功”

## 3.认证流程小结

SpringBoot+SpringSecurity集成入门案例到这里就结束了，这里并没有多SpringSecurity原理做过多解释(留在后面章节)，那么这个案例大概的实现思路是：

- SpringSecurity根据我们在WebSecurityConfig中的配置会对除了“/login”之外的资源进行拦截做登录检查，
- 如果没有登录会跳转到默认的登录页面“/login” 做登录
- 输入用户名和密码后点击登录，SpringSecurity的拦截器会拦截到登录请求，获取到用户名和密码封装成认证对象(Token对象)，底层会调用InMemoryUserDetailsService通过用户名获取用户的认证信息(用户名，密码，权限等，这些信息通常是在数据库存储的)
- 然后执行认证工作：Security把登录请求传入的密码和InMemoryUserDetailsService中加载的用户的密码进行匹配(通过PasswordEncoder)， 匹配成功跳转成功地址，认证失败就返回错误
