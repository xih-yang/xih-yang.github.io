# 37、Spring源码分析 - 37-Spring MVC的异常处理
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/37.html
- 分类：J2EE框架
- 分组：教程目录
在Spring MVC中处理HTTP请求时如果抛出异常会使用DispatcherServlet#processHandlerException()处理，这个方法内部使用Spring MVC默认的注册的HandlerExceptionResolver进行处理。

```java
@Nullable
protected ModelAndView processHandlerException(HttpServletRequest request, HttpServletResponse response,
      @Nullable Object handler, Exception ex) throws Exception {
   // Success and error responses may use different content types
   request.removeAttribute(HandlerMapping.PRODUCIBLE_MEDIA_TYPES_ATTRIBUTE);
   // Check registered HandlerExceptionResolvers...
   ModelAndView exMv = null;
   if (this.handlerExceptionResolvers != null) {
      for (HandlerExceptionResolver resolver : this.handlerExceptionResolvers) {
         exMv = resolver.resolveException(request, response, handler, ex);
         if (exMv != null) {
            break;
         }
      }
   }
   if (exMv != null) {
      if (exMv.isEmpty()) {
         request.setAttribute(EXCEPTION_ATTRIBUTE, ex);
         return null;
      }
      // We might still need view name translation for a plain error model...
      if (!exMv.hasView()) {
         String defaultViewName = getDefaultViewName(request);
         if (defaultViewName != null) {
            exMv.setViewName(defaultViewName);
         }
      }
      if (logger.isTraceEnabled()) {
         logger.trace("Using resolved error view: " + exMv, ex);
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Using resolved error view: " + exMv);
      }
      WebUtils.exposeErrorRequestAttributes(request, ex, getServletName());
      return exMv;
   }
   throw ex;
}
```

Spring MVC默认注册了三个HandlerExceptionResolver：

**1、** ExceptionHandlerExceptionResolver；

**2、** ResponseStatusExceptionResolver；

**3、** DefaultHandlerExceptionResolver；

```java
public interface HandlerExceptionResolver {
   //尝试解决在处理程序执行期间抛出的给定异常，返回表示特定错误页面的ModelAndView（如果适用）。
   //返回的ModelAndView可能是empty(ModelAndView.isEmpty())，表示异常已成功解析，但不应呈现任何视图，例如通过设置状态代码。
   @Nullable
   ModelAndView resolveException(
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex);
}
```

## 1、AbstractHandlerExceptionResolver

HandlerExceptionResolver实现的抽象基类。支持设置映射处理程序setMappedHandlers()和setMappedHandlerClasses()，解析器应该应用于并实现Ordered接口。

```java
public abstract class AbstractHandlerExceptionResolver implements HandlerExceptionResolver, Ordered {
   private static final String HEADER_CACHE_CONTROL = "Cache-Control";
   /** Logger available to subclasses. */
   protected final Log logger = LogFactory.getLog(getClass());
   private int order = Ordered.LOWEST_PRECEDENCE;
   @Nullable
   private Set<?> mappedHandlers;
   @Nullable
   private Class<?>[] mappedHandlerClasses;
   @Nullable
   private Log warnLogger;
   private boolean preventResponseCaching = false;
   public void setOrder(int order) {
      this.order = order;
   }
   @Override
   public int getOrder() {
      return this.order;
   }
   //指定此异常解析程序应应用于的处理程序集合。异常映射和默认错误视图仅适用于指定的处理程序。
   //如果未设置处理程序或处理程序类，则异常映射和默认错误视图将应用于所有处理程序。 
   //这意味着指定的默认错误视图将用作所有异常的回退; 在这种情况下，链中的任何其他HandlerExceptionResolvers都将被忽略。
   public void setMappedHandlers(Set<?> mappedHandlers) {
      this.mappedHandlers = mappedHandlers;
   }
   //指定此异常解析程序应应用于的类集合。
   //异常映射和缺省错误视图仅适用于指定类型的处理程序; 指定的类型也可以是处理程序的接口或超类。
   //如果未设置处理程序或处理程序类，则异常映射和默认错误视图将应用于所有处理程序。 
   //这意味着指定的默认错误视图将用作所有异常的回退; 在这种情况下，链中的任何其他HandlerExceptionResolvers都将被忽略。
   public void setMappedHandlerClasses(Class<?>... mappedHandlerClasses) {
      this.mappedHandlerClasses = mappedHandlerClasses;
   }
   public void setWarnLogCategory(String loggerName) {
      this.warnLogger = LogFactory.getLog(loggerName);
   }
   //指定是否阻止此异常解析程序解析的任何视图的HTTP响应缓存。
   //默认值为false。 将其切换为true，以便自动生成抑制响应缓存的HTTP响应标头。
   public void setPreventResponseCaching(boolean preventResponseCaching) {
      this.preventResponseCaching = preventResponseCaching;
   }
   //检查是否应该应用此解析程序（即，所提供的处理程序是否与任何已配置的setMappedHandlers处理程序或setMappedHandlerClasses处理程序类匹配），
   //然后委托给doResolveException()模板方法。
   @Override
   @Nullable
   public ModelAndView resolveException(
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
      if (shouldApplyTo(request, handler)) {
         prepareResponse(ex, response);
         ModelAndView result = doResolveException(request, response, handler, ex);
         if (result != null) {
            // Print warn message when warn logger is not enabled...
            if (logger.isDebugEnabled() && (this.warnLogger == null || !this.warnLogger.isWarnEnabled())) {
               logger.debug("Resolved [" + ex + "]" + (result.isEmpty() ? "" : " to " + result));
            }
            // warnLogger with full stack trace (requires explicit config)
            logException(ex, request);
         }
         return result;
      }
      else {
         return null;
      }
   }
   //检查此解析程序是否应该应用于给定的处理程序。
   //默认实现检查配置的#setMappedHandlers处理程序和setMappedHandlerClasses处理程序类，如果有的话
   protected boolean shouldApplyTo(HttpServletRequest request, @Nullable Object handler) {
      if (handler != null) {
         if (this.mappedHandlers != null && this.mappedHandlers.contains(handler)) {
            return true;
         }
         if (this.mappedHandlerClasses != null) {
            for (Class<?> handlerClass : this.mappedHandlerClasses) {
               if (handlerClass.isInstance(handler)) {
                  return true;
               }
            }
         }
      }
      // Else only apply if there are no explicit handler mappings.
      return (this.mappedHandlers == null && this.mappedHandlerClasses == null);
   }
   protected void logException(Exception ex, HttpServletRequest request) {
      if (this.warnLogger != null && this.warnLogger.isWarnEnabled()) {
         this.warnLogger.warn(buildLogMessage(ex, request));
      }
   }
   protected String buildLogMessage(Exception ex, HttpServletRequest request) {
      return "Resolved [" + ex + "]";
   }
   //为特殊情况准备响应。
   //如果setPreventResponseCaching preventResponseCaching属性已设置为”true“，则默认实现会阻止响应被缓存
   protected void prepareResponse(Exception ex, HttpServletResponse response) {
      if (this.preventResponseCaching) {
         preventCaching(response);
      }
   }
   //通过设置相应的HTTP Cache-Control:no-store标头来阻止缓存响应。
   protected void preventCaching(HttpServletResponse response) {
      response.addHeader(HEADER_CACHE_CONTROL, "no-store");
   }
   //实际上解决了在处理程序执行期间抛出的给定异常，如果合适，返回表示特定错误页面的ModelAndView。
   //可以在子类中重写，以便应用特定的异常检查。
   //请注意，在检查此解析是否适用（“mappedHandlers”等）之后将调用此模板方法，因此实现可能只是继续其实际的异常处理。
   @Nullable
   protected abstract ModelAndView doResolveException(
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex);
}
```

## 2、AbstractHandlerMethodExceptionResolver

HandlerExceptionResolver实现的抽象基类，支持处理类型为HandlerMethod的处理程序的异常。

```java
public abstract class AbstractHandlerMethodExceptionResolver extends AbstractHandlerExceptionResolver {
   //检查处理程序是否为HandlerMethod，然后委托shouldApplyTo(HttpServletRequest,Object)
   //的基类实现传递HandlerMethod的bean。 否则返回false。
   @Override
   protected boolean shouldApplyTo(HttpServletRequest request, @Nullable Object handler) {
      if (handler == null) {
         return super.shouldApplyTo(request, null);
      }
      else if (handler instanceof HandlerMethod) {
         HandlerMethod handlerMethod = (HandlerMethod) handler;
         handler = handlerMethod.getBean();
         return super.shouldApplyTo(request, handler);
      }
      else {
         return false;
      }
   }
   @Override
   @Nullable
   protected final ModelAndView doResolveException(
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
      return doResolveHandlerMethodException(request, response, (HandlerMethod) handler, ex);
   }
   //实际上解决了在处理程序执行期间抛出的给定异常，返回表示特定错误页面的ModelAndView（如果适用）。
   //可以在子类中重写，以便应用特定的异常检查。
   //请注意，在检查此解析是否适用（“mappedHandlers”等）之后将调用此模板方法，因此实现可能只是继续其实际的异常处理。
   @Nullable
   protected abstract ModelAndView doResolveHandlerMethodException(
         HttpServletRequest request, HttpServletResponse response, @Nullable HandlerMethod handlerMethod, Exception ex);
}
```

## 3、ExceptionHandlerExceptionResolver

是一个AbstractHandlerMethodExceptionResolver，它通过@ExceptionHandler方法解决异常。可以通过setCustomArgumentResolvers()和setCustomReturnValueHandlers()添加对自定义参数和返回值类型的支持。

或者，重新配置所有参数和返回值类型使用setArgumentResolvers()和setReturnValueHandlers(List)。

```java
@Override
public void afterPropertiesSet() {
   // Do this first, it may add ResponseBodyAdvice beans
   initExceptionHandlerAdviceCache();
   if (this.argumentResolvers == null) {
      List<HandlerMethodArgumentResolver> resolvers = getDefaultArgumentResolvers();
      this.argumentResolvers = new HandlerMethodArgumentResolverComposite().addResolvers(resolvers);
   }
   if (this.returnValueHandlers == null) {
      List<HandlerMethodReturnValueHandler> handlers = getDefaultReturnValueHandlers();
      this.returnValueHandlers = new HandlerMethodReturnValueHandlerComposite().addHandlers(handlers);
   }
}
private void initExceptionHandlerAdviceCache() {
   if (getApplicationContext() == null) {
      return;
   }
   List<ControllerAdviceBean> adviceBeans = ControllerAdviceBean.findAnnotatedBeans(getApplicationContext());
   AnnotationAwareOrderComparator.sort(adviceBeans);
   for (ControllerAdviceBean adviceBean : adviceBeans) {
      Class<?> beanType = adviceBean.getBeanType();
      if (beanType == null) {
         throw new IllegalStateException("Unresolvable type for ControllerAdviceBean: " + adviceBean);
      }
      //可以处理@ExceptionHandler value属性值异常或异常处理方法参数指定的异常
      ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(beanType);
      if (resolver.hasExceptionMappings()) {
         this.exceptionHandlerAdviceCache.put(adviceBean, resolver);
      }
      if (ResponseBodyAdvice.class.isAssignableFrom(beanType)) {
         this.responseBodyAdvice.add(adviceBean);
      }
   }
   if (logger.isDebugEnabled()) {
      int handlerSize = this.exceptionHandlerAdviceCache.size();
      int adviceSize = this.responseBodyAdvice.size();
      if (handlerSize == 0 && adviceSize == 0) {
         logger.debug("ControllerAdvice beans: none");
      }
      else {
         logger.debug("ControllerAdvice beans: " +
               handlerSize + " @ExceptionHandler, " + adviceSize + " ResponseBodyAdvice");
      }
   }
}
//找到@ExceptionHandler方法并调用它来处理引发的异常
@Override
@Nullable
protected ModelAndView doResolveHandlerMethodException(HttpServletRequest request,
      HttpServletResponse response, @Nullable HandlerMethod handlerMethod, Exception exception) {
   ServletInvocableHandlerMethod exceptionHandlerMethod = getExceptionHandlerMethod(handlerMethod, exception);
   if (exceptionHandlerMethod == null) {
      return null;
   }
   if (this.argumentResolvers != null) {
  exceptionHandlerMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
   }
   if (this.returnValueHandlers != null) {  exceptionHandlerMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
   }
   ServletWebRequest webRequest = new ServletWebRequest(request, response);
   ModelAndViewContainer mavContainer = new ModelAndViewContainer();
   try {
      if (logger.isDebugEnabled()) {
         logger.debug("Using @ExceptionHandler " + exceptionHandlerMethod);
      }
      Throwable cause = exception.getCause();
      if (cause != null) {
         // Expose cause as provided argument as well
         exceptionHandlerMethod.invokeAndHandle(webRequest, mavContainer, exception, cause, handlerMethod);
      }
      else {
         // Otherwise, just the given exception as-is
         exceptionHandlerMethod.invokeAndHandle(webRequest, mavContainer, exception, handlerMethod);
      }
   }
   catch (Throwable invocationEx) {
      // Any other than the original exception is unintended here,
      // probably an accident (e.g. failed assertion or the like).
      if (invocationEx != exception && logger.isWarnEnabled()) {
         logger.warn("Failure in @ExceptionHandler " + exceptionHandlerMethod, invocationEx);
      }
      // Continue with default processing of the original exception...
      return null;
   }
   if (mavContainer.isRequestHandled()) {
      return new ModelAndView();
   }
   else {
      ModelMap model = mavContainer.getModel();
      HttpStatus status = mavContainer.getStatus();
      ModelAndView mav = new ModelAndView(mavContainer.getViewName(), model, status);
      mav.setViewName(mavContainer.getViewName());
      if (!mavContainer.isViewReference()) {
         mav.setView((View) mavContainer.getView());
      }
      if (model instanceof RedirectAttributes) {
         Map<String, ?> flashAttributes = ((RedirectAttributes) model).getFlashAttributes();
         RequestContextUtils.getOutputFlashMap(request).putAll(flashAttributes);
      }
      return mav;
   }
}
//找到给定异常的@ExceptionHandler方法。 
//默认实现首先搜索控制器的类层次结构中的方法，如果没有找到，它将继续搜索其他@ExceptionHandler方法，
//假设检测到一些@ControllerAdvice Spring管理的bean。
@Nullable
protected ServletInvocableHandlerMethod getExceptionHandlerMethod(
      @Nullable HandlerMethod handlerMethod, Exception exception) {
   Class<?> handlerType = null;
   if (handlerMethod != null) {
      //控制器类本身的本地异常处理程序方法。
      //即使在基于接口的代理的情况下，也要通过代理调用。
      handlerType = handlerMethod.getBeanType();
      ExceptionHandlerMethodResolver resolver = this.exceptionHandlerCache.get(handlerType);
      if (resolver == null) {
         resolver = new ExceptionHandlerMethodResolver(handlerType);
         this.exceptionHandlerCache.put(handlerType, resolver);
      }
      Method method = resolver.resolveMethod(exception);
      if (method != null) {
         return new ServletInvocableHandlerMethod(handlerMethod.getBean(), method);
      }
      //对于下面的建议适用性检查（涉及基础包，可分配类型和注释存在），请使用目标类而不是基于接口的代理。
      if (Proxy.isProxyClass(handlerType)) {
         handlerType = AopUtils.getTargetClass(handlerMethod.getBean());
      }
   }
   for (Map.Entry<ControllerAdviceBean, ExceptionHandlerMethodResolver> entry : this.exceptionHandlerAdviceCache.entrySet()) {
      ControllerAdviceBean advice = entry.getKey();
      if (advice.isApplicableToBeanType(handlerType)) {
         ExceptionHandlerMethodResolver resolver = entry.getValue();
         Method method = resolver.resolveMethod(exception);
         if (method != null) {
            return new ServletInvocableHandlerMethod(advice.resolveBean(), method);
         }
      }
   }
   return null;
}
```

## 4、ResponseStatusExceptionResolver

一个HandlerExceptionResolver，它使用@ResponseStatus注释将异常映射到HTTP状态代码。

默认情况下，在{@link org.springframework.web.servlet.DispatcherServlet DispatcherServlet}以及MVC Java配置和MVC命名空间中启用此异常解析程序。

从4.2开始，这个解析器也会以@ResponseStatus递归查找原因异常，从4.2.2开始，此解析器支持自定义组合注释中@ResponseStatus的属性覆盖。

从5.0开始，这个解析器也支持ResponseStatusException。

```java
public class ResponseStatusExceptionResolver extends AbstractHandlerExceptionResolver implements MessageSourceAware {
   @Nullable
   private MessageSource messageSource;
   @Override
   public void setMessageSource(MessageSource messageSource) {
      this.messageSource = messageSource;
   }
   @Override
   @Nullable
   protected ModelAndView doResolveException(
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
      try {
         if (ex instanceof ResponseStatusException) {
            return resolveResponseStatusException((ResponseStatusException) ex, request, response, handler);
         }
         ResponseStatus status = AnnotatedElementUtils.findMergedAnnotation(ex.getClass(), ResponseStatus.class);
         if (status != null) {
            return resolveResponseStatus(status, request, response, handler, ex);
         }
         if (ex.getCause() instanceof Exception) {
            return doResolveException(request, response, handler, (Exception) ex.getCause());
         }
      }
      catch (Exception resolveEx) {
         if (logger.isWarnEnabled()) {
            logger.warn("Failure while trying to resolve exception [" + ex.getClass().getName() + "]", resolveEx);
         }
      }
      return null;
   }
   //处理{@link ResponseStatus @ResponseStatus}注释的模板方法。
   //默认实现使用注释中的状态代码和原因委托给applyStatusAndReason()。
   protected ModelAndView resolveResponseStatus(ResponseStatus responseStatus, HttpServletRequest request,
         HttpServletResponse response, @Nullable Object handler, Exception ex) throws Exception {
      int statusCode = responseStatus.code().value();
      String reason = responseStatus.reason();
      return applyStatusAndReason(statusCode, reason, response);
   }
   //处理{@link ResponseStatusException}的模板方法。
   //默认实现使用状态代码和异常原因委托给applyStatusAndReason()。
   protected ModelAndView resolveResponseStatusException(ResponseStatusException ex,
         HttpServletRequest request, HttpServletResponse response, @Nullable Object handler) throws Exception {
      int statusCode = ex.getStatus().value();
      String reason = ex.getReason();
      return applyStatusAndReason(statusCode, reason, response);
   }
   //将已解决的状态代码和原因应用于响应。
   //如果有原因，默认实现使用HttpServletResponse＃sendError(int)或HttpServletResponse＃sendError(int，String)发送响应错误，然后返回空的ModelAndView。
   protected ModelAndView applyStatusAndReason(int statusCode, @Nullable String reason, HttpServletResponse response)
         throws IOException {
      if (!StringUtils.hasLength(reason)) {
         response.sendError(statusCode);
      }
      else {
         String resolvedReason = (this.messageSource != null ?
               this.messageSource.getMessage(reason, null, reason, LocaleContextHolder.getLocale()) :
               reason);
         response.sendError(statusCode, resolvedReason);
      }
      return new ModelAndView();
   }
}
```

## 5、DefaultHandlerExceptionResolver

HandlerExceptionResolver接口的默认实现，解析标准的Spring MVC异常并将它们转换为相应的HTTP状态代码。

默认情况下，在常见的Spring DispatcherServlet中启用此异常解析程序。

支持的异常

异常
HTTP状态码

HttpRequestMethodNotSupportedException
405 (SC_METHOD_NOT_ALLOWED)

HttpMediaTypeNotSupportedException
415 (SC_UNSUPPORTED_MEDIA_TYPE)

HttpMediaTypeNotAcceptableException
406 (SC_NOT_ACCEPTABLE)

MissingPathVariableException
500 (SC_INTERNAL_SERVER_ERROR)

MissingServletRequestParameterException
400 (SC_BAD_REQUEST)

ServletRequestBindingException
400 (SC_BAD_REQUEST)

ConversionNotSupportedException
500 (SC_INTERNAL_SERVER_ERROR)

TypeMismatchException
400 (SC_BAD_REQUEST)

HttpMessageNotReadableException
400 (SC_BAD_REQUEST)

HttpMessageNotWritableException
500 (SC_INTERNAL_SERVER_ERROR)

MethodArgumentNotValidException
400 (SC_BAD_REQUEST)

MissingServletRequestPartException
400 (SC_BAD_REQUEST)

BindException
400 (SC_BAD_REQUEST)

NoHandlerFoundException
404 (SC_NOT_FOUND)

AsyncRequestTimeoutException
503 (SC_SERVICE_UNAVAILABLE)
