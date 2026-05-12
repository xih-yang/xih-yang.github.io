# 10、Tomcat8 源码解析 - 容器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/10.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

## 一、容器相关接口

**1、** org.apache.catalina.Container容器接口；

容器是一个处理用户servlet请求并返回对象给 web 用户的模块。

org.apache.catalina.Container 接口定义了容器的形式，有四种容器：Engine（引擎）, Host（主机）, Context（上下文）, 和 Wrapper（包装器）。

**2、** org.apache.catalina.Engine引擎接口；

引擎表示整个Catalina的Servlet引擎。当你想要支持多个虚拟主机的时候，需要一个引擎；只能添加Host子容器，且没有父容器。

**3、** org.apache.catalina.Host主机接口；

一个Tomcat部署使用ContextConfig来配置上下文，必须有一个主机。

**4、** org.apache.catalina.Context；

一个context在容器中表示一个web应用。一个context通常含有一个或多个包装器作为其子容器。

**5、** org.apache.catalina.Wrapper包装器接口，一个包装器是表示一个独立servlet定义的容器；

包装器的实现类负责管理其下层servlet的生命周期，包括servlet的init,service和destroy方法。由于包装器是最底层的容器，所以不可以将子容器添加给它，如果addChild方法被调用的时候会产生IllegalArgumantException 异常。

包装器接口中重要方法:

```java
//allocate方法负责定位该包装器表示的servlet的实例。Allocate 方法必须考虑一个 servlet 是否实现了javax.servlet.SingleThreadModel 接口，该部分内容将会在 11 章中进行讨论。
public Servlet allocate() throws ServletException;
//load方法负责load和初始化servlet的实例。
public void load() throws ServletException;
```

## 二、流水线任务相关接口

**1、** org.apache.catalina.Pipeline流水线接口,流水线接口允许你添加一个新的阀门或者删除一个阀门.；

```java
package org.apache.catalina;
import java.util.Set;
public interface Pipeline {
    public Valve getBasic();//得到基本阀门 最后被唤醒的基本阀门，负责处理 request 和回复 response
    public void setBasic(Valve valve);//分配一个基本阀门给流水线
    public void addValve(Valve valve);
    public Valve[] getValves();
    public void removeValve(Valve valve);
    public Valve getFirst();
    public boolean isAsyncSupported();
    public Container getContainer();
    public void setContainer(Container container);
    public void findNonAsyncValves(Set<String> result);
}
```

**2、** org.apache.catalina.Valve阀门接口,阀门接口表示一个阀门，该组件负责处理请求；

```java
package org.apache.catalina;
import java.io.IOException;
import javax.servlet.ServletException;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
public interface Valve {
    public Valve getNext();
    public void setNext(Valve valve);
    public void backgroundProcess();
    //invoke唤醒流水线的阀门
    public void invoke(Request request, Response response) throws IOException, ServletException;
    public boolean isAsyncSupported();
}
```

**3、** org.apache.catalina.Contained接口:；

一个阀门可以选择性的实现org.apache.catalina.Contained 接口。该接口定义了其实现类跟一个容器相关联。

```java
package org.apache.catalina;
public interface Contained {
    Container getContainer();
    void setContainer(Container container);
}
```

## 三、容器具体实现

**1、** org.apache.catalina.core.ContainerBase；

**2、** org.apache.catalina.core.StandardEngineEngine接口标准实现类；

```java
public class StandardEngine extends ContainerBase implements Engine {
    //构造函数
    public StandardEngine() {
        //设置基础阀门StandardEngineValve
        pipeline.setBasic(new StandardEngineValve());
        ...
    }
    ......
}
//StandardEngine阀门定义以及invoke执行方法
final class StandardEngineValve extends ValveBase {
    .....
    @Override
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        Host host = request.getHost();
        ......
        host.getPipeline().getFirst().invoke(request, response);
    }
    ....
}
```

**3、** org.apache.catalina.core.StandardHostHost接口标准实现类；

```java
public class StandardHost extends ContainerBase implements Host {
    //构造函数
    public StandardHost() {
        super();
        //设置基础阀门StandardHostValve
        pipeline.setBasic(new StandardHostValve());
    }
    ....
}
//基础阀门StandardHostValve
final class StandardHostValve extends ValveBase {
    @Override
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        Context context = request.getContext();
        ....
        boolean asyncAtStart = request.isAsync();
        try {
            context.bind(Globals.IS_SECURITY_ENABLED, MY_CLASSLOADER);
            if (!asyncAtStart && !context.fireRequestInitEvent(request.getRequest())) {
                return;
            }
            try {
                if (!response.isErrorReportRequired()) {
                    context.getPipeline().getFirst().invoke(request, response);
                }
            } catch (Throwable t) {
                ExceptionUtils.handleThrowable(t);
                container.getLogger().error("Exception Processing " + request.getRequestURI(), t);
                if (!response.isErrorReportRequired()) {
                    request.setAttribute(RequestDispatcher.ERROR_EXCEPTION, t);
                    throwable(request, response, t);
                }
            }
            response.setSuspended(false);
            Throwable t = (Throwable) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
            if (!context.getState().isAvailable()) {
                return;
            }
            if (response.isErrorReportRequired()) {
                AtomicBoolean result = new AtomicBoolean(false);
                response.getCoyoteResponse().action(ActionCode.IS_IO_ALLOWED, result);
                if (result.get()) {
                    if (t != null) {
                        throwable(request, response, t);
                    } else {
                        status(request, response);
                    }
                }
            }
            if (!request.isAsync() && !asyncAtStart) {
                context.fireRequestDestroyEvent(request.getRequest());
            }
        } finally {
            if (ACCESS_SESSION) {
                request.getSession(false);
            }
            context.unbind(Globals.IS_SECURITY_ENABLED, MY_CLASSLOADER);
        }
    }
}
```

**4、** org.apache.catalina.core.StandardContextContext接口标准实现类；

```java
public class StandardContext extends ContainerBase implements Context, NotificationEmitter {
    public StandardContext() {
        super();
        pipeline.setBasic(new StandardContextValve());//设置基础阀门StandardContextValve
        broadcaster = new NotificationBroadcasterSupport();
        if (!Globals.STRICT_SERVLET_COMPLIANCE) {
            resourceOnlyServlets.add("jsp");
        }
    }
    ....
}
final class StandardContextValve extends ValveBase {
    @Override
    public final void invoke(Request request, Response response)throws IOException, ServletException {
        Wrapper wrapper = request.getWrapper();
        .....
        wrapper.getPipeline().getFirst().invoke(request, response);
    }
}
```

**5、** org.apache.catalina.core.StandardWrapper包装器标准实现类；

StandardWrapper主要职责加载它表示的 servlet 并分配它的一个实例。

该StandardWrapper不会调用servlet的service方法。这个任务留给StandardWrapperValve对象，StandardWrapper实例的基本阀门管道。

StandardWrapperValve对象通过调用StandardWrapper的allocate 方法获得Servlet 实例。在获得 Servlet 实例之后的 StandardWrapperValve 调用 servlet的service方法，在 servlet 第一次被请求的时候，StandardWrapper 加载 servlet 类。

它是动态的加载servlet，所以需要知道 servlet 类的完全限定名称。通过StandardWrapper 类的 setServletClass 方法将 servlet 的类名传递给StandardWrapper。另外，使用 setName 方法也可以传递 servlet 名。

```java
public class StandardWrapper extends ContainerBase implements ServletConfig, Wrapper, NotificationEmitter {
    //构造函数
    public StandardWrapper() {
        super();
        swValve=new StandardWrapperValve();
        pipeline.setBasic(swValve);//设置基础阀门StandardWrapperValve
        broadcaster = new NotificationBroadcasterSupport();
    }
    @Override
    public Servlet allocate() throws ServletException {
        if (unloading) {
            throw new ServletException(sm.getString("standardWrapper.unloading", getName()));
        }
        boolean newInstance = false;
        // If not SingleThreadedModel, return the same instance every time
        if (!singleThreadModel) {
            if (instance == null || !instanceInitialized) {
                synchronized (this) {
                    if (instance == null) {
                        try {
                            if (log.isDebugEnabled()) {
                                log.debug("Allocating non-STM instance");
                            }
                            instance = loadServlet();
                            newInstance = true;
                            if (!singleThreadModel) {
                                countAllocated.incrementAndGet();
                            }
                        } catch (ServletException e) {
                            throw e;
                        } catch (Throwable e) {
                            ExceptionUtils.handleThrowable(e);
                            throw new ServletException(sm.getString("standardWrapper.allocate"), e);
                        }
                    }
                    if (!instanceInitialized) {
                        initServlet(instance);//初始化
                    }
                }
            }
            if (singleThreadModel) {
                if (newInstance) {
                    synchronized (instancePool) {
                        instancePool.push(instance);
                        nInstances++;
                    }
                }
            } else {
                .....
                if (!newInstance) {
                    countAllocated.incrementAndGet();
                }
                return instance;
            }
        }
        synchronized (instancePool) {
            while (countAllocated.get() >= nInstances) {
                if (nInstances < maxInstances) {
                    try {
                        instancePool.push(loadServlet());
                        nInstances++;
                    } catch (ServletException e) {
                        ....
                    } catch (Throwable e) {
                        ....
                    }
                } else {
                    try {
                        instancePool.wait();
                    } catch (InterruptedException e) {
                    }
                }
            }
            countAllocated.incrementAndGet();
            return instancePool.pop();
        }
    }
    //加载servlet
    public synchronized Servlet loadServlet() throws ServletException {
        ....
        Servlet servlet;
        try {
            .....
            InstanceManager instanceManager = ((StandardContext)getParent()).getInstanceManager();
            try {
                servlet = (Servlet) instanceManager.newInstance(servletClass);//实例化Servlet
            } catch (ClassCastException e) {
                ....
            } catch (Throwable e) {
                .....
            }
            .......
            //对于实现SingleThreadModel接口的Servlet的处理
            if (servlet instanceof SingleThreadModel) {
                if (instancePool == null) {
                    instancePool = new Stack<>();
                }
                singleThreadModel = true;
            }
            initServlet(servlet);
            fireContainerEvent("load", this);
        } finally {
            .....
        }
        return servlet;
    }
    .....
}
final class StandardWrapperValve extends ValveBase {
    @Override
    public final void invoke(Request request, Response response) throws IOException, ServletException {
        ....
        //获取StandardWrapper
        StandardWrapper wrapper = (StandardWrapper) getContainer();
        Servlet servlet = null;
        //获取Context
        Context context = (Context) wrapper.getParent();
        ....
        try {
            if (!unavailable) {
                //调用StandardWrapper的allocate的方法来获得一个servlet实例 
                servlet = wrapper.allocate();
            }
        } catch (UnavailableException e) {
            ....
        } catch (ServletException e) {
            ...
        } catch (Throwable e) {
            ...
        }
        ...
        //调用它的 private createFilterChain 方法获得过滤链
        ApplicationFilterChain filterChain = ApplicationFilterFactory.createFilterChain(request, wrapper, servlet);
        try {
            if ((servlet != null) && (filterChain != null)) {
                if (context.getSwallowOutput()) {
                    try {
                        SystemLogHandler.startCapture();
                        if (request.isAsyncDispatching()) {
                            request.getAsyncContextInternal().doInternalDispatch();
                        } else {
                            //调用过滤器链的 doFilter 方法。包括调用servlet的service方法
                            filterChain.doFilter(request.getRequest(),response.getResponse());
                        }
                    } finally {
                        ...
                    }
                } else {
                    ...
                }
            }
        } catch (ClientAbortException | CloseNowException e) {
            ...
        } catch (IOException e) {
            ...
        } catch (UnavailableException e) {
            ...
        } catch (ServletException e) {
            ...
        } catch (Throwable e) {
            ...
        } finally {
            if (filterChain != null) {
                //释放过滤器链 
                filterChain.release();
            }
            try {
                if (servlet != null) {
                    //调用包装器的 deallocate 方法
                    wrapper.deallocate(servlet);
                }
            } catch (Throwable e) {
                ...
            }
            try {
                if ((servlet != null) &&
                    (wrapper.getAvailable() == Long.MAX_VALUE)) {
                    //如果 Servlet 无法使用了，调用包装器的 unload 方法
                    wrapper.unload();
                }
            } catch (Throwable e) {
                ...
            }
            ...
        }
    }
}
```

StandardWrapperFacade：StandardWrapper 需要对 Servlet 隐藏他的大多数 public方法。为了实现这一点，StandardWraper 将它自己包装的一个StandardWrapperFacade 实例
