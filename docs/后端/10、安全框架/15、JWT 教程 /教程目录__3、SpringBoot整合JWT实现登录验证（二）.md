# 3、SpringBoot整合JWT实现登录验证（二）
- 来源：https://ddkk.com/zhuanlan/security/jwt/3.html
- 分类：安全框架
- 分组：教程目录
## 1 JWT请求流程

[SpringBoot整合JWT实现登录验证（一）](/zhuanlan/security/jwk/1/)

通过上一章节，介绍了JWT的相关信息，以及JWT字符串的生成与JWT的解析，接下来将用代码实现登录验证。实现流程如下图:

> 发送登录请求，服务器根据私钥key创建JWT字符串返回给用户；
> 浏览器将该jwt串在请求头向服务器发送请求；
> 服务器验证该jwt 【通过拦截器实现，校验JWT中有效荷载playload，具体的校验逻辑与实际要求有关】；
> 校验通过后返回响应的资源给浏览器，否则抛出登录异常

## 2 相关细节

在实际开发中，处在不同的开发环境时，如测试环境时，请求资源时，将不需要进行token验证。所以在此需求下，配置application.yml文件 **jwt:enabled属性**，当该值为true时，开启JWT token验证服务,反之当为false时，关闭该服务。

于此同时，并不是所有的资源都需要进行token验证，如登录获得token信息的接口，则不需要token验证。因此自定义注解@**PassToken** ,标注该请求的方法将不进行token验证。自定义注解信息如下：

```java
@Documented
@Target({
     ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PassToken {
    boolean canPass() default  false;
}
```

## 3 相关依赖

```java
  <dependencies>
  <!--web starter-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
             <version>2.2.6.RELEASE</version>
        </dependency>
<!--swagger2-->
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger2</artifactId>
            <version>2.9.2</version>
        </dependency>
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger-ui</artifactId>
            <version>2.9.2</version>
        </dependency>
<!--jwt-->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>
    </dependencies>
```

## 4 拦截器实现token校验逻辑

> 使用拦截器，通过反射，可以将请求缩小到方法上。实现@PassToken注解标注的方法可以不需要进行token登录验证。

## 4.1 编写JwtInterceptor

```java
/**
 * @author lyf
 * @projectName correcting-message
 * @date 2022/3/7 上午 08:32
 * @description 通过拦截器实现请求是否需要进行token验证
 */
@Configuration
public class JwtInterceptor extends HandlerInterceptorAdapter {
    /**
    * 读取jwt.enable配置信息
    */
    @Value("${jwt.enabled}")
    private String jwt_enabled;
    /**
     * 在业务处理器处理请求之前执行
     * @param request 请求
     * @param response 响应
     * @param handler
     * @return
     * @throws Exception
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if(jwt_enabled.equals("false")){
            //jwt token验证服务未开启时，返回true
            return true;
        }else{
            // 请求资源没有映射到方法上时直接通过
            if (!(handler instanceof HandlerMethod)) {
                return true;
            }
            //判断方法上是否有存在@PassToken注解
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            Method method = handlerMethod.getMethod();
            PassToken annotation = method.getAnnotation(PassToken.class);
            if(annotation!=null&&annotation.canPass()){
                return true;
            }else{
                //所有的请求头信息
                Enumeration<String> headerNames = request.getHeaderNames();
                while ( headerNames.hasMoreElements()){
                    System.out.println(headerNames.nextElement());
                }
                //解析请求中的token信息
                String token=request.getHeader("Authorization");
                //解析请求中的
                String empno=request.getHeader("empno");
                if(StringUtils.isEmpty(token)){
                    throw new LoginException("请求头中的token为空，token验证失败，请重新登录");
                }else{
                    JwtUtil jwtUtil=new JwtUtil(); //JwtUti工具类见上一章节介绍
                    DefaultClaims object = (DefaultClaims)jwtUtil.decodeJWTrHS256(token, "123456");
                    //自定义token playload载体的信息
                    String emp=object.get("emp",String.class);
                    if(!emp.equals(empno)){
                        //自定义LoginException，当校验token失败后，抛出该异常，交由全局异常处理
                        throw new LoginException("token验证用户工号失败，无法请求服务");
                    }else {
                        //判断token是否过期
                        Date expireDate =object.getExpiration();
                        if(expireDate.before(new Date())){
                            throw new LoginException("token已过期，请重新登录获得token");
                        }
                    }
                }
            }
        }
        return true;
    }
    @Override
    public void postHandle(HttpServletRequest httpServletRequest,
                           HttpServletResponse httpServletResponse,
                           Object o, ModelAndView modelAndView) throws Exception {
    }
    @Override
    public void afterCompletion(HttpServletRequest httpServletRequest,
                                HttpServletResponse httpServletResponse,
                                Object o, Exception e) throws Exception {
    }
}
```

## 4.2 注册JwtInterceptor

```java
/**
 * @author lyf
 * @projectName correcting-message
 * @date 2022/3/8 上午 11:22
 * @description
 */
@Configuration
public class InterceptorConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authenticationInterceptor())
                .addPathPatterns("/controller/**");
    }
    @Bean
    public JwtInterceptor authenticationInterceptor() {
        return new JwtInterceptor();
    }
}
```

## 5 Swagger2配置

```java
/**
 * @author lyf
 * @projectName correcting-message
 * @date 2022/2/21 下午 03:42
 * @description swagger2配置
 **/
@Configuration
@EnableSwagger2
@EnableConfigurationProperties(Swagger2Propertity.class)
public class Swagger2Config {
    @ConditionalOnProperty(name = "swagger2.enabled",havingValue = "true")
    @Bean
    public Docket createDocket(){
        Docket docket=new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(getApiInfo())  //getApiInfo() 省略swagger信息方法
                //设置全局参数
                .globalOperationParameters(configGlobalParamer())
                //添加安全验证
                .securitySchemes(configSecurityScheme())
                .securityContexts(securityContexts())
                .groupName("correcting data")
                .select()
                //API有效的路径
                .apis(RequestHandlerSelectors.basePackage("com.foxconn.controller"))
                .build();
        return docket;
    }
    /**
     * 配置全局安全Scheme,用于安全访问资源
     * @return
     */
    public List<ApiKey> configSecurityScheme() {
        List<ApiKey> apiKeyList= new ArrayList<ApiKey>();
        //Authorization key值固定
        apiKeyList.add(new ApiKey("Authorization", "Authorization", "header"));
        return apiKeyList;
    }
    private List<SecurityContext> securityContexts() {
        List<SecurityContext> securityContexts = new ArrayList<>();
        securityContexts.add(SecurityContext.builder()
                .securityReferences(defaultAuth())
                .forPaths(PathSelectors.regex("^(?!app).*$")).build());
        return securityContexts;
    }
    private List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
        AuthorizationScope[] authorizationScopes = new AuthorizationScope[1];
        authorizationScopes[0] = authorizationScope;
        List<SecurityReference> securityReferences = new ArrayList<>();
        securityReferences.add(new SecurityReference("Authorization", authorizationScopes));
        return securityReferences;
    }
    /**
     * 配置全局参数
     * @return
     */
    public  List<Parameter> configGlobalParamer(){
        List<Parameter> pars = new ArrayList<>();
        ParameterBuilder headerPar = new ParameterBuilder();
        Parameter p = headerPar
                //header请求头类型
                .parameterType("header")
                .modelRef(new ModelRef("string"))
                //参数名字
                .name("empno")
                //参数描述
                .description("empno请求头中用户工号，用于校验token中的用户信息")
                //该参数是否必须，false表示非必须
                .required(false)
                .build();
        pars.add(p);
        return pars;
    }
    /**
     * 重定向
     * @return
     */
    @RequestMapping("/")//重定向url
    public ModelAndView forwardSwagger() {
        ModelAndView mvc=new ModelAndView();
        mvc.setViewName("redirect:/swagger-ui.html");
        return mvc;
    }
}
```

## 4 项目结构

## 5 测试

## 5.1 获得token

## 5.2 测试非登录请求——不带token验证

## 5.3 测试非登录请求——带token验证

>
