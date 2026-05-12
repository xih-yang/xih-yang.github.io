# 18、JVM 实战 - JVM之运行时数据区 - 方法区的垃圾收集
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/18.html
- 分类：JVM 实战
- 分组：教程目录
《Java虚拟机规范》中提到过可以不要求虚拟机在方法区实现垃圾收集，方法区的垃圾收集性价比是比较低的，这是因为方法内容的回收判定条件相当苛刻，方法区的垃圾回收主要针对运行时常量池和类型数据。

常量池回收判定：和Java堆中的对象相似，如果一个常量，没有虚拟机任何地方被引用，就会被回收，这里常量包括各种字面量和符号引用。

类型回收判定：判断一个类不在被使用，需要满足下面三个条件：

**该类所有的实例都被回收，即Java堆中已经不存在该类及其任何派生子类的实例。**

**加载该类的类加载器已经被回收，这个条件除非是经过精心设计的可替换类加载器的场景，如OSGi、JSP的重加载等，否则通常是很难达成的。**

**该类对应的java.lang.Class对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法。**

虚拟机允许对满足上面三个条件的类进行回收，但仅仅是允许，不是必然就会被回收，HotSpot虚拟机提供JVM参数控制-Xnoclassgc参数进行控制，还可以使用-verbose: class以及-XX: + TraceClass-Loading、-XX:+TraceClassUnI oading查看类加载和卸载信息，其中-verbose: class和-XX:+TraceClassLoading可以在Product版的虚拟机中使用，-XX: +TraceClassUnLoading参数需要FastDebug版口的虚拟机支持。

在大量使用反射、动态代理、CGLib等字节码框架，动态生成JSP以及OSGi这类频繁自定义类加载器的场景中，通常都需要Java虚拟机具备类型卸载的能力，以保证不会对方法区造成过大的内存压力，Spring、Mybatis都大量使用了动态代理。

**上面描述摘抄自《深入理解Java虚拟机》，前面的篇章说过方法区用于存储虚拟机加载的类信息、常量、静态变量、即时编译器编译后的代码等数据。那这些数据在类加载以后，在方法区到底是什么样的一种结构呢？**

HotSpot是基于c++实现，而c++是一门面向对象的语言，本身是具备面向对象基本特征的，所以Java中的对象表示，最简单的做法是为每个Java类生成一个c++类与之对应。但HotSpot JVM并没有这么做，而是设计了一个OOP-Klass模型，OOP（Ordinary Object Pointer）指的是普通对象指针，而Klass用来描述对象实例的具体类型。OPP就不在这里描述了，介绍一下位于方法区的Klass模型，加载到方法区的每个类都有一个与之对应的Klass类实例，这里的Klass类并不是Java语言层面的类，而是C++层面。

Klass类部分继承关系如上:

- InstanceKlass: 描述Java类的元信息，加载到方法区的类都会对应一个InstanceKlass实例
- InstanceMirrorKlass: 描述java.lang.Class的实例，类加载以后会在java堆中生成一个类对应的java.lang.Class实例作为程序访问方法区类型信息的外部接口，这个实例就是InstanceMirrorKlass实例，实际是一个C++的实例，学名镜像类。
- InstanceRefKlass:描述java/lang/ref/Reference类的子类
- InstanceClassLoaderKlass:用于遍历某个加载器加载的类
- ArrayKlass：描述数组类型，java中的数组类型是在运行时动态生成，Java数据的元信息由下面两个子类描述。
- TypeArrayKlass: 描述基本类型的数组。
- ObjArrayKlass:描述对象类型的数组

根据上面的描述可以得出如下图的指向关系，**Java对象实例的类型指针指向类元数据，表示类元数据的InstanceKlass实例中有一个java mirror(Java镜像类指针)指向java.lang.Class实例。**

通过Open JDK的**[instanceKlass.hpp](https://github.com/openjdk-mirror/jdk7u-hotspot/blob/50bdefc3afe944ca74c3093e7448d6b889cd20d1/src/share/vm/oops/instanceKlass.hpp)**和JHSDB工具都可以验证该指向关系，如下1图，就是通过JHSDB工具得到的Java对象实例，_mark是Mark Word,_metadata就是类型指针，2图是类元信息的实例，其中有一个java mirror就是指向java.lang.Class。**java中Object的getClass()就是通过类型指针找到类元信息再找到java.lang.Class。**

有了上面的解释，关于方法区垃圾回收的三个条件就容易理解了，当三个条件全部满足后，就没有任何地方引用该类型信息，也就可以卸载该类了。
