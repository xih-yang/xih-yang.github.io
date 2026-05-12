# 12、JVM 实战 - 类加载机制
- 来源：https://ddkk.com/zhuanlan/java/jvm/5/12.html
- 分类：JVM 实战
- 分组：教程目录
## 一、类加载机制

虚拟机把描述类的数据从 Class 文件加载到内存，并对数据进行校验、转换解析和初始化，最终形成可以被虚拟机直接使用的 Java 类型，这就是虚拟机的类加载机制。

类的整个生命周期包括了：加载（Loading）、验证（Verification）、准备（Preparation）、解析（Resolution）、初始化（Initialization）、使用（Using）和卸载（Unloading）七个阶段，其中验证、准备和解析阶段三个部分统称为连接（Linking）。

类的生命周期中，加载、验证、准备、初始化和卸载这五个阶段的顺序是固定的，解析阶段在某些情况下可以在初始化阶段后再开始。

虚拟机规范中严格规定了有且只有四种情况开始类的初始化阶段（而加载、验证、准备阶段自然需要在此之前开始）：

- 遇到 new、getstatic、putstatic、invokestatic 这四条字节码指令时；
- 使用 java.lang.reflect 包的方法对类进行反射调用的时候；
- 当初始化一个类的时候，如果发现其父类还没有进行初始化，则需要先触发其父类的初始化；对于接口则没有这个要求，只有在真正使用到父类接口的时候才会初始化。
- 当虚拟机启动的时候，虚拟机会优先初始化要执行的主类。

## 二、类加载过程

### 1. 加载

加载阶段是开发期可控性最强的阶段，因为加载阶段不仅可以使用系统提供的类加载器来完成，也可以使用用户自定义的类加载器来完成。

虚拟机可以从多个路径来完成加载过程，比如 ZIP 包（jar、war等）、Applet、java.lang.reflect.Proxy、文件（JSP 等）...

在加载阶段，虚拟机需要完成以下三件事情：

- 通过一个类的全限定名来获取定义此类的二进制字节流。
- 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构。
- 在 Java 堆中生成一个代表这个类的 java.lang.Class 对象，作为方法区这些数据的访问入口。

### 2. 验证

验证阶段的目的是为了确保 Class 文件的字节流中包含的信息符合当前虚拟机的要求，并且不会危害虚拟机自身的安全。比如验证是否符合 Class 文件格式的规范、验证代码语义是否符合 Java 语言的规范等。

### 3. 准备

准备阶段是正式为类变量（被 static 修饰的变量）分配内存并设置类变量初始值（数据类型的零值）的阶段，这些内存都将在方法区中进行分配。注意这里不包括实例变量，实例变量将会在对象实例化的时随着对象一起分配在 Java 堆中。

### 4. 解析

解析阶段是虚拟机将常量池内的符号引用替换为直接引用的过程，解析动作主要针对类或接口、字段、类方法和接口方法四类符号引用进行。

符号引用以一组符号来描述所引用的目标，符号可以是任何形式的字面量，只要使用时能无歧义地定位到目标即可。比如 Class 文件中的 CONSTANT_Class_info、CONSTANT_Fieldref_info、CONSTANT_Methodref_info 等类型的常量。

直接引用可以是直接指向目标的指针、相对偏移量或是一个能间接定位到目标的句柄。如果有了直接引用，那引用的目标必定已经在内存中存在。

### 5. 初始化

初始化阶段才真正开始执行类中定义的 Java 代码，该阶段根据程序制定的主观计划去初始化类变量和其他资源。

初始化阶段就是执行 () 方法的过程，() 方法是由编译器自动收集类中的所有类变量的赋值动作和静态语句块（static{} 块）中的语句合并产生的。

- ``() 不需要显示的调用父类的 ``() 方法，虚拟机会保证在子类的 ``() 方法执行之前，父类的 ``() 方法已经执行完毕，因此虚拟机第一个执行 ``() 方法的类一定是 java.lang.Object。
- ``() 方法对于类或接口来说并不是必须的，如果没有类变量的赋值动作和静态语句块（static{} 块），则不会生成 ``() 方法。
- 接口的 ``() 方法不需要先执行父接口的 ``() 方法，只有当父接口定义的变量被使用时，父接口才会被初始化。
- 虚拟机会保证一个类的 ``() 方法在多线程环境中被正确地加锁和同步。

## 三、类加载器

类加载器通过一个类的全限定名来获取描述此类的二进制字节流。

类加载器在类层次划分、OSGi、热部署、代码加密等领域发挥着重要的作用。

比较两个类是否“相等”，只有在这两个类是由同一个类加载器加载的前提之下才有意义，否则，即使这两个类是来源于同一个 Class 文件，只要加载它们的类加载器不同，那这两个类就必定不相等。这里的“相等”包括 equal() 方法、isAssignableForm() 方法、isInstance() 方法和 instanceof 关键字。

下面的例子可以看到，虽然都是来自同一个 Class 文件，但是因为类加载器不同，依然是两个独立的类，自然不会“相等”。

```java
public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException {
    // 自定义简单类加载器
    ClassLoader myClassLoader = new ClassLoader() {
        @Override
        public Class<?> loadClass(String name) throws ClassNotFoundException {
            try {
                String fileName = name.substring(name.lastIndexOf(".") + 1) + ".class";
                InputStream inputStream = getClass().getResourceAsStream(fileName);
                if (inputStream == null) {
                    return super.loadClass(name);
                }
                byte[] bytes = new byte[inputStream.available()];
                inputStream.read(bytes);
                return defineClass(name, bytes, 0, bytes.length);
            } catch (IOException e) {
                e.printStackTrace();
            }
            return super.loadClass(name);
        }
    };
    Object newInstance = myClassLoader.loadClass("org.jvm.demo.chapter7.ClassLoaderTest").newInstance();
    System.out.println(newInstance.getClass()); // org.jvm.demo.chapter7.ClassLoaderTest
    System.out.println(newInstance instanceof org.jvm.demo.chapter7.ClassLoaderTest); // false
}
```

绝大部分 Java 程序都会使用到以下三种系统提供的类加载器：

- 启动类加载器（Bootstrap ClassLoader）：负责加载 JAVA_HOME\lib 或着 -Xbootclasspath 参数指定目录下的类库，加载内容按文件名识别，如 rt.jar，启动类加载器无法被 Java 程序直接引用。
- 扩展类加载器（Extension ClassLoader）：负责加载 JAVA_HOME\lib\ext 或者 java.ext.dirs 系统变量所指定的所有类库，该加载器由 sun.misc.Launcher`$`ExtClassLoader 实现，开发者可以直接使用扩展类加载器 — Launcher.getLauncher().getClassLoader()。
- 应用程序类加载器（Application ClassLoader）：负责加载用户类路径 ClassPath 上所指定的类库，如果应用程序没有自定义过自己的类加载器，一般情况下就是程序的默认类加载器，该加载器由 sun.misc.Launcher`$`AppClassLoader 实现，开发者可以直接使用这个类加载器 — ClassLoader.getSystemClassLoader()。

## 四、双亲委派模型

如图所示类加载器之间的层次关系，就称为类加载器的双亲委派模型。双亲委派模型要求除了顶层的启动类加载器外，其余的类加载器都应当有自己的父类加载器。这里类加载器之间的父子关系一般不会以继承的关系来实现，而是都使用组合关系来复用父加载器的代码。

双亲委派模型的工作过程是：如果一个类加载器收到了类加载的请求，它首先不会自己去尝试加载这个类，而是把这个请求委派给父类加载器去完成，每一个层次的类加载器都是如此。

双亲委派模型对于保证 Java 程序的稳定运作很重要，它让 Java 类随着它的类加载器一起具备了一种带有优先级的层次关系。

双亲委派模型不是一个强制性的约束模型，而是 Java 设计者们推荐给开发者们的一种类加载器的实现方式。

JDK9 后，扩展类加载器（Extension Class Loader）被平台类加载器（Platform Class Loader）取代。这其实是一个很顺理成章的变动，既然整个 JDK 都基于模块化进行构建（原来的 rt.jar 和 tools.jar 被拆分成数十个 JMOD 文件），其中的 Java 类库就已天然地满足了可扩展的需求，那当然无须再保留\lib\ext目录，此前使用这个目录或者 java.ext.dirs 系统变量来扩展 JDK 功能的机制已经没有继续存在的价值了，用来加载这部分类库的扩展类加载器也完成了它的历史使命。

JDK9 后，平台类加载器和应用程序类加载器都不再派生自 java.net.URLClassLoader。启动类加载器、平台类加载器和应用程序类加载器全部继承于 jdk.internal.loader.BuiltinClassLoader，在 BuiltinClassLoader 中实现了新的模块化架构下类如何从模块中加载的逻辑，以及模块中资源可访问性的处理。

JDK9 后，虽然仍然维持着三层类加载器和双亲委派的架构，但类加载的委派关系也发生了变动。当平台及应用程序类加载器收到类加载请求，在委派给父加载器加载前，要先判断该类是否能够归属到某一个系统模块中，如果可以找到这样的归属关系，就要优先委派给负责那个模块的加载器完成加载，也许这可以算是对双亲委派模型的破坏。
