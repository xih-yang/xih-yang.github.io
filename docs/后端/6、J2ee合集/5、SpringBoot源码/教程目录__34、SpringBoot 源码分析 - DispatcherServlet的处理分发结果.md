# 34、SpringBoot 源码分析 - DispatcherServlet的处理分发结果
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/34.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## DispatcherServlet的processDispatchResult

前面讲了处理器适配求怎么处理请求返回结果的，现在讲结果怎么处理,其实核心就是`render`方法。

```java
private void processDispatchResult(HttpServletRequest request, HttpServletResponse response,
			@Nullable HandlerExecutionChain mappedHandler, @Nullable ModelAndView mv,
			@Nullable Exception exception) throws Exception {
		...
		// Did the handler return a view to render?
		if (mv != null && !mv.wasCleared()) {
			render(mv, request, response);//渲染视图
			if (errorView) {
				WebUtils.clearErrorRequestAttributes(request);
			}
		}
		...
	}
```

## render

其实逻辑也很简单，跟前面类似，获取到视图名字，然后遍历视图解析器，看哪个可以解析，最后渲染。

```java
protected void render(ModelAndView mv, HttpServletRequest request, HttpServletResponse response) throws Exception {
		// Determine locale for request and apply it to the response.
		Locale locale =
				(this.localeResolver != null ? this.localeResolver.resolveLocale(request) : request.getLocale());
		response.setLocale(locale);//设置本地化
		View view;
		String viewName = mv.getViewName();
		if (viewName != null) {
     //获取视图
			// We need to resolve the view name. 解析成视图
			view = resolveViewName(viewName, mv.getModelInternal(), locale, request);
			if (view == null) {
				throw new ServletException("Could not resolve view with name '" + mv.getViewName() +
						"' in servlet with name '" + getServletName() + "'");
			}
		}
		else {
			// No need to lookup: the ModelAndView object contains the actual View object.
			view = mv.getView();
			if (view == null) {
				throw new ServletException("ModelAndView [" + mv + "] neither contains a view name nor a " +
						"View object in servlet with name '" + getServletName() + "'");
			}
		}
		// Delegate to the View object for rendering.
		if (logger.isTraceEnabled()) {
			logger.trace("Rendering view [" + view + "] ");
		}
		try {
			if (mv.getStatus() != null) {
				response.setStatus(mv.getStatus().value());
			}
			view.render(mv.getModelInternal(), request, response);//进行渲染
		}
		catch (Exception ex) {
			if (logger.isDebugEnabled()) {
				logger.debug("Error rendering view [" + view + "]", ex);
			}
			throw ex;
		}
	}
```

## resolveViewName

这里就是找出视图解析器来解析视图，当然有好多解析器，细节暂时不讲，后面一起讲。

```java
@Nullable
	protected View resolveViewName(String viewName, @Nullable Map<String, Object> model,
			Locale locale, HttpServletRequest request) throws Exception {
		if (this.viewResolvers != null) {
			for (ViewResolver viewResolver : this.viewResolvers) {
				View view = viewResolver.resolveViewName(viewName, locale);
				if (view != null) {
					return view;
				}
			}
		}
		return null;
	}
```

至此基本的处理流程都讲完了，后面就开始补细节啦，前面其实细节说了有点多，幸亏止住了，还是先总结下，然后开始细节吧。

## 总结简单

- 处理方法参数自由度很大，只要有参数解析器就可以解析出来，内部是调用反射的。
- 参数绑定可以自定义设置，只要符合绑定的要求就可以进行请求参数的绑定，包括表单和uri的参数。
- 视图解析器会根据处理方法的返回值去寻找解析器处理，可以自定义视图解析器。
- 在处理方法前还有模型方法要调用，模型方法的执行跟处理器方法一样，都是有参数解析，但是返回值是直接放进模型里的。
- 拦截器会在处理器适配器处理前，处理后，以及请求处理完成后处理。但是如果拦截器处理前的处理返回false，会进行反向处理，只有执行过的处理前处理并返回true的拦截器才会执行完成后处理。
- 至于一些处理器，适配器，解析器哪里来的，一部分是自动配置的时候配置进去的，一部分是默认从DispatcherServlet.properties文件中读取的。

后面就开始讲点细节吧。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
