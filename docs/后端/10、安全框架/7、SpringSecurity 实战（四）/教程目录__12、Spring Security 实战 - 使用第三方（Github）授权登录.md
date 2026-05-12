# 12、Spring Security 实战 - 使用第三方（Github）授权登录
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/12.html
- 分类：安全框架
- 分组：教程目录
（Github授权登录的具体操作在目录第三“章”）

## 一、OAuth2 简单概述

下面是《Spring Security 实战》书中的一段概述：

OAuth 是一个开放标准（现在所说的 OAuth 一般都是指 OAuth2，即 2.0 版本），可以理解为是一种协议，该标准允许用户让第三方应用访问该用户在某一网站上存储的私密资源（如头像、照片、视频等），并且在这个过程中无须将用户名和密码提供给第三方应用。通过令牌（token）可以实现这一功能，每一个令牌授权一个特定的网站在特定的时段内允许访问特定的资源。

OAuth 让用户可以授权第三方网站灵活访问它们存储在另外一些资源服务器上的特定信息，而非所有内容。对于用户而言，我们在互联网应用中最常见的 OAuth 应用就是各种第三方登录，例如：QQ授权登录、微信授权登录、下面要解释的Github 授权登录等等。

注意：这里所述的第三方应用是相对而言的。例如用户想通过 QQ 登录今日头条，这时相对于QQ而言，今日头条就是第三方应用，对今日头条而言，QQ就是第三方应用。当今日头条通过QQ授权登录时，QQ 不会把 用户名/密码 给今日头条，只会传一种 token 令牌，允许它访问 QQ用户中的一些信息（一般是只读信息）。

## 二、OAuth2 四种授权模式之授权码模式

OAuth2 协议一共支持四种不同的授权模式：`授权码模式`、简化模式、密码模式、客户端模式。下面解释一下最安全、使用最广泛的一种 OAuth2 权限模式——授权码模式。以下是授权流程图：

**1、** 用户点击登录链接（按钮），系统会将用户导入授权服务器的登录页面，对应着A（用户-》浏览器-》认证服务器响应给浏览器）；

**2、** 用户选择是否给予授权，这一阶段进行的是用户选择认证阶段，对应着B；

**3、** 如果用户同意授权，则授权服务器会将页面重定向到redirect_uri指定的地址，同时携带一个授权码参数，带着授权码去重定向，这个时候是向授权服务器请求令牌，在后端进行，在SpringSecurity中即对应着认证操作，对应着步骤C；

**4、** 授权服务器对参数进行校验之后，即认证成功后会返回AccessToken和RefreshToken，即Authentication，这个过程对应着E；

**5、** 通过了认证就可以向资源服务器请求资源了；

授权码模式被认为是最安全的一种模式，是因为这种模式的 Access Token 不会经过浏览器，是直接从项目的后端获取，并从后端发送到资源服务器上，这样就很大程度上减少了 Access Token 泄露的风险。

`redirect_uri` ：该参数表示在登录校验成功/失败后（例如Github校验成功或失败后），跳转的地址，跳转的时候，还会携带上一个授权码参数，开发者再根据这个授权码获取 Access Token。Spring Security 中跳转的地址应该为 `/login/oauth2/code/*`， * 表示的是第三方授权应用名，如需要github授权登录，那它的 redirect_uri 应该为 `/login/oauth2/code/github`。

## 三、Github 授权登录

### 准备工作

首先需要将第三方应用的信息注册到 Github 上。登录自己的Github账户，点击 Settings。

点击New OAuth app，添加新的应用。

需填写的信息概述：

- application name：应用名称
- Homepage URL：项目主页面
- Authorization callback URL：认证成功后的回调页面，默认的回调 URL 地址模版为 {baseUrl}/login/oauth2/code/{registrationId}，其中 registration 是ClientRegistration 的唯一标识符，则在接下来的 SpringBoot 项目中就不必提供回调接口了（但写上也无妨）。

以下是我测试的注册内容（然后点击注册）：

注册成功后会获取到两个参数，`Client ID` 和 `Client Secret`，保存这俩参数，在配置项目中需要使用。

### 创建 Spring Boot 项目

**1、** 需要的起步依赖；

**2、** 配置oauth-Client（application.yml）：；

```java
spring:
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: 57b238e8791efafaead6
            client-secret: 33b3e36f0e464a5c13426fe59e61230ef72a1a47
            redirect-uri: http://localhost:8080/login/oauth2/code/github
server:
  port: 8080
  servlet:
    context-path: /
```

**1、** 创建测试接口（TestController）；

```java
@RestController
public class TestController {
    @GetMapping("/test")
    public DefaultOAuth2User test(){
        System.out.println("Test Result~~~~");
        return (DefaultOAuth2User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
```

**1、** 创建SpringSecurity配置类（SecurityConfig）；

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .oauth2Login()
                .failureHandler((req,res,e)->{
                    res.setContentType("text/html;charset=utf-8");
                    PrintWriter out = res.getWriter();
                    out.print("认证失败");
                })
                .and()
                .cors()
                .configurationSource(this.corsConfigurationSource())
                .and()
                .csrf((config)->{
                    config.disable();
                })
                .build();
    }
    private CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.addAllowedHeader("*"); // 这个得加上，一些复杂的请求方式会带有header，不加上跨域会失效。
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.addExposedHeader("*");
        corsConfiguration.addAllowedOriginPattern("http://localhost:5173");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",corsConfiguration);
        return source;
    }
}
```

### Vue 测试代码

这里再提一嘴，不然前端部分的超链接地址看不懂：

后端配置使用 OAuth2Login 授权登录时，Spring Security 中有俩过滤器会开启——`OAuth2AuthorizationRequestRedirectFilter`、`OAuth2LoginAuthenticationFilter`。例如：重定向到Github提供的授权页面即是OAuth2AuthorizationRequestRedirectFilter过滤的；认证请求，授权成功跳转URL的即是OAuth2LoginAuthenticationFilter过滤的。

所以那授权登录按钮我写的地址是：`http://localhost:8080/oauth2/authorization/github`，OAuth2AuthorizationRequestRedirectFilter 会过滤掉它然后重定向到Github提供的授权页面…

```java
<script setup>
import {
        ref } from 'vue'
import axios from '../utils/index.js'
function test(){
    axios.get(/test,{
        withCredentials: true,   //设置跨域的时候传递cookie，需要服务端的配合
    }).then(res=>{
        console.log(res)
        content.value = res
    }).catch(err=>{
        console.log(666)
        console.log(err)
    })
}
</script>
<template>
    <div>
        <el-button type="info" round>
            <el-link href="http://localhost:8080/oauth2/authorization/github"> github </el-link>
        </el-button>
        <br><br>
        <button @click="test">发送测试请求</button><br><br>
    </div>
</template>
```

### 测试效果

这里不是实际的效果（实际效果应该是：点击"`http://localhost:8080/oauth2/authorization/github`"超链接后，会返回302，重定向到Github授权页面，授权成功后又会重定向到配置的 redirect_uri（`http://localhost:8080/login/oauth2/code/github?code=???&state=???`），这个时候就是关 OAuth2LoginAuthenticationFilter 的事了，这里会根据 redirect_uri 中请求参数携带的授权码 code，向Github授权服务器的https://github.com/login/oauth/access_token 接口去请求 Access Token，拿到AccessToken后，再向 https://api.github.com/user 地址发送请求，获取用户信息，前面是浏览器可见的，后面获取令牌是在后端完成的，是用户不可见的）。

下面是我遇到的一些疑问，问的ChatGpt的，如果有同样的疑虑可以看看：

测试中间会有跳转Github授权登录页面（https://github.com/login/oauth/authorize?..），请求 Access Token 也会访问Github（https://github.com/login/oauth/access_token），比较慢，我不耐烦就疯狂点，就报下面错了（大家可别学我）。
