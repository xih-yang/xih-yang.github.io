# 35、SpringBoot 源码分析 - SpringMVC源码之拦截器
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/35.html
- 分类：J2EE框架
- 分组：教程目录
## 执行链结构图

## 拦截器哪里来的

执行链前面讲过，但是没细讲，我们先来看他是怎么形成的。首先是在`EnableWebMvcConfiguration`的父类`WebMvcConfigurationSupport`的`getInterceptors`里面会添加自定义的拦截器，然后再加入两个拦截器：

## 这些拦截器干嘛的

### MyHandlerInterceptor自定义的

只是输出信息。

### ConversionServiceExposingInterceptor

设置请求的转换服务，这个后面跟数据绑定相关，到时候会说的。

### ResourceUrlProviderExposingInterceptor

设置静态资源`url`提供器，让客户端可以访问静态资源。

## 拦截器处理

遍历所有的拦截器，进行`preHandle`调用，如果返回`true`就继续并执行的拦截器索引，否则就直接后处理返回了，这里`interceptorIndex`是为了后面的处理可以反向进行遍历，其实就是类似于`netty`的出站入站处理，有兴趣的可以看看我的`netty`的[文章](https://blog.csdn.net/wangwei19871103/category_9681495.html)，数据进来的时候是顺序拦截，出去的时候是反的拦截，类似责任链，拦截器模式。

### applyPreHandle

```java
	boolean applyPreHandle(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HandlerInterceptor[] interceptors = getInterceptors();
		if (!ObjectUtils.isEmpty(interceptors)) {
			for (int i = 0; i < interceptors.length; i++) {
				HandlerInterceptor interceptor = interceptors[i];
				if (!interceptor.preHandle(request, response, this.handler)) {
					triggerAfterCompletion(request, response, null);//如果是false就直接返回
					return false;
				}
				this.interceptorIndex = i;
			}
		}
		return true;
	}
```

### applyPostHandle

这里就开始反向拦截了。

```java
	void applyPostHandle(HttpServletRequest request, HttpServletResponse response, @Nullable ModelAndView mv)
			throws Exception {
		HandlerInterceptor[] interceptors = getInterceptors();
		if (!ObjectUtils.isEmpty(interceptors)) {
			for (int i = interceptors.length - 1; i >= 0; i--) {
				HandlerInterceptor interceptor = interceptors[i];
				interceptor.postHandle(request, response, this.handler, mv);
			}
		}
	}
```

### triggerAfterCompletion

处理完成后进行，这里就要用到`interceptorIndex`，反向执行，因为有可能有拦截器返回false了，然后只处理前面处理过的拦截器的`triggerAfterCompletion`方法。

```java
void triggerAfterCompletion(HttpServletRequest request, HttpServletResponse response, @Nullable Exception ex)
			throws Exception {
		HandlerInterceptor[] interceptors = getInterceptors();
		if (!ObjectUtils.isEmpty(interceptors)) {
			for (int i = this.interceptorIndex; i >= 0; i--) {
				HandlerInterceptor interceptor = interceptors[i];
				try {
					interceptor.afterCompletion(request, response, this.handler, ex);
				}
				catch (Throwable ex2) {
					logger.error("HandlerInterceptor.afterCompletion threw exception", ex2);
				}
			}
		}
	}
```

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
