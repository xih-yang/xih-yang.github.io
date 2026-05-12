# 13、SpringMVC源码分析 - ShallowEtagHeaderFilter
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/13.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

ShallowEtagHeaderFilter用于处理Etag，HTTP1.1用ETag来判断请求的文件是否被修改，如果未修改则返回304，让浏览器使用缓存的数据。

## 一、注册

```java
@Configuration
public class FilterConfiguration {
    @Bean
    public FilterRegistrationBean filterTestRegistrationBean(){
        FilterRegistrationBean filterRegistry = new FilterRegistrationBean();
        filterRegistry.setOrder(Ordered.HIGHEST_PRECEDENCE + 3);
        //注册过滤器
        filterRegistry.setFilter(new ShallowEtagHeaderFilter());
        filterRegistry.addUrlPatterns("/*");
        filterRegistry.setName("eTagFilter");
        return filterRegistry;
    }
}
```

## 二、流程

1、doFilterInternal( )

```java
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		HttpServletResponse responseToUse = response;
		if (!isAsyncDispatch(request) && !(response instanceof ConditionalContentCachingResponseWrapper)) {
			//包装response、request
			responseToUse = new ConditionalContentCachingResponseWrapper(response, request);
		}
		//执行过滤器连
		filterChain.doFilter(request, responseToUse);
		if (!isAsyncStarted(request) && !isContentCachingDisabled(request)) {
			updateResponse(request, responseToUse);
		}
	}
```

2、updateResponse( )

```java
private void updateResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
		ConditionalContentCachingResponseWrapper wrapper =
				WebUtils.getNativeResponse(response, ConditionalContentCachingResponseWrapper.class);
		Assert.notNull(wrapper, "ContentCachingResponseWrapper not found");
		HttpServletResponse rawResponse = (HttpServletResponse) wrapper.getResponse();
		//校验Etag
		if (isEligibleForEtag(request, wrapper, wrapper.getStatus(), wrapper.getContentInputStream())) {
			String eTag = wrapper.getHeader(HttpHeaders.ETAG);
			if (!StringUtils.hasText(eTag)) {
				//不存在时，生成Etag
				eTag = generateETagHeaderValue(wrapper.getContentInputStream(), this.writeWeakETag);
				//设置响应header
				rawResponse.setHeader(HttpHeaders.ETAG, eTag);
			}
			//校验Etag，资源Etag不变时，return
			if (new ServletWebRequest(request, rawResponse).checkNotModified(eTag)) {
				return;
			}
		}
		//Etag改变时，将响应题写入Response 响应给浏览器
		wrapper.copyBodyToResponse();
	}
```

3、isEligibleForEtag( )

```java
protected boolean isEligibleForEtag(HttpServletRequest request, HttpServletResponse response,
			int responseStatusCode, InputStream inputStream) {
		//response没有完成，响应码在200~300之间，并且是get请求
		if (!response.isCommitted() &&
				responseStatusCode >= 200 && responseStatusCode < 300 &&
				HttpMethod.GET.matches(request.getMethod())) {
			String cacheControl = response.getHeader(HttpHeaders.CACHE_CONTROL);
			//并且cacheControl为null或者cacheControl不包含no-store
			return (cacheControl == null || !cacheControl.contains(DIRECTIVE_NO_STORE));
		}
		return false;
	}
```

4、generateETagHeaderValue( )

对资源的inputStream进行md5计算

```java
protected String generateETagHeaderValue(InputStream inputStream, boolean isWeak) throws IOException {
		// length of W/ + " + 0 + 32bits md5 hash + "
		StringBuilder builder = new StringBuilder(37);
		if (isWeak) {
			builder.append("W/");
		}
		builder.append("\"0");
		DigestUtils.appendMd5DigestAsHex(inputStream, builder);
		builder.append('"');
		return builder.toString();
	}
```

5、checkNotModified( )

定位到Etag的校验

validateIfNoneMatch(etag)

```java
private boolean validateIfNoneMatch(@Nullable String etag) {
		if (!StringUtils.hasLength(etag)) {
			return false;
		}
		Enumeration<String> ifNoneMatch;
		try {
			//获取请求header中的If-None-Match
			ifNoneMatch = getRequest().getHeaders(HttpHeaders.IF_NONE_MATCH);
		}
		catch (IllegalArgumentException ex) {
			return false;
		}
		if (!ifNoneMatch.hasMoreElements()) {
			return false;
		}
		// We will perform this validation...
		etag = padEtagIfNecessary(etag);
		if (etag.startsWith("W/")) {
			etag = etag.substring(2);
		}
		while (ifNoneMatch.hasMoreElements()) {
			String clientETags = ifNoneMatch.nextElement();
			//正则出Etag
			Matcher etagMatcher = ETAG_HEADER_VALUE_PATTERN.matcher(clientETags);
			// Compare weak/strong ETags as per https://tools.ietf.org/html/rfc7232#section-2.3
			while (etagMatcher.find()) {
				//通过equals进行值的比对
				if (StringUtils.hasLength(etagMatcher.group()) && etag.equals(etagMatcher.group(3))) {
					//匹配到任意一个Etag
					this.notModified = true;
					break;
				}
			}
		}
		return true;
	}
```

## 总结

通过Etag，资源内容没有发生变化，就可以让浏览器使用缓存。
