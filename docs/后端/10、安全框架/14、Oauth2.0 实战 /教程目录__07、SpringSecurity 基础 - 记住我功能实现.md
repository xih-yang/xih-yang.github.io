# 07、SpringSecurity 基础 - 记住我功能实现
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/7.html
- 分类：安全框架
- 分组：教程目录
## 1.理解记住我

### 1.1.什么是记住我

Remember me(记住我)记住我，当用户发起登录勾选了记住我，在一定的时间内再次访问该网站会默认登录成功，即使浏览器退出重新打开也是如此，这个功能需要借助浏览器的cookie实现，具体流程如下

### 1.2.记住我核心流程

在SpringSecurity中提供RememberMeAuthenticationFilter过滤器来实现记住我功能，其核心流程如下：

**1、** 认证成功UsernamePasswordAuthenticationFilter会调用RememberMeServices创建Token；

(见其父类AbstractAuthenticationProcessingFilter.successfulAuthentication)，同时 RemeberMeService 会调用TokenRepository将Token写入数据库(`persistent_logins`),然后 RemeberMeService通 过Reponse.addCookie把Token写到浏览器的Cookies中
**2、** 当浏览器再次发起请求会进入RemeberMeAuthenticationFilter,该Filter获取到请求中的token交给RemeberMeService；

**3、** RemeberMeService调用TokenRepository去数据库中根据Token查询用户名；

**4、** 调用UserDetilasService.loadUserByUsername根据用户名获取用户认证信息；

**5、** 通过authenticationManager.authenticate，做一次认证，然后把用户信息放入上下文对象中；

## 2.记住我功能实现

### 2.1.修改该登录页

增加记住我的选择框，注意name一定是”remember-me”

```xml
<div class="checkbox">
<label><input type="checkbox" id="rememberme" name="remember-me"/>记住我</label>
</div>
```

### 2.2.配置TokenRepository

PersistentTokenRepository是指明token的持久化方案(即用来存储“记住我”相关信息)。remember me功能是基于token，持久化方案有两种，一种基于内存，使用的是InMemoryTokenRepositoryImpl，一种基于数据库，使用的是JdbcTokenRepositoryImpl。这里我选择基于数据库的方式。

```java
@Autowired
private DataSource dataSource ;
@Bean
public PersistentTokenRepository persistentTokenRepository(){
     JdbcTokenRepositoryImpl obj = new JdbcTokenRepositoryImpl();
     obj.setDataSource(dataSource);
     //obj.setCreateTableOnStartup(false);	
     //启动创建表persistent_logs表，存token，username时会用到
     return obj;
}
```

配置持久化方案，用来存储“记住我”相关信息到数据库

如果：设置了“ obj.createTableOnStartUp(true);”之后会自动创建表persistent_logs,就不用再手动创建表,建议手动创建，因为我发现设置为true之后，每次启动都要重新创建。

### 2.3.配置RememberMe

修改认证服务配置WebSecurityConfig的 HttpSecurity配置，增加rememberMe

```java
@Autowired
private UserDetailsService userDetailsService;
http.rememberMe()
        .tokenRepository(persistentTokenRepository())	//持久
        .tokenValiditySeconds(3600)	//过期时间
        .userDetailsService(userDetailsService); //用来加载用户认证信息的
```

### 2.4.创建persistent_logins 的表

注意，如果设置了 createTableOnStartUp(true); 就不用再执行该SQL

```java
CREATE TABLE persistent_logins (
  username varchar(64) NOT NULL DEFAULT '',
  series varchar(64) NOT NULL,
  token varchar(64) NOT NULL,
  last_used timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (series)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

### 2.5.测试

- 访问登录页面进行登录，勾选记住我
- 登录成功后，退出浏览器
- 重新打开浏览器，直接访问资源-不需要登录就能访问
- 如果你观察浏览器的cookie会发现一个Token，该Token和persistent_logins中存储的Token对应
