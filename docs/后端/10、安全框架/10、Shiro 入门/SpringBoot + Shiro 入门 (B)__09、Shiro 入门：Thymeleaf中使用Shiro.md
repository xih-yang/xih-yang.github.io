# 09、Shiro 入门：Thymeleaf中使用Shiro
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/28.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
根据用户权限显示不同页面：

**1、** thymeleaf扩展shiro；

```xml
<dependencies>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- thymeleaf -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<!--       shiro与spring整合 -->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring</artifactId>
    <version>1.4.2</version>
</dependency>
<!--mybatis-->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.0.9</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>1.1.1</version>
</dependency>
<!-- thymeleaf整合shiro标签 -->
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>
```

```java

```

**2、** ShiroConfig和Realm；

```java
@Configuration
public class ShiroConfig {
//    创建ShiroFilterFactoryBean
    @Bean
public ShiroFilterFactoryBean getShiroFilterFactoryBean(@Qualifier("securityManager") DefaultWebSecurityManager defaultWebSecurityManager){
    ShiroFilterFactoryBean shiroFilterFactoryBean=new ShiroFilterFactoryBean();
    shiroFilterFactoryBean.setSecurityManager(defaultWebSecurityManager);
//    shiro内置过滤器
    /**  常用过滤器：
     *      anon:无需认证即可访问
     *      authc:要授权才可访问
     *      user:如果使用rememberMe的功能可以直接访问
     *      perms:该资源必须得到资源授权才可以访问
     *      roles:该资源必须得到角色授权才可以访问
     */
    Map<String,String> filterMap=new LinkedHashMap<>();
//    filterMap.put("/add","authc");
//    filterMap.put("/update","authc");
//  所有路径都被拦截：filterMap.put("/**","authc");
//一些路径不拦截（需要被放过去）
    filterMap.put("/th","anon");
    filterMap.put("/login","anon");
//    授权过滤器
    filterMap.put("/add","perms[user:add]");
    filterMap.put("/update","perms[user:update]");
//    配置自定义login.html
    shiroFilterFactoryBean.setLoginUrl("/login");
//    配置未授权页面
    shiroFilterFactoryBean.setUnauthorizedUrl("/unAuth");
    shiroFilterFactoryBean.setFilterChainDefinitionMap(filterMap);
    return shiroFilterFactoryBean;
}
//      创建DefaultWebSecurityManager
    @Bean("securityManager")
public DefaultWebSecurityManager getDefaultSecurityManager(@Qualifier("userRealm") UserRealm userRealm){
    DefaultWebSecurityManager securityManager=new DefaultWebSecurityManager();
    securityManager.setRealm(userRealm);
    return securityManager;
}
//    创建realm
    @Bean(name = "userRealm")
    public UserRealm getRealm(){
        return new UserRealm();
    }
//    配置ShiroDialect:用于thymeleaf和shiro标签配合使用
    @Bean
    public ShiroDialect getShiroDialect(){
        return new ShiroDialect();
    }
}
```

```java
public class UserRealm extends AuthorizingRealm {
    @Autowired
    private UserService userService;
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        System.out.println("授权");
//        给资源进行授权
        SimpleAuthorizationInfo info=new SimpleAuthorizationInfo();
//      添加资源的授权字符串
//        info.addStringPermission("user:add");
//        获取当前登陆用户
        Subject subject = SecurityUtils.getSubject();
        User user=(User) subject.getPrincipal();
        User user1=userService.findById(user.getId());
//      添加资源的授权字符串
        String s= user1.getPerms();
        String[] split = s.split(",");
        for (int i = 0; i <split.length; i++) {
            info.addStringPermission(split[i]);
        }
        return info;
    }
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        System.out.println("身份认证");
        UsernamePasswordToken token=(UsernamePasswordToken)authenticationToken;
        User user = userService.findByName(token.getUsername());
        if (user==null){
            return null;
        }
        return new SimpleAuthenticationInfo(user,user.getPassword(),"");
    }
}
```

**3、** 实体类：；

```java
public class User {
    private Integer id;
    private String name;
    private String password;
    private String perms;
。。。。。
```

**4、** 数据库：；

**5、** 测试：用户1，1有添加和update两个权限，2，2只有一个；

```java
  <div shiro:hasPermission="user:add">
        <a th:href="${add}">添加</a>
    </div>
    <div shiro:hasPermission="user:update">
        <a th:href="${update}">update</a>
    </div>
```

**小demo地址：**

**[https://github.com/1017020555/shiro-springboot](https://github.com/1017020555/shiro-springboot)**
