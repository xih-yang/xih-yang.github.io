# 22、SpringCloud Alibaba - Sentinel 与 OpenFeign服务熔断总结
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/22.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、fallback降级

**1、** 在@FeignClient加上注解；

```java
@FeignClient(value = "server",fallback = ServerApiFallBack.class)
@Component
public interface ServerApi {
    @GetMapping("/server/test/{id}")
    Map test(@PathVariable String id);
}
```

**2、** ServerApiFallBack熔断类；

```java
@Component
public class ServerApiFallBack implements ServerApi{
    @Override
    public Map test(String id) {
        ImmutableMap map = ImmutableMap.of("code", 500, "reason", "服务不可用");
        return map;
    }
}
```

**3、** Controller接口；

```java
@RestController
@RequestMapping("/client")
public class ClientController {
  @GetMapping("/test/{id}")
    public Map test(@PathVariable String id){
        return serverApi.test(id);
    }
}
```

**4、** 此时调用接口，服务出现异常不步可用时，会触发fallback服务熔断，具体逻辑在SentinelInvocationHandler中实现；

```java
				catch (Throwable ex) {
					...
					if (fallbackFactory != null) {
						try {
							//回调服务熔断方法
							Object fallbackResult = fallbackMethodMap.get(method)
									.invoke(fallbackFactory.create(ex), args);
							return fallbackResult;
						}
					...
```

## 二、SentinelResource流控降级

**1、** 在@FeignClient加上注解；

```java
@FeignClient(value = "server",fallback = ServerApiFallBack.class)
@Component
public interface ServerApi {
    @GetMapping("/server/test/{id}")
    Map test(@PathVariable String id);
}
```

**2、** Controller接口；

```java
 @SentinelResource(value = "sentinel-test", blockHandler = "blockHandler")
    @GetMapping("/test/{id}")
    public Map test(@PathVariable String id){
        return serverApi.test(id);
    }
    public Map blockHandler(String id ,BlockException e) {
        ImmutableMap map = ImmutableMap.of(
                "code", 500,
                "reason", "sentinel服务流量控制",
                "error", e);
        return map;
    }
```

**3、** 配置熔断规则；

在sentine控制台设置熔断规则

**4、** 访问接口；

多次访问接口，会发生熔断，结果：

```java
{
    "code": 500,
    "reason": "sentinel服务流量控制",
    "error": {
  	...
}
```

此时熔断逻辑是在SentinelResourceAspect中

```java
		try {
            entry = SphU.entry(resourceName, resourceType, entryType, pjp.getArgs());
            Object result = pjp.proceed();
            return result;
        } catch (BlockException ex) {
        	//熔断
            return handleBlockException(pjp, annotation, ex);
        } 
```

根据@SentinelResource中配置的blockHandler、blockHandlerClass、fallback、defaultFallback、fallbackClass调用熔断的方法。

## 三、Sentinel全局熔断

**1、** 给接口设置熔断规则，例如给controller接口设置熔断规则，资源名是/client/test/{id}，当触发熔断规则时，具体逻辑是在SentinelWebInterceptor中处理，它实现了springmvc的HandlerInterceptor拦截器接口在preHandle方法中触发接口的流控；

```java
	catch (BlockException e) {
            try {
            	//处理熔断
                handleBlockException(request, response, e);
            } 
```

```java
 protected void handleBlockException(HttpServletRequest request, HttpServletResponse response, BlockException e)
        throws Exception {
        //配置中存在BlockExceptionHandler时，调用其handle()方法
        if (baseWebMvcConfig.getBlockExceptionHandler() != null) {
            baseWebMvcConfig.getBlockExceptionHandler().handle(request, response, e);
        } else {
            // Throw BlockException directly. Users need to handle it in Spring global exception handler.
            throw e;
        }
    }
```

**2、** baseWebMvcConfig中配置BlockExceptionHandler；

在SentinelWebAutoConfiguration配置类中，创建了SentinelWebMvcConfig

```java
	@Autowired
	private Optional<BlockExceptionHandler> blockExceptionHandlerOptional;
	@Bean
	@ConditionalOnProperty(name = "spring.cloud.sentinel.filter.enabled",
			matchIfMissing = true)
	public SentinelWebMvcConfig sentinelWebMvcConfig() {
		SentinelWebMvcConfig sentinelWebMvcConfig = new SentinelWebMvcConfig();
		sentinelWebMvcConfig.setHttpMethodSpecify(properties.getHttpMethodSpecify());
		sentinelWebMvcConfig.setWebContextUnify(properties.getWebContextUnify());
		//自定义 BlockExceptionHandler
		if (blockExceptionHandlerOptional.isPresent()) {
			blockExceptionHandlerOptional
					.ifPresent(sentinelWebMvcConfig::setBlockExceptionHandler);
		}
		else {
			//自定义熔断时跳转页面 blockPage
			if (StringUtils.hasText(properties.getBlockPage())) {
				sentinelWebMvcConfig.setBlockExceptionHandler(((request, response,
						e) -> response.sendRedirect(properties.getBlockPage())));
			}
			else {
				//默认的 DefaultBlockExceptionHandler
				sentinelWebMvcConfig
						.setBlockExceptionHandler(new DefaultBlockExceptionHandler());
			}
		}
		urlCleanerOptional.ifPresent(sentinelWebMvcConfig::setUrlCleaner);
		requestOriginParserOptional.ifPresent(sentinelWebMvcConfig::setOriginParser);
		return sentinelWebMvcConfig;
	}
```

**3、** 自定义BlockExceptionHandler；

```java
@Component
public class GlobalBlockExceptionHandler implements BlockExceptionHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, BlockException e) throws Exception {
        response.setStatus(500);
        ServletOutputStream out = response.getOutputStream();
        out.print(new String("触发 Sentinel 全局熔断处理".getBytes(StandardCharsets.UTF_8),"iso-8859-1"));
        out.flush();
        out.close();
    }
}
```
