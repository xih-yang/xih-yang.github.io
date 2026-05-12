# 06、Spring Security 实战 - 一文搞懂密码的加密和比对
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/6.html
- 分类：安全框架
- 分组：教程目录
在[【Spring Security 实战（三）】默认登录认证的实现原理](/zhuanlan/security/springsecurity/11/3.html?spm=1001.2014.3001.5501) 中小编阐述了在登录认证时，默认情况下，是在 `DaoAuthenticationProvider` 中的 `additionalAuthenticationChecks` 方法中进行密码认证的，但没有具体说怎么认证的。本文就具体说说密码的加密和比对吧。

## 一、PasswordEncoder 详解

在Spring Security 中，PasswordEncoder 是一个接口，具体源码如下。

```java
public interface PasswordEncoder {
	// 该方法对明文密码进行加密
    String encode(CharSequence rawPassword);
	// 该方法用来进行密码比对，明文和密文比对
    boolean matches(CharSequence rawPassword, String encodedPassword);
	// 该方法用来判断当前密码是否需要升级，可以看见这个方法是默认的
	// 默认返回值是 false
    default boolean upgradeEncoding(String encodedPassword) {
        return false;
    }
}
```

从源码中可以发现，Spring Security 是通过 PasswordEncoder 去实现密码的加密和比对的。俩必要的抽象方法：

- encode：对明文密码进行加密；
- matches：进行密码比对。

### 常见的实现类（了解）

- NoOpPasswordEncoder
- 没有加密，就是明文
- BCryptPasswordEncoder
- 使用 bcrypt 算法对密码进行了加密，为了提高密码的安全性，bcrypt 算法故意降低运行速度，以增强密码破解的难度。同时 BCryptPasswordEncoder 为自己加盐，开发者不需要额外维护一个 盐 字段，使用 BCryptPasswordEncoder 加密后的字符串就已经带盐了，即使使用铭文每次生成的加密字符串的不相同。
- Argon2PasswordEncoder
- Pbkdf2PasswordEncoder
- SCryptPasswordEncoder

咱下面就只拿 BCryptPasswordEncoder 进行事例说明，所以就解释上面俩吧，不多说了。

### DelegatingPasswordEncoder

DelegatingPassword 是 PasswordEncoder 的一个实现类，也是自 Spring Security 5 之后默认使用的加密方案。

从其类名上看，我们可以初步判定它内部用了委派（Delegate）设计模式，它主要是根据实际密文委派实际的密码比对方案。

> 委派模式(Delegate Pattern）又叫委托模式，是一种面向对象的设计模式，允许对象组合实现与 继承相同的代码重用。它的基本作用就是负责任务的调用和分配任务，是一种特殊的静态代理，可以理 解为全权代理，但是代理模式注重过程，而委派模式注重结果。委派模式属于行为型模式，不属于 GOF 23 种设计模式中。
>
> ————————————————
>
> 通俗地说就是：让一委派对象去判断用哪个对象去处理这个业务，就是让委派对象去做抉泽。通常类名中带有Delegate或Dispatcher的就用了这种设计模式。

很多人奇怪为什么早期使用的 `NoOpPasswordEncoder` 不直接改为 `BCryptPasswordEncoder`，而是选择了 `DelegatingPasswordEncoder`。下面是官方文档中给出如果那样改变会有什么麻烦：

- 有很多应用程序使用旧的密码编码不容易进行迁移；
- 密码存储的最佳实践就被更改了；
- 而 Spring Security 作为一个框架而言，不能这么轻易地带破坏性的更改。

而换成`DelegatingPasswordEncoder` 则解决了所有问题：

- 确保使用的密码编码可以进行规范的正确的密码存储；
- 允许以现代和遗留格式验证密码；
- 允许将来升级编码；

#### 源码分析

先了解其属性成员

```java
public class DelegatingPasswordEncoder implements PasswordEncoder {
	// 默认包裹id的前缀
    private static final String DEFAULT_ID_PREFIX = "{";
    //默认包裹id的后缀
    private static final String DEFAULT_ID_SUFFIX = "}";
    // 实际包裹id的前缀
    private final String idPrefix;
    // 实际包裹 id 的后缀
    private final String idSuffix;
    // 实际加密的id
    private final String idForEncode;
    // 实际加密的方案对象
    private final PasswordEncoder passwordEncoderForEncode;
    // 用来委托时候的方案映射
    private final Map<String, PasswordEncoder> idToPasswordEncoder;
    // 密码对比方案对象
    private PasswordEncoder defaultPasswordEncoderForMatches;
    }
```

根据调试可以发现，默认构造后的各个属性初始化结果如下：

根据上面的调试结果，DelegatingPasswordEncoder 根据 {id} 委派方案时可以有如下选择：

DelegatingPasswordEncoder 的加密实现，实际就是用 BCryptPasswordEncoder 去进行加密后的结果。

```java
public String encode(CharSequence rawPassword) {
    return this.idPrefix + this.idForEncode + this.idSuffix + this.passwordEncoderForEncode.encode(rawPassword);
}
```

咱再看看它内部比对密码的实现，实际这里就进行了委派，委派正确的方案，然后再让委派后的对象进行比对。下面对源码进行了注释，可以看看。

```java
public boolean matches(CharSequence rawPassword, String prefixEncodedPassword) {
// rawPassword 是原密码，就咱用户输入的
// prefixEncodePassword 可以理解为是保存在数据库中的密码
    if (rawPassword == null && prefixEncodedPassword == null) {
        return true;
    } else {
    // 去获取{id}中的id
        String id = this.extractId(prefixEncodedPassword);
        // 根据 id 获取实际方案PasswordEncoder
        PasswordEncoder delegate = (PasswordEncoder)this.idToPasswordEncoder.get(id);
        if (delegate == null) {
            return this.defaultPasswordEncoderForMatches.matches(rawPassword, prefixEncodedPassword);
        } else {
        // 然后如果委派成功就进行比对
            String encodedPassword = this.extractEncodedPassword(prefixEncodedPassword);
            return delegate.matches(rawPassword, encodedPassword);
        }
    }
}
```

#### DelegatingPasswordEncoder 在哪实例化的？

实际上在 `AuthenticationConfiguration` 中配置 `AuthenticationManagerBuilder` ，将其载入到了 AuthenticationBuilder 实例化对象中了。

从上面并未看出它在哪实例化的，但可以看见创建了一个 LazyPasswordEncoder，它是一个静态内部类，**里面有个getPasswordEncoder方法，里面用了单例，私有化的方法，LazyPasswordEncoder 里的encode、mathches等方法都是依赖这个单例对象去进行的。可以看见它是先去调用 getBeanOrNull 这个方法去获取PasswordEncoder对象（从Spring容器中），如果不存在，就去构造 DelegatingPasswordEncoder**。在它里面通过 PasswordEncoderFactories 工厂构造的 DelegatingPasswordEncoder。

下面是DefaultPasswordEncoderAuthenticationManagerBuilder 内部类（继承了AuthenticationManagerBuilder）重写的三个 UserDetailsService 配置的方法。`passwordEncoder` 方法实际是给 DaoAuthentionProvider 中的 赋值…了解了解就好了

其实在实例化 DaoAuthenticaitonProvider 的时候，也会对 passwordEncoder 进行初始化，同样是通过 PasswordEncoderFactories 进行构造的 DelegatingPasswordEncoder。**根据上面重写的方法可以发现最后还是会换成 defaultPasswordEncoder，也就是 LazyPasswordEncoder 实例。**

综上所述：**实际注入形式有两种，一种是采用默认的，从PasswordEncoderFactories 中实例化对象；另一种是向Spring容器中注入自己想使用的PasswordEncoder。**

## 二、自定义加密

通过上面对Spring Security 5 之后默认使用的 PasswordEncoder（DelegatingPasswordEncoder）的源码分析，相信下面对自定义加密的两种方式会很轻松的掌握并理解。

### 自定义方式一：使用{id}的形式

从上面的源码分析我们可以知道，默认的DelegatingPasswordEncoder 会去找密码前面的 id ，去委派方案进行比对密码，所以我们的密码在前面加上想要匹配的方案 id ，就可以了。这种方式呢，比较灵活，可以根据自己想要的比对方式去配 id 即可，密码形式比较灵活。缺点就是对应方案 id 咱也不好记，**所以记住有 PasswordEncoderFactories 这么一个类小编自认为是很有必要的。**

方案id ，我们在PasswordEncoderFactories中查找到，如下：

测试案例：

写个测试案例，看看 123 用 BCrypt 加密后的结果。

```java
@Test
public void test(){
    // 输出：$2a$10$0BBFHiDx9jmix3FldDvFYexYGrOascxKcDagaG1wW7LpnPeQIjBca
    System.out.println(new BCryptPasswordEncoder().encode("123"));
}
```

然后在配置 UserDetailsService 中进行配置一下。

```java
@Bean
public InMemoryUserDetailsManager inMemoryUserDetailsManager(){
    return new InMemoryUserDetailsManager(
            User.withUsername("root")
            .password("{bcrypt}$2a$10$0BBFHiDx9jmix3FldDvFYexYGrOascxKcDagaG1wW7LpnPeQIjBca")
            .roles("admin")
            .build());
}
```

测试结果

### 自定义方式二：向Spring容器中注入PasswordEncoder对象

上面有对 LazyPasswordEncoder 中的 getPasswordEncoder 方法进行源码分析，说实际是先从Spring容器中找，没有的话再通过PasswordEncoderFactories进行构建。所以我们直接创建一个交给 Spring 容器就可以实现自定义了。但是这种方式不好的地方就是只能用一种 PasswordEncoder 进行密码比对，好处就是专一、密码前不用写{id}。

测试案例：

配置代码

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    @Bean
    public InMemoryUserDetailsManager inMemoryUserDetailsManager(){
        return new InMemoryUserDetailsManager(
                User.withUsername("root")
                .password("$2a$10$0BBFHiDx9jmix3FldDvFYexYGrOascxKcDagaG1wW7LpnPeQIjBca")
                .roles("admin")
                .build());
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http
                .getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(inMemoryUserDetailsManager())
                .and()
                .build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .and()
                .logout()
                .logoutUrl("/api/auth/logout")
                .and()
                .csrf()
                .disable()
                .build();
    }
}
```

测试

## 三、总结

- 有些会有疑问：我不写 {id} 呢？会怎么密码比对呢？其实源码分析的时候很清楚了，如果没有匹配到委派方案，就会按DelegatingPasswordEncoder 中的默认方案，即会抛出java.lang.IllegalArgumentException: There is no PasswordEncoder mapped for the id "null"的异常。
- DelegatingPasswordEncoder 实例对象是通过 PasswordEncoderFactories 类中的 createPasswordEncoder 方法进行创建的。方法内可以查看对应的 id ，所以这个类需要记住。
- 自定义加密通过源码分析可以得出两种自定义的方案：
- 使用 {id} 的形式，即在密码前加上 {id}，例如：{noop}123，即表示等密码比对的时候用 NoOpPasswordEncoder 中的matches方法进行比对。
- 向 Spring 容器中注入 PasswordEncoder 实例，这样Spring Security 会选择注入的实例去进行密码的比对，缺点是整个项目的密码比对都只能采用这种比对方案。
- 对两种自定义加密方式有疑惑的，可以看上面对DefaultPasswordEncoderAuthenticationManagerBuilder 、LazyPasswordEncoder 的源码分析。**在LazyPasswordEncoder中解释了getPasswordEncoder方法，是先从Spring容器中找，再去拿 PasswordEncoderFactories 工厂去创建。**

下面是咱从 HttpSecurity 中获取的AuthenticationManagerBuilder实例，内部属性可以看看。
