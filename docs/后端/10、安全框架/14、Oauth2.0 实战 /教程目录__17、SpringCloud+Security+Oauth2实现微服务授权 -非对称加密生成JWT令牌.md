# 17、SpringCloud+Security+Oauth2实现微服务授权 -非对称加密生成JWT令牌
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/17.html
- 分类：安全框架
- 分组：教程目录
在之前的微服务授权方案《[SpringCloud+Security+Oauth2授权 - 授权服务配置](/zhuanlan/security/oauth2/2/11.html)》中我们使用的是Oauth+JWT方式完成，今天介绍一下使用非对称加密方式RSA来生成JWT令牌

## 一.对称和非对称加密

## 1.对称加密

早期的加密方式都是使用对称加密即：

> 采用单钥密码系统的加密方法，同一个密钥可以同时用作信息的加密和解密，这种加密方法称为对称加密，也称为单密钥加密。加密算法是公开的，使用一个秘钥加密，必须使用相同的秘钥才能解密，通过秘钥来保证数据的安全传输。

这种加密方式的问题在于加密方必须把秘钥传输给解密方，所以秘钥的保持和传输是一个头疼的问题，一旦秘钥泄露数据将会变得不安全。常见的对称加密有DES ，AES等

## 2.非对称加密

由于对称加密对秘钥的隐秘要求比较高，后来计算机科学家们提出了一种新的想法，就是能不能在不传输秘钥的情况下也能完成加密解密?基于这种构思科学家们又设计出了一种新的加密方式，非对称加密

> 非对称加密算法需要两个密钥：公开密钥（publickey:简称公钥）和私有密钥（privatekey:简称私钥）。公钥与私钥是一对，如果用公钥对数据进行加密，只有用对应的私钥才能解密。因为加密和解密使用的是两个不同的密钥，所以这种算法叫作非对称加密算法

非对称加密的使用方式是这样的

- 甲方使用非对称加密算法生成一对秘钥“公钥”和“私钥”
- “私钥”甲方保存起来不能泄露，“公钥”是公开的可以给任何人，比如乙方
- 乙方使用“公钥”对数据进行加密，然后把密文传输给甲方
- 甲方得到密文使用“私钥”就能解密了，而且只能是甲方解密，因为他才有私钥

非对称加密在互联网行业中随处可见，举个例子如果你做过支付宝支付你应该就知道支付宝有公钥私钥的概念

### 3.数字签名

上面的非对称加密是在说使用公钥加密，私钥解密，那如果使用功私钥加密公钥解密会是一种什么效果呢？其实“数字签名”就是使用私钥加密公钥验证的方式实现的

> 数字签名（又称公钥数字签名）是只有信息的发送者才能产生的别人无法伪造的一段数字串，这段数字串同时也是对信息的发送者发送信息真实性的一个有效证明

比如在上面案例中，数字签名流程如下

- 甲方生成好公私钥
- 甲方使用“私钥”对数据加密得到密文，然后把密文传输给乙方
- 乙方得到“密文”使用公钥验证

那你可以会问，使用私钥加密，那不是所有人都可以解密吗，因为公钥是公开的。其实数字签名的目的主要是防止数据被篡改，和验证发送方身份，通常情况下数字签名会对传输的数据使用“私钥”加密得到签名信息，如果公钥能把密文解开或者能够验证签名信息的正确性，说明数据的发送者一定是拥有私钥的那个发送方，如果中途数据被黑客篡改过，那么接收方在验证签名的是否是没办法验证通过的，那就说明数据被篡改过，或者发送方身份有问题，或者公私钥不是一对。

### 二.Oauth授权-生成RSA签名的JWT令牌

## 1.生成RSA 证书

Security支持JWT格式令牌，JWT令牌我们采用非对称加密算法，首先需要创建公钥和私钥 ，执行下面命令，生成证书，证书中包含公私钥

```java
keytool -genkeypair -alias whalechen -keyalg RSA -keypass whalechen -keystore whale.jks -storepass whalechen
```

- alias 秘钥别名
- keyalg 使用的hash算法
- keypass 秘钥访问密码
- keystore 秘钥库文件名，生成证书文件
- storepass 证书的访问密码

可以通过如下命令查询证书信息

```java
keytool -list -keystore whale.jks
```

## 2.导出公钥

秘钥生成好存储在证书文件中，我们可以通过一个SSL工具来导出公私钥，首选安装工具“Win64OpenSSL” ， 一直下一步安装即可，安装好了需要配置环境变量，如下：

然后使用下面的命令导出秘钥

```java
keytool -list -rfc --keystore whale.jks | openssl x509 -inform pem -pubkey
```

效果如下

可以把公钥私钥拷贝出来存储到txt文档中，在后续代码中会用到，注意去掉空格和换行

## 3.测试秘钥

使用生成的秘钥来生成一个JWT格式的Token，首先需要把证书放到项目的resources下，如：

然后编写测试代码，创建一个JWT令牌如下：

```java
public class JWTTest {
    @Test
    public void testJWT(){
        //加载证书
        ClassPathResource classPathResource = new ClassPathResource("whale.jks");
        //密钥库
        KeyStoreKeyFactory keyStoreKeyFactory = new KeyStoreKeyFactory(classPathResource, "whalechen".toCharArray());
        //获取秘钥对
        KeyPair keyPair = keyStoreKeyFactory.getKeyPair("whalechen", "whalechen".toCharArray());
        //获取私钥 , 私钥加密，公钥验证，是谓签名
        RSAPrivateKey privateKey = (RSAPrivateKey)keyPair.getPrivate();
        //准备载荷数据
        Map<String,Object> data = new HashMap<>();
        data.put("id",1L);
        data.put("username","zs");
        data.put("role","admin");
        //创建令牌
        Jwt jwt = JwtHelper.encode(JSON.toJSONString(data), new RsaSigner(privateKey));
        //获取创建的令牌
        String token = jwt.getEncoded();
        System.out.println(token);
    }
}
```

上面代码可以创建一个JWT的Token了,然后我们还可以使用公钥解密Token,测试如下

```java
@Test
public void parseWTToken(){
    //JWT的token
    String JWTToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpZCI6MSwidXNlcm5hbWUiOiJ6cyJ9.oDATF5WPnBUhAUJ-qrww0j4uziYHbvd2CnRtQoJlgVMT14beoFM292c9rutMExp8KhFmWY1GAmILZD6eqewtNFasiTlrEmxm4A5KJ6fSLOx08FsBj4DnLXDqaF5iN6pFPjuYbc2x1G4hjAoUuLv3OO1eJKt5bmdvtQG7-Pm_Dp-aENdOmjykPJRt16atj7SVB7OhZ7W-VsQrQCUEBtI0-M2ZG-9rQLDlqBaGp957T3w8wjbOzo5vok3tgncUpGGZ3s_M2ITD2qj2sGbAzd-xXnzXJVruNNLsfzvXpMarW8UD-BAKR_0ifMN9IQ8_d8XCHFwNO1UixQnVjqu3dh034A";
    //公钥验证，通过 ‘keytool -list -rfc --keystore whale.jks | openssl x509 -inform pem -pubkey’ 得到公钥
    String publicKey = "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAquxJ7n+EI8/XeNFD0m2aarDJ2Ix9PGI6u/3ZJ61LD7fxZQ/+iD5gGy6oAp2Da1Sxw+og/B9mWDH5MQHBPdWdxBw/nTVcqL+/3OOclxPK84WWkeEy0LifFA5xMmZrxXtAskxir3t0K6WrUFxUd/HLljVp5BalxrdHA6CFB7c5wKX9RfhnhaYZoiHeCkIsu76SZJrHqeGJEIFqt9Cuux9AapoiQow+bA7aMSqm7jqdXucHL+ldXA3wDopJDozvRF7ZYd3X7da5dh95GlJL9nWTjJ4prOd3O7ibSe3npZ+a3w+1FDrJcNqun5OuCjJ0Z3s4yHXtUv5qZToScFmcVxfYfQIDAQAB-----END PUBLIC KEY-----";
    //解密和验证令牌
    Jwt jwt = JwtHelper.decodeAndVerify(JWTToken, new RsaVerifier(publicKey));
    //获取载荷数据
    String claims = jwt.getClaims();
    System.out.println(claims);
    //{"role":"admin","id":1,"username":"zs"}
}
```

## 4.授权服务器配置

我们将上面的案例集成到项目中，即Oauth2生成JWT的Token使用非对称加密方式，首先把证书放到resources目录中，然后yml中配置好证书相关的信息 :application.yml配置如下：

```java
encrypt:
  key-store:
    location: classpath:whale.jks
    secret: whalechen
    alias: whalechen
    password: whalechen
```

上面的配置项会绑定给一个`KeyProperties` 对象，我们需要在配置中定义该类

```java
@Bean("customKeyProperties")
public KeyProperties keyProperties(){
    return new KeyProperties();
}
@Resource(name = "customKeyProperties")
private KeyProperties keyProperties;
```

然后配置 `JwtAccessTokenConverter` JWT的令牌转换器

```java
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
        return services;
    }
    //配置令牌
    @Bean
    public TokenStore tokenStore(){
        return new JwtTokenStore(jwtAccessTokenConverter());
    }
	//用户身份转换器
    @Autowired
    private CustomUserAuthenticationConverter customUserAuthenticationConverter;
	//令牌转换器
    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        //配置证书信息
        KeyPair keyPair = new KeyStoreKeyFactory(
                keyProperties.getKeyStore().getLocation(),                          //证书路径
                keyProperties.getKeyStore().getSecret().toCharArray())              //证书秘钥
                .getKeyPair(keyProperties.getKeyStore().getAlias(),                 //证书别名
                        keyProperties.getKeyStore().getPassword().toCharArray());   //证书密码
        converter.setKeyPair(keyPair);
        DefaultAccessTokenConverter accessTokenConverter = (DefaultAccessTokenConverter) converter.getAccessTokenConverter();
        accessTokenConverter.setUserTokenConverter(customUserAuthenticationConverter);
        return converter;
    }
```

上面的令牌转换器中用到了 `CustomUserAuthenticationConverter`这个是一个用户身份验证转换器，简单理解就是可以给Token中加入额外的扩展数据定义如下：

```java
@Component
public class CustomUserAuthenticationConverter extends DefaultUserAuthenticationConverter {
    @Override
    public Map<String, ?> convertUserAuthentication(Authentication authentication) {
        LinkedHashMap response = new LinkedHashMap();
        String name = authentication.getName();
        response.put("user", name);
        response.put("age",18);//根据自己的情况增加 扩展数据
        if (authentication.getAuthorities() != null && !authentication.getAuthorities().isEmpty()) {
            //权限
            response.put("authorities", AuthorityUtils.authorityListToSet(authentication.getAuthorities()));
        }
        return response;
    }
}
```

授权服务配置完毕，获取到Token,检查Token测试效果如下：

## 5. 资源服务器配置

授权服务颁发的Token是基于JWT使用非对称加密方式进行签名，相当于Token使用了私钥加密，这意味着资源服务器要验证并解析Token需要配置上公钥，所以我们第一步需要把之前从证书中提取出来的`公钥`提取出来放到资源服务器的resources中，如：resources/public.key , 还要注意把它弄成一行，不能有空格和换行符

然后配置资源服务器，使用JWT非对称的方式校验Token，需要从resources中读取公钥

```java
//资源服务配置
@Configuration
//开启资源服务配置
@EnableResourceServer
//开启方法授权
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {
    //公钥
    private static final String PUBLIC_KEY = "public.key";
    @Bean
    public TokenStore tokenStore(){
        return new JwtTokenStore(jwtAccessTokenConverter());
    }
    /***
     * 定义令牌校验器
     */
    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setVerifierKey(getPubKey());
        return converter;
    }
    /**
     * 非对称加密公钥Key
     */
    private String getPubKey() {
        Resource resource = new ClassPathResource(PUBLIC_KEY);
        try {
            InputStreamReader inputStreamReader = new InputStreamReader(resource.getInputStream());
            BufferedReader br = new BufferedReader(inputStreamReader);
            return br.lines().collect(Collectors.joining("\n"));
        } catch (IOException ioe) {
            return null;
        }
    }
    @Override
    public void configure(ResourceServerSecurityConfigurer resources) throws Exception {
        //我的资源名称是什么
        resources.resourceId(AuthConstants.RESOURCE_COURSE);
        //用来校验，解析Token的服务
        resources.tokenStore(tokenStore());
        //无状态
        resources.stateless(true);
    }
    ...省略...
}       
```

文章结束，希望对你有所帮助
