# 04、Spring Security 速成 - 重写默认配置
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/4.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

通过之前的学习，我们已经知道了第一个项目的默认配置，接下来我们就来尝试替换它们。在本节中，我们将介绍**如何配置UserDetailsService和PasswordEncoder**.这两个组件参与身份验证的处理，大多数应用程序都会根据其 需求对它们进行自定义，但是关于这两个组件的细节我们仍然是放到后面细讲，目前我们只需了解如何插入自定义实现。

## 二、重写UserDetailsService组件

前文里我们就提到过，UserDetailsService我们可以选择创建自己的实现，或者使用Spring Security提供的预定义实现。但是本节并不打算详细介绍前两者，而是使用Spring Security提供的一个名为InMemoryUserDetailsManager的实现。通过这个示例，我们将了解如何将这类对象插入架构中。

紧接着之前第一个Spring Security的程序示例，我们对其进行修改，让其改成拥有自己管理的凭据并将其用于身份验证。所以在此我们并不会实现UserDeatilsService,但需要使用Spring Security提供的实现类。

InMemoryUserDetailsManager虽说这个实现稍稍超出了UserDetailsService本身，但目前我们只从UserDetailsService角度看待它，这个实现会将凭据存储在内存中，然后同之前，Spring Security可以使用这些凭据对请求进行身份验证。但是InMemoryUserDetailsManager并不适用于生产环境下使用，只适用于示例或概念证明。

如下，我们建一个config包，在包下面创建ProjectConfig类，并使用@Bean将我们自己配置的UserDetailsService添加到Spring的上下文中。

```java
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager();
        return userDetailsService;
    }
}
```

此时启动程序，可以发现之前放在控制台的密码此时已经没有了，这意味着Spring boot对我们关于UserDetailsService的预配置项已失效，所以我们可以发现我们此时并不能访问Controller,原因有如下两点：

- 目前我们还没有任何用户
- 还没有PasswordEncoder

在上文中，我们知道身份验证不仅依赖UserDetailsService，还同时依赖PasswordEmcoder

让我们逐步来解决这个问题。我们需要

**1、** 至少创建一个具有一组凭据（用户名和密码）的用户；

**2、** 添加要由UserDetailsService实现管理的用户；

**3、** 定义一个PasswordEncoder类型的bean,应用程序可以使用它验证为UserDetailsService存储和管理的用户所指定的密码；

首先，我们使用一个预定义的构建器创建UserDetails类型的对象。在构建实例时，必须提供用户名、密码和至少一个权限。权限是该用户被允许执行的操作，为此可以使用任意字符串。然后通过InMemoryUserDetailsManager添加这组凭据，代码如下：

```java
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager();
        //User类用于创建代表用户的对象的构造器实现，该类由SpringSecurity提供，并非我们自己创建
        UserDetails user = User.withUsername("mbw")
                .password("123456")
                .authorities("read")
                .build();
        userDetailsService.createUser(user);
        return userDetailsService;
    }
}
```

如上代码，我们必须为用户名、密码、并且至少为权限提供一个值。但这仍然不足以让我们调用接口，我们还需要声明一个PasswordEncoder.

在使用之前默认的UserDetailsService时，PasswordEncoder也会自动配置，因为我们重写了UserDetailsService，所以还必须声明一个PasswordEncoder.如果没配置就去调用接口，我们将在控制台看到一个异常，而客户端将返回401和一个空的响应体。

所以我们可以在配置类添加一个PasswordEncoder bean去解决这个问题，完整代码如下：

```java
package com.mbw.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager();
        UserDetails user = User.withUsername("mbw")
                .password("123456")
                .authorities("read")
                .build();
        userDetailsService.createUser(user);
        return userDetailsService;
    }
    @Bean
    public PasswordEncoder passwordEncoder(){
        return NoOpPasswordEncoder.getInstance();
    }
}
```

关于PasswordEncoder的实现，我们后面会详细介绍，这个使用的NoOpPasswordEncoder实例会将密码视为普通文本。它不会对密码进行加密或者哈希操作。为了进行匹配，它只会使用String类的底层equals（Object o)方法来比较字符串，因此我们同样在生产环境不适合使用这类PasswordEncoder.

现在，我们使用名为mbw,密码为123456的用户凭据访问接口：

## 三、重写端点授权配置

有了新的用户管理，现在就可以讨论端点的身份验证方法和配置。我们现在指定，在使用默认配置时，所有端点都会假定有一个由应用程序管理的有效用户。此外，在默认情况下，应用程序会使用HTTP Basic身份验证作为授权方法，但我们可以轻松的重写该配置。

其实之前我们也提到过，，HTTP Basic身份验证并不适用于大多数应用程序架构，有时我们希望修改它以适配我们的应用程序。同样，也并非应用程序的所有端点都需要被保护，对于那些需要保护的端点，可能需要选择不同的授权规则。**要进行这样的更改，首先需要扩展WebSecurityConfigurerAdapter类。扩展这个类使得我们可以重写configure(HttpSecurity http)方法**。如下代码将继续使用之前的配置类ProjectConfig,我们在其基础上使其继承WebSecurityConfigurerAdapter类，然后我们就可以使用HttpSecurity对象的不同方法去更改配置：

```java
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
}
```

如以上代码的配置其实与之前的默认的授权行为是相同的，大家可以再次调用端点，查看它的行为是否和一开始一样（**这里我们没有重写UserDetailsService和PasswordEncoder，所以凭据是默认的user,启动程序也可在控制台再次看到之前的password**）,但是我们只需稍作修改，就可以使所有端点都可以被访问，而不需要凭据，代码如下：

```java
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().permitAll(); //所有请求都不需要身份验证
    }
}
```

现在，调用/hello端点不在需要凭据，配置中的permitAll()调用以及anyRequest()方法会使所有端点都可以访问并且无需凭据。我们可以重启程序，并且在postman中Authorization设置为no Auth,调用/hello接口看是否还需要认证：

然后我们在该配置类尝试配置UserDetailsService和PasswordEncoder,**在之前的配置方案，我们通过在Spring上下文中添加新的实现作为bean来重写UserDetailsService和PasswordEncoder**.现在来看另一种为它们配置的方法，**我们可以通过configure(AuthenticationManagerBuilder auth)方法设置它们**，仍然需要从WebSecurityConfigurerAdapter类重写此方法，并使用类型为AuthenticationManagerBuilder的参数来设置它们，代码如下：

```java
package com.mbw.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        //声明UserDetailsService,以便将用户存储在内存中
        InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager();
        //定义具有所有详情的用户
        UserDetails user = User.withUsername("mbw")
                .password("12345")
                .authorities("read")
                .build();
        //添加该用户以便让UserDetailsService对其进行管理
        userDetailsService.createUser(user);
        auth.userDetailsService(userDetailsService)
                .passwordEncoder(NoOpPasswordEncoder.getInstance());
    }
}
```

可以看到和之前配置UserDetailsService和PasswordEncoder其实差不多，只不过我们在这儿是通过重写方法完成的。我们还从AuthenticationManagerBuilder处调用了userDetailsService(）方法来注册userDetailsService实例，此外，还调用了passwordEncoder0方法来注册PasswordEncoder。在SpringSecurity中，我们推荐以上面代码的这种方式进行配置，**而不是像之前那样将UserDetailsService和PasswordEncoder这两个bean配置到Spring上下文然后在配置请求是否需要认证的配置方法(全写在一个配置类），这种配置方式也被称为混合配置，我们并不推荐，因为这样会使我们的代码不干净且不易于理解**。但是我们可以使用职责分离方式将它们分在两个配置类中，这种配置方式同样也推荐：

```java
package com.mbw.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class UserManagementConfig{
    @Bean
    public UserDetailsService userDetailsService(){
        InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager();
        UserDetails user = User.withUsername("mbw")
                .password("123456")
                .authorities("read")
                .build();
        userDetailsService.createUser(user);
        return userDetailsService;
    }
    @Bean
    public PasswordEncoder passwordEncoder(){
        return NoOpPasswordEncoder.getInstance();
    }
}
```

```java
package com.mbw.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
}
```

我们通过定义两个配置类实现职责分离，增加代码的可读性，一个用于用户和密码的管理，一个用于接口授权管理。但是在这种情况下，**不能让两个类都扩展WebSecurityConfigurerAdapter,如果这样做，依赖注入将失败，可以通过使用@Order注解设置注入的优先级来解决依赖注入的问题。但是，从功能上讲，这是行不通的，因为配置会相互排除而不是合并**。

## 四、重写AuthenticationProvider实现

通过上面的学习，我们已经了解了UserDetailsService和PasswordEncoder在Spring Security架构中的用途以及配置它们的方法，下面我们将介绍委托给上面这两个组件的组件进行自定义，即AuthenticationProvider。还是之前那张图：

红框所示展示了AuthenticationProvider，它实现了身份验证逻辑并且委托给UserDetailsService和PasswordEncoder以便进行用户和密码管理。那么下面我们将进一步深入探讨身份验证和授权架构，以便了解如何使用AuthenticationProvider实现自定义身份验证逻辑。

在学习如何重写AuthenticationProvider之前，我们仍然建议你遵循Spring Security架构中设计的职能，就是上面那种图，此架构与细粒度的职能是松耦合的。这种设计是使Spring Security变得灵活且易于集成到应用程序中的原因之一。不过，我们可以更改其设计，但是必须谨慎使用它们，因为有可能会使解决方案复杂化。例如，我们可以选择不再需要UserDetailsService或PasswordEncoder的方式重写默认的AuthenticationProvider，代码如下：

```java
package com.mbw.provider;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        return null;
    }
    @Override
    public boolean supports(Class<?> aClass) {
        return false;
    }
}
```

**authenticate(Authentication authentication)方法表示所有用于身份验证的逻辑**，因此我们将像下面代码那样添加一个实现，对于supports(),就目前而言，建议你将其实现视为理所当然，对于当前示例，它不是必需的，实现代码如下：

```java
package com.mbw.provider;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import java.util.Arrays;
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        //getName()方法被Authentication从Principal接口处继承
        String username = authentication.getName();
        String password = String.valueOf(authentication.getCredentials());
        //这个条件通常会调用UserDetailsService和PasswordEncoder用来调试用户名和密码
        if("mbw".equals(username) && "12345".equals(password)){
            return new UsernamePasswordAuthenticationToken(username,password, Arrays.asList());
        }else {
            throw new AuthenticationCredentialsNotFoundException("Error in authentication!");
        }
    }
    @Override
    public boolean supports(Class<?> authenticationType) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authenticationType);
    }
}
```

如你所见，在此处if-else子句的条件替换了UserDetailsService和PasswordEncoder的职能。这里不需要使用这两个bean,但如果使用用户和密码进行身份验证，则强烈建议将它们的管理逻辑分开，即使在重写身份验证实现时，也要像Spring Security架构所设计的那样应用它。

你可能会发现，通过实现我们自己的AuthenticationProvider来替换身份验证逻辑是很有用的，如果默认实现不能完全满足应用程序的需求，则可以选择实现自定义身份验证逻辑。

然后我们可以在ProjectConfig配置类中注册我们刚刚配置的AuthenticationProvider：

```java
package com.mbw.config;
import com.mbw.provider.CustomAuthenticationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private CustomAuthenticationProvider authenticationProvider;
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.authorizeRequests()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(authenticationProvider);
    }
}
```

现在可以调用该端点，只有由认证逻辑定义的被识别用户—mbw,并且使用密码12345才能访问该端点：
