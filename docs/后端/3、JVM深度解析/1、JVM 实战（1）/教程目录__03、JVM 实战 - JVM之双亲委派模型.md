# 03、JVM 实战 - JVM之双亲委派模型
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/3.html
- 分类：JVM 实战
- 分组：教程目录
在之前的JVM类加载器篇中说过，各个类加载器都有自己加载的范围，比如引导类加载器只加载Java核心库中的class如String，那如果用户自己建一个包名和类名与String相同的类，会不会被引导类加载器加载。可以通过如下代码测试，通过执行结果中的报错信息可以发现，JVM实际上加载了rt.jar中的String类，并未加载自定义的String，这个就是JVM的双亲委派模型解决的问题之一。

```java
package java.lang;
public class String {
    static {
        System.out.println("自定义String");
    }
    public static void main(String[] args) {
        System.out.println("1");
    }
}
```

运行结果

```java
错误: 在类 java.lang.String 中找不到 main 方法, 请将 main 方法定义为:
   public static void main(String[] args)
否则 JavaFX 应用程序类必须扩展javafx.application.Application
```

###

### 一、双亲委派工作原理

JVM对class文件是按需加载，在加载class的过程，如果当前类加载器存在父类加载器，都会将加载请求先委派给父类加载器，这种任务委派方式被称为双亲委派。

在前面的篇章中说过，类加载器之间存在非继承的层次关系（如下图），这种层次关系让类加载器加载的类也具有优先级，也就是前面示例中rt.jar中的String优于自定义String的加载，这种优先级加载详细原理如下：

1、当一个类加载器收到加载请求，他并不会自己加载，而是把加载请求委托给父类加载器。

2、如果父类加载器也存在父类加载器，继续向上委托，如此递归，直至最顶层引导类加载器。

3、如果父类加载器能完成类的加载，就正常返回，反之，由子类进行加载，递归依次向下。

### 二、优点

1、避免全限定名相同的类被重复加载，导致程序异常。

2、保护程序，防止核心库API被篡改。

### 三、Java源码实现

双亲委派是在ClassLoader的loadClass()方法中实现，代码很少，作用很强大，源码如下。

```java
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        // First, check if the class has already been loaded
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                // 实现委派
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // ClassNotFoundException thrown if class not found
                // from the non-null parent class loader
            }
            if (c == null) {
                // If still not found, then invoke findClass in order
                // to find the class.
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

### 四、SPI机制打破双亲委派

SPI(Service Provider Interface)，是一种服务发现机制，它通过在ClassPath路径下的META-INF/services文件夹查找文件，自动加载文件里所定义的类，如JDBC驱动。如下图，SPI核心类定义在rt.jar中（如java.lang.Driver接口），所以本身是由启动类加载器加载，当调用SPI接口的实现类时，启动类加载器是无法加载实现类的，这个时候就提供了线程上下文类加载器(Thread Context ClassLoader)加载实现类，ThreadContextClassLoader是可以通过java.lang.Thread#setContextClassLoader方法设置，如果没有设置默认为ApplicationClassLoader,这样双亲委派模型中ApplicationClassLoader->BootStrapClassLoader的委派，变成了BootStrapClassLoader->ApplicationClassLoader的委派，这样就打破了双亲委派的类加载模式。
