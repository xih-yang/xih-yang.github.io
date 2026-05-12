# 44、SpringBoot 源码分析 - SpringMVC源码之异常处理一
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/44.html
- 分类：J2EE框架
- 分组：教程目录
## 基本处理流程图

## 通常的异常处理

我们来演示下，看看通常异常是怎么处理的，我们什么都不加，只是这样，看看内部怎么处理的：

运行：

运行到这里的时候直接抛异常：

`doDispatch`方法中会保存异常。

然后处理结果：

走有异常的逻辑：

进行异常解析器解析，`DefaultErrorAttributes`只是添加了异常属性，什么都没做：

而`HandlerExceptionResolverComposite`是一个异常解析器的符合解析器，里面有解析器处理。

## 是否能解析异常

### ExceptionHandlerExceptionResolver的shouldApplyTo

一般只解析`HandlerMethod`处理器类型的异常，刚好我们就是这个类型的处理器。

最终到`AbstractHandlerExceptionResolver`的`shouldApplyTo`，我们没有映射的处理器来处理，所以全部为空的话也是返回`true`，表示可以处理：

#### doResolveHandlerMethodException处理

如果没有设置异常处理方法就返回`null`了，等于没处理，其实这里的方法是可以自定义的，后面说。

### ResponseStatusExceptionResolver的处理

这个也是`AbstractHandlerExceptionResolver`的`shouldApplyTo`，最终也是没处理：

### DefaultHandlerExceptionResolver的处理

这个也是`AbstractHandlerExceptionResolver`的`shouldApplyTo`，但是最后还是没处理，不过他已经判断了很多中异常了：

```java
@Override
	@Nullable
	protected ModelAndView doResolveException(
			HttpServletRequest request, HttpServletResponse response, @Nullable Object handler, Exception ex) {
		try {
			if (ex instanceof HttpRequestMethodNotSupportedException) {
				return handleHttpRequestMethodNotSupported(
						(HttpRequestMethodNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMediaTypeNotSupportedException) {
				return handleHttpMediaTypeNotSupported(
						(HttpMediaTypeNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMediaTypeNotAcceptableException) {
				return handleHttpMediaTypeNotAcceptable(
						(HttpMediaTypeNotAcceptableException) ex, request, response, handler);
			}
			else if (ex instanceof MissingPathVariableException) {
				return handleMissingPathVariable(
						(MissingPathVariableException) ex, request, response, handler);
			}
			else if (ex instanceof MissingServletRequestParameterException) {
				return handleMissingServletRequestParameter(
						(MissingServletRequestParameterException) ex, request, response, handler);
			}
			else if (ex instanceof ServletRequestBindingException) {
				return handleServletRequestBindingException(
						(ServletRequestBindingException) ex, request, response, handler);
			}
			else if (ex instanceof ConversionNotSupportedException) {
				return handleConversionNotSupported(
						(ConversionNotSupportedException) ex, request, response, handler);
			}
			else if (ex instanceof TypeMismatchException) {
				return handleTypeMismatch(
						(TypeMismatchException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMessageNotReadableException) {
				return handleHttpMessageNotReadable(
						(HttpMessageNotReadableException) ex, request, response, handler);
			}
			else if (ex instanceof HttpMessageNotWritableException) {
				return handleHttpMessageNotWritable(
						(HttpMessageNotWritableException) ex, request, response, handler);
			}
			else if (ex instanceof MethodArgumentNotValidException) {
				return handleMethodArgumentNotValidException(
						(MethodArgumentNotValidException) ex, request, response, handler);
			}
			else if (ex instanceof MissingServletRequestPartException) {
				return handleMissingServletRequestPartException(
						(MissingServletRequestPartException) ex, request, response, handler);
			}
			else if (ex instanceof BindException) {
				return handleBindException((BindException) ex, request, response, handler);
			}
			else if (ex instanceof NoHandlerFoundException) {
				return handleNoHandlerFoundException(
						(NoHandlerFoundException) ex, request, response, handler);
			}
			else if (ex instanceof AsyncRequestTimeoutException) {
				return handleAsyncRequestTimeoutException(
						(AsyncRequestTimeoutException) ex, request, response, handler);
			}
		}
		catch (Exception handlerEx) {
			if (logger.isWarnEnabled()) {
				logger.warn("Failure while trying to resolve exception [" + ex.getClass().getName() + "]", handlerEx);
			}
		}
		return null;
	}
```

默认的异常处理都处理不了我这个异常`java.lang.ArithmeticException: / by zero`，然后就抛到`tomcat`里去了，我们后面说。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
