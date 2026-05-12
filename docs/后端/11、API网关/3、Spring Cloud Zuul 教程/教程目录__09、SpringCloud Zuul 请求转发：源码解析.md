# 09、SpringCloud Zuul 请求转发：源码解析
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/9.html
- 分类：API网关
- 分组：教程目录
spring cloud 网关，依赖于netflix 下的zuul 组件

zuul 的流程是，自定义 了ZuulServletFilter和zuulServlet两种方式，让开发者可以去实现，并调用

先来看下`ZuulServletFilter`的实现片段

```java
 @Override
public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
    try {
        init((HttpServletRequest) servletRequest, (HttpServletResponse) servletResponse);
        try {
            preRouting();
        } catch (ZuulException e) {
            error(e);
            postRouting();
            return;
        }
        // Only forward onto to the chain if a zuul response is not being sent
        if (!RequestContext.getCurrentContext().sendZuulResponse()) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }
        try {
            routing();
        } catch (ZuulException e) {
            error(e);
            postRouting();
            return;
        }
        try {
            postRouting();
        } catch (ZuulException e) {
            error(e);
            return;
        }
    } catch (Throwable e) {
        error(new ZuulException(e, 500, "UNCAUGHT_EXCEPTION_FROM_FILTER_" + e.getClass().getName()));
    } finally {
        RequestContext.getCurrentContext().unset();
    }
}
```

从上面的代码可以看到，比较关心的是`preRouting`、`routing`,`postRouting`三个方法 ，这三个方法会调用 注册为`ZuulFilter`的子类，首先来看下这三个方法

preRouting: 是路由前会做一些内容

routing():开始路由事项

postRouting：路由结束，不管是否有错误都会经过该方法

那这三个方法是怎么和`ZuulFilter`联系在一起的呢？

先来分析下 preRouting:

```java
void postRouting() throws ZuulException {
    zuulRunner.postRoute();
}
```

同时`ZuulRunner`再来调用

```java
public void postRoute() throws ZuulException {
    FilterProcessor.getInstance().postRoute();
}
```

最终调用 `FilterProcessor` 的 `runFilters`

```java
public void preRoute() throws ZuulException {
    try {
        runFilters("pre");
    } catch (ZuulException e) {
        throw e;
    } catch (Throwable e) {
        throw new ZuulException(e, 500, "UNCAUGHT_EXCEPTION_IN_PRE_FILTER_" + e.getClass().getName());
    }
}
```

看到了runFilters 是通过 filterType(pre ,route ,post )来过滤出已经注册的 ZuulFilter:

```java
public Object runFilters(String sType) throws Throwable {
    if (RequestContext.getCurrentContext().debugRouting()) {
        Debug.addRoutingDebug("Invoking {" + sType + "} type filters");
    }
    boolean bResult = false;
    //通过sType获取 zuulFilter的列表
    List<ZuulFilter> list = FilterLoader.getInstance().getFiltersByType(sType);
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

再来看下 `ZuulFilter`的定义

```java
public abstract class ZuulFilter implements IZuulFilter, Comparable<ZuulFilter> {
private final DynamicBooleanProperty filterDisabled =
        DynamicPropertyFactory.getInstance().getBooleanProperty(disablePropertyName(), false);
/**
 * to classify a filter by type. Standard types in Zuul are "pre" for pre-routing filtering,
 * "route" for routing to an origin, "post" for post-routing filters, "error" for error handling.
 * We also support a "static" type for static responses see  StaticResponseFilter.
 * Any filterType made be created or added and run by calling FilterProcessor.runFilters(type)
 *
 * @return A String representing that type
 */
abstract public String filterType();
/**
 * filterOrder() must also be defined for a filter. Filters may have the same  filterOrder if precedence is not
 * important for a filter. filterOrders do not need to be sequential.
 *
 * @return the int order of a filter
 */
abstract public int filterOrder();
/**
 * By default ZuulFilters are static; they don't carry state. This may be overridden by overriding the isStaticFilter() property to false
 *
 * @return true by default
 */
public boolean isStaticFilter() {
    return true;
}
```

只列出了一部分字段，但可以看到filterType和filterOrder两个字段，这两个分别是指定filter是什么类型，排序

这两个决定了实现的ZuulFilter会在什么阶段被执行，按什么顺序执行

当选择好已经注册的ZuulFilter后，会调用ZuulFilter的runFilter

```java
public ZuulFilterResult runFilter() {
    ZuulFilterResult zr = new ZuulFilterResult();
    if (!isFilterDisabled()) {
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

其中run 是一个`ZuulFilter`的一个抽象方法

```java
public interface IZuulFilter {
    /**
     * a "true" return from this method means that the run() method should be invoked
     *
     * @return true if the run() method should be invoked. false will not invoke the run() method
     */
    boolean shouldFilter();
    /**
     * if shouldFilter() is true, this method will be invoked. this method is the core method of a ZuulFilter
     *
     * @return Some arbitrary artifact may be returned. Current implementation ignores it.
     */
    Object run();
}    
```

所以，实现ZuulFilter的子类要重写 run方法，我们来看下 其中一个阶段的实现 `PreDecorationFilter` 这个类是Spring Cloud封装的在使用Zuul 作为转发的代码服务器时进行封装的对象，目的是为了决定当前的要转发的请求是按ServiceId，Http请求，还是forward来作转发

```java
@Override
public Object run() {
    RequestContext ctx = RequestContext.getCurrentContext();
    final String requestURI = this.urlPathHelper.getPathWithinApplication(ctx.getRequest());
    Route route = this.routeLocator.getMatchingRoute(requestURI);
    if (route != null) {
        String location = route.getLocation();
        if (location != null) {
            ctx.put("requestURI", route.getPath());
            ctx.put("proxy", route.getId());
            if (!route.isCustomSensitiveHeaders()) {
                this.proxyRequestHelper
                        .addIgnoredHeaders(this.properties.getSensitiveHeaders().toArray(new String[0]));
            }
            else {
                this.proxyRequestHelper.addIgnoredHeaders(route.getSensitiveHeaders().toArray(new String[0]));
            }
            if (route.getRetryable() != null) {
                ctx.put("retryable", route.getRetryable());
            }
            // 如果配置的转发地址是http开头，会设置 RouteHost
            if (location.startsWith("http:") || location.startsWith("https:")) {
                ctx.setRouteHost(getUrl(location));
                ctx.addOriginResponseHeader("X-Zuul-Service", location);
            }
             // 如果配置的转发地址forward，则会设置forward.to
            else if (location.startsWith("forward:")) {
                ctx.set("forward.to",
                        StringUtils.cleanPath(location.substring("forward:".length()) + route.getPath()));
                ctx.setRouteHost(null);
                return null;
            }
            else {
                 // 否则以serviceId进行转发
                // set serviceId for use in filters.route.RibbonRequest
                ctx.set("serviceId", location);
                ctx.setRouteHost(null);
                ctx.addOriginResponseHeader("X-Zuul-ServiceId", location);
            }
            if (this.properties.isAddProxyHeaders()) {
                addProxyHeaders(ctx, route);
                String xforwardedfor = ctx.getRequest().getHeader("X-Forwarded-For");
                String remoteAddr = ctx.getRequest().getRemoteAddr();
                if (xforwardedfor == null) {
                    xforwardedfor = remoteAddr;
                }
                else if (!xforwardedfor.contains(remoteAddr)) { // Prevent duplicates
                    xforwardedfor += ", " + remoteAddr;
                }
                ctx.addZuulRequestHeader("X-Forwarded-For", xforwardedfor);
            }
            if (this.properties.isAddHostHeader()) {
                ctx.addZuulRequestHeader("Host", toHostHeader(ctx.getRequest()));
            }
        }
    }
    else {
        log.warn("No route found for uri: " + requestURI);
        String fallBackUri = requestURI;
        String fallbackPrefix = this.dispatcherServletPath; // default fallback
                                                            // servlet is
                                                            // DispatcherServlet
        if (RequestUtils.isZuulServletRequest()) {
            // remove the Zuul servletPath from the requestUri
            log.debug("zuulServletPath=" + this.properties.getServletPath());
            fallBackUri = fallBackUri.replaceFirst(this.properties.getServletPath(), "");
            log.debug("Replaced Zuul servlet path:" + fallBackUri);
        }
        else {
            // remove the DispatcherServlet servletPath from the requestUri
            log.debug("dispatcherServletPath=" + this.dispatcherServletPath);
            fallBackUri = fallBackUri.replaceFirst(this.dispatcherServletPath, "");
            log.debug("Replaced DispatcherServlet servlet path:" + fallBackUri);
        }
        if (!fallBackUri.startsWith("/")) {
            fallBackUri = "/" + fallBackUri;
        }
        String forwardURI = fallbackPrefix + fallBackUri;
        forwardURI = forwardURI.replaceAll("//", "/");
        ctx.set("forward.to", forwardURI);
    }
    return null;
}
```

这个前置处理，是为了后面决定以哪种ZuulFilter来处理当前的请求 ，如 `SimpleHostRoutingFilter`，这个的filterType是`post` ,当 ``PreDecorationFilter设置了requestContext中的 RouteHost，如 `SimpleHostRoutingFilter`中的判断

```java
@Override
public boolean shouldFilter() {
    return RequestContext.getCurrentContext().getRouteHost() != null
            && RequestContext.getCurrentContext().sendZuulResponse();
}
```

在`SimpleHostRoutingFilter`中的run中，真正实现地址转发的内容，其实质是调用 httpClient进行请求

```java
@Override
public Object run() {
    RequestContext context = RequestContext.getCurrentContext();
    HttpServletRequest request = context.getRequest();
    MultiValueMap<String, String> headers = this.helper
            .buildZuulRequestHeaders(request);
    MultiValueMap<String, String> params = this.helper
            .buildZuulRequestQueryParams(request);
    String verb = getVerb(request);
    InputStream requestEntity = getRequestBody(request);
    if (request.getContentLength() < 0) {
        context.setChunkedRequestBody();
    }
    String uri = this.helper.buildZuulRequestURI(request);
    this.helper.addIgnoredHeaders();
    try {
        HttpResponse response = forward(this.httpClient, verb, uri, request, headers,
                params, requestEntity);
        setResponse(response);
    }
    catch (Exception ex) {
        context.set(ERROR_STATUS_CODE, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        context.set("error.exception", ex);
    }
    return null;
}
```

最后如果是成功能，会调用 注册 为`post`的`ZuulFilter` ,目前有两个 `SendErrorFilter` 和 `SendResponseFilter` 这两个了，一个是处理错误，一个是处理成功的结果。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
