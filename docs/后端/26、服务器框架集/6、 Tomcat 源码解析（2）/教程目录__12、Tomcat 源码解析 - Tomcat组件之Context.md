# 12、Tomcat 源码解析 - Tomcat组件之Context
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/12.html
- 分类：服务器框架
- 分组：教程目录
上篇我们知道deployApps方法，Context可以在这里创建，现在看下相关代码片段

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
protected void deployDirectory(ContextName cn, File dir) {
     ………….
//或者由配置了Context.xml用Digester解析得到，如果Context标签没有指定className，默认也是org.apache.catalina.core.StandardContext
context = (Context) digester.parse(xml);
………………..
//或者用反射创建context，context默认是org.apache.catalina.core.StandardContext
context = (Context) Class.forName(contextClass).newInstance();
//host标签没有配置ConfigClass属性的话，默认是org.apache.catalina.startup.ContextConfig，这个是重点，解析配置信息的代码都在ContextConfig
            Class<?> clazz = Class.forName(host.getConfigClass());
            LifecycleListener listener =
                (LifecycleListener) clazz.newInstance();
            context.addLifecycleListener(listener);
            context.setName(cn.getName());
            context.setPath(cn.getPath());
            context.setWebappVersion(cn.getVersion());
            context.setDocBase(cn.getBaseName());
//之前看过ContainerBase，addChild如果child是Container则调用Container的start方法，Context就是在这里启动的
            host.addChild(context);
      …………………
```

所以现在看StandardContext，观察Context和StandardContext可以看到基本上都是一系列的get set方法，前面分析我们知道这些可以是Context标签的属性值，用Digester配置解析来赋值，跟之前的Container一样，Context的构造方法也是会添加basicvalve，跟请求相关的后面分析，注意这里没有指定backgroundProcessorDelay 的值，所以Context的 Child的backgroundProcess不会被执行.

```java
public StandardContext() {
        super();
        pipeline.setBasic(new StandardContextValve());
        broadcaster = new NotificationBroadcasterSupport();
        if (!Globals.STRICT_SERVLET_COMPLIANCE) {
            resourceOnlyServlets.add("jsp");
        }
}
```

上面添加看到context.addLifecycleListener(listener)，上篇我们讲到HostConfig(LifeCycleListener)，Host的主要逻辑是在HostConfig的事件回调方法里面来执行的，同样Context的主要逻辑也是在ContextConfig里面，稍后分析ContextConfig。

在Server.xml里面我们可以不用配置Context标签，上面deployApps方法会解析webapps里面的war、directory或者host里配置的ConfigBaseFile 属性指定的文件夹下配置的xml来创建【deployApps(webapps(war、directory)和ConfigBaseFile下的xml文件)】

也可以在Server.xml解析配置Context标签来创建Context，现在来看下Catalina的createStartDigester里面Context的部分，看源码可以知道跟Context相关的rule是ContextRuleSet 现在看下ContextRuleSet 的addRuleInstances 方法

```java
public void addRuleInstances(Digester digester) {
        if (create) {
//创建StandardContext对象
            digester.addObjectCreate(prefix + "Context",
                    "org.apache.catalina.core.StandardContext", "className");
//设置Context标签属性给StandardContext对象
            digester.addSetProperties(prefix + "Context");
        } else {
            digester.addRule(prefix + "Context", new SetContextPropertiesRule());
        }
        if (create) {
    //创建ContextConfig对象
digester.addRule(prefix + "Context",
                             new LifecycleListenerRule
                   ("org.apache.catalina.startup.ContextConfig",
                                  "configClass"));
//调用Host的addChild方法传入StandardContext
            digester.addSetNext(prefix + "Context",
                                "addChild",
                                "org.apache.catalina.Container");
        }
//解析到Listener标签，用className值通过反射创建Listener对象
        digester.addObjectCreate(prefix + "Context/Listener",
                                 null, // MUST be specified in the element
                                 "className");
//设置Listener标签属性给Listener对象
        digester.addSetProperties(prefix + "Context/Listener");
//调用Context的addLifecycleListener方法添加
        digester.addSetNext(prefix + "Context/Listener",
                            "addLifecycleListener",
                        "org.apache.catalina.LifecycleListener");
//解析到Loader标签，创建WebappLoader对象
        digester.addObjectCreate(prefix + "Context/Loader",
                "org.apache.catalina.loader.WebappLoader",
                            "className");
//设置Loader标签的属性给WebappLoader对象
        digester.addSetProperties(prefix + "Context/Loader");
//调用Context对象setLoader方法，传入对象WebappLoader
        digester.addSetNext(prefix + "Context/Loader",
                            "setLoader",
                            "org.apache.catalina.Loader");
//解析到Manager，创建对象StandardManager
        digester.addObjectCreate(prefix + "Context/Manager",                               "org.apache.catalina.session.StandardManager",
                                 "className");
//设置Manager标签的属性给StandardManager
        digester.addSetProperties(prefix + "Context/Manager");
//调用Context对象的setManager 传入StandardManager
        digester.addSetNext(prefix + "Context/Manager",
                            "setManager",
                            "org.apache.catalina.Manager");
//解析到Manager/Store，通过className反射创建对象
        digester.addObjectCreate(prefix + "Context/Manager/Store",
                                 null, // MUST be specified in the element
                                 "className");
//设置Store标签属性值给className创建的对象
        digester.addSetProperties(prefix + "Context/Manager/Store");
//调用Manager对象的方法setStore，传入className创建的对象
        digester.addSetNext(prefix + "Context/Manager/Store",
                            "setStore",
                            "org.apache.catalina.Store");
//解析到Manager/ SessionIdGenerator的时候创建对象StandardSessionIdGenerator，如果有指定了className属性，则用className的值反射创建
        digester.addObjectCreate(prefix + "Context/Manager/SessionIdGenerator",
       "org.apache.catalina.util.StandardSessionIdGenerator",
                                 "className");
//设置SessionIdGenerator标签属性值给StandardSessionIdGenerator对象
        digester.addSetProperties(prefix + "Context/Manager/SessionIdGenerator");
//调用Manager的setSessionIdGenerator方法，传入StandardSessionIdGenerator对象
        digester.addSetNext(prefix + "Context/Manager/SessionIdGenerator",
                            "setSessionIdGenerator",
             "org.apache.catalina.SessionIdGenerator");
//解析到Parameter标签的时候，创建对象ApplicationParameter
        digester.addObjectCreate(prefix + "Context/Parameter",
            "org.apache.tomcat.util.descriptor.web.ApplicationParameter");
//设置标签属性给ApplicationParameter对象
        digester.addSetProperties(prefix + "Context/Parameter");
//调用Context的addApplicationParameter方法，传入ApplicationParameter对象
        digester.addSetNext(prefix + "Context/Parameter",
                            "addApplicationParameter",                      "org.apache.tomcat.util.descriptor.web.ApplicationParameter");
//Realm相关，后面再分析
        digester.addRuleSet(new RealmRuleSet(prefix + "Context/"));
//解析到Resources标签，创建对象StandardRoot
        digester.addObjectCreate(prefix + "Context/Resources",
                                 "org.apache.catalina.webresources. StandardRoot ",
                                 "className");
//设置Resources标签的属性值给StandardRoot对象
        digester.addSetProperties(prefix + "Context/Resources");
//调用Context的setResources方法，传入WebResourceRoot
        digester.addSetNext(prefix + "Context/Resources",
                            "setResources",
                "org.apache.catalina.WebResourceRoot");
//解析到标签Resources/PreResources，通过className指定的类反射创建对象
        digester.addObjectCreate(prefix + "Context/Resources/PreResources",
                                 null, // MUST be specified in the element
                                 "className");
//设置PreResources标签属性的值给className创建的PreResources对象
        digester.addSetProperties(prefix + "Context/Resources/PreResources");
//调用StandardRoot对象的addPreResources方法，传入WebResourceSet对象，PreResources标签className反射创建的对象
        digester.addSetNext(prefix + "Context/Resources/PreResources",
                            "addPreResources",
             "org.apache.catalina.WebResourceSet");
//解析到Resources/JarResources标签，创建对象通过className指定的类反射
        digester.addObjectCreate(prefix + "Context/Resources/JarResources",
                                 null, // MUST be specified in the element
                                 "className");
//解析JarResources标签属性值设置给JarResources对象
        digester.addSetProperties(prefix + "Context/Resources/JarResources");
//调用StandardRoot的方法addJarResources传入WebResourceSet对象
        digester.addSetNext(prefix + "Context/Resources/JarResources",
                            "addJarResources",
                   "org.apache.catalina.WebResourceSet");
//同上Resource相关
        digester.addObjectCreate(prefix + "Context/Resources/PostResources",
                                 null, // MUST be specified in the element
                                 "className");
        digester.addSetProperties(prefix + "Context/Resources/PostResources");
        digester.addSetNext(prefix + "Context/Resources/PostResources",
                            "addPostResources",
                            "org.apache.catalina.WebResourceSet");
        digester.addObjectCreate(prefix + "Context/ResourceLink",
                "org.apache.tomcat.util.descriptor.web.ContextResourceLink");
        digester.addSetProperties(prefix + "Context/ResourceLink");
        digester.addRule(prefix + "Context/ResourceLink",
                new SetNextNamingRule("addResourceLink",                        "org.apache.tomcat.util.descriptor.web.ContextResourceLink"));
//解析到valve，className属性值反射创建对象
        digester.addObjectCreate(prefix + "Context/Valve",
                                 null, // MUST be specified in the element
                                 "className");
//设置valve标签属性值给对象valve
        digester.addSetProperties(prefix + "Context/Valve");
//调用StandardContext对象的addValve，传入创建的valve
        digester.addSetNext(prefix + "Context/Valve",
                            "addValve",
                            "org.apache.catalina.Valve");
//解析到WatchedResource，调用StandardContext对象的addWatchedResource方法，传入WatchedResource标签的context
        digester.addCallMethod(prefix + "Context/WatchedResource", "addWatchedResource", 0);
//解析到WrapperLifecycle，调用StandardContext对象的addWrapperLifecycle方法，传入WrapperLifecycle标签的context
        digester.addCallMethod(prefix + "Context/WrapperLifecycle",   "addWrapperLifecycle", 0);
//解析到WrapperListener，调用StandardContext对象的addWrapperListener方法，传入WrapperListener标签的context
        digester.addCallMethod(prefix + "Context/WrapperListener", "addWrapperListener", 0);
//解析到标签JarScanner，创建对象StandardJarScanner，如果指定了className，则用className属性反射创建对象
        digester.addObjectCreate(prefix + "Context/JarScanner","org.apache.tomcat.util.scan.StandardJarScanner", "className");
//设置JarScanner标签属性给对象StandardJarScanner
digester.addSetProperties(prefix + "Context/JarScanner");
//调用StandardContext的setJarScanner方法，传入StandardJarScanner
digester.addSetNext(prefix + "Context/JarScanner",
                            "setJarScanner",
                            "org.apache.tomcat.JarScanner");
//解析到JarScanner/JarScanFilter，默认创建对象StandardJarScanFilter
  digester.addObjectCreate(prefix + "Context/JarScanner/JarScanFilter",
                                 "org.apache.tomcat.util.scan.StandardJarScanFilter",
                                 "className");
//设置标签JarScanFilter属性值给对象StandardJarScanFilter
        digester.addSetProperties(prefix + "Context/JarScanner/JarScanFilter");
//调用StandardJarScanner对象方法setJarScanFilter传入对象StandardJarScanFilter
        digester.addSetNext(prefix + "Context/JarScanner/JarScanFilter",
                            "setJarScanFilter",
                            "org.apache.tomcat.JarScanFilter");
//解析到CookieProcessor标签，默认创建对象Rfc6265CookieProcessor
        digester.addObjectCreate(prefix + "Context/CookieProcessor",
                     "org.apache.tomcat.util.http.Rfc6265CookieProcessor",
                                 "className");
//设置标签CookieProcessor属性值给对象Rfc6265CookieProcessor
        digester.addSetProperties(prefix + "Context/CookieProcessor");
//调用StandardContext对象的setCookieProcessor 方法，传入Rfc6265CookieProcessor
 digester.addSetNext(prefix + "Context/CookieProcessor",
                            "setCookieProcessor",
    "org.apache.tomcat.util.http.CookieProcessor");
}
```

这上面有很多我们新的类，主流程分析过后，可以慢慢再回来看这些类，这些每个类都代表了tomcat的特殊功能。还有跟Context的一个相关的rule NamingRuleSet，这个以后可以分析。StandardContext的XXXXInternal方法等分析完了ContextConfig再来分析，因为解析一些配置信息都算是在ContextConfig完成。

现在看Context的LifecycleListener ContextConfig，既然是LifecycleListener，就主要看lifecycleEvent，然后看各个回调方法

```java
public void lifecycleEvent(LifecycleEvent event) {
        try {
            context = (Context) event.getLifecycle();
        } catch (ClassCastException e) {
            log.error(sm.getString("contextConfig.cce", event.getLifecycle()), e);
            return;
        }
        if (event.getType().equals(Lifecycle.CONFIGURE_START_EVENT)) {
//一般在beforestart,start之间触发CONFIGURE_START，调用configureStart
            configureStart();
        }else    if 
(event.getType().equals(Lifecycle.BEFORE_START_EVENT)) {
//startInternal调用之前触发BEFORE_START事件，调用beforeStart            
beforeStart();
        }else    if (event.getType().equals(Lifecycle.AFTER_START_EVENT)) {
              if (originalDocBase != null) {
                context.setDocBase(originalDocBase);
            }
        }else    if 
(event.getType().equals(Lifecycle.CONFIGURE_STOP_EVENT)) {
//一般在stop，afterstop之间触发CONFIGURE_STOP，调用configureStop
            configureStop();
        }else    if (event.getType().equals(Lifecycle.AFTER_INIT_EVENT)) {
//initInternal调用完后触发AFTER_INIT事件，调用init            
init();
        }else    if (event.getType().equals(Lifecycle.AFTER_DESTROY_EVENT)) {
//destroyInternal调用完后触发AFTER_DESTROY，调用destroy
            destroy();
        }
}
```

**BEFORE_START_EVENT****事件触发，****beforeStart****方法：**

```java
protected synchronized void beforeStart() {
        try {
//处理docBase，当war的时候，解压war然后重新计算docBase
            fixDocBase();
        } catch (IOException e) {
            log.error(sm.getString(
                    "contextConfig.fixDocBase", context.getName()), e);
        }
//如果Context的属性AntiResourceLocking为true，则会copy docBasefile到
antiLockingDocBase[c:\\user\temp123docBasefile(syste的temp文件夹+ count++ +docbaseFile)]
        antiLocking();
}
```

**CONFIGURE_START_EVENT****事件触发，****configureStart****方法****(****单独分析****)****：**

```java
protected synchronized void configureStart() {
        ………
//解析web相关的配置，这个具体分析
        webConfig();
        if (!context.getIgnoreAnnotations()) {
          //解析annotation，关于servlet、filter和listener
  applicationAnnotationsConfig();
        }
        if (ok) {
            //解析Security相关配置
            validateSecurityRoles();
        }
        if (ok) {
            //解析authenticator相关配置
            authenticatorConfig();
        }
        ……………
        if (ok) {
            //设置配置完成true
            context.setConfigured(true);
        } else {
        log.error(sm.getString("contextConfig.unavailable"));
            context.setConfigured(false);
        }
} 
```

**CONFIGURE_STOP_EVENT****事件触发****configureStop****方法：**

看代码可以发现stop方法里面都是context remove相关元素

**AFTER_INIT_EVENT****事件触发****init****方法（单独分析）：**

```java
protected void init() {
//创建解析Context.xml的Digester
        Digester contextDigester = createContextDigester();
        contextDigester.getParser();
        if (log.isDebugEnabled()) {
            log.debug(sm.getString("contextConfig.init"));
        }
        context.setConfigured(false);
        ok = true;
//解析Context，单独分析
        contextConfig(contextDigester);
    }
```

**AFTER_DESTROY_EVENT****事件触发****destroy****方法：**

```java
protected synchronized void destroy() {
        if (log.isDebugEnabled()) {
        log.debug(sm.getString("contextConfig.destroy"));
        }
       //如果tomcat shutdown的话，不用处理
        Server s = getServer();
        if (s != null && !s.getState().isAvailable()) {
            return;
        }
        // Changed to getWorkPath per Bugzilla 35819.//
//删除workDir，workDir是在StandardContext的startInternal创建的，默认是
CatalinaHomefile\work\enginename\hostname\basename(用-替代分隔符的)，如果host配置了workDir那么workDir是CatalinaHomefile \workDir\basename(用-替代分隔符的)
        if (context instanceof StandardContext) {
            String workDir = ((StandardContext) context).getWorkPath();
            if (workDir != null) {
                ExpandWar.delete(new File(workDir));
            }
        }
    }
```

下篇分析**configureStart** 方法。
