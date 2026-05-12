# 13、Spring Security 速成 - 实现过滤器（上）基础讲解
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/13.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

通过之前的学习，我们已经可以通过SpringSecurity完成一个差不多的RBAC管理框架，下面我们要学习的只是在应用层面不断加深去拓展可以应用的点，例如本次的过滤器，我们将学习基础的SpringSecurity的过滤器链，然后我会通过redis+短信验证码的这样一个拓展带大家学习如何将一个新的认证方式加入到SpringSecurity中，学习了过滤器，你就可以实现这一点。

## 二、过滤器概述

在Spring Security中，HTTP过滤器会委托应用于HTTP请求的不同职责。在之前学习中我们也经常提到过过滤器，不知道大家是否还记得Spring Security的那个框架图，大家可以发现最顶层就是一个个的过滤器，例如提到过的身份验证过滤器，它将身份验证职责委托给身份验证管理器。又比如授权过滤器会负责授权配置等等。通常**HTTP过滤器会管理必须应用于请求的每个职责。过滤器形成了职责链。过滤器会接受请求、执行其逻辑，并最终将请求委托给链中的下一个过滤器**。

## 三、在SpringSecurity架构中实现过滤器

### 3.1、过滤器链

首先是Spring Security默认的过滤器链，**其中数字就代表过滤器链的执行顺序**：

其中大家可能对UsernamePasswordAuthenticationFilter非常熟悉，它就是我们的认证过滤器：

默认匹配URL为/login且必须为POST请求。

Spring Security架构中的过滤器是典型的HTTP过滤器。可以通过javax.servlet包实现Filter接口来创建过滤器。对于其他任何HTTP过滤器，需要重写doFilter()方法来实现其逻辑。此方法会接收ServletRequest、ServletResponse和FilterChain作为参数。

- ServletRequest:表示HTTP请求。使用ServletRequest对象检索关于请求的详细信息。
- ServletResponse:表示HTTP响应。使用ServletResponse对象在将响应发送回客户但或顺着过滤器链更进一步执行之前修改该响应。
- FilterChain:表示过滤器链。使用FilterChain对象将请求转发给链中的下一个过滤器。

过滤器链表示过滤器的集合，这些过滤器会按照已经定义的顺序执行操作。Spring Security提供了一些过滤器实现和它们的预定义执行顺序。

> 不需要了解所有过滤器，因为可能不会从代码中直接接触到它们，但是我们需要链接过滤器链是如何工作的，并了解其中的一些实现。

### 3.2、在过滤器链中现有过滤器之前添加过滤器

考虑一个简单的场景，我们希望确保任何请求都有一个名为Request-id的头信息。假设应用程序使用这个头信息跟踪请求，并且这个头信息是必须的。同时，我们希望应用程序执行身份验证之前验证这些假设。身份验证过程可能涉及查询数据库或其他消耗资源的操作，如果请求的格式无效，则我们不希望应用程序执行这些操作。那么应该怎么做呢？要解决当前的这个需求，只需两个步骤，最终的过滤器链如下图。

实现该过滤器。创建一个RequestValidationFilter类，用于检查请求中是否存在所需的头信息。

**将该过滤器添加到过滤器链。要在配置类中完成此处理，需要重写configure()方法**。

那么首先我们自定义一个过滤器并实现doFilter(),然后检查Request-id头信息是否存在，如果存在则放行，不存在则返回400错误。

那么代码如下：

```java
package com.mbw.security.filter;
import cn.hutool.core.text.CharSequenceUtil;
import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
public class RequestValidationFilter implements Filter {
	@Override
	public void doFilter(ServletRequest request,
						 ServletResponse response,
						 FilterChain filterChain) throws IOException, ServletException {
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		HttpServletResponse httpResponse = (HttpServletResponse) response;
		String requestId = httpRequest.getHeader("Request-id");
		if(CharSequenceUtil.isBlank(requestId)){
			httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return;
		}
		filterChain.doFilter(request,response);
	}
}
```

然后在身份验证之前配置自定义过滤器，我们在配置类重写configure()方法，通过addFilterBefore()完成该操作：

```java
    @Override
	protected void configure(HttpSecurity http) throws Exception {
		http
		        .addFilterBefore(requestValidationFilter,BasicAuthenticationFilter.class)
		        .and()
				.csrf().disable()
				.formLogin()
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
				.anyRequest().hasRole("ADMIN");
	}
```

那么这样我们就成功的将自定义的过滤器加在了BasicAuthenticationFilter之前，也就是通过basic认证之前会先经过我们这个自定义的过滤器。

那么现在测试一下：

首先不带上Request-id这个请求头，报400

然后带上该请求头，请求通过：

### 3.3、在过滤器链中已有的过滤器之后添加过滤器

假设必须在身份验证过程之后执行一些逻辑。这方面的例子包括，在某些身份验证事件发生后通知不同的系统，或者只是为了达成日志记录和跟踪目的。

对于本示例而言，需要通过在身份验证过滤器之后添加一个过滤器来记录所有成功的身份验证事件。我们认为通过身份验证过滤器的是一个成功的身份验证事件，**并且希望记录它**。

那么我们首先定义一个通过basic认证后打印一条requestId请求头的日志的过滤器：

```java
package com.mbw.security.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
@Component
@Slf4j
public class AuthenticationLoggingFilter implements Filter {
	@Override
	public void doFilter(ServletRequest request,
						 ServletResponse response,
						 FilterChain filterChain) throws IOException, ServletException {
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		String requestId = httpRequest.getHeader("Request-id");
		log.info("Successfully authenticated request with id:{}" , requestId);
		filterChain.doFilter(request,response);
	}
}
```

老样子，同之前的类似代码将这个过滤器加在BasicAuthenticationFilter之后，这次我们通过addFilterAfter()完成该操作：

```java
    @Override
	protected void configure(HttpSecurity http) throws Exception {
		http
		        .addFilterBefore(requestValidationFilter,BasicAuthenticationFilter.class)
		        .addFilterAfter(authenticationLoggingFilter,BasicAuthenticationFilter.class)
		        .and()
				.csrf().disable()
				.formLogin()
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
				.anyRequest().hasRole("ADMIN");
	}
```

然后测试，我们通过认证后，可以看到控制台日志打印了一句：

你会发现执行了两次

这是因为我们将过滤器交给Spring管理，这样会让它自动加入到servlet的filter chain中，而spring security的config配置中又把filter注册到了spring security的容器中，因此在调用BasicAuthenticationFilter鉴权之前和鉴权之后先后会各执行一次。

那怎么解决呢，有两种

①不交给Spring管理，直接通过new的方式

这种简单粗暴，也很简单运用。但是有一个缺点，实际开发中可能其他地方也会使用该过滤器，这样就可能造成不便。

②通过加一个flag标记确保过滤器只运行一次，通过以下代码解决：

在进入该过滤器前，先检查是否已经有该标记，如果有，直接放行。

如果没有，将这个标记set进request，这样就可以有效防止重复执行：

```java
if (httpRequest.getAttribute(FILTER_APPLIED) != null) {
      chain.doFilter(httpRequest, httpResponse);
      return;
    }
　　httpRequest.setAttribute(FILTER_APPLIED, Boolean.TRUE);
```

我们在AuthenticationLoggingFilter应用：

```java
package com.mbw.security.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
@Component
@Slf4j
public class AuthenticationLoggingFilter implements Filter {
	private static final String FILTER_APPLIED = "__spring_security_myAuthenticationTokenGenericFilter_filterApplied";
	@Override
	public void doFilter(ServletRequest request,
						 ServletResponse response,
						 FilterChain filterChain) throws IOException, ServletException {
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		if (httpRequest.getAttribute(FILTER_APPLIED) != null) {
			filterChain.doFilter(request, response);
			return;
		}
		httpRequest.setAttribute(FILTER_APPLIED, Boolean.TRUE);
		String requestId = httpRequest.getHeader("Request-id");
		log.info("Successfully authenticated request with id:{}" , requestId);
		filterChain.doFilter(request,response);
	}
}
```

可以看到只执行了一次

当然其实还有第三种方法，这个我们后面会介绍

### 3.4、在过滤器链中另一个过滤器的位置添加一个过滤器

这个其实实战中应用的比较少，往往是我们不打算使用Spring的过滤器，通过自定义取而代之Spring的过滤器。

例如假设不打算使用HTTP Basic身份验证流程，而是要实现一些不同的处理。相较于使用用户名和密码作为应用程序对用户进行身份验证的输入凭据，这里需要应用另一种方法。可能会遇到的一些场景示例是：

- 基于用户身份验证的静态头信息值得标识。
- 使用对称密钥对身份验证请求进行签名。
- 在身份验证过程中使用一次性密码(OTP)。

接下来实现一个示例来展示如何应用自定义过滤器。为了保持示例得相关性和直观性，要将重点放在配置上，并考虑实现一个简单的身份验证逻辑。在我们得场景中，有一个静态得密钥值，它对所有的请求都是相同的。要进行身份验证，用户必须在Authorization头信息中添加正确的静态密钥值。

首先要实现名为StaticKeyAuthenticationFilter的过滤器类。这个类从属性文件中读取静态密钥的值，并验证Authorization头信息的值是否与该值相等。如果值相同，则过滤器会将请求转发给过滤器链中的下一个组件。如果不相等，则过滤器会将值401 Unauthorized设置为响应的HTTP状态，而不转发过滤器链中的请求。

```java
package com.mbw.security.filter;
import org.springframework.beans.factory.annotation.Value;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
public class StaticKeyAuthenticationFilter implements Filter {
	@Value("${authorization.key}")
	private String authorizationKey;
	@Override
	public void doFilter(ServletRequest request,
						 ServletResponse response,
						 FilterChain filterChain) throws IOException, ServletException {
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		HttpServletResponse httpResponse = (HttpServletResponse) response;
		String authentication = httpRequest.getHeader("Authorization");
		if (authorizationKey.equals(authentication)) {
			filterChain.doFilter(request, response);
		} else {
			httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		}
	}
}
```

一旦定义了过滤器，就可以使用addFilterAt()方法将其添加到过滤器链中BasicAuthenticationFilter类所在的位置。但请记住，在指定位置添加过滤器时，Spring Security并不会指定它是该位置上的唯一过滤器。可以在链中的相同位置添加更多的过滤器。在这种情况下，Spring Security不会保证这些操作的执行顺序。

> 提示：
>
> 建议不要在过滤器链的同一位置添加多个过滤器。当在同一位置添加更多的过滤器时，它们的使用顺序将不会被定义。有一个明确的调用过滤器的顺序是有意义的。有一个已知的顺序可以使应用程序更易于理解和维护。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .addFilterBefore(requestValidationFilter,BasicAuthenticationFilter.class)
            .addFilterAt(staticKeyAuthenticationFilter,BasicAuthenticationFilter.class)
            .addFilterAfter(authenticationLoggingFilter,BasicAuthenticationFilter.class)
            .and()
            .csrf().disable()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
            .anyRequest().hasRole("ADMIN");
}
```

此时测试，首先在authorization头输入错误的信息，发现401：

然后输入和配置文件相同的值：

你会发现响应虽然不同，但仍然是401，这是因为我们没有配置userDetailsService,甚至根本不存在用户的概念，我们只是相当于验证一个值，而一般场景绝对不会这么简单，常常需要一个userDetailsService。不过如果你访问一个不需要认证的接口，那还是可以的，例如下面这个获取验证码的接口：

## 四、Spring Security提供的Filter的实现

Spring Security提供了一些实现Filter接口的抽象类，可以为它们扩展过滤器定义。在扩展这些类时，他们还有助于为实现添加功能。例如，可以扩展GenericFilterBean类，它允许我们在合适的位置使用web.xml描述文件中所定义的初始化参数。一个扩展了GenericFilterBean的更有用的类是OncePerRequestFilter.在向链中添加过滤器时，框架并不会保证每个请求只调用它一次。不过，顾名思义，OncePerRequestFilter实现了确保每个请求只执行过滤器的doFilter()方法一次的逻辑。

还记得之前我们一个被重复执行的过滤器吗，我们讲了两种方法，现在我们使用第三种试试：

```java
package com.mbw.security.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
@Slf4j
public class AuthenticationLoggingFilter extends OncePerRequestFilter {
	@Override
	protected void doFilterInternal(HttpServletRequest httpRequest, HttpServletResponse httpResponse, FilterChain filterChain) throws ServletException, IOException {
		String requestId = httpRequest.getHeader("Request-id");
		log.info("Successfully authenticated request with id:{}" , requestId);
		filterChain.doFilter(httpRequest,httpResponse);
	}
}
```

然后删掉我们之前写的替换BasicAuthenticationFilter的StaticKeyAuthenticationFilter相关代码，当然，你也可以继续用这个验证，只是我觉得怪怪的，想用basic验证而已：

认证成功后，会到控制台发现只执行了一次日志，即只执行了一次doFilter()：

那么关于OncePerRequestFilter类的简要经验，它们会很有用。

- 它只支持HTTP请求，但这实际上也是我们一直使用的。它的有点是对类型进行强制转换，并且可以直接接收HttpServletRequest和HttpServletResponse请求。记住，使用Filter接口，就必须对请求和响应进行强制转换。
- 可以实现判定是否应用过滤器的逻辑。即使将过滤器添加到链中，我们也可能判定它不适用于某些请求。可以通过重写shouldNotFilter(HttpServletRequest)方法设置这一点。默认情况下，过滤器适用于所有请求。
- 默认情况下，OncePerRequestFilter不适用于异步请求或错误分发请求。可以通过重写shouldNotFilterAsyncDispatch()和shouldNotFilterErrorDispatch()方法来更改此行为。
