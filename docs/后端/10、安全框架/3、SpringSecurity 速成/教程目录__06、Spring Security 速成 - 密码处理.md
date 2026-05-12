# 06、Spring Security 速成 - 密码处理
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/6.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

通过之前的学习我们已经了解了通过UserDetails接口以及使用其实现的多种方式，.但如前面文章所述，不同参与者会在身份验证和授权过程中对用户的表示进行管理，其中还介绍了一些参与者是具有默认配置的，例如UserDetailsService和PasswordEncoder。现在我们知道可以对默认配置进行重写，之前已经对UserDetailsService的相关配置进行重写，接下来我们将继续分析PasswordEncoder。

## 二、PasswordEncoder的定义

一般而言，系统并不以明文形式管理密码，印此密码通常要经过某种转换，这使得读取和窃取密码变得较为困难。对于这一职责，Spring Security定义了一个单独的契约—PasswordEncoder。实现这个契约是为了告知Spring Security如何验证用户的密码。在身份验证过程中，**PasswordEncoder会判定密码是否有效。每个系统都会存储以某种方式编码过的密码**。最好把密码哈希话存储起来，这样别人就不会读到明文密码了。

PasswordEncoder还可以对密码进行编码，接口声明的encode()和matches()方法实际上是其职责的定义。这两个方法都是同一契约的一部分，因为它们彼此紧密相连。**应用程序对密码进行编码的方式与验证密码的方式相关，它们应该由同一个PasswordEncoder统一进行管理**。

```java
public interface PasswordEncoder {
	String encode(CharSequence rawPassword);
	boolean matches(CharSequence rawPassword, String encodedPassword);
	default boolean upgradeEncoding(String encodedPassword) {
		return false;
	}
}
```

该接口定义了两个抽象方法，其中一个具有默认实现。在处理PasswordEncoder实现时，最常见的是抽象的encode()和matches()方法。

encode(CharSequence rawPassword)方法的目的是返回所提供字符串的转换。就Spring Security功能而言，它用于为指定密码提供加密或哈希化。之后可以使用matches(CharSequence rawPassword, String encodedPassword)方法检查已编码的字符串是否与原密码匹配。可以在身份验证过程中使用matches()方法根据一组已知凭据来检验所提供的密码。第三个方法被称为upgradeEncoding(String encodedPassword) ,在接口中默认设置为false。如**果重写它以返回true，那么为了获得更好的安全性，将重新对已编码的密码进行编码**。

某些情况下，对已编码的密码进行编码会使从结果中获得明文密码变的更难，我个人不推荐这种晦涩的编码方式。

## 三、实现passwordEncoder契约

可以看到，**matches()和encode()这两个方法具有很强的关联性。如果重写他们，应该确保它们始终在功能方面有所对应：由encode()方法返回的字符串应该始终可以使用同一个PasswordEncoder的matches()进行验证**。了解如何实现PasswordEncoder之后，就可以选择应用程序为身份验证过程管理器的方式了。最直截了当的实现是一个以普通文本形式处理密码的密码编码器。也就是说，它不对密码进行任何编码。

用明文管理密码正式NoOpPasswordEncoder的实例所做的工作。之前我们使用过，如果要自己写一个，它将类似于下面的代码：

```java
package com.mbw.password_encoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
@Component
public class PlainTextPasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(CharSequence rawPassword) {
        //并没有变更密码，而是原样返回
        return rawPassword.toString();
    }
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        //检查两个字符是否相等
        return rawPassword.equals(encodedPassword);
    }
}
```

这样的话编码的结果总是与原密码相同。因此，要检查他们是否匹配，只需要使用equals()对两个字符串进行比较即可。下面的代码则是PasswordEncoder的一个使用SHA-512的哈希算法的简单实现：

```java
package com.mbw.password_encoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
@Component
public class Sha512PasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(CharSequence rawPassword) {
        return hashWithSHA512(rawPassword.toString());
    }
    private String hashWithSHA512(String input) {
        StringBuilder result = new StringBuilder();
        try{
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] digested = md.digest(input.getBytes());
            for (byte b : digested) {
                result.append(Integer.toHexString(0xFF & b));
            }
        }catch (NoSuchAlgorithmException e){
            throw new RuntimeException("Bad algorithm");
        }
        return result.toString();
    }
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        String hashPassword = encode(rawPassword);
        return encodedPassword.equals(hashPassword);
    }
}
```

## 四、从PasswordEncoder提供的实现中选择

- NoOpPasswordEncoder：不编码密码，而保持明文。我们仅将此实现用于示例。因为它不会对密码进行哈希化，所以**永远不要在真实场景中使用它**。
- StandardPasswordEncoder：使用SHA-256对密码进行哈希化。这个实现现在已经不推荐了，不应该在新的实现中使用它。不建议使用它的原因是，它使用了一种目前看来不够强大的哈希算法，但我们可能仍然会在现有的应用程序中发现这种实现。
- Pbkdf2PasswordEncoder：使用基于密码的密钥派生函数2（PBKDF2)
- BCryptPasswordEncoder：使用bcrypt强哈希函数对密码进行编码
- SCryptPasswordEncoder：使用scrypt强哈希函数对密码进行编码

让我们通过一些示例了解如何创建这些类型的PasswordEncoder实现的实例。**NoOpPasswordEncoder被设计成了一个单例**。不能直接从类外部调用它的构造函数，**但是可以使用NoOpPasswordEncoder.getInstance()方法获得类的实例**，例如我们在配置类如果想配置该PasswordEncoder,可以使用如下写法：

```java
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
```

在这儿在演示一种更为优秀的选项：BCryptPasswordEncoder,它使用bcrypt强哈希函数对密码进行编码。可以通过调用无参构造函数来实例化它。不过也可以选择指定一个强度系数来表示编码过程中使用的对数轮数（log rounds,即 logarithmic rounds)。此外，还可以更改用于编码的SecureRandom实例。

```java
  PasswordEncoder bCryptPasswordEncoder1 = new BCryptPasswordEncoder();
  PasswordEncoder bCryptPasswordEncoder2 = new BCryptPasswordEncoder(4);
  SecureRandom s = SecureRandom.getInstanceStrong();
  BCryptPasswordEncoder bCryptPasswordEncoder3 = new BCryptPasswordEncoder(4, s);
```

我们提供的对数轮数的值会影响哈希操作使用的迭代次数。这里使用的迭代次数为2^log rounds。对于迭代次数计算，对数轮数的值只能是4~31.

在某些应用程序中，我们可能会发现使用各种密码编码器都很有用，并且会根据特定的配置进行选择。从实际情况看，在生产环境应用程序中使用DelegatingPasswordEncoder的常见场景是当编码算法从应用程序的特定版本开始更改的时候。假设有人在当前使用的算法中发现了一个漏洞，而我们想为新注册的用户更改该算法，但又不想更改现有凭据的算法。所以最终会有多种哈希算法。我们要如何应对这种情况？虽然并非应对此场景的唯一方法，但一个好的选择是使用DelegatingPasswordEncoder对象。

**DelegatingPasswordEncoder是PasswordEncoder接口的一个实现，这个实现不是实现它自己的编码算法，而是委托给同一契约的另一个实现。其哈希值以一个前缀作为开头，该前缀表明了用于定义该哈希值的算法**。DelegatingPasswordEncoder会根据密码的前缀委托给PasswordEncoder的正确实现。

这听起来好像很复杂，不过后面我将通过代码以及接口演示就可以看出它其实非常简单。下图展示了PasswordEncoder实例之间的关系：

在上图中，DelegatingPasswordEncoder会为前缀{noop}注册一个NoOpPasswordEncoder，为前缀{bcrypt}注册一个BCryptPasswordEncoder,并且为前缀{scrypt}注册一个SCryptPasswordEncoder,如果密码具有前缀{noop},则DelegatingPasswordEncoder会将该操作转发给NoOpPasswordEncoder实现。

那么使用其他的PasswordEncoder实现均同理。

**DelegatingPasswordEncoder具有一个它可以委托的PasswordEncoder实现的列表。DelegatingPasswordEncoder会将每一个实例存储在一个映射中**。NoOpPasswordEncoder被分配的键是noop,而BCryptPasswordEncoder实现被分配的键是bcrypt.**然后根据前缀将实现委托给对应的passwordEncoder实现**。

接下来我们就通过代码演示如何定义DelegatingPasswordEncoder.首先创建所需的PasswordEncoder实现的实例集合，然后将这些实例放在一个DelegatingPasswordEncoder中，如下代码：

ProjectConfig注册DelegatingPasswordEncoder,并将默认值委托给BCryptPasswordEncoder

```java
package com.mbw.config;
import com.mbw.password_encoder.PlainTextPasswordEncoder;
import com.mbw.password_encoder.Sha512PasswordEncoder;
import com.mbw.service.MybatisUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import java.util.HashMap;
@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
public class ProjectConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private MybatisUserDetailsService userDetailsService;
    @Autowired
    private PlainTextPasswordEncoder passwordEncoder;
    @Autowired
    private Sha512PasswordEncoder sha512PasswordEncoder;
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
        http.csrf().disable().authorizeRequests()
                .antMatchers("/create").permitAll()
                .anyRequest().authenticated(); //所有请求都需要身份验证
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder());
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        HashMap<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("noop", NoOpPasswordEncoder.getInstance());
        encoders.put("bcrypt", new BCryptPasswordEncoder());
        encoders.put("scrypt", new SCryptPasswordEncoder());
        return new DelegatingPasswordEncoder("bcrypt",encoders);
    }
}
```

接着在MybatisUserDetailsService我们需要写一个注册接口，并且将刚刚配置的PasswordEncoder注入：

```java
package com.mbw.service;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mbw.mapper.AuthorityMapper;
import com.mbw.mapper.UserAuthorityMapper;
import com.mbw.mapper.UserMapper;
import com.mbw.password_encoder.Sha512PasswordEncoder;
import com.mbw.pojo.Authority;
import com.mbw.pojo.User;
import com.mbw.pojo.UserAuthority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.annotation.Resource;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
@Service
@Slf4j
public class MybatisUserDetailsService extends ServiceImpl<UserMapper, User> implements UserDetailsService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private AuthorityMapper authorityMapper;
    @Autowired
    private UserAuthorityMapper userAuthorityMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<User> users = userMapper.queryUserByUsername(username);
        return users.stream().findFirst().orElseThrow(()->new UsernameNotFoundException("User Not Found"));
    }
    @Override
    @Transactional
    public boolean save(User user) {
        try {
            String passwordNotEncode = user.getPassword();
            String passwordEncoded = passwordEncoder.encode(passwordNotEncode);
            user.setPassword(passwordEncoded);
            userMapper.insert(user);
            Set<Authority> authorities = user.getAuthorities();
            Set<Long> authorityIds = authorities.stream().map(Authority::getId).collect(Collectors.toSet());
            authorityIds.forEach(id -> {
                Authority authority = authorityMapper.selectById(id);
                if(authority != null){
                    Long userId = user.getId();
                    UserAuthority userAuthority = new UserAuthority();
                    userAuthority.setUserId(userId);
                    userAuthority.setAuthorityId(id);
                    userAuthorityMapper.insert(userAuthority);
                }
            });
            return true;
        } catch (Exception e) {
            log.error(e.getMessage(),e);
            return false;
        }
    }
}
```

那么这样我们测试一下注册接口：

发现注册进去的新用户密码前缀会给我们自动带上{bcrypt},说明DelegatingPasswordEncoder配置时生效的，那么encode方法生效，match自然也会生效，我们试试登录：

登陆成功！

为方便起见，Spring Security提供了一种方法创建一个DelegatingPasswordEncoder,它有一个映射指向PasswordEncoder提供的所有标准实现。PasswordEncoderFactories类提供了一个**createDelegatingPasswordEncoder()的静态方法**，**该方法会返回使用bcrypt作为默认编码器的DelegatingPasswordEncoder的实现**

```java
 @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
```

效果等价于上面的配置代码，大家可以去试试。
