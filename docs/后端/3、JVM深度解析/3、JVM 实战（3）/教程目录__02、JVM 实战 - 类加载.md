# 02、JVM 实战 - 类加载
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/2.html
- 分类：JVM 实战
- 分组：教程目录
## 1. jvm内存结构概述

jvm运行，有哪些重要的 组件，如下图

共可分成三个大类

- 将class 文件 加载到内存的 加载系统
- class 存储区域，程序运行时内存
- jvm读取class字节码，执行解释class命令的 执行引擎

下面挨个说明

## 2. 类加载子系统

当我们把 代码写完，编译成字节码 class文件后，打包运行，接下来就是jvm的工作了，jvm通过类加载器ClassLoader完成 类加载的过程，

class file存在于本地硬盘上，可以理解为设计师画在纸上的模板，而最终这个模板在执行的时候是要加载到JVM当中来 , 根据这个文件实例化出n个一模一样的实例。而这个模板就是我们使用反射时经常看到的东西，Class对象，每个类都对应一个此对象，存放类的元数据。

示意图：

整个类加载过程 可分成三个部分，加载，链接（验证 --> 准备 --> 解析） ，初始化

### 2.1 加载阶段：

**1、** 通过一个类的全限定名获取定义此类的二进制字节流；

**2、** 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构；

**3、** 在内存中生成一个代表这个类的java.lang.Class对象，作为方法区这个类的各种数据的访问入口；

**加载class文件的方式可有以下几种**

**1、** 从本地系统中直接加载；

**2、** 通过网络获取，典型场景：WebApplet；

**3、** 从zip压缩包中读取，成为日后jar、war格式的基础；

**4、** 运行时计算生成，使用最多的是：动态代理技术；

**5、** 由其他文件生成，典型场景：JSP应用；

**6、** 从专有数据库中提取.class文件，比较少见；

**7、** 从加密文件中获取，典型的防Class文件被反编译的保护措施；

### 2.2 链接阶段：

链接分为三个子阶段：验证 --> 准备 --> 解析

**验证（Verify）：**

目的在于确保Class文件的字节流中包含信息符合当前虚拟机要求，保证被加载类的正确性，不会危害虚拟机自身安全。主要包括四种验证，文件格式验证，元数据验证，字节码验证，符号引用验证。

例如：字节码文件（BinaryViewer查看），其开头均为 CAFE BABE ，如果出现不合法的字节码文件，那么将会验证不通过

**准备（Prepare）**

**1、** 为类变量（静态变量）分配内存并且设置该类变量的默认初始值；

**2、** 这里不包含用final修饰的static，因为final在编译的时候就会分配好了默认值，准备阶段会显式初始化；

**3、** 也不会为实例变量（对象类型）分配初始化，普通类变量会分配在方法区中，而实例变量是会随着对象一起分配到Java堆中；

举例：

```java
public class HelloApp {
    private static int a = 1;   //变量a在准备阶段会赋初始值，但不是1，而是0，在初始化阶段会被赋值为 1
    public static void main(String[] args) {
        System.out.println(a);
    }
}
```

**解析(Resolve)**

**1、** 将常量池内的符号引用转换为直接引用的过程；

**2、** 事实上，解析操作往往会伴随着JVM在执行完初始化之后再执行；

**3、** 符号引用就是一组符号来描述所引用的目标符号引用的字面量形式明确定义在《java虚拟机规范》的class文件格式中直接引用就是直接指向目标的指针、相对偏移量或一个间接定位到目标的句柄；

**4、** 解析动作主要针对类或接口、字段、类方法、接口方法、方法类型等对应常量池中的CONSTANTClassinfo、CONSTANTFieldrefinfo、CONSTANTMethodrefinfo等；

### 2.3 初始化阶段：

**1、****初始化阶段就是执行类构造器方法()的过程**；

**2、****此方法不需定义，是javac编译器自动收集类中的所有类变量(静态变量)的赋值动作和静态代码块中的语句合并而来也就是说，当我们代码中包含static变量的时候，就会有clinit方法（没有static变量则没有）** ；

举例：

```java
public class ClinitTest {
    private int a = 1;
    private static int c = 3;
    public static void main(String[] args) {
        int b = 2;
    }
}
```

类中有静态变量生成 clinit 方法

若没有static变量

```java
public class ClinitTest {
    private int a = 1;
    public static void main(String[] args) {
        int b = 2;
    }
}
```

则没有clinit方法

**1、****()方法中的指令按赋值语句在源文件中出现的顺序执行**；

举例：

```java
public class ClassInitTest {
    private static int number = 10;      //linking之prepare: number = 0 --> initial: 10 --> 20
    static {
        number = 20;
        System.out.println(num);
    }
    public static void main(String[] args) {
        System.out.println(ClassInitTest.num);//2
        System.out.println(ClassInitTest.number);//10
    }
}
```

静态变量 number 的值变化过程如下

- 准备阶段时：0
- 执行静态变量初始化：10
- 执行静态代码块：20

**1、****()不同于类的构造器（关联：构造器是虚拟机视角下的(),）** ；

**2、****若该类具有父类，JVM会保证子类的()执行前，父类的()已经执行完毕**；

**3、****虚拟机必须保证一个类的()方法在多线程下被同步加锁(多个线程同时加载同一个类)**；

## 3. 类加载器的分类

JVM支持两种类型的类加载器 。分别为引导类加载器（Bootstrap ClassLoader）和自定义类加载器（User-Defined ClassLoader )

从概念上来讲，自定义类加载器一般指的是程序中由开发人员自定义的一类类加载器，但是Java虚拟机规范却没有这么定义，而是**将所有派生于抽象类ClassLoader的类加载器都划分为自定义类加载器**

无论类加载器的类型如何划分，在程序中我们最常见的类加载器始终只有3个，这里的四者之间是包含关系，不是上层和下层，也不是子父类的继承关系。 如下所示

代码：

```java
public class ClassLoaderTest {
    public static void main(String[] args) {
        //获取系统类加载器
        ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
        System.out.println(systemClassLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2
        //获取其上层：扩展类加载器
        ClassLoader extClassLoader = systemClassLoader.getParent();
        System.out.println(extClassLoader);//sun.misc.Launcher$ExtClassLoader@1540e19d
        //获取其上层：获取不到引导类加载器
        ClassLoader bootstrapClassLoader = extClassLoader.getParent();
        System.out.println(bootstrapClassLoader);//null
        //对于用户自定义类来说：默认使用系统类加载器进行加载
        ClassLoader classLoader = ClassLoaderTest.class.getClassLoader();
        System.out.println(classLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2
        //String类使用引导类加载器进行加载的。---> Java的核心类库都是使用引导类加载器进行加载的。
        ClassLoader classLoader1 = String.class.getClassLoader();
        System.out.println(classLoader1);//null
    }
}
```

- 尝试获取引导类加载器，获取到的值为 null ，这并不代表引导类加载器不存在，**因为引导类加载器是由 C/C++ 语言编写，我们获取不到**
- 两次获取系统类加载器的值都相同：sun.misc.Launcher`$`AppClassLoader@18b4aac2 ，这说明**系统类加载器是全局唯一的**

常用加载器介绍：

**启动类加载器（引导类加载器，Bootstrap ClassLoader）**

**1、** 这个类加载使用C/C++语言实现的，嵌套在JVM内部；

**2、** 它用来加载Java的核心库，用于提供JVM自身需要的类；

**3、** 并不继承自java.lang.ClassLoader，没有父加载器；

**4、** 加载扩展类（**ExtensionClassLoader**）和应用程序类（**AppClassLoade**）加载器，并作为他们的父类加载器（这两个加载器，也是java类）；

**5、** 出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类；

**扩展类加载器（Extension ClassLoader）**

**1、** Java语言编写，由sun.misc.Launcher$ExtClassLoader实现；

**2、** 派生于ClassLoader类（则为自定义加载器）；

**3、** 父类加载器为启动类加载器；

**4、** 从java.ext.dirs系统属性所指定的目录中加载类库，或从JDK的安装目录的jre/lib/ext子目录（扩展目录）下加载类库如果用户创建的JAR放在此目录下，也会自动由扩展类加载器加载；

**应用程序类加载器（系统类加载器，AppClassLoader）**

**1、** Java语言编写，由sun.misc.LaunchersAppClassLoader实现；

**2、** 派生于ClassLoader类（则为自定义加载器）；

**3、** 父类加载器为扩展类加载器；

**4、** 它负责加载环境变量classpath或系统属性java.class.path指定路径下的类库；

**5、** 该类加载是程序中默认的类加载器，一般来说，Java应用的类都是由它来完成加载；

**6、** 通过classLoader.getSystemclassLoader()方法可以获取到该类加载器；

代码：

```java
public class ClassLoaderTest1 {
    public static void main(String[] args) {
        System.out.println("**********启动类加载器**************");
        //获取BootstrapClassLoader能够加载的api的路径
        URL[] urLs = sun.misc.Launcher.getBootstrapClassPath().getURLs();
        for (URL element : urLs) {
            System.out.println(element.toExternalForm());
        }
        //从上面的路径中随意选择一个类,来看看他的类加载器是什么:引导类加载器
        ClassLoader classLoader = Provider.class.getClassLoader();
        System.out.println(classLoader);//null
        System.out.println("***********扩展类加载器*************");
        String extDirs = System.getProperty("java.ext.dirs");
        for (String path : extDirs.split(";")) {
            System.out.println(path);
        }
        //从上面的路径中随意选择一个类,来看看他的类加载器是什么:扩展类加载器
        ClassLoader classLoader1 = CurveDB.class.getClassLoader();
        System.out.println(classLoader1);//sun.misc.Launcher$ExtClassLoader@1540e19d
    }
}
```

打印结果

String 类就在 其中的rt.jar中， 由 启动类加载器加载

扩展类加载器加载 lib下的 ext下的jar包类

```java
**********启动类加载器**************
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/resources.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/rt.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/sunrsasign.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/jsse.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/jce.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/charsets.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/lib/jfr.jar
file:/C:/Program%20Files/Java/jdk1.8.0_144/jre/classes
null
***********扩展类加载器*************
C:\Program Files\Java\jdk1.8.0_144\jre\lib\ext
C:\WINDOWS\Sun\Java\lib\ext
sun.misc.Launcher$ExtClassLoader@7ea987ac
```

## 4. 用户自定义加载器

注意，此为用户自定义，不是jvm规范中的 自定义 加载器，此处概述 ，后面详细介绍

**为什么需要自定义类加载器？**

**1、** 隔离加载类（不用的中间件，框架中的类隔离）；

**2、** 修改类加载的方式；

**3、** 扩展加载源（从特殊的环境中加载class信息）；

**4、** 防止源码泄漏（class加密，自定义加载器类进行解密）；

**如何自定义类加载器？**

**1、** 开发人员可以通过继承抽象类java.lang.ClassLoader类的方式，实现自己的类加载器，以满足一些特殊的需求；

**2、** 在JDK1.2之前，在自定义类加载器时，总会去继承ClassLoader类并重写loadClass()方法，从而实现自定义的类加载类，但是在JDK1.2之后已不再建议用户去覆盖loadClass()方法，而是建议把自定义的类加载逻辑写在findclass()方法中；

**3、** 在编写自定义类加载器时，如果没有太过于复杂的需求，可以直接继承URIClassLoader类，这样就可以避免自己去编写findclass()方法及其获取字节码流的方式，使自定义类加载器编写更加简洁；

## 5. ClassLoader 常用方法

ClassLoader类，它是一个抽象类，其后所有的类加载器都继承自ClassLoader（不包括启动类加载器）并且都定义在sun.misc.Launcher 类中，都是其子类，sun.misc.Launcher 它是一个java虚拟机的入口应用

常用方法：

方法名称
描述

getParent（）
返回该类加载器的父类加载器

loadClass（String name）
加载名称为name的类，返回结果为java.lang.Class类的实例

findClass（String name）
查找名称为name的类，返回结果为java.lang.Class类的实例

findLoadedClass（String name）
查找名称为name的已经被加载的类，返回结果为java.lang.Class类的实例

defineClass（String name，byte[] b,int off,int len）
把字节数组b中的内容转换为一个Java类，返回结果为java.lang.Class类的实例

resolveClass（Class c）
连接指定的一个Java类

获取ClassLoader 实例的途径

- 获取当前类的 ClassLoader ：clazz.getClassLoader()
- 获取当前线程上下文的ClassLoader：Thread.currentThread().getContextClassLoader()
- 获取系统的ClassLoader ： ClassLoader.getSystemClassLoader();
- 获取调用者的ClassLoader ： DriverManager.getCallerClassLoader()

代码演示:

```java
public class ClassLoaderTest2 {
    public static void main(String[] args) {
        try {
            //1.Class.forName().getClassLoader()
            ClassLoader classLoader = Class.forName("java.lang.String").getClassLoader();
            System.out.println(classLoader); // String 类由启动类加载器加载，我们无法获取
            //2.Thread.currentThread().getContextClassLoader()
            ClassLoader classLoader1 = Thread.currentThread().getContextClassLoader();
            System.out.println(classLoader1);
            //3.ClassLoader.getSystemClassLoader().getParent()
            ClassLoader classLoader2 = ClassLoader.getSystemClassLoader();
            System.out.println(classLoader2);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
// 输出
null
sun.misc.Launcher$AppClassLoader@18b4aac2
sun.misc.Launcher$AppClassLoader@18b4aac2
```

## 6. 双亲委派机制

Java虚拟机对class文件采用的是按需加载的方式，也就是说当需要使用该类时才会将它的class文件加载到内存生成class对象。而且加载某个类的class文件时，Java虚拟机采用的是双亲委派模式，即把请求交由父类处理(父类再向上委派,一直到启动类加载器)，它是一种任务委派模式

**1、** 如果一个类加载器收到了类加载请求，它并不会自己先去加载，而是把这个请求委托给父类的加载器去执行；

**2、** 如果父类加载器还存在其父类加载器，则进一步向上委托，依次递归，请求最终将到达顶层的启动类加载器；

**3、** 如果父类加载器可以完成类加载任务，就成功返回，倘若父类加载器无法完成此加载任务，子加载器才会尝试自己去加载，这就是双亲委派模式；

**4、** 父类加载器一层一层往下分配任务，如果子类加载器能加载，则加载此类，如果将加载任务分配至应用程序加载器也无法加载此类，则抛出异常；

**举例:**

自己建立一个java.lang.String类,如果此类加载 将打印 语句

```java
package java.lang;
public class String {
    static{
        System.out.println("我是自定义的String类的静态代码块");
    }
}
```

在另外的程序中加载 String 类，上面的语句并没有打印,默认加载就是 原生的String类

```java
public class StringTest {
    public static void main(String[] args) {
        java.lang.String str = new java.lang.String();
        System.out.println("hello,atguigu.com");
        StringTest test = new StringTest();
        System.out.println(test.getClass().getClassLoader());
    }
}
```

**因为 当程序需要加载 java.lang.String 类时,类加载器将一直向上委托, 直到 启动器加载类,而启动器加载可以加载String 类,则为 原生java.lang下的String 类,这将保证原生api的安全性,不会因为用户环境重写的类,导致所有以前使用原生api的地方受到干扰**

代码2

```java
package java.lang;
public class String {
    static{
        System.out.println("我是自定义的String类的静态代码块");
    }
    //错误: 在类 java.lang.String 中找不到 main 方法
    public static void main(String[] args) {
        System.out.println("hello,String");
    }
}
```

运行时报错:

**当加载main方法时, 加载其承载类String,同样委托到启动器加载类,导致加载成原生的String 类,而原生的String 类可没有 main方法**

代码3

在自定义的java.lang 包下定义自定义的类

```java
package java.lang;
public class ShkStart {
    public static void main(String[] args) {
        System.out.println("hello!");
    }
}
```

运行报错

**因为报名为java.lang 属于启动类加载器的加载范畴, 出于对 启动类加载器的保护,jvm禁止 自定义的类被 启动类加载器加载,防止自定义类 对启动器加载器产生破坏,**

通过上面的例子，我们可以知道，双亲机制可以

**1、** 避免类的重复加载；

**2、** 保护程序安全，防止核心API被随意篡改；

**1、** 自定义类：java.lang.String没有用；

**2、** 自定义类：java.lang.ShkStart（报错：阻止创建java.lang开头的类）；

**当我们使用 jdbc 等 第三方 实现类jar包时,使用到ClassLoader**

**1、** 首先我们需要知道的是jdbc.jar是基于SPI接口进行实现的；

**2、** 所以在加载的时候，会进行双亲委派，最终从根加载器中加载SPI核心类，然后再加载SPI接口类；

**3、** 接着在进行反向委托，通过线程上下文类加载器进行实现类jdbc.jar的加载；

## 7. 沙箱安全机制

自定义String类时：在加载自定义String类的时候会率先使用引导类加载器加载，而引导类加载器在加载的过程中会先加载jdk自带的文件（rt.jar包中java.lang.String.class），报错信息说没有main方法，就是因为加载的是rt.jar包中的String类。这样可以对java核心源代码的保护，保证java核心代码的运行环境绝对的独立,这就是沙箱安全机制

相关问题:

**如何判断两个class对象是否相同？**

在JVM中表示两个class对象是否为同一个类存在两个必要条件：

**1、** 类的完整类名必须一致，包括包名；

**2、** 加载这个类的ClassLoader（指ClassLoader实例对象）必须相同；

**3、** 换句话说，在JVM中，即使这两个类对象（class对象）来源同一个Class文件，被同一个虚拟机所加载，但只要加载它们的ClassLoader实例对象不同，那么这两个类对象也是不相等的；

**类的主动使用和被动使用**

Java程序对类的使用方式分为：主动使用和被动使用。主动使用，又分为七种情况：

**1、** 创建类的实例；

**2、** 访问某个类或接口的静态变量，或者对该静态变量赋值；

**3、** 调用类的静态方法；

**4、** 反射（比如：Class.forName(“com.atguigu.Test”)）；

**5、** 初始化一个类的子类；

**6、** Java虚拟机启动时被标明为启动类的类；

**7、** JDK7开始提供的动态语言支持：java.lang.invoke.MethodHandle实例的解析结果REF_getStatic、REFputStatic、REF_invokeStatic句柄对应的类没有初始化，则初始化；

除了以上七种情况，其他使用Java类的方式都被看作是对类的被动使用，都不会导致类的初始化，即不会执行初始化阶段（不会调用 clinit() 方法和 init() 方法）
