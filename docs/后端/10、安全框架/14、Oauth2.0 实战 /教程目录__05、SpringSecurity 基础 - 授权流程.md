# 05、SpringSecurity 基础 - 授权流程
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/5.html
- 分类：安全框架
- 分组：教程目录
### 1.授权流程分析

授权一定是在认证通过之后，授权流程是通过FilterSecurityInterceptor拦截器来完成，FilterSecurityInterceptor通过调用SecurityMetadataSource来获取当前访问的资源所需要的权限，然后通过调用AccessDecisionManager投票决定当前用户是否有权限访问当前资源。授权流程如下

**1、** 当客户端向某个资源发起请求，请求到达FilterSecurityInterceptor，然后会调用其父类AbstractSecurityInterceptor；

的beforeInvocation方法做授权之前的准备工作
**2、** 在beforeInvocation法中通过SecurityMetadataSource…getAttributes(object);获得资源所需要的访问权限，通过SecurityContextHolder.getContext().getAuthentication()获取当前认证用户的认证信息，即包含了认证信息和权限信息的Authentication对象；

**3、** 然后FilterSecurityInterceptor通过调用AccessDecisionManager.decide(authenticated,object,attributes);进行授权(authenticated中有用户的权限列表，attributes是资源需要的权限)，该方法使用投票器投票来决定用户是否有资源访问权限；

AccessDecisionManager接口有三个实现类，他们通过通过AccessDecisionVoter投票器完成投票，三种投票策略如下：

AffirmativeBased ： 只需有一个投票赞成即可通过

ConsensusBased：需要大多数投票赞成即可通过，平票可以配置

UnanimousBased：需要所有的投票赞成才能通过

而投票器也有很多，如RoleVoter通过角色投票，如果ConfigAttribute是以“ROLE_”开头的，则将使用RoleVoter进行投票，AuthenticatedVoter 是用来区分匿名用户、通过Remember-Me认证的用户和完全认证的用户(登录后的)
**4、** 投票通过，请求放行，响应对应的资源给客户端；

## 2.Web授权

### 2.1.web授权API说明

在Security配置类中，可以通过HttpSecurity.authorizeRequests()给资源指定访问的权限，其API如下：

- anyRequest():任何请求
- antMatchers（“/path”） ：匹配某个资源路径
- authenticationed() : 保护URL需要登录访问
- permitAll():指定url无需保护(放行)一般用户静态资源
- hasRole(String role)：某个资源需要用户拥有什么样的role才能访问
- hasAuthority(String authority):某个资源需要用户拥有什么样的权限才能访问
- hasAnyRole(String …roles):某个资源拥有指定角色中的一个就能访问
- hasAnyAuthority(String … authorities):某个资源拥有指定权限中的一个就能访问
- access(String attribute):该方法使用SPEL表达式,可以创建复杂的限制
- hasIpAddress(String ip):拥有什么样的ip或子网可以访问该资源

授权规则注意

我们通常把细节的规则设置在前面，范围比较大的规则设置放在后面，返例：如有以下配置

```java
.antMatchers("/admin/**").hasAuthority(“admin”)
.antMatchers("/admin/login").permitAll();
```

那么第二个权限规则将不起作用，因为第一个权限规则覆盖了第二个权限规则

因为权限的设置是按照从上到下的优先级。及满足了最开始的权限设置，那么后面的设置就不起作用了。

### 2.2.Web授权实战

我们这一次在入门案例的基础上进行修改，所有的认证数据，授权数据都从数据库进行获取

**1、** 编写controller；

```java
@RestController
public class DeptController {
    @RequestMapping("/dept/list")
    public String list(){
        return "dept.list";
    }
    @RequestMapping("/dept/add")
    public String add(){
        return "dept.add";
    }
    @RequestMapping("/dept/update")
    public String update(){
        return "dept.update";
    }
    @RequestMapping("/dept/delete")
    public String delete(){
        return "dept.delete";
    }
}
---------------------------------------------------------
@RestController
public class EmployeeController {
    @RequestMapping("/employee/list")
    public String list(){
        return "employee.list";
    }
    @RequestMapping("/employee/add")
    public String add(){
        return "employee.add";
    }
    @RequestMapping("/employee/update")
    public String update(){
        return "employee.update";
    }
    @RequestMapping("/employee/delete")
    public String delete(){
        return "employee.delete";
    }
}
```

方法上的requestmapping就对应了权限表t_permission的资源

**2、** 配置HttpSecurity；

```java
 @Override
    protected void configure(HttpSecurity http) throws Exception {
        List<Permission> permissions = permissionMapper.listPermissions();
     ExpressionUrlAuthorizationConfigurer<HttpSecurity>.ExpressionInterceptUrlRegistry
                expressionInterceptUrlRegistry = http.csrf().disable()   //关闭CSRF跨站点请求伪造防护
                .authorizeRequests()          //对请求做授权处理
                .antMatchers("/login").permitAll()  //登录路径放行
                .antMatchers("/login.html").permitAll();//对登录页面跳转路径放行
        //动态添加授权:从数据库动态查询出，哪些资源需要什么样的权限
        for(Permission permission : permissions){
            System.out.println(permission.getResource()+" - "+permission.getSn());
            //如： /employee/list    需要     employee:list 权限才能访问
            expressionInterceptUrlRegistry.antMatchers(permission.getResource()).hasAuthority(permission.getSn());
        }
        expressionInterceptUrlRegistry
                .anyRequest().authenticated() //其他路径都要拦截
                .and().formLogin()  //允许表单登录， 设置登陆页
                .successForwardUrl("/loginSuccess") // 设置登陆成功页
                .loginPage("/login.html")   //登录页面跳转地址
                .loginProcessingUrl("/login")   //登录处理地址
                .and().logout().permitAll();    //登出
    }
```

解释：上面代码从权限表查询出了所有的资源(对应controller中的Requestmapping路径)，然后通过循环调用expressionInterceptUrlRegistry.antMatchers(permission.getResource())

.hasAuthority(permission.getSn()); 进行一一授权,指定哪个资源需要哪个权限才能访问。

**3、** 修改UserDetailService加载用户权限；

```java
public UserDetails loadUserByUsername(String username)  {
    Login loginFromMysql = loginMapper.selectByUsername(username);
    if(loginFromMysql == null){
        throw new UsernameNotFoundException("无效的用户名");
    }
    //前台用户
    List<GrantedAuthority> permissions = new ArrayList<>();
    List<Permission> permissionSnList =
systemManageClient.listByUserId(loginFromMysql.getId());
    permissionSnList.forEach(permission->{
        System.out.println("用户:"+username+" ：加载权限 :"+permission.getSn());
        permissions.add(new SimpleGrantedAuthority(permission.getSn()));
    });
    return new User(username,loginFromMysql.getPassword(),permissions);
}
```

这里在通过UserDetailServer加载用户认证信息的时候就把用户的权限信息一并加载

**4、** 登录测试；

合理分配用户的权限，登录测试对于不同的资源是否应该有对应的访问权限

## 3.方法授权

SpringSecurity提供了一些授权的注解让我们可以在service,controller等的方法上贴注解进行授权，即在方法上指定方法方法需要什么样的权限才能访问

### 3.1.@Secured

标记方法需要有什么样的权限才能访问，这个注解需要在配置类上开启授权注解支持；

- @EnableGlobalMethodSecurity(securedEnabled=true) ，然后在Controller方法上贴该注解如：
- @Secured(“IS_AUTHENTICATED_ANONYMOUSLY”) ：方法可以匿名访问
- @Secured(“ROLE_DEPT”) ,需要拥有部门的角色才能访问,ROLE_前缀是固定的

**1、** 开启Secured授权支持；

```java
@Configuration
@EnableGlobalMethodSecurity(securedEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
```

**2、** 使用@Secured进行方法授权；

```java
@RequestMapping("/employee/list")
@Secured("ROLE_employee:list")
public String list(){
   return "employee.list";
}
```

解释：这里使用了 @Secured(“ROLE_employee:list”) 意思是 “/employee/list” 这个资源需要“ROLE_employee:list”权限才能访问，如果认证的用户有该权限(UserDetailService中加载)包含了“ROLE_employee:list”即可访问该资源，否则不能访问。

注意：对于方法授权，没有贴注解的方法默认是匿名访问。@Secured注解授权是需要加上前缀“ROLE_”

### 3.2.@PreAuthorize

PreAuthorize适合进入方法前的权限验证，拥有和Secured同样的功能，甚至更强大，该注解需要在配置类开启：@EanbleGlobalMethodSecurity(prePostEnabled=true) 方法授权支持，然后在Controller贴注解如下：

- @PreAuthorize(“isAnonymous()”) : 方法匿名访问
- @PreAuthorize(“hasAnyAuthority(‘p_user_list’,‘p_dept_list’)”) :拥有p_user_listr或者p_dept_list的权限能访问
- @PreAuthorize(“hasAuthority(‘p_transfer’) and hasAuthority(‘p_read_accout’)”) : 拥有p_transfer权限和p_read_accout权限才能访问.

该标签不需要有固定的前缀。

**1、** 开启@PreAuthorize授权支持；

```java
@Configuration
@EnableGlobalMethodSecurity(securedEnabled = true,prePostEnabled= true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
```

**2、** 使用@PreAuthorize进行方法授权；

```java
@PreAuthorize("hasAnyAuthority('employee:add','employee:update')")
@RequestMapping("/employee/add")
public String add(){
	return "employee.add";
}
```

指明了方法必须要有 employee:add 或者 employee:update的权限才能访问 ， 该注解不需要有固定的前缀。注意格式“@PreAuthorize(“hasAuthority(‘employee:add’)”)” ，hasAuthority不能省略，括号中是单引号。

### 3.3.@PostAuthorize

该注解使用并不多，适合在方法执行后再进行权限验证，使用该注解需要在配置类开启：@EanbleGlobalMethodSecurity(prePostEnabled=true) 方法授权支持，用法同 @PreAuthorize一样

到这里授权流程就完成了，这里实现了两种方式的授权，WEB授权和方法授权，WEB授权可以实现统一配置，而方法授权则需要很多的在方法上帖注解，各有各的好处，你个可以根据项目情况自行选择。
