# 11、Tomcat 源码解析 - Host的LifecycleListener HostConfig
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/11.html
- 分类：服务器框架
- 分组：教程目录
承接上一篇，由于HostConfig的重要性分篇来看

```java
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
            start();
        } else if (event.getType().equals(Lifecycle.STOP_EVENT)) {
            stop();
        }
}
```

这篇主要讲解check涉及到的方法，check方法是在PERIODIC_EVENT事件触发的时候才会调用，前面分析ContainerBase的时候可以知道在执行backgroudProcess的方法时候会触发这个事件，现在看check方法：

```java
//如果host配置了autoDeploy才会执行下面的代码，我们现在主要查看deploy的代码。
protected void check() {
        if (host.getAutoDeploy()) {
            // Check for resources modification to trigger redeployment
            DeployedApplication[] apps =
                deployed.values().toArray(new DeployedApplication[0]);
            for (int i = 0; i < apps.length; i++) {
                if (!isServiced(apps[i].name))
                    checkResources(apps[i], false);
            }
            // Check for old versions of applications that can now be undeployed
            if (host.getUndeployOldVersions()) {
                checkUndeploy();
            }
            deployApps();
        }
    }
```

看deployApps之前我们先看三个方法

protected void deployDirectory(ContextName cn, File dir)

protected void deployDescriptor(ContextName cn, File contextXml)

protected void deployWAR(ContextName cn, File war)

deployDirectory 方法主要逻辑（参数dir是webaaps下面的一个应用）：

**1、** 获得META-INF/context.xmlFile；

**2、** 获得xmlCopyFile路径是config/enginename/hostname/这个应用名称.xml；

**3、** 如果host配置里面的deployXml为true，并且xmlfile存在执行3.1，如果deployXml为false并且xml存在执行3.2，xml不存在执行3.3；

**3.1、** 将xml作为源，通过Digester解析来创建StandardContext，查看host配置的copyXml和Context.xml中的配置，context.xml中的配置将覆盖host的配置，如果为true，则xmlfile将copy一份到xmlCopyFile，并设置Context的ConfigFile；

**3.2、** 打errorlog；

**3.3、** 直接通过host配置的contextClass，通过反射创建，默认是StandardContext；

**4、** 设置context的各种属性，例如Name、Path、version等，最重要的是ContextConfig属性,然后host.addChild(context);；

**5、** 给这个应用创建DeployedApplication，添加到deployDirectory中，也设置DeployedApplication的redeployResources，添加的内容有dir、xml或者copyXml，也就是说这个几个被修改的话，这个应用就会被重新deploy；

deployDescriptor方法主要逻辑(参数contextXml是conf/enginename/hostname/xxx.xml)：

**1、** 将参数contextXml作为源，通过Digester解析得到StandardContext对象；

**2、** 跟上面步骤4一样设置context的各种属性；

**3、** 设置deployedApp的redeployResources属性，这个是contextXml变化，这个应用就会被重新deploy；

**4、** 添加deployed；

deployWar方法类似,可以看成上面两个方法的综合

上面提到的DeployedApplication. redeployResources和deployed在check中会用来扫描资源是否被修改

现在我们看会deployApps 方法：

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

上面的三个deply方法类似，只看其中一个deployDirectories方法：

```java
protected void deployDirectories(File appBase, String[] files) {
        if (files == null)
            return;
//分析ContainerBase的时候可以知道这个init的时候实例化的一个Excutor
        ExecutorService es = host.getStartStopExecutor();
        List<Future<?>> results = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
//一些逻辑处理，跳过META-INF 和WEB-INF
            if (files[i].equalsIgnoreCase("META-INF"))
                continue;
            if (files[i].equalsIgnoreCase("WEB-INF"))
                continue;
            File dir = new File(appBase, files[i]);
            if (dir.isDirectory()) {
                ContextName cn = new ContextName(files[i], false);
//正在service的和已经deploy的continue
                if (isServiced(cn.getName()) || deploymentExists(cn.getName()))
                    continue;
//最后实例化DeployDirectory runnable submit给executor执行，可以看下DeployDirectory类
                results.add(es.submit(new DeployDirectory(this, cn, dir)));
            }
        }
//利用future特性搜集结果
        for (Future<?> result : results) {
            try {
                result.get();
            } catch (Exception e) {
                log.error(sm.getString(
                        "hostConfig.deployDir.threaded.error"), e);
            }
        }
    }
```

查看DeployDirectory类我们可以发现，run里面最后调用的是hostconfig类里面deployDirectorie 方法，我们上面分析的，三个方法的情况类似。

总结一下，在触发PERIODIC_EVENT这个事件的时候，也就是host的都会定时去查看自己下面的appBase，看是否有app需要发布，以及已经发布的app是否更新从而需要重新发布。

现在看下其它几个事件触发的方法，

BEFORE_START_EVENT--------> beforeStart

START_EVENT --------> start

STOP_EVENT--------> stop

beforeStart方法：

```java
//创建AppBaseFile和ConfigBaseFile文件夹
public void beforeStart() {
        if (host.getCreateDirs()) {
            File[] dirs = new File[] {host.getAppBaseFile(),host.getConfigBaseFile()};
            for (int i=0; i<dirs.length; i++) {
                if (!dirs[i].mkdirs() && !dirs[i].isDirectory()) {
                    log.error(sm.getString("hostConfig.createDirs",dirs[i]));
                }
            }
        }
}
```

Start方法：

```java
public void start() {
        if (log.isDebugEnabled())
            log.debug(sm.getString("hostConfig.start"));
//Jmx相关，给Host注册JMX组件
        try {
            ObjectName hostON = host.getObjectName();
            oname = new ObjectName
                (hostON.getDomain() + ":type=Deployer,host=" + host.getName());
            Registry.getRegistry(null, null).registerComponent
                (this, oname, this.getClass().getName());
        } catch (Exception e) {
            log.error(sm.getString("hostConfig.jmx.register", oname), e);
        }
        if (!host.getAppBaseFile().isDirectory()) {
            log.error(sm.getString("hostConfig.appBase", host.getName(),
                    host.getAppBaseFile().getPath()));
            host.setDeployOnStartup(false);
            host.setAutoDeploy(false);
        }
        if (host.getDeployOnStartup())
//调用deployApps
            deployApps();
}
```

Stop方法：

```java
public void stop() {
//注销JMX组件
        if (log.isDebugEnabled())
            log.debug(sm.getString("hostConfig.stop"));
        if (oname != null) {
            try {
                Registry.getRegistry(null, null).unregisterComponent(oname);
            } catch (Exception e) {
                log.error(sm.getString("hostConfig.jmx.unregister", oname), e);
            }
        }
        oname = null;
}
```

最重要的功能还是deployApps，最终会创建StandardContext添加到Host的childs

上面的代码会经常用到一个辅助类ContextName，因为涉及到路径的问题，还是看一下

主要看它的构造方法和DisplayName方法

```java
public ContextName(String name, boolean stripFileExtension) {
        String tmp1 = name;
//去掉/线
        if (tmp1.startsWith("/")) {
            tmp1 = tmp1.substring(1);
        }
//用#替换/
        tmp1 = tmp1.replaceAll("/", FWD_SLASH_REPLACEMENT);
//如果temp1的开头是##或””
       if (tmp1.startsWith(VERSION_MARKER) || "".equals(tmp1)) {
//给tmp1加上ROOT （ROOT##..|ROOT….#..#）
            tmp1 = ROOT_NAME + tmp1;
        }
        if (stripFileExtension &&
                (tmp1.toLowerCase(Locale.ENGLISH).endsWith(".war") ||
                        tmp1.toLowerCase(Locale.ENGLISH).endsWith(".xml"))) {
    //如果文件时已war或者xml结尾并且stripFileExtension为true，去掉后缀名  
          tmp1 = tmp1.substring(0, tmp1.length() -4);
        }
//设置baseName
        baseName = tmp1;
        String tmp2;
        int versionIndex = baseName.indexOf(VERSION_MARKER);
        if (versionIndex > -1) {
        //如贵baseName里面存在##则截取
    version = baseName.substring(versionIndex + 2);
//temp2是截取掉version的baseName
            tmp2 = baseName.substring(0, versionIndex);
        } else {
            version = "";
            tmp2 = baseName;
        }
        if (ROOT_NAME.equals(tmp2)) {
//如果temp2=ROOT,设置path为“”
            path = "";
        } else {
//path = 用/替换掉#加上/
            path = "/" + tmp2.replaceAll(FWD_SLASH_REPLACEMENT, "/");
        }
        if (versionIndex > -1) {
//如果存在##，name=path+##+版本号
            this.name = path + VERSION_MARKER + version;
        } else {
            this.name = path;
        }
}
//path=xxxx/xxxx##version 或者path=/
public String getDisplayName() {
        StringBuilder tmp = new StringBuilder();
        if ("".equals(path)) {
            tmp.append('/');
        } else {
            tmp.append(path);
        }
        if (!"".equals(version)) {
            tmp.append(VERSION_MARKER);
            tmp.append(version);
        }
        return tmp.toString();
    }
```
