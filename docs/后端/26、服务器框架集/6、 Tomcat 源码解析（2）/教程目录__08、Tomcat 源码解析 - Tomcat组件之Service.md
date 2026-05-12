# 08、Tomcat 源码解析 - Tomcat组件之Service
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/8.html
- 分类：服务器框架
- 分组：教程目录
这篇主要看Lifecycle 继承下的另一个主要组件Service，首先看下我们StandardService的对象链，可以看Catalina里面的createDigester方法和server.xml的对应关系

```java
//解析到Server/Service/Listener,通过className给的属性值创建Listener对象，调用Service的addLifecycleListener方法添加
digester.addObjectCreate("Server/Service/Listener",
                                 null, // MUST be specified in the element
                                 "className");
        digester.addSetProperties("Server/Service/Listener");
        digester.addSetNext("Server/Service/Listener",
                            "addLifecycleListener",
                            "org.apache.catalina.LifecycleListener");
       //同上解析到Server/Service/Executor,如果className屬性指定了值用className值創建Executor对象，如果没有指定，默认创建StandardThreadExecutor，调用Service方法addExecutor添加
        digester.addObjectCreate("Server/Service/Executor",
                         "org.apache.catalina.core.StandardThreadExecutor",
                         "className");
        digester.addSetProperties("Server/Service/Executor");
        digester.addSetNext("Server/Service/Executor",
                            "addExecutor",
                            "org.apache.catalina.Executor");
//使用ConnectorCreateRule规则创建Connector，ConnectorCreateRule具体分析，然后将xml属性设置给Connector对象，除了executor、sslImplementationName和protocol三个属性，然后调用Service上的addConnector添加
        digester.addRule("Server/Service/Connector",
                         new ConnectorCreateRule());
        digester.addRule("Server/Service/Connector", new SetAllPropertiesRule(
                new String[]{"executor", "sslImplementationName", "protocol"}));
        digester.addSetNext("Server/Service/Connector",
                            "addConnector",
                            "org.apache.catalina.connector.Connector");
……………….
// EngineRuleSet解析创建Engine对象，具体分析Engine的时候再对EngineRuleSet具体分析
    digester.addRuleSet(new EngineRuleSet("Server/Service/"));
```

现在具体看下ConnectorCreateRule因为涉及到executor，前面分析我们知道看rule主要看begin或者end方法

```java
public class ConnectorCreateRule extends Rule {
  ………………….
  //解析<connector>调用，得到executor属性从之前添加到service中的executors获得对应的executor，将executor和connector关联，sslImplementationName同理
public void begin(String namespace, String name, Attributes attributes)
            throws Exception {
        Service svc = (Service)digester.peek();
        Executor ex = null;
        if ( attributes.getValue("executor")!=null ) {
            ex = svc.getExecutor(attributes.getValue("executor"));
        }
        Connector con = new Connector(attributes.getValue("protocol"));
        if (ex != null) {
            //将executor和connector关联
            setExecutor(con, ex);
        }
        String sslImplementationName = attributes.getValue("sslImplementationName");
        if (sslImplementationName != null) {
            //将sslImplementationName和connector关联
setSSLImplementationName(con, sslImplementationName);
        }
        digester.push(con);
    }
   ……………….
//解析</connector>调用，创建好connector对象后pop
    public void end(String namespace, String name) throws Exception {
        digester.pop();
    }
}
```

现在StandardService的主要对象链是service包含connectors、executors、engine

```java
public class StandardService extends LifecycleMBeanBase implements Service {
………………….
    protected Connector connectors[] = new Connector[0];
    private final Object connectorsLock = new Object();
………………..
    protected final ArrayList<Executor> executors = new ArrayList<>();
    private Engine engine = null;
private ClassLoader parentClassLoader = null;
//
    protected final Mapper mapper = new Mapper();
    protected final MapperListener mapperListener = new MapperListener(this);
}
```

因为StandardService是Lifecycle 继承连下的对象，结合分析之前Server所以我们现在主要看XXXXInternal方法

initInternal 方法：

```java
protected void initInternal() throws LifecycleException {
        super.initInternal();
        if (engine != null) {
            engine.init();
        }
        // Initialize any Executors
        for (Executor executor : findExecutors()) {
            if (executor instanceof JmxEnabled) {
                ((JmxEnabled) executor).setDomain(getDomain());
            }
            executor.init();
        }
        // Initialize mapper listener
        mapperListener.init();
        // Initialize our defined Connectors
        synchronized (connectorsLock) {
            for (Connector connector : connectors) {
                connector.init();
            }
        }
}
```

很显然就是调用Engine.init的方法，executor的init方法，mapperListener的init方法，和connector的init方法。

startInternal 方法、stopInternal 方法和destroyInternal 方法类似都是调用这几个类相对应的方法，只是stop和destroy调用的顺序跟init和start相反。自己可以去看下代码。

Engine和Connector类都是tomcat核心类要单独用篇幅来分析，现在我们单独看下添加到Service executors里的Executor

我们可以实现我们自己的Executor，配置到server.xml里，给Executor标签属性className，配置了Executor没有指定className，从上面分析service的digester可以看到tomcat将

默认使用org.apache.catalina.core.StandardThreadExecutor,查看源码可以知道首先他封装了ThreadPoolExecutor 线程池，默认是daemon 线程，上面看过他会跟Connector整

合，线程池来执行connector的handle，提高效率，这个到分析connector的时候要重点具体分析。Tips：这个涉及到java的并发这是java的重点内容，通过看tomcat的源码可以学习

到java并发的最好的实例代码。

**总结：**Service组件开始，慢慢进入了tomcat核心部分，注意不是解析http，是tomcat内部工作原理核心部分，service开始同样是调用其他组件方法，service组件起到的是整合engine等核心组件的作用，一个tomcat实例可以有多个service。
