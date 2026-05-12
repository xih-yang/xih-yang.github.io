# 16、SpringMVC源码分析 - AbstractNamedValueMethodArgumentResolver
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/16.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

AbstractNamedValueMethodArgumentResolver实现了HandlerMethodArgumentResolver，用于解析请求方法参数的值，可以解析@PathVariable、@RequestParam、@RequestHeader、@RequestAttribute、@CookieValue、@SessionAttribute、@MatrixVariable。

## 一、AbstractNamedValueMethodArgumentResolver

1、resolveArgument( )

```java
public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		//获取参数的名称、默认值等信息
		NamedValueInfo namedValueInfo = getNamedValueInfo(parameter);
		MethodParameter nestedParameter = parameter.nestedIfOptional();
		//参数名可能是表达式，解析出来
		Object resolvedName = resolveEmbeddedValuesAndExpressions(namedValueInfo.name);
		if (resolvedName == null) {
			throw new IllegalArgumentException(
					"Specified name must not resolve to null: [" + namedValueInfo.name + "]");
		}
		//根据参数名获取参数值，由子类实现
		Object arg = resolveName(resolvedName.toString(), nestedParameter, webRequest);
		if (arg == null) {
			if (namedValueInfo.defaultValue != null) {
				//解析默认值
				arg = resolveEmbeddedValuesAndExpressions(namedValueInfo.defaultValue);
			}
			else if (namedValueInfo.required && !nestedParameter.isOptional()) {
				//没有参数值，没有默认值，参数是必须的，则进入缺失值的处理
				handleMissingValue(namedValueInfo.name, nestedParameter, webRequest);
			}
			//对null值的处理，boolean类型赋值false，基本类型抛异常
			arg = handleNullValue(namedValueInfo.name, arg, nestedParameter.getNestedParameterType());
		}
		else if ("".equals(arg) && namedValueInfo.defaultValue != null) {
			//参数值为空字符串时，有默认值时，解析默认值
			arg = resolveEmbeddedValuesAndExpressions(namedValueInfo.defaultValue);
		}
		if (binderFactory != null) {
			WebDataBinder binder = binderFactory.createBinder(webRequest, null, namedValueInfo.name);
			try {
				//通过WebDataBinder的Converters将参数值类型转换成对应的类型
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
			// Check for null value after conversion of incoming argument value
			if (arg == null && namedValueInfo.defaultValue == null &&
					namedValueInfo.required && !nestedParameter.isOptional()) {
				//值进行转换之后，对缺失值的处理
				handleMissingValueAfterConversion(namedValueInfo.name, nestedParameter, webRequest);
			}
		}
		//已经解析出参数值，方法留给子类实现
		handleResolvedValue(arg, namedValueInfo.name, parameter, mavContainer, webRequest);
		return arg;
	}
```

## 二、PathVariableMethodArgumentResolver

用于解析@PathVariable

```java
protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		//获取uriTemplateVariables，在获取变量值
		Map<String, String> uriTemplateVars = (Map<String, String>) request.getAttribute(
				HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		return (uriTemplateVars != null ? uriTemplateVars.get(name) : null);
	}
```

从request中获取uriTemplateVariables属性，在RequestMappingInfoHandlerMapping getHandler的时候解析出参数和值存入该属性中。

## 三、RequestParamMethodArgumentResolver

用于解析@RequestParam

```java
protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		HttpServletRequest servletRequest = request.getNativeRequest(HttpServletRequest.class);
		if (servletRequest != null) {
			//处理文件上传参数
			Object mpArg = MultipartResolutionDelegate.resolveMultipartArgument(name, parameter, servletRequest);
			if (mpArg != MultipartResolutionDelegate.UNRESOLVABLE) {
				return mpArg;
			}
		}
		Object arg = null;
		MultipartRequest multipartRequest = request.getNativeRequest(MultipartRequest.class);
		if (multipartRequest != null) {
			List<MultipartFile> files = multipartRequest.getFiles(name);
			if (!files.isEmpty()) {
				arg = (files.size() == 1 ? files.get(0) : files);
			}
		}
		if (arg == null) {
			//通过request.getParameterValues获取参数值
			String[] paramValues = request.getParameterValues(name);
			if (paramValues != null) {
				arg = (paramValues.length == 1 ? paramValues[0] : paramValues);
			}
		}
		return arg;
	}
```

## 四、RequestHeaderMethodArgumentResolver

用于解析@RequestHeader

```java
	protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		//从request的headers中获取值
		String[] headerValues = request.getHeaderValues(name);
		if (headerValues != null) {
			return (headerValues.length == 1 ? headerValues[0] : headerValues);
		}
		else {
			return null;
		}
	}
```

## 五、RequestAttributeMethodArgumentResolver

用于解析@RequestAttribute

```java
	protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request){
		//从attributes中获取值,SCOPE_REQUEST域，request.getAttribute
		return request.getAttribute(name, RequestAttributes.SCOPE_REQUEST);
	}
```

## 六、ServletCookieValueMethodArgumentResolver

用于解析@CookieValue

```java
protected Object resolveName(String cookieName, MethodParameter parameter,
			NativeWebRequest webRequest) throws Exception {
		HttpServletRequest servletRequest = webRequest.getNativeRequest(HttpServletRequest.class);
		Assert.state(servletRequest != null, "No HttpServletRequest");
		//从Cookie里获取值
		Cookie cookieValue = WebUtils.getCookie(servletRequest, cookieName);
		if (Cookie.class.isAssignableFrom(parameter.getNestedParameterType())) {
			return cookieValue;
		}
		else if (cookieValue != null) {
			return this.urlPathHelper.decodeRequestString(servletRequest, cookieValue.getValue());
		}
		else {
			return null;
		}
	}
```

## 七、SessionAttributeMethodArgumentResolver

用于解析@SessionAttribute

```java
	protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) {
		//从attributes中获取值,SCOPE_SESSION域，session.getAttribute
		return request.getAttribute(name, RequestAttributes.SCOPE_SESSION);
	}
```

## 八、MatrixVariableMethodArgumentResolver

用于解析@MatrixVariable

```java
protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		//获取路径参数
		Map<String, MultiValueMap<String, String>> pathParameters = (Map<String, MultiValueMap<String, String>>)
				request.getAttribute(HandlerMapping.MATRIX_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		if (CollectionUtils.isEmpty(pathParameters)) {
			return null;
		}
		MatrixVariable ann = parameter.getParameterAnnotation(MatrixVariable.class);
		Assert.state(ann != null, "No MatrixVariable annotation");
		//路径变量名称
		String pathVar = ann.pathVar();
		List<String> paramValues = null;
		if (!pathVar.equals(ValueConstants.DEFAULT_NONE)) {
			if (pathParameters.containsKey(pathVar)) {
				//根据变量名称和参数名称获取参数值
				paramValues = pathParameters.get(pathVar).get(name);
			}
		}
		else {
			boolean found = false;
			paramValues = new ArrayList<>();
				//遍历路径变量名，匹配参数名称，获取参数值
			for (MultiValueMap<String, String> params : pathParameters.values()) {
				if (params.containsKey(name)) {
					if (found) {
						String paramType = parameter.getNestedParameterType().getName();
						throw new ServletRequestBindingException(
								"Found more than one match for URI path parameter '" + name +
								"' for parameter type [" + paramType + "]. Use 'pathVar' attribute to disambiguate.");
					}
					paramValues.addAll(params.get(name));
					found = true;
				}
			}
		}
		if (CollectionUtils.isEmpty(paramValues)) {
			return null;
		}
		else if (paramValues.size() == 1) {
			return paramValues.get(0);
		}
		else {
			return paramValues;
		}
	}
```
