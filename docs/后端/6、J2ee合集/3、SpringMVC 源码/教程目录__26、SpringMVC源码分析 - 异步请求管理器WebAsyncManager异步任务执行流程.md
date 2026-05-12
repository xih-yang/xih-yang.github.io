# 26、SpringMVC源码分析 - 异步请求管理器WebAsyncManager异步任务执行流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/26.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

接着上一篇进行分析，在异步任务创建完，那接下来springmvc会去处理该异步任务。

## 一、回顾

1、上一篇中，在请求完接口，生成了一个调度任务dispatchTask，存储在HttpServerExchange中

dispatchTask:

```java
		new Runnable() {
            @Override
            public void run() {
                exchange.setDispatchExecutor(null);
                initialRequestDone();
            }
        }
```

2、另外生成了一个异步任务AsyncTask，存储在AsyncContextImpl的asyncTaskQueue队列中

AsyncTask被两层Runnable包装

第一层Runnable：

```java
		new Runnable() {
            @Override
            public void run() {
                Connectors.executeRootHandler(new HttpHandler() {
                    @Override
                    public void handleRequest(final HttpServerExchange exchange) throws Exception {
                        ServletRequestContext src = exchange.getAttachment(ServletRequestContext.ATTACHMENT_KEY);
                        src.setServletRequest(servletRequest);
                        src.setServletResponse(servletResponse);
                        servletDispatcher.dispatchToPath(exchange, pathInfo, DispatcherType.ASYNC);
                    }
                }, exchange);
            }
        }
```

第二层Runnable：

```java
		new Runnable() {
            @Override
            public void run() {
                request.asyncRequestDispatched();
                runnable.run();
            }
        }
```

## 二、异步任务分发

**1、** 当请求流程控制是由Connectors来控制的，看一下executeRootHandler方法的实现；

```java
public static void executeRootHandler(final HttpHandler handler, final HttpServerExchange exchange) {
        try {
        	//设置状态
            exchange.setInCall(true);
            //执行请求
            handler.handleRequest(exchange);
            exchange.setInCall(false);
            boolean resumed = exchange.isResumed();
            if (exchange.isDispatched()) {
                if (resumed) {
                    UndertowLogger.REQUEST_LOGGER.resumedAndDispatched();
                    exchange.setStatusCode(500);
                    exchange.endExchange();
                    return;
                }
                //这里获取DispatchTask
                final Runnable dispatchTask = exchange.getDispatchTask();
                Executor executor = exchange.getDispatchExecutor();
                exchange.setDispatchExecutor(null);
                exchange.unDispatch();
                if (dispatchTask != null) {
                    executor = executor == null ? exchange.getConnection().getWorker() : executor;
                    try {
                    	//执行调度任务dispatchTask
                        executor.execute(dispatchTask);
                    } catch (RejectedExecutionException e) {
                        UndertowLogger.REQUEST_LOGGER.debug("Failed to dispatch to worker", e);
                        exchange.setStatusCode(StatusCodes.SERVICE_UNAVAILABLE);
                        exchange.endExchange();
                    }
                }
            } else if (!resumed) {
                exchange.endExchange();
            } else {
                exchange.runResumeReadWrite();
            }
        } catch (Throwable t) {
            exchange.putAttachment(DefaultResponseListener.EXCEPTION, t);
            exchange.setInCall(false);
            if (!exchange.isResponseStarted()) {
                exchange.setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR);
            }
            if(t instanceof IOException) {
                UndertowLogger.REQUEST_IO_LOGGER.ioException((IOException) t);
            } else {
                UndertowLogger.REQUEST_LOGGER.undertowRequestFailed(t, exchange);
            }
            exchange.endExchange();
        }
    }
```

**2、** 进入dispatchTask的run方法；

```java
new Runnable() {
            @Override
            public void run() {
                exchange.setDispatchExecutor(null);
                initialRequestDone();
            }
        }
```

**3、** initialRequestDone()；

```java
public synchronized void initialRequestDone() {
		//标识异步任务首次初始化请求执行过了
        initialRequestDone = true;
        if (previousAsyncContext != null) {
        	//进这里表示异步任务中嵌套的还是异步任务，发布AsyncEvent事件
            previousAsyncContext.onAsyncStart(this);
            previousAsyncContext = null;
        }
        if (!processingAsyncTask) {
        	//执行异步任务
            processAsyncTask();
        }
        initiatingThread = null;
    }
```

**4、** processAsyncTask()；

```java
private synchronized void processAsyncTask() {
		//异步任务创建完时首次走到这里会return，下一轮通过Connectors请求时会过去
        if (!initialRequestDone) {
            return;
        }
        //处理超时的情况
        updateTimeout();
        //从异步队列中获取任务
        final Runnable task = asyncTaskQueue.poll();
        if (task != null) {
        	//标识异步任务执行中
            processingAsyncTask = true;
            //将异步任务封装在TaskDispatchRunnable，这里就是第三层Runnable了
            asyncExecutor().execute(new TaskDispatchRunnable(task));
        } else {
            processingAsyncTask = false;
        }
    }
```

## 三、异步任务执行

接着上面的分析

**1、** 进入第三层TaskDispatchRunnable的run方法；

```java
@Override
        public void run() {
            try {
            	//调用第二层Runnable的run方法
                task.run();
            } finally {
            	//再次进入异步任务流程，如果任务队列还有新的任务，继续执行异步任务
                processAsyncTask();
            }
        }
```

**2、** 进入第二层Runnable的run方法；

```java
new Runnable() {
            @Override
            public void run() {
            	//设置asyncStarted = false;
                request.asyncRequestDispatched();
                //调用第一层Runnable的run方法
                runnable.run();
            }
        }
```

**3、** 进入第一层Runnable的run方法；

```java
new Runnable() {
            @Override
            public void run() {
            	//进入executeRootHandler方法，重写HttpHandler的handleRequest方法
                Connectors.executeRootHandler(new HttpHandler() {
                    @Override
                    public void handleRequest(final HttpServerExchange exchange) throws Exception {
                        ServletRequestContext src = exchange.getAttachment(ServletRequestContext.ATTACHMENT_KEY);
                        src.setServletRequest(servletRequest);
                        src.setServletResponse(servletResponse);
                        //再次调度请求
                        servletDispatcher.dispatchToPath(exchange, pathInfo, DispatcherType.ASYNC);
                    }
                }, exchange);
            }
        }
```

请求经过再次调度后会重新经过springmvc的那一套流程，经过DispatcherServlet、RequestMappingHandlerAdapter，下面从RequestMappingHandlerAdapter的invokeHandlerMethod( )方法接着分析

**4、** invokeHandlerMethod()；

```java
protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		try {
			WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
			ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);
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
			modelFactory.initModel(webRequest, mavContainer, invocableMethod);
			mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);
			AsyncWebRequest asyncWebRequest = WebAsyncUtils.createAsyncWebRequest(request, response);
			asyncWebRequest.setTimeout(this.asyncRequestTimeout);
			WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
			asyncManager.setTaskExecutor(this.taskExecutor);
			asyncManager.setAsyncWebRequest(asyncWebRequest);
			asyncManager.registerCallableInterceptors(this.callableInterceptors);
			asyncManager.registerDeferredResultInterceptors(this.deferredResultInterceptors);
			//判断异步请求是否有了结果，不等于初始值了 concurrentResult != RESULT_NONE
			if (asyncManager.hasConcurrentResult()) {
				//取出结果，按照示例此结果是Test
				Object result = asyncManager.getConcurrentResult();
				mavContainer = (ModelAndViewContainer) asyncManager.getConcurrentResultContext()[0];
				//将管理器结果置为初始值 concurrentResult = RESULT_NONE
				asyncManager.clearConcurrentResult();
				LogFormatUtils.traceDebug(logger, traceOn -> {
					String formatted = LogFormatUtils.formatValue(result, !traceOn);
					return "Resume with async result [" + formatted + "]";
				});
				//
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

**5、** wrapConcurrentResult()；

构造ConcurrentResultHandlerMethod和ConcurrentResultMethodParameter，修改了原来的invocableMethod，并不会再次调用Controller了

```java
ServletInvocableHandlerMethod wrapConcurrentResult(Object result) {
		return new ConcurrentResultHandlerMethod(result, new ConcurrentResultMethodParameter(result));
	}
```

**6、** 用反射调用ConcurrentResultHandlerMethod里Callable的call方法；

```java
		public ConcurrentResultHandlerMethod(final Object result, ConcurrentResultMethodParameter returnType) {
			//Callable作为了参数
			super((Callable<Object>) () -> {
				if (result instanceof Exception) {
					throw (Exception) result;
				}
				else if (result instanceof Throwable) {
					throw new NestedServletException("Async processing failed", (Throwable) result);
				}
				//返回result
				return result;
			}, CALLABLE_METHOD);
			if (ServletInvocableHandlerMethod.this.returnValueHandlers != null) {
				setHandlerMethodReturnValueHandlers(ServletInvocableHandlerMethod.this.returnValueHandlers);
			}
			this.returnType = returnType;
		}
```

这里result返回后同样会经过结果处理器returnValueHandlers进行处理，如果result是Callable等，还会再次循环处理异步任务，直到获取最终结果返回ModelAndView等。

## 总结

本文简单分析了springmvc对异步任务的执行流程。
