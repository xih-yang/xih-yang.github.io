# 23、SpringBoot 源码分析 - RequestMappingHandlerMapping的初始化一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/23.html
- 分类：J2EE框架
- 分组：教程目录
## 简单流程图

## RequestMappingHandlerMapping的afterPropertiesSet

我们知道`RequestMappingHandlerMapping`是根据`uri`映射来获取相应的方法的，那这个uri是怎么来的呢，我们来看看`RequestMappingHandlerMapping`被初始化的时候做了什么。在RequestMappingHandlerMapping的父类`AbstractHandlerMethodMapping`实现了`InitializingBean`接口，所以在初始化的时候调用`afterPropertiesSet`方法，这里就是让他做初始化的地方：

### AbstractHandlerMethodMapping的initHandlerMethods初始化处理器方法

这里就是获取所有容器里定义的`bean`名字，不是代理目标的都进行处理。

```java
	private static final String SCOPED_TARGET_NAME_PREFIX = "scopedTarget.";
	protected void initHandlerMethods() {
		for (String beanName : getCandidateBeanNames()) {
			if (!beanName.startsWith(SCOPED_TARGET_NAME_PREFIX)) {
     //代理目标不行，因为方法可能在代理的时候被重写了
				processCandidateBean(beanName);
			}
		}
		handlerMethodsInitialized(getHandlerMethods());
	}
```

#### getCandidateBeanNames

可见这里是找出`Object`类型的，也就是所有的注册的`bean`名字，包括工厂`bean`。

```java
	protected String[] getCandidateBeanNames() {
		return (this.detectHandlerMethodsInAncestorContexts ?
				BeanFactoryUtils.beanNamesForTypeIncludingAncestors(obtainApplicationContext(), Object.class) :
				obtainApplicationContext().getBeanNamesForType(Object.class));
	}
```

#### processCandidateBean处理

获取类型，如果有`Controller`或者是`RequestMapping`注解的就进行方法检测，这里就显示出`Controller`的用途啦。

```java
protected void processCandidateBean(String beanName) {
		Class<?> beanType = null;
		try {
			beanType = obtainApplicationContext().getType(beanName);
		}
		catch (Throwable ex) {
			...
		}
		if (beanType != null && isHandler(beanType)) {
			detectHandlerMethods(beanName);
		}
	}
```

##### isHandler是否是处理器

只有类上有`Controller`或者`RequestMapping`注解的才算是处理器。

```java
	@Override
	protected boolean isHandler(Class<?> beanType) {
		return (AnnotatedElementUtils.hasAnnotation(beanType, Controller.class) ||
				AnnotatedElementUtils.hasAnnotation(beanType, RequestMapping.class));
	}
```

##### detectHandlerMethods检查处理方法

首先会获取处理器类型，然后进行方法的检查，符合要求的就注册到映射注册器中。

```java
protected void detectHandlerMethods(Object handler) {
		Class<?> handlerType = (handler instanceof String ?
				obtainApplicationContext().getType((String) handler) : handler.getClass());//如果是String就获取他的类型
		if (handlerType != null) {
			Class<?> userType = ClassUtils.getUserClass(handlerType);//获取用户定义的类型，针对动态代理类型
			Map<Method, T> methods = MethodIntrospector.selectMethods(userType,
					(MethodIntrospector.MetadataLookup<T>) method -> {
						try {
							return getMappingForMethod(method, userType);//检测每个方法，获取RequestMappingInfo
						}
						catch (Throwable ex) {
							...
						}
					});
			...
			methods.forEach((method, mapping) -> {
     //进行映射和处理器绑定
				Method invocableMethod = AopUtils.selectInvocableMethod(method, userType);
				registerHandlerMethod(handler, invocableMethod, mapping);
			});
		}
	}
```

##### MethodIntrospector的selectMethods搜索方法

对类进行方法的搜索，满足条件的封装成`RequestMappingInfo`和方法一起添加到`methodMap`中。

```java
	public static <T> Map<Method, T> selectMethods(Class<?> targetType, final MetadataLookup<T> metadataLookup) {
		final Map<Method, T> methodMap = new LinkedHashMap<>();
		Set<Class<?>> handlerTypes = new LinkedHashSet<>();
		Class<?> specificHandlerType = null;
		if (!Proxy.isProxyClass(targetType)) {
			specificHandlerType = ClassUtils.getUserClass(targetType);
			handlerTypes.add(specificHandlerType);//获取类型
		}
		handlerTypes.addAll(ClassUtils.getAllInterfacesForClassAsSet(targetType));//添加所有接口
		for (Class<?> currentHandlerType : handlerTypes) {
			final Class<?> targetClass = (specificHandlerType != null ? specificHandlerType : currentHandlerType);
			//获取所有方法，进行检查，符合条件的放入methodMap中
			ReflectionUtils.doWithMethods(currentHandlerType, method -> {
				Method specificMethod = ClassUtils.getMostSpecificMethod(method, targetClass);
				T result = metadataLookup.inspect(specificMethod);//就是getMappingForMethod
				if (result != null) {
					Method bridgedMethod = BridgeMethodResolver.findBridgedMethod(specificMethod);
					if (bridgedMethod == specificMethod || metadataLookup.inspect(bridgedMethod) == null) {
						methodMap.put(specificMethod, result);
					}
				}
			}, ReflectionUtils.USER_DECLARED_METHODS);
		}
		return methodMap;
	}
```

##### AbstractHandlerMethodMapping的getMappingForMethod获得方法映射

为创建方法`RequestMappingInfo`，再为类创建`RequestMappingInfo` ，进行合并返回。

```java
@Override
	@Nullable
	protected RequestMappingInfo getMappingForMethod(Method method, Class<?> handlerType) {
		RequestMappingInfo info = createRequestMappingInfo(method);
		if (info != null) {
     //如果方法RequestMappingInfo不为空，就查看类上，如果有的话要合并
			RequestMappingInfo typeInfo = createRequestMappingInfo(handlerType);
			if (typeInfo != null) {
     //如果类上也有RequestMapping，进行合并
				info = typeInfo.combine(info);
			}
			String prefix = getPathPrefix(handlerType);
			if (prefix != null) {
				info = RequestMappingInfo.paths(prefix).options(this.config).build().combine(info);
			}
		}
		return info;
	}
```

这里就是比较核心的地方，下篇详细讲下。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
