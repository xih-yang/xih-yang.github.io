# 29、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/29.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## getDataBinderFactory

其实就是先获取方法所在的类，看缓存里有没有相关方法，没有就找出有`InitBinder`注解的方法放入缓存，然后再处理全局的绑定增强方法，有的话也要加入绑定集合，最后将绑定方法集合封装成`WebDataBinderFactory` 返回。

```java
	private WebDataBinderFactory getDataBinderFactory(HandlerMethod handlerMethod) throws Exception {
		Class<?> handlerType = handlerMethod.getBeanType();//方法的处理器类型
		Set<Method> methods = this.initBinderCache.get(handlerType);//缓存里获取
		if (methods == null) {
     //找出处理器类中有InitBinder注解的方法
			methods = MethodIntrospector.selectMethods(handlerType, INIT_BINDER_METHODS);
			this.initBinderCache.put(handlerType, methods);//放入缓存
		}
		List<InvocableHandlerMethod> initBinderMethods = new ArrayList<>();//处理器绑定的方法
		// Global methods first 全局的优先处理，也就是初始化的时候放进容器的@ControllerAdvice注解的类排在最前面
		this.initBinderAdviceCache.forEach((controllerAdviceBean, methodSet) -> {
			if (controllerAdviceBean.isApplicableToBeanType(handlerType)) {
				Object bean = controllerAdviceBean.resolveBean();
				for (Method method : methodSet) {
					initBinderMethods.add(createInitBinderMethod(bean, method));
				}
			}
		});
		for (Method method : methods) {
     //处理器的方法
			Object bean = handlerMethod.getBean();
			initBinderMethods.add(createInitBinderMethod(bean, method));//封装成InvocableHandlerMethod放入集合
		}
		return createDataBinderFactory(initBinderMethods);//封装成工厂返回
	}
```

### MethodIntrospector的selectMethods根据条件获取相应方法

他会获取`targetType`以及父类和接口的所有的方法，然后找出有`InitBinder`注解的方法，这个前面也有讲过，获取`uri`映射初始化的地方。

```java
	public static Set<Method> selectMethods(Class<?> targetType, final ReflectionUtils.MethodFilter methodFilter) {
		return selectMethods(targetType,
				(MetadataLookup<Boolean>) method -> (methodFilter.matches(method) ? Boolean.TRUE : null)).keySet();
	}
	//条件就是方法上有InitBinder注解
	public static final MethodFilter INIT_BINDER_METHODS = method ->
			AnnotatedElementUtils.hasAnnotation(method, InitBinder.class);
```

### createInitBinderMethod

创建可调用方法，其实就是封装了一层，设置了一些参数，以便于后面好操作。

```java
private InvocableHandlerMethod createInitBinderMethod(Object bean, Method method) {
		InvocableHandlerMethod binderMethod = new InvocableHandlerMethod(bean, method);
		if (this.initBinderArgumentResolvers != null) {
     //设置参数解析器
			binderMethod.setHandlerMethodArgumentResolvers(this.initBinderArgumentResolvers);
		}
		binderMethod.setDataBinderFactory(new DefaultDataBinderFactory(this.webBindingInitializer));
		binderMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);//设置属性探测器
		return binderMethod;
	}
```

## getModelFactory获取模型工厂

模型工厂跟数据相关，当然需要数据绑定帮忙啦，所以这里把处理方法和数据绑定工厂一起传进来了。

首先获取`SessionAttributesHandler`，如果处理器类上有`SessionAttributes`注解的话，就要获取相关信息。然后从缓存里获取有`ModelAttribute`和`RequestMapping`注解的方法，暂时叫他模型方法吧，这个方法会在处理方法前调用，可以理解为对模型做预处理。缓存不存在的话就去找出来放进集合，还是用`MethodIntrospector.selectMethods`，条件就是方法有`ModelAttribute`和`RequestMapping`注解。然后将符合条件的方法放入缓存。然后再去处理全局的那种加入集合，最后将集合里的方法封装成`InvocableHandlerMethod`，这个跟上面数据绑定的方法一样，最后创建一个模型工厂返回。

```java
private ModelFactory getModelFactory(HandlerMethod handlerMethod, WebDataBinderFactory binderFactory) {
		SessionAttributesHandler sessionAttrHandler = getSessionAttributesHandler(handlerMethod);
		Class<?> handlerType = handlerMethod.getBeanType();
		Set<Method> methods = this.modelAttributeCache.get(handlerType);//缓存里取
		if (methods == null) {
     //查找同时有RequestMapping和ModelAttribute注解的方法
			methods = MethodIntrospector.selectMethods(handlerType, MODEL_ATTRIBUTE_METHODS);
			this.modelAttributeCache.put(handlerType, methods);
		}
		List<InvocableHandlerMethod> attrMethods = new ArrayList<>();
		// Global methods first 处理全局的，排在最前面
		this.modelAttributeAdviceCache.forEach((controllerAdviceBean, methodSet) -> {
			if (controllerAdviceBean.isApplicableToBeanType(handlerType)) {
				Object bean = controllerAdviceBean.resolveBean();
				for (Method method : methodSet) {
					attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
				}
			}
		});
		for (Method method : methods) {
			Object bean = handlerMethod.getBean();
			attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
		}
		return new ModelFactory(attrMethods, binderFactory, sessionAttrHandler);
	}
```

### 模型方法条件

```java
	public static final MethodFilter MODEL_ATTRIBUTE_METHODS = method ->
			(!AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class) &&
					AnnotatedElementUtils.hasAnnotation(method, ModelAttribute.class));
```

### 全局的模型方法

其实就是设置全局的属性：

先看下结果：

### ModelFactory构造方法

把方法都封装成了`ModelMethod`模型方法，其他的只是赋值。

```java
	public ModelFactory(@Nullable List<InvocableHandlerMethod> handlerMethods,
			WebDataBinderFactory binderFactory, SessionAttributesHandler attributeHandler) {
		if (handlerMethods != null) {
			for (InvocableHandlerMethod handlerMethod : handlerMethods) {
				this.modelMethods.add(new ModelMethod(handlerMethod));
			}
		}
		this.dataBinderFactory = binderFactory;
		this.sessionAttributesHandler = attributeHandler;
	}
```

#### ModelMethod模型方法

这里会进行方法的参数检查，如果有`ModelAttribute`注解的参数，那就是一定要的，所以会添加到依赖`dependencies`中，依赖在后面调用模型方法的时候会有用，但是这里的依赖是字符串类型，所以要获取参数名字，如果在`ModelAttribute`注解中没写的话，默认会是参数类型的首字母小写为名字，比如`String`类型的话，就是`string`。

```java
		public ModelMethod(InvocableHandlerMethod handlerMethod) {
			this.handlerMethod = handlerMethod;
			for (MethodParameter parameter : handlerMethod.getMethodParameters()) {
				if (parameter.hasParameterAnnotation(ModelAttribute.class)) {
					this.dependencies.add(getNameForParameter(parameter));
				}
			}
		}
```

比如这样模型方法有参数`@ModelAttribute String aaa`，`ModelAttribute`注解内没指定名字，而方法只有参数类型信息：

他的依赖属性名就是：

至此我们数据绑定工厂和模型工厂创建好了，解析去就要做事了。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
