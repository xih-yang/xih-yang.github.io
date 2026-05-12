# 16、JDK 源码：ClassLoader
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/16.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

![ ][nbsp]

这个类的作用就是根据一个指定的类的全限定名,找到对应的Class字节码文件,然后加载它转化成一个java.lang.Class类的一个实例。

## 二、类加载器介绍

**启动类加载器(Bootstrap ClassLoader):**

这个类加载器负责将\lib目录下的类库加载到虚拟机内存中,用来加载java的核心库,此类加载器并不继承于java.lang.ClassLoader,不能被java程序直接调用,代码是使用C++编写的.是虚拟机自身的一部分。

**扩展类加载器(Extendsion ClassLoader):**

这个类加载器负责加载\lib\ext目录下的类库,用来加载java的扩展库,开发者可以直接使用这个类加载器。

**应用程序类加载器(Application ClassLoader):**

这个类加载器负责加载用户类路径(CLASSPATH)下的类库,一般我们编写的java类都是由这个类加载器加载,这个类加载器是CLassLoader中的getSystemClassLoader()方法的返回值,所以也称为系统类加载器.一般情况下这就是系统默认的类加载器。

除此之外,我们还可以加入自己定义的类加载器,以满足特殊的需求,需要继承java.lang.ClassLoader类。

## 三、双亲委派机制

双亲委派模型是一种组织类加载器之间关系的一种规范,他的工作原理是:如果一个类加载器收到了类加载的请求,它不会自己去尝试加载这个类,而是把这个请求委派给父类加载器去完成,这样层层递进,最终所有的加载请求都被传到最顶层的启动类加载器中,只有当父类加载器无法完成这个加载请求(它的搜索范围内没有找到所需的类)时,才会交给子类加载器去尝试加载。

这样的好处是:java类随着它的类加载器一起具备了带有优先级的层次关系.这是十分必要的,比如java.langObject,它存放在\jre\lib\rt.jar中,它是所有java类的父类,因此无论哪个类加载都要加载这个类,最终所有的加载请求都汇总到顶层的启动类加载器中,因此Object类会由启动类加载器来加载,所以加载的都是同一个类,如果不使用双亲委派模型,由各个类加载器自行去加载的话,系统中就会出现不止一个Object类,应用程序就会全乱了。

## 四、源码解析

#### 1.定义和属性

是一个抽象类：public abstract class ClassLoader

父加载器属性：private final ClassLoader parent;

#### 2.常用方法

defineClass(String name, java.nio.ByteBuffer b,ProtectionDomain protectionDomain)

指定保护域（protectionDomain），把ByteBuffer的内容转换成 Java 类，这个方法被声明为final的。

defineClass(String name, byte[] b, int off, int len)

把字节数组 b中的内容转换成 Java 类，其开始偏移为off,这个方法被声明为final的。

findClass(String name)

查找指定名称的类

loadClass(String name)

加载指定名称的类

resolveClass(Class)

链接指定的类

其中defineClass 方法用来将 字节流解析成 JVM 能够识别的 Class 对象，有了这个方法意味着我们不仅仅可以通过 class 文件实例化对象，还可以通过其他方式实例化对象，如果我们通过网络接收到一个类的字节码，拿到这个字节码流直接创建类的 Class 对象形式实例化对象。如果直接调用这个方法生成类的 Class 对象，这个类的 Class 对象还没有 resolve ，这个 resolve 将会在这个对象真正实例化时才进行。

defineClass 通常是和findClass 方法一起使用的，我们通过覆盖ClassLoader父类的findClass 方法来实现类的加载规则，从而取得要加载类的字节码，然后调用defineClass方法生成类的Class 对象，如果你想在类被加载到JVM中时就被链接，那么可以接着调用另一个 resolveClass 方法，当然你也可以选择让JVM来解决什么时候才链接这个类。

## 五、总结

`Java`装载类使用**“全盘负责委托机制”**。“全盘负责”是指当一个`ClassLoder`装载一个类时，除非显示的使用另外一个`ClassLoder`，该类所依赖及引用的类也由这个`ClassLoder`载入；“委托机制”是指先委托父类装载器寻找目标类，只有在找不到的情况下才从自己的类路径中查找并装载目标类。这一点是从安全方面考虑的，试想如果一个人写了一个恶意的基础类（如`java.lang.String`）并加载到`JVM`将会引起严重的后果，但有了全盘负责制，`java.lang.String`永远是由根装载器来装载，避免以上情况发生 除了`JVM`默认的三个`ClassLoder`以外，第三方可以编写自己的类装载器，以实现一些特殊的需求。类文件被装载解析后，在`JVM`中都有一个对应的`java.lang.Class`对象，提供了类结构信息的描述。数组，枚举及基本数据类型，甚至`void`都拥有对应的`Class`对象。`Class`类没有`public`的构造方法，`Class`对象是在装载类时由JVM通过调用类装载器中的`defineClass()`方法自动构造的。
、
[nbsp]: /images/2023/11/9/1554/1699516466603.png
[https_www.jianshu.com_p_554c138ca0f5]: https://www.jianshu.com/p/554c138ca0f5
[https_blog.csdn.net_u014634338_article_details_81434327]: https://blog.csdn.net/u014634338/article/details/81434327
[https_www.cnblogs.com_z00377750_p_9175549.html]: https://www.cnblogs.com/z00377750/p/9175549.html
