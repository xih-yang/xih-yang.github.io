# 08、Spring Security 入门 - 访问控制 url 匹配
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/8.html
- 分类：安全框架
- 分组：教程目录
在前面讲解了认证中所有常用配置，主要是对 http.formLogin() 进行操作。而在配置类中 http.authorizeRequests()主要是对 url 进行控制，也就是我们所说的授权（访问控制）。http.authorizeRequests() 也支持连缀写法，总体公式为：

**url 匹配规则.权限控制方法**

通过上面的公式可以有很多 url 匹配规则和很多权限控制方法。 这些内容进行各种组合就形成了 Spring Security 中的授权。

在所有匹配规则中取所有规则的交集。配置顺序影响了之后授权效果，越是具体的应该放在前面，越是笼统的应该放到后面。

### 1.anyRequest()

在之前认证过程中我们就已经使用过 anyRequest()，表示匹配所 有的请求。一般情况下此方法都会使用，设置全部内容都需要进行认证

代码示例：

```java
anyRequest().authenticated();
```

### 2.antMatcher()

方法定义如下：

```java
public C antMatchers(String... antPatterns)
```

参数是不定向参数，每个参数是一个 ant 表达式，用于匹配 URL规则
规则如下：

```java
? 匹配一个字符
* 匹配 0 个或多个字符
** 匹配 0 个或多个目录
```

在实际项目中经常需要放行所有静态资源，下面演示放行 js 文件夹下所有脚本文件

```java
.antMatchers("/js/**").permitAll()
```

还有一种配置方式是只要是.js 文件都放行

```java
antMatchers("/**/*.js").permitAll()
```

### 3.regexMatchers()

使用正则表达式进行匹配。和 antMatchers()主要的区别就是参数，antMatchers()参数是 ant 表达式，regexMatchers()参数是正则表达式

演示所有以.js 结尾的文件都被放行。

```java
.regexMatchers(".+[.]js").permitAll()
```

无论是 antMatchers()还是 regexMatchers()都具有两个参数的方法，其中第一个参数都是 HttpMethod，表示请求方式，当设置了 HttpMethod 后表示只有设定的特定的请求方式才执行对应的权限设置

枚举类型 HttpMethod 内置属性如下：

### 4.mvcMatchers()

mvcMatchers()适用于配置了 servletPath 的情况。

servletPath 就是所有的 URL 的统一前缀。在 SpringBoot 整合 SpringMVC 的项目中可以在 application.properties 中添加下面内容设置 ServletPath

```java
spring.mvc.servlet.path= /dqcgm
```

在 Spring Security 的配置类中配置.servletPath()是 mvcMatchers() 返回值特有的方法，antMatchers()和 regexMatchers()没有这个方法。在 servletPath()中配置了 servletPath 后，mvcMatchers()直接写 Spring MVC 中@RequestMapping()中设置的路径即可

```java
.mvcMatchers("demo").servletPath("/dqcgm").permitAll()
```

如果不习惯使用 mvcMatchers()也可以使用 antMatchers()，下面代码和上面代码是等效的

```java
antMatchers("/dqcgm/demo").permitAll()
```
