# 10、SpringCloud Zuul 负载均衡
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/10.html
- 分类：API网关
- 分组：教程目录
在微服务架构中，有一个组件可以说是必不可少的，那就是微服务网关，微服务网关处理了负载均衡，缓存，路由，访问控制，服务代理，监控，日志等。API网关在微服务架构中正是以微服务网关的身份存在。

一般在微服务架构中，网关都是部署多个服务的，以实现负载均衡和保证高可用。

## 1、使用 Nginx+Zuul 实现网关集群

**1、** 互联网公司中网关都是集群 搭建集群: Nginx+Zuul 一主一备，或者轮询多个。

**2、** 在微服务中，所有服务请求都会统一请求到Zuul网关上。

**过程：客户端发送请求统一到Nginx上，在使用Nginx实现反向代理和负载均衡，采用轮询算法转发到网关上。**

## 2、创建Eurek注册中心、会员服务、订单服务 (略)

搭建Zull集群前，应该对Eureka注册中心，以及创建SpringBoot项目应该有了解，这里就不一 一赘述了。

实际上创建会员服务、订单服务这一步可以省略，因为我们仅仅是为了演示Nginx对Zuul网关的负载均衡效果。

会员服务配置:

```sh
#会员服务
server:
  port: 8082
spring:
  application:
    name: member-service    #服务名
#Eureka配置
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:8761/eureka/     #注册中心的地址
```

订单服务:

```java
#订单服务
server:
  port: 8081
spring:
  application:
    name: order-service   #服务名
#Eureka配置
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:8761/eureka/      #注册中心地址
```

## 3、创建Zuul服务

**application.yml文件中配置 （Zull的配置生产时一般是放到配置中心中）**

```java
#配置Zuul端口
server:
  port: 81
spring:
  application:
    name: zull-gateway-service    #服务名
#Eureka配置
eureka:
  client:
    service-url:
      defaultZone: http://127.0.0.1:8761/eureka/    #注册中心地址
# 配置网关反向代理，例如访问/api-member/** 直接重定向到member-service服务,实现路由转发，隐藏服务的真实ip(服务都实在内网中)
#zull根据服务名，去Eureka获取服务真实地址，并通过本地转发，而且默认开启Ribbon实现负载均衡
#默认读取Eureka注册列表 默认30秒间隔  
zuul:
 routes:
   api-a: #会员服务网关配置
     path: /api-member/**   #访问只要是/api-member/ 开头的直接转发到member-service服务
     #服务名
     serviceId: member-service
   api-b: #订单服务网关配置
     path: /api-order/**
     serviceId: order-service
```

**创建TokenFilet类继承ZuulFilter，在run方法中输入网关的端口，调用服务时方便查看Nginx转发到哪个网关**

```java
package com.example.zuul.filter;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import com.netflix.zuul.exception.ZuulException;
import io.micrometer.core.instrument.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
@Component
public class TokenFilter extends ZuulFilter {
	//统计当前Zuul调用次数
    int count = 0;
	//获取Zuul服务端口号
    @Value("${server.port}")
    private String prot;
    /**
     * 指定该Filter的类型
     * ERROR_TYPE = "error";
     * POST_TYPE = "post";
     * PRE_TYPE = "pre";
     * ROUTE_TYPE = "route";
     */
    @Override
    public String filterType() {
        System.out.println("filterType()...");
        return "pre";
    }
    /**
     * 指定该Filter执行的顺序（Filter从小到大执行）
     * DEBUG_FILTER_ORDER = 1;
     * FORM_BODY_WRAPPER_FILTER_ORDER = -1;
     * PRE_DECORATION_FILTER_ORDER = 5;
     * RIBBON_ROUTING_FILTER_ORDER = 10;
     * SEND_ERROR_FILTER_ORDER = 0;
     * SEND_FORWARD_FILTER_ORDER = 500;
     * SEND_RESPONSE_FILTER_ORDER = 1000;
     * SIMPLE_HOST_ROUTING_FILTER_ORDER = 100;
     * SERVLET_30_WRAPPER_FILTER_ORDER = -2;
     * SERVLET_DETECTION_FILTER_ORDER = -3;
     */
    @Override
    public int filterOrder() {
        System.out.println("filterOrder()...");
        return 0;
    }
    /**
     * 指定需要执行该Filter的规则
     * 返回true则执行run()
     * 返回false则不执行run()
     */
    @Override
    public boolean shouldFilter() {
        System.out.println("shouldFilter()...");
        return true;
    }
    /**
     * 该Filter具体的执行活动
     */
    @Override
    public Object run() throws ZuulException {
        // 获取上下文
        //RequestContext currentContext = RequestContext.getCurrentContext();
        //HttpServletRequest request = currentContext.getRequest();
        //获取userToken
       // String userToken = request.getParameter("userToken");
        //System.out.println("userToken: "+userToken);
        //if (StringUtils.isEmpty(userToken)) {
            //不会继续执行调用服务接口，网关直接响应给客户端
            //currentContext.setSendZuulResponse(false);
            //currentContext.setResponseStatusCode(401);
           // currentContext.setResponseBody("userToken is Null");
           // return null;
       // }else if(!userToken.equals("10010")){
           // currentContext.setSendZuulResponse(false);
            //currentContext.setResponseStatusCode(401);
            //currentContext.setResponseBody("userToken is Error");
            //return null;
        //}
        // 否则正常执行业务逻辑，调用服务.....
        System.out.println("访问Zuul网关端口为："+prot +"（total："+ ( count++) +"）");
        return null;
    }
}
```

**启动两个Zuul服务，端口号分别为81和82**

## 4、下载Nginx服务器

这里演示使用Windows版本，Linux安装也很简单，后面操作都一样。

windows版下载地址：http://nginx.org/en/download.html

**下载好后解压，进入conf目录找到nginx.conf文件打开，配置如下：**

```sh
#配置上游服务器 集群，默认轮询机制
	upstream backServer{
		server 127.0.0.1:81;
		server 127.0.0.1:82;
		# 补充: backup表示从服务器或者叫备用服务器  只有当主服务器（81、82端口）都不能访问时才会访问此（83端口）备用服务器 当主服务器恢复正常后 则访问主服务器
		#server 127.0.0.1:83 backup;
	}
    server {
        listen       80;
        server_name  localhost;
        #charset koi8-r;
        #access_log  logs/host.access.log  main;
        location / {
            ##root   html;
			#指定上游负载均衡服务器
			proxy_pass http://backServer/;
            index  index.html index.htm;
        }
    }
```

**双击nginx.exe启动Nginx服务器**

## 5、测试

浏览器访问http://localhost/api-member

我们可以看到两个网关分别输出了日志，实现了负载均衡

**我们看到访问的次数不一样，这其实和使用Google浏览器有关，可以换其他浏览器试试。**

## 6、补充

**Nginx和网关的区别在什么地方？**

**1、** 都可以实现反向代理；

**2、** 都可以实现负载均衡，Nginx是服务端负载均衡，Zuul是本地负载均衡；

**Nginx也可以实现网关，为什么不用Nginx实现网关呢？**

因为微服务网关是针对整个微服务实现统一的请求拦截，网关基本上都是采用自己熟悉的语言开发的，目的方便易学。

**网关的作用:**

**1、** 网关对所有服务会话进行拦截；

**2、** 网关安全控制、统一异常处理、xxs、sql注入；

**3、** 权限控制、黑名单和白名单、性能监控、日志打印等；

**关于Nginx负载均衡故障转移：**

**1、** 设置备用服务器(主从架构)，只有当所有主服务器不可用时才会负载到备服务器，当主服务器恢复正常时则负载到主服务器；

```sh
upstream backServer{
    server 127.0.0.1:81;
    server 127.0.0.1:82;
    # 补充: backup表示从服务器或者叫备用服务器  只有当主服务器（81、82端口）都不能访问时才会访问此（83端口）备用服务器 当主服务器恢复正常后 则访问主服务器
    server 127.0.0.1:83 backup;
}
```

**1、** 设置Nginx转发请求超时时间；

```sh
upstream backServer{
    server 127.0.0.1:81;
    server 127.0.0.1:82;
    server 127.0.0.1:83 backup;
}
location / {
    proxy_pass   http://backServer/;
    proxy_redirect  default;
    proxy_connect_timeout 1;  # 超时1s则转发到其他服务，宕机情况下也适用
    proxy_read_timeout 1;
    proxy_send_timeout 1;
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
