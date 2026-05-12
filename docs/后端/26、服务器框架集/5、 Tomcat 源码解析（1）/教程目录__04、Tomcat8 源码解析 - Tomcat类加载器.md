# 04、Tomcat8 源码解析 - Tomcat类加载器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/4.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

先来讲一下JVM的类加载机制。

## 一、JVM类加载机制

**1、** 继承关系；

ExtClassLoader和AppClassLoader都继承父类ClassLoader，ClassLoader有一个属性parent是实现双亲委派模型的关键属性。

**2、** 双亲委派模型；

**2、** 1、BootstrapClassLoader：引导类加载器，是JVM内置native实现的；

1、通过源码sun.misc.Launcher可以看得它的加载路径：

```java
private static String bootClassPath = System.getProperty("sun.boot.class.path");
```

或者配置-Xbootclasspath参数指定加载的路径

具体加载了那些类：

```java
%JAVA_HOME%\jre\lib\resources.jar
%JAVA_HOME%\jre\lib\rt.jar
%JAVA_HOME%\jre\lib\sunrsasign.jar
%JAVA_HOME%\jre\lib\jsse.jar
%JAVA_HOME%\jre\lib\jce.jar
%JAVA_HOME%\jre\lib\charsets.jar
%JAVA_HOME%\jre\lib\jfr.jar
%JAVA_HOME%\jre\classes
```

2、ClassLoader的findBootstrapClass方法指示Bootstrap ClassLoader是JVM内置实现的

```java
private Class<?> findBootstrapClassOrNull(String name)
{
    if (!checkName(name)) return null;
    return findBootstrapClass(name);
}
// return null if not found
private native Class<?> findBootstrapClass(String name);
```

**2、** 2、ExtensionClassLoader：扩展类加载器，实现类为sun.misc.Launcher$ExtClassLoader；

1、加载路径：String str = System.getProperty("java.ext.dirs");具体指：%JAVA_HOME%/jre/lib/ext

2、创建扩展类加载器

源码：sun.misc.Launcher

```java
ExtClassLoader localExtClassLoader;
  try
  {
    localExtClassLoader = ExtClassLoader.getExtClassLoader();
  } catch (IOException localIOException1) {
    throw new InternalError("Could not create extension class loader", localIOException1);
  }
  //直接将parent属性设置为null  所以扩展类加载器的parent默认就是Bootstrap ClassLoader
  public ExtClassLoader(File[] var1) throws IOException {
      super(getExtURLs(var1), (ClassLoader)null, Launcher.factory);
      SharedSecrets.getJavaNetAccess().getURLClassPath(this).initLookupCache(this);
  }
```

ClassLoader代码：

```java
  //ClassLoader有一个parent属性
  private final ClassLoader parent;
  protected ClassLoader(ClassLoader parent) {
        this(checkCreateClassLoader(), parent);
    }
  private ClassLoader(Void unused, ClassLoader parent) {
        this.parent = parent;
        ......
  }
 //加载类的方法主要是使用父类ClassLoader.loadClass方法：
protected Class<?> loadClass(String name, boolean resolve)
        throws ClassNotFoundException
    {
        synchronized (getClassLoadingLock(name)) {
            // 首先，查找该类是否已经被加载过了
            Class c = findLoadedClass(name);
            if (c == null) {  //未被加载过
                long t0 = System.nanoTime();
                try {
                    if (parent != null) {  // 父类加载器不为null，则调用父类加载器尝试加载
                        c = parent.loadClass(name, false);
                    } else {   // 父类加载器为null，则调用本地方法，交由启动类加载器加载，所以说ExtClassLoader的父类加载器为Bootstrap ClassLoader
                        c = findBootstrapClassOrNull(name);
                    }
                } catch (ClassNotFoundException e) {
                }
                if (c == null) { //仍然加载不到，只能由本加载器通过findClass去加载
                    long t1 = System.nanoTime();
                    c = findClass(name);
                    // this is the defining class loader; record the stats
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                    sun.misc.PerfCounter.getFindClasses().increment();
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
```

**2、** 3、AppicationClassLoader：应用程序类加载器，或者叫系统类加载器，实现类为sun.misc.Launcher$AppClassLoader；

1、加载路径：final String s = System.getProperty("java.class.path");

2、具体实现

源码sun.misc.Launcher：

```java
ExtClassLoader localExtClassLoader;
try
{
  localExtClassLoader = ExtClassLoader.getExtClassLoader();
} catch (IOException localIOException1) {
  throw new InternalError("Could not create extension class loader", localIOException1);
}
//直接将parent属性设置为null  所以扩展类加载器的parent默认就是Bootstrap ClassLoader
public ExtClassLoader(File[] var1) throws IOException {
          super(getExtURLs(var1), (ClassLoader)null, Launcher.factory);
          SharedSecrets.getJavaNetAccess().getURLClassPath(this).initLookupCache(this);
}
//应用类/系统类加载器
try
{
  //将扩展类加载器作为参数传进去 实现双亲委托机制 
  loader = AppClassLoader.getAppClassLoader(localExtClassLoader);
} catch (IOException localIOException2) {
  throw new InternalError("Could not create application class loader", localIOException2);
}
//当AppClassLoader被初始化以后，会被设置为当前线程的上下文类加载器以及保存到Launcher类的loader属性中，
//而通过ClassLoader.getSystemClassLoader()获取的也正是该类加载器(Launcher.loader)。
Thread.currentThread().setContextClassLoader(loader);
....
//var0为扩展类加载器
public static ClassLoader getAppClassLoader(final ClassLoader var0) throws IOException {
    final String var1 = System.getProperty("java.class.path");
    final File[] var2 = var1 == null ? new File[0] : Launcher.getClassPath(var1);
    return (ClassLoader)AccessController.doPrivileged(new PrivilegedAction<Launcher.AppClassLoader>() {
        public Launcher.AppClassLoader run() {
            URL[] var1x = var1 == null ? new URL[0] : Launcher.pathToURLs(var2);
            return new Launcher.AppClassLoader(var1x, var0);
        }
    });
}
//var2为扩展类加载器
AppClassLoader(URL[] var1, ClassLoader var2) {
    super(var1, var2, Launcher.factory);
    this.ucp.initLookupCache(this);
}
```

ClassLoader代码：

```java
//ClassLoader有一个parent属性
private final ClassLoader parent;
//最终调用父类ClassLoader构造方法  所以应用加载器的parent就是扩展类加载器  注意parent不是继承父类
protected ClassLoader(ClassLoader parent) {
    this(checkCreateClassLoader(), parent);
}
private ClassLoader(Void unused, ClassLoader parent) {
    this.parent = parent;
    ......
}
//加载类的方法主要是使用父类ClassLoader.loadClass方法：
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 首先，查找该类是否已经被加载过了
        Class c = findLoadedClass(name);
        if (c == null) {  //未被加载过
            long t0 = System.nanoTime();
            try {
                if (parent != null) {  // 父类加载器不为null，则调用父类加载器尝试加载
                    c = parent.loadClass(name, false);
                } else {   // 父类加载器为null，则调用本地方法，交由启动类加载器加载，所以说ExtClassLoader的父类加载器为Bootstrap ClassLoader
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
            }
            if (c == null) { //仍然加载不到，只能由本加载器通过findClass去加载
                long t1 = System.nanoTime();
                c = findClass(name);
                // this is the defining class loader; record the stats
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

**2、** 4、自定义类加载器；

1、自定义类加载器需要继承ClassLoader

```java
public class MyclassLoader extends ClassLoader {}
```

2、有一个默认无参构造器，会调用父类的构造器，内部默认获取应用类加载器设置其parant属性

ClassLoader源码：

```java
//构造函数
protected ClassLoader() {
    this(checkCreateClassLoader(), getSystemClassLoader());
}
@CallerSensitive
public static ClassLoader getSystemClassLoader() {
    initSystemClassLoader();
    if (scl == null) {
        return null;
    }
    SecurityManager sm = System.getSecurityManager();
    if (sm != null) {
        checkClassLoaderPermission(scl, Reflection.getCallerClass());
    }
    return scl;
}
private static synchronized void initSystemClassLoader() {
    if (!sclSet) {
        if (scl != null)
            throw new IllegalStateException("recursive invocation");
        sun.misc.Launcher l = sun.misc.Launcher.getLauncher();
        if (l != null) {
            Throwable oops = null;
            scl = l.getClassLoader();
            try {
                scl = AccessController.doPrivileged(
                    new SystemClassLoaderAction(scl));
            } catch (PrivilegedActionException pae) {
                oops = pae.getCause();
                if (oops instanceof InvocationTargetException) {
                    oops = oops.getCause();
                }
            }
            if (oops != null) {
                if (oops instanceof Error) {
                    throw (Error) oops;
                } else {
                    // wrap the exception
                    throw new Error(oops);
                }
            }
        }
        sclSet = true;
    }
}
```

源码：Launcher

```java
public class Launcher
{
  private ClassLoader loader;
  public Launcher()
  {
    ......
    try
    {
      //使用应用加载器作为loader
      loader = AppClassLoader.getAppClassLoader(localExtClassLoader);
    } catch (IOException localIOException2) {
      throw new InternalError("Could not create application class loader", localIOException2);
    }
    Thread.currentThread().setContextClassLoader(loader);
    .....
   }
   //直接返回loader
   public ClassLoader getClassLoader() {
        return this.loader;
   }
   ......
}
```

最后来一张双亲委派模型图：

## 二、Tomcat类加载器

**1、** 继承关系；

**2、** Tomcat类加载器；

**2、** 1、三个基本类加载器；

1、commonLoader：Tomcat最基本的类加载器，加载的class可以被Tomcat容器本身以及各个Webapp访问;

2、catalinaLoader：Tomcat容器私有的类加载器，加载路径中的class对于Webapp不可见;

3、sharedLoader：各个Webapp共享的类加载器，加载路径中的class对于所有Webapp可见，但是对于Tomcat容器不可见;

CommonClassLoader能加载的类都可以被Catalina ClassLoader和SharedClassLoader使用，从而实现了公有类库的共用，而CatalinaClassLoader和Shared ClassLoader自己能加载的类则与对方相互隔离。

```java
#加载路径:配置文件/tomcat8.5/conf/catalina.properties中属性
common.loader="${catalina.base}/lib","${catalina.base}/lib/*.jar","${catalina.home}/lib","${catalina.home}/lib/*.jar"
#tomcat6之前有个目录/server/*，之后设置为空 
server.loader=
#tomcat6之前有个目录/shared/*，之后设置为空
shared.loader=
```

/tomcat8.5/java/org/apache/catalina/startup/Bootstrap.java

```java
private void initClassLoaders() {
        try {
            //commonLoader初始化的时候将parent设置为null
            commonLoader = createClassLoader("common", null);//URLClassLoader  默认是common
            if (commonLoader == null) {
                // no config file, default to this loader - we might be in a 'single' env.
                commonLoader = this.getClass().getClassLoader();
            }
            catalinaLoader = createClassLoader("server", commonLoader);//common子load-server
            sharedLoader = createClassLoader("shared", commonLoader);//common子load-shared
        } catch (Throwable t) {
            handleThrowable(t);
            log.error("Class loader creation threw exception", t);
            System.exit(1);
        }
    }
    private ClassLoader createClassLoader(String name, ClassLoader parent)
        throws Exception {
        //server.loader和shared.loader都为空 默认使用commonLoader
        String value = CatalinaProperties.getProperty(name + ".loader");
        if ((value == null) || (value.equals("")))
            return parent;
        value = replace(value);
        ......
        return ClassLoaderFactory.createClassLoader(repositories, parent);
    }
```

ClassLoaderFactory源码：

```java
public static ClassLoader createClassLoader(List<Repository> repositories,
                                            final ClassLoader parent)
    throws Exception {
    ......
    return AccessController.doPrivileged(
            new PrivilegedAction<URLClassLoader>() {
                @Override
                public URLClassLoader run() {
                    if (parent == null)
                        return new URLClassLoader(array);
                    else
                        return new URLClassLoader(array, parent);
                }
            });
    }
```

URLClassLoader最终调用父类ClassLoader，然后调用getSystemClassLoader获取的就是应用类加载器AppClassLoader。

**2、** 2、WebappClassLoader：各个Webapp私有的类加载器，加载路径中的class只对当前Webapp可见.；

WebAppClassLoader可以使用SharedClassLoader加载到的类，但各个WebAppClassLoader实例之间相互隔离。

StandardContext.java启动时加载：

```java
protected synchronized void startInternal() throws LifecycleException {
 ......
 if (getLoader() == null) {
     WebappLoader webappLoader = new WebappLoader();
     webappLoader.setDelegate(getDelegate());
     setLoader(webappLoader);
 }
 ......
 try {
     if (ok) {
         // Start our subordinate components, if any
         Loader loader = getLoader();
         if (loader instanceof Lifecycle) {
             ((Lifecycle) loader).start();
         }
         ......
      }
      ......
    }
    .....
}
```

WebappLoader.java：注意WebappLoader.java没有继承ClassLoader及其子类，不是真正加载类是其下面的WebappClassLoaderBase属性

```java
//WebappClassLoaderBase属性  这才是真正的类加载器
private WebappClassLoaderBase classLoader = null;
//ParallelWebappClassLoader继承WebappClassLoaderBase
private String loaderClass = ParallelWebappClassLoader.class.getName();
//无参构造函数
public WebappLoader() {
    this(null);
}
//将WebappClassLoaderBase属性设置为null
public WebappLoader(ClassLoader parent) {
    super();
    this.parentClassLoader = parent;
}
protected void startInternal() throws LifecycleException {
    ......
    // Construct a class loader based on our current repositories list
    try {
        classLoader = createClassLoader();
        classLoader.setResources(context.getResources());
        classLoader.setDelegate(this.delegate);
        ......
    } catch (Throwable t) {
        .....
    }
}
private WebappClassLoaderBase createClassLoader()
    throws Exception {
    Class<?> clazz = Class.forName(loaderClass);
    WebappClassLoaderBase classLoader = null;
    if (parentClassLoader == null) {
        //这里getParentClassLoader()会获取父容器StandarHost.parentClassLoader对象属性，
        //而这个对象属性是在Catalina$SetParentClassLoaderRule.begin()初始化，
        //初始化的值其实就是Catalina.parentClassLoader对象属性，再来跟踪一下Catalina.parentClassLoader，
        //在Bootstrap.init()时通过反射调用了Catalina.setParentClassLoader()，将Bootstrap.sharedLoader属性设置为Catalina.parentClassLoader，
        //所以WebClassLoader的父类加载器是Shared ClassLoader.
        parentClassLoader = context.getParentClassLoader();
    } else {
        context.setParentClassLoader(parentClassLoader);
    }
    Class<?>[] argTypes = { ClassLoader.class };
    Object[] args = { parentClassLoader };
    Constructor<?> constr = clazz.getConstructor(argTypes);
    classLoader = (WebappClassLoaderBase) constr.newInstance(args);
    return classLoader;
}
```

WebAppClassLoaderBase实现了web应用类加载的机制：

tomcat的类加载机制是违反了双亲委托原则的，对于一些未加载的非基础类(Object,String等)，各个web应用自己的类加载器(WebAppClassLoader)会优先加载，加载不到时再交给commonClassLoader走双亲委托。

具体的加载逻辑位于WebAppClassLoaderBase.loadClass()方法中，过程：

```java
1、先在本地缓存中查找是否已经加载过该类(对于一些已经加载了的类，会被缓存在resourceEntries这个数据结构中)，如果已经加载即返回，否则 继续下一步。
2、让系统类加载器(AppClassLoader)尝试加载该类，主要是为了防止一些基础类会被web中的类覆盖，如果加载到即返回，返回继续。
3、前两步均没加载到目标类，那么web应用的类加载器将自行加载，如果加载到则返回，否则继续下一步。
4、最后还是加载不到的话，则委托父类加载器(Common ClassLoader)去加载。
```

第3第4两个步骤的顺序已经违反了双亲委托机制，除了tomcat之外，JDBC,JNDI,Thread.currentThread().setContextClassLoader();等很多地方都一样是违反了双亲委托。

**2、** 3、JasperClassLoader：每一个JSP文件对应一个Jsp类加载器；

JasperLoader的加载范围仅仅是这个JSP文件所编译出来的那一个.Class文件，它出现的目的就是为了被丢弃：当Web容器检测到JSP文件被修改时，会替换掉目前的JasperLoader的实例，并通过再建立一个新的Jsp类加载器来实现JSP文件的HotSwap功能

**3、** Tomcat类加载顺序；

当tomcat启动时，会创建几种类加载器：

1、Bootstrap 引导类加载器：加载JVM启动所需的类，以及标准扩展类（位于jre/lib/ext下）

2、System 系统类加载器 ：加载tomcat启动的类，比如bootstrap.jar，通常在catalina.bat或者catalina.sh中指定。位于CATALINA_HOME/bin下。

3、Common 通用类加载器 ：加载tomcat使用以及应用通用的一些类，位于CATALINA_HOME/lib下，比如servlet-api.jar

4、webapp 应用类加载器：每个应用在部署后，都会创建一个唯一的类加载器。该类加载器会加载位于 WEB-INF/lib下的jar文件中的class 和 WEB-INF/classes下的class文件。

当应用需要到某个类时，则会按照下面的顺序进行类加载：

1、使用bootstrap引导类加载器加载;

2、使用system系统类加载器加载;

3、使用应用类加载器在WEB-INF/classes中加载;

4、使用应用类加载器在WEB-INF/lib中加载;

5、使用common类加载器在CATALINA_HOME/lib中加载;

参考：
[图解Tomcat类加载机制](https://www.cnblogs.com/aspirant/p/8991830.html)
