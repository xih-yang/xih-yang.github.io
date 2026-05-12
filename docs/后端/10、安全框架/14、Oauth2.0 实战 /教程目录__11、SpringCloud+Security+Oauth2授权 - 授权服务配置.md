# 11、SpringCloud+Security+Oauth2授权 - 授权服务配置
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/11.html
- 分类：安全框架
- 分组：教程目录
上一文章我们准备了微服务授权的环境，并对AuthServer实现了简单的认证流程，这里是接[上一篇文章](/zhuanlan/security/oauth2/2/10.html)继续对AuthServer认证服务做Oauth2配置

### 1.概述Oauth2授权服务配置

我们只需要导入如下依赖即可集成JWT和Oauth2了

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-oauth2</artifactId>
</dependency>
```

Oauth2提供了AuthorizationServerConfigurerAdapter适配器类来作为认证授权服务的配置,其中有三个方法源码如下：

```java
public class AuthorizationServerConfigurerAdapter  {
    //客户端详情：配置客户端请求的参数
	public void configure(ClientDetailsServiceConfigurer clients)...	
	//授权服务断点：配置授权码和令牌的管理/存储方式
	public void configure(AuthorizationServerEndpointsConfigurer endpoints)...
    //授权服务安全配置：配置哪些路径放行(检查token的路径要放行)
	public void configure(AuthorizationServerSecurityConfigurer security) ...
}
```

注意，上面是源码，别乱拷贝 ，三个配置作用分别如下：

- ClientDetailsServiceConfigurer ：用来配置客户端详情服务：如配置客户端id(client_id)资源id、客户端密钥(secrect)、授权方式、scope等,可以基于内存或jdbc。(可以理解为是对浏览器向授权服务器获取授权码或令牌时需要提交的参数配置)，如果你做过三方登录应该就能理解这些参数，其实就是对客户端的参数配置，在客户端获取授权码或者获取Token的URL请求中就需要带上这些客户端参数，比如：

- AuthorizationServerEndpointsConfigurer:配置令牌的访问端点url和令牌服务，如配置如何管理授权码(内存或jdbc)，如何管理令牌(存储方式，有效时间等等)
- AuthorizationServerSecurityConfigurer: 用来配置令牌端点的安全约束，如配置对获取授权码，检查token等某些路径进行放行

下面我整理了一个配置关系图：

### 2.授权服务配置实战

#### 2.1.客户端详情配置#

第一个配置主要是通过ClientDetailsServiceConfigurer配置客户端详情，定义配置类，继承AuthorizationServerConfigurerAdapter ，复写第一个configure方法，配置类上贴注解@EnableAuthorizationServer开启授权服务配置

```java
//授权服务器配置
@Configuration
@EnableAuthorizationServer
public class AuthorizationServerConfig extends AuthorizationServerConfigurerAdapter {
    //密碼編碼器
    @Autowired
    private PasswordEncoder passwordEncoder;
    //第一步：客户端详情配置============================
    //客户端详细信息服务配置：客戶端id,客戶端秘钥，授权方式等
    @Autowired
    private DataSource dataSource ;
	//定义针对于JDBC的客户端配置详情服务
    @Bean
    public ClientDetailsService clientDetailsService(){
        JdbcClientDetailsService jdbcClientDetailsService = new JdbcClientDetailsService(dataSource);
        //设置密码编码
        jdbcClientDetailsService.setPasswordEncoder(passwordEncoder);
        return jdbcClientDetailsService;
	}
	//基于jdbc的客户端详情配置方案
	@Override
	public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
	    //配置成基于jdbc的客户端详情方案
	    clients.withClientDetails(clientDetailsService());
	}
```

JdbcClientDetailsService默认会去找数据库中的 名字为 oauth_client_details 表中的数据作为客户端详情的配置，见 JdbcClientDetailsService类的源代码，所以我们需要在数据库执行以下sql创建表：并填充好数据，如

```java
DROP TABLE IF EXISTS oauth_client_details;
CREATE TABLE oauth_client_details (
  client_id varchar(48) NOT NULL,
  resource_ids varchar(256) DEFAULT NULL,
  client_secret varchar(256) DEFAULT NULL,
  scope varchar(256) DEFAULT NULL,
  authorized_grant_types varchar(256) DEFAULT NULL,
  web_server_redirect_uri varchar(256) DEFAULT NULL,
  authorities varchar(256) DEFAULT NULL,
  access_token_validity int(11) DEFAULT NULL,
  refresh_token_validity int(11) DEFAULT NULL,
  additional_information varchar(4096) DEFAULT NULL,
  autoapprove varchar(256) DEFAULT NULL,
  PRIMARY KEY (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO oauth_client_details VALUES ('webapp', 'res1', '$2a$10$GPHeNpkKAUJDJcC2XafjkuTyh/P01s2ZoIu0/IsPs6WcXtnv8LNgm', 'all', 'client_credentials,password,authorization_code,refresh_token', 'http://www.baidu.com', null, '7200', '72000', null, 'true');
INSERT INTO oauth_client_details VALUES ('webapp2', 'res2', '$2a$10$GPHeNpkKAUJDJcC2XafjkuTyh/P01s2ZoIu0/IsPs6WcXtnv8LNgm', 'all', 'client_credentials,password,authorization_code,refresh_token', 'http://www.baidu.com', '', '7200', '72000', '', 'true');
```

秘钥的明文是“secret” ， 数据如下：

因为在jdbcClientDetailsService设置了setPasswordEncoder(passwordEncoder);，所以数据库中的client_secret需要是密文加密的，加密如：BCrypt.hashpw(“secret”, BCrypt.gensalt())

oauth_client_details解释：

- client_id :主键，必须唯一，不能为空

用于唯一标识每一个客户端(client)；注册时必须填写(也可以服务端自动生成)，这个字段是必须的，实际应用也有叫app_key 案例：OaH1heR2E4eGnBr87Br8FHaUFrA2Q0kE8HqZgpdg8Sw
- resource_ids：资源ID，不能为空，用逗号分隔

客户端能访问的资源id集合，注册客户端时，根据实际需要可选择资源id，也可以根据不同的额注册流程，赋予对应的额资源id，案例：order-resource,pay-resource
- client_secret：客户端秘钥，不能为空

注册填写或者服务端自动生成，实际应用也有叫app_secret, 必须要有前缀代表加密方式，案例：{bcrypt}gY/Hauph1tqvVWiH4atxteSH8sRX03IDXRIQi03DVTFGzKfz8ZtGi
- scope: 授权范围，不可为空

指定client的权限范围，比如读写权限，比如移动端还是web端权限，案例：read,write / web,mobile
- authorized_grant_types：授权方式，不可为空

可选值 授权码模式:authorization_code,密码模式:password,刷新token: refresh_token, 隐式模式: implicit: 客户端模式: client_credentials。支持多个用逗号分隔，案例：implicit",“client_credentials”,“password”, “authorization_code”, “refresh_token”
- web_server_redirect_uri：客户端重定向uri

客户端重定向uri，authorization_code和implicit需要该值进行校验，注册时填写，案例：httt://baidu.com
- authorities ：权限，可为空

指定用户的权限范围，如果授权的过程需要用户登陆，该字段不生效，implicit和client_credentials需要，案例：ROLE_ADMIN,ROLE_USER
- access_token_validity：Token有效期，可空

设置access_token的有效时间(秒),默认(606012,12小时)，案例：3600
- refresh_token_validity ：刷新Token有效时期，可空

设置refresh_token有效期(秒)，默认(606024*30, 30填)，案例：7200
- additional_information： 附加数据，可空

附加数据，值必须是json格式 ，案例：{“key”, “value”}
- autoapprove：是否默认授权

默认false,适用于authorization_code模式,设置用户是否自动approval操作,设置true跳过用户确认授权操作页面，直接跳到redirect_uri，案例：false

#### 2.2.授权服务配置#

第二个配置主要是通过AuthorizationServerEndpointsConfigurer 配置授权码和令牌相关的服务 ,在上面的配置类基础上增加配置内容

```java
//第二步：令牌服务配置=============================================
//客户端详情service
@Autowired
private ClientDetailsService clientDetailsService;
//认证管理器,在WebSecurityConfig中配置
@Autowired
private AuthenticationManager authenticationManager;
	//令牌存储 ， 基于JWT
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
        //jwtAccessTokenConverter.setKeyPair(keyPair());
        return jwtAccessTokenConverter;
    }
	//配置令牌服务
    @Bean
    public AuthorizationServerTokenServices tokenService(){
        //创建默认的令牌服务
        DefaultTokenServices services = new DefaultTokenServices();
        //指定客户端详情配置
        services.setClientDetailsService(clientDetailsService());
        //支持产生刷新token
        services.setSupportRefreshToken(true);
        //token存储方式
        services.setTokenStore(tokenStore());
        //设置token增强 - 设置token转换器
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(jwtAccessTokenConverter()));
        services.setTokenEnhancer(tokenEnhancerChain);  //jwtAccessTokenConverter()
        //token有效时间
        services.setAccessTokenValiditySeconds(72000);
        //刷新令牌默认有效时间
        services.setRefreshTokenValiditySeconds(72000);
        return services;
    }
//授权码服务
@Bean
public AuthorizationCodeServices authorizationCodeServices(){
    //基于内存存储的的授权码服务
    //return new InMemoryAuthorizationCodeServices();
    //基于内存存储的的授权码服务
    return new JdbcAuthorizationCodeServices(dataSource);
}
//配置令牌访问端点
@Override
public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
    endpoints
        //密码授权模式需要
        .authenticationManager(authenticationManager)
        //授权码模式服务
        .authorizationCodeServices(authorizationCodeServices())
        //配置令牌管理服务
        .tokenServices(tokenService())
        //允许post方式请求
        .allowedTokenEndpointRequestMethods(HttpMethod.POST);
}
```

这里配置了这么几个内容：

- AuthenticationManager

认证管理器“password”模式会用到认证管理器，它是在上一章节的Security配置中定义的
- TokenStore : token存储方式

该接口常用的实现有：InMemoryTokenStore基于存储的token存储方案，JdbcTokenStore基于数据库的token存储方案，JwtToeknStore基于JWT的存储方案，RedisTokenStore基于Redis的存储方案，我上面的案例采用的是JWT的方式来实现
- JwtAccessTokenConverter : JWT令牌转换器，JWT编码的令牌值和OAuth身份验证信息（双向）之间转换器 ，SigningKey设置的是秘钥
- AuthorizationCodeServices

授权码服务，提供了InMemoryAuthorizationCodeServices基于内存和基于数据库 JdbcAuthorizationCodeServices的授权码存储方案，如果是基于JDBC那么我们需要提供存储授权码的表“oauth_code”
- AuthorizationServerTokenServices

该接口用来配置授权服务器令牌，如配置是否支持Token,Token的存储方式(内 存,jdbc,),token加密，token过期等

由于授权码使用的是JdbcAuthorizationCodeServices基于数据库的存储方案，所以要导入授权码SQL脚本,JdbcAuthorizationCodeServices默认读取数据库中的 oauth_code 表中的数据作为授权码的存储表，所以执行以下sql创建表

```java
DROP TABLE IF EXISTS oauth_code;
CREATE TABLE oauth_code (
code varchar(255) DEFAULT NULL COMMENT '授权码(未加密)',
authentication varbinary(5000) DEFAULT NULL COMMENT 'AuthorizationRequestHolder.java对象序列化后的二进制数据'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

#### 2.3.令牌端点安全配置#

AuthorizationServerSecurityConfigurer:用来配置令牌端点的安全策略，修改AuthorizationServerConfig中配置如下：

```java
//第三步：端点安全约束======================================
//配置令牌安全约束
@Override
public void configure(AuthorizationServerSecurityConfigurer security) throws Exception {
    security
        //对应/oauth/token_key 公开，获取公钥需要访问该端点
        .tokenKeyAccess("permitAll()")
        //对应/oauth/check_token ，路径公开，校验Token需要请求该端点
        .checkTokenAccess("permitAll()")
        //允许客户端进行表单身份验证,使用表单认证申请令牌
        .allowFormAuthenticationForClients();
}
```

到这里资源服务暂时配置完成

#### 2.4.授权服务测试#

**1.登录认证中心**

**2.通过浏览器获取授权码**

GET访问：http://localhost:3000/oauth/authorize？client_id=webapp&response_type=code&redirect_uri=http://www.baidu.com ，操作如下：

得到授权码

**3.获取令牌**

使用Postmain发送Post请求访问Url: http://localhost:3000/oauth/token

参数：client_id=webapp&client_secret=secret&grant_type=authorization_code&code=授权码&redirect_uri=http://www.baidu.com ，操作如下：

可以看到这里已经获取到令牌，access_token是令牌，refresh_token是刷新令牌的，expires_in是过期时间，scope是授权范围

**检查令牌**

检查token,访问认证服务器http://localhost:3000/oauth/check_token，Post请求如下：

解释一下：

- aud:里面包含的是Token可访问的资源ID
- scope: 里面包含的是Token可访问的授权范围，这是因为我们在获取Token的时候指定了client_id =webapp，它对应了oauth_client_details表中的客户端详情配置，所以Token拥有的资源ID和授权范围都是根据client_id 加载的对应的客户端详情配置
- user_name : Token对应的用户，也是因为在获取Token的时候使用了账号和密码进行认证。
- authorities : Token 对应的用户的权限列表，是在获取Token的时候，Security会执行认证流程，根据用户名调用UserDeatilsService加载的权限
- client_id : 对应的客户端ID

注意：Token的 scope授权范围，aud资源ID，以及authorities 权限列表三者决定了这个Token是否能够去访问某个资源服务器

**4.密码授权模式测试**

密码模式不需要获取授权码，在授权服务中我们配置了"password"密码模式,"authorization_code"授权码模式两种方式，接下来是测试“password”模式获取，将grant_type修改为“password” 添加username和password两个参数，去掉code参数

**5.刷新token**

带着之前获取Token返回的刷新Token的值访问如下地址即可刷新：

http://localhost:3000/oauth/token?grant_type=refresh_token&refresh_token=刷新Token值&client_id=webapp&client_secret=secret

### 3.总结授权服务器配置

到这里授权服务配置告一段落，总结一下AuthServer主要做了如下事情：

**1、** 集成Security和MyBatis能够实现用户的认证；

**2、** 集成Oauth2做授权服务配置，主要做了三个配置；

- 基于JDBC的客户端详情配置，加载oauth_client_details表中的配置
- 基于JDBC的授权码配置和基于JWT的Token配置
- 最后做了授权服务端点的安全配置

那么当请求到达AuthServer会发生什么事情呢？这里以授权码模式为例

**1、** 首先我们要执行登录操作，Security会调用AuthenticationManager执行认证，调用UserDeatilsService加载数据库中的用户信息和权限列表保持到上下文对象中；

**2、** 然后我们发起一个获取授权码的请求`/oauth/authorize？client_id=webapp&response_type=code&redirect_uri=http://www.baidu.com`,请求到达认证服务器；

**3、** 认证服务器收到请求，为请求生成授权码，并返回给请求中指定的重定向地址；

**4、** 我们得到授权码，带着授权码去获取Token,请求`/oauth/token？client_id=webapp&client_secret=secret&grant_type=authorization_code&code=授权码`请求到达认证服务器；

**5、** 认证服务器收到请求，验证授权码后，根据client_id从oauth_client_details表加载客户端配置进行参数校验，然后认证服务器创建令牌，颁发给客户端；

**6、** 我们通过`/oauth/check_token`检查Token时，就可以看到Token对应的授权范围，资源ID，权限列表等信息，认证服务器在生成Token的时候，就已经把这些信息关联好了；

下一章节我们将对资源服务做配置，完成整个授权流程
