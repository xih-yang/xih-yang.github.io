# 10、Spring Security 源码解析 - 设计模式在框架中的应用
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/10.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
> 在看源码的过程中发现用到的设计模式还是很多的，最近博主正好也学习了些设计模式，所以总结了下源码中所用到的设计模式，可能还有很多设计模式没找出来，有兴趣的可以一块来探讨呀。

## 一、责任链模式

- [责任链模式学习请点这里](/zhuanlan/design/java/18.html)
- 其实接收web请求的整个过滤器链形成的处理方式就是责任链模式。如果想看完整写的责任链模式可以参考：org.springframework.security.web.FilterChainProxy#doFilterInternal
- 方法中定义了一个 VirtualFilterChain 类型的虚拟过滤器链对象，他的目的主要是更方便的在Spring Security过滤器链中传递请求，从它的入口处理和结束都有，很详细了。

## 二、代理模式

- [代理模式学习请点这里](/zhuanlan/design/java/17.html)
- 【此处是否用到了代理模式有待考究，欢迎大家来一起探讨】FilterChainProxy 就是个代理类，它代理的是 Spring Security 中的所有过滤器链，同时它也是一个过滤器，所以可以加入到 ServletContext，使用代理目的应该是 不直接把 Spring Security 中的过滤器链直接暴露给 ServletContext ，从而达到保护的目的，还能降低程序的耦合度。

## 三、模板方法

- [模板方法模式学习请点这里](/zhuanlan/design/java/28.html)
- org.springframework.security.config.annotation.AbstractConfiguredSecurityBuilder#doBuild，这里就使用到了模板方法
- doBuild() 方法里面定义了一个算法骨架，程序按照这个算法（beforeInit()、init()、beforeConfigure()、configure()、performBuild()）去执行，而算法中每个方法可以被子类去实现。

## 四、适配器模式

- [适配器模式学习请点这里](/zhuanlan/design/java/10.html)
- 配置器中 WebSecurityConfigurerAdapter 就是个适配器类，使用适配器的好处是我们可以选择性的配置想要修改的那一部分配置，而不用覆盖其他不相关的配置。
- 比如它提供了三个重载的 configure 方法，我们不需要使用它的 configure(HttpSecurity http) ，于是我们自己定义一个配置类继承这个适配器，覆盖掉它的这个方法使用我们自定义的配置，而且我们一般都是这么做的。

## 五、建造者模式

- [建造者模式学习请点这里](/zhuanlan/design/java/8.html)
- 整个建造者的架构就是个建造者模式，利用 HttpSecurity、WebSecurity 对需要的一些属性进行配置，最后构建出核心过滤器 springSecurityFilterChain。
- 比如我们使用 HttpSecurity 链式调用的方式去配置很多属性，比如配置我们需要的过滤器、自定义的过滤器等等，配置好后最终构建出所需的对象。

## 六、装饰者模式

- [装饰者模式学习请点这里](/zhuanlan/design/java/14.html)
- 来看看这个类 org.springframework.security.config.annotation.ObjectPostProcessor，里面有个 postProcess 方法，入参是 O类型，出参也是 O类型，是不是符合装饰者模式：增强原有对象，而不改变原有对象

```java
public interface ObjectPostProcessor<T> {
	<O extends T> O postProcess(O object);
}
```

- 框架中用的很多，对传入的对象进行后置处理，比如：
- org.springframework.security.config.annotation.web.configuration.WebSecurityConfiguration#springSecurityFilterChain
- org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder#performBuild
- org.springframework.security.config.annotation.web.configuration.WebSecurityConfiguration#setFilterChainProxySecurityConfigurer

## 七、策略模式

- [策略模式学习请点这里](/zhuanlan/design/java/27.html)
- 在认证授权那一块用到了策略模式 + 委托模式，先来看图
- AuthenticationProvider 是策略接口，后面三个都是它的实现类，定义了不同的策略（这里只列出三个，中间两个是自定义的策略）
- 最左边的 ProviderManager 中有个 providers 属性，类型是 List``，它其实就是个委托类
- 在运行过程中，所有的策略都会委托给 ProviderManager 保存到 providers 属性中，即委托类会收集所有的策略，执行时会循环 providers 看哪个策略能支持（supports()）去认证，匹配中的话就执行其策略。参考这段代码：org.springframework.security.authentication.ProviderManager#authenticate

```java
public Authentication authenticate(Authentication authentication)
        throws AuthenticationException {
    Class<? extends Authentication> toTest = authentication.getClass();
    AuthenticationException lastException = null;
    Authentication result = null;
    boolean debug = logger.isDebugEnabled();
    for (AuthenticationProvider provider : getProviders()) {
        if (!provider.supports(toTest)) {
            continue;
        }
        if (debug) {
            logger.debug("Authentication attempt using "
                    + provider.getClass().getName());
        }
        try {
            result = provider.authenticate(authentication);
            if (result != null) {
                copyDetails(authentication, result);
                break;
            }
        }
        catch (AccountStatusException e) {
            prepareException(e, authentication);
            // SEC-546: Avoid polling additional providers if auth failure is due to
            // invalid account status
            throw e;
        }
        catch (InternalAuthenticationServiceException e) {
            prepareException(e, authentication);
            throw e;
        }
        catch (AuthenticationException e) {
            lastException = e;
        }
    }
}
```

## 八、委托模式

- 委托模式不是 GOF（Gang of Four） 23种设计模式之一。
- 源码示例参考策略模式。
