# 04、JVM 实战 - 类的加载篇，类的加载器
- 来源：https://ddkk.com/zhuanlan/java/jvm/4/4.html
- 分类：JVM 实战
- 分组：教程目录
## 一、概述

## 1、作用

类加载器是JVM执行类加载机制的前提。

ClassLoader的作用：

ClassLoader是Java的核心组件，所有的Class都是由ClassLoader进行加载的，ClassLoader负责通过各种方式将Class信息的二进制数据流读入JVM内部，转换为一个与目标类对应的java.lang.Class对象实例。然后交给Java虚拟机进行链接、初始化等操作。因此，**ClassLoader在整个加载Loading阶段，只能影响到类的加载**，而无法通过ClassLoader去改变类的链接和初始化行为。至于它是否可以运行，则由Execution Engine决定。

## 2、显式加载、隐式加载

显式加载：指的是在代码中通过调用ClassLoader加载class对象，如直接使用Class.forName(name)或this.getClass().getClassLoader().loadClass()加载class对象。

隐式加载：不直接在代码中调用ClassLoader的方法加载class对象，而是通过虚拟机自动加载到内存中，如在加载某个类的class文件时，该类的class文件中引用了另外一个类的对象，此时额外引用的类将通过JVM自动加载到内存中。

## 3、类加载机制的必要性

一般情况下， Java开发人员并不需要在程序中显式地使用类加载器，但是了解类加载器的加载机制却显得至关重要。从以下几个方面说:

- 避免在开发中遇到java.lang.ClassNotFoundException异常或java.lang.NoClassDefFoundError异常时，手足无措。只有了解类加载器的加载机制才能够在出现异常的时候快速地根据错误异常日志定位问题和解决问题
- 需要支持类的动态加载或需要对编译后的字节码文件进行加解密操作时，就需要与类加载器打交道了。
- 开发人员可以在程序中编写自定义类加载器来重新定义类的加载规则，以便实现一些自定义的处理逻辑。

## 4、加载的类是唯一的吗

对于任意一个类，**都需要由加载它的类加载器和这个类本身一同确认其在Java虚拟机中的唯一性**。每一个类加载器，都拥有一个独立的类名称空间：**比较两个类是否相等，只有在这两个类是由同一个类加载器加载的前提下才有意义**。否则，即使这两个类源自同一个Class文件，被同一个虚拟机加载，只要加载他们的类加载器不同，那这两个类就必定不相等。

## 5、类加载机制的基本特质

三个基本特征：

- 双亲委派模型。但不是所有类加载都遵守这个模型，有的时候，启动类加载器所加载的类型，是可能要加载用户代码的，比如JDK内部的ServiceProvider/ServiceLoader机制，用户可以在标准API框架上，提供自己的实现，

JDK也需要提供些默认的参考实现。例如，Java 中INDI、JDBC、文件系统、Cipher等很多方面，都是利用的这种机制，这种情况就不会用双亲委派模型去加载，而是利用所谓的上下文加载器。

- 可见性，子类加载器可以访问父加载器加载的类型，但是反过来是不允许的。不然，因为缺少必要的隔离，我们就没有办法利用类加载器去实现容器的逻辑。
- 单一性，由于父加载器的类型对于子加载器是可见的，所以父加载器中加载过的类型，就不会在子加载器中重复加载。但是注意，类加载器“邻居”间，同一类型仍然可以被加载多次，因为互相并不可见。

## 二、类的加载器分类

## 1、分类说明

JVM支持两种类型的类加载器，分别为引导类加载器（Bootstrap ClassLoader） 和自定义类加载器（User-Defined ClassLoader）。

从概念上来讲，自定义类加载器一般指的是程序中由开发人员自定义的一类类加载器，但是Java虚拟机规范却没有这么定义，**而是将所有派生于抽象类ClassLoader的类加载器都划分为自定义类加载器。**

**引导类加载器：**启动类加载器

**自定义类加载器：**扩展类加载器、应用程序类加载器、用户自定义类加载器

除了顶层的启动类加载器外，其余的类加载器都应当有自己的“父类”加载器。

不同类加载器看似是继承（Inheritance）关系，实际上**是包含关系**。在下层加载器中，包含着上层加载器的引用：

## 2、引导类加载器

启动类加载器（引导类加载器，Bootstrap ClassLoader）

- 这个类加载**使用C/C++语言实现**的，嵌套在JVM内部。
- 它用来加载Java的核心库（JAVA_HOME/jre/lib/rt.jarbsun.boot.class.path路径下的内容）。用于提供JVM自身需要的类。
- 并不继承自java.lang.ClassLoader，没有父加载器。
- 出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类
- 加载扩展类和应用程序类加载器，并指定为他们的父类加载器。

## 3、扩展类加载器

- Java语言编写，由sun.misc.Launcher`$`ExtClassLoader实现。
- 继承于ClassLoader类
- 父类加载器为启动类加载器
- 从java.ext.dirs系统属性所指定的目录中加载类库，或从JDK的安装目录的jre/lib/ext子目录下加载类库。如果用户创建的JAR放在此目录下，也会自动由扩展类加载器加载。

## 4、应用程序类加载器

应用程序类加载器（系统类加载器，AppClassLoader）

- java语言编写，由sun.misc.Launcher`$`AppClassLoader实现
- 继承于ClassLoader类
- 父类加载器为扩展类加载器
- 它负责加载环境变量classpath或系统属性 java.class.path 指定路径下的类库
- **应用程序中的类加载器默认是系统类加载器。**
- 它是用户自定义类加载器的默认父加载器
- 通过ClassLoader的getSystemClassLoader()方法可以获取到该类加载器

## 5、用户自定义类加载器

- 在Java的日常应用程序开发中，类的加载几乎是由上述3种类加载器相互配合执行的。在必要时，我们还可以自定义类加载器,来定制类的加载方式。
- 体现Java语言强大生命力和巨大魅力的关键因素之一便是，Java开发者可以自定义类加载器来实现类库的动态加载，加载源可以是本地的JAR包，也可以是网络上的远程资源。
- **通过类加载器可以实现非常绝妙的插件机制**，这方面的实际应用案例举不胜举。例如,著名的SGI组件框架，再如Eclipse的插件机制。类加载器为应用程序提供了一种动态增加新功能的机制，这种机制无须重新打包发布应用程序就能实现。
- 同时,**自定义加载器能够实现应用隔离**，例如 Tomcat、Spring等中间件和组件框架都在内部实现了自定义的加载器，并通过自定义加载器隔离不同的组件模块。这种机制比C/C++程序要好太多，想不修改C/C++程序就能为其新增功能，几乎是不可能的，仅仅一个兼容性便能阻挡住所有美好的设想。
- 自定义类加载器通常需要继承于classLoader.

## 三、自定义类的加载器

## 1、为什么要用自定义类的加载器

**隔离加载类：** 在某些框架内进行中间件与应用的模块隔离，把类加载到不同的环境。比如:阿里内某容器框架通过自定义类加载器确保应用中依赖的jar包不会影响到中间件运行时使用的jar包。再比如：Tomcat这类Web应用服务器，内部自定义了好几种类加载器，用于隔离同一个Web应用服务器上的不同应用程序。（类的仲裁→类冲突）

**修改类加载的方式：** 类的加载模型并非强制，除Bootstrap外，其他的加载并非一定要引入，或者根据实际情况在某个时间点进行按需进行动态加载

**扩展加载源：** 比如从数据库、网络、甚至是电视机机顶盒进行加载

**防止源码泄漏：** Java代码容易被编译和篡改，可以进行编译加密。那么类加载也需要自定义，还原加密的字节码。

## 2、应用场景

**实现类似进程内隔离**，类加载器实际上用作不同的命名空间，以提供类似容器、模块化的效果。例如，两个模块依赖于某个类库的不同版本，如果分别被不同的容器加载，就可以互不干扰。这个方面的集大成者是Java EE和OSGI、JPMS等框架。

应用需要从不同的数据源获取类定义信息，例如网络数据源，而不是本地文件系统。或者是需要自己操纵字节码，动态修改或者生成类型。

### 注意

在一般情况下，使用不同的类加载器去加载不同的功能模块，会提高应用程序的安全性。但是，如果涉及Java类型转换，则加载器反而容易产生不美好的事情。在做Java类型转换时，只有两个类型都是由同一个加载器所加载，才能进行类型转换，否则转换时会发生异常。

## 3、两种实现方式

Java提供了抽象类java.lang.ClassLoader，所有用户自定义的类加载器都应该继承ClassLoader类。在自定义ClassLoader的子类时候，我们常见的会有两种做法：

- 方式一：重写loadClass()方法
- 方式二：重写findClass()方法

### 1、 对比

这两种方法本质上差不多，毕竟loadClass()也会调用findClass()，但是从逻辑上讲我们最好不要直接修改loadClass()的内部逻辑。建议的做法是只在findClass()里重写自定义类的加载方法，根据参数指定类的名字，返回对应的Class对象的引用。

- loadClass()这个方法是实现双亲委派模型逻辑的地方，擅自修改这个方法会导致模型被破坏，容易造成问题。因此我们最好是在双亲委派模型框架内进行小范围的改动，不破坏原有的稳定结构。同时，也避免了自己重写loadClass()方法的过程中必须写双亲委托的重复代码，从代码的复用性来看，不直接修改这个方法始终是比较好的选择。
- 当编写好自定义类加载器后，便可以在程序中调用loadClass()方法来实现类加载操作。

### 2、 demo 重写findClass()

```java
public class UserDefineClassLoader extends ClassLoader {
    private String rootPath;
    public UserDefineClassLoader(String rootPath) {
        this.rootPath = rootPath;
    }
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        //转换为以文件路径表示的文件
        String filePath = classToFilePath(name);
        //获取指定路径的class文件对应的二进制流数据
        byte[] data = getBytesFromPath(filePath);
        //自定义ClassLoader 内部调用defineClass()
        return defineClass(name, data, 0, data.length);
    }
    private byte[] getBytesFromPath(String filePath) {
        FileInputStream fis = null;
        ByteArrayOutputStream baos = null;
        try {
            fis = new FileInputStream(filePath);
            baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int len;
            while ((len = fis.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (baos != null)
                    baos.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            try {
                if (fis != null)
                    fis.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return null;
    }
    private String classToFilePath(String name) {
        return rootPath + "\\" + name.replace(".", "\\") + ".class";
    }
    public static void main(String[] args) {  //加载com.atguigu.java3.User
        try {
            UserDefineClassLoader loader1 = new UserDefineClassLoader("D:\\code\\workspace_teach\\JVMdachang210416\\chapter02_classload\\src");
            Class userClass1 = loader1.findClass("com.atguigu.java3.User");
            System.out.println(userClass1);
            UserDefineClassLoader loader2 = new UserDefineClassLoader("D:\\code\\workspace_teach\\JVMdachang210416\\chapter02_classload\\src");
            Class userClass2 = loader2.findClass("com.atguigu.java3.User");
            System.out.println(userClass1 == userClass2);//实现了加载的类的隔离
            System.out.println(userClass1.getClassLoader());
            System.out.println(userClass1.getClassLoader().getParent());
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

View Code
