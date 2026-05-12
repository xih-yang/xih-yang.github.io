# 10、服务网关Zuul高级篇
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/10.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

上一篇我们主要聊到了Zuul的使用方式，以及自动转发机制，其实Zuul还有更多的使用姿势，比如：鉴权、流量转发、请求统计等。

## 1. Zuul的核心

Zuul的核心是Filter，用来实现对外服务的控制。分别是“PRE”、“ROUTING”、“POST”、“ERROR”，整个生命周期可以用下图来表示。

Zuul大部分功能都是通过过滤器来实现的。Zuul中定义了四种标准过滤器类型，这些过滤器类型对应于请求的典型生命周期。

- **PRE：** 这种过滤器在请求被路由之前调用。我们可利用这种过滤器实现身份验证、在集群中选择请求的微服务、记录调试信息等。
- **ROUTING：** 这种过滤器将请求路由到微服务。这种过滤器用于构建发送给微服务的请求，并使用Apache HttpClient或Netfilx Ribbon请求微服务。
- **OST：** 这种过滤器在路由到微服务以后执行。这种过滤器可用来为响应添加标准的HTTP Header、收集统计信息和指标、将响应从微服务发送给客户端等。
- **ERROR：** 在其他阶段发生错误时执行该过滤器。

## 2. Zuul中默认实现的Filter

类型
顺序
过滤器
功能

pre
-3
ServletDetectionFilter
标记处理Servlet的类型

pre
-2
Servlet30WrapperFilter
包装HttpServletRequest请求

pre
-1
FormBodyWrapperFilter
包装请求体

route
1
DebugFilter
标记调试标志

route
5
PreDecorationFilter
处理请求上下文供后续使用

route
10
RibbonRoutingFilter
serviceId请求转发

route
100
SimpleHostRoutingFilter
url请求转发

route
500
SendForwardFilter
forward请求转发

post
0
SendErrorFilter
处理有错误的请求响应

post
1000
SendResponseFilter
处理正常的请求响应

### 2.1 禁用指定的Filter

可以在application.yml中配置需要禁用的filter，格式：

```java
zuul:
  FormBodyWrapperFilter:
    pre:
      disable: true
```

## 3. 自定义Filter

实现自定义Filter，需要继承ZuulFilter的类，并覆盖其中的4个方法。

```java
package com.springcloud.zuulsimple.filter;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.exception.ZuulException;
/**
 * Created with IntelliJ IDEA.
 *
 * @User: weishiyao
 * @Date: 2021/7/6
 * @Time: 16:10
 * @email: inwsy@hotmail.com
 * Description:
 */
public class MyFilter extends ZuulFilter {
    @Override
    public String filterType() {
        return null;
    }
    @Override
    public int filterOrder() {
        return 0;
    }
    @Override
    public boolean shouldFilter() {
        return false;
    }
    @Override
    public Object run() throws ZuulException {
        return null;
    }
}
```

## 4. 自定义Filter示例

我们假设有这样一个场景，因为服务网关应对的是外部的所有请求，为了避免产生安全隐患，我们需要对请求做一定的限制，比如请求中含有Token便让请求继续往下走，如果请求不带Token就直接返回并给出提示。

### 4.1 zuul-simple修改

首先，将上一篇的zuul-simple copy到一个新的文件夹中，自定义一个Filter，在run()方法中验证参数是否含有Token。

```java
package com.springcloud.zuulsimple.filter;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import com.netflix.zuul.exception.ZuulException;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.servlet.http.HttpServletRequest;
/**
 * Created with IntelliJ IDEA.
 *
 * @User: weishiyao
 * @Date: 2021/7/6
 * @Time: 16:11
 * @email: inwsy@hotmail.com
 * Description:
 */
public class TokenFilter extends ZuulFilter {
    private final Logger logger = LoggerFactory.getLogger(TokenFilter.class);
    @Override
    public String filterType() {
        return "pre"; // 可以在请求被路由之前调用
    }
    @Override
    public int filterOrder() {
        return 0; // filter执行顺序，通过数字指定 ,优先级为0，数字越大，优先级越低
    }
    @Override
    public boolean shouldFilter() {
        return true;// 是否执行该过滤器，此处为true，说明需要过滤
    }
    @Override
    public Object run() throws ZuulException {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        logger.info("--->>> TokenFilter {},{}", request.getMethod(), request.getRequestURL().toString());
        String token = request.getParameter("token");// 获取请求的参数
        if (StringUtils.isNotBlank(token)) {
            ctx.setSendZuulResponse(true); //对请求进行路由
            ctx.setResponseStatusCode(200);
            ctx.set("isSuccess", true);
            return null;
        } else {
            ctx.setSendZuulResponse(false); //不对其进行路由
            ctx.setResponseStatusCode(400);
            ctx.setResponseBody("token is empty");
            ctx.set("isSuccess", false);
            return null;
        }
    }
}
```

将TokenFilter加入到请求拦截队列，在启动类中添加以下代码：

```java
@Bean
public TokenFilter tokenFilter() {
  return new TokenFilter();
}
```

这样就将我们自定义好的Filter加入到了请求拦截中。

### 4.2 测试

将上一篇的Eureka和producer都CV到新的文件夹下面，依次启动。

打开浏览器，我们访问：[http://localhost:8080/spring-cloud-producer/hello?name=spring](http://localhost:8080/spring-cloud-producer/hello?name=spring)， 返回：token is empty ，请求被拦截返回。

访问地址：[http://localhost:8080/spring-cloud-producer/hello?name=spring&token=123，返回：hello](http://localhost:8080/spring-cloud-producer/hello?name=spring&token=123，返回：hello) spring，producer is ready，说明请求正常响应。

通过上面这例子我们可以看出，我们可以使用“PRE”类型的Filter做很多的验证工作，在实际使用中我们可以结合shiro、oauth2.0等技术去做鉴权、验证。

## 5. 路由熔断

当我们的后端服务出现异常的时候，我们不希望将异常抛出给最外层，期望服务可以自动进行降级处理。Zuul给我们提供了这样的支持。当某个服务出现异常时，直接返回我们预设的信息。

我们通过自定义的fallback方法，并且将其指定给某个route来实现该route访问出问题的熔断处理。主要继承FallbackProvider接口来实现，FallbackProvider默认有两个方法，一个用来指明熔断拦截哪个服务，一个定制返回内容。

```java
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.springframework.cloud.netflix.zuul.filters.route;
import org.springframework.http.client.ClientHttpResponse;
/**
 * Provides fallback when a failure occurs on a route.
 *
 * @author Ryan Baxter
 * @author Dominik Mostek
 */
public interface FallbackProvider {
    /**
     * The route this fallback will be used for.
     * @return The route the fallback will be used for.
     */
    String getRoute();
    /**
     * Provides a fallback response based on the cause of the failed execution.
     * @param route The route the fallback is for
     * @param cause cause of the main method failure, may be <code>null</code>
     * @return the fallback response
     */
    ClientHttpResponse fallbackResponse(String route, Throwable cause);
}
```

实现类通过实现getRoute方法，告诉Zuul它是负责哪个route定义的熔断。而fallbackResponse方法则是告诉 Zuul 断路出现时，它会提供一个什么返回值来处理请求。

我们以上面的spring-cloud-producer服务为例，定制它的熔断返回内容。

```java
package com.springcloud.zuulsimple.component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.netflix.zuul.filters.route.FallbackProvider;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
/**
 * Created with IntelliJ IDEA.
 *
 * @User: weishiyao
 * @Date: 2021/7/6
 * @Time: 16:25
 * @email: inwsy@hotmail.com
 * Description:
 */
 @Component
public class ProducerFallback implements FallbackProvider {
    private final Logger logger = LoggerFactory.getLogger(FallbackProvider.class);
    //指定要处理的 service。
    @Override
    public String getRoute() {
        return "spring-cloud-producer";
    }
    public ClientHttpResponse fallbackResponse() {
        return new ClientHttpResponse() {
            @Override
            public HttpStatus getStatusCode() throws IOException {
                return HttpStatus.OK;
            }
            @Override
            public int getRawStatusCode() throws IOException {
                return 200;
            }
            @Override
            public String getStatusText() throws IOException {
                return "OK";
            }
            @Override
            public void close() {
            }
            @Override
            public InputStream getBody() throws IOException {
                return new ByteArrayInputStream("The service is unavailable.".getBytes());
            }
            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                return headers;
            }
        };
    }
    @Override
    public ClientHttpResponse fallbackResponse(String route, Throwable cause) {
        if (cause != null && cause.getCause() != null) {
            String reason = cause.getCause().getMessage();
            logger.info("Excption {}",reason);
        }
        return fallbackResponse();
    }
}
```

当服务出现异常时，打印相关异常信息，并返回”The service is unavailable.”。

需要注意点，这里我们需要将Eureka的配置文件修改一下：

```sh
server:
  port: 8761
spring:
  application:
    name: eureka-serve
eureka:
#  server:
#    enable-self-preservation: false
  client:
    register-with-eureka: false
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

将Eureka的自我保护模式打开，如果这里不开启自我保护模式，producer一停止服务，这个服务直接在Eureka下线，Zuul会直接报错找不到对应的producer服务。

我们顺次启动这三个服务。

现在打开浏览器，访问链接：[http://localhost:8080/spring-cloud-producer/hello?name=spring&token=123](http://localhost:8080/spring-cloud-producer/hello?name=spring&token=123)， 可以看到页面正常返回：hello spring，producer is ready，现在我们把producer这个服务停下，再刷新下页面，可以看到页面返回：The service is unavailable.。这样我们熔断也测试成功。

## 6. Zuul高可用

我们实际使用Zuul的方式如上图，不同的客户端使用不同的负载将请求分发到后端的Zuul，Zuul在通过Eureka调用后端服务，最后对外输出。因此为了保证Zuul的高可用性，前端可以同时启动多个Zuul实例进行负载，在Zuul的前端使用Nginx或者F5进行负载转发以达到高可用性。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter10)

参考：
[http://www.ityouknow.com/springcloud/2018/01/20/spring-cloud-zuul.html](http://www.ityouknow.com/springcloud/2018/01/20/spring-cloud-zuul.html)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
