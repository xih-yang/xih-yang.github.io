# 26、SpringBoot 源码分析 - DispatcherServlet的getHandler二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/26.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## AbstractHandlerMethodMapping的lookupHandlerMethod

继续上次的`getMappingsByUrl`，我故意弄了个一对多的看看情况。

他会都加到`matches`中。

因为有两个所以这里需要排序，排序会根据注解`RequestMapping`中的属性来进行排序，比如参数个数，请求头个数等等，具体可以自己看下：

比如我这里比较方法个数：

排序后就这样：

所以又会`bestMatch = matches.get(0);`获取最好的方法：

如果排序完，发现第二个和第一个比较是相同的，那就不知道要选哪个，所以会报异常。

### HandlerMethod的createWithResolvedBean

方法获取后，还要进行`bean`的创建，因为你此时获取的可能只是`bean`名字，因为前面创建`HandlerMethod`的时候只是放了`beanName`，没有进行实例化。

获取到实例后，重新创建一个`HandlerMethod`：

基本只是把属性重新赋值了下。

## AbstractHandlerMapping的getHandlerExecutionChain获取执行链

其实这里就是要放入拦截器了，先创建一个执行链，然后遍历所有拦截器，如果匹配的话就加入其中。

```java
	protected HandlerExecutionChain getHandlerExecutionChain(Object handler, HttpServletRequest request) {
		HandlerExecutionChain chain = (handler instanceof HandlerExecutionChain ?
				(HandlerExecutionChain) handler : new HandlerExecutionChain(handler));//创建执行链
		String lookupPath = this.urlPathHelper.getLookupPathForRequest(request, LOOKUP_PATH);
		for (HandlerInterceptor interceptor : this.adaptedInterceptors) {
			if (interceptor instanceof MappedInterceptor) {
				MappedInterceptor mappedInterceptor = (MappedInterceptor) interceptor;
				if (mappedInterceptor.matches(lookupPath, this.pathMatcher)) {
     //进行uri匹配
					chain.addInterceptor(mappedInterceptor.getInterceptor());
				}
			}
			else {
				chain.addInterceptor(interceptor);
			}
		}
		return chain;
	}
```

## HandlerExecutionChain执行链

可以看到他定义了一个拦截器数组和列表，好像有点重复了。

或许是为了兼容构造方法吧：

### 拦截器为什么是MappedInterceptor类型的

我们要看拦截器怎么生成的，其实是在`RequestMappingHandlerMapping`实例化的方法里。

`addInterceptors`就是添加自定义的，里面还有好几层，是用一个代理`WebMvcConfigurer`的集合，里面就是我们自己配置类，要实现`WebMvcConfigurer`接口，实现添加拦截器方法`addInterceptors`即可。然后再加上下面两个。

关键在`this.interceptors = registry.getInterceptors();`，进行了处理：

因为拦截器只是一个接口，还需要有包含和排除等路径信息，所以将他们封装成了`MappedInterceptor`。

最后适配一下放入`adaptedInterceptors`中：

其他的一些逻辑就不讲了，执行链获取后直接就返回，表示找到了处理器了，至于说其他的处理器映射器后面会讲，先把大致的流程讲完，所以下一篇继续将后面的`getHandlerAdapter`获取处理器适配器。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
