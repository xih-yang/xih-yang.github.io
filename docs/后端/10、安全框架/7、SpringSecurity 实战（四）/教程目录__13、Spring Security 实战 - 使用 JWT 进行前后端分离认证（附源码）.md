# 13、Spring Security 实战 - 使用 JWT 进行前后端分离认证（附源码）
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/13.html
- 分类：安全框架
- 分组：教程目录
## 一、JWT 的简单介绍

JWT全称 Java web Token，在此所讲述的是 JWT 用于身份认证，用服务器端生成的JWT去替代原始的Session认证，以提高安全性。

JWT本质是一个Token令牌，是由三部分组成的字符串，分别是头部（header）、载荷（payload）和签名（signature）。头部一般包含该 JWT 的基本信息，例如所使用的加密算法；载荷一般包含所需要传递的信息，如用户名；签名则是通过对头部、载荷和密钥加密生成的，用于验证 JWT 的真实性和完整性（即拿到前端传过来的Token，通过其头部、载荷和密钥去生成一个签名，然后比对是否与传过来的Token签名部分是否一致）。

## 二、使用 JWT 进行安全认证

### 后端结合SpringSecurity实现

**1、** 导入相关依赖（jwt相关的和SpringSecurity依赖）；

```java
<!--SpringSecurity-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<!-- JWT -->
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>3.2.0</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.1</version>
</dependency>
```

**1、** 将生成jwt和认证jwt的实现以方法的形式封装成一个工具类（jwt的认证即前端传过来的token和后端中的进行比对），封装的工具类如下（其实封装的方式很多，不局限于这种）：；

```java
/**
 * jwt加密和解密的工具类
 */
public class JWTUtil {
    /**
     * 签发JWT;这里创建的jwt
     * @param id
     * @param subject   可以是JSON数据 尽可能少
     * @param ttlMillis
     * @return
     */
    public static String createJWT(String id, String subject, long ttlMillis) {
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        SecretKey secretKey = generalKey();  // 通过操作加密生成key
        JwtBuilder builder = Jwts.builder()
                .setId(id)
                .setSubject(subject)   // 主题
                .setIssuer("xc")// 签发者：小柴
                .setIssuedAt(now)      // 签发时间
                .signWith(signatureAlgorithm, secretKey); // 签名算法以及密匙
        if (ttlMillis >= 0) {
            long expMillis = nowMillis + ttlMillis;
            Date expDate = new Date(expMillis);
            builder.setExpiration(expDate); // 过期时间
        }
        return builder.compact();
    }
    /**
     * 生成jwt token
     *
     * @param username
     * @return
     */
    public static String createJWT(String username) {
        return createJWT(username, username, 60 * 60 * 1000);
    }
    /**
     * 验证JWT
     * 根据验证时抛出的超时异常、签名异常、其他异常进行一定的操作
     *
     * @param jwtStr
     * @return
     */
    public static CheckResult validateJWT(String jwtStr) {
        CheckResult checkResult = new CheckResult();
        // 如果jwtStr为空的话，设置errcode为jwt不存在
        if(StringUtils.isEmpty(jwtStr)){
            checkResult.setSuccess(false);
            checkResult.setErrCode(JWTConstant.JWT_ERRCODE_NULL);
        }
        Claims claims = null;
        try {
            claims = parseJWT(jwtStr);
            checkResult.setSuccess(true);
            checkResult.setClaims(claims);
        } catch (ExpiredJwtException e) {
            checkResult.setErrCode(JWTConstant.JWT_ERRCODE_EXPIRE);
            checkResult.setSuccess(false);
        } catch (SignatureException e) {
            checkResult.setErrCode(JWTConstant.JWT_ERRCODE_FAIL);
            checkResult.setSuccess(false);
        } catch (Exception e) {
            checkResult.setErrCode(JWTConstant.JWT_ERRCODE_FAIL);
            checkResult.setSuccess(false);
        }
        return checkResult;
    }
    /**
     * 生成加密Key
     *
     * @return
     */
    public static SecretKey generalKey() {
        byte[] encodedKey = Base64.decode(JWTConstant.JWT_SECRET);
        SecretKey key = new SecretKeySpec(encodedKey, 0, encodedKey.length, "AES");
        return key;
    }
    /**
     * 解析JWT字符串
     *
     * @param jwt
     * @return 返回 jwt 解析后的 payload
     * @throws Exception
     */
    public static Claims parseJWT(String jwt) {
        SecretKey secretKey = generalKey();
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(jwt)
                .getBody();
    }
}
```

在这个工具类中用到了俩个自定义的类，一个封装是验证 jwt 结果集实体类 `CheckResult`，它内部封装了三个属性：errorCode：错误编码，success：验证是否成功，claims：jwt 中包含的一些信息；使用工具类验证JWT时返回该对象，具体代码如下：

```java
@Data
@NoArgsConstructor
/**
 * JWT 验证信息
 */
public class CheckResult {
    private int errCode;
    private boolean success;
    private Claims claims;
}
```

另一个是一个在验证/生成 JWT 时所需用到的常量类 `JWTConstant`，如：验证失败所对应异常的编码（自定义的），JWT 秘钥等等。具体代码如下：

```java
public class JWTConstant {
    /**
     * token
     */
    public static final int JWT_ERRCODE_NULL = 4000;			//Token不存在
    public static final int JWT_ERRCODE_EXPIRE = 4001;			//Token过期
    public static final int JWT_ERRCODE_FAIL = 4002;			//验证不通过
    /**
     * JWT 秘钥 1
     */
    public static final String JWT_SECRET = "bG92ZS14bXE=";
    /**
     * JWT 秘钥 2
     */
    public static final String JWT_SECERT2 = "8677df7fc3a34e26a61c034d5ec8245d";			//密匙
    public static final long JWT_TTL = 24*60 * 60 * 1000;		//token有效时间
}
```

**1、** 由于前后端的话你使用了JWT进行认证，所以我们得关闭SpringSecurity默认的Session认证，即得把Session管理关了，至于为什么不使用默认的进行认证（Session认证）？原因很多，如：当认证的用户多了，Session占有的内存会不断地增大；Session是不安全的，很容易造成CSRF等等…即在配置SecurityFilterChain的时候填上如下代码：；

```java
// 关闭session
// 关闭原因：
// 1. 前后端进行通信，每个请求都是一个独立的事务，开启session管理可能会使得信息无法共享
// 2. 采用session管理的话，多个用户进行访问服务器端的内存会占用过高，这是因为session的废除机制是超时机制
// 3. 采用session管理功能，这也是一个安全漏洞
// 这里使用jwt（Java web token）令牌的方式进行认证，不需要session了
http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
```

**1、** 当用户登录成功后，是需要将这token传给前端的，然后让前端发送请求的时候携带这个token，请求报文中有了这个token才允许请求通过，否则返回401，无权限（当然这异常处理可以自定义，这里不说明了，还有这个token一般在请求报文中的请求头中，当然这是下面前端该实现的），那如何将token传递给前端呢？即在登录认证成功后，SpringSecurity会去调用配置的`AuthenticationSuccessHandler`中的`onAuthenticationSuccess`方法对登录成功的一些操作（即登录成功后需要返回给前端的数据就可以在这个方法中进行实现），那有了JWT工具类，这方法就简单实现了，下面是实现的具体代码（当然如何配置这个handler这里就不说了，在专栏里有专门的博客解释了）：；

```java
@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler {
    @Resource
    private ObjectMapper objectMapper;
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        // 设置响应编码格式
        response.setContentType("json/application;charset=utf-8");
        // 获取用户名
        String username = authentication.getName();
        // 生成 jwt
        String jwt = JWTUtil.createJWT(username);
        ServletOutputStream out = response.getOutputStream();
        // 将 jwt 返回给前端
        out.write(objectMapper.writeValueAsString(BackResult.success(jwt)).getBytes());
        out.close();
    }
}
```

**1、** 首先得明白认证成功后的数据是放在`SecurityContextgHolder`中的，内部默认使用的是ThreadLocal去存放认证信息（内部用了策略模式，默认采用的策略是用ThreadLocal），当一个请求结束后这个Authentication会移除，原本移除会放在Session里一同返回给前端，但咱现在把Session管理给静止了（这在[【深入浅出SpringSecurity（四）】登录用户数据的获取，超详细的源码分析][SpringSecurity]中详细说明了）咱现在用的是JWT认证方式了，前端拿到这个token后，放在请求头中向后端发送请求时，后端得对这个token进行验证，如果验证成功了咱得从这个token中提取一些数据封装成Authentication放入SecurityContextHolder中，将SecurityContextHolder中的对应Authentication中的`authenticated`属性设置为true，以表示认证成功，即这个请求认证成功了（但不代表授权成功哈，提一嘴😇）；

**至于为什么要设置为 true，是因为在后面遇到 FilterSecurityInterceptor 拦截器判断是否授权时，会对这个进行判断，如果不是true的话会重新认证得到 Authentication 然后进行授权，到时候所响应的就是无权限访问401了。**

例如Authentication 实现类中的 UsernamePasswordAuthenticationToken，即可调用 authenticated 方法来返回一个认证成功了的 Authentication 认证信息，当然你也可以用别的重载构造…：

```java
public UsernamePasswordAuthenticationToken(Object principal, Object credentials) {
    super(null);
    this.principal = principal;
    this.credentials = credentials;
    setAuthenticated(false);
}
public UsernamePasswordAuthenticationToken(Object principal, Object credentials,
        Collection<? extends GrantedAuthority> authorities) {
    super(authorities);
    this.principal = principal;
    this.credentials = credentials;
    super.setAuthenticated(true); // must use super, as we override
}
public static UsernamePasswordAuthenticationToken unauthenticated(Object principal, Object credentials) {
    return new UsernamePasswordAuthenticationToken(principal, credentials);
}
public static UsernamePasswordAuthenticationToken authenticated(Object principal, Object credentials,
        Collection<? extends GrantedAuthority> authorities) {
    return new UsernamePasswordAuthenticationToken(principal, credentials, authorities);
}
```

至于如何去实现，其实在 Spring Security 中提供了基本的认证过滤器，我们可以自定义基本的认证过滤器 BasicAuthenticationFilter，去重写它的 doFilterInternal 方法，对该认证操作进行实现。具体代码如下，下面是小编自定义的 JWTAuthenticationFilter，内部是 sysUsreService 对象是用来根据获取数据库的用户信息的，而 URL_PERMITTED_LIST 中的具体 uri 是小编配置的无需通过Token认证即可请求服务器端的，这些都是根据具体需求自己配置的：

```java
@Slf4j
public class JWTAuthenticationFilter extends BasicAuthenticationFilter {
    @Resource
    private SysUserService sysUserService;
    private static final String[] URL_PERMITTED_LIST = {
            "/api/auth/login",
            "/api/auth/logout",
            "/captcha",
            "/password",
            "/image/**",
            "/test/**"
    };
    public JWTAuthenticationFilter(@Autowired AuthenticationManager authenticationManager) {
        super(authenticationManager);
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws IOException, ServletException {
        String token = request.getHeader("token");
        log.info("token--------{}",token);
        System.out.println("请求 URL：" + request.getRequestURI());
        if(Arrays.asList(URL_PERMITTED_LIST).contains(request.getRequestURI())){
            chain.doFilter(request,response);
            return;
        }
        // 验证Token，如果验证失败对失败进行处理
        CheckResult checkResult = JWTUtil.validateJWT(token);
        if(!checkResult.isSuccess()){
            switch(checkResult.getErrCode()){
                case JWTConstant.JWT_ERRCODE_NULL: throw new JwtException("Token 不存在");
                case JWTConstant.JWT_ERRCODE_EXPIRE: throw new JwtException("Token 已过期");
                case JWTConstant.JWT_ERRCODE_FAIL: throw new JwtException("Token 认证过期");
            }
        }
        // 解析jwt去获取用户名
        Claims claims = checkResult.getClaims();
        String username = claims.getSubject();
        SysUser sysUser = sysUserService.getByUserName(username);
        // 根据查询的用户信息封装成一个Authentication用户认证信息
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(sysUser.getUsername(),null,new ArrayList<GrantedAuthority>());
        // 将得到的用户认证信息填入到上下文中
        SecurityContextHolder.getContext().setAuthentication(auth);
        System.out.println(SecurityContextHolder.getContext());
        // 放行
        chain.doFilter(request,response);
    }
}
```

在Security配置SecurityFilterChain时进行如下配置，将过滤器添加到过滤器链中。

```java
// 添加自定义的过滤器-基本认证过滤器，让每个请求都得经过jwt认证...
http.addFilter(jwtAuthenticationFilter(http));
```

可以说这 5 步，这 JWT 认证的后端部分就算完成了。

### 前端Vue3结合Pinia、Axios实现

**1、** 下载Pinia、Axios；

`npm install axios`

`npm install pinia`

然后在 main.js 中，使用 pinia 这个插件。
**2、** 定义自定义的Store，登录成功后可通过调用SET_TOKEN方法将token存入到sessionStorage中；

```java
import {
     defineStore} from "pinia";
export const XCStore = defineStore("XCStore",{
    state: () => ({
        token: 'xxx'
    }),
    actions:{
        SET_TOKEN(state,token){
            state.token = token
            sessionStorage.setItem("token",token)
        }
    },
    getters : {
        GET_TOKEN(){
            return sessionStorage.getItem("token")
        }
    }
})
```

**1、** 给Axios添加请求拦截器，让每个Axios请求都携带上这个token下面是整个Axios配置，其中包含了添加请求拦截器：；

```java
// 引入axios
import axios from 'axios';
let baseUrl="http://localhost:8081/";
// 创建axios实例
const httpService = axios.create({
    // url前缀-'http:xxx.xxx'
    // baseURL: process.env.BASE_API, // 需自定义
    baseURL:"http://localhost:8081/",
    // 请求超时时间
    timeout: 3000 // 需自定义
});
//添加请求和响应拦截器
// 添加请求拦截器
httpService.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    config.headers.token=window.sessionStorage.getItem('token');
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});
// 添加响应拦截器
httpService.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
}, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
});
/*网络请求部分*/
/*
 *  get请求
 *  url:请求地址
 *  params:参数
 * */
export function get(url, params = {
      }) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'get',
            params: params
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });
    });
}
/*
 *  post请求
 *  url:请求地址
 *  params:参数
 * */
export function post(url, params = {
      }) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'post',
            data: params
        }).then(response => {
            console.log(response)
            resolve(response);
        }).catch(error => {
            console.log(error)
            reject(error);
        });
    });
}
/*
 *  文件上传
 *  url:请求地址
 *  params:参数
 * */
export function fileUpload(url, params = {
      }) {
    return new Promise((resolve, reject) => {
        httpService({
            url: url,
            method: 'post',
            data: params,
            headers: {
      'Content-Type': 'multipart/form-data' }
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });
    });
}
export function getServerUrl(){
    return baseUrl;
}
export default {
    get,
    post,
    fileUpload,
    getServerUrl
}
```

**1、** 通过了登录认证，通过调用store中的SET_TOKEN方法将登录认证传过来的token添加到sessionStorage中；

```java
function submit() {
    formRef.value.validate(async(valid)=>{
        if(valid) {
            try {
                let result = await RequestUtil.post(api/auth/login, formData.value);
                let data = result.data
                if(data.status === 200){
                    store.SET_TOKEN(store.$state,data.data)
                }else {
                    ElMessage.error(data.msg)
                }
            }catch (err) {
                console.log("error :" + err)
                ElMessage.error("服务器出错，请联系管理员")
            }
        } else {
            console.log("验证失败")
        }
    })
}
```

### 测试结果
