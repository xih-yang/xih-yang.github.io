# 02、JVM 实战 - JVM之类加载器
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/2.html
- 分类：JVM 实战
- 分组：教程目录
在类加载过程的加载阶段，有一个通过类的全限定名获取描述类的二进制流的动作，Java虚拟机设计团队有意将这个动作的实现放到虚拟机之外实现，以便让用户自己决定如何获取所需类，这个动作的实现被称为类加载器。JVM根据职能的不同，设计了以下四种类加载器：

**1、** 引导类加载器(BootStrap ClassLoader)

**2、** 扩展类加载器(Extension ClassLoader)

**3、** 应用程序类加载器(Application ClassLoader)

**4、** 自定义类加载器(User ClassLoader)

前三种是虚拟机自带的类加载器，自定义类加载器是用户根据自己的需求设计的类加载器，下图是四种类加载器之间的关系，图中所表示的层次关系，并非类的继承关系，而是描述类加载器协作关系，通常这个协作关系通过组合的方式实现（设计模式中的组合，通过组合复用父类加载器的代码，除了引导类加载器，其他类加载器都有父类加载器），这个协作动作的实现被称为"双亲委派模型"，后面的篇章中单独讲。

在Java程序中可按照如下代码获取除引导类加载器外的各个类加载器。

```java
public class ClassLoaderTest {
    public static void main(String[] args) {
        // (启动类)系统类加载器：
        ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
        System.out.println(systemClassLoader); //sun.misc.Launcher$AppClassLoader@18b4aac2
        //扩展类加载器:
        ClassLoader extendClassLoader = systemClassLoader.getParent();
        System.out.println(extendClassLoader); //sun.misc.Launcher$ExtClassLoader@1b6d3586
        // 引导类加载器:
        ClassLoader bootstrapClassLoader = extendClassLoader.getParent();
        System.out.println(bootstrapClassLoader); // null
         // 用户自定义的类默认用系统类加载器
        ClassLoader classLoader = ClassLoaderTest.class.getClassLoader();
        System.out.println(classLoader); // sun.misc.Launcher$AppClassLoader@18b4aac2
    }
}
```

### 一、引导类加载器

引导类加载器是由C/C++语言实现，嵌套在虚拟机内部，用来加载java核心库中的类，特性如下：

**1、** 只加载JAVA_HOME/jre/lib/rt.jar、resources.jar或sun.boot.class.path路径下的内容

**2、** 加载扩展类和应用程序类类加载器，并且是它们的父类加载器，不继承ClassLoader类，其本身没有父类加载器。

**3、** 出于安全考虑，只加载包名为java、javax、sun开头的类

**4、** 引导类加载器无法通过getClassLoader()方法获取，只会返回null，如String.class.getClassLoader()。

### 二、扩展类加载器

扩展类加载器是Java语言实现的类加载器，在sun.misc.Launcher.ExtClassLoader中实现，派生于ClassLoader类，特性：

1、本身先有引导类加载器加载，父类加载器为引导类加载器（非继承关系）。

2、加载java.ext.dirs系统属性所指定的目录中的类库，或者加载JDK安装目录的jre/ext/dir扩展目录下的类库，用户可以将自己的jar放入该目录，通过扩展类加载器加载。

### 三、应用程序类加载器

应用程序类加载器也是Java语言实现的类加载器，在sun.misc.Launcher.AppClassLoader中实现，派生于ClassLoader类，特性：

1、本身先有引导类加载器加载，父类加载器为扩展类加载器（非继承关系）。

2、加载环境变量classpath或者java.class.path属性指定的目录下的类库。

3、程序中默认的类加载器，一般的Java应用程序都由它加载，可以通过java.lang.ClassLoader#getSystemClassLoader方法获取。

### 四、用户自定义类加载器

对于某一些特殊的类加载需求，用户可以通过继承ClassLoader实现自定义的类加载器，通过自定义类加载器，可以在以下的需求场景使用：

1、隔离类，如类路径冲突。

2、防反编译加密Class文件。

3、扩展类的加载源。

自定义实现类加载器可以通过继承java.lang.ClassLoader并重写loadClas()方法或者实现findClass()（推荐）方法，如下代码就是加载指定目录class的简单实现。

```java
public class DirClassLoader extends ClassLoader {
    private String dir;  // 指定目录
    public DirClassLoader(String dir) {
        this.dir = dir;
    }
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // class文件路径
        String classPath = dir + File.separator + name + ".class";
        try (InputStream is = new FileInputStream(classPath)){
            byte[] b = new byte[is.available()];
            is.read(b);
            return defineClass(name, b, 0, b.length);
        } catch (Exception ex) {
            throw new ClassNotFoundException();
        }
    }
    public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException {
        DirClassLoader dirClassLoader = new DirClassLoader("D:\\setup");
        Object obj = dirClassLoader.loadClass("Hello").newInstance();
        System.out.println(obj.getClass());
        System.out.println(obj.getClass().getClassLoader());
    }
}
```

###

### 五、类在虚拟机中的唯一性

在虚拟机中，每个类的唯一性，由类和类加载器两个因素决定，也就是即使同一个类被不同类加载器加载，也会导致这两个类不相同。在上篇文章说过，类加载完成以后会在堆区生成一个类的java.lang.Class对象作为外部接口访问方法区对应的类信息，这个操作具象化就是Object的getClass()方法。getClass()获取到类的Class对象，从而根据getClassLoader()方法获取类加载器，下面代码中自定义了类加载器MyClassLoader，在main中通过自定义类加载器加载一次ClassLoaderUniqueTest类并创建实例，同时在执行main方法时，虚拟机会通过应用程序类加载器加载一次ClassLoaderUniqueTest类，最后通过instanceof比较类型，这个比较类型并不限于instanceof，还可以用equals。

```java
public class ClassLoaderUniqueTest {
    // 自定义类加载器
    static class MyClassLoader extends ClassLoader {
        @Override
        public Class<?> loadClass(String name) throws ClassNotFoundException {
            try {
                String fileName = name.substring(name.lastIndexOf(".") + 1) + ".class";
                InputStream is = this.getClass().getResourceAsStream(fileName);
                if (is == null) {
                    return super.loadClass(name);
                }
                byte[] b = new byte[is.available()];
                is.read(b);
                return defineClass(name, b, 0, b.length);
            } catch (IOException e) {
                throw new ClassNotFoundException();
            }
        }
    }
    public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException {
        ClassLoader myClassLoader = new MyClassLoader();
        Object obj = myClassLoader.loadClass("classloder.ClassLoaderUniqueTest").newInstance();
        System.out.println(obj.getClass().getClassLoader());
        System.out.println(obj instanceof classloder.ClassLoaderUniqueTest);
    }
}
```

执行结果

```java
classloder.ClassLoaderUniqueTest$MyClassLoader@74a14482
false
```
