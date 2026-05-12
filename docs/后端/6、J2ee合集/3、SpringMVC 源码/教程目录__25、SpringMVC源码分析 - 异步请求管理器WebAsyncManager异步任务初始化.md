# 25、SpringMVC源码分析 - 异步请求管理器WebAsyncManager异步任务初始化
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/25.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

以接口的返回值为DeferredResult为例来分析一下异步任务的初始化。

## 一、示例

```java
    @ApiOperation(value = "test", notes = "test")
    @GetMapping(value = "/test", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public DeferredResult test() throws ValidDataException {
        Test test = new Test();
        test.setId(1);
        test.setName("test1");
        DeferredResult<Object> result = new DeferredResult<>(2000L);
        result.setResult(test);
        result.onTimeout(() -> {
            result.setResult("请求超时");
        });
        return result;
  	}
```

## 二、原理

1、当Controller方法执行后，会通过returnValueHandlers对返回值进行处理

```java
public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		//获取ReturnValueHandler
		HandlerMethodReturnValueHandler handler = selectHandler(returnValue, returnType);
		if (handler == null) {
			throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());
		}
		//通过ReturnValueHandler处理返回值
		handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);
	}
```

2、这里返回值是DeferredResult 类型，则会进入DeferredResultMethodReturnValueHandler的handleReturnValue方法

```java
@Override
	public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
		if (returnValue == null) {
			mavContainer.setRequestHandled(true);
			return;
		}
		DeferredResult<?> result;
		//DeferredResult类型
		if (returnValue instanceof DeferredResult) {
			result = (DeferredResult<?>) returnValue;
		}
		//ListenableFuture类型
		else if (returnValue instanceof ListenableFuture) {
			result = adaptListenableFuture((ListenableFuture<?>) returnValue);
		}
		//CompletionStage类型
		else if (returnValue instanceof CompletionStage) {
			result = adaptCompletionStage((CompletionStage<?>) returnValue);
		}
		else {
			// Should not happen...
			throw new IllegalStateException("Unexpected return value type: " + returnValue);
		}
		//获取异步管理器执行任务
		WebAsyncUtils.getAsyncManager(webRequest).startDeferredResultProcessing(result, mavContainer);
	}
```

3、异步执行任务startDeferredResultProcessing

这里开始异步任务的处理流程

```java
public void startDeferredResultProcessing(
			final DeferredResult<?> deferredResult, Object... processingContext) throws Exception {
		Assert.notNull(deferredResult, "DeferredResult must not be null");
		Assert.state(this.asyncWebRequest != null, "AsyncWebRequest must not be null");
		//获取更细粒度的超时时间控制，不存在时使用自定义的超时时间
		Long timeout = deferredResult.getTimeoutValue();
		if (timeout != null) {
			this.asyncWebRequest.setTimeout(timeout);
		}
		//整理拦截器
		List<DeferredResultProcessingInterceptor> interceptors = new ArrayList<>();
		interceptors.add(deferredResult.getInterceptor());
		interceptors.addAll(this.deferredResultInterceptors.values());
		interceptors.add(timeoutDeferredResultInterceptor);
		//封装成拦截器链
		final DeferredResultInterceptorChain interceptorChain = new DeferredResultInterceptorChain(interceptors);
		//超时TimeoutHandler
		this.asyncWebRequest.addTimeoutHandler(() -> {
			try {
				interceptorChain.triggerAfterTimeout(this.asyncWebRequest, deferredResult);
			}
			catch (Throwable ex) {
				setConcurrentResultAndDispatch(ex);
			}
		});
		//错误ErrorHandler
		this.asyncWebRequest.addErrorHandler(ex -> {
			if (!this.errorHandlingInProgress) {
				try {
					if (!interceptorChain.triggerAfterError(this.asyncWebRequest, deferredResult, ex)) {
						return;
					}
					deferredResult.setErrorResult(ex);
				}
				catch (Throwable interceptorEx) {
					setConcurrentResultAndDispatch(interceptorEx);
				}
			}
		});
		//任务完成CompletionHandler
		this.asyncWebRequest.addCompletionHandler(()
				-> interceptorChain.triggerAfterCompletion(this.asyncWebRequest, deferredResult));
		//调用拦截器的beforeConcurrentHandling
		interceptorChain.applyBeforeConcurrentHandling(this.asyncWebRequest, deferredResult);
		//执行异步任务
		startAsyncProcessing(processingContext);
		try {
			//调用拦截器的applyPreProcess
			interceptorChain.applyPreProcess(this.asyncWebRequest, deferredResult);
			deferredResult.setResultHandler(result -> {
				//调用拦截器的applyPostProcess
				result = interceptorChain.applyPostProcess(this.asyncWebRequest, deferredResult, result);
				//设置结果，并且分发获取结果的请求
				setConcurrentResultAndDispatch(result);
			});
		}
		catch (Throwable ex) {
			setConcurrentResultAndDispatch(ex);
		}
	}
```

4、异步执行任务startAsyncProcessing( )

**1、** startAsyncProcessing()；

```java
private void startAsyncProcessing(Object[] processingContext) {
		synchronized (WebAsyncManager.this) {
			//设置结果为RESULT_NONE
			this.concurrentResult = RESULT_NONE;
			this.concurrentResultContext = processingContext;
			this.errorHandlingInProgress = false;
		}
		//执行异步任务
		this.asyncWebRequest.startAsync();
		if (logger.isDebugEnabled()) {
			logger.debug("Started async request");
		}
	}
```

**2、** startAsync()；

```java
StandardServletAsyncWebRequest.java
public void startAsync() {
		Assert.state(getRequest().isAsyncSupported(),
				"Async support must be enabled on a servlet and for all filters involved " +
				"in async request processing. This is done in Java code using the Servlet API " +
				"or by adding \"<async-supported>true</async-supported>\" to servlet and " +
				"filter declarations in web.xml.");
		Assert.state(!isAsyncComplete(), "Async processing has already completed");
		//检查异步任务是否已经启动
		if (isAsyncStarted()) {
			return;
		}
		//启动异步任务
		this.asyncContext = getRequest().startAsync(getRequest(), getResponse());
		this.asyncContext.addListener(this);
		if (this.timeout != null) {
			this.asyncContext.setTimeout(this.timeout);
		}
	}
```

**3、** startAsync()；

```java
ServletRequestWrapper.java
 public AsyncContext startAsync(ServletRequest servletRequest,
                                   ServletResponse servletResponse)
            throws IllegalStateException {
        return request.startAsync(servletRequest, servletResponse);
    }
```

**4、** startAsync()；

```java
HttpServletRequestImpl.java
 @Override
    public AsyncContext startAsync(final ServletRequest servletRequest, final ServletResponse servletResponse) throws IllegalStateException {
        final ServletRequestContext servletRequestContext = exchange.getAttachment(ServletRequestContext.ATTACHMENT_KEY);
        if (!servletContext.getDeployment().getDeploymentInfo().isAllowNonStandardWrappers()) {
            if (servletRequestContext.getOriginalRequest() != servletRequest) {
                if (!(servletRequest instanceof ServletRequestWrapper)) {
                    throw UndertowServletMessages.MESSAGES.requestWasNotOriginalOrWrapper(servletRequest);
                }
            }
            if (servletRequestContext.getOriginalResponse() != servletResponse) {
                if (!(servletResponse instanceof ServletResponseWrapper)) {
                    throw UndertowServletMessages.MESSAGES.responseWasNotOriginalOrWrapper(servletResponse);
                }
            }
        }
        //是否支持异步，默认支持 private boolean asyncSupported = true;
        if (!isAsyncSupported()) {
            throw UndertowServletMessages.MESSAGES.startAsyncNotAllowed();
        } else if (asyncStarted) {
        	//是否已经执行过
            throw UndertowServletMessages.MESSAGES.asyncAlreadyStarted();
        }
        //标记异步任务开始执行
        asyncStarted = true;
        servletRequestContext.setServletRequest(servletRequest);
        servletRequestContext.setServletResponse(servletResponse);
        //创建AsyncContextImpl
        return asyncContext = new AsyncContextImpl(exchange, servletRequest, servletResponse, servletRequestContext, true, asyncContext);
    }
```

**5、** AsyncContextImpl；

```java
public AsyncContextImpl(final HttpServerExchange exchange, final ServletRequest servletRequest, final ServletResponse servletResponse, final ServletRequestContext servletRequestContext, boolean requestSupplied, final AsyncContextImpl previousAsyncContext) {
        this.exchange = exchange;
        this.servletRequest = servletRequest;
        this.servletResponse = servletResponse;
        this.servletRequestContext = servletRequestContext;
        this.requestSupplied = requestSupplied;
        this.previousAsyncContext = previousAsyncContext;
        initiatingThread = Thread.currentThread();
        //调用dispatch(),参数为SameThreadExecutor和Runnable
        exchange.dispatch(SameThreadExecutor.INSTANCE, new Runnable() {
            @Override
            public void run() {
                exchange.setDispatchExecutor(null);
                initialRequestDone();
            }
        });
    }
```

**6、** dispatch()；

```java
 public HttpServerExchange dispatch(final Executor executor, final Runnable runnable) {
        if (isInCall()) {
            if (executor != null) {
                this.dispatchExecutor = executor;
            }
            state |= FLAG_DISPATCHED;
            if(anyAreSet(state, FLAG_SHOULD_RESUME_READS | FLAG_SHOULD_RESUME_WRITES)) {
                throw UndertowMessages.MESSAGES.resumedAndDispatched();
            }
            //设置dispatchTask，为传入的runnable，这个任务会被调用
            this.dispatchTask = runnable;
        } else {
            if (executor == null) {
                getConnection().getWorker().execute(runnable);
            } else {
                executor.execute(runnable);
            }
        }
        return this;
    }
```

到这里初始化好了一个将被分发的任务dispatchTask

5、设置结果处理器

```java
public final void setResultHandler(DeferredResultHandler resultHandler) {
		Assert.notNull(resultHandler, "DeferredResultHandler is required");
		// Immediate expiration check outside of the result lock
		//校验expired，请求是否过期
		if (this.expired) {
			return;
		}
		Object resultToHandle;
		synchronized (this) {
			// Got the lock in the meantime: double-check expiration status
			if (this.expired) {
				return;
			}
			//异步执行的结果
			resultToHandle = this.result;
			//检查DeferredResult的结果
			if (resultToHandle == RESULT_NONE) {
				// No result yet: store handler for processing once it comes in
				//结果为初始化的RESULT_NONE，即还没有获得结果
				this.resultHandler = resultHandler;
				return;
			}
		}
		// If we get here, we need to process an existing result object immediately.
		// The decision is made within the result lock; just the handle call outside
		// of it, avoiding any deadlock potential with Servlet container locks.
		try {
			//处理结果
			resultHandler.handleResult(resultToHandle);
		}
		catch (Throwable ex) {
			logger.debug("Failed to process async result", ex);
		}
	}
```

6、处理结果resultHandler.handleResult(resultToHandle);

**1、** 进入lambda表达式；

```java
result -> {
				//调用拦截器的applyPostProcess
				result = interceptorChain.applyPostProcess(this.asyncWebRequest, deferredResult, result);
				//设置结果，并且分发获取结果的请求
				setConcurrentResultAndDispatch(result);
			}
```

**2、** setConcurrentResultAndDispatch()；

```java
private void setConcurrentResultAndDispatch(Object result) {
		synchronized (WebAsyncManager.this) {
			//是否有了异步的结果
			if (this.concurrentResult != RESULT_NONE) {
				return;
			}
			//将当前结果赋值给异步结果
			this.concurrentResult = result;
			this.errorHandlingInProgress = (result instanceof Throwable);
		}
		if (this.asyncWebRequest.isAsyncComplete()) {
			if (logger.isDebugEnabled()) {
				logger.debug("Async result set but request already complete: " + formatRequestUri());
			}
			return;
		}
		if (logger.isDebugEnabled()) {
			boolean isError = result instanceof Throwable;
			logger.debug("Async " + (isError ? "error" : "result set") + ", dispatch to " + formatRequestUri());
		}
		//分发异步请求
		this.asyncWebRequest.dispatch();
	}
```

**3、** dispatch()；

```java
StandardServletAsyncWebRequest.java
    @Override
	public void dispatch() {
		Assert.notNull(this.asyncContext, "Cannot dispatch without an AsyncContext");
		this.asyncContext.dispatch();
	}
```

**4、** dispatch()；

```java
AsyncContextImpl.java
 public void dispatch() {
        if (this.dispatched) {
            throw UndertowServletMessages.MESSAGES.asyncRequestAlreadyDispatched();
        } else {
            HttpServletRequestImpl requestImpl = this.servletRequestContext.getOriginalRequest();
            Deployment deployment = requestImpl.getServletContext().getDeployment();
            ServletContainer container;
            String qs;
            if (this.requestSupplied && this.servletRequest instanceof HttpServletRequest) {
                container = deployment.getServletContainer();
                String requestURI = ((HttpServletRequest)this.servletRequest).getRequestURI();
                DeploymentManager context = container.getDeploymentByPath(requestURI);
                if (context == null) {
                    throw UndertowServletMessages.MESSAGES.couldNotFindContextToDispatchTo(requestImpl.getOriginalContextPath());
                }
                qs = requestURI.substring(context.getDeployment().getServletContext().getContextPath().length());
                String qs = ((HttpServletRequest)this.servletRequest).getQueryString();
                if (qs != null && !qs.isEmpty()) {
                    qs = qs + "?" + qs;
                }
				//分发请求
                this.dispatch(context.getDeployment().getServletContext(), qs);
            } else {
                container = deployment.getServletContainer();
                DeploymentManager context = container.getDeploymentByPath(requestImpl.getOriginalContextPath());
                if (context == null) {
                    throw UndertowServletMessages.MESSAGES.couldNotFindContextToDispatchTo(requestImpl.getOriginalContextPath());
                }
                String toDispatch = requestImpl.getExchange().getRelativePath();
                qs = requestImpl.getOriginalQueryString();
                if (qs != null && !qs.isEmpty()) {
                    toDispatch = toDispatch + "?" + qs;
                }
                this.dispatch(context.getDeployment().getServletContext(), toDispatch);
            }
        }
    }
```

**5、** dispatch()；

```java
 public void dispatch(ServletContext context, String path) {
        if (this.dispatched) {
            throw UndertowServletMessages.MESSAGES.asyncRequestAlreadyDispatched();
        } else {
        	//设置参数
            HttpServletRequestImpl requestImpl = this.servletRequestContext.getOriginalRequest();
            HttpServletResponseImpl responseImpl = this.servletRequestContext.getOriginalResponse();
            HttpServerExchange exchange = requestImpl.getExchange();
            ((ServletRequestContext)exchange.getAttachment(ServletRequestContext.ATTACHMENT_KEY)).setDispatcherType(DispatcherType.ASYNC);
            requestImpl.setAttribute("javax.servlet.async.request_uri", requestImpl.getOriginalRequestURI());
            requestImpl.setAttribute("javax.servlet.async.context_path", requestImpl.getOriginalContextPath());
            requestImpl.setAttribute("javax.servlet.async.servlet_path", requestImpl.getOriginalServletPath());
            requestImpl.setAttribute("javax.servlet.async.query_string", requestImpl.getOriginalQueryString());
            String newQueryString = "";
            int qsPos = path.indexOf("?");
            String newServletPath = path;
            if (qsPos != -1) {
                newQueryString = path.substring(qsPos + 1);
                newServletPath = path.substring(0, qsPos);
            }
            String newRequestUri = context.getContextPath() + newServletPath;
            Map<String, Deque<String>> newQueryParameters = new HashMap();
            String[] var11 = newQueryString.split("&");
            int var12 = var11.length;
            for(int var13 = 0; var13 < var12; ++var13) {
                String part = var11[var13];
                String name = part;
                String value = "";
                int equals = part.indexOf(61);
                if (equals != -1) {
                    name = part.substring(0, equals);
                    value = part.substring(equals + 1);
                }
                Deque<String> queue = (Deque)newQueryParameters.get(name);
                if (queue == null) {
                    newQueryParameters.put(name, queue = new ArrayDeque(1));
                }
                ((Deque)queue).add(value);
            }
            requestImpl.setQueryParameters(newQueryParameters);
            requestImpl.getExchange().setRelativePath(newServletPath);
            requestImpl.getExchange().setQueryString(newQueryString);
            requestImpl.getExchange().setRequestPath(newRequestUri);
            requestImpl.getExchange().setRequestURI(newRequestUri);
            requestImpl.setServletContext((ServletContextImpl)context);
            responseImpl.setServletContext((ServletContextImpl)context);
            Deployment deployment = requestImpl.getServletContext().getDeployment();
            ServletPathMatch info = deployment.getServletPaths().getServletHandlerByPath(newServletPath);
            ((ServletRequestContext)requestImpl.getExchange().getAttachment(ServletRequestContext.ATTACHMENT_KEY)).setServletPathMatch(info);
            //分发异步请求
            this.dispatchAsyncRequest(deployment.getServletDispatcher(), info, exchange);
        }
    }
```

**6、** dispatchAsyncRequest()；

```java
private void dispatchAsyncRequest(final ServletDispatcher servletDispatcher, final ServletPathMatch pathInfo, final HttpServerExchange exchange) {
		//参数是Runnable
        this.doDispatch(new Runnable() {
            public void run() {
            	//这里实现了即将调用的新一轮的异步请求
                Connectors.executeRootHandler(new HttpHandler() {
                    public void handleRequest(HttpServerExchange exchangex) throws Exception {
                        ServletRequestContext src = (ServletRequestContext)exchangex.getAttachment(ServletRequestContext.ATTACHMENT_KEY);
                        src.setServletRequest(AsyncContextImpl.this.servletRequest);
                        src.setServletResponse(AsyncContextImpl.this.servletResponse);
                        servletDispatcher.dispatchToPath(exchangex, pathInfo, DispatcherType.ASYNC);
                    }
                }, exchange);
            }
        });
    }
```

**7、** doDispatch()；

```java
private synchronized void doDispatch(final Runnable runnable) {
        if (this.dispatched) {
            throw UndertowServletMessages.MESSAGES.asyncRequestAlreadyDispatched();
        } else {
        	//设置请求分发为true
            this.dispatched = true;
            final HttpServletRequestImpl request = this.servletRequestContext.getOriginalRequest();
            //创建异步请求任务
            this.addAsyncTask(new Runnable() {
                public void run() {
                    request.asyncRequestDispatched();
                    runnable.run();
                }
            });
            if (this.timeoutKey != null) {
                this.timeoutKey.remove();
            }
        }
    }
```

**8、** addAsyncTask()；

```java
 public synchronized void addAsyncTask(Runnable runnable) {
 		//将异步任务加入队列
        this.asyncTaskQueue.add(runnable);
        if (!this.processingAsyncTask) {
        	//执行异步任务
            this.processAsyncTask();
        }
    }
```

**9、** processAsyncTask()；

校验异步任务是否执行过，没有执行过，则直接返回，第一层异步任务开始走到这里时并没有执行过，那么会直接返回。后面再继续分析异步任务在哪里执行…

```java
private synchronized void processAsyncTask() {
		//异步任务是否执行过
        if (this.initialRequestDone) {
            this.updateTimeout();
            Runnable task = (Runnable)this.asyncTaskQueue.poll();
            if (task != null) {
                this.processingAsyncTask = true;
                this.asyncExecutor().execute(new AsyncContextImpl.TaskDispatchRunnable(task));
            } else {
                this.processingAsyncTask = false;
            }
        }
    }
```

## 总结

创建异步任务后，servlet会释放资源，后续再继续处理异步任务。
