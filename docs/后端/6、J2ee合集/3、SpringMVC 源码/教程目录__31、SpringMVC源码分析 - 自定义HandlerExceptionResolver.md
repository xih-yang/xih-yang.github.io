# 31、SpringMVC源码分析 - 自定义HandlerExceptionResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/31.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

Springmvc 中 异常解析器的默认实现有 ExceptionHandlerExceptionResolver、ResponseStatusExceptionResolver和DefaultHandlerExceptionResolver 等，都实现同一的接口 HandlerExceptionResolver。

## 一、HandlerExceptionResolver

接口中只有一个解析异常的方法

```java
public interface HandlerExceptionResolver {
	@Nullable
	ModelAndView resolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex);
}
```

## 二、自定义 HandlerExceptionResolver

```java
public class CustomHandlerExceptionResolver implements HandlerExceptionResolver {
    private static String msg = "服务器错误";
    @Override
    public ModelAndView resolveException(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Object o, Exception e) {
        if (e instanceof RuntimeException) {
            ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
            modelAndView.addObject("message", e.getMessage());
            modelAndView.addObject("code", 500);
            return modelAndView;
        } else {
            return null;
        }
    }
}
```

## 三、注册

```java
@Configuration
public class HandlerExceptionResolverConfig implements WebMvcConfigurer {
    public void configureHandlerExceptionResolvers(List<HandlerExceptionResolver> resolvers) {
		//注册自定义异常解析器
        resolvers.add(new CustomHandlerExceptionResolver());
    }
}
```

注意，如果注册了自定义的异常解析器，则默认的异常解析器就不会生效了，像全局异常处理 @ControllerAdvice 就失效了，在源码中是这样的：

```java
@Bean
	public HandlerExceptionResolver handlerExceptionResolver(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager) {
		List<HandlerExceptionResolver> exceptionResolvers = new ArrayList<>();
		//加载自定义异常解析器
		configureHandlerExceptionResolvers(exceptionResolvers);
		if (exceptionResolvers.isEmpty()) {
			//没有自定义异常解析器，才会进入这里，将默认的异常解析器加载进来
			addDefaultHandlerExceptionResolvers(exceptionResolvers, contentNegotiationManager);
		}
		//扩展异常解析器
		extendHandlerExceptionResolvers(exceptionResolvers);
		HandlerExceptionResolverComposite composite = new HandlerExceptionResolverComposite();
		composite.setOrder(0);
		composite.setExceptionResolvers(exceptionResolvers);
		return composite;
	}
```
