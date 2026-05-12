# 32、SpringBoot 源码分析 - RequestMappingHandlerAdapter方法调用原理五
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/32.html
- 分类：J2EE框架
- 分组：教程目录
## 处理大致流程图

## DefaultDataBinderFactory的createBinder

如果没有异常的话，就要创建`WebDataBinder`，进行数据绑定，这里的关键在`initBinder`中。

```java
@Override
	@SuppressWarnings("deprecation")
	public final WebDataBinder createBinder(
			NativeWebRequest webRequest, @Nullable Object target, String objectName) throws Exception {
		//创建数据绑定
		WebDataBinder dataBinder = createBinderInstance(target, objectName, webRequest);
		if (this.initializer != null) {
			this.initializer.initBinder(dataBinder, webRequest);
		}
		initBinder(dataBinder, webRequest);
		return dataBinder;
	}
```

### InitBinderDataBinderFactory的initBinder

如果能匹配的话就调用`InitBinder`注解的绑定方法。

```java
@Override
	public void initBinder(WebDataBinder dataBinder, NativeWebRequest request) throws Exception {
		for (InvocableHandlerMethod binderMethod : this.binderMethods) {
			if (isBinderMethodApplicable(binderMethod, dataBinder)) {
     //InitBinder属性名字匹配
				Object returnValue = binderMethod.invokeForRequest(request, null, dataBinder);
				if (returnValue != null) {
					throw new IllegalStateException(
							"@InitBinder methods must not return a value (should be void): " + binderMethod);
				}
			}
		}
	}
```

#### isBinderMethodApplicable是否匹配

首先绑定方法上得有`InitBinder`注解，然后**注解属性的名字数组为空，或者包含前面属性的名字才算匹配**。

```java
	protected boolean isBinderMethodApplicable(HandlerMethod initBinderMethod, WebDataBinder dataBinder) {
		InitBinder ann = initBinderMethod.getMethodAnnotation(InitBinder.class);
		Assert.state(ann != null, "No InitBinder annotation");
		String[] names = ann.value();
		return (ObjectUtils.isEmpty(names) || ObjectUtils.containsElement(names, dataBinder.getObjectName()));
	}
```

#### 调用方法

又回到这里了，因为绑定方法也被封装成`InvocableHandlerMethod`类型了，所以调用是一样的，只是参数不同，还是要去获得方法参数，然后调用。

然后就是反射调用。

继续这边：

## ModelAndViewContainer的isBindingDisabled是否不绑定

只要出现在`bindingDisabled`或者前面说过的`noBinding`里，就是不绑定，否则就要绑定。

```java
	public boolean isBindingDisabled(String name) {
		return (this.bindingDisabled.contains(name) || this.noBinding.contains(name));
	}
```

## ServletModelAttributeMethodProcessor的bindRequestParameters绑定请求参数

主要还是获取底层的`ServletRequest` ，然后进行数据绑定器的绑定。

```java
	@Override
	protected void bindRequestParameters(WebDataBinder binder, NativeWebRequest request) {
		ServletRequest servletRequest = request.getNativeRequest(ServletRequest.class);//获取底层ServletRequest
		Assert.state(servletRequest != null, "No ServletRequest");
		ServletRequestDataBinder servletBinder = (ServletRequestDataBinder) binder;
		servletBinder.bind(servletRequest);//绑定
	}
```

### ServletRequestDataBinder的bind

首先创建一个`MutablePropertyValues` ，将参数和值封装成`PropertyValue`设置进去并添加到`propertyValueList`中，包括表单和`uri`的参数值。然后获取底层的`MultipartRequest`，也就是表单相关的请求，里面的参数只包含表单提交的，没有`uri`的，好包括`MultipartFile`文件。然后让让他们绑定起来，文件的暂时不说。然后再是将`uri`的临时变量`org.springframework.web.servlet.HandlerMapping.uriTemplateVariables`的名字和属性放入`MutablePropertyValues`中。最后做一些属性名的检查再绑定到`DataBinder`中，具体的比较复杂，太深入浪费时间了，有兴趣的可以深入研究。

```java
	public void bind(ServletRequest request) {
		MutablePropertyValues mpvs = new ServletRequestParameterPropertyValues(request);
		MultipartRequest multipartRequest = WebUtils.getNativeRequest(request, MultipartRequest.class);
		if (multipartRequest != null) {
			bindMultipart(multipartRequest.getMultiFileMap(), mpvs);
		}
		addBindValues(mpvs, request);
		doBind(mpvs);
	}
```

### ModelAttributeMethodProcessor的validateIfApplicable

还需要对方法参数进行验证，内部和`Validated`注解相关。

```java
	protected void validateIfApplicable(WebDataBinder binder, MethodParameter parameter) {
		for (Annotation ann : parameter.getParameterAnnotations()) {
			Object[] validationHints = determineValidationHints(ann);
			if (validationHints != null) {
				binder.validate(validationHints);
				break;
			}
		}
	}
```

这样`ModelAttributeMethodProcessor`如何解析参数的大致能了解了，细节还是要自己去看，下面来讲下其他的，比如最一般的字符串参数是怎么解析的，也就是这个类`RequestParamMethodArgumentResolver`的`resolveArgument`方法。

## AbstractNamedValueMethodArgumentResolver的resolveArgument

简单的来说就是一般的字符串参数解析，先解析参数的名字，然后获取底层的请求，尝试从请求参数中获取，如果获取是空的话，有默认的话会设置默认值，如果是必须的话，会报异常，最后还会进行数据的绑定操作，细节比较复杂，不展开了。

```java
	@Override
	@Nullable
	public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		NamedValueInfo namedValueInfo = getNamedValueInfo(parameter);
		MethodParameter nestedParameter = parameter.nestedIfOptional();
		Object resolvedName = resolveStringValue(namedValueInfo.name);//解析名字
		...
		Object arg = resolveName(resolvedName.toString(), nestedParameter, webRequest);
		if (arg == null) {
     //值为空的话
			if (namedValueInfo.defaultValue != null) {
     //有默认值
				arg = resolveStringValue(namedValueInfo.defaultValue);
			}
			else if (namedValueInfo.required && !nestedParameter.isOptional()) {
				handleMissingValue(namedValueInfo.name, nestedParameter, webRequest);
			}
			arg = handleNullValue(namedValueInfo.name, arg, nestedParameter.getNestedParameterType());
		}
		else if ("".equals(arg) && namedValueInfo.defaultValue != null) {
			arg = resolveStringValue(namedValueInfo.defaultValue);
		}
		if (binderFactory != null) {
     //数据绑定操作
			WebDataBinder binder = binderFactory.createBinder(webRequest, null, namedValueInfo.name);
			try {
     //类型转换
				arg = binder.convertIfNecessary(arg, parameter.getParameterType(), parameter);
			}
			catch (ConversionNotSupportedException ex) {
				throw new MethodArgumentConversionNotSupportedException(arg, ex.getRequiredType(),
						namedValueInfo.name, parameter, ex.getCause());
			}
			catch (TypeMismatchException ex) {
				throw new MethodArgumentTypeMismatchException(arg, ex.getRequiredType(),
						namedValueInfo.name, parameter, ex.getCause());
			}
		}
		handleResolvedValue(arg, namedValueInfo.name, parameter, mavContainer, webRequest);
		return arg;
	}
```

有些细节比较复杂，不展开了，还是先把主要的流程说完比较好。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
