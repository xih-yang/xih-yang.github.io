# 06、Tomcat 源码解析 - Tomcat jmx管理
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/6.html
- 分类：服务器框架
- 分组：教程目录
中秋归来，这篇分析tomcat关于jmx的部分，tomcat用的是DynamicMBean，不熟悉JMX的同学可以网上看下，上篇文章分析了tomcat的Catalina类，了解到Catalina会调用StandardServer，现在看下StandardServer的继承关系

这篇文章重点看LifecycleMBeanBase，他是跟JMX相关的部分，先看下接口Lifecycle，看名字可以知道是跟生命周期相关的接口，下面方法是跟添加Listener相关方法

```java
public void addLifecycleListener(LifecycleListener listener);
public LifecycleListener[] findLifecycleListeners();
public void removeLifecycleListener(LifecycleListener listener);
```

下面方法是跟生命周期相关的回调方法，init，start，stop ，destroy

```java
 public void init() throws LifecycleException;
    public void start() throws LifecycleException;
    public void stop() throws LifecycleException;
public void destroy() throws LifecycleException;
```

LifecycleBase类是简单对Lifecycle接口的实现。

现在重点看下LifecycleMBeanBase类，重点看initInternal方法，destroyInternal方法，domain和ObjectName属性，这两个属性跟JMX直接相关，先看下getDomain方法

```java
public final String getDomain() {
        if (domain == null) {
           //调用抽象方法 getDomainInternal，getDomainInternal方法需要JMX管理的类覆盖
domain = getDomainInternal();
        }
        if (domain == null) {
        //默认用DEFAULT_MBEAN_DOMAIN
            domain = Globals.DEFAULT_MBEAN_DOMAIN;
        }
        return domain;
}
ObjectName属性相关的方法initInternal，destroyInternal
protected void initInternal() throws LifecycleException {
        if (oname == null) {
            mserver = Registry.getRegistry(null, null).getMBeanServer();
//注册得到ObjectName
            oname = register(this, getObjectNameKeyProperties());
        }
    }
protected void destroyInternal() throws LifecycleException {
       //注销ObjectName 
unregister(oname);
    }
```

在看下register方法, unregister方法注销MBean

```java
protected final ObjectName register(Object obj,
            String objectNameKeyProperties) {
        StringBuilder name = new StringBuilder(getDomain());
        name.append(':');
        name.append(objectNameKeyProperties);
        ObjectName on = null;
        try {
// 实例化ObjectName，getDomain，objectNameKeyProperties需要之类覆写，有了ObjectName就可以用来在Server上注册MBean
            on = new ObjectName(name.toString());
            Registry.getRegistry(null, null).registerComponent(obj, on, null);
        } catch (MalformedObjectNameException e) {
            log.warn(sm.getString("lifecycleMBeanBase.registerFail", obj, name),
                    e);
        } catch (Exception e) {
            log.warn(sm.getString("lifecycleMBeanBase.registerFail", obj, name),
                    e);
        }
        return on;
    }
```

上面的方法可以看到Registry类，tomcat跟JMX相关的主要类，看Registry类方法之前先看类GlobalResourcesLifecycleListener、MBeanUtils。GlobalResourcesLifecycleListener类

上图可以看到server.xml配置，再看Catalina类的createDigester方法，上篇分析可以知道Catalina类的createDigester方法内容是解析server.xml的配置

可以知道会调用Server上的addLifecycleListener方法传入LifecycleListener，主要看GlobalResourcesLifecycleListener类的属性

```java
protected static final Registry registry = MBeanUtils.createRegistry();
```

可以看到类MBeanUtils，现在看createRegistry方法，createRegistry方法会调用Rigestry的loadDescriptors方法,加载org.apache.catalina下一系列的MBean描述, loadDescriptors方法会去相对应的包下加载mbeans-descriptors.xml配置，loadDescriptors方法调用load方法去实际加载MBean描述,

方法调用链loadDescriptors->load("MbeansDescriptorsDigesterSource", dURL, null)，Load方法根据传入的参数获取ModelerSource类，调用ModelerSource类的loadDescriptors(Registry, type, inputsource)方法，ModelerSource继承关系。

这条线会调用MbeansDescriptorsDigesterSource的loadDescriptors方法加载MBean描述，我们可以看到createDigester方法，可以熟悉的看到跟Catalina类相似的代码，Digester那篇分析过，现在看下loadDescriptors方法-> execute方法

```java
public void execute() throws Exception {
        if (registry == null) {
            registry = Registry.getRegistry(null, null);
        }
        InputStream stream = (InputStream) source;
        ArrayList<ManagedBean> loadedMbeans = new ArrayList<>();
        synchronized(dLock) {
            if (digester == null) {
                //配置解析包下的mbeans-descriptors.xml文件
digester = createDigester();
            }
            try {
                //push loadedMbeans
                digester.push(loadedMbeans);
                //开始解析
                digester.parse(stream);
            } catch (Exception e) {
                log.error("Error digesting Registry data", e);
                throw e;
            } finally {
                digester.reset();
            }
        }
        //调用registry.addManagedBean,传入ManageBean
        Iterator<ManagedBean> iter = loadedMbeans.iterator();
        while (iter.hasNext()) {
            registry.addManagedBean(iter.next());
        }
}
```

现在我们简单的看下createDigester和对应的mbeans-descriptors.xml，以org\apache\catalina\mbeans-descriptors.xml为例子，自己可以打开看

```java
//解析到mbeans-descriptors/mbean，实例化ManagedBean类
digester.addObjectCreate
            ("mbeans-descriptors/mbean",
            "org.apache.tomcat.util.modeler.ManagedBean");
    //设置mbeans-descriptors/mbean的attribute给ManagedBean类
        digester.addSetProperties
            ("mbeans-descriptors/mbean");
    //调用loadedMbeans的add方法传入ManagedBean
        digester.addSetNext
            ("mbeans-descriptors/mbean",
                "add",
            "java.lang.Object");
//解析到mbeans-descriptors/mbean/attribute，实例化类AttributeInfo
        digester.addObjectCreate
            ("mbeans-descriptors/mbean/attribute",
            "org.apache.tomcat.util.modeler.AttributeInfo");
//设置mbeans-descriptors/mbean/attribute的attribute给AttributeInfo类
        digester.addSetProperties
        digester.addSetProperties
            ("mbeans-descriptors/mbean/attribute");
        digester.addSetNext
         ("mbeans-descriptors/mbean/attribute",
                "addAttribute",
            "org.apache.tomcat.util.modeler.AttributeInfo");
以下类推
     …………………………………
```

总之parse最后的结果是，Registry类加载了mbeans-descriptors.xml配置下的ManagedBean。

现在在看MbeansDescriptorsIntrospectionSource类，loadDescriptors->execute->createManagedBean方法，根据Class类创建ManagedBean，add进Registry。

现在回头看Registry类的registerComponent和unregisterComponent方法

主要看registerComponent方法，registerComponent方法findManagedBean ,找到对应的ManagedBean ，然后ManagedBean.createMBean ，getMBeanServer().registerMBean( mbean, oname)。

总结：跟tomcat JMX相关的主要是Registry，GlobalResourcesLifecycleListener->Registry.createRegistry->解析包下的mbeans-descriptors.xml配置，Registry.addManageBean,

当initInternal 方法register的时候，会获取ManageBean，当找不到ManageBean的时候，会通过MbeansDescriptorsIntrospectionSource 来创建ManageBean，然后调用ManageBean. createMBean,注册DynamicMBean。
