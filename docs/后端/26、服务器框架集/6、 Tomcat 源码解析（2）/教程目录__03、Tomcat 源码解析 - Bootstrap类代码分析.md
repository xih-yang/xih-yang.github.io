# 03、Tomcat 源码解析 - Bootstrap类代码分析
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/3.html
- 分类：服务器框架
- 分组：教程目录
**分析bootstrap类的方法**

**首先** 是静态代码段static{},初始化catalinaHomeFile变量和catalinaBaseFile变量，catalinaHomeFile变量默认是bootstrap.jar文件路径，catalinaBaseFile默认情况下等于catalinaHomeFile，可以通过vm –D参数catalina.home和catalina.base覆盖。

```java
static {
//当前工作目录，就是平常cmd启动的tomcat的时候进去的目录 
       String userDir = System.getProperty("user.dir");
    //-D參數Catalina.home
        String home = System.getProperty(Globals.CATALINA_HOME_PROP);
        File homeFile = null;
        if (home != null) {
            File f = new File(home);
            try {
                homeFile = f.getCanonicalFile();
            } catch (IOException ioe) {
                homeFile = f.getAbsoluteFile();
            }
        }
//如果未指定默认是user.dir的parent dir路径,不过首先要判断user.dir下有没有bootstrap.jar
        if (homeFile == null) {
            File bootstrapJar = new File(userDir, "bootstrap.jar");
            if (bootstrapJar.exists()) {
                File f = new File(userDir, "..");
                try {
                    homeFile = f.getCanonicalFile();
                } catch (IOException ioe) {
                    homeFile = f.getAbsoluteFile();
                }
            }
        }
//当前工作目录作为catalinahome
        if (homeFile == null) {
            File f = new File(userDir);
            try {
                homeFile = f.getCanonicalFile();
            } catch (IOException ioe) {
                homeFile = f.getAbsoluteFile();
            }
        }
        catalinaHomeFile = homeFile;
        System.setProperty(
                Globals.CATALINA_HOME_PROP, catalinaHomeFile.getPath());
    //如果未指定-Dcatalina.base，默认等于catalina.home
        String base = System.getProperty(Globals.CATALINA_BASE_PROP);
        if (base == null) {
            catalinaBaseFile = catalinaHomeFile;
        } else {
            File baseFile = new File(base);
            try {
                baseFile = baseFile.getCanonicalFile();
            } catch (IOException ioe) {
                baseFile = baseFile.getAbsoluteFile();
            }
            catalinaBaseFile = baseFile;
        }
        System.setProperty(
                Globals.CATALINA_BASE_PROP, catalinaBaseFile.getPath());
    }
```

**其次**看几个方法main initClassLoaders init load start stop stopServer setAwait方法

**main方法主要逻辑:**

实例化Bootstrap，调用Bootstrap init方法，然后根据传入的jvm参数调用不同的方法

```java
    .............
//调用bootstrap init方法
                bootstrap.init();
      .........................
//根据main参数不同调用bootstrap相应方法
            if (command.equals("startd")) {
                args[args.length - 1] = "start";
                daemon.load(args);
                daemon.start();
            } else if (command.equals("stopd")) {
                args[args.length - 1] = "stop";
                daemon.stop();
            } else if (command.equals("start")) {
                daemon.setAwait(true);
                daemon.load(args);
                daemon.start();
            } else if (command.equals("stop")) {
                daemon.stopServer(args);
            } else if (command.equals("configtest")) {
                daemon.load(args);
                if (null==daemon.getServer()) {
                    System.exit(1);
                }
                System.exit(0);
```

**Init方法主要逻辑：**

Step1.调用initClassLoaders方法

Step2.设置当前线程的类加载器为catalinaLoader

Step3.preload tomcat类(SecurityClassLoad)

Step4.用catalinaLoader反射加载org.apache.catalina.startup.Catalina类并实例化

Step5.调用Catalina类的setParentClassLoader方法，将sharedLoader作为catalinaLoader的ParentClassloader

```java
//初始化commonLoader、catalinaLoader、sharedLoader 
initClassLoaders();
//设置当前线程classloader        Thread.currentThread().setContextClassLoader(catalinaLoader);
        SecurityClassLoad.securityClassLoad(catalinaLoader);
..............
//用catalinaLoader加载org.apache.catalina.startup.Catalina类
        Class<?> startupClass =
            catalinaLoader.loadClass
            ("org.apache.catalina.startup.Catalina");
        Object startupInstance = startupClass.newInstance();
...........................
//调用setParentClassLoader方法，设置catalinaLoader的parentclassloader为sharedLoader
        String methodName = "setParentClassLoader";
        Class<?> paramTypes[] = new Class[1];
        paramTypes[0] = Class.forName("java.lang.ClassLoader");
        Object paramValues[] = new Object[1];
        paramValues[0] = sharedLoader;
        Method method =
            startupInstance.getClass().getMethod(methodName, paramTypes);
        method.invoke(startupInstance, paramValues);
...............................
```

**initClassLoaders方法主要逻辑:**

调用createClassLoader方法实例化3个classloader(实例化3个classloader(commonLoader、catalinaLoader、sharedLoader)

createClassLoader方法会读取catalina.properties配置文件的配置实例化相应的classloader

默认情况下三个类加载器都是commonclassloader，如果配置加上后面两项，三个类加载器的父子关系如图

**Load方法、Start方法、Stop方法、stopServer方法、setAwait方法:**

调用Catalina类的l相应方法

总结：bootstrap主要功能是初始化两个静态变量catalinaHome和catalinaBase以及实例化三个classloader，根据main的参数调用不同的catalina方法。
