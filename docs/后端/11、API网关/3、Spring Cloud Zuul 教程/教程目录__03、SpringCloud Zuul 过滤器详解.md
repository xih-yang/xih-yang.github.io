# 03、SpringCloud Zuul 过滤器详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/3.html
- 分类：API网关
- 分组：教程目录
## 1、过滤器概述

Spring Cloud Zuul包含了对请求的路由和过滤两个功能，其中路由负责将请求转发到指定的微服务上， 过滤器功负责对请求的处理过程进行干预，能够在路由HTTP请求和响应的过程中执行一系列操作，例如检测等

前面说到了过滤器有四个主要特征，继承ZuulFilter后都会重写其特征

- 类型：通常定义路由流程中使用过滤器的阶段 （字符串）
- 执行顺序：定义多个过滤器的执行顺序，值越小，执行顺序越优先
- 执行条件：执行过滤器所需要的条件
- 行为：过滤器满足条件的时候触发的行为操作

Zuul 提供了一个框架来动态读取、编译和运行这些过滤器，过滤器不相互铜线而是通过每个请求特有的请求上下文共享状态

## 2、过滤器类型

现阶段有四种过滤器类型，过滤器声明周期如上图所示

- PRE: 路由请求到指定服务实例之前过滤器被执行，例如包括请求身份验证，选择服务器和记录调试信息
- ROUTING:路由请求到服务实例时过滤器被执行
- POST: 过滤器在请求被路由到服务实例之后过滤器被执行，例如向相应中添加标准HTTP头
- ERROR: 当再其他某个阶段出现错误的时候，过滤器被执行

## 3、过滤器使用

Sping Cloud Zuul中实现的过滤器包含上述四个基本特征，即过滤器类型，执行顺序，执行条件，行为操作，实际上它就是ZuulFilter 接口定义的抽象方法，所以自定义过滤器只需要写一个过滤器继承 ZuulFilter抽象类并实现抽象方法即可，

测试代码见： [Spring Cloud Zuul 使用快速入门](/zhuanlan/gateway/springcloudzuul/2/)

```java
public class AccessFilter extends ZuulFilter {
    private static Logger log = LoggerFactory.getLogger(AccessFilter.class);
    /**
     * pre - 前置过滤器，在请求被路由前执行，通常用于处理身份认证，日志记录等；
     * route - 在路由执行后，服务调用前被调用；
     * error - 任意一个filter发生异常的时候执行或远程服务调用没有反馈的时候执行（超时），通常用于处理异常；
     * post - 在route或error执行后被调用，一般用于收集服务信息，统计服务性能指标等，也可以对response结果做特殊处理
     *
     * @return
     */
    @Override
    public String filterType() {
        return "pre";
    }
    /**
     * 同类型过滤器自然顺序执行
     * 返回值越小，执行顺序越优先
     *
     * @return
     */
    @Override
    public int filterOrder() {
        return 0;
    }
    @Override
    public boolean shouldFilter() {
        return true;
    }
    @Override
    public Object run() {
        RequestContext requestContext = RequestContext.getCurrentContext();
        HttpServletRequest request = requestContext.getRequest();
        Object accessTocken = request.getParameter("tocken");
        if (accessTocken != null) {
            //1.测试过滤器验证，只有888888返回401
            if ("888888".equals(accessTocken)) {
                requestContext.setSendZuulResponse(false);
                requestContext.setResponseStatusCode(401);
                return null;
            }
            //2.测试直接拋出自定义异常
            if ("000000".equals(accessTocken)) {
                doSomeThing();
                return null;
            }
            //3.测试直接抛出 ZuulRuntimeException 异常
            if ("111111".equals(accessTocken)) {
                throw new ZuulRuntimeException ("In AccessFilter,Error testing");
            }
            //4.测试try-catch
            if ("123456".equals(accessTocken)) {
                try {
                    throw new RuntimeException("In AccessFilter,Error testing,");
                } catch (Exception e) {
                    requestContext.set("error.status_code", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    requestContext.setThrowable(e);
                }
                return null;
            }
            return null;
        }
        return null;
    }
    private void doSomeThing() {
        log.error("AccessFilter error");
        throw new RuntimeException("In AccessFilter,Error testing,");
    }
}
```

## 4、过滤器执行流程

过滤器执行处理时序图 ，

**1、** ZuulServerAutoConfiguration定义了ServletRegistrationBean，将请求交给ZuulServlet来处理；

```java
public class ZuulServerAutoConfiguration {
    @Bean
	@ConditionalOnMissingBean(name = "zuulServlet")
	public ServletRegistrationBean zuulServlet() {
		ServletRegistrationBean servlet = new ServletRegistrationBean(new ZuulServlet(),
				this.zuulProperties.getServletPattern());
		// The whole point of exposing this servlet is to provide a route that doesn't
		// buffer requests.
		servlet.addInitParameter("buffer-requests", "false");
		return servlet;
	}
    //略
}
```

**2、** ZuulServlet提供pre,routing,post三个阶段处理方法，调用ZuulRunner对象实现；

- zuulRunner.preRoute()
- zuulRunner.route()
- zuulRunner.postRoute()

```java
@Override
public void service(javax.servlet.ServletRequest servletRequest, javax.servlet.ServletResponse servletResponse) throws ServletException, IOException {
    try {
        init((HttpServletRequest) servletRequest, (HttpServletResponse) servletResponse);
        // Marks this request as having passed through the "Zuul engine", as opposed to servlets
        // explicitly bound in web.xml, for which requests will not have the same data attached
        RequestContext context = RequestContext.getCurrentContext();
        context.setZuulEngineRan();
        try {
            preRoute();
        } catch (ZuulException e) {
            error(e);
            postRoute();
            return;
        }
        try {
            route();
        } catch (ZuulException e) {
            error(e);
            postRoute();
            return;
        }
        try {
            postRoute();
        } catch (ZuulException e) {
            error(e);
            return;
        }
    } catch (Throwable e) {
        error(new ZuulException(e, 500, "UNHANDLED_EXCEPTION_" + e.getClass().getName()));
    } finally {
        RequestContext.getCurrentContext().unset();
    }
}
//通过执行器FilterProcessor处理
public void preRoute() throws ZuulException {
    FilterProcessor.getInstance().preRoute();
}
public void route() throws ZuulException {
    FilterProcessor.getInstance().route();
}
public void postRoute() throws ZuulException {
    FilterProcessor.getInstance().postRoute();
}
public void error() {
    FilterProcessor.getInstance().error();
}
```

**3、** 过滤执行器FilterProcessor先通过过滤器类型字符串“pre”、“route”、“pre”、“post”、“error”从FilterLoader得到指定类型的过滤器并排序，因为ZuulFilter实现了接口Comparable，按照filterOrder方法提供的值排序，因此值越小，执行顺序越优先，获取所有满足条件的过滤器后，循环处理通过processZuulFilter方法执行每一个过滤器；

```java
 //FilterProcessor 过滤器处理源码
 public Object runFilters(String sType) throws Throwable {
    if (RequestContext.getCurrentContext().debugRouting()) {
        Debug.addRoutingDebug("Invoking {" + sType + "} type filters");
    }
    boolean bResult = false;
    //获取所有指定类型的过滤器
    List<ZuulFilter> list = FilterLoader.getInstance().getFiltersByType(sType);
    //循环处理每一个过滤器
    if (list != null) {
        for (int i = 0; i < list.size(); i++) {
            ZuulFilter zuulFilter = list.get(i);
            Object result = processZuulFilter(zuulFilter);
            if (result != null && result instanceof Boolean) {
                bResult |= ((Boolean) result);
            }
        }
    }
    return bResult;
}
```

```java
//FilterLoader中根据过滤器类型过去过滤器并排序
public List<ZuulFilter> getFiltersByType(String filterType) {
    List<ZuulFilter> list = hashFiltersByType.get(filterType);
    if (list != null) return list;
    list = new ArrayList<ZuulFilter>();
    Collection<ZuulFilter> filters = filterRegistry.getAllFilters();
    for (Iterator<ZuulFilter> iterator = filters.iterator(); iterator.hasNext(); ) {
        ZuulFilter filter = iterator.next();
        if (filter.filterType().equals(filterType)) {
            list.add(filter);
        }
    }
    Collections.sort(list); // sort by priority
    hashFiltersByType.putIfAbsent(filterType, list);
    return list;
}
```

```java
//ZuulFilter对象中实现了Comparable接口自定义按照filterOrder排序顺序排序
public int compareTo(ZuulFilter filter) {
    return Integer.compare(this.filterOrder(), filter.filterOrder());
}
```

**4、** ZuulFilter过滤器运行时候，先执行isFilterDisable判断过滤器是否禁用，然后执行shouldFilter方法判断是否需要执行，如果执行调用run()执行过滤器过滤行为，这两个方法也是继承ZuulFilter后需要实现的抽象方法；

```java
public ZuulFilterResult runFilter() {
    ZuulFilterResult zr = new ZuulFilterResult();
    //是否禁用了过滤器  zuul.<SimpleClassName>.<filterType>.disable=true/false
    if (!isFilterDisabled()) {
        // 抽象方法
        if (shouldFilter()) {
            Tracer t = TracerFactory.instance().startMicroTracer("ZUUL::" + this.getClass().getSimpleName());
            try {
                Object res = run();
                zr = new ZuulFilterResult(res, ExecutionStatus.SUCCESS);
            } catch (Throwable e) {
                t.setName("ZUUL::" + this.getClass().getSimpleName() + " failed");
                zr = new ZuulFilterResult(ExecutionStatus.FAILED);
                zr.setException(e);
            } finally {
                t.stopAndLog();
            }
        } else {
            zr = new ZuulFilterResult(ExecutionStatus.SKIPPED);
        }
    }
    return zr;
}
```

## 5、过滤器异常处理

过滤器SendErrorFilter是用来处理异常信息，上面说到了当shouldFilter返回true的时候才会真正处理此过滤器， shouldFilter不同版本实现有些许区别， 例如我用的版本是spring-cloud-zuul:1.3.6.RELEASE版本， 实现源码如下， 判断throwable不为空

```java
//spring-cloud-zuul:1.3.6.RELEASE的源码
@Override
public boolean shouldFilter() {
    RequestContext ctx = RequestContext.getCurrentContext();
    // only forward to errorPath if it hasn't been forwarded to already
    return ctx.getThrowable() != null
            && !ctx.getBoolean(SEND_ERROR_FILTER_RAN, false);
}
```

《Spring Cloud 微服务实战》 书中提到shouldFilter方法却不同

```java
public boolean shouldFilter() {
    RequestContext ctx = RequestContext.getCurrentContext();
    return ctx.containsKeys("error.status_code")
            && !ctx.getBoolean(SEND_ERROR_FILTER_RAN, false);
}
```

因此一般情况如果异常过滤器没有处理，需要检查版本中的SendErrorFilter#shouldFilter实现代码，再考虑自定义过滤器编码中的问题

## 6、过滤器禁用方式

ZuulFilter过滤器运行时候，先执行isFilterDisable判断过滤器是否禁用，然后执行shouldFilter方法判断是否需要执行最后在执行过滤器行为，可以通过参数来禁用指定的过滤器，格式如下

```java
###禁用过滤器
###格式：zuul.<SimpleClassName>.<pre>.disable=true
zuul.AccessFilter.pre.disable=true
```

因此当过滤器不确定是否暂时不同后续还会使用的情况时，建议通过参数先禁用此过滤器不需要修改代码

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
