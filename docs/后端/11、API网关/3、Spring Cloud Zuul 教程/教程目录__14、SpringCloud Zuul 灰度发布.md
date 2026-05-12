# 14、SpringCloud Zuul 灰度发布
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/14.html
- 分类：API网关
- 分组：教程目录
zuul依赖于ribbon-discovery-filter-spring-cloud-starter实现灰度发布，通过客户端的发送到zuul上的请求所带的标志性参数进行路由。

## 1、zuul服务

**maven依赖**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
</dependency>
<dependency>
    <groupId>io.jmnarloch</groupId>
    <artifactId>ribbon-discovery-filter-spring-cloud-starter</artifactId>
    <version>2.1.0</version>
</dependency>
```

**灰度发布需要的过滤器**

```java
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import io.jmnarloch.spring.cloud.ribbon.support.RibbonFilterContextHolder;
import javax.servlet.http.HttpServletRequest;
import static org.springframework.cloud.netflix.zuul.filters.support.FilterConstants.PRE_DECORATION_FILTER_ORDER;
import static org.springframework.cloud.netflix.zuul.filters.support.FilterConstants.PRE_TYPE;
public class GrayFilter extends ZuulFilter {
    @Override
    public boolean shouldFilter() {
        return true;
    }
    @Override
    public Object run() {
        HttpServletRequest request = RequestContext.getCurrentContext().getRequest();
        String mark = request.getHeader("gray_mark");
        if (mark != null && "enable".equals(mark)) {
            RibbonFilterContextHolder.getCurrentContext().add("host-mark", "gray");
        } else {
            RibbonFilterContextHolder.getCurrentContext().add("host-mark", "running");
        }
        return null;
    }
    @Override
    public String filterType() {
        return PRE_TYPE;
    }
    @Override
    public int filterOrder() {
        return PRE_DECORATION_FILTER_ORDER - 1;
    }
}
```

## 2、服务端

**修改注册中心的配置**

```sh
eureka:
  client:
    serviceUrl:
      defaultZone: http://127.0.0.1:8000/eureka   #注册中心地址
    registry-fetch-interval-seconds: 10    #客户端拉取服务端的频率
  instance:
    metadata-map:
      #host-mark: gray      #灰度标志
      host-mark: running
```

## 3、Http客户端

Http客户端发送请求时需要在请求头中添加gray_mark=gray或running即可选择灰度版本或者正式版本

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
