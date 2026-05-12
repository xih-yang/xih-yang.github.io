# 17、SpringMVC源码分析 - @MatrixVariable的使用及原理
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/17.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

@MatrixVariable可以从url中获取路径参数。

## 一、使用

### 单个参数

接口方法：

```java
	@ApiOperation(value = "测试@MatrixVariable", notes = "单个参数")
    @GetMapping(value = "/matrix/{param}", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity aaa(@PathVariable String param, @MatrixVariable String var) throws BaseException {
        ResponseEntity responseEntity = new ResponseEntity();
        System.out.println("param: " + param);
        System.out.println("var: " + var);
        return responseEntity;
    }
```

请求路径：

```java
matrix/param1;var=matrixVar
```

结果：

```java
param: param1
var: matrixVar
```

### 多个参数

接口方法：

```java
	@ApiOperation(value = "测试@MatrixVariable", notes = "多个参数")
    @GetMapping(value = "/matrix/{param}/{param2}", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity aaa(@PathVariable String param, @MatrixVariable(pathVar = "param2") String var) throws BaseException {
        ResponseEntity responseEntity = new ResponseEntity();
        System.out.println("param: " + param);
        System.out.println("var: " + var);
        return responseEntity;
    }
```

请求路径：

```java
matrix/param1;var=matrixVar;var1=matrixVar/param2;var=matrixVar2
```

结果：

```java
param: param1
var: matrixVar2
```

### Map类型参数

接口方法：

```java
	@ApiOperation(value = "测试@MatrixVariable", notes = "多个参数")
    @GetMapping(value = "/matrix/{param}/{param2}", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity aaa(@PathVariable String param, @MatrixVariable(pathVar = "param1") Map var) throws BaseException {
        ResponseEntity responseEntity = new ResponseEntity();
        System.out.println("param: " + param);
        System.out.println("var: " + var);
        return responseEntity;
    }
```

请求路径：

```java
matrix/param1;var=matrixVar;var1=matrixVar/param2;var=matrixVar2
```

结果：

```java
param: param1
var: {
     var=matrixVar1, var1=matrixVar1}
```

## 二、原理

### 1 解析路径参数

在获取处理器的过程中，RequestMappingHandlerMapping调用getHandler方法，找到匹配当前请求的HandlerMethod，然后处理匹配到的HandlerMapping，进而解析路径的参数

1、handleMatch( )

```java
RequestMappingInfoHandlerMapping.java
protected void handleMatch(RequestMappingInfo info, String lookupPath, HttpServletRequest request) {
		super.handleMatch(info, lookupPath, request);
		RequestCondition<?> condition = info.getActivePatternsCondition();
		if (condition instanceof PathPatternsRequestCondition) {
			extractMatchDetails((PathPatternsRequestCondition) condition, lookupPath, request);
		}
		else {
			//提取路径里的详细信息
			extractMatchDetails((PatternsRequestCondition) condition, lookupPath, request);
		}
		if (!info.getProducesCondition().getProducibleMediaTypes().isEmpty()) {
			Set<MediaType> mediaTypes = info.getProducesCondition().getProducibleMediaTypes();
			request.setAttribute(PRODUCIBLE_MEDIA_TYPES_ATTRIBUTE, mediaTypes);
		}
	}
```

2、extractMatchDetails( )

```java
private void extractMatchDetails(
			PatternsRequestCondition condition, String lookupPath, HttpServletRequest request) {
		String bestPattern;
		Map<String, String> uriVariables;
		if (condition.isEmptyPathMapping()) {
			bestPattern = lookupPath;
			uriVariables = Collections.emptyMap();
		}
		else {
			bestPattern = condition.getPatterns().iterator().next();
			//提取出UriTemplateVariables参数值，供@PathVariable使用
			uriVariables = getPathMatcher().extractUriTemplateVariables(bestPattern, lookupPath);
			if (!getUrlPathHelper().shouldRemoveSemicolonContent()) {
				//提取出路径里UriTemplateVariables变量后的参数，设置到request属性中，供@MatrixVariable使用
				request.setAttribute(MATRIX_VARIABLES_ATTRIBUTE, extractMatrixVariables(request, uriVariables));
			}
			uriVariables = getUrlPathHelper().decodePathVariables(request, uriVariables);
		}
		request.setAttribute(BEST_MATCHING_PATTERN_ATTRIBUTE, bestPattern);
		//将uriVariables设置到request属性中
		request.setAttribute(URI_TEMPLATE_VARIABLES_ATTRIBUTE, uriVariables);
	}
```

### 2 MatrixVariableMethodArgumentResolver使用参数值

在MatrixVariableMethodArgumentResolver中解析@MatrixVariable注解的参数值，对应上述单个参数和多个参数的示例。

参数值的结果如图：

```java
protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		//从request中获取pathParameters，结构如上图
		Map<String, MultiValueMap<String, String>> pathParameters = (Map<String, MultiValueMap<String, String>>)
				request.getAttribute(HandlerMapping.MATRIX_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		if (CollectionUtils.isEmpty(pathParameters)) {
			return null;
		}
		MatrixVariable ann = parameter.getParameterAnnotation(MatrixVariable.class);
		Assert.state(ann != null, "No MatrixVariable annotation");
		//从注解里获取从哪一个路径参数下获取MatrixVariable值
		String pathVar = ann.pathVar();
		List<String> paramValues = null;
		if (!pathVar.equals(ValueConstants.DEFAULT_NONE)) {
			if (pathParameters.containsKey(pathVar)) {
				//从pathParameters获取路径参数对应Map，再从map中获取MatrixVariable对应值
				paramValues = pathParameters.get(pathVar).get(name);
			}
		}
		else {
			boolean found = false;
			paramValues = new ArrayList<>();
			//遍历pathParameters，根据MatrixVariable名称取匹配
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

### 3 MatrixVariableMapMethodArgumentResolver使用参数值

解析@MatrixVariable注解的参数值，对应上述Map类型参数的示例。

```java
public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest request, @Nullable WebDataBinderFactory binderFactory) throws Exception {
		@SuppressWarnings("unchecked")
		//从request中获取pathParameters
		Map<String, MultiValueMap<String, String>> matrixVariables =
				(Map<String, MultiValueMap<String, String>>) request.getAttribute(
						HandlerMapping.MATRIX_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		if (CollectionUtils.isEmpty(matrixVariables)) {
			//不存在时，返回空的map
			return Collections.emptyMap();
		}
		MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
		MatrixVariable ann = parameter.getParameterAnnotation(MatrixVariable.class);
		Assert.state(ann != null, "No MatrixVariable annotation");
		String pathVariable = ann.pathVar();
		if (!pathVariable.equals(ValueConstants.DEFAULT_NONE)) {
			//根据路径参数获取map
			MultiValueMap<String, String> mapForPathVariable = matrixVariables.get(pathVariable);
			if (mapForPathVariable == null) {
				return Collections.emptyMap();
			}
			map.putAll(mapForPathVariable);
		}
		else {
			//遍历所有路径参数的matrixVariables
			for (MultiValueMap<String, String> vars : matrixVariables.values()) {
				vars.forEach((name, values) -> {
					for (String value : values) {
						map.add(name, value);
					}
				});
			}
		}
		return (isSingleValueMap(parameter) ? map.toSingleValueMap() : map);
	}
```

## 三、配置

在解析MatrixVariable变量的之前，有一个判断，检验UrlPathHelper中的removeSemicolonContent参数，removeSemicolonContent默认是true，默认不会提取MatrixVariable变量，因此需要设置为false，才能进入该分支。

```java
	if (!getUrlPathHelper().shouldRemoveSemicolonContent()) {
		  request.setAttribute(MATRIX_VARIABLES_ATTRIBUTE, extractMatrixVariables(request, uriVariables));
	}
```

配置：

```java
@Configuration
public class ConfigurePathMatchConfig implements WebMvcConfigurer {
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        UrlPathHelper urlPathHelper = new UrlPathHelper();
        //这里设置为false
        urlPathHelper.setRemoveSemicolonContent(false);
        configurer.setUrlPathHelper(urlPathHelper);
    }
}
```

这样，在RequestMappingHandlerMapping创建过程中，会回调configurePathMatch( )方法。

## 总结

本文简单介绍了@MatrixVariable注解的使用及原理。
