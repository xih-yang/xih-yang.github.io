# 12、Spring Security 速成 - 配置权限:应用限制
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/12.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

之前讲解了如何基于权限和角色配置访问。但是其中只应用了针对所有端点的配置。本章将介绍如何对特定的请求分组应用授权约束。在生产环境的应用程序中，不太可能对所有请求应用相同的规则。其中将具有只有某些特定用户才能调用的端点，而其他端点则可能每个用户都可以访问。根据业务需求，每个接口都有自己的自定义授权配置。

要选择应用授权配置的请求，可以使用匹配器方法。Spring Security提供了3种类型的匹配方法。

- MVC匹配器：将MVC表达式用于路径以便选择端点。
- Ant匹配器：将Ant表达式用于路径以便选择端点。
- regex匹配器：将正则表达式(regex)用于路径以便选择端点。

## 二、使用MVC匹配器方法选择端点

### 2.1、对单个请求无请求方法的匹配

首先看一个简单的示例，我们要创建一个暴露两个端点的应用程序，这两个端点是/hello和/xiao。我们希望确保只有ADMIN角色的用户才能调用/hello端点。类似地，只有USER角色的用户才能调用/xiao端点。

```java
package com.mbw.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class HelloController {
    @RequestMapping("/hello")
    public String hello(){
        return "hello world";
    }
    @GetMapping("/xiao")
    public String xiao(){
     return "纳西妲我抽爆！";}
}
```

然后我们就着上次搭建好的程序以及数据继续我们的学习，为了让指定接口具有特定的角色才能调用，我们需要使用mvcMatchers()方法，下面代码就是配置类中使用的示例：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
http
        .csrf().disable()
        .formLogin()
        .successHandler(successHandler)
        .failureHandler(failureHandler)
        .and().httpBasic().and()
        .authorizeRequests()
        .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
        .mvcMatchers("/hello").hasRole("ADMIN")
        .mvcMatchers("/xiao").hasRole("USER");
}
```

我们接下来通过张飞这个用户认证通过后访问/xiao这个端点，发现可以访问通过，因为张飞角色只有USER。

但是张飞并没有ADMIN这个角色，我们访问/hello端点,会发现报403,说明配置此时生效。

但是我们拿关羽访问该端点，关羽是三个角色都有,所以可以访问该端点

然后我们现在仍然是刚才的配置，我们新加上一个端点：

```java
@GetMapping("/giao")
public String giao(){
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String name = authentication.getName();
    return "giao,"+name;
}
```

这时你不去登陆直接访问该接口，你会发现你能请求的通：

ps:anonymousUser是因为未经任何认证，而接口又被放行，所以安全上下文没有任何认证用户信息，所以显示anonymousUser匿名用户。

因为我们的配置中只有

**那么对于其他的请求，如果没有额外配置，默认情况下任何人任何权限都可以访问它，等同于permitAll()**.在这种情况下，Spring Security不会进行身份验证，不过你如果硬要进行身份验证也是可以的，框架也会对其进行评估，例如你输入正确的凭据，框架会显示正确的回复，但是凭据不正确，框架也会返回对应的错误，这个我们通过basic登录展示：

可以看到仍然会显示张飞的名字，说明框架会理会该请求并进行评估，但若是没有提供身份凭据，你也可以访问没做限制的请求而已。当然若你提供错误的身份凭据，框架理所当然会返回401:

那么回到MVC匹配器上，**我们之前调用的是mvcMatchers(String… patterns)这个方法，这意味着我们不仅可以像刚才一样对单一请求匹配某个授权规则，我们还可以指定多个端点同时使用相同的授权规则**。

### 2.2、对单个请求有请求方法的匹配

当然，有时我们还需要指定HTTP方法，而不仅仅是路径，这就要用到MVC匹配器的另一种方法：

mvcMatchers(HttpMethod method,String… patterns),它允许制定要应用限制的请求方法和路径，这一点对同一路径不同请求方法的端点会非常好用，例如我们现在增加两个路径相同但是所需请求方法不同的接口：

```java
@PostMapping("/a")
public String postEndpointA(){
    return "a";
}   
@GetMapping("/a")
public String getEndpointA(){
    return "a";
}
```

然后假设现在需要让post方法的/a请求需要经过认证，而get的不用。我们可以这样配置：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
        .mvcMatchers(HttpMethod.POST,"/a").authenticated()
            .mvcMatchers(HttpMethod.GET,"/a").permitAll();
}
```

我们现在来到Postman通过get方法调用/a并且使用No Auth的方式请求，发现无需认证也可以请求

但若是改为post方法的/a,如果还是no Auth，则报401：

现在认证通过后再访问，发现可以访问：

### 2.3、对多个路径的匹配

有时我们的controller会在类上加入@RequestMapping给该类的所有接口加上统一前缀路径，此时假设我们对这个类的所有接口需要假设只有ADMIN角色访问，我们总不能真的把一个个路径用逗号隔开写上去，太麻烦了。 Spring MVC从Ant中借用了路径匹配语法，这使得我们可以使用**操作符去匹配以某一路径开始的所有路径请求。

我们新建一个controller

```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/test")
public class TestController {
	@GetMapping("/xiao")
	public String xiao(){
     return "纳西妲我抽爆！";}
	@GetMapping("/giao")
	public String giao(){
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String name = authentication.getName();
		return "giao,"+name;
	}
	@GetMapping("/a")
	public String getEndpointA(){
		return "a";
	}
	@GetMapping("/a/b")
	public String getEndpointAB(){
		return "ab";
	}
}
```

我们现在假设对该controller下所有的接口要求只允许有ADMIN角色的才能访问,我们可以使用如下匹配方法：

```java
.mvcMatchers("/test/xiao","/test/giao","/test/a","/test/a/b").hasRole("ADMIN")
```

但是这样太过于累赘，万一接口很多呢？我们可以通过MVC路径匹配表达式中的**解决

```java
.mvcMatchers("/test/**").hasRole("ADMIN")
```

你会发现带有/test路径的所有接口必须要有ADMIN权限才能访问，若没有则报403

而拿关羽则可以通过：

如前面的示例所示，操作符可以指向任意数量的路径名。可以像上一个实例中所做的那样使用它，以便可以用具有已知前缀的路径来匹配请求。还可以在路径中间使用它指向任意数量的路径名，或者指向以特定模式（比如/a/**/c)结束的路径。因此，/a/**/c不仅可以匹配/a/b/c,还可以匹配/a/b/c/d/b/c和/a/b/c/d/c等等，如果你想匹配一个路径名，那么可以使用单个*。例如，a/*/c将匹配/a/b/c和/a/d/c等等。而不是/a/b/d/c。

### 2.4、当端点路径中带有路径变量的匹配

我们在get请求通常会使用路径变量，所以实际上为这类请求应用授权规则会非常有用。甚至可以应用指向路径变量值的规则。并且当实际运用的时候，搭配之前讲过的denyAll()会使用途和扩展性非常高。

例如下面这个带有路径变量的端点

```java
@GetMapping("/product/{code}")
public String productCode(@PathVariable String code){
    return code;
}
```

假设我们只让该请求路径变量仅包含数字时候才接受调用，其他所有请求均不能通过请求。

**当使用带有正则表达式的参数表达式时，请确保在参数名称、冒号(:)和正则表达式之间没有空格**，如下代码

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
http
.csrf().disable()
.formLogin()
.successHandler(successHandler)
.failureHandler(failureHandler)
.and().httpBasic().and()
.authorizeRequests()
.antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
.mvcMatchers("/test/product/{code:^[0-9]*$}").permitAll()
.anyRequest().denyAll()
}
```

此时调用端点，假设code=1234a，不符合全部都是数字，报401：

然后再次调用端点，code=12345,发现调用通过：

关于使用MVC匹配器进行路径匹配的通用表达式如下表：

表达式
描述

/a
仅匹配路径/a

/a/*
操作符*会替换一个路径名。在这种情况下，它将匹配/a/b或/a/c，而不是/a/b/c

/a/**
操作符**会替换多个路径名。在这种情况下，/a以及/a/b和/a/b/c都是这个表达式的匹配项

/a/{param}
这个表达式适用于具有给定路径参数的路径/a

/a/{param:regex}
只有当参数的值与给定正则表达式匹配时，此表达式才应用于具有给定路径参数的路径/a

## 三、使用Ant匹配器选择用于授权的请求

使用Ant匹配器的3种方法如下：

- antMatchers(HttpMethod method,String patterns):允许指定应用限制的HTTP方法和指向路径的Ant模式。如果希望对同一组路径的不同HTTP方法应用不同的限制，则此方法非常有用。
- antMatchers(String patterns):如果只需要应用基于路径的授权限制，则这一方法使用起来更加简单。这些限制会自动适用于任何HTTP方法。
- antMatchers(HttpMethod method)：他等同于antMatchers(httpMethod,“/**”)，允许特定的HTTP方法，而不考虑路径。

**MVC匹配器与Ant匹配器哪个好用？**

**MVC匹配器指的是Spring应用程序如何理解将请求与控制器相匹配。有时多个路径可以被Spring解析为匹配相同的操作**。

例如：如果在路径之后添加一个/,**那么指向相同操作的任何路径(例如/hello)都可以由Spring解析**。在这种情况下，/**hello和/hello/会调用相同的方法。如果使用MVC匹配器并且为/hello路径配置安全性，则它会自动使用相同的规则保护/hello/路径/**。这会产生巨大的影响！开发人员如果不知道这一点，**并且使用Ant匹配器，则可能会在毫不知情的情况下让路径不受保护**。

下面以一个示例说明。

```java
@RestController
public class HelloController {
    @RequestMapping("/hello")
    public String hello(){
        return "hello world";
    }
}
```

### 3.1、使用MVC匹配器的配置类

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
            .mvcMatchers( "/hello").authenticated();
            //.antMatchers( "/hello").authenticated();
}
```

使用http://localhost:9090/hello并且不认证测试：

使用http://localhost:9090/hello/并且不认证测试：发现仍然401,这说明之前的结论是正确的，由于/hello和/hello/指向相同的操作，均可以由Spring解析，所以MVC匹配器同样也会保护/hello/这个路径

### 3.2、使用Ant匹配器的配置类

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
            //.mvcMatchers( "/hello").authenticated();
            .antMatchers( "/hello").authenticated();
}
```

不进行身份验证访问http://localhost:9090/hello

不进行身份验证访问http://localhost:8080/hello/

注意，此时居然访问成功了，所以Ant匹配器的粒度比较细，会出现我们不期待的结果。还需要为该路径再配置限制，所以平时使用MVC匹配器就可以了。

实际上，**Ant匹配器会为模式精确地应用给定的Ant表达式，但它无法触及Spring MVC的精细功能**。在本示例中，/hello不会作为Ant表达式应用于/hello路径。如果还想保护/hello/路径，**则必须单独添加它，或者编写一个匹配它的Ant表达式**。

## 四、使用正则表达式匹配器选择用于授权的请求

可以使用正则表达式表示字符串的任何格式，因此它们提供了无限的可能性。但缺点是难以阅读，即使应用于简单的场景也是如此。

实现正则表达式匹配器的两种方法如下：

- regexMatchers(HttpMethod method,String regex):同时指定应用限制的HTTP方法和指向路径的正则表达式。如果希望对同一组路径的不同HTTP方法应用不同的限制，则此方法非常有用。
- regexMatchers(String regex):如果只需要应用基于路径的授权限制，该方法使用起来会更加简单。这些限制将会自动适用于任何HTTP方法。

以一个简单的示例说明：

```java
@RestController
public class VideoController {
	@GetMapping("/video/{country}/{language}")
	public String video(@PathVariable String country,
						@PathVariable String language) {
		return "Video allowed for " + country + " " + language;
	}
}
```

当需要编写更复杂的规则，最终指向更多路径模式和多个路径变量值时，编写一个正则表达式匹配器的方式会更加容易。例如：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/home","/toLogin","/login", "/user/create", "/kaptcha", "/smsCode", "/smslogin").permitAll()
.regexMatchers(".*/(us|uk|ca)+/(en|fr).*").authenticated()
            //配置用户需要具有ADMIN角色才能访问的其他路径
            .anyRequest().hasRole("ADMIN");
}
```

该配置限制了国家只能要求us/uk/ca,语言只能是en/fr,所以此时通过US国家和en语言可以调用，但若是FR国家和fr语言则不能调用，我们拿张飞进行测试：

由于张飞不具有ADMIN用户，且/video/FR/fr并不被正则匹配器所匹配，所以被拦截并报403.

**正则表达式是功能强大的工具，可以使用它们指向任何指定需求的路径。但是由于正则表达式难以阅读，并且可能变得很长，因此它们是我们的最后选择。只有当MVC和Ant表达式不能为所面临的问题提供解决方案时，才使用它们**。
