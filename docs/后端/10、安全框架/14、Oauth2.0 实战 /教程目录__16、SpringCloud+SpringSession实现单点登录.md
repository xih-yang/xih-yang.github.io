# 16、SpringCloud+SpringSession实现单点登录
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/16.html
- 分类：安全框架
- 分组：教程目录
## Session不共享问题

对于登录而言，通常情况下我们喜欢把登录信息存储到服务器的Session中，这种存储方式在单体应用中没有问题，但是在分布式/集群环境中会存在Session丢失问题，如下图：

解决方案也有很多，在《[微服务认证授权方案](/zhuanlan/security/oauth2/2/8.html)》一文中有相关的解决方案分析，这里不在重复赘述，本文章的目的是使用SpringSession+Redis来解决分布式系统中的单点登问题

## SpringSession的认证方案

这种认证方案还是使用的是session,只不过是将Session统一存储到Redis中实现session共享，各个服务可以从Redis中获取Session得到认证信息，然后做身份检查，权限校验等工作，当然整个流程我们可以自己实现，但是如何把session存储到Redis以及从Redis中取出Session是一个麻烦的事情，Spring提供了解决方案`SpringSession`

SpringSession干的工作就是修改getSession和setSession方法基于Redis存取Session,同时要注意的是Session是通过Cookie传递sessionid的，如果要让多个服务都能接受到sessionid拿到session，需要把cookie的存储域扩大，如有三个系统“auth.mall.com”,“goods.maill.com”,“stock.mall.com”,那我们需要把domian设置成“mall.com”，这样一来浏览器带着cookie请求任何一个系统都可以获取到sessionid，然后从Redis中获取Session。

ps:如果您还不知道session和cookie的执行流程，请先去查查资料

## SpringSession入门

[官网文档在这](https://docs.spring.io/spring-session/docs/2.1.13.RELEASE/reference/html5/guides/boot-redis.html)

这里我们使用SpringBoot应用为例，我们需要导入`spring-session-data-redis`依赖，Spring Boot 会自动创建了一个名为springSessionRepositoryFilter的Filter，它负责更换原生的HttpSession为自定义实现，比如基于Redis实现

### 1.搭建项目，集成SpringSession

这里是以SpringBoot为例，你需要搭建一个SpringBoot的应用，然后导入SpringSession整合Redis的依赖

```java
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.5.RELEASE</version>
</parent>
<dependencies>
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-data-redis</artifactId>
        <exclusions>
            <exclusion>
                <groupId>io.lettuce</groupId>
                <artifactId>lettuce-core</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>redis.clients</groupId>
        <artifactId>jedis</artifactId>
    </dependency>
    <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

data-redis默认基于lettuce实现，我这里更换成了jedis

### 2.配置SpringSession存储方式

然后把session配置存储类型为Redis，以及配置Redis链接信息

```java
#server.servlet.session.timeout =＃会话超时。如果未指定持续时间后缀，则使用秒。
spring:
  session:
    store-type: redis
  redis:
    host: localhost
    port: 6379
    选择redis的数据库的分库
    database: 0
    password: 123456
   redis连接池配置
    jedis:
      pool:
        max-idle: 10
        min-idle: 5
        max-active: 100
        max-wait: 3000
        timeout: 6005
```

### 3.SpringSession的Java配置

最后编写SpringSesson配置类，通过`@EnableRedisHttpSession` 注解开启SpringSession ，通过该注解，SpringSession会创建一个Servlet过滤器，该过滤器用Spring 定义的Session替换HttpSession 实现Redis存储。

```java
//开启SpringSession，基于Redis存储，maxInactiveIntervalInSeconds是session失效时间
@EnableRedisHttpSession(maxInactiveIntervalInSeconds=1800)
public class SpringSessionConfig {
}
```

注意：该配置类需要被@SpringBootApplication扫描到

### 4.Session存储实体类测试

实体类，需要实现Serializable接口

```java
public class VipUser implements Serializable  {
	 private Long id;
	 private String password;
	 private String nickName;
	 ...省略...
}
```

使用sesson存取一个User对象

```java
@RestController
public class LoginController {
    @RequestMapping("/login")
    public void login(HttpSession session){
        VipUser user = new VipUser();
        user.setId(1L);
        user.setNickName("王大锤");
        user.setPassword("123456");
        String key = "user";
        //添加属性到Session
        session.setAttribute(key,user);
        //从sesson中取出属性值
        VipUser userFromSession = (VipUser)session.getAttribute(key);
        System.out.println(userFromSession.getId()+" , "+userFromSession.getNickName()+" , "+userFromSession.getPassword());
    }
}
```

上面的代码很简单，使用session存储一个user ， 启动好Redis服务器，使用Postmain访问 /login ,观察Redis中的数据

Redis效果如下：

看到这个效果，说明session确实存储到了Redis，并且可以正常的完成存取操作。

### SpringSession的自定义配置

### 1.定义Redis序列化方式

SpringSession把值存储到Redis中默认情况下使用的是JDK的序列化方式，它要求我们存储的实体类需要实现Serializable接口，我们希望Redis以一种更友好更通用的方式去存储数据，即：JSON，我们可以通过定义序列化器来实现JSON方式的数据存储

```java
//开启SpringSession，基于Redis存储，maxInactiveIntervalInSeconds是session失效时间
@EnableRedisHttpSession(maxInactiveIntervalInSeconds=1800)
public class SpringSessionConfig {
	/**
	 * 更换序列化器，使用JSON的序列化器
	 */
	//@Bean("springSessionDefaultRedisSerializer")
	public RedisSerializer setSerializer(){
		return new GenericJackson2JsonRedisSerializer();
	}
}
```

### 2.定义cookie的序列化器

在前面我们讨论过，在分布式环境中，一个系统由多个子系统组成，如果要实现单点登录就要实现cookie跨域共享，否则在不同的子系统中是获取不到Session的，我们可以通过设置cookie的domain来扩大cookie的作用域，比如：有三个子系统分别是“auth.mall.com”,“goods.mall.com”,“stock.mall.com”，那么我们把cookie的domain设置为“mall.com”，那三个子系统就都可以获取到cookie,从而三个子系统都可以获取到相同的session了。

定义CookieSerializer 序列化器，如下：

```java
//开启SpringSession，基于Redis存储，maxInactiveIntervalInSeconds是session失效时间
@EnableRedisHttpSession(maxInactiveIntervalInSeconds=1800)
public class SpringSessionConfig {
	/**
	 * 更换序列化器
	 */
	//@Bean("springSessionDefaultRedisSerializer")
	public RedisSerializer setSerializer(){
		return new GenericJackson2JsonRedisSerializer();
	}
	/**
	 * 设置cookie域
	 */
	@Bean
	public CookieSerializer cookieSerializer(){
		DefaultCookieSerializer cookieSerializer = new DefaultCookieSerializer();
		//cookieSerializer.setCookieMaxAge();
		cookieSerializer.setCookieName("mysession");	//cookie的名字
		cookieSerializer.setDomainName("mall.com");		//cookie的域
		cookieSerializer.setUseHttpOnlyCookie(false);	//只是支持http
		return cookieSerializer;
	}
}
```

### 3.测试

文章结束，最后附上一张相对完整的分布式应用登录的流程图，希望对你有所帮助
