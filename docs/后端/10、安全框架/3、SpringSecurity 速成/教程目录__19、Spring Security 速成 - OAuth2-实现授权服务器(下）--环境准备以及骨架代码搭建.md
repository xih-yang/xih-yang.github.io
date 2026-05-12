# 19、Spring Security 速成 - OAuth2:实现授权服务器(下）--环境准备以及骨架代码搭建
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/19.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

本章我们将在上一章代码骨架搭建好的前提下对三种授权类型进行测试以及讲解如何配置授权服务器以颁发刷新令牌，所以本章是一个比较轻松的章节，但是唯一的要求就是需要小伙伴们对上一章内容要完成代码的搭建，否则这章学习也不知道个所以然。

> 上一章传送门

## 二、使用密码授权类型

本节将使用带有OAuth2密码授权的授权服务器，来测试它是否有效。

首先我们在postman通过之前写的创建客户端的接口创建一个客户端，其中authorizedGrantTypes这个参数，我们填上"password,authorization_code,refresh_token"分别代表密码授权模式，授权码授权模式以及支持刷新token。

创建成功后，我们的客户端就可以使用密码授权类型了。

怎么测试密码授权类型呢，我们可以通过请求/oauth/token端点请求令牌，这个接口是Spring Security自动为我们配置的，我们直接请求就可以，使用密码授权类型需要带上以下参数：

- grant_type，授权类型，这里填写password即可
- username:用户名
- password:用户密码
- scope:它们是所授予的权限
- clientId:客户端Id
- clientSecret:客户端密钥，注意这里的客户端密钥是加密前的密钥，不要直接把db存储的搬上来。

密码授权类型流程图如下：总计就是客户端直接使用资源所有者的凭据进行身份验证并获得访问令牌。

大家注意到除了访问令牌，我们还得到了一个刷新令牌，这个就是因为我们在创建客户端那会儿对

authorizedGrantTypes这个参数配置了refresh_token这个模式。

那么仔细观察上述响应中的令牌。使用Spring Security中的默认配置，令牌其实就是一个简单的UUID。接下来客户端可以使用这个令牌调用资源服务器暴露的资源，后面我们将会学习如何搭建资源服务器。

## 三、使用授权码授权类型

在之前讲解授权码授权类型的时候，我曾介绍给这是最常用的OAuth2授权类型之一。理解如何配置授权服务器以便使用这种授权类型非常重要，因为我们很可能会在实际的系统中面对这种需求。下图我们可以回顾一下授权码授权类型是如何工作的：

在授权码授权类型中，客户端会将用户重定向到授权服务器进行身份验证。用户直接与授权服务器交互，通过身份验证后，授权服务器会向客户端返回一个重定向URI。在回调客户端时，它还会提供一个授权码。客户端要使用该授权码获取访问令牌。

而我们刚刚注册的客户端的authorizedGrantTypes已经有了authorization_code这个模式，所以可以直接通过该客户端进行测试

启动程序后在浏览器中访问链接，如下面的代码片段所示。

```java
http://localhost:9090/oauth/authorize?response_type=code&client_id=f7n6ockwdb9zmayr
```

然后授权服务器会将用户重定向到登陆页面，具体的登录页面就是我们在ProjectConfig中配置的loginPage

```java
@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.cors().and()
//				.addFilterBefore(captchaCodeFilter, UsernamePasswordAuthenticationFilter.class)
				.logout()
				.logoutSuccessHandler(logoutSuccessHandler)
				.and()
				.rememberMe()
				//默认都为remember-me
				.rememberMeParameter("remeber-me")
				//cookieName一般设置复杂一些，迷惑别人(不容易看出)
				.rememberMeCookieName("remeber-me")
				//过期时间
				.tokenValiditySeconds(24 * 60 * 60 * 2)
				.and()
				.csrf().disable()
				.formLogin()
				.loginPage("/toLogin") //用户没有权限就跳转到这个页面
				.loginProcessingUrl("/login")//登录跳转页面，表单中的action
				.usernameParameter("uname")
				.passwordParameter("upassword")//传递的属性
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and()
				.apply(smsCodeSecurityConfig)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
				.mvcMatchers("/test/a/*","/oauth2/client/create").permitAll()
				.anyRequest().authenticated()
				.and()
				.sessionManagement()
				.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
				.sessionFixation().migrateSession()
				.maximumSessions(1).
				maxSessionsPreventsLogin(false)
				.expiredSessionStrategy(new CustomExpiredSessionStrategy());
	}
```

登陆后，授权服务器会明确要求用户提供授予或拒绝所请求的作用域。如下图所示

一旦对作用域进行了授权，授权服务器就会将用户重定向到重定向URI并提供一个访问令牌。以下代码片段显示了授权服务器将用户重定向到的URL。通过请求中查询参数观察客户端获得的访问码：

之后我们在postman通过授权码调用/oauth/token就可以获取访问令牌了：

需要注意的是，授权码只能使用一次。如果尝试再次使用相同的授权码调用/.oauth/token端点，则会收到以下代码片段中所显示的类似错误。只能通过请求用户再次登录来获得另一个有效的授权码：

## 四、使用客户端凭据授权类型

本节将讨论如何实现客户端凭据授权类型，在保护与特定用户无关且客户端需要访问的端点时，可以使用客户端凭据授权类型。假设打算实现一个返回服务器状态的端点，客户端可以调用此端点检查连接性，并最终向用户展示连接状态或错误信息。由于此端点仅仅表示客户端和资源服务器的交互，并且不涉及任何特定于用户的资源，因此客户端应该能够调用它而不需要用户进行身份验证。对于这样的场景，可以使用客户端凭据授权类型。

那么我们新建一个客户端，并且让它的授权类型给它设置上客户端凭据授权类型：

然后可以直接启动程序，调用/oauth/token端点来获得访问令牌：

注意：要**谨慎使用客户端凭据授权类型**。这种授权类型只要求客户端用其凭据。**应该确保它无法访问与需要用户凭据的流程相同的作用域**，例如我将一个客户端**同时设置客户端凭据授权类型和密码授权类型**，这样就**意味着客户端可以通过用户进行身份验证或仅使用自己的凭据来获得相同的令牌**，这肯定是不合理的，甚至是一个安全漏洞都不为过，因为这样会**让客户端可以访问客户的资源而不需要经过客户验证**。

## 五、使用刷新令牌授权类型

本节将讨论如何通过Spring Security开发的授权服务器来使用刷新令牌。当与其他授权类型一起使用时，刷新令牌提供了几个好处。可以使用带有授权码授权类型和密码授权类型的刷新令牌

如果希望授权服务器支持刷新令牌，则需要将刷新令牌授权添加到客户端的授权列表中。而我们一开始创建的客户端的authorizedGrantTypes已经包含refresh_token，所以我们使用该客户端通过密码授权类型访问/oauth/token接口，可以看到应用程序将刷新令牌添加到响应中。
