# 11、Tomcat8 源码解析 - 部署器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/11.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

**1、** 启动容器；

org.apache.catalina.core.StandardHost::startInternal 启动Host

-->org.apache.catalina.core.ContainerBase::startInternal 父类启动容器

```java
public abstract class ContainerBase extends LifecycleMBeanBase implements Container {
    @Override
    protected synchronized void startInternal() throws LifecycleException {
        ...
        Container children[] = findChildren();
        List<Future<Void>> results = new ArrayList<>();
        for (int i = 0; i < children.length; i++) {
            //使用submit方式提交Callable任务
            results.add(startStopExecutor.submit(new StartChild(children[i])));//[] StandardHost启动时还没有子容器
        }
        MultiThrowable multiThrowable = null;
        for (Future<Void> result : results) {
            try {
                result.get();//异步启动
            } catch (Throwable e) {
                log.error(sm.getString("containerBase.threadedStartFailed"), e);
                if (multiThrowable == null) {
                    multiThrowable = new MultiThrowable();
                }
                multiThrowable.add(e);
            }
        }
        if (multiThrowable != null) {
            throw new LifecycleException(sm.getString("containerBase.threadedStartFailed"),multiThrowable.getThrowable());
        }
        //启动管道任务
        if (pipeline instanceof Lifecycle) {
            ((Lifecycle) pipeline).start();//q
        }
        //修改状态 触发监听事件
        setState(LifecycleState.STARTING);
        ....
    }
    private static class StartChild implements Callable<Void> {
        private Container child;
        public StartChild(Container child) {
            this.child = child;
        }
        @Override
        public Void call() throws LifecycleException {
            child.start();//生命周期-启动
            return null;
        }
    }
    ......
}
public abstract class LifecycleBase implements Lifecycle {
    protected synchronized void setState(LifecycleState state) throws LifecycleException {
        setStateInternal(state, null, true);
    }
    private synchronized void setStateInternal(LifecycleState state, Object data, boolean check)
            throws LifecycleException {
        .....
        this.state = state;
        String lifecycleEvent = state.getLifecycleEvent();
        if (lifecycleEvent != null) {
            fireLifecycleEvent(lifecycleEvent, data);
        }
    }
    protected void fireLifecycleEvent(String type, Object data) {
        LifecycleEvent event = new LifecycleEvent(this, type, data);
        for (LifecycleListener listener : lifecycleListeners) {
            listener.lifecycleEvent(event);//org.apache.catalina.startup.HostConfig
        }
    }
}
```

**2、** 启动监听HostConfig；

org.apache.catalina.startup.HostConfig::start

```java
public class HostConfig implements LifecycleListener {
    public void lifecycleEvent(LifecycleEvent event) {
        // Identify the host we are associated with
        try {
            host = (Host) event.getLifecycle();
            if (host instanceof StandardHost) {
                setCopyXML(((StandardHost) host).isCopyXML());
                setDeployXML(((StandardHost) host).isDeployXML());
                setUnpackWARs(((StandardHost) host).isUnpackWARs());
                setContextClass(((StandardHost) host).getContextClass());
            }
        } catch (ClassCastException e) {
            log.error(sm.getString("hostConfig.cce", event.getLifecycle()), e);
            return;
        }
        // Process the event that has occurred
        if (event.getType().equals(Lifecycle.PERIODIC_EVENT)) {
            check();
        } else if (event.getType().equals(Lifecycle.BEFORE_START_EVENT)) {
            beforeStart();
        } else if (event.getType().equals(Lifecycle.START_EVENT)) {
            start();//启动应用
        } else if (event.getType().equals(Lifecycle.STOP_EVENT)) {
            stop();
        }
    }
    //启动部署应用
    public void start() {
        .....
        if (host.getDeployOnStartup())
            deployApps();
    }
    //部署三种类型应用
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
        //发布XML描述符
    protected void deployDescriptors(File configBase, String[] files) {
        if (files == null)
            return;
        ExecutorService es = host.getStartStopExecutor();
        List<Future<?>> results = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            File contextXml = new File(configBase, files[i]);
            if (files[i].toLowerCase(Locale.ENGLISH).endsWith(".xml")) {
                ContextName cn = new ContextName(files[i], true);
                if (isServiced(cn.getName()) || deploymentExists(cn.getName()))
                    continue;
                results.add(es.submit(new DeployDescriptor(this, cn, contextXml)));
            }
        }
        for (Future<?> result : results) {
            try {
                result.get();
            } catch (Exception e) {
                log.error(sm.getString("hostConfig.deployDescriptor.threaded.error"), e);
            }
        }
    }
    //发布XML描述符
    protected void deployDescriptor(ContextName cn, File contextXml) {
        DeployedApplication deployedApp = new DeployedApplication(cn.getName(), true);
        long startTime = 0;
        if(log.isInfoEnabled()) {
           startTime = System.currentTimeMillis();
           log.info(sm.getString("hostConfig.deployDescriptor",
                    contextXml.getAbsolutePath()));
        }
        Context context = null;
        boolean isExternalWar = false;
        boolean isExternal = false;
        File expandedDocBase = null;
        try (FileInputStream fis = new FileInputStream(contextXml)) {
            synchronized (digesterLock) {
                try {
                    context = (Context) digester.parse(fis);
                } catch (Exception e) {
                    log.error(sm.getString(
                            "hostConfig.deployDescriptor.error",
                            contextXml.getAbsolutePath()), e);
                } finally {
                    digester.reset();
                    if (context == null) {
                        context = new FailedContext();
                    }
                }
            }
            Class<?> clazz = Class.forName(host.getConfigClass());
            LifecycleListener listener = (LifecycleListener) clazz.getConstructor().newInstance();
            context.addLifecycleListener(listener);
            context.setConfigFile(contextXml.toURI().toURL());
            context.setName(cn.getName());
            context.setPath(cn.getPath());
            context.setWebappVersion(cn.getVersion());
            if (context.getDocBase() != null) {
                File docBase = new File(context.getDocBase());
                if (!docBase.isAbsolute()) {
                    docBase = new File(host.getAppBaseFile(), context.getDocBase());
                }
                // If external docBase, register .xml as redeploy first
                if (!docBase.getCanonicalPath().startsWith(
                        host.getAppBaseFile().getAbsolutePath() + File.separator)) {
                    isExternal = true;
                    deployedApp.redeployResources.put(
                            contextXml.getAbsolutePath(),
                            Long.valueOf(contextXml.lastModified()));
                    deployedApp.redeployResources.put(docBase.getAbsolutePath(),
                            Long.valueOf(docBase.lastModified()));
                    if (docBase.getAbsolutePath().toLowerCase(Locale.ENGLISH).endsWith(".war")) {
                        isExternalWar = true;
                    }
                } else {
                    log.warn(sm.getString("hostConfig.deployDescriptor.localDocBaseSpecified",docBase));
                    context.setDocBase(null);
                }
            }
            host.addChild(context);
        } catch (Throwable t) {
            ExceptionUtils.handleThrowable(t);
            log.error(sm.getString("hostConfig.deployDescriptor.error",contextXml.getAbsolutePath()), t);
        } finally {
            expandedDocBase = new File(host.getAppBaseFile(), cn.getBaseName());
            if (context.getDocBase() != null
                    && !context.getDocBase().toLowerCase(Locale.ENGLISH).endsWith(".war")) {
                expandedDocBase = new File(context.getDocBase());
                if (!expandedDocBase.isAbsolute()) {
                    expandedDocBase = new File(host.getAppBaseFile(), context.getDocBase());
                }
            }
            boolean unpackWAR = unpackWARs;
            if (unpackWAR && context instanceof StandardContext) {
                unpackWAR = ((StandardContext) context).getUnpackWAR();
            }
            if (isExternalWar) {
                if (unpackWAR) {
                    deployedApp.redeployResources.put(expandedDocBase.getAbsolutePath(),
                            Long.valueOf(expandedDocBase.lastModified()));
                    addWatchedResources(deployedApp, expandedDocBase.getAbsolutePath(), context);
                } else {
                    addWatchedResources(deployedApp, null, context);
                }
            } else {
                if (!isExternal) {
                    File warDocBase = new File(expandedDocBase.getAbsolutePath() + ".war");
                    if (warDocBase.exists()) {
                        deployedApp.redeployResources.put(warDocBase.getAbsolutePath(),
                                Long.valueOf(warDocBase.lastModified()));
                    } else {
                        deployedApp.redeployResources.put(
                                warDocBase.getAbsolutePath(),
                                Long.valueOf(0));
                    }
                }
                if (unpackWAR) {
                    deployedApp.redeployResources.put(expandedDocBase.getAbsolutePath(),
                            Long.valueOf(expandedDocBase.lastModified()));
                    addWatchedResources(deployedApp,
                            expandedDocBase.getAbsolutePath(), context);
                } else {
                    addWatchedResources(deployedApp, null, context);
                }
                if (!isExternal) {
                    deployedApp.redeployResources.put(
                            contextXml.getAbsolutePath(),
                            Long.valueOf(contextXml.lastModified()));
                }
            }
            addGlobalRedeployResources(deployedApp);
        }
        if (host.findChild(context.getName()) != null) {
            deployed.put(context.getName(), deployedApp);
        }
        if (log.isInfoEnabled()) {
            log.info(sm.getString("hostConfig.deployDescriptor.finished",
                contextXml.getAbsolutePath(), Long.valueOf(System.currentTimeMillis() - startTime)));
        }
    }
    //发布war包
    protected void deployWARs(File appBase, String[] files) {
        if (files == null)
            return;
        ExecutorService es = host.getStartStopExecutor();
        List<Future<?>> results = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            if (files[i].equalsIgnoreCase("META-INF"))
                continue;
            if (files[i].equalsIgnoreCase("WEB-INF"))
                continue;
            File war = new File(appBase, files[i]);
            if (files[i].toLowerCase(Locale.ENGLISH).endsWith(".war") &&
                    war.isFile() && !invalidWars.contains(files[i]) ) {
                ContextName cn = new ContextName(files[i], true);
                if (isServiced(cn.getName())) {
                    continue;
                }
                if (deploymentExists(cn.getName())) {
                    DeployedApplication app = deployed.get(cn.getName());
                    boolean unpackWAR = unpackWARs;
                    if (unpackWAR && host.findChild(cn.getName()) instanceof StandardContext) {
                        unpackWAR = ((StandardContext) host.findChild(cn.getName())).getUnpackWAR();
                    }
                    if (!unpackWAR && app != null) {
                        File dir = new File(appBase, cn.getBaseName());
                        if (dir.exists()) {
                            if (!app.loggedDirWarning) {
                                log.warn(sm.getString(
                                        "hostConfig.deployWar.hiddenDir",
                                        dir.getAbsoluteFile(),
                                        war.getAbsoluteFile()));
                                app.loggedDirWarning = true;
                            }
                        } else {
                            app.loggedDirWarning = false;
                        }
                    }
                    continue;
                }
                if (!validateContextPath(appBase, cn.getBaseName())) {
                    log.error(sm.getString(
                            "hostConfig.illegalWarName", files[i]));
                    invalidWars.add(files[i]);
                    continue;
                }
                results.add(es.submit(new DeployWar(this, cn, war)));
            }
        }
        for (Future<?> result : results) {
            try {
                result.get();
            } catch (Exception e) {
                log.error(sm.getString(
                        "hostConfig.deployWar.threaded.error"), e);
            }
        }
    }
}
```
