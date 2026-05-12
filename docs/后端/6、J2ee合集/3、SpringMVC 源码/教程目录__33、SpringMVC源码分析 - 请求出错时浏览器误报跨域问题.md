# 33、SpringMVC源码分析 - 请求出错时浏览器误报跨域问题
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/33.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

项目中定义了跨域过滤器，有些接口请求时出现错误，浏览器上却显示了跨域错误。

## 一、现象

```java
Access to XMLHttpRequest at 'http://192.168.100.73:7901/demo/ftpFile/upload?project=11&projectVersion=11&relatedSoftware=CppUnit%E8%A2%AB%E6%B5%8B%E4%BB%B6&unit=11&type=document' from origin 'http://192.168.100.73:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
POST http://192.168.100.73:7901/demo/ftpFile/upload?project=11&projectVersion=11&relatedSoftware=CppUnit%E8%A2%AB%E6%B5%8B%E4%BB%B6&unit=11&type=document net::ERR_FAILED
```

## 二、跨域过滤器

```java
public class CustomCorsFilter extends CorsFilter {
    private CorsProps corsProps;
    public CustomCrosFilter(CorsConfigurationSource configSource, CorsProps corsProps) {
        super(configSource);
        this.corsProps = corsProps;
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        response.setHeader("Access-Control-Allow-Origin", corsProps.getOrigin());
        response.setHeader("Access-Control-Allow-Credentials", corsProps.getCredentials());
        response.setHeader("Access-Control-Allow-Methods", corsProps.getMethods());
        response.setHeader("Access-Control-Allow-Headers", corsProps.getHeaders());
        filterChain.doFilter(request, response);
    }
```

## 三、分析

**1、** 通过调试，请求经过跨域过滤器时，响应头中设置了跨域的信息；

**2、** 请求出现异常时，异常抛给了web容器，这里使用的容器是Undertow，在这里响应头被清理掉了；

```java
//重置 response
response.reset();                       //reset the response
exchange.setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR);
//清理了响应头
exchange.getResponseHeaders().clear();
//获取新的请求错误路径
String location = servletContext.getDeployment().getErrorPages().getErrorLocation(t);
```

**3、** 在找到对应错误页面或默认错误页面后，没有再次通过跨域过滤器设置跨域信息，导致形响应结果中没有带跨域信息，引起浏览器报跨域的错；

## 四、解决方式

**1、** 在错误页面中设置跨域信息；

每个方法都调用一下设置跨域信息的方法

```java
@RestController
public class ErrorPageController {
    @Autowired
    private CorsProps corsProps;
    @RequestMapping(value = "/400", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity to400() {
        setCors();
        return new ResponseEntity(400, "请求有误");
    }
    @RequestMapping(value = "/404", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity to404() {
        setCors();
        return new ResponseEntity(404, "找不到资源");
    }
    @RequestMapping(value = "/408", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.REQUEST_TIMEOUT)
    public ResponseEntity to408() {
        setCors();
        return new ResponseEntity(408, "请求超时");
    }
    @RequestMapping(value = "/500", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity to500() {
        setCors();
        return new ResponseEntity(500, "服务器错误");
    }
    public void setCors() {
        HttpServletResponse response = SpringUtils.getResponse();
        String origin = SpringUtils.getRequest().getHeader("Origin");
        response.setHeader("Access-Control-Allow-Origin", origin);
        //服务器同意客户端发送cookies
        response.setHeader("Access-Control-Allow-Credentials", corsProps.getCredentials());
        response.setHeader("Access-Control-Allow-Methods", corsProps.getMethods());
        response.setHeader("Access-Control-Allow-Headers", corsProps.getHeaders());
    }
}
```

这样错误信息就变成了正常的信息：

```java
POST http://192.168.100.73:7901/demo/ftpFile/unitSearch 400 (Bad Request)
Uncaught (in promise) {
     status: 400, message: "请求有误", desc: null, stackTrace: null, value: null, …}
```

**2、** 在切面中设置跨域信息；

统一设置跨域信息

```java
@Aspect
@Component
public class CorsAspect {
    @Autowired
    private CrosProps corsProps;
    /**
     * 让切面拦截到 ErrorPageController
     */
    @Pointcut("execution(* com.iscas.biz.config..error..*.*(..))")
    public void errorMethodPointcut() {
    }
    @Around(value = "errorMethodPointcut()")
    public Object around(final ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletResponse response = SpringUtils.getResponse();
        String origin = SpringUtils.getRequest().getHeader("Origin");
        response.setHeader("Access-Control-Allow-Origin", origin);
        //服务器同意客户端发送cookies
        response.setHeader("Access-Control-Allow-Credentials", corsProps.getCredentials());
        response.setHeader("Access-Control-Allow-Methods", corsProps.getMethods());
        response.setHeader("Access-Control-Allow-Headers", corsProps.getHeaders());
        Object result = joinPoint.proceed();
        return result;
    }
}
```

**3、** 在请求错误页面ErrorPageController时通过跨域过滤器；

在跨域过滤器中重写 OncePerRequestFilter 的 shouldNotFilterErrorDispatch( )方法，让错误请求进入跨域过滤器设置跨域信息。

```java
/**
     * 错误请求，是否不进入该过滤器
     * 默认为true，错误请求不会进入该过滤器，修改为false
     */
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }
```
