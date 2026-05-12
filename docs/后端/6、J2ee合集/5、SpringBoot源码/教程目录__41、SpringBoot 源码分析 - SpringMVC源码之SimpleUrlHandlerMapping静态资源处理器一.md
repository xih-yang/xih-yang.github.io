# 41、SpringBoot 源码分析 - SpringMVC源码之SimpleUrlHandlerMapping静态资源处理器一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/41.html
- 分类：J2EE框架
- 分组：教程目录
## 静态资源如何访问

可以直接访问静态资源，因为有`SimpleUrlHandlerMapping`处理。

## EnableWebMvcConfiguration的resourceHandlerMapping

自动配置`EnableWebMvcConfiguration`的`resourceHandlerMapping`调用的时候：

## ResourceHandlerRegistry的resourceHandlerMapping

最后创建一个`SimpleUrlHandlerMapping`，里面有两个映射，定义了两种资源路径：

然后在他在初始化之前处理的`setApplicationContext`方法中注册了两个映射：

注册到`handlerMap`中：

`log`信息也有：

## 实验

比如我直接请求`resources\static\test.html`：

直接在浏览器

## AbstractUrlHandlerMapping的lookupHandler

我们来看看原理，获取处理器映射器的时候就到这个方法里，其实就是进行uri的匹配，匹配到了再解析`uri`参数，最后封装成执行链加入拦截器返回。

```java
@Nullable
	protected Object lookupHandler(String urlPath, HttpServletRequest request) throws Exception {
		// 直接能匹配上
		Object handler = this.handlerMap.get(urlPath);
		if (handler != null) {
     //如果存在的话
			// Bean name or resolved handler?
			if (handler instanceof String) {
     //只是名字的话要实例化
				String handlerName = (String) handler;
				handler = obtainApplicationContext().getBean(handlerName);
			}
			validateHandler(handler, request);
			return buildPathExposingHandler(handler, urlPath, urlPath, null);
		}
		// Pattern match? uri模式匹配
		List<String> matchingPatterns = new ArrayList<>();
		for (String registeredPattern : this.handlerMap.keySet()) {
     //遍历进行匹配
			if (getPathMatcher().match(registeredPattern, urlPath)) {
				matchingPatterns.add(registeredPattern);//匹配上就添加进去
			}
			else if (useTrailingSlashMatch()) {
				if (!registeredPattern.endsWith("/") && getPathMatcher().match(registeredPattern + "/", urlPath)) {
					matchingPatterns.add(registeredPattern + "/");
				}
			}
		}
		String bestMatch = null;
		Comparator<String> patternComparator = getPathMatcher().getPatternComparator(urlPath);
		if (!matchingPatterns.isEmpty()) {
     //不为空的话排序
			matchingPatterns.sort(patternComparator);
			if (logger.isTraceEnabled() && matchingPatterns.size() > 1) {
				logger.trace("Matching patterns " + matchingPatterns);
			}
			bestMatch = matchingPatterns.get(0);//取第一个
		}
		if (bestMatch != null) {
     //存在就获取对应的处理器
			handler = this.handlerMap.get(bestMatch);
			if (handler == null) {
				if (bestMatch.endsWith("/")) {
     //如果以/结尾的话就把/去掉再看有没映射的处理器
					handler = this.handlerMap.get(bestMatch.substring(0, bestMatch.length() - 1));
				}
				if (handler == null) {
					throw new IllegalStateException(
							"Could not find handler for best pattern match [" + bestMatch + "]");
				}
			}
			// Bean name or resolved handler?
			if (handler instanceof String) {
     //处理器只是名字的话要实例化
				String handlerName = (String) handler;
				handler = obtainApplicationContext().getBean(handlerName);
			}
			validateHandler(handler, request);
			String pathWithinMapping = getPathMatcher().extractPathWithinPattern(bestMatch, urlPath);//取出匹配的资源，出掉最开始的/
			// uri参数，比如restful风格的
			Map<String, String> uriTemplateVariables = new LinkedHashMap<>();
			for (String matchingPattern : matchingPatterns) {
				if (patternComparator.compare(bestMatch, matchingPattern) == 0) {
					Map<String, String> vars = getPathMatcher().extractUriTemplateVariables(matchingPattern, urlPath);
					Map<String, String> decodedVars = getUrlPathHelper().decodePathVariables(request, vars);
					uriTemplateVariables.putAll(decodedVars);
				}
			}
			if (logger.isTraceEnabled() && uriTemplateVariables.size() > 0) {
				logger.trace("URI variables " + uriTemplateVariables);
			}
			return buildPathExposingHandler(handler, bestMatch, pathWithinMapping, uriTemplateVariables);//封装执行链加入拦截器一起返回
		}
		// No handler found...
		return null;
	}
```

### buildPathExposingHandler

创建执行链，然后加入一个`PathExposingHandlerInterceptor`拦截器，如果有uri参数的话还要加入`UriTemplateVariablesHandlerInterceptor`拦截器，其实就是设置一些请求属性，暴露给请求。

最后还会加一个跨域的拦截器：

### ResourceHttpRequestHandler的handleRequest执行处理器

重点就是获取资源，然后写出去。

```java
@Override
	public void handleRequest(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// 获取资源
		Resource resource = getResource(request);
		if (resource == null) {
     //找不到
			logger.debug("Resource not found");
			response.sendError(HttpServletResponse.SC_NOT_FOUND);
			return;
		}
		...
		// 获取资源媒体类型
		MediaType mediaType = getMediaType(request, resource);
		...
		ServletServerHttpResponse outputMessage = new ServletServerHttpResponse(response);
		if (request.getHeader(HttpHeaders.RANGE) == null) {
			Assert.state(this.resourceHttpMessageConverter != null, "Not initialized");
			setHeaders(response, resource, mediaType);//设置头信息
			this.resourceHttpMessageConverter.write(resource, mediaType, outputMessage);//写出去
		}
		else {
			...
			}
		}
	}
```

下篇说怎么获取资源和写出去的。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
