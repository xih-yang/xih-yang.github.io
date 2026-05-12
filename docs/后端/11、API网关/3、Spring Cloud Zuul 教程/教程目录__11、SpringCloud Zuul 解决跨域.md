# 11、SpringCloud Zuul 解决跨域
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/11.html
- 分类：API网关
- 分组：教程目录
**SpringCloud zuul 网关解决跨域问题得具体实现**

## 1、跨域

在SpringCloud中 zuul 和springboot 要同时配置才能实现网关处理跨域

```sh
解决Access to XMLHttpRequest at ‘[http://192.168.2.173:8001/energy-base/groupType/getPageByType?timestamp=1557886425725][http_192.168.2.173_8001_energy-base_groupType_getPageByType_timestamp_1557886425725]’ from origin ‘[http://localhost:3000][http_localhost_3000]’ has been blocked by CORS policy: The ‘Access-Control-Allow-Origin’ header contains multiple values ‘[http://localhost:3000][http_localhost_3000], \*’, but only one is allowed.
```java 
Access-Control-Allow-Origin只能有一个值解决方案
## SpringBoot代码
```java 
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true); // 允许cookies跨域
        config.addAllowedOrigin("*");// #允许向该服务器提交请求的URI，*表示全部允许，在SpringMVC中，如果设成*，会自动转成当前请求头中的Origin
        config.addAllowedHeader("*");// #允许访问的头信息,*表示全部
        config.setMaxAge(7200L);// 预检请求的缓存时间（秒），即在这个时间段里，对于相同的跨域请求不会再预检了
        config.addAllowedMethod("*");// 允许提交请求的方法，*表示全部允许
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

## 2、zuul yml配置

```sh
zuul:
  #需要忽略的头部信息，不在传播到其他服务
  sensitive-headers: Access-Control-Allow-Origin
  ignored-headers: Access-Control-Allow-Origin,H-APP-Id,Token,APPToken
  max:
    host:
      connections: 5000 #最大请求时间
  host:  #等待
    socket-timeout-millis: 60000
    connect-timeout-millis: 60000
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
