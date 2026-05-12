# 35、Spring源码分析 - 35-Spring MVC设计原理
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/35.html
- 分类：J2EE框架
- 分组：教程目录
## 1、Spring MVC 请求处理流程概述

DispatcherServlet是SpringMVC 中的前端控制器(Front Controller)，负责接Request并将Request委托特殊bean处理请求并呈现适当的响应。

Bean类型
描述

`HandlerMapping`

将请求映射到处理程序以及用于预处理和后处理的拦截器列表。映射基于某些标准，其细节因HandlerMapping实现而异。

两个主要的HandlerMapping实现是RequestMappingHandlerMapping（它支持@RequestMapping带注释的方法）和SimpleUrlHandlerMapping（它维护对处理程序的URI路径模式的显式注册）。

`HandlerAdapter`

无论实际调用处理程序如何，都可以帮助DispatcherServlet调用映射到请求的处理程序。例如，调用带注释的控制器需要解析注释。 HandlerAdapter的主要目的是保护DispatcherServlet不受此类细节的影响。

[HandlerExceptionResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-exceptionhandlers)

解决异常的策略，可能将它们映射到处理程序，HTML错误视图或其他目标。请参阅 [Exceptions](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-exceptionhandlers).

[ViewResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-viewresolver)

将从处理程序返回的逻辑基于字符串的视图名称解析为用于呈现给响应的实际View。请参阅 [View Resolution](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-viewresolver) 和 [View Technologies](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-view).

[LocaleResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-localeresolver), [LocaleContextResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-timezone)

解析客户端正在使用的区域设置以及可能的时区，以便能够提供国际化视图。请参阅 [Locale](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-localeresolver).

[ThemeResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-themeresolver)

解决Web应用程序可以使用的主题 - 例如，提供个性化布局。见 [Themes](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-themeresolver).

[MultipartResolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-multipart)

在一些多部分解析库的帮助下，解析多部分请求（例如，浏览器表单文件上载）的抽象。请参阅 [Multipart Resolver](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-multipart).

[FlashMapManager](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-flash-attributes)

存储和检索“输入”和“输出”FlashMap，可用于将属性从一个请求传递到另一个请求，通常是通过重定向。请参阅 [Flash Attributes](https://docs.spring.io/spring/docs/current/spring-framework-reference/web.html#mvc-flash-attributes).

以上组件在DispatcherServlet都会初始化，如果没有按照这些组件特定的名字(multipartResolver、localeResolver、themeResolver、handlerMapping、handlerAdapter、handlerExceptionResolver、viewNameTranslator、viewResolver、flashMapManager)注册bean，则会读取spring-webmvc模块下/src/main/resources/org/springframework/web/servlet/DispatcherServlet.properties相应类型的组件作为默认值。

```java
protected void initStrategies(ApplicationContext context) {
   initMultipartResolver(context);
   initLocaleResolver(context);
   initThemeResolver(context);
   initHandlerMappings(context);
   initHandlerAdapters(context);
   initHandlerExceptionResolvers(context);
   initRequestToViewNameTranslator(context);
   initViewResolvers(context);
   initFlashMapManager(context);
}
//为给定的策略接口创建默认策略对象列表。
//默认实现使用“DispatcherServlet.properties”文件（与DispatcherServlet类在同一个包中）来确定类名。 
//它通过上下文的BeanFactory实例化策略对象。
protected <T> List<T> getDefaultStrategies(ApplicationContext context, Class<T> strategyInterface) {
   String key = strategyInterface.getName();
   String value = defaultStrategies.getProperty(key);
   if (value != null) {
      String[] classNames = StringUtils.commaDelimitedListToStringArray(value);
      List<T> strategies = new ArrayList<>(classNames.length);
      for (String className : classNames) {
         try {
            Class<?> clazz = ClassUtils.forName(className, DispatcherServlet.class.getClassLoader());
            Object strategy = createDefaultStrategy(context, clazz);
            strategies.add((T) strategy);
         }
         catch (ClassNotFoundException ex) {
            throw new BeanInitializationException(
                  "Could not find DispatcherServlet's default strategy class [" + className +
                  "] for interface [" + key + "]", ex);
         }
         catch (LinkageError err) {
            throw new BeanInitializationException(
                  "Unresolvable class definition for DispatcherServlet's default strategy class [" +
                  className + "] for interface [" + key + "]", err);
         }
      }
      return strategies;
   }
   else {
      return new LinkedList<>();
   }
}
```

DispatcherServlet.properties

```java
# Default implementation classes for DispatcherServlet's strategy interfaces.
# Used as fallback when no matching beans are found in the DispatcherServlet context.
# Not meant to be customized by application developers.
org.springframework.web.servlet.LocaleResolver=org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver
org.springframework.web.servlet.ThemeResolver=org.springframework.web.servlet.theme.FixedThemeResolver
org.springframework.web.servlet.HandlerMapping=org.springframework.web.servlet.handler.BeanNameUrlHandlerMapping,\
   org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
org.springframework.web.servlet.HandlerAdapter=org.springframework.web.servlet.mvc.HttpRequestHandlerAdapter,\
   org.springframework.web.servlet.mvc.SimpleControllerHandlerAdapter,\
   org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter
org.springframework.web.servlet.HandlerExceptionResolver=org.springframework.web.servlet.mvc.method.annotation.ExceptionHandlerExceptionResolver,\
   org.springframework.web.servlet.mvc.annotation.ResponseStatusExceptionResolver,\
   org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver
org.springframework.web.servlet.RequestToViewNameTranslator=org.springframework.web.servlet.view.DefaultRequestToViewNameTranslator
org.springframework.web.servlet.ViewResolver=org.springframework.web.servlet.view.InternalResourceViewResolver
org.springframework.web.servlet.FlashMapManager=org.springframework.web.servlet.support.SessionFlashMapManager
```

## 2、Spring MVC工作机制

在容器初始化时会建立所有url 和Controller的对应关系，保存到 Map 中。Tomcat启动时会通知Spring 初始化容器(加载 Bean 的定义信息和初始化所有单例 Bean)，然后 SpringMVC 会遍历容器中的 Bean，获取每一个 Controller 中的所有方法访问的 url，然后将 url 和 Controller 保存到一个 Map 中;

这样就可以根据Request 快速定位到Controller，因为最终处理Request 的是Controller 中的方法，Map中只保留了url 和Controller 中的对应关系，所以要根据Request 的url进一步确认Controller中的 Method，这一步工作的原理就是拼接Controller的url(Controller 上@RequestMapping的值)和方法的url(Method上@RequestMapping的值)，与request的url进行匹配，找到匹配的那个方法;确定处理请求的Method后，接下来的任务就是参数绑定，把Request中参数绑定到方法的形式参数上，这一步是整个请求处理过程中最复杂的一个步骤。

## 3、SpringMVC源码分析

我们根据工作机制中三部分来分析SpringMVC 的源代码.。

- 其一，HandlerMapping初始化时建立所有url和Controller类的对应关系(用Map保存);
- 其二，根据请求url 找到对应的Controller，并从Controller中找到处理请求的方法;
- 其三，request 参数绑定到方法的形参，执行方法处理请求，并返回结果视图.

### 3.1、建立Map的关系

我们首先看第一个步骤，也就是建立 Map关系的部分。第一部分的入口类分为两种：

一种是实现AbstractUrlHandlerMapping的HandlerMapping，入口类为ApplicationObjectSupport的setApplicationContext()方法。

一种是实现AbstractHandlerMethodMapping的HandlerMapping，入口类为InitializingBean的afterPropertiesSet()方法。

#### 3.1.1、AbstractUrlHandlerMapping建立所有url和Controller映射过程

setApplicationContext()方法中核心部分就是初始化容器initApplicationContext(context)，AbstractHandlerMapping是继承结构中第一个实现initApplicationContext()方法的，其子类的实现也会使用这个方法的。

```java
@Override
protected void initApplicationContext() throws BeansException {
   //默认什么也不做
   extendInterceptors(this.interceptors);
   //取得容器中所有的MappedInterceptor填充到adaptedInterceptors
   detectMappedInterceptors(this.adaptedInterceptors);
   //将通过setInterceptors()方法传进来的Interceptors填充到adaptedInterceptors
   initInterceptors();
}
```

可以看到AbstractHandlerMapping的initApplicationContext()方法主要是为了初始化Spring MVC的拦截器，下面看子类AbstractDetectingUrlHandlerMapping中重写此方法的实现。

```java
@Override
public void initApplicationContext() throws ApplicationContextException {
   super.initApplicationContext();
   //除了超类的初始化之外，还调用detectHandlers()方法
   detectHandlers();
}
//注册当前ApplicationContext中找到的所有处理程序。
//处理程序的实际URL确定取决于具体的determineUrlsForHandler(String)实现。 
//没有这样的URL可以确定的bean根本不被认为是处理程序。
protected void detectHandlers() throws BeansException {
   ApplicationContext applicationContext = obtainApplicationContext();
   //默认只从Spring MVC的ApplicationContext找出handler
   String[] beanNames = (this.detectHandlersInAncestorContexts ?
         BeanFactoryUtils.beanNamesForTypeIncludingAncestors(applicationContext, Object.class) :
         applicationContext.getBeanNamesForType(Object.class));
   //获取我们可以确定URL的任何bean名称。
   for (String beanName : beanNames) {
      //抽象方法由子类实现
      String[] urls = determineUrlsForHandler(beanName);
      if (!ObjectUtils.isEmpty(urls)) {
         //AbstractUrlHandlerMapping方法，保存url与handler name的映射
         registerHandler(urls, beanName);
      }
   }
   if ((logger.isDebugEnabled() && !getHandlerMap().isEmpty()) || logger.isTraceEnabled()) {
      logger.debug("Detected " + getHandlerMap().size() + " mappings in " + formatMappingName());
   }
}
```

determineUrlsForHandler()方法是抽象方法由子类实现，下面是BeanNameUrlHandlerMapping的实现。

```java
public class BeanNameUrlHandlerMapping extends AbstractDetectingUrlHandlerMapping {
   //检查URL的给定bean的名称和别名，以“/”开头。
   @Override
   protected String[] determineUrlsForHandler(String beanName) {
      List<String> urls = new ArrayList<>();
      if (beanName.startsWith("/")) {
         urls.add(beanName);
      }
      String[] aliases = obtainApplicationContext().getAliases(beanName);
      for (String alias : aliases) {
         if (alias.startsWith("/")) {
            urls.add(alias);
         }
      }
      return StringUtils.toStringArray(urls);
   }
}
```

#### 3.1.2、AbstractHandlerMethodMapping建立所有url和Controller映射过程

afterPropertiesSet()方法中核心部分就是初始化容器initHandlerMethods()。

```java
//在ApplicationContext中扫描bean，检测并注册处理程序方法。
protected void initHandlerMethods() {
   for (String beanName : getCandidateBeanNames()) {
      //"scopedTarget."作用域代理后面的目标bean的Bean名称前缀。 
      //用于从处理程序方法检测中排除这些目标，以支持相应的代理。
      if (!beanName.startsWith(SCOPED_TARGET_NAME_PREFIX)) {
         processCandidateBean(beanName);
      }
   }
   //打印数量
   handlerMethodsInitialized(getHandlerMethods());
}
//确定指定候选bean的类型，如果标识为处理程序类型，则调用detectHandlerMethods()
//此实现通过检查BeanFactory.getType()并使用bean名称调用detectHandlerMethods()来避免bean创建
protected void processCandidateBean(String beanName) {
   Class<?> beanType = null;
   try {
      beanType = obtainApplicationContext().getType(beanName);
   }
   catch (Throwable ex) {
      // An unresolvable bean type, probably from a lazy bean - let's ignore it.
      if (logger.isTraceEnabled()) {
         logger.trace("Could not resolve type for bean '" + beanName + "'", ex);
      }
   }
   //由子类实现isHandler()，决定此类型是否可以作为handler
   if (beanType != null && isHandler(beanType)) {
      //检测HandlerMethod
      detectHandlerMethods(beanName);
   }
}
//在指定的处理程序bean中查找处理程序方法
protected void detectHandlerMethods(Object handler) {
   Class<?> handlerType = (handler instanceof String ?
         obtainApplicationContext().getType((String) handler) : handler.getClass());
   if (handlerType != null) {
      Class<?> userType = ClassUtils.getUserClass(handlerType);
      Map<Method, T> methods = MethodIntrospector.selectMethods(userType,
            (MethodIntrospector.MetadataLookup<T>) method -> {
               try {
                  // 找到被@RequestMapping注解的方法来创建RequestMappingInfo
                  return getMappingForMethod(method, userType);
               }
               catch (Throwable ex) {
                  throw new IllegalStateException("Invalid mapping on handler class [" +
                        userType.getName() + "]: " + method, ex);
               }
            });
      if (logger.isTraceEnabled()) {
         logger.trace(formatMappings(userType, methods));
      }
      methods.forEach((method, mapping) -> {
         Method invocableMethod = AopUtils.selectInvocableMethod(method, userType);
         //使用MappingRegistry存储三者的映射
         //mappingLookup:mapping->handlerMethod
         //urlLookup:url->mapping
         //nameLookup:name->handlerMethod
         //registry:mapping->new MappingRegistration<>(mapping, handlerMethod, directUrls, name)
         registerHandlerMethod(handler, invocableMethod, mapping);
      });
   }
}
```

getMappingForMethod()方法是抽象方法由子类实现，这里看基于@Controller注解实现的RequestMappingHandlerMapping。

```java
//期望处理程序具有类型级@Controller注解或类型级@RequestMapping注解
@Override
protected boolean isHandler(Class<?> beanType) {
   return (AnnotatedElementUtils.hasAnnotation(beanType, Controller.class) ||
         AnnotatedElementUtils.hasAnnotation(beanType, RequestMapping.class));
}
//使用方法和类型级别@RequestMapping注释来创建RequestMappingInfo
@Override
@Nullable
protected RequestMappingInfo getMappingForMethod(Method method, Class<?> handlerType) {
   RequestMappingInfo info = createRequestMappingInfo(method);
   if (info != null) {
      RequestMappingInfo typeInfo = createRequestMappingInfo(handlerType);
      if (typeInfo != null) {
         //类级别的@RequestMapping和方法级别@RequestMapping确定一个RequestMappingInfo
         info = typeInfo.combine(info);
      }
      //这里还可以使用setPathPrefixes()方法，使RequestMappingHandlerMapping处理不同的请求前缀
      String prefix = getPathPrefix(handlerType);
      if (prefix != null) {
         info = RequestMappingInfo.paths(prefix).build().combine(info);
      }
   }
   return info;
}
```

createRequestMappingInfo()方法就是将@RequestMapping注解的属性封装到RequestMappingInfo中对应的XXXRequestCondition中，待到通过请求Request获取handler时会使用通过mappingRegistry注册的RequestMappingInfo中的这些XXXRequestCondition来过滤，直到可以返回一个非空的代表此RequestMappingInfo对应的handler可以处理次请求。

```java
protected RequestMappingInfo createRequestMappingInfo(
      RequestMapping requestMapping, @Nullable RequestCondition<?> customCondition) {
   RequestMappingInfo.Builder builder = RequestMappingInfo
         .paths(resolveEmbeddedValuesInPatterns(requestMapping.path()))
         .methods(requestMapping.method())
         .params(requestMapping.params())
         .headers(requestMapping.headers())
         .consumes(requestMapping.consumes())
         .produces(requestMapping.produces())
         .mappingName(requestMapping.name());
   if (customCondition != null) {
      builder.customCondition(customCondition);
   }
   return builder.options(this.config).build();
}
public RequestMappingInfo build() {
   ContentNegotiationManager manager = this.options.getContentNegotiationManager();
   PatternsRequestCondition patternsCondition = new PatternsRequestCondition(
         this.paths, this.options.getUrlPathHelper(), this.options.getPathMatcher(),
         this.options.useSuffixPatternMatch(), this.options.useTrailingSlashMatch(),
         this.options.getFileExtensions());
   return new RequestMappingInfo(this.mappingName, patternsCondition,
         new RequestMethodsRequestCondition(this.methods),
         new ParamsRequestCondition(this.params),
         new HeadersRequestCondition(this.headers),
         new ConsumesRequestCondition(this.consumes, this.headers),
         new ProducesRequestCondition(this.produces, this.headers, manager),
         this.customCondition);
}
```

### 3.2、找出处理请求的Handler以及处理方法

这个步骤的触发是由HTTP请求触发的，所以入口为DispatcherServlet的核心方法doService()，doService()中的核心逻辑由doDispatch()实现，我们查看doDispatch()的源代码。

```java
//处理实际调度到处理程序。
//处理程序将通过按顺序应用servlet的HandlerMappings来获得。
//将通过查询servlet安装的HandlerAdapter来获取HandlerAdapter，以找到支持处理程序类的第一个。
//所有HTTP方法都由此方法处理。 由HandlerAdapters或处理程序自行决定哪些方法可以接受。
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
   HttpServletRequest processedRequest = request;
   HandlerExecutionChain mappedHandler = null;
   boolean multipartRequestParsed = false;
   WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
   try {
      ModelAndView mv = null;
      Exception dispatchException = null;
      try {
         //检查是否是文件上传的请求
         processedRequest = checkMultipart(request);
         multipartRequestParsed = (processedRequest != request);
         //确定当前请求的Handler
         //第一个步骤的意义就在这里体现了.这里并不是直接返回Controller,
         //而是返回的HandlerExecutionChain请求处理器链对象,
         //该对象封装了handler 和 interceptors.
         mappedHandler = getHandler(processedRequest);
         //如果 handler 为空,则返回 404
         if (mappedHandler == null) {
            noHandlerFound(processedRequest, response);
            return;
         }
         //确定当前请求的处理程序适配器。
         HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
         // Process last-modified header, if supported by the handler.
         String method = request.getMethod();
         boolean isGet = "GET".equals(method);
         if (isGet || "HEAD".equals(method)) {
            long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
            if (new ServletWebRequest(request, response).checkNotModified(lastModified) && isGet) {
               return;
            }
         }
         if (!mappedHandler.applyPreHandle(processedRequest, response)) {
            return;
         }
         //实际的处理器处理请求,返回结果视图对象
         mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
         if (asyncManager.isConcurrentHandlingStarted()) {
            return;
         }
         //结果视图对象的处理
         applyDefaultViewName(processedRequest, mv);
         mappedHandler.applyPostHandle(processedRequest, response, mv);
      }
      catch (Exception ex) {
         dispatchException = ex;
      }
      catch (Throwable err) {
         //从4.3开始，我们处理从处理程序方法抛出的错误，使它们可用于@ExceptionHandler方法和其他方案
         dispatchException = new NestedServletException("Handler dispatch failed", err);
      }
      //处理异常过返回结果
      processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
   }
   catch (Exception ex) {
      triggerAfterCompletion(processedRequest, response, mappedHandler, ex);
   }
   catch (Throwable err) {
      triggerAfterCompletion(processedRequest, response, mappedHandler,
            new NestedServletException("Handler processing failed", err));
   }
   finally {
      if (asyncManager.isConcurrentHandlingStarted()) {
         //请求成功响应之后的方法
         if (mappedHandler != null) {
            mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);
         }
      }
      else {
         // Clean up any resources used by a multipart request.
         if (multipartRequestParsed) {
            cleanupMultipart(processedRequest);
         }
      }
   }
}
```

getHandler(processedRequest)方法实际上就是从HandlerMapping中找到url和Controller的对应关系。这也就是第一个步骤:建立 Map的意义。我们知道，最终处理Request的是Controller中的方法，我们现在只是知道了Controller，还要进一步确认Controller中处理Request的方法。

```java
//返回此请求的HandlerExecutionChain。按顺序尝试所有处理程序映射。
@Nullable
protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
   if (this.handlerMappings != null) {
      for (HandlerMapping mapping : this.handlerMappings) {
         HandlerExecutionChain handler = mapping.getHandler(request);
         if (handler != null) {
            return handler;
         }
      }
   }
   return null;
}
```

AbstractHandlerMapping实现了getHandler()方法，这是一个模板方法，具体获取handler的过程交由其子类的getHandlerInternal()方法实现。

```java
//查找给定请求的处理程序，如果找不到特定的请求，则返回默认处理程序
@Override
@Nullable
public final HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
   //由具体的HandlerMapping负责从第一部注册的Map中查找Controller
   Object handler = getHandlerInternal(request);
   if (handler == null) {
      handler = getDefaultHandler();
   }
   if (handler == null) {
      return null;
   }
   // 如果是bean name则取出bean
   if (handler instanceof String) {
      String handlerName = (String) handler;
      handler = obtainApplicationContext().getBean(handlerName);
   }
   //组拼handler和interceptors
   HandlerExecutionChain executionChain = getHandlerExecutionChain(handler, request);
   if (logger.isTraceEnabled()) {
      logger.trace("Mapped to " + handler);
   }
   else if (logger.isDebugEnabled() && !request.getDispatcherType().equals(DispatcherType.ASYNC)) {
      logger.debug("Mapped to " + executionChain.getHandler());
   }
   //处理cors请求
   if (CorsUtils.isCorsRequest(request)) {
      CorsConfiguration globalConfig = this.corsConfigurationSource.getCorsConfiguration(request);
      CorsConfiguration handlerConfig = getCorsConfiguration(handler, request);
      CorsConfiguration config = (globalConfig != null ? globalConfig.combine(handlerConfig) : handlerConfig);
      executionChain = getCorsHandlerExecutionChain(request, executionChain, config);
   }
   return executionChain;
}
```

实现getHandlerInternal()方法的HandlerMapping也是AbstractUrlHandlerMapping和AbstractHandlerMethodMapping。

#### 3.2.1、AbstractUrlHandlerMapping查找handler

```java
@Override
@Nullable
protected Object getHandlerInternal(HttpServletRequest request) throws Exception {
   //会尝试先去掉Servlet path和context path
   String lookupPath = getUrlPathHelper().getLookupPathForRequest(request);
   //从map中找出handler，可能是模式匹配
   Object handler = lookupHandler(lookupPath, request);
   if (handler == null) {
      // We need to care for the default handler directly, since we need to
      // expose the PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE for it as well.
      Object rawHandler = null;
      if ("/".equals(lookupPath)) {
         rawHandler = getRootHandler();
      }
      if (rawHandler == null) {
         rawHandler = getDefaultHandler();
      }
      if (rawHandler != null) {
         // Bean name or resolved handler?
         if (rawHandler instanceof String) {
            String handlerName = (String) rawHandler;
            rawHandler = obtainApplicationContext().getBean(handlerName);
         }
         // 空实现
         validateHandler(rawHandler, request);
         handler = buildPathExposingHandler(rawHandler, lookupPath, lookupPath, null);
      }
   }
   return handler;
}
//查找给定URL路径的处理程序实例。
//支持直接匹配，例如 注册的“/test”匹配“/test”，
//以及各种Ant样式模式匹配，例如： 注册的“/t*”匹配“/test”和“/team”。 
//有关详细信息，请参阅AntPathMatcher类。
//寻找最精确的模式，其中最精确的模式被定义为最长的路径模式。
@Nullable
protected Object lookupHandler(String urlPath, HttpServletRequest request) throws Exception {
   // 首先尝试直接匹配  如注册的“/test”匹配“/test"
   Object handler = this.handlerMap.get(urlPath);
   if (handler != null) {
      // Bean name or resolved handler?
      if (handler instanceof String) {
         String handlerName = (String) handler;
         handler = obtainApplicationContext().getBean(handlerName);
      }
      validateHandler(handler, request);
      //使用RequestAttribute暴露HandlerMapping.class.getName() + ".bestMatchingHandler"
      //String BEST_MATCHING_PATTERN_ATTRIBUTE = HandlerMapping.class.getName() + ".bestMatchingPattern"
      //HandlerMapping.class.getName() + ".pathWithinHandlerMapping"
      //HandlerMapping.class.getName() + ".introspectTypeLevelMapping"
      return buildPathExposingHandler(handler, urlPath, urlPath, null);
   }
   // 直接匹配找不到使用Ant样式模式匹配，例如： 注册的“/t*”匹配“/test”和“/team”
   List<String> matchingPatterns = new ArrayList<>();
   for (String registeredPattern : this.handlerMap.keySet()) {
      if (getPathMatcher().match(registeredPattern, urlPath)) {
         matchingPatterns.add(registeredPattern);
      }
      else if (useTrailingSlashMatch()) {
         if (!registeredPattern.endsWith("/") && getPathMatcher().match(registeredPattern + "/", urlPath)) {
            matchingPatterns.add(registeredPattern +"/");
         }
      }
   }
   String bestMatch = null;
   // 比较模式以确定哪种模式应首先匹配，即哪种模式与当前路径最相关
   Comparator<String> patternComparator = getPathMatcher().getPatternComparator(urlPath);
   if (!matchingPatterns.isEmpty()) {
      matchingPatterns.sort(patternComparator);
      if (logger.isTraceEnabled() && matchingPatterns.size() > 1) {
         logger.trace("Matching patterns " + matchingPatterns);
      }
      bestMatch = matchingPatterns.get(0);
   }
   if (bestMatch != null) {
      handler = this.handlerMap.get(bestMatch);
      if (handler == null) {
         if (bestMatch.endsWith("/")) {
            handler = this.handlerMap.get(bestMatch.substring(0, bestMatch.length() - 1));
         }
         if (handler == null) {
            throw new IllegalStateException(
                  "Could not find handler for best pattern match [" + bestMatch + "]");
         }
      }
      // Bean name or resolved handler?
      if (handler instanceof String) {
         String handlerName = (String) handler;
         handler = obtainApplicationContext().getBean(handlerName);
      }
      validateHandler(handler, request);
      // 提取请求路径与模式串匹配的部分，如:
      // '/docs/**\/*.html' and '/docs/cvs/commit.html -> 'cvs/commit.html'
      String pathWithinMapping = getPathMatcher().extractPathWithinPattern(bestMatch, urlPath);
      // 可能存在多个“最佳模式”，让我们确保所有这些都具有正确的URI模板变量
      Map<String, String> uriTemplateVariables = new LinkedHashMap<>();
      for (String matchingPattern : matchingPatterns) {
         if (patternComparator.compare(bestMatch, matchingPattern) == 0) {
            // 提取模板参数变量
            Map<String, String> vars = getPathMatcher().extractUriTemplateVariables(matchingPattern, urlPath);
            Map<String, String> decodedVars = getUrlPathHelper().decodePathVariables(request, vars);
            uriTemplateVariables.putAll(decodedVars);
         }
      }
      if (logger.isTraceEnabled() && uriTemplateVariables.size() > 0) {
         logger.trace("URI variables " + uriTemplateVariables);
      }
      // 将handler封装成HandlerExecutionChain 并暴露在HttpServletRequest的属性中pathWithinMapping和uriTemplateVariables
      return buildPathExposingHandler(handler, bestMatch, pathWithinMapping, uriTemplateVariables);
   }
   // No handler found...
   return null;
}
//默认实现使用特殊拦截器构建HandlerExecutionChain，该拦截器公开path属性和uri模板变量
protected Object buildPathExposingHandler(Object rawHandler, String bestMatchingPattern,
      String pathWithinMapping, @Nullable Map<String, String> uriTemplateVariables) {
   HandlerExecutionChain chain = new HandlerExecutionChain(rawHandler);
   chain.addInterceptor(new PathExposingHandlerInterceptor(bestMatchingPattern, pathWithinMapping));
   if (!CollectionUtils.isEmpty(uriTemplateVariables)) {
      chain.addInterceptor(new UriTemplateVariablesHandlerInterceptor(uriTemplateVariables));
   }
   return chain;
}
```

#### 3.2.1、AbstractHandlerMethodMapping查找handler

```java
@Override
protected HandlerMethod getHandlerInternal(HttpServletRequest request) throws Exception {
   //请求路径
   String lookupPath = getUrlPathHelper().getLookupPathForRequest(request);
   this.mappingRegistry.acquireReadLock();
   try {
      //从mappingRegistry(本质上也是个Map)取得handler
      HandlerMethod handlerMethod = lookupHandlerMethod(lookupPath, request);
      return (handlerMethod != null ? handlerMethod.createWithResolvedBean() : null);
   }
   finally {
      this.mappingRegistry.releaseReadLock();
   }
}
//查找当前请求的最佳匹配处理程序方法。如果找到多个匹配项，则选择最佳匹配项。
@Nullable
protected HandlerMethod lookupHandlerMethod(String lookupPath, HttpServletRequest request) throws Exception {
   List<Match> matches = new ArrayList<>();
   //urlLookup.get(urlPath)->mapping(RequestMappingInfo)
   List<T> directPathMatches = this.mappingRegistry.getMappingsByUrl(lookupPath);
   //如果path属性可以匹配到HttpServletRequest请求路径，添加具有与当前请求相关的条件的（可能是新的）映射到matches
   if (directPathMatches != null) {
      addMatchingMappings(directPathMatches, matches, request);
   }
   if (matches.isEmpty()) {
      // No choice but to go through all mappings...
      //没有精确的url检查此请求映射信息中的所有条件是否与提供的请求匹配,并返回具有针对当前请求定制的条件的潜在新请求映射信息
      addMatchingMappings(this.mappingRegistry.getMappings().keySet(), matches, request);
   }
   // 如果当前请求可以匹配多个RequestMappingInfo，则使用这个mapping的compareTo进行排序
   // 排序优先级：patternsCondition->paramsCondition->headersCondition->consumesCondition->producesCondition->methodsCondition->customConditionHolder
   if (!matches.isEmpty()) {
      Comparator<Match> comparator = new MatchComparator(getMappingComparator(request));
      matches.sort(comparator);
      Match bestMatch = matches.get(0);
      if (matches.size() > 1) {
         if (logger.isTraceEnabled()) {
            logger.trace(matches.size() + " matching mappings: " + matches);
         }
         if (CorsUtils.isPreFlightRequest(request)) {
            return PREFLIGHT_AMBIGUOUS_MATCH;
         }
         Match secondBestMatch = matches.get(1);
         //如果排序的前两个RequestMappingInfo匹配程度一样，则抛出异常
         if (comparator.compare(bestMatch, secondBestMatch) == 0) {
            Method m1 = bestMatch.handlerMethod.getMethod();
            Method m2 = secondBestMatch.handlerMethod.getMethod();
            String uri = request.getRequestURI();
            throw new IllegalStateException(
                  "Ambiguous handler methods mapped for '" + uri + "': {" + m1 + ", " + m2 + "}");
         }
      }
      //暴露最佳的handlerMethod在HttpRequest属性
      request.setAttribute(BEST_MATCHING_HANDLER_ATTRIBUTE, bestMatch.handlerMethod);
      //RequestMappingInfoHandlerMapping#handleMatch
      //在请求中公开URI模板变量，matrix变量和可生成的媒体类型。
      handleMatch(bestMatch.mapping, lookupPath, request);
      return bestMatch.handlerMethod;
   }
   else {
      //再次迭代所有RequestMappingInfo，查看是否至少按URL匹配，并根据不匹配的内容引发异常。
      return handleNoMatch(this.mappingRegistry.getMappings().keySet(), lookupPath, request);
   }
}
```

addMatchingMappings()方法就是3.1.2节提到的使用RequestMappingInfo内部的各种RequestContion来决定此mapping是否可以处理请求。

```java
private void addMatchingMappings(Collection<T> mappings, List<Match> matches, HttpServletRequest request) {
   for (T mapping : mappings) {
      T match = getMatchingMapping(mapping, request);
      if (match != null) {
         matches.add(new Match(match, this.mappingRegistry.getMappings().get(mapping)));
      }
   }
}
```

RequestMappingInfoHandlerMapping#getMatchingMapping()的实现。

```java
//检查给定的RequestMappingInfo是否与当前请求匹配，
//并返回具有与当前请求匹配的条件的（可能是新的）实例 - 例如，使用URL模式的子集。
@Override
protected RequestMappingInfo getMatchingMapping(RequestMappingInfo info, HttpServletRequest request) {
   return info.getMatchingCondition(request);
}
```

RequestMappingInfo#getMatchingCondition()的实现。

```java
//检查此请求映射信息中的所有条件是否与提供的请求匹配，并返回具有针对当前请求定制的条件的潜在新请求映射信息。
//例如，返回的实例可能包含与当前请求匹配的URL模式子集，并在顶部以最佳匹配模式排序。
@Override
@Nullable
public RequestMappingInfo getMatchingCondition(HttpServletRequest request) {
   RequestMethodsRequestCondition methods = this.methodsCondition.getMatchingCondition(request);
   ParamsRequestCondition params = this.paramsCondition.getMatchingCondition(request);
   HeadersRequestCondition headers = this.headersCondition.getMatchingCondition(request);
   ConsumesRequestCondition consumes = this.consumesCondition.getMatchingCondition(request);
   ProducesRequestCondition produces = this.producesCondition.getMatchingCondition(request);
   if (methods == null || params == null || headers == null || consumes == null || produces == null) {
      return null;
   }
   PatternsRequestCondition patterns = this.patternsCondition.getMatchingCondition(request);
   if (patterns == null) {
      return null;
   }
   RequestConditionHolder custom = this.customConditionHolder.getMatchingCondition(request);
   if (custom == null) {
      return null;
   }
   return new RequestMappingInfo(this.name, patterns,
         methods, params, headers, consumes, produces, custom.getCondition());
}
```

### 3.3、使用能处理上一步得到handler的HandlerAdapter调用处理请求的方法，返回结果视图

```java
//返回此处理程序对象的HandlerAdapter
protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
   if (this.handlerAdapters != null) {
      for (HandlerAdapter adapter : this.handlerAdapters) {
         //使用第一个能处理handler的HandlerAdapter
         if (adapter.supports(handler)) {
            return adapter;
         }
      }
   }
   throw new ServletException("No adapter for handler [" + handler +
         "]: The DispatcherServlet configuration needs to include a HandlerAdapter that supports this handler");
}
```

还记得DispatcherServlet.properties中配置的默认HandlerAdapter吗？

#### 3.3.1、HttpRequestHandlerAdapter

HttpRequestHandlerAdapter用于处理HttpRequestHandler类型的handler，如[《Spring远端调用的实现》](/zhuanlan/j2ee/spring/7/33.html)提到的HttpInvokerServiceExporter。

```java
public class HttpRequestHandlerAdapter implements HandlerAdapter {
   @Override
   public boolean supports(Object handler) {
      return (handler instanceof HttpRequestHandler);
   }
   @Override
   @Nullable
   public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
         throws Exception {
      //直接委托给handler处理请求
      ((HttpRequestHandler) handler).handleRequest(request, response);
      return null;
   }
   @Override
   public long getLastModified(HttpServletRequest request, Object handler) {
      if (handler instanceof LastModified) {
         return ((LastModified) handler).getLastModified(request);
      }
      return -1L;
   }
}
```

#### 3.3.2、SimpleControllerHandlerAdapter

通常与SimpleUrlHandlerMapping配合使用，处理实现Controller接口的handler。

```java
public class SimpleControllerHandlerAdapter implements HandlerAdapter {
   @Override
   public boolean supports(Object handler) {
      return (handler instanceof Controller);
   }
   @Override
   @Nullable
   public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
         throws Exception {
      return ((Controller) handler).handleRequest(request, response);
   }
   @Override
   public long getLastModified(HttpServletRequest request, Object handler) {
      if (handler instanceof LastModified) {
         return ((LastModified) handler).getLastModified(request);
      }
      return -1L;
   }
}
```

### 3.4、RequestMappingHandlerAdapter

扩展AbstractHandlerMethodAdapter，支持带@RequestMapping注释的HandlerMethod。可以通过setCustomArgumentResolvers()和setCustomReturnValueHandlers()添加对自定义参数和返回值类型的支持，或者，重新配置所有参数和返回值类型使用setArgumentResolvers()和setReturnValueHandlers()。

RequestMappingHandlerAdapter提供了很多功能，因此也是最复杂的一个HandlerAdapter。

#### 3.4.1、初始化模型绑定、参数解析组件

```java
//准备工作
@Override
public void afterPropertiesSet() {
   // Do this first, it may add ResponseBody advice beans
   initControllerAdviceCache();
   if (this.argumentResolvers == null) {
      //返回Spring内置的参数解析器
      List<HandlerMethodArgumentResolver> resolvers = getDefaultArgumentResolvers();
      this.argumentResolvers = new HandlerMethodArgumentResolverComposite().addResolvers(resolvers);
   }
   if (this.initBinderArgumentResolvers == null) {
      List<HandlerMethodArgumentResolver> resolvers = getDefaultInitBinderArgumentResolvers();
      this.initBinderArgumentResolvers = new HandlerMethodArgumentResolverComposite().addResolvers(resolvers);
   }
   if (this.returnValueHandlers == null) {
      List<HandlerMethodReturnValueHandler> handlers = getDefaultReturnValueHandlers();
      this.returnValueHandlers = new HandlerMethodReturnValueHandlerComposite().addHandlers(handlers);
   }
}
```

afterPropertiesSet()方法是发现@ControllerAdvice类，专门用于声明@ExceptionHandler，@InitBinder或@ModelAttribute方法的类，以便在多个@Controller类之间共享，并且为参数解析、参数绑定、结果转换的解析器提供默认值。这部分较多内容[下篇](/zhuanlan/j2ee/spring/7/36.html)[《Spring MVC参数值的绑定》](/zhuanlan/j2ee/spring/7/36.html)我们再讲。

```java
//使用Map保存@ControllerAdvice类中的@ModelAttribute、@InitBinder方法
//如果@ControllerAdvice实现了RequestBodyAdvice或ResponseBodyAdvice接口，使用List保存此类
private void initControllerAdviceCache() {
   if (getApplicationContext() == null) {
      return;
   }
   //找出容器中所有的@ControllerAdvice类，将bean name和bean factory封装到ControllerAdviceBean
   //ControllerAdviceBean根据@ControllerAdvice的属性计算出来一个HandlerTypePredicate来缩小@ControllerAdvice作用bean的范围
   List<ControllerAdviceBean> adviceBeans = ControllerAdviceBean.findAnnotatedBeans(getApplicationContext());
   AnnotationAwareOrderComparator.sort(adviceBeans);
   List<Object> requestResponseBodyAdviceBeans = new ArrayList<>();
   for (ControllerAdviceBean adviceBean : adviceBeans) {
      Class<?> beanType = adviceBean.getBeanType();
      if (beanType == null) {
         throw new IllegalStateException("Unresolvable type for ControllerAdviceBean: " + adviceBean);
      }
      //选出不是@RequestMapping的但是@ModelAttribute的方法保存在Map modelAttributeAdviceCache
      Set<Method> attrMethods = MethodIntrospector.selectMethods(beanType, MODEL_ATTRIBUTE_METHODS);
      if (!attrMethods.isEmpty()) {
         this.modelAttributeAdviceCache.put(adviceBean, attrMethods);
      }
      //选出不是@RequestMapping的但是@InitBinder的方法保存在Map initBinderAdviceCache中
      Set<Method> binderMethods = MethodIntrospector.selectMethods(beanType, INIT_BINDER_METHODS);
      if (!binderMethods.isEmpty()) {
         this.initBinderAdviceCache.put(adviceBean, binderMethods);
      }
      //如果@ControllerAdvice类实现了RequestBodyAdvice和ResponseBodyAdvice接口保存在容器中
      if (RequestBodyAdvice.class.isAssignableFrom(beanType)) {
         requestResponseBodyAdviceBeans.add(adviceBean);
      }
      if (ResponseBodyAdvice.class.isAssignableFrom(beanType)) {
         requestResponseBodyAdviceBeans.add(adviceBean);
      }
   }
   if (!requestResponseBodyAdviceBeans.isEmpty()) {
      this.requestResponseBodyAdvice.addAll(0, requestResponseBodyAdviceBeans);
   }
   if (logger.isDebugEnabled()) {
      int modelSize = this.modelAttributeAdviceCache.size();
      int binderSize = this.initBinderAdviceCache.size();
      int reqCount = getBodyAdviceCount(RequestBodyAdvice.class);
      int resCount = getBodyAdviceCount(ResponseBodyAdvice.class);
      if (modelSize == 0 && binderSize == 0 && reqCount == 0 && resCount == 0) {
         logger.debug("ControllerAdvice beans: none");
      }
      else {
         logger.debug("ControllerAdvice beans: " + modelSize + " @ModelAttribute, " + binderSize +
               " @InitBinder, " + reqCount + " RequestBodyAdvice, " + resCount + " ResponseBodyAdvice");
      }
   }
}
```

#### 3.4.2、RequestMappingHandlerAdapter能处理的Handler

这里我们关注supports()和handle()方法，这两个方法都是在父类中实现。

```java
@Override
public final boolean supports(Object handler) {
   return (handler instanceof HandlerMethod && supportsInternal((HandlerMethod) handler));
}
//RequestMappingHandlerAdapter默认返回true
protected abstract boolean supportsInternal(HandlerMethod handlerMethod);
@Override
@Nullable
public final ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
   return handleInternal(request, response, (HandlerMethod) handler);
}
```

#### 3.4.3、RequestMappingHandlerAdapter处理Handler的过程

```java
@Override
protected ModelAndView handleInternal(HttpServletRequest request,
      HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
   ModelAndView mav;
   checkRequest(request);
   //如果true，则属同一个session的请求进行同步处理
   if (this.synchronizeOnSession) {
      HttpSession session = request.getSession(false);
      if (session != null) {
         //默认使用当前Session作为同步锁对象，也可以通过设置Session属性WebUtils.SESSION_MUTEX_ATTRIBUTE修改对象
         Object mutex = WebUtils.getSessionMutex(session);
         synchronized (mutex) {
            mav = invokeHandlerMethod(request, response, handlerMethod);
         }
      }
      else {
         // No HttpSession available -> no mutex necessary
         mav = invokeHandlerMethod(request, response, handlerMethod);
      }
   }
   else {
      // No synchronization on session demanded at all...
      mav = invokeHandlerMethod(request, response, handlerMethod);
   }
   if (!response.containsHeader(HEADER_CACHE_CONTROL)) {
      if (getSessionAttributesHandler(handlerMethod).hasSessionAttributes()) {
         applyCacheSeconds(response, this.cacheSecondsForSessionAttributeHandlers);
      }
      else {
         prepareResponse(response);
      }
   }
   return mav;
}
```

支持修改RequestMappingHandlerAdapter的synchronizeOnSession（默认false）属性来控制同一Sesison下的同步执行，在执行完处理请求的方法invokeHandlerMethod，后会判断response中是否包含响应头Cache-Control，如果包含并且handler上@SessionAttributes有设置names或types属性，调用applyCacheSeconds方法应用给定的缓存秒并生成相应的HTTP头，即在正值的情况下允许缓存给定的秒数，如果给定0值则阻止缓存，不执行任何其他操作。

下面主要看处理请求的方法。

```java
//调用@RequestMapping方法，将Model和View封装到ModelAndView
@Nullable
protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
      HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
   ServletWebRequest webRequest = new ServletWebRequest(request, response);
   try {
      //使用全局的(@ControllerAdvice内的)@InitBinder方法和handlerMethod所属类的@InitBinder方法
      //作为构造参数返回一个ServletRequestDataBinderFactory
      WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
      ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);
      //接下来使用createInvocableHandlerMethod()方法将HandlerMethod包装成ServletInvocableHandlerMethod，
      //然后使用前面afterPropertiesSet()方法中实例化的argumentResolvers和returnValueHandlers以及binderFactory、parameterNameDiscoverer初始化它， 
      ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
      if (this.argumentResolvers != null) {
         invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
      }
      if (this.returnValueHandlers != null) {
         invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
      }
      invocableMethod.setDataBinderFactory(binderFactory);
      invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);
      ModelAndViewContainer mavContainer = new ModelAndViewContainer();
      mavContainer.addAllAttributes(RequestContextUtils.getInputFlashMap(request));
      //在控制器方法调用之前协助模型初始化
      modelFactory.initModel(webRequest, mavContainer, invocableMethod);
      mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);
      AsyncWebRequest asyncWebRequest = WebAsyncUtils.createAsyncWebRequest(request, response);
      asyncWebRequest.setTimeout(this.asyncRequestTimeout);
      WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
      asyncManager.setTaskExecutor(this.taskExecutor);
      asyncManager.setAsyncWebRequest(asyncWebRequest);
      asyncManager.registerCallableInterceptors(this.callableInterceptors);
      asyncManager.registerDeferredResultInterceptors(this.deferredResultInterceptors);
      if (asyncManager.hasConcurrentResult()) {
         Object result = asyncManager.getConcurrentResult();
         mavContainer = (ModelAndViewContainer) asyncManager.getConcurrentResultContext()[0];
         asyncManager.clearConcurrentResult();
         LogFormatUtils.traceDebug(logger, traceOn -> {
            String formatted = LogFormatUtils.formatValue(result, !traceOn);
            return "Resume with async result [" + formatted + "]";
         });
         invocableMethod = invocableMethod.wrapConcurrentResult(result);
      }
      invocableMethod.invokeAndHandle(webRequest, mavContainer);
      if (asyncManager.isConcurrentHandlingStarted()) {
         return null;
      }
      return getModelAndView(mavContainer, modelFactory, webRequest);
   }
   finally {
      webRequest.requestCompleted();
   }
}
```

getDataBinderFactory方法使用全局的(@ControllerAdvice内的)@InitBinder方法和handlerMethod所属类的@InitBinder方法作为构造参数binderMethods， 返回一个ServletRequestDataBinderFactory。 在后面[参数绑定](/zhuanlan/j2ee/spring/7/36.html)需要使用WebDataBinder时就会调用binderFactory的createBinder方法，这个方法内部会触发InitBinderDataBinderFactory的initBinder方法使用binderMethods初始化binderFactory返回的WebDataBinder。WebDataBinderFactory、DataBinder和WebDataBinder具体实现请参考[《DataBinder》](/zhuanlan/j2ee/spring/7/8.html)。

```java
//使用全局的(@ControllerAdvice内的)@InitBinder方法和handlerMethod所属类的@InitBinder方法
//作为构造参数返回一个ServletRequestDataBinderFactory
private WebDataBinderFactory getDataBinderFactory(HandlerMethod handlerMethod) throws Exception {
   Class<?> handlerType = handlerMethod.getBeanType();
   Set<Method> methods = this.initBinderCache.get(handlerType);
   //handler中也可以定义@InitBinder方法
   if (methods == null) {
      methods = MethodIntrospector.selectMethods(handlerType, INIT_BINDER_METHODS);
      this.initBinderCache.put(handlerType, methods);
   }
   List<InvocableHandlerMethod> initBinderMethods = new ArrayList<>();
   //全局@InitBinder方法
   this.initBinderAdviceCache.forEach((clazz, methodSet) -> {
      //这个clazz就是ControllerAdviceBean，会使用内部的HandlerTypePredicate用于匹配请求处理组件类型
      if (clazz.isApplicableToBeanType(handlerType)) {
         Object bean = clazz.resolveBean();
         for (Method method : methodSet) {
            initBinderMethods.add(createInitBinderMethod(bean, method));
         }
      }
   });
   for (Method method : methods) {
      Object bean = handlerMethod.getBean();
      initBinderMethods.add(createInitBinderMethod(bean, method));
   }
   //用于创建新InitBinderDataBinderFactory实例的模板方法。
   //默认实现创建ServletRequestDataBinderFactory
   //new ServletRequestDataBinderFactory(binderMethods, getWebBindingInitializer())
   return createDataBinderFactory(initBinderMethods);
}
```

> 从上面代码中看到通过createDataBinderFactory()方法返回了一个ServletRequestDataBinderFactory，这个ServletRequestDataBinderFactory的构造参数除了initBinderMethods还需要一个WebBindingInitializer，那么这个WebBindingInitializer在RequestMappingHandlerAdapter中是何时创建或传入的呢？在第4节给出解答。

getModelFactory()方法使用WebDataBinderFactory和handlerMethod创建一个**ModelFactory**对象，此对象在控制器方法调用之前协助模型初始化，并在调用之后对其进行更新。

```java
private ModelFactory getModelFactory(HandlerMethod handlerMethod, WebDataBinderFactory binderFactory) {
   //用来管理通过@SessionAttributes声明的特定于控制器的会话属性。
   SessionAttributesHandler sessionAttrHandler = getSessionAttributesHandler(handlerMethod);
   Class<?> handlerType = handlerMethod.getBeanType();
   Set<Method> methods = this.modelAttributeCache.get(handlerType);
   if (methods == null) {
      //非@RequestMapping的@ModelAttribute方法
      methods = MethodIntrospector.selectMethods(handlerType, MODEL_ATTRIBUTE_METHODS);
      this.modelAttributeCache.put(handlerType, methods);
   }
   List<InvocableHandlerMethod> attrMethods = new ArrayList<>();
   //先提取@ControllerAdvice的@ModelAttribute方法
   this.modelAttributeAdviceCache.forEach((clazz, methodSet) -> {
      if (clazz.isApplicableToBeanType(handlerType)) {
         Object bean = clazz.resolveBean();
         for (Method method : methodSet) {
            attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
         }
      }
   });
   //然后提取handlerMethod所属类的@ModelAttribute方法
   for (Method method : methods) {
      Object bean = handlerMethod.getBean();
      attrMethods.add(createModelAttributeMethod(binderFactory, bean, method));
   }
   return new ModelFactory(attrMethods, binderFactory, sessionAttrHandler);
}
```

```java
public final class ModelFactory {
   private static final Log logger = LogFactory.getLog(ModelFactory.class);
   private final List<ModelMethod> modelMethods = new ArrayList<>();
   private final WebDataBinderFactory dataBinderFactory;
   private final SessionAttributesHandler sessionAttributesHandler;
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
}
```

在初始化时(initModel方法)，模型将使用临时存储在会话中的属性以及@ModelAttribute方法的调用进行填充。

initModel()方法需要三个参数：当前Request请求、具有要初始化的模型的容器、模型初始化的方法。

```java
//按以下顺序填充模型：
//检索“已知”的会话属性作为@SessionAttributes列表
//调用@ModelAttribute方法
//查找@ModelAttribute方法参数，这些参数也被作为@SessionAttributes类表，并确保它们出现在模型中，如有必要，会引发异常。
public void initModel(NativeWebRequest request, ModelAndViewContainer container, HandlerMethod handlerMethod)
      throws Exception {
   //在Session中查找@SessionAttributes的value属性指定的属性
   Map<String, ?> sessionAttributes = this.sessionAttributesHandler.retrieveAttributes(request);
   //放入ModelAndViewContainer供view层使用
   container.mergeAttributes(sessionAttributes);
   //执行@ModelAttribute方法，方法参数从container中提取，并将返回值作为新的container属性，属性的可以按以下顺序决定：
   //方法上面@ModelAttribute的name属性
   //声明的返回类型，如果它比Object更具体
   //实际的返回值类型
   invokeModelAttributeMethods(request, container);
   //@ModelAttribute也可应用在handlerMethod方法参数上
   for (String name : findSessionAttributeArguments(handlerMethod)) {
      if (!container.containsAttribute(name)) {
         Object value = this.sessionAttributesHandler.retrieveAttribute(request, name);
         if (value == null) {
            throw new HttpSessionRequiredException("Expected session attribute '" + name + "'", name);
         }
         container.addAttribute(name, value);
      }
   }
}
```

具体@ModelAttribute使用参考[《@ModelAttribute运用详解》](https://www.cnblogs.com/jin-zhe/p/8241368.html)。

在更新模型上(updateModel方法)，属性与会话同步，如果属性缺失，缺失信息还会添加到BindingResult属性。关于BindingResult请参考[/zhuanlan/j2ee/spring/7/8.html](/zhuanlan/j2ee/spring/7/8.html)。

```java
//将列为@SessionAttributes的模型属性提升为会话。必要时添加BindingResult属性。
public void updateModel(NativeWebRequest request, ModelAndViewContainer container) throws Exception {
   ModelMap defaultModel = container.getDefaultModel();
   if (container.getSessionStatus().isComplete()){
      this.sessionAttributesHandler.cleanupAttributes(request);
   }
   else {
      this.sessionAttributesHandler.storeAttributes(request, defaultModel);
   }
   if (!container.isRequestHandled() && container.getModel() == defaultModel) {
      //将BindingResult属性添加到需要它的属性的模型中。
      updateBindingResult(request, defaultModel);
   }
}
private void updateBindingResult(NativeWebRequest request, ModelMap model) throws Exception {
   List<String> keyNames = new ArrayList<>(model.keySet());
   for (String name : keyNames) {
      Object value = model.get(name);
      if (value != null && isBindingCandidate(name, value)) {
         String bindingResultKey = BindingResult.MODEL_KEY_PREFIX + name;
         if (!model.containsAttribute(bindingResultKey)) {
            WebDataBinder dataBinder = this.dataBinderFactory.createBinder(request, value, name);
            model.put(bindingResultKey, dataBinder.getBindingResult());
         }
      }
   }
}
```

在执行初始化模型方法之后更新模型方法之前会调用HandlerMethod的invokeAndHandle()方法，而这个方法的内部就是调用我们自定义的handler的方法了。

```java
//调用该方法并通过HandlerMethodReturnValueHandlers其中一个配置的HandlerMethodReturnValueHandler处理返回值
public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,
      Object... providedArgs) throws Exception {
   //完成webRequest到handler方法参数的数据绑定后调用方法
   Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);
   setResponseStatus(webRequest);
   if (returnValue == null) {
      if (isRequestNotModified(webRequest) || getResponseStatus() != null || mavContainer.isRequestHandled()) {
         mavContainer.setRequestHandled(true);
         return;
      }
   }
   else if (StringUtils.hasText(getResponseStatusReason())) {
      mavContainer.setRequestHandled(true);
      return;
   }
   //true代表已在处理器方法完成请求的处理，后续不再返回ModelAndView
   mavContainer.setRequestHandled(false);
   Assert.state(this.returnValueHandlers != null, "No return value handlers");
   try {
      //使用returnValueHandlers其中一个returnValueHandler解析返回结果并通过向模型添加属性并设置视图
      this.returnValueHandlers.handleReturnValue(
            returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
   }
   catch (Exception ex) {
      if (logger.isTraceEnabled()) {
         logger.trace(formatErrorForReturnValue(returnValue), ex);
      }
      throw ex;
   }
}
//在给定请求的上下文中解析其参数值后调用该方法
@Nullable
public Object invokeForRequest(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
      Object... providedArgs) throws Exception {
   Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);
   if (logger.isTraceEnabled()) {
      logger.trace("Arguments: " + Arrays.toString(args));
   }
   //调用我们定义的handler方法
   return doInvoke(args);
}
//获取当前请求的方法参数值，检查提供的参数值并回退到配置的参数解析器。
//生成的数组将传递到doInvoke()方法。
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
      //根据方法参数选取一个HandlerMethodArgumentResolver
      if (!this.resolvers.supportsParameter(parameter)) {
         throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));
      }
      try {
         //参数绑定既可以从request获取也可以从mavContainer中获取(如HttpStatus)，取决于HandlerMethodArgumentResolver
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

### 3.5、控制器方法返回结果或异常的处理

```java
private void processDispatchResult(HttpServletRequest request, HttpServletResponse response,
      @Nullable HandlerExecutionChain mappedHandler, @Nullable ModelAndView mv,
      @Nullable Exception exception) throws Exception {
   boolean errorView = false;
   if (exception != null) {
      //没有异常直接返回mv
      if (exception instanceof ModelAndViewDefiningException) {
         logger.debug("ModelAndViewDefiningException encountered", exception);
         mv = ((ModelAndViewDefiningException) exception).getModelAndView();
      }
      else {
         Object handler = (mappedHandler != null ? mappedHandler.getHandler() : null);
         //使用异常处理器处理异常
         mv = processHandlerException(request, response, handler, exception);
         errorView = (mv != null);
      }
   }
   // Did the handler return a view to render?
   if (mv != null && !mv.wasCleared()) {
      render(mv, request, response);
      if (errorView) {
         WebUtils.clearErrorRequestAttributes(request);
      }
   }
   else {
      if (logger.isTraceEnabled()) {
         logger.trace("No view rendering, null ModelAndView returned.");
      }
   }
   if (WebAsyncUtils.getAsyncManager(request).isConcurrentHandlingStarted()) {
      // Concurrent handling started during a forward
      return;
   }
   if (mappedHandler != null) {
      mappedHandler.triggerAfterCompletion(request, response, null);
   }
}
```

## 4、配置Spring MVC

原来Spring为我们提供了一个类WebMvcConfigurationSupport，这个类中默认会定义Spring MVC需要的一些组件，如RequestMappingHandlerAdapter。

```java
@Bean
public RequestMappingHandlerAdapter requestMappingHandlerAdapter() {
   RequestMappingHandlerAdapter adapter = createRequestMappingHandlerAdapter();
   adapter.setContentNegotiationManager(mvcContentNegotiationManager());
   adapter.setMessageConverters(getMessageConverters());
   //getConfigurableWebBindingInitializer()是一个提供WebBindingInitializer的钩子
   adapter.setWebBindingInitializer(getConfigurableWebBindingInitializer());
   adapter.setCustomArgumentResolvers(getArgumentResolvers());
   adapter.setCustomReturnValueHandlers(getReturnValueHandlers());
   if (jackson2Present) {
      adapter.setRequestBodyAdvice(Collections.singletonList(new JsonViewRequestBodyAdvice()));
      adapter.setResponseBodyAdvice(Collections.singletonList(new JsonViewResponseBodyAdvice()));
   }
   AsyncSupportConfigurer configurer = new AsyncSupportConfigurer();
   configureAsyncSupport(configurer);
   if (configurer.getTaskExecutor() != null) {
      adapter.setTaskExecutor(configurer.getTaskExecutor());
   }
   if (configurer.getTimeout() != null) {
      adapter.setAsyncRequestTimeout(configurer.getTimeout());
   }
   adapter.setCallableInterceptors(configurer.getCallableInterceptors());
   adapter.setDeferredResultInterceptors(configurer.getDeferredResultInterceptors());
   return adapter;
}
```

就是在@Bean方法requestMappingHandlerAdapter()中，会使用getConfigurableWebBindingInitializer()返回的WebBindingInitializer来配置RequestMappingHandlerAdapter。

```java
protected ConfigurableWebBindingInitializer getConfigurableWebBindingInitializer() {
   ConfigurableWebBindingInitializer initializer = new ConfigurableWebBindingInitializer();
   initializer.setConversionService(mvcConversionService());
   initializer.setValidator(mvcValidator());
   MessageCodesResolver messageCodesResolver = getMessageCodesResolver();
   if (messageCodesResolver != null) {
      initializer.setMessageCodesResolver(messageCodesResolver);
   }
   return initializer;
}
```

其实这个类还提供了很多protected的空实现方法如：

```java
protected void addFormatters(FormatterRegistry registry) {}
```

子类重写此方法以将自定义Converter或Formatter委托添加到公共FormattingConversionService中也就是上面的mvcConversionService()方法返回的FormattingConversionService。Spring中DelegatingWebMvcConfiguration默认继承于WebMvcConfigurationSupport并重写了这些空protected方法，它还提供了一个@Autowired方法setConfigurers()，接收一个List类型参数，就是通过重写这些空protected方法中使用了这个WebMvcConfigurer参数达到配置WebMvcConfigurationSupport中通过@Bean定义的bean。

想要使用这种方式来配置我们的Spring MVC组件可以启用@EnableWebMvc，因为它会导入DelegatingWebMvcConfiguration。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(DelegatingWebMvcConfiguration.class)
public @interface EnableWebMvc {
}
```
