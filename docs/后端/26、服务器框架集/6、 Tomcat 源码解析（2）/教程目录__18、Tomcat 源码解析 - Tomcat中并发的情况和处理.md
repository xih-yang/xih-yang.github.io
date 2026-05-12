# 18、Tomcat 源码解析 - Tomcat中并发的情况和处理
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/18.html
- 分类：服务器框架
- 分组：教程目录
在之前分析的基础上，这篇打算总结一下tomcat里面出现多线程的地方以及tomcat的处理，

先总结一下之前的分析

**tomcat****组件的启动**

从第三篇的分析知道，tomcat的启动是从**bootstrap** 类开始的，当我们启动服务或者启动startup.bat的时候，**bootstrap** 中main方法调用**Catalina** 的load方法和start方法，

Catalina的load方法很重要，load方法中会通过Digester(第四篇分析)工具解析config/Server.xml或者解析在catalinaLoader 搜寻路径下的server-embed.xml，生成一个tomcat的组件对象链，如下图

涉及到tomcat的几个组件包括Server、Service、Engine、Host、Context和Connector

包含关系Server可以包含多个Service，Service包含一个Engine和多个Connector，Engine对应包含一个Host，Host包含多个Context，在tomcat中都有默认的对应实现(StandardXXXX),

其中Connector还有更具体的对象链关系如下图，EndPoint是真正接受客户端socket请求的对象

这是Catalina的load方法，start方法会调用组件Server的start方法，而Server的start方法同样去调用其包含组件的start方法，以此类推。

**Tomcat****组件的停止**

同样bootstrap中的main方法调用Catalina的stopServer，跟start一样，也会去调用对应的包含组件的stop方法，子组件会有不同的处理

**组件主要涉及到多线程的地方**

EndPoint的多线程：

线程Acceptor，接收socket请求，默认是一个EndPoint开一个线程，每个Acceptor默认同时处理10000个连接请求，超过就会等待，用的是LimitLatch技术，下面是代码片段

```java
…………………..
protected int acceptorThreadCount = 1;
……………………
protected final void startAcceptorThreads() {
        int count = getAcceptorThreadCount();
        acceptors = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Acceptor<U> acceptor = new Acceptor<>(this);
            String threadName = getName() + "-Acceptor-" + i;
            acceptor.setThreadName(threadName);
            acceptors.add(acceptor);
            Thread t = new Thread(acceptor, threadName);
            t.setPriority(getAcceptorThreadPriority());
            t.setDaemon(getDaemon());
            t.start();
        }
}
…………………….
//if we have reached max connections, wait
                endpoint.countUpOrAwaitConnection();
……………………
```

对于NioEndPoint会有线程Poller，这个线程处理的是accepter线程获得的socket的读写，下面代码是Poller线程初始化的个数

private int pollerThreadCount = Math.min(2,Runtime.getRuntime().availableProcessors());

Poller线程跟Acceptor线程之间的关联是Acceptor得到的socket，将调用Poller的register方法加进Poller线程来进行处理，通过上篇分析知道最后这个sokcet的调用最后会到StandardEngineValve，后面分析Valve，从而连通socket的处理和tomcat的内核，这个两个线程很重要，也是可以调优的地方。

Host的多线程：

Hostconfig中deployApps方法，deploy会通过ExecutorService和Future技术来完成，在ContainerBase的initInternal中实例化，ExecutorService是ThreadPoolExecutor，代码片段如下

```java
protected void deployApps() {
        File appBase = host.getAppBaseFile();
        File configBase = host.getConfigBaseFile();
        String[] filteredAppPaths = filterAppPaths(appBase.list());
        // Deploy XML descriptors from configBase
        deployDescriptors(configBase, configBase.list());
        // Deploy WARs
        deployWARs(appBase, filteredAppPaths);
        // Deploy expanded folders
        deployDirectories(appBase, filteredAppPaths);
}
```

```java
protected void initInternal() throws LifecycleException {
        BlockingQueue<Runnable> startStopQueue = new LinkedBlockingQueue<>();
        startStopExecutor = new ThreadPoolExecutor(
                getStartStopThreadsInternal(),
                getStartStopThreadsInternal(), 10, TimeUnit.SECONDS,
                startStopQueue,
                new StartStopThreadFactory(getName() + "-startStop-"));
        startStopExecutor.allowCoreThreadTimeOut(true);
        super.initInternal();
}
```

Service的多线程

Service的Executor，server.xml中的配置，代码片段如下：

```java
…………………
protected final ArrayList<Executor> executors = new ArrayList<>();
…………………
public void addExecutor(Executor ex) {
        synchronized (executors) {
            if (!executors.contains(ex)) {
                executors.add(ex);
                if (getState().isAvailable()) {
                    try {
                        ex.start();
                    } catch (LifecycleException x) {
                        log.error("Executor.start", x);
                    }
                }
            }
        }
}
```

当Digester解析的时候，会把Executor设置给protocolHandler，这个executor在Endpoint中processSocket起作用，下面是代码片段：

```java
…………….
private static void setExecutor(Connector con, Executor ex) throws Exception {
        Method m = IntrospectionUtils.findMethod(con.getProtocolHandler().getClass(),"setExecutor",new Class[] {java.util.concurrent.Executor.class});
        if (m!=null) {
            m.invoke(con.getProtocolHandler(), new Object[] {ex});
        }else {
            log.warn(sm.getString("connector.noSetExecutor", con));
        }
}
……………………………
//Endpoint中processSocket
public boolean processSocket(SocketWrapperBase<S> socketWrapper,
            SocketEvent event, boolean dispatch) {
           ………………………….
            if (sc == null) {
                sc = createSocketProcessor(socketWrapper, event);
            } else {
                sc.reset(socketWrapper, event);
            }
            Executor executor = getExecutor();
            if (dispatch && executor != null) {
                executor.execute(sc);
            } else {
                sc.run();
            }
      …………………………….
        Return …………..
    }
```

暂时想到这么多后面随着分析的推动，随时增加。
