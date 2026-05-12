# 17、Spring Security 速成 - OAuth2的运行机制(下）-实现一个简单的单点登录应用程序
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/17.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

本章实现第一个使用带有Spring Boot和Spring Security 的OAuth2框架的应用程序。这个示例将展示如何将OAuth2应用到Spring Security中，并阐释你需要了解的一些接口的内容。顾名思义，单点登录（SSO）应用程序是通过授权服务器进行身份验证的应用程序，然后将使用刷新令牌让用户保持登陆状态。在我们的示例中，它只代表来自OAuth2架构的客户端。

在这个应用程序中，我们要使用Gitee作为授权和资源服务器，并重点关注使用授权码授权类型的组件之间的通信.在后面的学习中我们将在OAuth2架构中实现一个授权服务器和一个资源服务器。

## 二、项目前准备

大家如果是从之前跟过来的，我这里推荐大家重新构建一个OAuth2项目取名spring_security_oauth2_sso，然后将之前写的短信认证的那个项目，除了security包的内容不copy,其他都copy下来就好，然后对报错的地方做一下相关适配（例如passwordEncoder，这个自己新建一个security包，将以前的security对应内容放进去就好），这里就不重新展现了。

## 三、管理授权服务器

本节将配置授权服务器。本章**不会实现我们自己的授权服务器**，而是使用一个现有的：Gitee。

如何使用Gitee这样的第三方作为授权服务器呢？这意味着，最终，**我们的应用程序不会管理它的用户**，任何人都可以使用他们的Gitee账户登录到我们的应用程序。**与其他授权服务器一样，Gitee需要知道它要向哪个客户端应用程序发出令牌**。因此，**OAuth应用程序必须向Gitee授权服务器进行注册**。为此，需要使用以下链接完成一个简短的表单。

> https://gitee.com/oauth/applications/new

上图的“应用回调地址”就是我们注册的应用程序client（客户端）的接收授权码和access-token的地址其中,**/login/oauth2/code必须是这样，这是由Client引入的oauth2AuthenticationFilter的内部默认路径**。而后面的gitee是registrationid，与我们在自己的Client代码中配置的一致，**Client的oauth2AuthenticationFilter要靠这个值去对应配置在程序中的clientid和clientSecret然后发给gitee认证服务器。且将来gitee授权服务器收到授权请求后，会将配置的这个应用回调地址与请求参数中的redirect_uri匹配，正确才回传授权码以及access_token**。否则会报无效的回调地址（别问我为什么知道，问就是鸽那么多天都在尝试解决这个）

创建后会给我产生一个**clientId和clientSecret**，这个就是Gitee为我们提供的**客户端ID和客户端密钥**信息。当然我这里打上了马赛克，**大家一定要自己去生成自己的凭据，另外在使用这样的凭据编写应用程序时要小心，特别是在使用Gitee存储库存储它们的时候**。

这个配置就是需要为授权服务器做的所有处理。现在我们有了客户端凭据，可以开始处理应用程序了。

## 四、开始实现

### 4.1、准备工作

本节将开始实现一个SSO应用程序。我们首先需要将一下依赖添加到Pom文件中：

以前的项目中已加入spring-boot-starter-security和spring-boot-starter-web依赖，如果已经加了可以不用加后面两个。

```xml
<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

首先需要确保某些东西的安全：一个网页。为此，要创建一个控制器类和一个表示应用程序的简单的HTML页面。如下代码展示了HomeController类，它定义了应用程序的单个端点：

```java
@Controller
@Slf4j
public class HomeController {
	@GetMapping("/")
	public String home(OAuth2AuthenticationToken token)
	{
		log.info(String.valueOf(token.getPrincipal()));
		return "home";
	}
}
```

这里的OAuth2AuthenticationToken你可以类比为UsernamePasswordAuthenticationToken,同样实现**Authentication接口表示身份验证请求事件，并且会保存请求访问应用程序的实体的详细信息**。大家在写短信认证登录的时候，应该知道Authentication是分**请求前和请求后**，不知道大家是否还记得Principal这个对象，**在认证前存放的是认证所需的信息**，例如手机号，**认证后存放的是认证后的用户详细信息**，这里也是一样的，如果SSO认证通过后，我们也可以拿到资源服务器（这里仍然是gitee)给我们的用户信息，通过token.getPrincipal()获取。

而home的页面很简单

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<h1>Welcome</h1>
</body>
</html>
```

现在才要开始真正的工作！接下来设置安全配置，以允许应用程序使用GItee登录。首先要编写一个配置类，就像我们过往所做的那样，这里扩展了WebSecurityConfigurerAdapter并重写了configure(HttpSecurity http)方法。现在有了一个不同之处：此处调用了另一个名为**oauth2Login()**方法，而不是之前介绍的httpBasic()或formLogin()。代码如下：

```java
package com.mbw.security.config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import java.util.HashMap;
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.oauth2Login();
		http.authorizeRequests()
				.anyRequest().authenticated();
	}
	@Bean
	public PasswordEncoder passwordEncoder() {
		HashMap<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put("noop", NoOpPasswordEncoder.getInstance());
		encoders.put("bcrypt", new BCryptPasswordEncoder());
		encoders.put("scrypt", new SCryptPasswordEncoder());
		return new DelegatingPasswordEncoder("bcrypt", encoders);
	}
}
```

这里出现了一个新方法：oauth2Login(),但经过了之前的学习的你应该需要能反应过来其中进行了什么处理。与httpBasic()和formLogin()一样，oauth2Login()只是将一个新的身份验证过滤器添加到过滤器链中。我们之前说过SpringSecurity有一些过滤器实现，并且还可以向过滤器链添加自定义的过滤器。在本示例中，当调用oauthLogin()方法时，框架添加到过滤器链中的过滤器就是之前提到过的OAuth2LoginAuthenticationFilter.这个过滤器会拦截请求，并应用OAuth2身份验证所需的逻辑。

**ps:securityFilterChain中不再有usernamePasswordAuthenticationFilter和basicAuthenticationFitler**,因为你配置的本client的http.oauth2Login().那么本client的“认证凭证”就由oauth2AuthenticationFilter来提供oauth2AuthenticationToken了。

### 4.2、实现ClientRegistration

本节将讨论如何实现OAuth2客户端和授权服务器之间的连接。如果想让应用程序真正做一些事情，这是至关重要的。如果现在就启动该应用程序，那么将无法访问主页。无法访问该页面的原因是由于**指定了对于任何请求，用户都需要进行身份验证**，但是这里还没有提供任何身份验证方法。我们需要将gitee确立为授权服务器。为此Spring Security定义了**ClientRegistration**契约。

**ClientRegistration接口表示OAuth2架构中的客户端**。对于该客户端，需要定义其所需的所有详情，其中包括：

- 客户端ID和密钥
- 用于身份验证的授权类型
- 重定向URI
- 作用域

你可能还记得在之前讲解授权码授权类型时，应用程序需要将所有这些详细信息用于身份验证过程中，Spring Security还提供了一种创建构建器实例的简单方法，类似于一开始构造UserDetails方法是一样的。下面代码展示了如何构建这样一个表示客户端实现的实例：

###### GiteeClient.java#

```java
package com.mbw.security.client.gitee;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.stereotype.Component;
@Component
public class GiteeClient {
	public ClientRegistration clientRegistration(){
		return ClientRegistration.withRegistrationId("gitee")  //起个名字,代表client，如clientId和clientSecret
				.clientId("your clientId")  //此处要换成你在gitee上创建应用得到的
				.clientSecret("your clientSecret") //此处要换成你在gitee上创建应用得到的
				.scope(new String[]{
     "user_info"})    //读取用户权限，参见你gitee上创建应用时的授权勾选
				.authorizationUri("https://gitee.com/oauth/authorize")   //这要看gitee的api，是user认证以及client认证获取授权码的地址
				.tokenUri("https://gitee.com/oauth/token") //这要看gitee的api，是client得到授权码后去换token的gitee地址
				.userInfoUri("https://gitee.com/api/v5/user") //资源服务器api地址-也是client用access-token去获取用户user详情的“用户详情资源服务器地址”-这里也是gitee】】
				.userNameAttributeName("id")
				.clientName("gitee")  //为我们的应用client起了个名字
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)  //注是授权码模式
				.redirectUriTemplate("{baseUrl}/{action}/oauth2/code/{registrationId}")  //本应用配置的gitee发回授权码的地址
				.build();
	}
}
```

第一眼看上去要设置的东西有点多，但它只不过是设置客户端ID和密钥而已。此外，还定义了作用域(授予的权限)、客户端名称和所选择的注册ID。除了这些信息，还必须提供授权服务器的URL。

- **授权URI**:**客户端将用户重定向**到其进行身份验证的URI。
- **令牌URI**：**客户端**为获取访问令牌和刷新令牌而**调用**的URI。
- **用户信息URI**：**客户端**在获得访问令牌后可以**调用**的URI，以**获得关于用户的更多详细信息**。

这些URI是从哪里获得的？如果授权服务器不是由我们开发的，则需要从说明文档中获取它们。以Gitee为例，可以在这里找到它们：

> https://gitee.com/api/v5/oauth_doc#/

当然如果你的授权服务器提供者不是gitee,而是Github,Google,FaceBook,Okta这四个中的任意一个，那么Spring security给我们提供了CommonOAuth2Provider的类，这个类部分定义了可以用于身份验证的最常见提供程序的ClientRegistration实例，拿Github为例，你可以这样如下配置：

```java
public ClientRegistration githubClient(){
return CommonOAuth2Provider.GITHUB
        .getBuilder("github")
        .clientId("your clientId")
        .clientSecret("your clientSecret")
        .build();
}
```

如上所示，这样更为清晰，并且我们不必手动查找和设置授权服务器的URL。当然，这只适用于公共提供程序。如果授权服务器不在公共提供程序之列，则只能完全定义ClientRegistration。

然后我们之前定义的GiteeClient已经交由Spring容器进行管理，我们可以在配置类中注入它。但是这样身份验证过滤器仍不能直接获取关于授权服务器客户端注册的详细信息，我们需要实现**clientRegistrationRepository**!

### 4.3、实现ClientRegistrationRepository

我们之前讲到配置了ClientRegistration还不够，需要对其进行设置，以便将其用于身份验证。为此，Spirng Security使用了类型为ClientRegistrationRepository的对象

ClientRegistrationRepository会检索ClientRegistration详细信息（客户端ID、客户端密钥、URL、作用域等）。身份验证过滤器需要将这些详细信息用于身份验证流程。

ClientRegistrationRepository接口**类似于前面介绍过的UserDetailsService接口**。与UserDetailsService对象通过其用户名查找UserDetails相同，**ClientRegistrationRepository对象通过其注册ID查找ClientRegistration**。

**可以实现ClientRegistrationRepository接口来告知框架在哪里找到ClientRegistration实例**。Spring Security为ClientRegistrationRepository提供了一个实现，该实现会将ClientRegistration的实例存储在内存中，也就是**InMemoryClientRegistrationRepository**。是不是很熟悉，这与InMemoryUserDetailsManager对UserDetails实例所做的处理类似。

而且可以实现ClientRegistrationRepository也说明**我们可以像之前通过mysql管理userDetails一样去管理ClientRegistration**，不知道大家还记不记得之前写过的mybatisUserDetailsService.但是这里就暂时不作展示了，大家有兴趣可以自行尝试。

为了完成该应用程序实现，这里使用InMemoryClientRegistrationRepository实现定义了一个ClientRegistrationRepository，并将构建的ClientRegistration实例添加到InMemoryClientRegistrationRepository中，这是通过将其作为InMemoryClientRegistrationRepository构造函数的参数来完成的。然后将构造 ClientRegistrationRepository的方法通过oauth2Login()的customizaer设置，代码如下：

```java
package com.mbw.security.config;
import com.mbw.security.client.gitee.GiteeClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import java.util.HashMap;
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
	@Autowired
	private GiteeClient giteeClient;
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.oauth2Login(c->c.clientRegistrationRepository(clientRegistrationRepository()));
		http.authorizeRequests()
				.anyRequest().authenticated();
	}
	private ClientRegistrationRepository clientRegistrationRepository(){
		return new InMemoryClientRegistrationRepository(giteeClient.clientRegistration());
	}
	@Bean
	public PasswordEncoder passwordEncoder() {
		HashMap<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put("noop", NoOpPasswordEncoder.getInstance());
		encoders.put("bcrypt", new BCryptPasswordEncoder());
		encoders.put("scrypt", new SCryptPasswordEncoder());
		return new DelegatingPasswordEncoder("bcrypt", encoders);
	}
}
```

### 4.4、Spring boot配置的纯粹方式

Springboot旨在使用其纯粹的配置方式直接从属性文件构建ClientRegistration和ClientRegistrationRepository对象。这种方法在Spring Boot项目并不少见。对于其他对象也是如此，例如数据源配置，下面代码展示了如何在yaml文件中为此处的示例设置客户端注册：

```java
spring:
  security:
    oauth2:
      client:
        registration:
          gitee:
            client-id: your clientId
            client-secret: 4your clientSecret
            authorization-grant-type: authorization_code
            redirect-uri: '{baseUrl}/{action}/oauth2/code/{registrationId}'
            client-name: gitee
            provider: gitee
            scope:
              - user_info
        provider:
          gitee:
            authorization-uri: https://gitee.com/oauth/authorize
            token-uri: https://gitee.com/oauth/token
            user-info-uri: https://gitee.com/api/v5/user
            user-name-attribute: id
```

这样你的配置类就可以不再需要指定ClientRegistration和ClientRegistrationRepository的任何详情，因为它们是由Spring Boot根据属性文件自动创建的:

```java
package com.mbw.security.config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import java.util.HashMap;
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.oauth2Login();
		http.authorizeRequests()
				.anyRequest().authenticated();
	}
	@Bean
	public PasswordEncoder passwordEncoder() {
		HashMap<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put("noop", NoOpPasswordEncoder.getInstance());
		encoders.put("bcrypt", new BCryptPasswordEncoder());
		encoders.put("scrypt", new SCryptPasswordEncoder());
		return new DelegatingPasswordEncoder("bcrypt", encoders);
	}
}
```

### 4.5、测试应用程序

这个图在当时讲解授权码授权类型时给大家展示过，里面就是一个具体的流程，更加具体的步骤讲解可以参考下面的博客，讲的比较到位。

> https://blog.csdn.net/longlivechina008/article/details/125007457

我们下面演示一下流程：

启动程序：

输入localhost:9090时，由于所有路径都需要认证，所以被过滤器拦截，然后重定向到gitee登录页面

输入自己的gitee的账号密码后，客户端将我们重定向到gitee的授权页面，这个就是上图中的⑤-⑧步

点击同意授权后，当Gitee认证服务器认证了user，同时也获得了clientid和用户授权的权限后，发回重定向指令到浏览器，**带着【授权码】**–实际上是 HTTP 302响应

接着浏览器被重定向，向Client发出请求，带着授权码GET请求

> http://localhost:9090/login/oauth2/code/gitee?code=3d459a2fgttbb60c168e9df64175ab3739085b28d0a12071efd&state=-AVIglbqTn6a0GjcoQWJQE0efOtbDI1L1fxYxnlMp1k%3D

【千万注意】这个地址http://localhost:9090/login/oauth2/code/gitee

就是我们代码中配置的

```java
.redirectUriTemplate("{baseUrl}/{action}/oauth2/code/{registrationId}")
```

【注意】redirectUriTemplate其中：

**1、** baseUrl的值http://localhost:9090/就是我们的应用Client的根路径；

**2、** {action}不是我们配置的，而是OauthAuthenticationFilter拦截请求Filter中固定的-login，不同的路径对应不同拦截功能我们没有自己写filter，采用的是默认的我们只要配置了http.oauth2Login();就会有此默认的拦截器OauthAuthenticationFilter，他的逻辑是固定的；

**3、** oauth2/code也是OauthAuthenticationFilter固定的因为我们没有自己写filter；

**4、** .gitee是我们为Client起的名字，OauthAuthenticationFilter拦截请求后，会根据路径上的这个名字gitee这个id取出clientidclientsecret权限scope等等；

所以,**我们在Gitee上配置的客户端clientid和clientsecret一定要和Client传来的一致**，且我们在gitee上配置的**应用回调Url才是Gitee发出请求的依据**。Gitee是根据配置的这个回调Url来进行请求的。所以，**这个回调url必须和我们应用client配置一致才对**。gitee对用户user认证并得到user对client的scope确认后，才会根据【gitee上的应用回调地址做出请求】。

而我们.redirectUriTemplate(“{baseUrl}/{action}/oauth2/code/{registrationId}”)这里的配置是配置应用client。当收到这样的请求，**client会向gitee发出post请求。以便用得到的授权码到gitee上换取access_token**,所以gitee上的用户配置的回调地址**决定了Gitee向哪个地址发送认证码**

而我们代码配置的.redirectUriTemplate(“{baseUrl}/{action}/oauth2/code/{registrationId}”

是这个地址的**决定的Oauth2AuthenticationFilter的有效拦截功能启用**。 **两个地址必须一致才能收到Gitee来的授权码**.

然后有了accessToken后，我们就可以自由的对整个程序的端点进行访问了。

如果想要移除用户已经存在的有效accessToken重新认证，可以到gitee的配置好的第三方应用处选择移除已授权用户的有效Token然后重启程序，等下次访问就有需要重新授权认证了。
