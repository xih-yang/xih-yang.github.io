# 07、Shiro 实战：拦截器
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/22.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

在shiro中配置拦截器可以拦截客户端发送来的请求，并可以控制是对该请求进行认证还是放行。

## 二、shiro拦截器的特点

简写(加粗为常用)
名称
优先级(1为最高)
说明
对应Java类

anon
匿名拦截器
1
不需要登录就能访问,一般用于静态资源,或者移动端接口
org.apache.shiro.web.filter.authc.AnonymousFilter

authc
登录拦截器
2
需要登录认证才能访问的资源
org.apache.shiro.web.filter.authc.FormAuthenticationFilter

authcBasic
Http拦截器
3
Http身份验证拦截器,非常用类型,不太了解
org.apache.shiro.web.filter.authc.BasicHttpAuthenticationFilter

logout
登出拦截器
4
用户登出拦截器,主要属性:redirectURL退出登录后重定向的地址
org.apache.shiro.web.filter.authc.LogoutFilter

noSessionCreation
不创建会话拦截器
5
调用 subject.getSession(false) 不会有什么问题，但是如果 subject.getSession(true) 将抛出 DisabledSessionException 异常
org.apache.shiro.web.filter.authc.NoSessionCreationFilter

prems
权限拦截器
6
验证用户是否拥有资源权限
org.apache.shiro.web.filter.authc.PermissionsAuthorizationFilter

port
端口拦截器
7
其主要属性: port(80) 如果用户访问该页面是非 80，将自动将请求端口改为 80 并重定向到该 80 端口
org.apache.shiro.web.filter.authc.PortFilter

rest
rest风格拦截器
8
rest 风格拦截器，自动根据请求方法构建权限字符串构建权限字符串；非常用类型拦截器
org.apache.shiro.web.filter.authc.HttpMethodPermissionFilter

roles
角色拦截器
9
验证用户是否拥有资源角色
org.apache.shiro.web.filter.authc.RolesAuthorizationFilter

ssl
SSL拦截器
10
只有请求协议是https才能通过,否则你会自动跳转到https端口(443)
org.apache.shiro.web.filter.authc.SslFilter

user
用户拦截器
11
用户拦截器，用户已经身份验证 / 记住我登录的都可；
org.apache.shiro.web.filter.authc.UserFilter

## 三、使用：

**1、** 自定义拦截器；

```java
public class CustomAccessControlerFilter extends AccessControlFilter {
    @Override
    protected boolean isAccessAllowed(ServletRequest servletRequest, ServletResponse servletResponse, Object o) throws Exception {
        return false;
    }
    // 对需要被shiro拦截的请求进行拦截
    @Override
    protected boolean onAccessDenied(ServletRequest servletRequest, ServletResponse servletResponse) throws Exception {
        /* 里面可以写一些校验token的逻辑,返回true表示认证通过，返回false表示认证失败*/
        return true;
    }
}
```

**2、** 将自定义拦截器设置到shiro中；

```java
/**
* shiro过滤器，配置拦截哪些请求
*/
@Bean
public ShiroFilterFactoryBean shiroFilterFactoryBean(SecurityManager securityManager){
    ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
    shiroFilterFactoryBean.setSecurityManager(securityManager);
    LinkedHashMap<String, Filter> filtersMap = new LinkedHashMap<>();
    //用来校验token
    filtersMap.put("token", new CustomAccessControlerFilter());
    shiroFilterFactoryBean.setFilters(filtersMap);
    Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
    // 配置不会被拦截的链接 顺序判断
    filterChainDefinitionMap.put("/api/user/login", "anon");
    filterChainDefinitionMap.put("/upload/image/**","anon");
    filterChainDefinitionMap.put("/index/**","anon");
    filterChainDefinitionMap.put("/login","anon");
    filterChainDefinitionMap.put("/register","anon");
    filterChainDefinitionMap.put("/images/**", "anon");
    filterChainDefinitionMap.put("/js/**", "anon");
    filterChainDefinitionMap.put("/layui/**", "anon");
    filterChainDefinitionMap.put("/css/**", "anon");
    filterChainDefinitionMap.put("/treetable-lay/**", "anon");
    filterChainDefinitionMap.put("/api/user/token", "anon");
    //放开swagger-ui地址
    filterChainDefinitionMap.put("/swagger/**", "anon");
    filterChainDefinitionMap.put("/v2/api-docs", "anon");
    filterChainDefinitionMap.put("/swagger-ui.html", "anon");
    filterChainDefinitionMap.put("/swagger-resources/**", "anon");
    filterChainDefinitionMap.put("/webjars/**", "anon");
    filterChainDefinitionMap.put("/druid/**", "anon");
    filterChainDefinitionMap.put("/favicon.ico", "anon");
    filterChainDefinitionMap.put("/captcha.jpg", "anon");
    filterChainDefinitionMap.put("/","anon");
    filterChainDefinitionMap.put("/csrf","anon");
    filterChainDefinitionMap.put("/**","token,authc");
    shiroFilterFactoryBean.setLoginUrl("/api/user/login");
shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
    return shiroFilterFactoryBean;
}
```
