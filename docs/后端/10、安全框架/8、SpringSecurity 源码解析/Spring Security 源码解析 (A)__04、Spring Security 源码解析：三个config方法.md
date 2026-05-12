# 04、Spring Security 源码解析：三个config方法
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/19.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (A)
本章节将以实际公司中对Spring Security的应用为例，讲解配置Spring Security的三个configure方法。下图是对Spring Security的配置。

### Spring Security的三个configure方法

Spring Security配置中有三个configure方法，主要针对三个configure的主要作用以及它们分别在什么时候被加载做讲解。

**1、** configure(AuthenticationManagerBuilderauth)；

**2、** configure(HttpSecurityhttp)；

**3、** configure(WebSecurityweb)；

讲源码肯定是基于你对Spring Security有了一定的认知的基础上做讲解的，因此默认你已经知道了在创建springSecurityFilterChain的时候，会去调用WebSecurityConfigurerAdapter的init、configure、performBuild等方法。如果你还不知道，可以翻看前面几篇文章，先对Spring Security有个整体的认知。

**configure(AuthenticationManagerBuilder auth)**

主要作用：配置自定义的身份验证逻辑实现

加载时机：

可以看到configure(AuthenticationManagerBuilder auth)是在WebSecurityConfigurerAdapter的init方法中被调用的！

**configure(HttpSecurity http)**

主要作用：配置哪些请求是否需要过滤以及配置自定义的过滤器等等

加载时机：

可以看到configure(HttpSecurity http)也是在WebSecurityConfigurerAdapter的init方法中被调用的，但是是先调用完了configure(AuthenticationManagerBuilder auth)，之后在调用configure(HttpSecurity http)方法！

**configure(WebSecurity web)**

主要作用：web应用的全局配置，常用于静态资源的处理配置

加载时机：

可以看到configure(WebSecurity web)是在调用configure方法时，循环遍历this.configurers集合中的配置类，调用配置类的configure方法时被调用的。

**因此，三个configure方法被调用的先后顺序依次为：**

**configure(AuthenticationManagerBuilder auth)、configure(HttpSecurity http)、configure(WebSecurity web)**

### 后续篇幅摘要

后续篇章主要讲解 Spring Security用户登录验证是如何实现的、如何自定义过滤器、自定义的过滤器是如何生效的
