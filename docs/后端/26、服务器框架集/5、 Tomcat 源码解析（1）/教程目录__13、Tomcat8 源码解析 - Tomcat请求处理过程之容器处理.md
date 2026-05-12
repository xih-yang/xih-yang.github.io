# 13、Tomcat8 源码解析 - Tomcat请求处理过程之容器处理
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/13.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

## 一、请求流程关键代码

```java
public class CoyoteAdapter implements Adapter {
    ...
    @Override
    public void service(org.apache.coyote.Request req, org.apache.coyote.Response res)
            throws Exception {
            ...
connector.getService()   //StandardService
         .getContainer() //StandardEngine
         .getPipeline()  //StandardPipeline
         .getFirst()     //StandardEngineValve
         .invoke(request, response);
         ...
         }
}
final class StandardEngineValve extends ValveBase {
        ...
    @Override
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        Host host = request.getHost();
        ....
        host           //StandardHost
        .getPipeline() //StandardPipeline
        .getFirst()    //AccessLogValve、ErrorReportValve、StandardHostValve
        .invoke(request, response);
    }
    ...
}
final class StandardHostValve extends ValveBase {
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        Context context = request.getContext();
        ....
        try {
            context.bind(Globals.IS_SECURITY_ENABLED, MY_CLASSLOADER);
            if (!asyncAtStart && !context.fireRequestInitEvent(request.getRequest())) {
                return;
            }
            try {
                if (!response.isErrorReportRequired()) {
                    context         //StandardContext
                    .getPipeline()  //StandardPipeline
                    .getFirst()     //AuthenticatorBase、StandardContextValve
                    .invoke(request, response);
                }
            } catch (Throwable t) {
                ...
            }
            ...
            if (!request.isAsync() && !asyncAtStart) {
                context.fireRequestDestroyEvent(request.getRequest());
            }
        } finally {
            ....
            context.unbind(Globals.IS_SECURITY_ENABLED, MY_CLASSLOADER);
        }
    }
    ...
}
final class StandardContextValve extends ValveBase {
    ...
    @Override
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        ...
        Wrapper wrapper = request.getWrapper();
        ...
        wrapper         //StandardWrapper
        .getPipeline()  //StandardPipeline
        .getFirst()     //StandardWrapperValve
        .invoke(request, response);
    }
}    
final class StandardWrapperValve  extends ValveBase {
    ...
    @Override
    public final void invoke(Request request, Response response)
        throws IOException, ServletException {
        ...
        StandardWrapper wrapper = (StandardWrapper) getContainer();
        Servlet servlet = null;
        Context context = (Context) wrapper.getParent();
        ...
        // Allocate a servlet instance to process this request
        try {
            if (!unavailable) {
                //调用StandardWrapper的allocate的方法来获得一个servlet实例 
                servlet = wrapper.allocate();
            }
        } catch (UnavailableException e) {
            ...
        } catch (ServletException e) {
            ...
        } catch (Throwable e) {
            ...
        }
        ...
        //调用它的 private createFilterChain 方法获得过滤链
        ApplicationFilterChain filterChain = ApplicationFilterFactory.createFilterChain(request, wrapper, servlet);
        // Call the filter chain for this request
        // NOTE: This also calls the servlet's service() method
        try {
            if ((servlet != null) && (filterChain != null)) {
                // Swallow output if needed
                if (context.getSwallowOutput()) {
                    try {
                        SystemLogHandler.startCapture();
                        if (request.isAsyncDispatching()) {
                            request.getAsyncContextInternal().doInternalDispatch();
                        } else {
                            //调用过滤器链的 doFilter 方法。 包括调用 servlet 的 service方法
                            filterChain.doFilter(request.getRequest(),response.getResponse());
                        }
                    } finally {
                        String log = SystemLogHandler.stopCapture();
                        if (log != null && log.length() > 0) {
                            context.getLogger().info(log);
                        }
                    }
                } else {
                    if (request.isAsyncDispatching()) {
                        request.getAsyncContextInternal().doInternalDispatch();
                    } else {
                        //最终会调用Servlet的service方法
                        filterChain.doFilter(request.getRequest(), response.getResponse());
                    }
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
            // Release the filter chain (if any) for this request
            if (filterChain != null) {
                filterChain.release();
            }
            // Deallocate the allocated servlet instance
            try {
                if (servlet != null) {
                    wrapper.deallocate(servlet);
                }
            } catch (Throwable e) {
                ...
            }
            // If this servlet has been marked permanently unavailable,
            // unload it and release this instance
            try {
                if ((servlet != null) &&
                    (wrapper.getAvailable() == Long.MAX_VALUE)) {
                    wrapper.unload();
                }
            } catch (Throwable e) {
                ...
            }
            ...
        }
    }
}
//加载Servlet
public class StandardWrapper extends ContainerBase implements ServletConfig, Wrapper, NotificationEmitter {
    @Override
    public Servlet allocate() throws ServletException {
        ...
        // If not SingleThreadedModel, return the same instance every time
        if (!singleThreadModel) {
            // Load and initialize our instance if necessary
            if (instance == null || !instanceInitialized) {
                synchronized (this) {
                    if (instance == null) {
                        try {
                            if (log.isDebugEnabled()) {
                                log.debug("Allocating non-STM instance");
                            }
                            instance = loadServlet();//加载Servelt
                            newInstance = true;
                            if (!singleThreadModel) {
                                countAllocated.incrementAndGet();
                            }
                        } catch (ServletException e) {
                            ...
                        } catch (Throwable e) {
                            ...
                        }
                    }
                    if (!instanceInitialized) {
                        initServlet(instance);//调用Servlet初始化方法
                    }
                }
            }
            ...
        }
        synchronized (instancePool) {
            while (countAllocated.get() >= nInstances) {
                if (nInstances < maxInstances) {
                    try {
                        instancePool.push(loadServlet());
                        nInstances++;
                    } catch (ServletException e) {
                        throw e;
                    } catch (Throwable e) {
                        ExceptionUtils.handleThrowable(e);
                        throw new ServletException(sm.getString("standardWrapper.allocate"), e);
                    }
                } else {
                    try {
                        instancePool.wait();
                    } catch (InterruptedException e) {
                    }
                }
            }
            if (log.isTraceEnabled()) {
                log.trace("  Returning allocated STM instance");
            }
            countAllocated.incrementAndGet();
            return instancePool.pop();
        }
    }
    public synchronized Servlet loadServlet() throws ServletException {
        ...
        Servlet servlet;
        try {
            ....
            InstanceManager instanceManager = ((StandardContext)getParent()).getInstanceManager();
            try {
                servlet = (Servlet) instanceManager.newInstance(servletClass);//根据全限定名将Servlet实例化
            } catch (ClassCastException e) {
                ...
            } catch (Throwable e) {
                ...
            }
            ...
            initServlet(servlet);//调用Servlet初始化方法
            fireContainerEvent("load", this);
            loadTime=System.currentTimeMillis() -t1;
        } finally {
            ...
        }
        return servlet;
    }
    private synchronized void initServlet(Servlet servlet) throws ServletException {
        ...
        try {
            if( Globals.IS_SECURITY_ENABLED) {
                boolean success = false;
                try {
                    Object[] args = new Object[] { facade };
                    SecurityUtil.doAsPrivilege("init",
                                               servlet,
                                               classType,
                                               args);
                    success = true;
                } finally {
                    if (!success) {
                        // destroy() will not be called, thus clear the reference now
                        SecurityUtil.remove(servlet);
                    }
                }
            } else {
                servlet.init(facade);//调用servlet init方法 传递封装的请求对象
            }
            instanceInitialized = true;
        } catch (UnavailableException f) {
            ...
        } catch (ServletException f) {
            ...
        } catch (Throwable f) {
            ...
        }
    }
}
//调用链  最终执行Servlet的Service方法
public final class ApplicationFilterChain implements FilterChain {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response)
        throws IOException, ServletException {
        if( Globals.IS_SECURITY_ENABLED ) {
            final ServletRequest req = request;
            final ServletResponse res = response;
            try {
                java.security.AccessController.doPrivileged(
                    new java.security.PrivilegedExceptionAction<Void>() {
                        @Override
                        public Void run()
                            throws ServletException, IOException {
                            internalDoFilter(req,res);
                            return null;
                        }
                    }
                );
            } catch( PrivilegedActionException pe) {
                ...
            }
        } else {
            internalDoFilter(request,response);
        }
    }
    private void internalDoFilter(ServletRequest request,
                                  ServletResponse response)
        throws IOException, ServletException {
        if (pos < n) {
            ApplicationFilterConfig filterConfig = filters[pos++];
            try {
                Filter filter = filterConfig.getFilter();
                if (request.isAsyncSupported() && "false".equalsIgnoreCase(
                        filterConfig.getFilterDef().getAsyncSupported())) {
                    request.setAttribute(Globals.ASYNC_SUPPORTED_ATTR, Boolean.FALSE);
                }
                if( Globals.IS_SECURITY_ENABLED ) {
                    final ServletRequest req = request;
                    final ServletResponse res = response;
                    Principal principal =
                        ((HttpServletRequest) req).getUserPrincipal();
                    Object[] args = new Object[]{req, res, this};
                    SecurityUtil.doAsPrivilege ("doFilter", filter, classType, args, principal);
                } else {
                    filter.doFilter(request, response, this);
                }
            } catch (IOException | ServletException | RuntimeException e) {
                throw e;
            } catch (Throwable e) {
                e = ExceptionUtils.unwrapInvocationTargetException(e);
                ExceptionUtils.handleThrowable(e);
                throw new ServletException(sm.getString("filterChain.filter"), e);
            }
            return;
        }
        // We fell off the end of the chain -- call the servlet instance
        try {
            if (ApplicationDispatcher.WRAP_SAME_OBJECT) {
                lastServicedRequest.set(request);
                lastServicedResponse.set(response);
            }
            if (request.isAsyncSupported() && !servletSupportsAsync) {
                request.setAttribute(Globals.ASYNC_SUPPORTED_ATTR,
                        Boolean.FALSE);
            }
            // Use potentially wrapped request from this point
            if ((request instanceof HttpServletRequest) &&
                    (response instanceof HttpServletResponse) &&
                    Globals.IS_SECURITY_ENABLED ) {
                final ServletRequest req = request;
                final ServletResponse res = response;
                Principal principal =
                    ((HttpServletRequest) req).getUserPrincipal();
                Object[] args = new Object[]{req, res};
                SecurityUtil.doAsPrivilege("service",
                                           servlet,
                                           classTypeUsedInService,
                                           args,
                                           principal);
            } else {
                servlet.service(request, response);//执行Servlet的Service方法
            }
        } catch (IOException | ServletException | RuntimeException e) {
            ...
        } catch (Throwable e) {
            ...
        } finally {
            ...
        }
    }
}    
```

Servlet执行结束之后的逻辑：

```java
public class CoyoteAdapter implements Adapter {
    @Override
    public void service(org.apache.coyote.Request req, org.apache.coyote.Response res)
            throws Exception {
        ....
        try {
            postParseSuccess = postParseRequest(req, request, res, response);
            if (postParseSuccess) {
                //check valves if we support async
                request.setAsyncSupported(
                        connector.getService().getContainer().getPipeline().isAsyncSupported());
                // Calling the container
                connector.getService().getContainer().getPipeline().getFirst().invoke(request, response);//Servlet调用链
            }
            if (request.isAsync()) {
                ...
            } else {
                //执行以下两个方法 就会将输出信息刷到浏览器进行渲染
                request.finishRequest();
                response.finishResponse();
            }
        } catch (IOException e) {
        } finally {
            ....
            // 记录访问日志
            if (!async && postParseSuccess) {
                Context context = request.getContext();
                Host host = request.getHost();
                long time = System.currentTimeMillis() - req.getStartTime();
                if (context != null) {
                    context.logAccess(request, response, time, false);
                } else if (response.isError()) {
                    if (host != null) {
                        host.logAccess(request, response, time, false);
                    } else {
                        connector.getService().getContainer().logAccess(
                                request, response, time, false);
                    }
                }
            }
            req.getRequestProcessor().setWorkerThreadName(null);
            ...
        }
    }
    ...
}
```

## 二、测试Demo

**1、** Demo目录；

**2、** 关键代码；

servlet:

```java
package com.test;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
public class HelloWorld extends HttpServlet {
    private static final long serialVersionUID = 1L;
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        System.err.println("HelloWorld  doGet");
        doPost(request, response);
    }
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        System.err.println("HelloWorld  doPost");
        String name = request.getParameter("name"); //获取jsp页面传过来的参数
        String pwd = request.getParameter("pwd");
        String sex = request.getParameter("sex");
        String home = request.getParameter("home");
        String info = request.getParameter("info");
        //request.setAttribute("username", name);  //向request域中放置参数
        //request.getRequestDispatcher("/denglu.jsp").forward(request, response);  //转发到登录页面
        response.sendRedirect("hello.jsp");//重定向到首页
    }
}
```

```java
package com.test;
import java.io.IOException;
import javax.servlet.Servlet;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;
public class Index implements Servlet{
    @Override
    public void init(ServletConfig paramServletConfig) throws ServletException {
        System.out.println("Index Servlet init");
    }
    @Override
    public void service(ServletRequest paramServletRequest, ServletResponse paramServletResponse)
            throws ServletException, IOException {
        System.out.println("Index Servlet service");
        HttpServletResponse res = (HttpServletResponse)paramServletResponse;
        res.sendRedirect("index.jsp");//重定向到首页
    }
    @Override
    public ServletConfig getServletConfig() {
        System.out.println("Index Servlet getServletConfig");
        return null;
    }
    @Override
    public String getServletInfo() {
        System.out.println("Index Servlet getServletInfo");
        return null;
    }
    @Override
    public void destroy() {
        System.out.println("Index Servlet destroy");
    }
}
```

web.xml：

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://xmlns.jcp.org/xml/ns/javaee" xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd" id="WebApp_ID" version="3.1">
  <display-name>WebDemo</display-name>
  <servlet>
      <servlet-name>index</servlet-name>
      <servlet-class>com.test.Index</servlet-class>
  </servlet>
  <servlet>
      <servlet-name>hello</servlet-name>
      <servlet-class>com.test.HelloWorld</servlet-class>
  </servlet>
  <servlet-mapping>
      <servlet-name>index</servlet-name>
      <url-pattern>/index</url-pattern>
  </servlet-mapping>
  <servlet-mapping>
      <servlet-name>hello</servlet-name>
      <url-pattern>/hello</url-pattern>
  </servlet-mapping>
  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
    <welcome-file>index.htm</welcome-file>
    <welcome-file>index.jsp</welcome-file>
    <welcome-file>default.html</welcome-file>
    <welcome-file>default.htm</welcome-file>
    <welcome-file>default.jsp</welcome-file>
  </welcome-file-list>
</web-app>
```

jsp：

```java
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Insert title here</title>
</head>
<body>首页
</body>
</html>
```

**3、** 部署路径；

```java
<?xml version="1.0" encoding="UTF-8"?>
<Server port="8005" shutdown="SHUTDOWN">
  <Listener className="org.apache.catalina.startup.VersionLoggerListener" />
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />
  <GlobalNamingResources>
    <Resource name="UserDatabase" auth="Container"
              type="org.apache.catalina.UserDatabase"
              description="User database that can be updated and saved"
              factory="org.apache.catalina.users.MemoryUserDatabaseFactory"
              pathname="conf/tomcat-users.xml" />
  </GlobalNamingResources>
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
    <Engine name="Catalina" defaultHost="localhost">
      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
               resourceName="UserDatabase"/>
      </Realm>
      <Host name="localhost"  appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t "%r" %s %b" />
        <Context docBase="E:\workspace\mot\WebDemo\web" 
            path="/WebDemo" reloadable="true" />
      </Host>
    </Engine>
  </Service>
</Server>
```

**4、** 调试打印；

请求：[http://localhost:8080/WebDemo/index](http://localhost:8080/WebDemo/index)

控制台输出：

```java
Index Servlet init
Index Servlet service
```
