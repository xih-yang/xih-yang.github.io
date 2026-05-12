# 03、Spring Security 源码解析 - 访问控制
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/3.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、写在前面

> 上两篇讲解了如何做登录授权和接口认证，本篇是实战篇终篇，主要讲讲如何做权限控制，前两篇博文地址：
>
> 《Spring Security 源码解析 - （上）：登录授权》
>
> 《Spring Security 源码解析 - （中）：接口认证》
>
> 同时附上项目地址：spring-security-demo

## 一、理论知识

### 官方介绍

- Spring Security is a powerful and highly customizable authentication and access-control framework. It is the de-facto standard for securing Spring-based applications.

> Spring Security是一个功能强大且高度可定制的 身份认证 和 访问控制 框架，它是保护基于spring应用程序的事实标准。

### 通俗解释

- 官方介绍中强调了身份认证和访问控制，前两篇实现了身份认证的功能，而本篇就来说说使用Spring Security进行请求的访问控制。
- 简单来说，就是 给用户角色添加角色权限，使得不同的用户角色只能访问特定的接口资源，对于其他接口无法访问。

### 分类

> 根据业务的不同将权限的控制分为两类，一类是 To-C简单角色的权限控制 ，一类是 To-B基于RBAC数据模型的权限控制 。

- **To-C简单角色的权限控制**

> 例如 买家和卖家，这两者都是单独的个体，一般来说都是只有一种独立的角色，比如卖家角色：ROLE_SELLER，买家角色：ROLE_BUYER。这类一般比较粗粒度的将角色划分，且角色比较固定，角色拥有的权限也是比较固定，在项目启动的时候就固定了。

- **To-B基于RBAC数据模型的权限控制**

> 例如 PC后台的管理端，能登录的是企业的人员，企业人员可以有不同的角色，角色的权限也可以比较随意地去改变，比如总经理角色可以访问所有资源，店铺管理人员只能访问店铺和卖家相关信息，会员管理人员可以访问买家相关信息等等，这时候就可以使用基于RBAC数据模型结合Spring Security的访问控制来实现权限方案。这类一般角色划分较细，角色的权限也是上线后在PC端可任意配置。

## 二、To-C：简单角色的权限控制

> 在配置角色前，先定义买家和卖家的一些接口。

- 买家：

```java
@RestController
@RequestMapping("/buyer")
public class BuyerController {
    /**
     * 买家下订单
     *
     * @return
     */
    @GetMapping("/order:create")
    public String receiveOrder() {
        return "买家下单啦！";
    }
    /**
     * 买家订单支付
     *
     * @return
     */
    @GetMapping("/order:pay")
    public String deliverOrder() {
        return "买家付款了！";
    }
}
```

- 卖家：

```java
@RestController
@RequestMapping("/seller")
public class SellerController {
    /**
     * 卖家接单
     *
     * @return
     */
    @GetMapping("/order:receive")
	@Secured("SELLER")
    public String receiveOrder() {
        return "卖家接单啦！";
    }
    /**
     * 卖家订单发货
     *
     * @return
     */
    @GetMapping("/order:deliver")
    @Secured("SELLER")
    public String deliverOrder() {
        return "卖家发货啦！";
    }
}
```

> 我们要做到的是，买家角色只拥有买家接口权限，卖家角色只拥有卖家接口权限。而关于配置角色权限有两种实现方式，一种是在核心配置类中统一配置（买家角色演示），还有一种是在接口上以注解的方式配置（卖家角色演示）。

### 统一配置

- 在核心配置类（WebSecurityConfig）中，统一配置买家角色权限，角色名称是 ROLE_BUYER，拥有访问 /buyer/** 接口的权限。以下代码第九行配置：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            // 配置白名单（比如登录接口）
            .antMatchers(securityConfig.getPermitUrls()).permitAll()
            // 匿名访问的URL，即不用登录也可以访问（比如广告接口）
            .antMatchers(securityConfig.getAnonymousUrls()).permitAll()
            // 买家接口需要 “ROLE_BUYER” 角色权限才能访问
            .antMatchers("/buyer/**").hasRole("BUYER")
            // 其他任何请求满足 rbacService.hasPermission() 方法返回true时，能够访问
            .anyRequest().access("@rbacService.hasPermission(request, authentication)")
            // 其他URL一律拒绝访问
//				.anyRequest().denyAll()
            .and()
            // 禁用跨站点伪造请求
            .csrf().disable()
            // 启用跨域资源共享
            .cors()
            .and()
            // 添加请求头
            .headers().addHeaderWriter(
            new StaticHeadersWriter(Collections.singletonList(
                    new Header("Access-control-Allow-Origin", "*"))))
            .and()
            // 自定义的登录过滤器，不同的登录方式创建不同的登录过滤器，一样的配置方式
            .apply(new UserLoginConfigurer<>(securityConfig))
            .and()
            // 自定义的JWT令牌认证过滤器
            .apply(new JwtLoginConfigurer<>(securityConfig))
            .and()
            // 登出过滤器
            .logout()
            // 登出成功处理器
            .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
            .and()
            // 禁用Session会话机制（我们这个demo用的是JWT令牌的方式）
            .sessionManagement().disable()
            // 禁用SecurityContext，这个配置器实际上认证信息会保存在Session中，但我们并不用Session机制，所以也禁用
            .securityContext().disable();
}
```

### 注解方式

- 可以使用注解的方式配置接口所能访问的角色，比如卖家端两个接口配置了 ROLE_SELLER 角色才能访问

```java
@RestController
@RequestMapping("/seller")
public class SellerController {
    /**
     * 卖家接单
     *
     * @return
     */
    @GetMapping("/order:receive")
	@Secured("SELLER")
    public String receiveOrder() {
        return "卖家接单啦！";
    }
    /**
     * 卖家订单发货
     *
     * @return
     */
    @GetMapping("/order:deliver")
    @Secured("SELLER")
    public String deliverOrder() {
        return "卖家发货啦！";
    }
}
```

- @Secured、@RolesAllowed、@PreAuthorize 注解都可以达到这样的效果，所有注解能发挥有效的前提是需要在核心配置类加上注解 @EnableGlobalMethodSecurity，然后在此注解上启用对应的注解配置方式，注解才能生效，否则无法起作用，比如要使 @Secured 注解生效需要配置 @EnableGlobalMethodSecurity(securedEnabled = true)
- 注解能否生效和启用注解的属性对应关系如下，简单解释就是要使接口上的注解生效，就需要在核心过滤器配置注解 @EnableGlobalMethodSecurity，然后启用注解对应的属性，就是将属性值设为true。具体请参考：[@EnableGlobalMethodSecurity的三种开启注解方式](https://blog.csdn.net/l18767118724/article/details/72934564)

生效注解
启用注解的属性
核心配置器上注解配置

@Secured
securedEnabled
@EnableGlobalMethodSecurity(securedEnabled = true)

@RolesAllowed
jsr250Enabled
@EnableGlobalMethodSecurity(jsr250Enabled = true)

@PreAuthorize
prePostEnabled
@EnableGlobalMethodSecurity(prePostEnabled = true)

### 认证Token添加角色

> 上面的步骤只是配置了：
>
>
> ROLE_BUYER角色拥有访问 /buyer/** 接口的权限
> ROLE_SELLER角色拥有访问/order:receive、/seller/order:deliver接口的权限
>
> 而在接口认证的时候也需要将角色放到认证令牌中，来看看：

- 在接口认证的 JwtAuthenticationProvider 中查询出用户角色，然后放进将要返回的 JwtAuthenticationToken 令牌中，其实是放到它父类的 authorities 属性中
- 角色名称并非私密信息，可以直接 在登录授权的时候放进JWT中，为了提高性能这里就不需要每次都根据用户重新查询一遍角色。
- JWT中新增 roleName 字段，注意生成JWT和校验JWT要补充该字段，在登录的 UserAuthenticationProvider 中将用户角色放进JWT中：
- 接口认证时直接从JWT中获取角色，放进认证Token中，过滤器链的最后一个过滤器 FilterSecurityInterceptor 会进行权限判断，关于它是如何进行权限判断的，后面有源码篇讲解，文末放出了相关链接。

### 效果演示

> 现在登录用户是买家角色，拥有 ROLE_BUYER 角色权限，所以他只能访问买家的接口，无法访问卖家接口，注意：要重新登录，请求接口时将登录授权后返回的JWT令牌带上。

- 访问买家接口，都能正常访问
- 访问卖家接口，报拒绝访问

## 三、To-B：基于RBAC数据模型的权限控制

### RBAC数据模型

- 全称：Role-Based Access Control（基于角色的访问控制）
- 一般会有五个表组成，三张主体表（用户、角色、权限），两张关联表（用户-角色、角色-权限）。

### 实战

> 首先关于RBAC的数据模型大家应该都很熟悉，这里不再创建，即不会涉及到存储。其实这一类相对上面那类区别在于这类的权限不是固定的，需要实时的重新查询出来，再进行判断请求是否有权访问，所以判断是否有权访问的逻辑需要自己完善，写好之后再配置进框架中即可。

- 先贴一下测试接口

```java
@RestController
@RequestMapping("/business")
public class BusinessController {
    /**
     * 店铺列表
     *
     * @return
     */
    @GetMapping("/stores")
    public String stores() {
        return "这是店铺列表！";
    }
    /**
     * 卖家列表
     *
     * @return
     */
    @GetMapping("/sellers")
    public String sellers() {
        return "这是卖家列表！";
    }
    /**
     * 买家列表
     *
     * @return
     */
    @GetMapping("/buyers")
    public String deliverOrder() {
        return "这是买家列表！";
    }
}
```

- 权限判断逻辑，主要实现一个 hasPermission 方法，这里配置了 ROLE_ADMIN 角色可以访问任意接口，其它角色需要重新查询出它所能访问的接口，这里假如查询出能访问的接口为 /business/stores、/business/sellers。

```java
public interface RbacService {
	/**
	 * 是否有权限访问
	 *
	 * @param request
	 * @param authentication
	 * @return
	 */
	boolean hasPermission(HttpServletRequest request, Authentication authentication);
}
@Component("rbacService")
public class RbacServiceImpl implements RbacService {
	private AntPathMatcher antPathMatcher = new AntPathMatcher();
	@Override
	public boolean hasPermission(HttpServletRequest request, Authentication authentication) {
		Object principal = authentication.getPrincipal();
		boolean hasPermission = false;
		if (principal instanceof JwtUserLoginDTO) {
			// 如果角色是“ROLE_ADMIN”，就永远返回true
			if (StringUtils.equals(((JwtUserLoginDTO) principal).getRoleName(), "ROLE_ADMIN")) {
				hasPermission = true;
			} else {
				// 查询用户角色所拥有权限的所有URL，这里假设是从数据库或缓存（或者登录的时候可以直接将该角色拥有的权限保存到JWT）中查的
				List<String> urls = Arrays.asList("/business/stores", "/business/sellers");
				for (String url : urls) {
					if (antPathMatcher.match(url, request.getRequestURI())) {
						hasPermission = true;
						break;
					}
				}
			}
		}
		return hasPermission;
	}
}
```

- 将权限判断逻辑配置进框架，只要在核心配置器中添加一行，如下11行

```java
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.authorizeRequests()
				// 配置白名单（比如登录接口）
				.antMatchers(securityConfig.getPermitUrls()).permitAll()
				// 匿名访问的URL，即不用登录也可以访问（比如广告接口）
				.antMatchers(securityConfig.getAnonymousUrls()).permitAll()
				// 买家接口需要 “ROLE_BUYER” 角色权限才能访问
				.antMatchers("/buyer/**").hasRole("BUYER")
				// 其他任何请求满足 rbacService.hasPermission() 方法返回true时，能够访问
				.anyRequest().access("@rbacService.hasPermission(request, authentication)")
				// 其他URL一律拒绝访问
//				.anyRequest().denyAll()
				.and()
				// 禁用跨站点伪造请求
				.csrf().disable()
				// 启用跨域资源共享
				.cors()
				.and()
				// 添加请求头
				.headers().addHeaderWriter(
				new StaticHeadersWriter(Collections.singletonList(
						new Header("Access-control-Allow-Origin", "*"))))
				.and()
				// 自定义的登录过滤器，不同的登录方式创建不同的登录过滤器，一样的配置方式
				.apply(new UserLoginConfigurer<>(securityConfig))
				.and()
				// 自定义的JWT令牌认证过滤器
				.apply(new JwtLoginConfigurer<>(securityConfig))
				.and()
				// 登出过滤器
				.logout()
				// 登出成功处理器
				.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
				.and()
				// 禁用Session会话机制（我们这个demo用的是JWT令牌的方式）
				.sessionManagement().disable()
				// 禁用SecurityContext，这个配置器实际上认证信息会保存在Session中，但我们并不用Session机制，所以也禁用
				.securityContext().disable();
	}
```

### 效果演示

- 现在登录的是其他角色（非ROLE_ADMIN）的用户，即能访问店铺列表和卖家列表，不能访问买家列表，访问买家店铺列表：
- 访问卖家列表：

## 四、权限表达式

- 上面.permitAll()、.hasRole()、.access()表示权限表达式，而权限表达式实际上都是 Spring中强大的Spel表达式，如下还有很多可以使用的权限表达式以及和Spel表达式的转换关系：

权限表达式（ExpressionUrlAuthorizationConfigurer）
说明
Spel表达式
Spel表达式实际执行方法（SecurityExpressionOperations）

permitAll()
表示允许所有，永远返回true
permitAll
permitAll()

denyAll()
表示拒绝所有，永远返回false
denyAll
denyAll()

anonymous()
当前用户是anonymous时返回true
anonymous
isAnonymous()

rememberMe()
当前用户是rememberMe用户时返回true
rememberMe
isRememberMe()

authenticated()
当前用户不是anonymous时返回true
authenticated
isAuthenticated()

fullyAuthenticated()
当前用户既不是anonymous也不是rememberMe用户时返回true
fullyAuthenticated
isFullyAuthenticated()

hasRole(“BUYER”)
用户拥有指定权限时返回true
hasRole(‘ROLE_BUYER’)
hasRole(String role)

hasAnyRole(“BUYER”，“SELLER”)
用于拥有任意一个角色权限时返回true
hasAnyRole (‘ROLE_BUYER’，‘ROLE_BUYER’)
hasAnyRole(String… roles)

hasAuthority(“BUYER”)
同hasRole
hasAuthority(‘ROLE_BUYER’)
hasAuthority(String role)

hasAnyAuthority(“BUYER”，“SELLER”)
同hasAnyRole
hasAnyAuthority (‘ROLE_BUYER’，‘ROLE_BUYER’)
hasAnyAuthority(String… authorities)

hasIpAddress(‘192.168.1.0/24’)
请求发送的Ip匹配时返回true
hasIpAddress(‘192.168.1.0/24’)
hasIpAddress(String ipAddress)，该方法在WebSecurityExpressionRoot类中

access("@rbacService.hasPermission(request, authentication)")
可以自定义Spel表达式
@rbacService.hasPermission (request, authentication)
hasPermission(request, authentication) ，该方法在自定义的RbacServiceImpl类中

## 五、总结

- Spring Security框架不仅提供了身份认证的功能，也提供了强大的访问控制支持。
- 访问控制判断权限利用了Spring中强大的Spel表达式，具体请自行搜索相关文章。
