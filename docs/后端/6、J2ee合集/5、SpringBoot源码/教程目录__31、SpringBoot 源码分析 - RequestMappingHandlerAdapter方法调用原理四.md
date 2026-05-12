# 31、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理四
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/31.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## 如何匹配参数supportsParameter

参数解析器有那么多，暂时不可能全部都讲，说几个比较常用的，来看看他们是怎么匹配参数的。

### PathVariableMethodArgumentResolver

这个就是匹配`PathVariable`注解的。

```java
@Override
	public boolean supportsParameter(MethodParameter parameter) {
		if (!parameter.hasParameterAnnotation(PathVariable.class)) {
			return false;
		}
		if (Map.class.isAssignableFrom(parameter.nestedIfOptional().getNestedParameterType())) {
			PathVariable pathVariable = parameter.getParameterAnnotation(PathVariable.class);
			return (pathVariable != null && StringUtils.hasText(pathVariable.value()));
		}
		return true;
	}
```

### ModelAttributeMethodProcessor

匹配`ModelAttribute`注解的，参数类型满足不是简单类型的条件。

```java
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return (parameter.hasParameterAnnotation(ModelAttribute.class) ||
				(this.annotationNotRequired && !BeanUtils.isSimpleProperty(parameter.getParameterType())));
	}
```

### RequestResponseBodyMethodProcessor

匹配`RequestBody`注解的。

```java
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(RequestBody.class);
	}
```

### RequestHeaderMethodArgumentResolver

匹配`RequestHeader`注解的。

```java
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return (parameter.hasParameterAnnotation(RequestHeader.class) &&
				!Map.class.isAssignableFrom(parameter.nestedIfOptional().getNestedParameterType()));
	}
```

### ModelMethodProcessor

匹配`Model`类型的。

```java
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return Model.class.isAssignableFrom(parameter.getParameterType());
	}
```

好了，不贴了，很多都是差不多的，自己看下就好了。

## 解析参数resolveArgument

其实就是获取解析器解析，这个时候已经有缓存了，直接拿出来解析就好了。

```java
	@Override
	@Nullable
	public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		//获取解析器
		HandlerMethodArgumentResolver resolver = getArgumentResolver(parameter);
		...
		return resolver.resolveArgument(parameter, mavContainer, webRequest, binderFactory);
	}
```

### 解析器解析

#### ModelMethodProcessor

这个其实就是拿出模型容器里的`BindingAwareModelMap`是`ModelMap`的一种扩展，也是`Model`接口类型的。

```java
	@Override
	@Nullable
	public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		Assert.state(mavContainer != null, "ModelAndViewContainer is required for model exposure");
		return mavContainer.getModel();
	}
```

#### RequestHeaderMethodArgumentResolver

```java
	@Override
	@Nullable
	protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		String[] headerValues = request.getHeaderValues(name);
		if (headerValues != null) {
			return (headerValues.length == 1 ? headerValues[0] : headerValues);
		}
		else {
			return null;
		}
	}
```

#### ModelAttributeMethodProcessor

首先获取`ModelAttribute`注解的`name`属性，没有的话就是参数类型首字母小写作为名字，`String`的话名字就是`string`，然后设置是否要绑定，根据`ModelAttribute`注解的`binding`属性，默认是`true`要绑定。然后看模型里有没有这个属性名对应属性，没有的话就要创建

```java
@Override
	@Nullable
	public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		...
		String name = ModelFactory.getNameForParameter(parameter);//获取参数名字，没有的话就按类型首字母小写
		ModelAttribute ann = parameter.getParameterAnnotation(ModelAttribute.class);
		if (ann != null) {
			mavContainer.setBinding(name, ann.binding());
		}
		Object attribute = null;
		BindingResult bindingResult = null;
		if (mavContainer.containsAttribute(name)) {
     //存在就取出来
			attribute = mavContainer.getModel().get(name);
		}
		else {
			// Create attribute instance
			try {
     //不存在就创建
				attribute = createAttribute(name, parameter, binderFactory, webRequest);
			}
			catch (BindException ex) {
				if (isBindExceptionRequired(parameter)) {
					// No BindingResult parameter -> fail with BindException
					throw ex;
				}
				// Otherwise, expose null/empty value and associated BindingResult
				if (parameter.getParameterType() == Optional.class) {
					attribute = Optional.empty();
				}
				bindingResult = ex.getBindingResult();//有异常要记录
			}
		}
		//没有异常
		if (bindingResult == null) {
			WebDataBinder binder = binderFactory.createBinder(webRequest, attribute, name);
			if (binder.getTarget() != null) {
     attribute不为空
				if (!mavContainer.isBindingDisabled(name)) {
					bindRequestParameters(binder, webRequest);//绑定请求参数
				}
				validateIfApplicable(binder, parameter);
				if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
					throw new BindException(binder.getBindingResult());
				}
			}
			// Value type adaptation, also covering java.util.Optional
			if (!parameter.getParameterType().isInstance(attribute)) {
				attribute = binder.convertIfNecessary(binder.getTarget(), parameter.getParameterType(), parameter);
			}
			bindingResult = binder.getBindingResult();
		}
		// Add resolved attribute and BindingResult at the end of the model
		Map<String, Object> bindingResultModel = bindingResult.getModel();
		mavContainer.removeAttributes(bindingResultModel);
		mavContainer.addAllAttributes(bindingResultModel);//添加绑定结果
		return attribute;
	}
```

##### ModelAndViewContainer的setBinding设置绑定

根据参数看是否要绑定，绑定的就从`noBinding`集合里删除，否则就添加进去。`noBinding`集合就是放**不绑定**的属性名。

```java
	public void setBinding(String attributeName, boolean enabled) {
		if (!enabled) {
			this.noBinding.add(attributeName);
		}
		else {
			this.noBinding.remove(attributeName);
		}
	}
```

##### ServletModelAttributeMethodProcessor的createAttribute

从请求中获取属性，否则的话就用反射创建一个属性，里面涉及的比较深在，暂时不跟了，后面有时间再研究。

```java
	@Override
	protected final Object createAttribute(String attributeName, MethodParameter parameter,
			WebDataBinderFactory binderFactory, NativeWebRequest request) throws Exception {
		String value = getRequestValueForAttribute(attributeName, request);
		if (value != null) {
     //存在的话就从请求参数中创建属性
			Object attribute = createAttributeFromRequestValue(
					value, attributeName, parameter, binderFactory, request);
			if (attribute != null) {
				return attribute;
			}
		}
		//创建属性
		return super.createAttribute(attributeName, parameter, binderFactory, request);
	}
```

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
