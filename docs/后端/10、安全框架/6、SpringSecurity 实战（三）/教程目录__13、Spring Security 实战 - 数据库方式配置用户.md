# 13、Spring Security 实战 - 数据库方式配置用户
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/13.html
- 分类：安全框架
- 分组：教程目录
## 前言

前面权限配置介绍了两种方式，一种是基于注解的权限配置，一种是基于配置文件的权限配置。虽然两种方式都可以实现权限拦截，但是基于注解的方式每个方法上都要添加注解，太过于分散，不好管理；而基于配置文件的方式，虽然可以将所有的配置在配置文件中配置，但是每次添加接口都要在相应的配置类中添加配置，而且没法跟数据库关联起来。接下来，进行优化。

## 实现

创建授权**AccessInterception**类，实现**FilterInvocationSecurityMetadataSource**接口；主要作用是将当前请求需要的权限返回。

```java
@Component
public class AccessInterception implements FilterInvocationSecurityMetadataSource {
    @Autowired
    SysMenuService sysMenuService;
    @Override
    public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
        String requestUrl = ((FilterInvocation) object).getRequestUrl();
        List<SysMenu> sysMenus = sysMenuService.list();
        for (SysMenu sysMenu : sysMenus) {
            if (new AntPathMatcher().match(sysMenu.getUrl(), requestUrl)) {
                return SecurityConfig.createList(sysMenu.getUrl());
            }
        }
        return SecurityConfig.createList("/login");
    }
    @Override
    public Collection<ConfigAttribute> getAllConfigAttributes() {
        return null;
    }
    @Override
    public boolean supports(Class<?> clazz) {
        return true;
    }
}
```

创建**AccessDecision**类实现**AccessDecisionManager**，决策管理的主要作用是进行对当前请求是否通过进行决策。

```java
@Component
public class AccessDecision implements AccessDecisionManager {
    @Override
    public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes)
            throws AccessDeniedException, InsufficientAuthenticationException {
        for (ConfigAttribute configAttribute : configAttributes) {
            String attribute = configAttribute.getAttribute();
            if ("/login".equals(attribute)) {
                if (authentication instanceof AnonymousAuthenticationToken) {
                    throw new InsufficientAuthenticationException(ResultCode.NOT_SIGN_IN.getMessage());
                } else {
                    return;
                }
            }
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            for (GrantedAuthority authority : authorities) {
                if (authority.getAuthority().equals(attribute)) {
                    return;
                }
            }
        }
        throw new AccessDeniedException(ResultCode.NO_PERMISSION.getMessage());
    }
    @Override
    public boolean supports(ConfigAttribute attribute) {
        return true;
    }
    @Override
    public boolean supports(Class<?> clazz) {
        return true;
    }
}
```

在**SpringSecurityConfig** 中添加以下bean，并将上面两个bean设置到**FilterSecurityInterceptor**中。

```java
@Bean
FilterSecurityInterceptor filterSecurityInterceptor() {
    FilterSecurityInterceptor filterSecurityInterceptor = new FilterSecurityInterceptor();
    filterSecurityInterceptor.setAccessDecisionManager(accessDecision);
    filterSecurityInterceptor.setSecurityMetadataSource(accessInterception);
    return filterSecurityInterceptor;
}
```

然后将我们的**FilterSecurityInterceptor**放到原有**FilterSecurityInterceptor**中。

```java
 http.addFilterAt(filterSecurityInterceptor(), FilterSecurityInterceptor.class);
```

将之前写死的路径匹配注释起来

```java
//        http.authorizeRequests()
//                .antMatchers("/sys/user/list").hasAuthority("/sys/user/list")
//                .antMatchers("/sys/user/query").hasAuthority("/sys/user/query")
//                .anyRequest().authenticated();
```

## 验证

启动项目进行验证，user用户只有list权限，admin拥有list和query权限
