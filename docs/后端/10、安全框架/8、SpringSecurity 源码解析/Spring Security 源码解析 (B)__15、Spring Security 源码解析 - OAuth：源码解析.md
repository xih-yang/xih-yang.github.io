# 15、Spring Security 源码解析 - OAuth：源码解析
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/15.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 一、框架核心

> 和Spring Security 一样，整个框架的核心就是构建一个名字为 springSecurityFilterChain 的过滤器 Bean，它的类型是 FilterChainProxy。

FilterChainProxy 维护了一组过滤器链，认证服务构建了一条`认证服务过滤器链`，在用户请求认证时会走一遍该过滤器链。而资源服务构建了一条`资源服务过滤器链`，同样在用户请求资源时会走一遍该过滤器链。

关于核心过滤器如何构建，以及过滤器链包含哪些过滤器，框架是怎么运行的，接下来一一呈现。

## 二、框架整体设计

> 注意：本篇源码是基于 Spring Security 源码基础上来讲解的，如果您还未看过关于 Spring Security 源码，请务必看一看，文末放出链接。

Spring Security 整个框架主要由 `建造者` 和 `配置器` 构成，在服务启动时就是 `通过配置器对建造者进行配置` ，配置完成再由建造者创建出核心过滤器，而 Spring Security OAuth 是在它基础上增加了 OAuth 的配置，构建出了 OAuth 的过滤器链。

再次重复：`在使用 Spring Security 框架时，建造者我们是不会动的，我们能做的只是将自己的配置添加到整个架构下，所以能扩展的是配置器，Spring Security OAuth 也是如此。`

### 建造者

建造者很简单，就这么几个类，但是其中设计确实很值得学习，具体请查看文末文章。

### 配置器

配置器因为提供了很多扩展接口，所以配置器涉及的类和接口是非常繁杂的，图片显示了从顶级配置器接口到我们自己定义的认证服务配置和资源服务配置的 UML 关系类图。

可以发现，Spring Security OAuth 其实和使用 Spring Security 扩展自己的登录认证配置时操作是一样的（文末文章），即

- 认证服务配置：核心配置器是 AuthorizationServerSecurityConfiguration，继承了 WebSecurityConfigurerAdapter，核心过滤器配置是 AuthorizationServerSecurityConfigurer，继承了 SecurityConfigurerAdapter，核心过滤器配置（AuthorizationServerSecurityConfigurer）也会被应用进核心配置器（AuthorizationServerSecurityConfiguration）。
- 资源服务配置：核心配置器是 ResourceServerConfiguration，继承了 WebSecurityConfigurerAdapter，核心过滤器配置是 ResourceServerSecurityConfigurer，继承了 SecurityConfigurerAdapter，核心过滤器配置（ResourceServerSecurityConfigurer）也会被应用进核心配置器（ResourceServerConfiguration）。

不同的是，在扩展使用 OAuth 时，因为核心配置器都已经在框架中创建了，而我们只需要在它基础上扩展自己的配置，如上图的左下角两块独立区域，灰色的两个配置就是我们自定义的配置，打开依赖关系看看类之间的依赖。

图中的红框表示，两个核心配置器里面分别组合了一组 Configurer，例如认证服务核心配置器里面组合了一组 `AuthorizationServerConfigurer`，如下图所示：

实际上configurers 会配置进整个核心配置器，最终构建出整条过滤器链，于是，我们可以继承 `AuthorizationServerConfigurer` 或者其子类，扩展自己的配置，事实上我们确实创建了 `OAuthServerConfig`，继承了 `AuthorizationServerConfigurerAdapter`。对于认证服务核心配置同样如此。

## 三、框架构建过程

关于核心过滤器构建过程，请参考[《Spring Security源码（五）：FilterChainProxy是如何创建的？》](/zhuanlan/security/springsecurity/10/8.html)，整个构建过程其实和 Spring Security 的构建是一样的。源码入口可以从声明核心过滤器 springSecurityFilterChain 的地方开始看：

> org.springframework.security.config.annotation.web.configuration.WebSecurityConfiguration#springSecurityFilterChain

这里留下一个问题，欢迎一起交流，评论区期待留下您的答案~

> 上面这个 WebSecurityConfiguration 类是在注解 @EnableWebSecurity 中引入的，但是这个注解在 Spring Security OAuth 中并没有用上，只用了 @EnableAuthorizationServer 和 @EnableResourceServer 注解，那 @EnableWebSecurity 注解在哪里用了，或者说 WebSecurityConfiguration 类是在怎么被引入项目的？

## 四、框架运行过程

> 前面说到，无论是认证请求还是资源请求都是走一条过滤器链，我们来看看分别走过的过滤器链里的过滤器有哪些。可以从核心过滤器 FilterChainProxy 的 doFilter 方法开始断点。

### 认证请求过程

以下是认证请求时要走过的 12 个过滤器，这里重点关注 `ClientCredentialsTokenEndpointFilter` 过滤器，该过滤器是 OAuth 认证的过滤器，其它过滤器在 Spring Security 源码系列文章都有提到，文末已给出链接。

下面再贴出部分 **ClientCredentialsTokenEndpointFilter** 代码，会发现该过滤器拦截的接口 `/oauth/token` 正是认证请求获取 Token 的接口。

```java
public class ClientCredentialsTokenEndpointFilter extends AbstractAuthenticationProcessingFilter {
	public ClientCredentialsTokenEndpointFilter() {
		this("/oauth/token");
	}
	@Override
	public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
			throws AuthenticationException, IOException, ServletException {
		...
		return this.getAuthenticationManager().authenticate(authRequest);
	}
}
```

过滤器嘛，当然走 `doFilter` 方法，它的 doFilter 方法在父类中实现了，父类会调用子类实现的 `attemptAuthentication` 方法，可以从该方法开始跟，这里就不一一跟下去了，这里面主要内容就是认证 `client_id 和 client_secret` 的正确性，流程如下：

- 调用上篇实战篇文章自己配置的 com.meicloud.oauth.service.impl.OAuthClientDetailsServiceImpl#loadClientByClientId 方法，获取客户端信息，比对请求所带的 clientSecret，失败的话返回认证失败，成功的话继续往下走过滤器；
- 后面还会将认证成功的 token 信息保存到 redis，token 信息其实默认是保存在内存中，因为我们在 OAuthServerConfig 配置中配置了 DefaultTokenServices 使用分布式 redis 存储 token 信息，便于各资源服务器获取，可以看一下 redis 都保存了什么内容，以下是一个 token 需要保存的东西：

```java
1) "api:client:token:access:b8cef160-410f-436a-aa0e-ebc0100127ba"
2) "api:client:token:client_id_to_access:4099c23e45f64c158065e1b062492357"
3) "api:client:token:refresh_to_access:5c0e231a-6253-4fe2-a051-64d2b7eb080e"
4) "api:client:token:access_to_refresh:b8cef160-410f-436a-aa0e-ebc0100127ba"
5) "api:client:token:auth_to_access:c4eb8d4e24604de206c738859e811f6b"
6) "api:client:token:refresh_auth:5c0e231a-6253-4fe2-a051-64d2b7eb080e"
7) "api:client:token:auth:b8cef160-410f-436a-aa0e-ebc0100127ba"
8) "api:client:token:refresh:5c0e231a-6253-4fe2-a051-64d2b7eb080e"
```

这里抛出一个问题，`认证成功之后的 token 信息是什么时候保存进 Redis 的？`

- 其实是在 TokenEndpoint 类通过接口调用的方式保存的。要注意这个接口是在认证成功之后才会进入的，网传的前端 /oauth/token 认证接口会直接进入这里的说法是不对的，看接口传进来的就是 Principal（认证后的资本），这里没有认证逻辑，更多的是组装参数保存进 Redis（这里我们配置的是 Redis，还可以是其他的比如 JDBC、内存等）。
- 关于调用链路可以这里打个断点慢慢跟进去，具体就不贴代码了。

### 资源请求过程

资源请求过程也是一样走一条过滤器链，如下，重点在于 **OAuth2AuthenticationProcessingFilter** 过滤器，该过滤器主要请求头带的 `Bearer b8cef160-410f-436a-aa0e-ebc0100127ba` 是否合法，和合法的话就能够访问后台资源

进入dofilter 方法，可以看到如下代码解析出了请求头 key 为 `Authorization`，value 以 `Bearer` 开头的 tokenValue

继续往下走会根据 tokenValue 去 Redis 中找认证信息记录

这里查看这个认证记录看看是否有对该资源服务器的访问权限，前面一篇实战篇提到了每个资源服务器都会有一个 ResourceId 唯一识别一个服务器

这些都通过之后，表示有了对该资源服务器的访问权限，剩下就是继续走其他过滤器，其中包括验证该请求是否有对某个资源的访问权限，这是 `FilterSecurityInterceptor` 过滤器的内容，这部分请参考：[《Spring Security源码（十）：权限访问控制是如何做到的？》](/zhuanlan/security/springsecurity/10/13.html)

## 五、总结

- 我们大体回顾了 Spring Security 框架设计，也知道了 Spring Security OAuth 也是在前者体系上配置出来的，与使用 Spring Security 时几乎无异；
- 我们还大体走了 OAuth 的认证请求的流程和资源请求的流程，了解了整个请求的脉络，当然不是特别具体，具体需要大家自己跟进了。
