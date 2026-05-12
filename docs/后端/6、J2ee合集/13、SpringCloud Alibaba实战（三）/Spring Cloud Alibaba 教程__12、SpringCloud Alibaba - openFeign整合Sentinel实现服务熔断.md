# 12、SpringCloud Alibaba - openFeign整合Sentinel实现服务熔断
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/12.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

熔断机制是微服务中的一种链路保护机制，当链路上的某个微服务不可用或者响应时间太长时，会进行服务的降级，进而熔断该节点微服务的调用，响应快速失败，防止雪崩效应。

## 一、配置

**1、** 引入依赖；

```xml
<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-openfeign</artifactId>
			<version>3.0.2</version>
		</dependency>
		<!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-loadbalancer -->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-loadbalancer</artifactId>
			<version>3.0.2</version>
		</dependency>
		<!-- https://mvnrepository.com/artifact/com.alibaba.cloud/spring-cloud-starter-alibaba-sentinel -->
		<dependency>
			<groupId>com.alibaba.cloud</groupId>
			<artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
			<version>2021.1</version>
		</dependency>
```

**2、** 打开circuitbreaker开关；

在配置文件中添加配置项，打开 feign 对 circuitbreaker 的支持

```java
feign.circuitbreaker.enabled=true
```

**3、** fallback实现类；

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

**4、** FeignClient接口；

```java
@FeignClient(value = "server",fallback = ServerApiFallBack.class)
@Component
public interface ServerApi {
    @GetMapping("/server/test/{id}")
    Map test(@PathVariable String id);
}
```

## 二、FeignCircuitBreakerInvocationHandler 原理

**1、** feign.circuitbreaker.enabled的作用；

1、CircuitBreakerPresentFeignTargeterConfiguration 配置类里定义了Targeter 的实现类FeignCircuitBreakerTargeter ，配置项为true时该bean生效，FeignCircuitBreakerTargeter 用于代替之前的 DefaultTargeter

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(CircuitBreaker.class)
	@ConditionalOnProperty("feign.circuitbreaker.enabled")
	protected static class CircuitBreakerPresentFeignTargeterConfiguration {
		...
		@Bean
		@ConditionalOnMissingBean
		@ConditionalOnBean(CircuitBreakerFactory.class)
		public Targeter circuitBreakerFeignTargeter(CircuitBreakerFactory circuitBreakerFactory) {
			return new FeignCircuitBreakerTargeter(circuitBreakerFactory);
		}
	}
```

2、CircuitBreakerPresentFeignBuilderConfiguration 配置类里定义了 Feign.Builder 的实现类FeignCircuitBreaker.builder()，配置项为true时该bean生效，FeignCircuitBreaker.builder() 用于代替之前的 Feign.builder()

**2、** @FeignClient创建代理对象；

1、代理对象的创建过程从 FeignClientFactoryBean 的 getObject( ) 开始，之前已经分析过，现在省略不太重要的代码

```java
@Override
	public Object getObject() {
		return getTarget();
	}
```

```xml
<T> T getTarget() {
		//这里获取到 FeignCircuitBreaker.Builder
		Feign.Builder builder = feign(context);
			return (T) loadBalance(builder, context, new HardCodedTarget<>(type, name, url));
		}
	}
```

```java
protected <T> T loadBalance(Feign.Builder builder, FeignContext context, HardCodedTarget<T> target) {
			//获取到 FeignCircuitBreakerTargeter
			Targeter targeter = get(context, Targeter.class);
			// 调用 target()
			return targeter.target(this, builder, context, target);
	}
```

2、FeignCircuitBreakerTargeter 的 target( )

```java
	@Override
	public <T> T target(FeignClientFactoryBean factory, Feign.Builder feign, FeignContext context,
			Target.HardCodedTarget<T> target) {
		if (!(feign instanceof FeignCircuitBreaker.Builder)) {
			//不是  FeignCircuitBreaker.Builder 类型，走这里
			return feign.target(target);
		}
		FeignCircuitBreaker.Builder builder = (FeignCircuitBreaker.Builder) feign;
		String name = !StringUtils.hasText(factory.getContextId()) ? factory.getName() : factory.getContextId();
		//fallback 
		Class<?> fallback = factory.getFallback();
		if (fallback != void.class) {
			return targetWithFallback(name, context, target, builder, fallback);
		}
		//fallbackFactory 
		Class<?> fallbackFactory = factory.getFallbackFactory();
		if (fallbackFactory != void.class) {
			return targetWithFallbackFactory(name, context, target, builder, fallbackFactory);
		}
		//没有熔断功能
		return builder(name, builder).target(target);
	}
```

3、targetWithFallback( )

```java
private <T> T targetWithFallback(String feignClientName, FeignContext context, Target.HardCodedTarget<T> target,
			FeignCircuitBreaker.Builder builder, Class<?> fallback) {
		//获取 fallback 实例
		T fallbackInstance = getFromContext("fallback", feignClientName, context, fallback, target.type());
		return builder(feignClientName, builder).target(target, fallbackInstance);
	}
```

4、target( )

```java
public <T> T target(Target<T> target, T fallback) {
			return build(fallback != null ? new FallbackFactory.Default<T>(fallback) : null).newInstance(target);
		}
```

5、build( )

```java
public Feign build(final FallbackFactory<?> nullableFallbackFactory) {
			//创建 InvocationHandlerFactory，用于创建 FeignCircuitBreakerInvocationHandler
			super.invocationHandlerFactory(new InvocationHandlerFactory() {
				@Override
				public InvocationHandler create(Target target, Map<Method, MethodHandler> dispatch) {
					return new FeignCircuitBreakerInvocationHandler(circuitBreakerFactory, feignClientName, target,
							dispatch, nullableFallbackFactory);
				}
			});
			return super.build();
		}
```

**3、** FeignCircuitBreakerInvocationHandler；

1、调用接口方法时，会进入到代理的invoke( ) 方法

```java
public Object invoke(final Object proxy, final Method method, final Object[] args) throws Throwable {
		// early exit if the invoked method is from java.lang.Object
		// code is the same as ReflectiveFeign.FeignInvocationHandler
		if ("equals".equals(method.getName())) {
			try {
				Object otherHandler = args.length > 0 && args[0] != null ? Proxy.getInvocationHandler(args[0]) : null;
				return equals(otherHandler);
			}
			catch (IllegalArgumentException e) {
				return false;
			}
		}
		else if ("hashCode".equals(method.getName())) {
			return hashCode();
		}
		else if ("toString".equals(method.getName())) {
			return toString();
		}
		String circuitName = this.feignClientName + "_" + method.getName();
		CircuitBreaker circuitBreaker = this.factory.create(circuitName);
		//调用服务的逻辑
		Supplier<Object> supplier = asSupplier(method, args);
		if (this.nullableFallbackFactory != null) {
			//服务熔断的逻辑
			Function<Throwable, Object> fallbackFunction = throwable -> {
				Object fallback = this.nullableFallbackFactory.create(throwable);
				try {
					return this.fallbackMethodMap.get(method).invoke(fallback, args);
				}
				catch (Exception e) {
					throw new IllegalStateException(e);
				}
			};
			//执行后续逻辑
			return circuitBreaker.run(supplier, fallbackFunction);
		}
		return circuitBreaker.run(supplier);
	}
```

2、asSupplier( )

```java
	//调用服务的逻辑
	private Supplier<Object> asSupplier(final Method method, final Object[] args) {
		return () -> {
			try {
				return this.dispatch.get(method).invoke(args);
			}
			catch (RuntimeException throwable) {
				throw throwable;
			}
			catch (Throwable throwable) {
				throw new RuntimeException(throwable);
			}
		};
	}
```

3、circuitBreaker.run( )

先调用服务端接口，如果出现异常，则执行服务熔断的逻辑

```java
public <T> T run(Supplier<T> toRun, Function<Throwable, T> fallback) {
		Entry entry = null;
		try {
			entry = SphU.entry(resourceName, entryType);
			// If the SphU.entry() does not throw BlockException, it means that the
			// request can pass.
			//调用服务端接口
			return toRun.get();
		}
		catch (BlockException ex) {
			// SphU.entry() may throw BlockException which indicates that
			// the request was rejected (flow control or circuit breaking triggered).
			// So it should not be counted as the business exception.
			//异常时 调用 fallback
			return fallback.apply(ex);
		}
		catch (Exception ex) {
			// For other kinds of exceptions, we'll trace the exception count via
			// Tracer.trace(ex).
			Tracer.trace(ex);
			//异常时 调用 fallback
			return fallback.apply(ex);
		}
		finally {
			// Guarantee the invocation has been completed.
			if (entry != null) {
				entry.exit();
			}
		}
	}
```

## 三、SentinelInvocationHandler 原理

跟上面的区别主要是 SentinelFeign.builder() 和 SentinelInvocationHandler 两个类

**1、** 打开setinel开关；

feign.sentinel.enabled=true

**2、** feign.sentinel.enabled的作用；

SentinelFeignAutoConfiguration 配置类里定义了Feign.Builder 的实现类 SentinelFeign.builder()，配置项为true时该bean生效

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass({
      SphU.class, Feign.class })
public class SentinelFeignAutoConfiguration {
	@Bean
	@Scope("prototype")
	@ConditionalOnMissingBean
	@ConditionalOnProperty(name = "feign.sentinel.enabled")
	public Feign.Builder feignSentinelBuilder() {
		return SentinelFeign.builder();
	}
}
```

**3、** SentinelFeign.builder()的build()方法；

主要作用是： 创建 invocationHandlerFactory，重写create( ) 方法；invocationHandlerFactory 用于创建 SentinelInvocationHandler ，代替前面的 FeignCircuitBreakerInvocationHandler。

```java
 	public Feign build() {
            super.invocationHandlerFactory(new InvocationHandlerFactory() {
                public InvocationHandler create(Target target, Map<Method, MethodHandler> dispatch) {
                    GenericApplicationContext gctx = (GenericApplicationContext)Builder.this.applicationContext;
                    BeanDefinition def = gctx.getBeanDefinition(target.type().getName());
                    FeignClientFactoryBean feignClientFactoryBean = (FeignClientFactoryBean)def.getAttribute("feignClientsRegistrarFactoryBean");
                    //从BeanDefinition 里获取到 fallback、fallbackFactory 
                    Class fallback = feignClientFactoryBean.getFallback();
                    Class fallbackFactory = feignClientFactoryBean.getFallbackFactory();
                    String beanName = feignClientFactoryBean.getContextId();
                    if (!StringUtils.hasText(beanName)) {
                        beanName = feignClientFactoryBean.getName();
                    }
                    if (Void.TYPE != fallback) {
                    	//创建 fallback 实例
                        Object fallbackInstance = this.getFromContext(beanName, "fallback", fallback, target.type());
                        //创建 SentinelInvocationHandler
                        return new SentinelInvocationHandler(target, dispatch, new org.springframework.cloud.openfeign.FallbackFactory.Default(fallbackInstance));
                    } else if (Void.TYPE != fallbackFactory) {
                        FallbackFactory fallbackFactoryInstance = (FallbackFactory)this.getFromContext(beanName, "fallbackFactory", fallbackFactory, FallbackFactory.class);
                        return new SentinelInvocationHandler(target, dispatch, fallbackFactoryInstance);
                    } else {
                        return new SentinelInvocationHandler(target, dispatch);
                    }
                }
                private Object getFromContext(String name, String type, Class fallbackType, Class targetType) {
                    Object fallbackInstance = Builder.this.feignContext.getInstance(name, fallbackType);
                    if (fallbackInstance == null) {
                        throw new IllegalStateException(String.format("No %s instance of type %s found for feign client %s", type, fallbackType, name));
                    } else if (!targetType.isAssignableFrom(fallbackType)) {
                        throw new IllegalStateException(String.format("Incompatible %s instance. Fallback/fallbackFactory of type %s is not assignable to %s for feign client %s", type, fallbackType, targetType, name));
                    } else {
                        return fallbackInstance;
                    }
                }
            });
            super.contract(new SentinelContractHolder(this.contract));
            return super.build();
        }
```

**4、** SentinelInvocationHandler；

```java
@Override
	public Object invoke(final Object proxy, final Method method, final Object[] args)
			throws Throwable {
		if ("equals".equals(method.getName())) {
			try {
				Object otherHandler = args.length > 0 && args[0] != null
						? Proxy.getInvocationHandler(args[0])
						: null;
				return equals(otherHandler);
			}
			catch (IllegalArgumentException e) {
				return false;
			}
		}
		else if ("hashCode".equals(method.getName())) {
			return hashCode();
		}
		else if ("toString".equals(method.getName())) {
			return toString();
		}
		Object result;
		MethodHandler methodHandler = this.dispatch.get(method);
		// only handle by HardCodedTarget
		if (target instanceof Target.HardCodedTarget) {
			Target.HardCodedTarget hardCodedTarget = (Target.HardCodedTarget) target;
			MethodMetadata methodMetadata = SentinelContractHolder.METADATA_MAP
					.get(hardCodedTarget.type().getName()
							+ Feign.configKey(hardCodedTarget.type(), method));
			// resource default is HttpMethod:protocol://url
			if (methodMetadata == null) {
				result = methodHandler.invoke(args);
			}
			else {
				String resourceName = methodMetadata.template().method().toUpperCase()
						+ ":" + hardCodedTarget.url() + methodMetadata.template().path();
				Entry entry = null;
				try {
					ContextUtil.enter(resourceName);
					entry = SphU.entry(resourceName, EntryType.OUT, 1, args);
					//调用服务端接口
					result = methodHandler.invoke(args);
				}
				catch (Throwable ex) {
					// fallback handle
					if (!BlockException.isBlockException(ex)) {
						Tracer.trace(ex);
					}
					if (fallbackFactory != null) {
						try {
							//异常时 调用熔断逻辑
							Object fallbackResult = fallbackMethodMap.get(method)
									.invoke(fallbackFactory.create(ex), args);
							return fallbackResult;
						}
						catch (IllegalAccessException e) {
							// shouldn't happen as method is public due to being an
							// interface
							throw new AssertionError(e);
						}
						catch (InvocationTargetException e) {
							throw new AssertionError(e.getCause());
						}
					}
					else {
						// throw exception if fallbackFactory is null
						throw ex;
					}
				}
				finally {
					if (entry != null) {
						entry.exit(1, args);
					}
					ContextUtil.exit();
				}
			}
		}
		else {
			// other target type using default strategy
			result = methodHandler.invoke(args);
		}
		return result;
	}
```

## 四、总结

涉及到的两个配置项 ：

```java
feign.sentinel.enabled=true
feign.circuitbreaker.enabled=true
```

涉及到的重要的类：

FeignCircuitBreakerTargeter 代替默认的 DefaultTargeter

FeignCircuitBreaker.builder() 代替默认的 Feign.builder()

FeignCircuitBreakerInvocationHandler 代替默认的 FeignInvocationHandler

SentinelInvocationHandler 代替默认的 FeignInvocationHandler
