# 12、SpringCloud+Security+Oauth2授权 - 资源服务器配置
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/12.html
- 分类：安全框架
- 分组：教程目录
Oauth2分为授权服务和资源服务，[上一章节](/zhuanlan/security/oauth2/2/11.html)我们对AuthServer做了Oauth2的授权服务配置，这一章节我们来配置资源服务器Resource1Server

### 1.概述Oauth2资源服务配置

资源服务器也需要导入oauth2的依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-oauth2</artifactId>
</dependency>
```

当客户端(web端，mobile移动端)带着Token向资源服务器发起请求获取资源,资源服务器需要对请求中的Token进行校验以及对资源进行授权，如果Token校验和授权都通过即可返回相应的数据给客户端,那么，资源服务器配什么？

Oauth2提供的资源服务配置类为ResourceServerConfigurerAdapter ，它实现与ResourceServerConfigurer 接口，提供了两个configure方法，源码如下：

```java
**
 * @author Dave Syer
 *
 */
public class ResourceServerConfigurerAdapter implements ResourceServerConfigurer {
   @Override
   public void configure(ResourceServerSecurityConfigurer resources)
 throws Exception {
      }
   @Override
   public void configure(HttpSecurity http) throws Exception {
      http.authorizeRequests().anyRequest().authenticated();
   }
}
```

**注意上面是源码，别乱拷贝，解释一下**：

- ResourceServerSecurityConfigurer : 第一个configure方法的参数，它是资源服务安全配置，比如Token该如何校验就是通过它来配置的
- HttpSecurity ：第二个configure方法的参数，用作WEB安全配置，在学习Security基础的时候我们就接触过他

### 2.资源服务器配置实战

改造“security-resource-server” ，增加资源服务器器配置类

```java
//资源服务配置
@Configuration
@EnableResourceServer   //开启资源服务配置
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {
    //配置资源id ,对应oauth_client_details表中配置的resourceIds
    //一个资源ID可以对应一个资源服务器，如果Token中不包含该资源ID就无法访问该资源服务器
    public static final String RESOURCE_ID = "res1";
    @Bean
    public TokenStore tokenStore(){
        //return new InMemoryTokenStore();
        return new JwtTokenStore(jwtAccessTokenConverter());
    }
    //JWT令牌校验工具
    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter(){
        JwtAccessTokenConverter jwtAccessTokenConverter = new JwtAccessTokenConverter();
        //设置JWT签名密钥。它可以是简单的MAC密钥，也可以是RSA密钥
        jwtAccessTokenConverter.setSigningKey("123");
        return jwtAccessTokenConverter;
    }
    //资源服务器安全性配置
    @Override
    public void configure(ResourceServerSecurityConfigurer resources) throws Exception {
        //资源ID，请求中的Token必须有用该资源ID的访问权限才可以访问该资源服务器
        resources.resourceId(RESOURCE_ID);
        //指定TokenStore，使用JWT校验
        resources.tokenStore(tokenStore());
        //无状态
        resources.stateless(true);
        //验证令牌的服务，令牌验证通过才允许获取资源，使用远程校验
        //resources.tokenServices(resourceServerTokenServices());
    }
    //资源服务令牌验证服务,通过远程校验令牌
    /**
    @Bean
    public ResourceServerTokenServices resourceServerTokenServices(){
        //使用远程服务请求授权服务器校验token ， 即：资源服务和授权服务器不在一个主机
        RemoteTokenServices services = new RemoteTokenServices();
        //授权服务地址 , 当浏览器访问某个资源时就会调用该远程授权服务地址去校验token
        //要求请求中必须携带token
        services.setCheckTokenEndpointUrl("http://localhost:3000/oauth/check_token");
        //客户端id，对应认证服务的客户端详情配置oauth_client_details表中的clientId
        services.setClientId("webapp");
        //密钥，对应认证服务的客户端详情配置的秘钥
        services.setClientSecret("secret");
        return services;
    }
	*/
    //SpringSecurity的相关配置
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                //校验scope必须为all ， 对应认证服务的客户端详情配置的clientId
                .antMatchers("/**").access("#oauth2.hasScope('all')")
                //关闭跨域伪造检查
                .and().csrf().disable()
                //把session设置为无状态，意思是使用了token，那么session不再做数据的记录
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
    }
}
```

- resources.tokenStore(tokenStore()) ：这是在配置Token的校验方式，使用的是JwtTokenStore，JWT自校验的方式，当然这里也可以使用resources.tokenServices指定一个RemoteTokenServices 远程校验方案，这种方案的流程是当请求到达资源服务器，资源服务会带着请求中的token，向认证服务器发起远程校验(/oauth/check_token) ，可想而知性能不怎么好。
- resources.resourceId(RESOURCE_ID)：这个是配置资源服务器ID，意思是访问这个资源服务器的请求中的Token必须包含这个资源ID的访问权限
- .antMatchers("/**").access("#oauth2.hasScope(‘all’)")：意思是Token必须拥有all的授权访问才可以访问到资源服务器

注意：这里在配置类上开启了@EnableGlobalMethodSecurity(prePostEnabled = true)，因为我这里需要使用方法授权的方式指明我们的controller方法需要什么样的权限才能访问，当然也可以使用web授权的方式(回顾web授权和方法授权)

### 3.编写controller

controller就是具体的资源了，我们的方法使用了注解授权

```java
@RestController
public class ResourceController {
    @RequestMapping("/employee/list")
    //这是一个测试方法，如果资源服务器对token校验通过就能够访问该资源
    @PreAuthorize("hasAnyAuthority('employee:list')")
    public String list(){
        return "您的token验证通过,已经访问到真正的资源 employee:list";
    }
    @RequestMapping("/employee/add")
    //这是一个测试方法，如果资源服务器对token校验通过就能够访问该资源
    @PreAuthorize("hasAnyAuthority('employee:add')")
    public String add(){
        return "您的token验证通过,已经访问到真正的资源 employee:add";
    }
}
```

该Controller作为测试返回数据，当客户端请求“oauth-resource”过来，如果Token校验成功，将会看到"您的token验证通过,已经访问到真正的资源"

注意：需要在资源服务配置类“ResourceServerConfig ”开启全局方法授权：@EnableGlobalMethodSecurity(prePostEnabled = true)

### 4.测试

再走一遍获取token的流程，然后带着Token访问资源服务器，请求头携带：`Authorization=Bearer token值` ，如下：

这里我们已经成功的访问到真正的资源 ， 请求资源之前，资源服务器会发送远程请求到授权服务器验证token的合法性，并且根据当前token获取权限列表，然后在进行授权，如果权限列表拥有资源(controller的方法)所需要的权限，即可访问成功 。

如果Token是无效的会出现如下信息：

如果Token中的权限不包含资源所需要的权限会出现如下信息：

### 5.总结资源服务器配置

资源服务器的配置不是很多，主要是配置如下内容：

1. 通过HttpSecurity配置oauth2.hasScope('all') 资源服务器的授权范围
**2、** 通过ResourceServerSecurityConfigurer配置资源服务器的ResourceID；

**3、** 通过ResourceServerSecurityConfigurer配置资源服务器如何校验Token，这里使用的是RemoteTokenServices远程校验方式；

那么资源服务器的执行流程是怎么样的呢？

**1、** 我们请求头中带着Token向资源服务器发送请求；

**2、** 资源服务器收到请求，得到Token后通过jwtAccessTokenConverter转换器进行Token的转换得到Token中的认证授权信息；

**3、** 然后资源服务器会校验认证信息中是否拥有资源服务器配置的授权范围(Scope)，资源ID(ResourceID)，如果都验证通过资源服务器还会校验权限列表是否包含当前访问的资源(controller)说需要的权限；

**4、** 如果授权范围(Scope)，资源ID(ResourceID)，方法授权都校验通过就执行相关的方法返回资源；

最后再配一张认证服务到资源服务器的完整流程图吧：
