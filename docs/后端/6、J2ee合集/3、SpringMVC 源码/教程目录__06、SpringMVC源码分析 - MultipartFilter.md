# 06、SpringMVC源码分析 - MultipartFilter
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/6.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

MultipartFilter是以filter的方式对文件上传请求进行解析，将请求转换成MultipartHttpServletRequest，在请求到达DispatcherServlet后，就能使用解析好的请求。

## 一、MultipartFilter源码

1、doFilterInternal( )

```java
@Override
	protected void doFilterInternal(
			HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		//获取文件上传解析器
		MultipartResolver multipartResolver = lookupMultipartResolver(request);
		HttpServletRequest processedRequest = request;
		//检验isMultipart
		if (multipartResolver.isMultipart(processedRequest)) {
			if (logger.isDebugEnabled()) {
				logger.debug("Resolving multipart request [" + processedRequest.getRequestURI() +
						"] with MultipartFilter");
			}
			//解析上传文件信息，转换成文件上传请求MultipartHttpServletRequest
			processedRequest = multipartResolver.resolveMultipart(processedRequest);
		}
		else {
			// A regular request...
			if (logger.isDebugEnabled()) {
				logger.debug("Request [" + processedRequest.getRequestURI() + "] is not a multipart request");
			}
		}
		try {
			//执行下一个过滤器
			filterChain.doFilter(processedRequest, response);
		}
		finally {
			if (processedRequest instanceof MultipartHttpServletRequest) {
				//清理上传文件
				multipartResolver.cleanupMultipart((MultipartHttpServletRequest) processedRequest);
			}
		}
	}
```

2、

```java
	protected MultipartResolver lookupMultipartResolver(HttpServletRequest request) {
		return lookupMultipartResolver();
	}
	protected MultipartResolver lookupMultipartResolver() {
		WebApplicationContext wac = WebApplicationContextUtils.getWebApplicationContext(getServletContext());
		//查找spring容器中名字为的filterMultipartResolverbean
		String beanName = getMultipartResolverBeanName();
		if (wac != null && wac.containsBean(beanName)) {
			if (logger.isDebugEnabled()) {
				logger.debug("Using MultipartResolver '" + beanName + "' for MultipartFilter");
			}
			return wac.getBean(beanName, MultipartResolver.class);
		}
		else {
			//返回默认的StandardServletMultipartResolver
			return this.defaultMultipartResolver;
		}
	}
```

## 二、 MultipartFilter注册

```java
@Configuration
public class FilterConfiguration {
    @Bean
    public FilterRegistrationBean filterTestRegistrationBean(){
        FilterRegistrationBean filterRegistry = new FilterRegistrationBean();
        filterRegistry.setOrder(Ordered.HIGHEST_PRECEDENCE + 3);
        //注册过滤器
        filterRegistry.setFilter(new MultipartFilter());
        filterRegistry.addUrlPatterns("/*");
        filterRegistry.setName("multipartFilter");
        return filterRegistry;
    }
}
```

这样，请求到达时，会先经过filter的处理文件上传的请求。
