# 11、Spring Security 速成 - 配置权限以及相关限制（下）
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/6/11.html
- 分类：安全框架
- 分组：教程目录
## 一、前言

本章我们将承接上篇文章的项目为基础学习，所以没有搭建好项目的小伙伴请先去查看上一篇文章把项目理解并且搭建好，当然大家也可以用自己的方式进行搭建学习，不用啥都按部就班，尤其是编程这块儿，具有极大的灵活性，没准你的方法才是最适合的。但是对于后面的代码，我将以上篇搭建好的代码为架构基础进行展示。

## 二、在配置类中对请求进行权限限制

### 2.1、使用hasAuthority()和hasAnyAuthority()

记住，这一小节，我们是在配置类中进行配置，如果没有配置特定路径，是不能局部到接口上的，等后面的学习我们可以通过注解实现在接口级别上完成权限验证，那这里我们先通过配置类的方式实现权限控制。

我们在上一节中创建数据库的时候就已经创建了两个用户：刘备和张飞，其中刘备的角色是管理员和USER，拥有读写权限，张飞只是USER，只拥有读权限。

那么我们现在在配置类要求除了/login,/user/create以外其他所有请求都要write权限，该怎么去实现呢？

**很简单，我们可以通过hasAuthority()和hasAnyAuthority()方法**：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.csrf().disable()
            .logout()
            .and()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/login","/user/create").permitAll()
            .anyRequest().hasAuthority("write");
}
```

**我们可以将允许用户使用的权限名称作为hasAuthority()方法的参数来提供。应用程序首先需要对请求进行身份验证，然后根据用户的权限决定是否允许调用**。

然后通过张飞登录，首先张飞登录成功后会先通过successHandler去验证他的权限，发现有read权限，转至/user/hello.而这个接口又被我们配置类中写的hasAuthority拦截检查是否有write权限访问，然后发现张飞并没有write权限，所以报error,重定向springSecurity默认错误接口/error,即我们写的error.html:

我们从开发者工具也可看到张飞在请求/user/hello接口时由于没有足够的权限报了403 Forbidden.

**可以通过类似方式使用hasAnyAuthority()方法。该方法具有参数varargs:这样，它就可以接收多个权限名称。如果用户拥有作为方法参数提供的至少一个权限，应用程序就会允许其请求**。

例如我们将上例的hasAuthority(“write”)改为hasAnyAuthority(“write”,“read”),这样，张飞的请求就将被接受：

```java
@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable()
                .logout()
                .and()
				.formLogin()
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/login","/user/create").permitAll()
				// 登录、验证码允许匿名访问
				.anyRequest().hasAnyAuthority("read","write");
	}
```

### 2.2、使用access表达式

要根据用户权限指定访问权限，可以在实践中应用的第三种方法是access()方法。不过，access()方法更为通用。它会接收一个指定授权条件的Spring表达式（SpEL)作为参数。这种方法很强大，并且它不仅只适用于权限方面。然而与此同时增加了阅读和理解难度，出于这个原因，建议将它作为最后考虑选项，即仅当不能应用前面介绍的hasAuthority()和hasAnyAuthority()才使用它。

那么下面我们展示access方法配置端点访问，这里大家留意将之前的hasAuthority()和hasAnyAuthority()进行对比：

```java
@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable()
                .logout()
                .and()
				.formLogin()
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.and().httpBasic().and()
				.authorizeRequests()
				.antMatchers("/login","/user/create").permitAll()
				// 登录、验证码允许匿名访问
				.anyRequest().access("hasAuthority('write')");
	}
```

上面代码其实等价于之前的

```java
hasAuthority('write')
```

我们会发现如果将access()方法用于简单的需求，就会将语法变得复杂，这时还不如使用之前讲的两个方法。但是access()并非一无是处，我们现在在db中给authorities表增加2种权限，update和delete,然后将四个权限全部赋予ADMIN这个角色，然后增加一个用户我们取名叫关羽，给他赋予ADMIN角色。

然后看下面的配置代码，我们假设要求拥有读权限但是同时不能让有删除权限的用户访问资源，这时通过普通的hasAuthority或者hasAnyAuthority()很难解决，我们可以通过access表达式解决：

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    //声明用户必须拥有读权限而不是删除权限
    String expression = "hasAuthority('read') and !hasAuthority('delete')";
    http.csrf().disable()
            .logout()
            .and()
            .formLogin()
            .successHandler(successHandler)
            .failureHandler(failureHandler)
            .and().httpBasic().and()
            .authorizeRequests()
            .antMatchers("/login","/user/create").permitAll()
            .anyRequest().access(expression);
}
```

这时我们登录关羽，关羽有所有权限，但因为他有delete权限，所以不能访问资源，被转发至默认错误页面：

## 三、基于用户角色限制所有端点的访问

我们在上篇文章已经介绍了角色，知道了角色提供的名称与为权限提供的名称类似，这取决于我们自己。与权限相比，可以认为角色是细粒度的。无论如何，在后台，角色都是使用Spring Security中的相同接口表示的，即GrantedAuthority。在定义角色时，其名称应该以ROLE_前缀开头。在实现层面，这个前缀表明了角色和权限之间的区别。

先看下面的配置代码，我们仍然使用hasAuthority():

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
http.csrf().disable()
        .logout()
        .and()
        .formLogin()
        .successHandler(successHandler)
        .failureHandler(failureHandler)
        .and().httpBasic().and()
        .authorizeRequests()
        .antMatchers("/login","/user/create").permitAll()
        .anyRequest().hasAuthority("ROLE_USER");
}
```

这个时候登录张飞：

大家应该已经猜到答案了，就是上面说到的Spring Security将角色和权限均视作GrantedAuthority的成分，所以经过之前的文章，我们将ROLE_前缀的角色也放到了UserDetails的List中，所以我们可以通过hasAuthority(“ROLE_USER”)将ROLE_USER也通过类似权限控制的方式进行验证，但若是我换成如下代码：

```java
.anyRequest().hasAuthority("USER")
```

此时再登录张飞：

因为你ROLE_USER视为一种权限，而不是角色，那么你USER并不是一个权限，自然就识别不了，db都没有这个权限，张飞自然肯定没有，所以403了。

那么毕竟我们想更好的区分角色和权限，该怎么办呢，SpringSecurity给我们提供了相关接口，它们就是hasRole()和hasAnyRole(),但是它们的使用方法相较于hasAuthority()等方法不同的是：

我并没有加ROLE_前缀

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
http.csrf().disable()
        .logout()
        .and()
        .formLogin()
        .successHandler(successHandler)
        .failureHandler(failureHandler)
        .and().httpBasic().and()
        .authorizeRequests()
        .antMatchers("/login","/user/create").permitAll()
        .anyRequest().hasRole("USER");
}
```

此时登录张飞：

发现访问资源成功，我们发现hasRole()方法现在会指定允许访问端点的角色，并且参数没有ROLE_前缀。

我们可以通过源码找到答案

```java
public ExpressionInterceptUrlRegistry hasRole(String role) {
 return access(ExpressionUrlAuthorizationConfigurer.hasRole(role));
}
private static String hasRole(String role) {
 Assert.notNull(role, "role cannot be null");
 if (role.startsWith("ROLE_")) {
  throw new IllegalArgumentException(
    "role should not start with 'ROLE_' since it is automatically inserted. Got '"
      + role + "'");
 }
 return "hasRole('ROLE_" + role + "')";
}
```

可以看到，hasRole 的处理逻辑和 hasAuthority 似乎一模一样，不同的是，hasRole 这里会自动给传入的字符串加上 ROLE_ 前缀，所以我们的GrantedAuthority中的角色应该也加入ROLE_前缀，亦或者从db中查出来的角色一开始就应该带上该前缀，都是可以的。

但是要确保这样的设计，roles()方法提供的参数不能包含ROLE_前缀，否则会抛出异常：

然后就是对于角色，access表达式同样也支持role()的相关方法，这一点和authority()是类似的，这里不做赘述。

## 四、限制对所有端点的访问

可以使用permitAll()方法允许对所有请求的访问。denyAll()方法正好与permitAll()方法相反。即拒绝所有的请求

```java
@Configuration
public class ProjectConfig extends WebSecurityConfigurerAdapter {
  //...
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
		//使用denyAll()限制对每一个人的访问
        http.authorizeRequests().anyRequest().denyAll();
    }
}
```

实际上，该方法使用频率要小于其他方法，但是有的场合使得它成为必要的方法。下面来看2种场景

①假设有一个端点作为路径(path)变量来接收电子邮件地址。这里需要的是允许具有地址以.com结尾的变量值的请求。我们不希望应用程序接收电子邮件地址的任何其他格式。对于这个需求，可以使用一个正则表达式对匹配规则的请i去进行分组（后面会讲）,然后使用denyAll()方法只是应用程序拒绝所有的这些请求：

还可以设想一个如下图的应用程序，一些微服务实现了应用程序的用例，可以通过调用不同路径上可用的端点来访问这些用例。但是为了调用端点，客户端需要请求另一个被称为网关的服务。假设限制有个应用程序有2个网关分别称为网关A和网关B，如果客户端像访问/products/**路径，则请求网关A。但是对于/articles/**路径,客户端必须请求网关B。每个网关服务都被设计为拒绝所有对这些服务不支持的其他路径的请i去。这个简化的场景可以帮助我们理解denyAll()方法，在实际开发中，可以在更复杂的架构种发现类似的场景：
