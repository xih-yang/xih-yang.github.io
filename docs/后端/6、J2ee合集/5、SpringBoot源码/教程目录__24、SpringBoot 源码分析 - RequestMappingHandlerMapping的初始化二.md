# 24、SpringBoot 源码分析 - RequestMappingHandlerMapping的初始化二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/24.html
- 分类：J2EE框架
- 分组：教程目录
## 简单流程图

## RequestMappingHandlerMapping的createRequestMappingInfo创建映射

首先获取`RequestMapping`注解，如果存在就创建一个`RequestMappingInfo`否则就返回`null` 。

```java
	@Nullable
	private RequestMappingInfo createRequestMappingInfo(AnnotatedElement element) {
		RequestMapping requestMapping = AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping.class);
		RequestCondition<?> condition = (element instanceof Class ?
				getCustomTypeCondition((Class<?>) element) : getCustomMethodCondition((Method) element));
		return (requestMapping != null ? createRequestMappingInfo(requestMapping, condition) : null);
	}
```

其实就是封装方法的`RequestMappingInfo`注解的属性啦：

然后是类上的：

### combine合并属性

具体怎么合并的细节就不看了。

合并后的结果，我们常用的就是`uri`拼起来了：

最后放入`methodMap`返回：

### registerHandlerMethod

注册方法，最终是注册到`MappingRegistry`中的。

```java
	@Override
	protected void registerHandlerMethod(Object handler, Method method, RequestMappingInfo mapping) {
		super.registerHandlerMethod(handler, method, mapping);
		updateConsumesCondition(mapping, method);
	}
	protected void registerHandlerMethod(Object handler, Method method, T mapping) {
		this.mappingRegistry.register(mapping, handler, method);
	}
```

#### MappingRegistry的register

注册各种类型的映射。

```java
		private final Map<T, MappingRegistration<T>> registry = new HashMap<>();
		private final Map<T, HandlerMethod> mappingLookup = new LinkedHashMap<>();
		private final MultiValueMap<String, T> urlLookup = new LinkedMultiValueMap<>();
		private final Map<String, List<HandlerMethod>> nameLookup = new ConcurrentHashMap<>();
		public void register(T mapping, Object handler, Method method) {
			...
			this.readWriteLock.writeLock().lock();
			try {
				HandlerMethod handlerMethod = createHandlerMethod(handler, method);//创建HandlerMethod
				validateMethodMapping(handlerMethod, mapping);//验证唯一性
				this.mappingLookup.put(mapping, handlerMethod);//方法映射，放入mappingLookup
				List<String> directUrls = getDirectUrls(mapping);
				for (String url : directUrls) {
					this.urlLookup.add(url, mapping);//url映射，放入mappingLookup，可以多对一
				}
				String name = null;
				if (getNamingStrategy() != null) {
					name = getNamingStrategy().getName(handlerMethod, mapping);
					addMappingName(name, handlerMethod);//名字映射，name为类名大写字母+#+方法名，比如UserController的getUser方法就是UC#getUser
				}
				...
				this.registry.put(mapping, new MappingRegistration<>(mapping, handlerMethod, directUrls, name));//封装成MappingRegistration放入registry
			}
			finally {
				this.readWriteLock.writeLock().unlock();
			}
		}
```

##### AbstractHandlerMethodMapping的createHandlerMethod

根据是处理器是`String`还是对象类型进行不同的`HandlerMethod`封装，一般初始化的时候还没有实例，只是名字。

```java
	protected HandlerMethod createHandlerMethod(Object handler, Method method) {
		if (handler instanceof String) {
     //如果是bean名字
			return new HandlerMethod((String) handler,
					obtainApplicationContext().getAutowireCapableBeanFactory(), method);
		}
		return new HandlerMethod(handler, method);
	}
```

处理器名字创建：

内部会获取名字对应的类型，进行方法参数信息的封装和`ResponseStatus`注解相关处理。

##### MappingRegistry的validateMethodMapping检查唯一性

如果`uri`映射`HandlerMethod`已经存在，且不是同一个`HandlerMethod`要报异常。

```java
private void validateMethodMapping(HandlerMethod handlerMethod, T mapping) {
			// Assert that the supplied mapping is unique.
			HandlerMethod existingHandlerMethod = this.mappingLookup.get(mapping);
			if (existingHandlerMethod != null && !existingHandlerMethod.equals(handlerMethod)) {
				throw new IllegalStateException(
						"Ambiguous mapping. Cannot map '" + handlerMethod.getBean() + "' method \n" +
						handlerMethod + "\nto " + mapping + ": There is already '" +
						existingHandlerMethod.getBean() + "' bean method\n" + existingHandlerMethod + " mapped.");
			}
		}
```

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
