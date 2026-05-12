# 36、Spring源码分析 - 36-Spring MVC参数值的绑定
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/36.html
- 分类：J2EE框架
- 分组：教程目录
上一篇[《Spring MVC设计原理》](/zhuanlan/j2ee/spring/7/35.html)中提到了Spring MVC在使用RequestMappingHandlerAdapter处理HTTP请求时会进行参数绑定，参数绑定会在两种方法上发生：

**1、** @RequestMapping方法的参数绑定；

**2、** @ModelAttribute方法的参数绑定；

## 1、参数解析器的初始化

这两种参数绑定分别使用一个HandlerMethodArgumentResolverComposite对象，只不过这个对象内部使用两套HandlerMethodArgumentResolver。HandlerMethodArgumentResolverComposite的初始化是在RequestMappingHandlerAdapter的afterPropertiesSet()方法中。

控制器使用的参数解析器列表，包括通过setCustomArgumentResolvers()提供的内置解析器和自定义解析器。

```java
private List<HandlerMethodArgumentResolver> getDefaultArgumentResolvers() {
   List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
   // Annotation-based argument resolution
   resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), false));
   resolvers.add(new RequestParamMapMethodArgumentResolver());
   resolvers.add(new PathVariableMethodArgumentResolver());
   resolvers.add(new PathVariableMapMethodArgumentResolver());
   resolvers.add(new MatrixVariableMethodArgumentResolver());
   resolvers.add(new MatrixVariableMapMethodArgumentResolver());
   resolvers.add(new ServletModelAttributeMethodProcessor(false));
   resolvers.add(new RequestResponseBodyMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
   resolvers.add(new RequestPartMethodArgumentResolver(getMessageConverters(), this.requestResponseBodyAdvice));
   resolvers.add(new RequestHeaderMethodArgumentResolver(getBeanFactory()));
   resolvers.add(new RequestHeaderMapMethodArgumentResolver());
   resolvers.add(new ServletCookieValueMethodArgumentResolver(getBeanFactory()));
   resolvers.add(new ExpressionValueMethodArgumentResolver(getBeanFactory()));
   resolvers.add(new SessionAttributeMethodArgumentResolver());
   resolvers.add(new RequestAttributeMethodArgumentResolver());
   // Type-based argument resolution
   resolvers.add(new ServletRequestMethodArgumentResolver());
   resolvers.add(new ServletResponseMethodArgumentResolver());
   resolvers.add(new HttpEntityMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
   resolvers.add(new RedirectAttributesMethodArgumentResolver());
   resolvers.add(new ModelMethodProcessor());
   resolvers.add(new MapMethodProcessor());
   resolvers.add(new ErrorsMethodArgumentResolver());
   resolvers.add(new SessionStatusMethodArgumentResolver());
   resolvers.add(new UriComponentsBuilderMethodArgumentResolver());
   // Custom arguments
   if (getCustomArgumentResolvers() != null) {
      resolvers.addAll(getCustomArgumentResolvers());
   }
   // Catch-all
   resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
   resolvers.add(new ServletModelAttributeMethodProcessor(true));
   return resolvers;
}
```

@InitBinder方法使用的参数解析器列表，包括setCustomArgumentResolvers()内置和自定义解析器。

```java
private List<HandlerMethodArgumentResolver> getDefaultInitBinderArgumentResolvers() {
   List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();
   // Annotation-based argument resolution
   resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), false));
   resolvers.add(new RequestParamMapMethodArgumentResolver());
   resolvers.add(new PathVariableMethodArgumentResolver());
   resolvers.add(new PathVariableMapMethodArgumentResolver());
   resolvers.add(new MatrixVariableMethodArgumentResolver());
   resolvers.add(new MatrixVariableMapMethodArgumentResolver());
   resolvers.add(new ExpressionValueMethodArgumentResolver(getBeanFactory()));
   resolvers.add(new SessionAttributeMethodArgumentResolver());
   resolvers.add(new RequestAttributeMethodArgumentResolver());
   // Type-based argument resolution
   resolvers.add(new ServletRequestMethodArgumentResolver());
   resolvers.add(new ServletResponseMethodArgumentResolver());
   // Custom arguments
   if (getCustomArgumentResolvers() != null) {
      resolvers.addAll(getCustomArgumentResolvers());
   }
   // Catch-all
   resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
   return resolvers;
}
```

HandlerMethodArgumentResolver用于在给定请求的上下文中将方法参数解析为参数值的策略接口。

```java
public interface HandlerMethodArgumentResolver {
   //此解析程序是否支持给定的MethodParameter方法参数
   boolean supportsParameter(MethodParameter parameter);
   //将方法参数解析为来自给定请求的参数值。
   //ModelAndViewContainer提供对请求模型的访问。 
   //WebDataBinderFactory提供了一种在需要进行数据绑定和类型转换时创建WebDataBinder实例的方法
   @Nullable
   Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
         NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception;
}
```

HandlerMethodArgumentResolverComposite也实现了HandlerMethodArgumentResolver接口，通过委托给已注册的HandlerMethodArgumentResolver列表来解析方法参数。先前解析的方法参数被缓存以便更快地查找。

```java
@Override
@Nullable
public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
   HandlerMethodArgumentResolver resolver = getArgumentResolver(parameter);
   if (resolver == null) {
      throw new IllegalArgumentException(
            "Unsupported parameter type [" + parameter.getParameterType().getName() + "]." +
                  " supportsParameter should be called first.");
   }
   return resolver.resolveArgument(parameter, mavContainer, webRequest, binderFactory);
}
@Nullable
private HandlerMethodArgumentResolver getArgumentResolver(MethodParameter parameter) {
   HandlerMethodArgumentResolver result = this.argumentResolverCache.get(parameter);
   if (result == null) {
      for (HandlerMethodArgumentResolver methodArgumentResolver : this.argumentResolvers) {
         if (methodArgumentResolver.supportsParameter(parameter)) {
            result = methodArgumentResolver;
            this.argumentResolverCache.put(parameter, result);
            break;
         }
      }
   }
   return result;
}
```

## 2、参数绑定触发时机

Spring MVC在处理请求时会流转到到RequestMappingHandlerAdapter的invokeHandlerMethod方法，这个方法中会调用modelFactory.initModel方法和invocableMethod.invokeAndHandle方法会完成参数解析。

这两个地方最终调用InvocableHandlerMethod.invokeForRequest方法使用HandlerMethodArgumentResolver进行参数解析。

下面分析一下这个方法的具体实现过程。

## 3、源码分析

```java
@Nullable
public Object invokeForRequest(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
      Object... providedArgs) throws Exception {
   Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);
   if (logger.isTraceEnabled()) {
      logger.trace("Arguments: " + Arrays.toString(args));
   }
   return doInvoke(args);
}
```

Spring MVC的参数绑定是在InvocableHandlerMethod#getMethodArgumentValues()中触发的。

```java
//获取当前请求的方法参数值，检查提供的参数值并回退到配置的参数解析器。
//生成的数组将传递到doInvoke()。
protected Object[] getMethodArgumentValues(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
      Object... providedArgs) throws Exception {
   if (ObjectUtils.isEmpty(getMethodParameters())) {
      return EMPTY_ARGS;
   }
   MethodParameter[] parameters = getMethodParameters();
   Object[] args = new Object[parameters.length];
   for (int i = 0; i < parameters.length; i++) {
      MethodParameter parameter = parameters[i];
      parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);
      args[i] = findProvidedArgument(parameter, providedArgs);
      if (args[i] != null) {
         continue;
      }
      if (!this.resolvers.supportsParameter(parameter)) {
         throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));
      }
      try {
         //如果在已提供的参数值中没有与方法参数类型匹配的则使用HandlerMethodArgumentResolverComposite
         args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);
      }
      catch (Exception ex) {
         // Leave stack trace for later, exception may actually be resolved and handled..
         if (logger.isDebugEnabled()) {
            String error = ex.getMessage();
            if (error != null && !error.contains(parameter.getExecutable().toGenericString())) {
               logger.debug(formatArgumentError(parameter, error));
            }
         }
         throw ex;
      }
   }
   return args;
}
```

下面分析几个HandlerMethodArgumentResolver的实现。

### 3.1、AbstractNamedValueMethodArgumentResolver

AbstractNamedValueMethodArgumentResolver用于从NamedValueInfo解析方法参数的抽象基类。子类定义如何执行以下操作：

- 获取方法参数的NamedValueInfo
- 将名称解析为参数值
- 在需要参数值时处理缺少的参数值
- 可选择处理已解析的值

NamedValueInfo是对参数名，参数是否必填以及默认值的封装。

```java
protected static class NamedValueInfo {
   private final String name;
   private final boolean required;
   @Nullable
   private final String defaultValue;
   public NamedValueInfo(String name, boolean required, @Nullable String defaultValue) {
      this.name = name;
      this.required = required;
      this.defaultValue = defaultValue;
   }
}
```

默认值字符串可以包含`$`{...}占位符和Spring Expression Language #{...}表达式。 为了这个工作必须提供ConfigurableBeanFactory给类构造函数。创建WebDataBinder以将类型转换应用于已解析的参数值（如果它与方法参数类型不匹配）。

```java
public abstract class AbstractNamedValueMethodArgumentResolver implements HandlerMethodArgumentResolver {
   @Nullable
   private final ConfigurableBeanFactory configurableBeanFactory;
   @Nullable
   private final BeanExpressionContext expressionContext;
   private final Map<MethodParameter, NamedValueInfo> namedValueInfoCache = new ConcurrentHashMap<>(256);
   public AbstractNamedValueMethodArgumentResolver() {
      this.configurableBeanFactory = null;
      this.expressionContext = null;
   }
   public AbstractNamedValueMethodArgumentResolver(@Nullable ConfigurableBeanFactory beanFactory) {
      this.configurableBeanFactory = beanFactory;
      this.expressionContext =
            (beanFactory != null ? new BeanExpressionContext(beanFactory, new RequestScope()) : null);
   }
   @Override
   @Nullable
   public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
         NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
      NamedValueInfo namedValueInfo = getNamedValueInfo(parameter);
      MethodParameter nestedParameter = parameter.nestedIfOptional();
      //参数名支持Spl
      Object resolvedName = resolveStringValue(namedValueInfo.name);
      if (resolvedName == null) {
         throw new IllegalArgumentException(
               "Specified name must not resolve to null: [" + namedValueInfo.name + "]");
      }
      //根据参数名提取参数值
      Object arg = resolveName(resolvedName.toString(), nestedParameter, webRequest);
      if (arg == null) {
         //如不能通过webRequest取得参数值使用默认值（看子类创建namedValueInfo的实现方式）
         if (namedValueInfo.defaultValue != null) {
            arg = resolveStringValue(namedValueInfo.defaultValue);
         }
         //如果必填参数值为null通常抛出异常
         else if (namedValueInfo.required && !nestedParameter.isOptional()) {
            handleMissingValue(namedValueInfo.name, nestedParameter, webRequest);
         }
         //如果arg仍然为null,返回类型是Boolean返回false否则抛异常
         arg = handleNullValue(namedValueInfo.name, arg, nestedParameter.getNestedParameterType());
      }
      //空字串使用默认值
      else if ("".equals(arg) && namedValueInfo.defaultValue != null) {
         arg = resolveStringValue(namedValueInfo.defaultValue);
      }
      if (binderFactory != null) {
         WebDataBinder binder = binderFactory.createBinder(webRequest, null, namedValueInfo.name);
         try {
            //通常由字符串转换成复杂对象
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
   //获取给定方法参数的命名值。
   private NamedValueInfo getNamedValueInfo(MethodParameter parameter) {
      NamedValueInfo namedValueInfo = this.namedValueInfoCache.get(parameter);
      if (namedValueInfo == null) {
         namedValueInfo = createNamedValueInfo(parameter);
         namedValueInfo = updateNamedValueInfo(parameter, namedValueInfo);
         this.namedValueInfoCache.put(parameter, namedValueInfo);
      }
      return namedValueInfo;
   }
   //为给定的方法参数创建{@link NamedValueInfo}对象。 
   //实现通常通过MethodParamete.getParameterAnnotation(Class)检索方法注释。
   protected abstract NamedValueInfo createNamedValueInfo(MethodParameter parameter);
   //基于具有已清理值的给定NamedValueInfo创建新的NamedValueInfo。
   private NamedValueInfo updateNamedValueInfo(MethodParameter parameter, NamedValueInfo info) {
      String name = info.name;
      if (info.name.isEmpty()) {
         name = parameter.getParameterName();
         if (name == null) {
            throw new IllegalArgumentException(
                  "Name for argument type [" + parameter.getNestedParameterType().getName() +
                  "] not available, and parameter name information not found in class file either.");
         }
      }
      String defaultValue = (ValueConstants.DEFAULT_NONE.equals(info.defaultValue) ? null : info.defaultValue);
      return new NamedValueInfo(name, info.required, defaultValue);
   }
   //解析给定的注释指定值，可能包含占位符和表达式。
   @Nullable
   private Object resolveStringValue(String value) {
      if (this.configurableBeanFactory == null) {
         return value;
      }
      String placeholdersResolved = this.configurableBeanFactory.resolveEmbeddedValue(value);
      BeanExpressionResolver exprResolver = this.configurableBeanFactory.getBeanExpressionResolver();
      if (exprResolver == null || this.expressionContext == null) {
         return value;
      }
      return exprResolver.evaluate(placeholdersResolved, this.expressionContext);
   }
   //将给定的参数类型和值名称解析为参数值。
   @Nullable
   protected abstract Object resolveName(String name, MethodParameter parameter, NativeWebRequest request)
         throws Exception;
   //在需要命名值时调用，但resolveName(String,MethodParameter,NativeWebRequest)返回null并且没有默认值。 
   //在这种情况下，子类通常会抛出异常。
   protected void handleMissingValue(String name, MethodParameter parameter, NativeWebRequest request)
         throws Exception {
      handleMissingValue(name, parameter);
   }
   //在需要命名值时调用，但resolveName(String,MethodParameter,NativeWebRequest)返回null并且没有默认值。 
   //在这种情况下，子类通常会抛出异常。
   protected void handleMissingValue(String name, MethodParameter parameter) throws ServletException {
      throw new ServletRequestBindingException("Missing argument '" + name +
            "' for method parameter of type " + parameter.getNestedParameterType().getSimpleName());
   }
   @Nullable
   private Object handleNullValue(String name, @Nullable Object value, Class<?> paramType) {
      if (value == null) {
         if (Boolean.TYPE.equals(paramType)) {
            return Boolean.FALSE;
         }
         else if (paramType.isPrimitive()) {
            throw new IllegalStateException("Optional " + paramType.getSimpleName() + " parameter '" + name +
                  "' is present but cannot be translated into a null value due to being declared as a " +
                  "primitive type. Consider declaring it as object wrapper for the corresponding primitive type.");
         }
      }
      return value;
   }
   //在解析值后调用。
   protected void handleResolvedValue(@Nullable Object arg, String name, MethodParameter parameter,
         @Nullable ModelAndViewContainer mavContainer, NativeWebRequest webRequest) {
   }
   //表示有关命名值的信息，包括名称，是否需要以及默认值。
   protected static class NamedValueInfo {
      private final String name;
      private final boolean required;
      @Nullable
      private final String defaultValue;
      public NamedValueInfo(String name, boolean required, @Nullable String defaultValue) {
         this.name = name;
         this.required = required;
         this.defaultValue = defaultValue;
      }
   }
}
```

### 3.2、RequestParamMethodArgumentResolver

RequestParamMethodArgumentResolver解析使用@RequestParam注释的方法参数、类型为MultipartFile的参数、以及Spring的 MultipartResolver抽象、以及类型为javax.servlet.http.Part的参数、以及Servlet 3.0 multipart请求。此解析程序也可以在默认解析模式下创建，其中未使用@RequestParam注释的简单类型（int，long等）也被视为请求参数，参数名称派生自参数名称。如果方法参数类型为Map，则注释中指定的名称用于解析请求参数String值。然后，假设已经注册了合适的Converter或PropertyEditor，则通过类型转换将该值转换为Map。或者，如果未指定请求参数名称，则使用RequestParamMapMethodArgumentResolver来提供对Map形式的所有请求参数的访问。调用WebDataBinder以将类型转换应用于尚未与方法参数类型匹配的已解析请求标头值。

```java
public class RequestParamMethodArgumentResolver extends AbstractNamedValueMethodArgumentResolver
      implements UriComponentsContributor {
   private static final TypeDescriptor STRING_TYPE_DESCRIPTOR = TypeDescriptor.valueOf(String.class);
   private final boolean useDefaultResolution;
   //useDefaultResolution在默认解析模式下，一个简单类型的方法参数（如BeanUtils.isSimpleProperty}中所定义）被视为请求参数，
   //即使它未注释，请求参数名称也是从方法参数名称派生的
   public RequestParamMethodArgumentResolver(boolean useDefaultResolution) {
      this.useDefaultResolution = useDefaultResolution;
   }
   public RequestParamMethodArgumentResolver(@Nullable ConfigurableBeanFactory beanFactory,
         boolean useDefaultResolution) {
      super(beanFactory);
      this.useDefaultResolution = useDefaultResolution;
   }
   //支持以下内容：
   //@RequestParam注释方法参数。 这排除了Map参数，其中注释未指定名称。 有关此类参数，请参阅RequestParamMapMethodArgumentResolver
   //类型为MultipartFile的参数，除非使用@RequestPart进行注释。
   //Part类型的参数，除非使用@RequestPart进行注释。
   //在默认解析模式下，简单类型参数即使不与@RequestParam一起使用。
   @Override
   public boolean supportsParameter(MethodParameter parameter) {
      if (parameter.hasParameterAnnotation(RequestParam.class)) {
         if (Map.class.isAssignableFrom(parameter.nestedIfOptional().getNestedParameterType())) {
            RequestParam requestParam = parameter.getParameterAnnotation(RequestParam.class);
            return (requestParam != null && StringUtils.hasText(requestParam.name()));
         }
         else {
            return true;
         }
      }
      else {
         if (parameter.hasParameterAnnotation(RequestPart.class)) {
            return false;
         }
         parameter = parameter.nestedIfOptional();
         if (MultipartResolutionDelegate.isMultipartArgument(parameter)) {
            return true;
         }
         else if (this.useDefaultResolution) {
            return BeanUtils.isSimpleProperty(parameter.getNestedParameterType());
         }
         else {
            return false;
         }
      }
   }
   @Override
   protected NamedValueInfo createNamedValueInfo(MethodParameter parameter) {
      RequestParam ann = parameter.getParameterAnnotation(RequestParam.class);
      return (ann != null ? new RequestParamNamedValueInfo(ann) : new RequestParamNamedValueInfo());
   }
   @Override
   @Nullable
   protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
      HttpServletRequest servletRequest = request.getNativeRequest(HttpServletRequest.class);
      if (servletRequest != null) {
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
         String[] paramValues = request.getParameterValues(name);
         if (paramValues != null) {
            arg = (paramValues.length == 1 ? paramValues[0] : paramValues);
         }
      }
      return arg;
   }
   @Override
   protected void handleMissingValue(String name, MethodParameter parameter, NativeWebRequest request)
         throws Exception {
      HttpServletRequest servletRequest = request.getNativeRequest(HttpServletRequest.class);
      if (MultipartResolutionDelegate.isMultipartArgument(parameter)) {
         if (servletRequest == null || !MultipartResolutionDelegate.isMultipartRequest(servletRequest)) {
            throw new MultipartException("Current request is not a multipart request");
         }
         else {
            throw new MissingServletRequestPartException(name);
         }
      }
      else {
         throw new MissingServletRequestParameterException(name,
               parameter.getNestedParameterType().getSimpleName());
      }
   }
   @Override
   public void contributeMethodArgument(MethodParameter parameter, @Nullable Object value,
         UriComponentsBuilder builder, Map<String, Object> uriVariables, ConversionService conversionService) {
      Class<?> paramType = parameter.getNestedParameterType();
      if (Map.class.isAssignableFrom(paramType) || MultipartFile.class == paramType || Part.class == paramType) {
         return;
      }
      RequestParam requestParam = parameter.getParameterAnnotation(RequestParam.class);
      String name = (requestParam == null || StringUtils.isEmpty(requestParam.name()) ?
            parameter.getParameterName() : requestParam.name());
      Assert.state(name != null, "Unresolvable parameter name");
      if (value == null) {
         if (requestParam != null &&
               (!requestParam.required() || !requestParam.defaultValue().equals(ValueConstants.DEFAULT_NONE))) {
            return;
         }
         builder.queryParam(name);
      }
      else if (value instanceof Collection) {
         for (Object element : (Collection<?>) value) {
            element = formatUriValue(conversionService, TypeDescriptor.nested(parameter, 1), element);
            builder.queryParam(name, element);
         }
      }
      else {
         builder.queryParam(name, formatUriValue(conversionService, new TypeDescriptor(parameter), value));
      }
   }
   @Nullable
   protected String formatUriValue(
         @Nullable ConversionService cs, @Nullable TypeDescriptor sourceType, @Nullable Object value) {
      if (value == null) {
         return null;
      }
      else if (value instanceof String) {
         return (String) value;
      }
      else if (cs != null) {
         return (String) cs.convert(value, sourceType, STRING_TYPE_DESCRIPTOR);
      }
      else {
         return value.toString();
      }
   }
   private static class RequestParamNamedValueInfo extends NamedValueInfo {
      public RequestParamNamedValueInfo() {
         super("", false, ValueConstants.DEFAULT_NONE);
      }
      public RequestParamNamedValueInfo(RequestParam annotation) {
         super(annotation.name(), annotation.required(), annotation.defaultValue());
      }
   }
}
```
