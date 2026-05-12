# 09、SpringCloud Alibaba - feign 接口注解解析规则 Contract
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/9.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

Contract用于标识feign接口和接口方法上那些注解是有效的，并对这些注解进行提取，封装成方法的元数据信息。

## 一、Contract

```java
public interface Contract {
  /**
   * Called to parse the methods in the class that are linked to HTTP requests.
   *
   * @param targetType {@link feign.Target#type() type} of the Feign interface.
   * 
   *  根据接口类型提取出接口里方法的元数据信息，保存在MethodMetadata中
   */
  List<MethodMetadata> parseAndValidateMetadata(Class<?> targetType);
}
```

## 二、BaseContract

1、抽象基类

```java
abstract class BaseContract implements Contract {
    /**
     * @param targetType {@link feign.Target#type() type} of the Feign interface.
     * @seeparseAndValidateMetadata(Class)
     */
    @Override
    public List<MethodMetadata> parseAndValidateMetadata(Class<?> targetType) {
      //接口上不能有泛型变量
      checkState(targetType.getTypeParameters().length == 0, "Parameterized types unsupported: %s",
          targetType.getSimpleName());
      //接口最多有一个父接口
      checkState(targetType.getInterfaces().length <= 1, "Only single inheritance supported: %s",
          targetType.getSimpleName());
      if (targetType.getInterfaces().length == 1) {
        //父接口存在时，父接口的父接口不能存在
        checkState(targetType.getInterfaces()[0].getInterfaces().length == 0,
            "Only single-level inheritance supported: %s",
            targetType.getSimpleName());
      }
      final Map<String, MethodMetadata> result = new LinkedHashMap<String, MethodMetadata>();
      //遍历接口方法
      for (final Method method : targetType.getMethods()) {
        //过滤掉Object的方法、static方法、default方法
        if (method.getDeclaringClass() == Object.class ||
            (method.getModifiers() & Modifier.STATIC) != 0 ||
            Util.isDefault(method)) {
          continue;
        }
        //解析出每个方法的元数据 MethodMetadata 
        final MethodMetadata metadata = parseAndValidateMetadata(targetType, method);
        checkState(!result.containsKey(metadata.configKey()), "Overrides unsupported: %s",
            metadata.configKey());
        result.put(metadata.configKey(), metadata);
      }
      return new ArrayList<>(result.values());
    }
```

2、parseAndValidateMetadata(Class targetType, Method method)

```java
protected MethodMetadata parseAndValidateMetadata(Class<?> targetType, Method method) {
      final MethodMetadata data = new MethodMetadata();
      data.targetType(targetType);
      data.method(method);
      data.returnType(Types.resolve(targetType, targetType, method.getGenericReturnType()));
      data.configKey(Feign.configKey(targetType, method));
      if (targetType.getInterfaces().length == 1) {
        //处理父接口上的注解，留给子类实现
        processAnnotationOnClass(data, targetType.getInterfaces()[0]);
      }
      //处理当前接口上的注解，留给子类实现
      processAnnotationOnClass(data, targetType);
      for (final Annotation methodAnnotation : method.getAnnotations()) {
        //处理接口方法上的注解，留给子类实现
        processAnnotationOnMethod(data, methodAnnotation, method);
      }
      if (data.isIgnored()) {
        return data;
      }
      checkState(data.template().method() != null,
          "Method %s not annotated with HTTP method type (ex. GET, POST)%s",
          data.configKey(), data.warnings());
      //方法参数类型
      final Class<?>[] parameterTypes = method.getParameterTypes();
      final Type[] genericParameterTypes = method.getGenericParameterTypes();
	  //参数注解
      final Annotation[][] parameterAnnotations = method.getParameterAnnotations();
      final int count = parameterAnnotations.length;
      for (int i = 0; i < count; i++) {
        boolean isHttpAnnotation = false;
        if (parameterAnnotations[i] != null) {
          //http相关的注解，留给子类实现
          isHttpAnnotation = processAnnotationsOnParameter(data, parameterAnnotations[i], i);
        }
        if (isHttpAnnotation) {
          data.ignoreParamater(i);
        }
		//参数类型是否是URI，有了就使用，没有就使用默认的
        if (parameterTypes[i] == URI.class) {
          data.urlIndex(i);
        } else if (!isHttpAnnotation && parameterTypes[i] != Request.Options.class) {
          if (data.isAlreadyProcessed(i)) {
            checkState(data.formParams().isEmpty() || data.bodyIndex() == null,
                "Body parameters cannot be used with form parameters.%s", data.warnings());
          } else {
            checkState(data.formParams().isEmpty(),
                "Body parameters cannot be used with form parameters.%s", data.warnings());
            checkState(data.bodyIndex() == null,
                "Method has too many Body parameters: %s%s", method, data.warnings());
            data.bodyIndex(i);
            data.bodyType(Types.resolve(targetType, targetType, genericParameterTypes[i]));
          }
        }
      }
      if (data.headerMapIndex() != null) {
        checkMapString("HeaderMap", parameterTypes[data.headerMapIndex()],
            genericParameterTypes[data.headerMapIndex()]);
      }
      if (data.queryMapIndex() != null) {
        if (Map.class.isAssignableFrom(parameterTypes[data.queryMapIndex()])) {
          checkMapKeys("QueryMap", genericParameterTypes[data.queryMapIndex()]);
        }
      }
      return data;
    }
```

## 三、Default

它是feign里 Contract 的默认实现，支持Headers 、RequestLine 、Body、Param、QueryMap 注解

```java
class Default extends DeclarativeContract {
    static final Pattern REQUEST_LINE_PATTERN = Pattern.compile("^([A-Z]+)[ ]*(.*)$");
    public Default() {
      //类上支持 Headers 注解
      super.registerClassAnnotation(Headers.class, (header, data) -> {
        final String[] headersOnType = header.value();
        checkState(headersOnType.length > 0, "Headers annotation was empty on type %s.",
            data.configKey());
        final Map<String, Collection<String>> headers = toMap(headersOnType);
        headers.putAll(data.template().headers());
        data.template().headers(null); // to clear
        data.template().headers(headers);
      });
      //方法上支持 RequestLine 注解
      super.registerMethodAnnotation(RequestLine.class, (ann, data) -> {
        final String requestLine = ann.value();
        checkState(emptyToNull(requestLine) != null,
            "RequestLine annotation was empty on method %s.", data.configKey());
        final Matcher requestLineMatcher = REQUEST_LINE_PATTERN.matcher(requestLine);
        if (!requestLineMatcher.find()) {
          throw new IllegalStateException(String.format(
              "RequestLine annotation didn't start with an HTTP verb on method %s",
              data.configKey()));
        } else {
          data.template().method(HttpMethod.valueOf(requestLineMatcher.group(1)));
          data.template().uri(requestLineMatcher.group(2));
        }
        data.template().decodeSlash(ann.decodeSlash());
        data.template()
            .collectionFormat(ann.collectionFormat());
      });
       //方法上支持 Body 注解
      super.registerMethodAnnotation(Body.class, (ann, data) -> {
        final String body = ann.value();
        checkState(emptyToNull(body) != null, "Body annotation was empty on method %s.",
            data.configKey());
        if (body.indexOf('{') == -1) {
          data.template().body(body);
        } else {
          data.template().bodyTemplate(body);
        }
      });
      //方法上支持 Headers 注解
      super.registerMethodAnnotation(Headers.class, (header, data) -> {
        final String[] headersOnMethod = header.value();
        checkState(headersOnMethod.length > 0, "Headers annotation was empty on method %s.",
            data.configKey());
        data.template().headers(toMap(headersOnMethod));
      });
      //参数上支持 Param 注解
      super.registerParameterAnnotation(Param.class, (paramAnnotation, data, paramIndex) -> {
        final String name = paramAnnotation.value();
        checkState(emptyToNull(name) != null, "Param annotation was empty on param %s.",
            paramIndex);
        nameParam(data, name, paramIndex);
        final Class<? extends Param.Expander> expander = paramAnnotation.expander();
        if (expander != Param.ToStringExpander.class) {
          data.indexToExpanderClass().put(paramIndex, expander);
        }
        if (!data.template().hasRequestVariable(name)) {
          data.formParams().add(name);
        }
      });
      //参数上支持 QueryMap 注解
      super.registerParameterAnnotation(QueryMap.class, (queryMap, data, paramIndex) -> {
        checkState(data.queryMapIndex() == null,
            "QueryMap annotation was present on multiple parameters.");
        data.queryMapIndex(paramIndex);
        data.queryMapEncoded(queryMap.encoded());
      });
      super.registerParameterAnnotation(HeaderMap.class, (queryMap, data, paramIndex) -> {
        checkState(data.headerMapIndex() == null,
            "HeaderMap annotation was present on multiple parameters.");
        data.headerMapIndex(paramIndex);
      });
    }
```

## 四、SpringMvcContract

它是openFeign 里 Contract 的默认实现

**1、** 类上支持注解RequestMapping；

```java
@Override
	protected void processAnnotationOnClass(MethodMetadata data, Class<?> clz) {
		if (clz.getInterfaces().length == 0) {
			RequestMapping classAnnotation = findMergedAnnotation(clz, RequestMapping.class);
			if (classAnnotation != null) {
				// Prepend path from class annotation if specified
				if (classAnnotation.value().length > 0) {
					String pathValue = emptyToNull(classAnnotation.value()[0]);
					pathValue = resolve(pathValue);
					if (!pathValue.startsWith("/")) {
						pathValue = "/" + pathValue;
					}
					data.template().uri(pathValue);
					if (data.template().decodeSlash() != decodeSlash) {
						data.template().decodeSlash(decodeSlash);
					}
				}
			}
		}
	}
```

**2、** 方法上支持注解CollectionFormat、RequestMapping；

```java
@Override
	protected void processAnnotationOnMethod(MethodMetadata data, Annotation methodAnnotation, Method method) {
		//CollectionFormat 注解
		if (CollectionFormat.class.isInstance(methodAnnotation)) {
			CollectionFormat collectionFormat = findMergedAnnotation(method, CollectionFormat.class);
			data.template().collectionFormat(collectionFormat.value());
		}
		//RequestMapping 注解
		if (!RequestMapping.class.isInstance(methodAnnotation)
				&& !methodAnnotation.annotationType().isAnnotationPresent(RequestMapping.class)) {
			return;
		}
		RequestMapping methodMapping = findMergedAnnotation(method, RequestMapping.class);
		// HTTP Method
		RequestMethod[] methods = methodMapping.method();
		if (methods.length == 0) {
			methods = new RequestMethod[] {
      RequestMethod.GET };
		}
		checkOne(method, methods, "method");
		data.template().method(Request.HttpMethod.valueOf(methods[0].name()));
		// path
		checkAtMostOne(method, methodMapping.value(), "value");
		if (methodMapping.value().length > 0) {
			String pathValue = emptyToNull(methodMapping.value()[0]);
			if (pathValue != null) {
				pathValue = resolve(pathValue);
				// Append path from @RequestMapping if value is present on method
				if (!pathValue.startsWith("/") && !data.template().path().endsWith("/")) {
					pathValue = "/" + pathValue;
				}
				data.template().uri(pathValue, true);
				if (data.template().decodeSlash() != decodeSlash) {
					data.template().decodeSlash(decodeSlash);
				}
			}
		}
		//处理 @RequestMapping 注解里的属性
		// produces
		parseProduces(data, method, methodMapping);
		// consumes
		parseConsumes(data, method, methodMapping);
		// headers
		parseHeaders(data, method, methodMapping);
		data.indexToExpander(new LinkedHashMap<>());
	}
```

**3、** 参数上支持注解；

默认的参数注解处理器如下

```java
	private List<AnnotatedParameterProcessor> getDefaultAnnotatedArgumentsProcessors() {
		List<AnnotatedParameterProcessor> annotatedArgumentResolvers = new ArrayList<>();
		//MatrixVariable 注解
		annotatedArgumentResolvers.add(new MatrixVariableParameterProcessor());
		//PathVariable 注解
		annotatedArgumentResolvers.add(new PathVariableParameterProcessor());
		//RequestParam 注解
		annotatedArgumentResolvers.add(new RequestParamParameterProcessor());
		//RequestHeader 注解
		annotatedArgumentResolvers.add(new RequestHeaderParameterProcessor());
		//SpringQueryMap 注解
		annotatedArgumentResolvers.add(new QueryMapParameterProcessor());
		//RequestPart 注解
		annotatedArgumentResolvers.add(new RequestPartParameterProcessor());
		return annotatedArgumentResolvers;
	}
```

```java
@Override
	protected boolean processAnnotationsOnParameter(MethodMetadata data, Annotation[] annotations, int paramIndex) {
		boolean isHttpAnnotation = false;
		AnnotatedParameterProcessor.AnnotatedParameterContext context = new SimpleAnnotatedParameterContext(data,
				paramIndex);
		Method method = processedMethods.get(data.configKey());
		for (Annotation parameterAnnotation : annotations) {
			//获取参数处理器 AnnotatedParameterProcessor 
			AnnotatedParameterProcessor processor = annotatedArgumentProcessors
					.get(parameterAnnotation.annotationType());
			if (processor != null) {
				Annotation processParameterAnnotation;
				// synthesize, handling @AliasFor, while falling back to parameter name on
				// missing Stringvalue():
				processParameterAnnotation = synthesizeWithMethodParameterNameAsFallbackValue(parameterAnnotation,
						method, paramIndex);
				//处理参数
				isHttpAnnotation |= processor.processArgument(context, processParameterAnnotation, method);
			}
		}
		if (!isMultipartFormData(data) && isHttpAnnotation && data.indexToExpander().get(paramIndex) == null) {
			TypeDescriptor typeDescriptor = createTypeDescriptor(method, paramIndex);
			if (conversionService.canConvert(typeDescriptor, STRING_TYPE_DESCRIPTOR)) {
				Param.Expander expander = convertingExpanderFactory.getExpander(typeDescriptor);
				if (expander != null) {
					data.indexToExpander().put(paramIndex, expander);
				}
			}
		}
		return isHttpAnnotation;
	}
```
