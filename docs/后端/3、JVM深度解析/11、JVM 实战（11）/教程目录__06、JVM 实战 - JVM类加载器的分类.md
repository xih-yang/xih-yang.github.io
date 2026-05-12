# 06、JVM 实战 - JVM类加载器的分类
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/6.html
- 分类：JVM 实战
- 分组：教程目录
JVM支持两种类型的类加载器，分别为引导类加载器（Bootstrap classLoader）和自定义类加载器(User-Defined classLoader)。

从概念上来讲，自定义类加载器一般指的是程序中由开发人员自定义的一类类加载器，但是Java虚拟机规范却没有这么定义，而是将所有派生于抽象类ClassLoader的类加载器都划分为自定义类加载器。

无论类加载器的类型如何划分，在程序中我们最常见的类加载器始终只有3个

```java
//获取系统类加载器
ClassLoader systemClassLoader = ClassLoader.getSystemCLassLoader();
System.out.println(systemClassLoader); // sun.misc.Launcher$AppCLassLoader@18b4aac2
//获取其上层:扩展类加载器
classLoader extclassLoader = systemClassLoader.getParent();
System.out.println(extClassLoader); // sun.misc.Launcher$ExtCLassLoader@1540e19d
//获取其上层:获取不到引导类加载器
classLoader bootstrapClassLoader = extClassLoader.getParent();system.out.println(bootstrapClassLoader);//null
//对于用户自定义类来说:默认使用系统类加载器进行加载
ClassLoader classLoader = ClassLoaderTest.class.getclassLoader();
System.out.println(classLoader); / / sun.misc.Launcher$AppCLassLoader@18b4aac2
//String类使用引导类加载器进行加载的。--->Java的核心类库都是使用引导类加载器进行加载的。ClassLoader classLoader1 = String.c1ass.getclassLoader();
System.out.println(classLoader1);//null
```

## 虚拟机自带的加载器

## 启动类加求器（引导类加载器，Bootstrap Class Loader)

- 这个类加载使用C/C++语言实现的，嵌套在JVM内部。
- 它用来加载Java的核心库（JAVA_HOME/jre/ lib/rt.jar、resources.jar或sun.boot.class.path路径下的内容），用于提供JVM自身需要的类
- 并不继承自java.lang.classLoader，没有父加载器。加载扩展类和应用程序类加载器，并指定为他们的父类加载器。
- 出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类

## 扩展类加载器（Extension Class Loader）

- Java语言编写，由sun.misc.Launcher`$`ExtClassLoader实现。派生于classLoader类
- 父类加载器为启动类加载器
- 从java.ext.dirs系统属性所指定的目录中加载类库，或从JDK的安
- 装目录的jre/lib/ext子目录（扩展目录）下加载类库。如果用户创建的JAR放在此目录下，也会自动由扩展类加载器加载。

## 应用程序类加载器（系统类加载器，System Class Loader/App Class Loader)

- java语言编写，由sun.misc.Launcher`$`AppclassLoader实现
- 派生于classLoader类
- 父类加载器为扩展类加载器
- 它负责加载环境变量classpath或系统属性java.class.path指定路径下的类库
- 该类加载是程序中默认的类加载器，一般来说，Java应用的类都是由它来完成加载
- 通过classLoader#getsystemClassLoader ()方法可以获取到该类加载器

第三方加载器线程上下文类加载器Context ClassLoader（默认是系统类加载器）

使用如：接口由引导类加载器加载，用于接口的实现类由第三方加载器线程上下文类加载器加载。

## 用户自定义类加载器

在Java的日常应用程序开发中，类的加载几乎是由上述3种类加载器相互配合执行的，在必要时，我们还可以自定义类加载器，来定制类的加载方式。

为什么要自定义类加载器?

**1、** 隔离加载类；

**2、** 修改类加载的方式；

**3、** 扩展加载源；

**4、** 防止源码泄漏；

用户自定义类加载器实现步骤:

**1、** 开发人员可以通过继承抽象类java.lang.classLoader类的方式，实现自己的类加载器，以满足一些特殊的需求；

**2、** 在JDK1.2之前，在自定义类加载器时，总会去继承classLoader类并重写loadclass ()方法，从而实现自定义的类加载类，但是在JDK1.2之后已不再建议用户去覆盖loadclass ()方法，而是建议把自定义的类加载逻辑写在findclass ()方法中

**3、** 在编写自定义类加载器时，如果没有太过于复杂的需求，可以直接继承URLClassLoader类，这样就可以避免自己去编写findclass()方法及其获取字节码流的方式，使自定义类加载器编写更加简洁；

## ClassLoader类

ClassLoader类，它是一个抽象类，其后所有的类加载器都继承自ClassLoader (不包括启动类加载器)

下面是它所含有的方法：

获取ClassLoader的途径：
