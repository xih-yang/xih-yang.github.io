# 27、SpringMVC源码分析 - 异步任务超时异常的执行流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springmvc/7/27.html
- 分类：J2EE框架
- 分组：教程目录
## 前言

本文分析异步任务出现超时及异常的情况时的处理流程。

## 一、示例

设置超时时间为2s，但任务需要执行10s

```java
    @ApiOperation(value = "test", notes = "test")
    @GetMapping(value = "/test", produces = {
     MediaType.APPLICATION_JSON_VALUE})
    public DeferredResult test() throws ValidDataException {
        Test test = new Test();
        test.setId(1);
        test.setName("test1");
        //构建DeferredResult，超时时间为2s
        DeferredResult<Object> result = new DeferredResult<>(2000L);
        Callable call = () -> {
            //这里休眠10是
            TimeUnit.SECONDS.sleep(10000);
            return test;
        };
        //将call作为DeferredResult的result
        result.setResult(call);
        //超时回调
        result.onTimeout(() -> {
            result.setResult("请求超时");
        });
        return result;
    }
```

## 二、源码分析

在AsyncContextImpl中执行异步任务的过程中，调用了updateTimeout( )来处理超时

1、processAsyncTask( )

```java
private synchronized void processAsyncTask() {
        if (!initialRequestDone) {
            return;
        }
        //处理超时
        updateTimeout();
        final Runnable task = asyncTaskQueue.poll();
        if (task != null) {
            processingAsyncTask = true;
            asyncExecutor().execute(new TaskDispatchRunnable(task));
        } else {
            processingAsyncTask = false;
        }
    }
```

**2、** updateTimeout()；

```java
public void updateTimeout() {
        XnioExecutor.Key key = this.timeoutKey;
        if (key != null) {
            if (!key.remove()) {
                return;
            } else {
                this.timeoutKey = null;
            }
        }
        //设置了超时时间，并且异步任务还没有完成
        if (timeout > 0 && !complete) {
            this.timeoutKey = WorkerUtils.executeAfter(exchange.getIoThread(), timeoutTask, timeout, TimeUnit.MILLISECONDS);
        }
    }
```

**3、** executeAfter()；

```java
public static XnioExecutor.Key executeAfter(XnioIoThread thread, Runnable task, long timeout, TimeUnit timeUnit) {
        try {
            return thread.executeAfter(task, timeout, timeUnit);
        } catch (RejectedExecutionException e) {
            if(thread.getWorker().isShutdown()) {
                UndertowLogger.ROOT_LOGGER.debugf(e, "Failed to schedule task %s as worker is shutting down", task);
                //we just return a bogus key in this case
                return new XnioExecutor.Key() {
                    @Override
                    public boolean remove() {
                        return false;
                    }
                };
            } else {
                throw e;
            }
        }
    }
```

```java
public Key executeAfter(final Runnable command, final long time, final TimeUnit unit) {
        final long millis = unit.toMillis(time);
        if ((state & SHUTDOWN) != 0) {
            throw log.threadExiting();
        }
        if (millis <= 0) {
            execute(command);
            return Key.IMMEDIATE;
        }
        final long deadline = (nanoTime() - START_TIME) + Math.min(millis, LONGEST_DELAY) * 1000000L;
        //创建TimeKey，传入截止时间，及超时任务TimeoutTask
        final TimeKey key = new TimeKey(deadline, command);
        synchronized (workLock) {
            final TreeSet<TimeKey> queue = delayWorkQueue;
            //加入到队列中
            queue.add(key);
            if (queue.iterator().next() == key) {
                // we're the next one up; poke the selector to update its delay time
                if (polling) {
      // flag is always false if we're the same thread
                    selector.wakeup();
                }
            }
            return key;
        }
    }
```

超时任务被加入到了delayWorkQueue队列中

**4、** WorkerThread；

在WorkerThread的run方法中，会把delayWorkQueue的任务取出来，校验是否超时，超时后将运行TimeKey的Command即TimeoutTask

```java
public void run() {
        final Selector selector = this.selector;
        try {
            log.tracef("Starting worker thread %s", this);
            final Object lock = workLock;
            //工作任务队列
            final Queue<Runnable> workQueue = selectorWorkQueue;
            //延时任务队列
            final TreeSet<TimeKey> delayQueue = delayWorkQueue;
            log.debugf("Started channel thread '%s', selector %s", currentThread().getName(), selector);
            Runnable task;
            Iterator<TimeKey> iterator;
            long delayTime = Long.MAX_VALUE;
            Set<SelectionKey> selectedKeys;
            SelectionKey[] keys = new SelectionKey[16];
            int oldState;
            int keyCount;
            for (;;) {
                // Run all tasks
                do {
                    synchronized (lock) {
                        task = workQueue.poll();
                        //首次task为null
                        if (task == null) {
                            iterator = delayQueue.iterator();
                            delayTime = Long.MAX_VALUE;
                            if (iterator.hasNext()) {
                                final long now = nanoTime();
                                do {
                                	//取出延时任务
                                    final TimeKey key = iterator.next();
                                    if (key.deadline <= (now - START_TIME)) {
                                   		//超时
                                   		//将超时任务加入工作队列
                                        workQueue.add(key.command);
                                        //移除延时任务
                                        iterator.remove();
                                    } else {
                                    	//没有超时，停止循环
                                        delayTime = key.deadline - (now - START_TIME);
                                        // the rest are in the future
                                        break;
                                    }
                                } while (iterator.hasNext());
                            }
                            //取出task，超时的时候这里是TimeoutTask
                            task = workQueue.poll();
                        }
                    }
                    // clear interrupt status
                    Thread.interrupted();
                    //执行task
                    safeRun(task);
                } while (task != null);
			......
			......
}
```

**4、** TimeoutTask；

```java
 private final class TimeoutTask implements Runnable {
        @Override
        public void run() {
            synchronized (AsyncContextImpl.this) {
            	//任务初始化或出现异常，并且还没有完成
                if (!dispatched && !complete) {
                	//新建一个处理超时的异步任务
                    addAsyncTask(new Runnable() {
                        @Override
                        public void run() {
                            final boolean setupRequired = SecurityActions.currentServletRequestContext() == null;
                            UndertowServletLogger.REQUEST_LOGGER.debug("Async request timed out");
                            servletRequestContext.getCurrentServletContext().invokeRunnable(servletRequestContext.getExchange(), new Runnable() {
                                @Override
                                public void run() {
                                    //now run request listeners
                                    setupRequestContext(setupRequired);
                                    try {
                                    	//调用监听器的onTimeout方法
                                        onAsyncTimeout();
                                        if (!dispatched) {
                                            if (!getResponse().isCommitted()) {
                                                //close the connection on timeout
                                                exchange.setPersistent(false);
                                                exchange.getResponseHeaders().put(Headers.CONNECTION, Headers.CLOSE.toString());
                                                Connectors.executeRootHandler(new HttpHandler() {
                                                    @Override
                                                    public void handleRequest(HttpServerExchange exchange) throws Exception {
                                                        //servlet
                                                        try {
                                                            if (servletResponse instanceof HttpServletResponse) {
                                                                ((HttpServletResponse) servletResponse).sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                                                            } else {
                                                                servletRequestContext.getOriginalResponse().sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                                                            }
                                                        } catch (IOException e) {
                                                            UndertowLogger.REQUEST_IO_LOGGER.ioException(e);
                                                        } catch (Throwable t) {
                                                            UndertowLogger.REQUEST_IO_LOGGER.handleUnexpectedFailure(t);
                                                        }
                                                    }
                                                }, exchange);
                                            } else {
                                                //not much we can do, just break the connection
                                                IoUtils.safeClose(exchange.getConnection());
                                            }
                                            if (!dispatched) {
                                            	//调用完成
                                                complete();
                                            }
                                        }
                                    } finally {
                                        tearDownRequestContext(setupRequired);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }
    }
```

dispatched ：表示任务是否分发过或处理完成过，在代码中设置值的地方

第一处：

```java
private synchronized void doDispatch(final Runnable runnable) {
        if (dispatched) {
            throw UndertowServletMessages.MESSAGES.asyncRequestAlreadyDispatched();
        }
        //在异步任务创建之前，设置为true
        dispatched = true;
        final HttpServletRequestImpl request = servletRequestContext.getOriginalRequest();
        //创建异步任务
        addAsyncTask(new Runnable() {
            @Override
            public void run() {
                request.asyncRequestDispatched();
                runnable.run();
            }
        });
        if (timeoutKey != null) {
            timeoutKey.remove();
        }
    }
```

第二处：

```java
//异步任务结束，处理结果
 public void handleCompletedBeforeInitialRequestDone() {
        assert completedBeforeInitialRequestDone;
        completeInternal(true);
        //设置为true
        dispatched = true;
    }
```

第三处：

```java
 //出现error的时候，回调
 public void handleError(final Throwable error) {
 		//设置为false
        dispatched = false; //we reset the dispatched state
        onAsyncError(error);
        ...
        }
```

complete：表示任务是否完成，是在complate方法中设置的

```java
@Override
    public synchronized void complete() {
        if (complete) {
            UndertowLogger.REQUEST_LOGGER.trace("Ignoring call to AsyncContext.complete() as it has already been called");
            return;
        }
        //设置为true
        complete = true;
        if (timeoutKey != null) {
            timeoutKey.remove();
            timeoutKey = null;
        }
        if (!dispatched) {
            completeInternal(false);
        } else {
            onAsyncComplete();
        }
        if (previousAsyncContext != null) {
            previousAsyncContext.complete();
        }
    }
```

这里的dispatched、complete、initialRequestDone、processingAsyncTask等状态都是用boolean值，让人难以理解，为什么不参考FutureTask的状态值呢？

```java
	private volatile int state;
    private static final int NEW          = 0;
    private static final int COMPLETING   = 1;
    private static final int NORMAL       = 2;
    private static final int EXCEPTIONAL  = 3;
    private static final int CANCELLED    = 4;
    private static final int INTERRUPTING = 5;
    private static final int INTERRUPTED  = 6;
```

**5、** onAsyncTimeout()；

```java
 private void onAsyncTimeout() {
        for (final BoundAsyncListener listener : asyncListeners) {
        	//创建异步事件AsyncEvent 
            AsyncEvent event = new AsyncEvent(this, listener.servletRequest, listener.servletResponse);
            try {
            	//调用监听器的onTimeout( )
                listener.asyncListener.onTimeout(event);
            } catch (IOException e) {
                UndertowServletLogger.REQUEST_LOGGER.ioExceptionDispatchingAsyncEvent(e);
            } catch (Throwable t) {
                UndertowServletLogger.REQUEST_LOGGER.failureDispatchingAsyncEvent(t);
            }
        }
    }
```

其中这个asyncListener是在StandardServletAsyncWebRequest调用startAsync( )方法的时候创建的

```java
@Override
	public void startAsync() {
		Assert.state(getRequest().isAsyncSupported(),
				"Async support must be enabled on a servlet and for all filters involved " +
				"in async request processing. This is done in Java code using the Servlet API " +
				"or by adding \"<async-supported>true</async-supported>\" to servlet and " +
				"filter declarations in web.xml.");
		Assert.state(!isAsyncComplete(), "Async processing has already completed");
		if (isAsyncStarted()) {
			return;
		}
		this.asyncContext = getRequest().startAsync(getRequest(), getResponse());
		//创建Listener
		this.asyncContext.addListener(this);
		if (this.timeout != null) {
			this.asyncContext.setTimeout(this.timeout);
		}
	}
```

**6、** onTimeout()；

```java
StandardServletAsyncWebRequest.java
public void onTimeout(AsyncEvent event) throws IOException {
		//掉用timeoutHandlers
		this.timeoutHandlers.forEach(Runnable::run);
	}
```

在WebAsyncManager的startCallableProcessing方法中初始化了timeoutHandler，也可以自定义传入timeoutHandler

```java
this.asyncWebRequest.addTimeoutHandler(() -> {
			if (logger.isDebugEnabled()) {
				logger.debug("Async request timeout for " + formatRequestUri());
			}
			//调用拦截器链
			Object result = interceptorChain.triggerAfterTimeout(this.asyncWebRequest, callable);
			if (result != CallableProcessingInterceptor.RESULT_NONE) {
				//处理结果
				setConcurrentResultAndDispatch(result);
			}
		});
```

其中的一个拦截器会创建异常,result被赋值AsyncRequestTimeoutException，最后在处理结果中会处理超时异常的情况

```java
public class TimeoutCallableProcessingInterceptor implements CallableProcessingInterceptor {
	@Override
	public <T> Object handleTimeout(NativeWebRequest request, Callable<T> task) throws Exception {
		return new AsyncRequestTimeoutException();
	}
}
```

## 总结

本文简单分析了异步任务出现超时异常的情况时，异步任务的处理流程。
