# 13、Tomcat 内核详解 - 公共与隔离的类加载器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/13.html
- 分类：服务器框架
- 分组：教程目录
类加载器：就是用于加载Java类到Java虚拟机中的组件，它负责读取Java字节码，并转换为java.lang.Class类的一个实例，是字节码.class文件得以运行。一般类加载器负责根据一个指定的类找到对应的字节码，然后根据这些字节码定义一个java类，它还可以加载资源，包括图像文件和配置文件；

类加载器的好处是：可以使Java类动态的加载到JVM中并运行，即可以在程序运行时候再加载类，提供了很灵活的动态加载方式；

## 1.类加载器

在Java体系中，可以将系统分为三种类加载器：

- 启动类加载器（Bootstrap ClassLoader）：

该加载器使用C/C++实现，加载对象是Java核心库，负责加载JAVA_HOME/jre/lib目录下的JVM指定的类库

- 扩展类加载器（Extension ClassLoader）：

加载的对象为Java的扩展库，即加载JAVA_HOME/jre/lib/ext目录中的类，这个类由启动类加载器加载，但因为启动类加载器并非用Java实现，已经脱离了Java体系，它的父类加载器是启动类加载器；

- 应用程序类加载器（Application ClassLoader）：

负责加载用户类路径（CLASSPATH）指定的类库，如果程序没有指定类加载器，就默认使用应用程序类加载器，它也由启动类加载器加载，如果使用这个加载器，通过ClassLoader.getSystemClassLoader()即可；

在JVM中，一个类由完全匹配类名（包名+类名）和一个类加载器的实例ID作为唯一标识。也就是说，同一个虚拟机中可以有两个包名、类名都相同的类。只要它们是由不同的类加载器加载。这种特征为我们提供了隔离机制；

## 2.自定义类加载器

继承ClassLoader类：

- 沿用双亲委派机制自定义类加载器：重写findClass()
- 打破双亲委派机制自定义类加载器：重写loadClass()和findClass()

## 3.Tomcat的类加载器

## 4.类加载器工厂——ClassLoaderFactory

## 5.遭遇ClassNotFoundException

前面提到Tomcat会创建Common类加载器，CatAlina类加载器和共享类加载器，这三个其实是同一个类加载器对象。Tomcat在创建类加载器之后就马上将其设置为当前线程类加载器，即Thread.currentThread().setContextClassLoader，这里主要是为了避免加载类的时候加载不成功的问题；
