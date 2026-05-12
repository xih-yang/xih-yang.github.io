# 07、Spring Security 速成 - AuthenticationProvider
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/7.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

在之前的学习中了解了userDeatailsService和passwordEncoder,在本章我们将介绍身份验证流程的其余部分，首先我们要讨论如何实现AuthenticationProvider接口，在身份验证成功之后，将探讨SpringContext接口以及Spring Security管理它的方式。

在企业级应用程序中，你可能会发现自己处于这样一种状况：基于用户名和密码的身份验证的默认实现**并不适用**。另外，当涉及身份验证时，应用程序可能需要实现多个场景。例如，我们可能希望用户能够通过**使用在SMS消息中接收到的或由特定应用程序显示的验证码来证明自己的身份**。或者，也可能需要实现某些身份验证场景，其中用户必须提供存储在文件中的某种密钥。我们甚至可能需要某些使用用户指纹的表示来实现身份验证逻辑。框架的目的是要足够灵活，以便允许我们实现这些所需场景中的任何一个。

框架通常会提供一组最常用的实现，但它必然不能涵盖所有可能的选项。就SpringSecurity而言，可以使用AuthenticationProvider接口来定义任何自定义的身份验证逻辑。

## 二、在身份验证期间表示请求

**身份验证(Authentication)也是处理过程中涉及的其中一个必要接口的名称**。Authentication接口表示**身份验证请求事件**，并且会**保存请求访问应用程序的实体的详细信息**。**可以在身份验证过程期间和之后使用与身份验证请求事件相关的信息。请求访问应用程序的用户被称为主体(principal),如果你有兴趣可以打印下认证后的authentication对象，你会发现Principal里封装的就是我们的UserDetails，这意味着我们可以对此进行强转化，方便后面的职责分离**。如果你曾经使用过java Security API ,就会知道，在Java Security API中，名为Principai的接口表示相同的概念。Spring Security的Authentication接口扩展了这个契约。

Spring Security中的**Authentication契约不仅代表了一个主体**，**还添加了关于身份验证过程是否完成的信息以及权限集合**。实际上，**这个契约是为了扩展Java Security API的Principal契约而设计的**，这在与其他框架和应用程序实现的兼容性方面是一个加分项。Authentication接口代码如下：

```java
public interface Authentication extends Principal, Serializable {
	Collection<? extends GrantedAuthority> getAuthorities();
	Object getCredentials();
	Object getDetails();
	Object getPrincipal();
	boolean isAuthenticated();
	void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException;
}
```

目前需要了解的几个方法如下：

- **isAuthenticated()**:如果身份验证技术，则返回true;如果身份验证过程仍在进行，则返回false.
- **getCredentials()**:返回身份验证过程中使用的密码或任何密钥。
- **getAuthorities()**:返回身份验证请求的授权集合。

## 三、实现自定义身份验证逻辑

Spring Security中的**AuthenticationProvider负责身份验证逻辑**。AuthenticationProvider接口的**默认实现会将查找系统用户的职责委托给UserDetailsService。它还使用PasswordEncoder在身份验证过程中进行密码管理**。其中AuthenticationProvider接口diamagnetic如下：

```java
public interface AuthenticationProvider {
	Authentication authenticate(Authentication authentication)
			throws AuthenticationException;
	boolean supports(Class<?> authentication);
}
```

**AuthenticationProvider的职责是与Authentication接口紧密耦合一起的**。authenticate()方法会**接收一个Authentication对象作为参数并返回一个Authentication对象**，**需要实现authenticate()方法来定义身份验证逻辑**。可以通过以下3个要点总结如何实现authenticate()方法：

- **如果身份验证失败，则该方法应该抛出AuthenticationException异常**。
- **如果该方法接收到的身份验证对象不被AuthenticationProvider实现所支持，那么该方法应该返回null**。
- **该方法应该返回一个Authentication实例，该实例表示一个完全通过了身份验证的对象**。对于这个实例，**isAuthenticated()方法会返回true**,并且它**包含关于已验证实体的所有必要细节**。通常，**应用程序还会从实例中移除密码等敏感数据**。因为保留这些数据可能会将它暴露给不希望看到的人。

该接口的另一个方法是**supports(Class authentication)**。**如果当前的AuthenticationProvider支持作为Authentication对象而提供的类型，则可以实现此方法以返回true**。注意，即使该方法对一个对象返回true,authenticate()方法仍然有可能通过返回null来拒绝请求。Spring Security这样的设计是较为灵活的，使得我们可以实现一个AuthenticationProvider，它可以根据请求的详细信息来拒绝身份验证请求，而不仅仅是根据请求的类型来判断。

## 四、应用自定义身份验证逻辑

- 声明一个实现AuthenticationProvider接口的类
- 确定新的AuthenticationProvider支持哪种类型的Authentication对象：
- 重写supports(Classauthentication)方法以指定所定义的AuthenticationProvider支持哪种类型的身份验证。
- 重写 authenticate(Authentication authentication)方法以实现身份验证逻辑。
- 在Spring Security中注册新的AuthenticationProvider实现的一个 实例。

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {
   //...
    @Override
    public boolean supports(Class<?> authenticationType) {
        return authenticationType.equals(UsernamePasswordAuthenticationToken.class);
    }
}
```

上述代码定义了一个实现AuthenticationProvider接口的新的类。其**中使用了@Component来标记这个类，以便在Spring管理的上下文中使用其他类型的实例**。然后，我们必须决定这个AuthenticationProvider支持哪种类型的Authentication接口实现。这取决于我们希望将哪种类型作为authenticate()方法的参数来提供。

**如果不在身份验证级别做任何定制修改，那么UsernamePasswordAuthenticationToken类就会默认定义其类型**。这个类是Authentication接口的实现，它表示一个使用用户名和密码的标准身份验证请求。

通过这个定义，就可以让AuthenticationProvider支持特定类型的密钥。一旦指定了AuthenticationProvider的作用域，就可以通过重写authenticate()方法来实现身份验证逻辑。

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {
    @Autowired
    private MybatisUserDetailsService userDetailsService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Override
    public Authentication authenticate(Authentication authentication) {
        String username = authentication.getName();
        String password = authentication.getCredentials().toString();
        UserDetails u = userDetailsService.loadUserByUsername(username);
        if (passwordEncoder.matches(password, u.getPassword())) {
            //如果密码匹配，则返回Authentication接口的实现以及必要的详细信息
            return new UsernamePasswordAuthenticationToken(username, password, u.getAuthorities());
        } else {
     	//密码不匹配，抛出异常
            throw new BadCredentialsException("Something went wrong!");
        }
    }
    @Override
    public boolean supports(Class<?> authenticationType) {
        return authenticationType.equals(UsernamePasswordAuthenticationToken.class);
    }
}
```

上述代码的逻辑很简单。可以使用UserDetailsService实现来获得UserDetails。如果用户不存在，则loadUserByUsername()方法应该抛出AuthenticationException异常。在本示例中，身份验证过程停止了，而HTTP过滤器将响应状态设置为HTTP 401 Unauthorized。如果用户名存在，则可以从上下文中使用PasswordEncoder的matches()方法进一步检查用户的密码。如果密码不匹配，同样抛出AuthenticationException异常。如果密码正确，则AuthenticationProvider会返回一个标记为"authenticated"的身份验证实例，其中包含有关请求的详细信息。从代码中我们可以清晰的感受到AuthenticationProvider将验证委托给UserDetailsService和PasswordEncoder，上述代码的流程图如下：

要插入AuthenticationProvider的新实现，需要在项目的配置类中重写WebSecurityConfigurerAdapter类的configure(AuthenticationManagerBuilder auth)方法。如下所示：

```java
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private AuthenticationProvider authenticationProvider;
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.csrf().disable().authorizeRequests()
                .antMatchers("/create").permitAll()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        HashMap<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("noop", NoOpPasswordEncoder.getInstance());
        encoders.put("bcrypt", new BCryptPasswordEncoder());
        encoders.put("scrypt", new SCryptPasswordEncoder());
        return new DelegatingPasswordEncoder("bcrypt",encoders);
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) {
        auth.authenticationProvider(authenticationProvider);
    }
}
```

至此，现在已经成功地自定义了AuthenticationProvider的实现。接下来就可以在需要的地方为应用程序定制身份验证逻辑了。

关于AuthenticationProvider的源码分析，我在这儿推荐一篇博客，写的很有意思：

> https://blog.csdn.net/qq_42682745/article/details/120713818
