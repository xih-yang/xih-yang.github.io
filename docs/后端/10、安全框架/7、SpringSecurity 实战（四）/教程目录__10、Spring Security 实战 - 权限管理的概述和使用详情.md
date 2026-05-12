# 10、Spring Security 实战 - 权限管理的概述和使用详情
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/10.html
- 分类：安全框架
- 分组：教程目录
## 一、授权的核心概念

在专栏内前面的博客中，详细地述说了认证过程，我们得知认证成功之后会将当前登录的用户信息保存到 `Authentication` 对象中，Authentication 对象中有一个 `getAuthorities()` 方法，用来返回当前登录用户具备的权限信息，也就是当前用户具有权限信息。该方法的返回值为 `Collection`，当需要进行权限判断时，就会根据集合返回权限信息调用相应方法进行判断。（而认证后上下文是如何去得到这个 Authentication 的，在前期博客中也详细解释了——通过 SecurityContextHolder 类进行获取）

看返回值的占位符，针对于返回值为 `GrantedAuthority` 应该如何理解？是角色还是权限？

针对于授权管理，一般使用的是咱熟悉的 `RBAC` 模型，其中 R 可称为 `Resources`，也可称为 `Roles`，也就是我们针对授权可以是基于角色权限管理 和 基于资源权限管理。从设计层面来说，角色和权限是两个完全不同的东西：权限是一些具体操作，角色则是某些权限集合。如：READ_BOOK 和 ROLE_ADMIN 是完全不同的。因此至于返回值是什么取决于业务设计情况：

- 基于角色权限设计就是：用户``角色``资源 三者关系 返回就是用户的角色。
- 基于资源权限设计就是：用户``权限``资源 三者关系 返回就是用户的 权限
- 基于角色和资源权限设计就是：用户``角色``权限``资源 返回统称为用户的权限。

为什么可以统称为权限 ？因为从代码层面角色和权限没有太大不同，都是权限。特别是在 Spring Security 中，角色和权限处理方式基本上都是一样的（都是字符串）。唯一区别是 Spring Security 在很多时候会自动给角色添加一个 `ROLE_` 前缀，而权限则不会自动添加（这是源于 Spring Security 的内部实现）。

## 二、权限管理策略

实际开发中，认证在项目进行中总是固定的，而权限管理一般是可变的，更需要开发人员去了解的。

Spring Security 中提供的**权限管理策略**主要有两种类型：

可以访问系统中的哪些资源？ （http、url、method）

- 基于过滤器的权限管理（FilterSecurityInterceptor）
- 基于过滤器的权限管理主要是用来拦截 HTTP 请求，拦截下来之后，根据 HTTP 请求地址进行权限校验。
- 基于 AOP 的权限管理（MethodSecurityInterceptor）
- 基于 AOP 权限管理主要是用来处理方法级别的权限问题。当需要调用一个方法时，通过 AOP 将操作拦截下来，然后判断用户是否具备相关的权限。

### 权限表达式（SpEL Spring EL）

在解释俩权限管理策略之前，先阐述一下 Spring Security 内置的权限表达式（SpEL 表达式）。它主要是用来进行权限配置的，我们可以在请求的 URL 或者 访问的方法上（注解），通过权限表达式来配置需要的权限。以下是 Spring Security 内置的权限表达式：

表达式
作用

hasRole(String role)
当前用户是否具备指定角色

hasAnyRole(String… roles)
当前用户是否具备指定角色中的任意一个

hasAuthority(String authority)
当前用户是否具备指定的权限

hasAnyAuthority(String… authorities)
当前用户是否具备指定权限中的任意一个

permitAll()
允许所有的请求/调用

denyAll()
拒绝所有的请求/调用

isAnonymous()
当前用户是否是一个匿名用户

isAuthenticated()
当前用户是否已经认证成功

isRememberMe()
当前用户是否哦是通过 RememberMe 自动登录的

isFullyAuthenticated()
当前用户是否既不是匿名用户又不是通过RememberMe自动登录的

hasPermission(Object target,Object permission)
当前用户是否具备指定目标的指定权限

hasPermission(Object targetId,String targetType,Object permission)
当前用户是否具备指定目标的指定权限

getAuthentication()
获取 Authentication 对象

authentication
这个是从 SecurityContext 中获取的 Authentication 对象，即已经认证了的

principal
代表当前登录主体 Principal

一般来说，Spring Security 提供的这些内置权限表达式，就已经足够使用了。

### 1. 基于 URL 的权限管理（过滤器）

基于URL 地址的权限管理主要是通过过滤器 FilterSecurityInterceptor 来实现的。如果开发者配置了基于 URL 地址的权限管理，那么 FilterSecurityInterceptor 就会被自动添加到 Spring Security 过滤器链中，在过滤器链红拦截下请求，然后分析当前用户是否具备请求所需要的权限，如果不具备，则抛出异常。

#### 基本用法

（在创建 SpringBoot 项目的时候，不小心创建成了 6.1 版本的了，不想改了，下面测试就是按最新版来的，有些方法都被启用了，下面是最新版的代码，还有 6.1 版本的SpringSecurity 在@EnableWebSecurity 注解的元注解中，已经没有 @Configuration 了，所以记得在外面加上，这是一个坑。）

配置类

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        return new InMemoryUserDetailsManager(
                User.withUsername("root").password("{noop}123").roles("ADMIN","USER").authorities("READ_INFO").build(),
                User.withUsername("admin").password("{noop}123").roles("USER").build(),
                User.withUsername("myz").password("{noop}123").authorities("READ_INFO").build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http,@Autowired UserDetailsService userDetailsService) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsService);
        return builder.build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .requestMatchers("/user").hasRole("USER")
                .requestMatchers("/getInfo").hasAuthority("READ_INFO")
                .requestMatchers("/admin").hasRole("ADMIN")
                .anyRequest().authenticated()
                .and()
                .formLogin(configurer->{
     })
                .csrf(configurer->configurer.disable())
                .build();
    }
}
```

TestController

```java
@RestController
public class TestController {
    @GetMapping("/user")
    public String user(){
        return "user ok!";
    }
    @GetMapping("/admin")
    public String admin(){
        return "admin ok!";
    }
    @GetMapping("/getInfo")
    public String getInfo(){
        return "info ok!";
    }
}
```

测试效果：myz/123 登录的用户只能访问 `/getInfo`；admin/123 登录的用户只能访问 `/user`；root/123 登录的用户三个测试资源路径都能访问。

### 2. 基于 方法 的权限管理（AOP）

基于方法的权限管理主要是通过 AOP 来实现的，Spring Security 中通过 `MethodSecurityInterceptor` 来提供相关的实现。不同在于 URL 中的 `FilterSecurityInterceptor` 只是这种请求之前进行前置处理，而 MethodSecurityInterceptor 除了前置处理之外还可以进行后置处理（**相当于是环绕的切面**）。前置处理就是在请求之前判断是否具备相应的权限，后置处理则是对方法的执行结果进行二次过滤。前置处理和后置处理分别对应了不同的实现类。

#### @EnableGlobalMethodSecurity

EnableGlobalMethodSecurity 注解是用来开启权限注解的，注解被开启了才能在项目代码中使用。用法如下：

```java
@EnableWebSecurity
@EnableGlobalMethodSecurity(
        prePostEnabled = true,
        securedEnabled = true,
        jsr250Enabled = true
)
public class SecurityConfig {
}
```

- perPostEnabled：开启 Spring Security 提供的四个权限注解，@PostAuthorize、@PostFilter、@PreAuthorize 以及 @PreFilter。
- securedEnabled：开启 Spring Security 提供的 @Secured 注解，该注解不支持权限表达式。
- jsr250Enabled：开启 JSR-250 提供的注解，主要是 @DenyAll、@PermitAll、@RolesAll 。同样这些注解也不支持权限表达式。

以上所提到的注解含义如下表所示：

注解
含义

@PostAuthorize
在目标方法执行之后进行权限校验

@PostFilter
在目标方法执行在之后对返回结果进行过滤

@PreAuthorize
在目标方法执行之前进行权限校验

@PreFilter
在目标方法执行之前对方法参数进行过滤

@Secured
访问目标方法必须具各相应的角色

@DenyAll
拒绝所有访问

@PermitAll
允许所有访问

@RolesAllowed
访问目标方法必须具备相应的角色

这些基于方法的权限管理相关的注解，一般来说只要设置 `prePostEnabled=true` 就够用了，也就是解放表中前四个注解。

#### 基本用法

SecurityConfig

```java
@EnableWebSecurity
@EnableGlobalMethodSecurity(
        prePostEnabled = true,
        securedEnabled = true,
        jsr250Enabled = true
)
public class SecurityConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        return new InMemoryUserDetailsManager(
                User.withUsername("root")
                        .password("{noop}123")
                        // .authorities("READ_INFO")
                        .roles("ADMIN","USER")
                        .build(),
                User.withUsername("admin").password("{noop}123").roles("USER").build(),
                User.withUsername("myz").password("{noop}123").authorities("READ_INFO").build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsService());
        return builder.build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest().authenticated()
                .and()
                .formLogin()
                .and()
                .csrf(configurer->configurer.disable())
                .build();
    }
}
```

AuthorizeMethodController

```java
@RestController
@RequestMapping("/hello")
public class AuthorizeMethodController {
    @GetMapping("/getInfo")
    public Object getInfo(){
        System.out.println(SecurityContextHolder.getContext().getAuthentication().getName());
        return SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    @PreAuthorize("hasRole('ADMIN') and authentication.name=='root'")
    @GetMapping
    public String hello(){
        return "hello";
    }
    @PreAuthorize("authentication.name==#name")
    @GetMapping("/name")
    public String hello(String name){
        return "hello:" + name;
    }
    @PreFilter(value="filterObject.id%2!=0",filterTarget = "users")// filterTarget 必须是 数组 集合类型
    @PostMapping("/users")
    public void addUsers(@RequestBody List<User> users){
        System.out.println("users = " + users);
    }
    @PostAuthorize("returnObject.id==1")
    @GetMapping("/userId")
    public User getUserById(Integer id){
        return new User("myz",id);
    }
    @PostFilter("filterObject.id%2==0")// 用来对方法的返回值进行过滤，filterObject也是需要是集合或者是数组才行
    @GetMapping("/lists")
    public List<User> getAll(){
        List<User> users = new ArrayList<>();
        for(int i=0;i<10;++i){
            users.add(new User("myz:" + i, i));
        }
        return users;
    }
    @Secured("ROLE_USER")// 只能判断角色
    @GetMapping("/secured")
    public User getUserByUsername(){
        return new User("secured",999);
    }
    @Secured({
     "ROLE_USER","ROLE_ADMIN"})
    @GetMapping("/username")
    public User getUsername(String username){
        return new User(username,11111);
    }
}
```

自定义User

```java
@NoArgsConstructor
@AllArgsConstructor
@Data
public class User {
    private String name;
    private Integer id;
}
```

测试效果：略~

## 三、权限管理之版本问题

注意：在 Spring Security 5.7.8 版本中，Spring Security 中内部提供的 UserDetails 实现类 User 的权限添加是取决于后者，即使用 `roles` 或 `authorities` 方法进行用户对象权限添加时，User 对象实际的权限取决于后使用的方法，这源于如下的内部实现：

通过源码可以看见，内部属性 authorities 集合对象，每次调用 roles 或者 authorities 方法都重新实例化赋值了。

而在最新版本 6.1.0 中，其内部属性 authorities 本就是一个空的集合对象，然后使用 roles 和 authorities 方法时，是往内部 authorities 集合中进行添加元素。即可同时使用。

但小编认为在实际中我们会自己搭配自己的 UserDetails 实现类，自定义方法实现，所以这些问题在一定程度上也不会遇到。但是在使用 InMemoryUserDetailsManager 进行某测试的时候，需要注意这一点。毕竟持久化的用户信息较有意义些。
