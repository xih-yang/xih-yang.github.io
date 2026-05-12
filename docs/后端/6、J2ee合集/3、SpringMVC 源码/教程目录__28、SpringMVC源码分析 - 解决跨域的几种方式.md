# 28、SpringMVC源码分析 - 解决跨域的几种方式
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/28.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

。

## 一、跨域

是由于浏览器的同源策略限制，同源策略是一个重要的安全策略，会阻止一个域的javascript脚本和另外一个域的内容进行交互。一个请求url的协议（protocol）、域名（host）、端口（port）都要相同，其中有一个不同都会产生跨域问题。

## 二、解决

### 1、CorsFilter

1、自定义 CustomCorsFilter

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

2、CorsProps

```java
@ConfigurationProperties(prefix = "cors")
@Data
public class CorsProps {
    private String origin = "*";
    private String credentials = "true";
    private String methods = "POST, GET, PUT, DELETE, OPTIONS";
    private String headers = "Content-Type, Data-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Accept, DataType, responseType";
    private String maxAge = "300";
}
```

3、CorsAutoConfiguration

```java
@Configuration
@ConditionalOnProperty(prefix = "cors",matchIfMissing = true,value = "enabled")
@Slf4j
public class CorsAutoConfiguration {
    @Autowired
    private CorsProps corsProps;
    @Bean
    public CustomCorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", buildConfig());
        return new CustomCorsFilter(source,crosProps);
    }
    private CorsConfiguration buildConfig() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        // Access-Control-Allow-Origin
        corsConfiguration.addAllowedOrigin(corsProps.getOrigin());
        corsConfiguration.addAllowedHeader(corsProps.getHeaders());
        // Access-Control-Allow-Methods
        corsConfiguration.addAllowedMethod(corsProps.getMethods());
        // 预检请求的有效期 Access-Control-Max-Age
        corsConfiguration.setMaxAge(Long.valueOf(corsProps.getMaxAge()));
        // 是否支持安全证书 Access-Control-Allow-Credentials
        corsConfiguration.setAllowCredentials(Boolean.valueOf(corsProps.getCredentials()));
        return corsConfiguration;
    }
    @Bean
    public FilterRegistrationBean corsFilterRegistrationBean(CustomCorsFilter corsFilter) {
        FilterRegistrationBean frb = new FilterRegistrationBean();
        //设置最高优先级
        frb.setOrder(Ordered.HIGHEST_PRECEDENCE);
        frb.setFilter(corsFilter);
        frb.addUrlPatterns("/*");
        frb.setName("customCorsFilter ");
        return frb;
    }
```

### 2、实现 WebMvcConfigurer

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
   @Autowired
    private CorsProps corsProps;
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowCredentials(Boolean.getBoolean(corsProps.getCredentials()))
                .allowedOrigins(corsProps.getOrigin())
                .allowedMethods(corsProps.getMethods().split(","))
                .allowedHeaders(corsProps.getHeaders());
    }
}
```

### 3、实现 HandlerInterceptor

1、CorsHandlerInterceptor

```java
public class CorsHandlerInterceptor implements HandlerInterceptor {
    private CorsProps corsProps;
    public CorsHandlerInterceptor(CorsProps corsProps) {
        this.corsProps = corsProps;
    }
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        response.setHeader("Access-Control-Allow-Origin", corsProps.getOrigin());
        response.setHeader("Access-Control-Allow-Credentials", corsProps.getCredentials());
        response.setHeader("Access-Control-Allow-Methods", corsProps.getMethods());
        response.setHeader("Access-Control-Allow-Headers", corsProps.getHeaders());
        return true;
    }
}
```

2、注册拦截器

```java
@Configuration
public class CorsInterceptorConfig implements WebMvcConfigurer {
    @Autowired
    private CorsProps corsProps;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 添加拦截器，配置拦截地址
        registry.addInterceptor(new CorsHandlerInterceptor(corsProps))
                .addPathPatterns("/**");;
    }
}
```

其他方式也可以实现，如通过 @CrossOrigin 进行更细粒度的控制跨域 ，通过 nginx 进行代理转发等。
