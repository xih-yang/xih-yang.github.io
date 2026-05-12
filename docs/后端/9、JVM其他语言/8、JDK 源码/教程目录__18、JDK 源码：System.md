# 18、JDK 源码：System
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/18.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

System是用的非常多的一个final类。它不能被实例化。System类提供了标准的输入输出和错误输出流；访问外部定义的属性和环境变量；加载文件和库的方法；以及高效的拷贝数组中一部分元素的方法。

## 二、类定义和属性

```java
public final class System 
```

三个流：

```java
public final static InputStream in = null;
public final static PrintStream out = null;
public final static PrintStream err = null;
```

err：按照惯例，此输出流用于显示错误消息或应该立即引起用户注意的其他信息，即使主要输出流（变量`out`的值已重定向到文件或其他目标，即通常不会持续监控。

## 三、主要方法介绍

修饰符和类型
方法及描述

static void
arraycopy(Object src, int srcPos, Object dest, int destPos, int length)

将指定源数组中的数组从指定位置复制到目标数组的指定位置。

static String
clearProperty(String key)

删除指定键指定的系统属性。

static Console
console()

返回与当前Java虚拟机关联的唯一的[Console](http://www.matools.com/file/manual/jdk_api_1.8_google/java/io/Console.html)对象（如果有）。

static long
currentTimeMillis()

返回当前时间（以毫秒为单位）。

static void
exit(int status)

终止当前运行的Java虚拟机。

static void
gc()

运行垃圾回收器。

static Map
getenv()

返回当前系统环境的不可修改的字符串映射视图。

static String
getenv(String name)

获取指定环境变量的值。

static Properties
getProperties()

确定当前的系统属性。

static String
getProperty(String key)

获取指定键指示的系统属性。

static String
getProperty(String key, String def)

获取指定键指示的系统属性。

static SecurityManager
getSecurityManager()

获取系统安全界面。

static int
identityHashCode(Object x)

返回与默认方法hashCode（）返回的给定对象相同的哈希码，无论给定对象的类是否覆盖了hashCode（）。

static Channel
inheritedChannel()

返回从创建此Java虚拟机的实体继承的通道。

static String
lineSeparator()

返回与系统相关的行分隔符字符串。

static void
load(String filename)

加载由filename参数指定的本机库。

static void
loadLibrary(String libname)

加载 `libname`参数指定的本机库。

static String
mapLibraryName(String libname)

将库名称映射到表示本地库的平台特定字符串。

static long
nanoTime()

以纳秒为单位返回正在运行的Java虚拟机的高分辨率时间源的当前值。

static void
runFinalization()

运行任何对象等待定稿的最终化方法。

static void
runFinalizersOnExit(boolean value)已弃用

这种方法本质上是不安全的。 它可能导致在活动对象上调用finalizer，而其他线程同时操作这些对象，导致不稳定的行为或死锁。

static void
setErr(PrintStream err)

重新分配“标准”错误输出流。

static void
setIn(InputStream in)

重新分配“标准”输入流。

static void
setOut(PrintStream out)

重新分配“标准”输出流。

static void
setProperties(Properties props)

将系统属性设置为 `Properties`参数。

static String
setProperty(String key, String value)

设置由指定键指示的系统属性。

static void
setSecurityManager(SecurityManager s)

设置系统安全性。

```java
//返回当前时间（以毫秒为单位）。 请注意，虽然返回值的时间单位为毫秒，但该值的粒度取决于底层操作系统，并且可能较大。 例如，许多操作系统以几十毫秒为单位测量时间。
public static long currentTimeMillis()
//以纳秒为单位返回正在运行的Java虚拟机的高精度时间值。一般用于测量方法执行时间。
public static long nanoTime()
```

```java
//数组拷贝的native方法，将指定源数组中的数组从指定位置复制到目标数组的指定位置。
public static native void arraycopy(Object src,  int  srcPos, Object dest, int destPos, int length);
```

可以通过`getProperty、getProperties、getenv获取系统属性和环境变量。`需要注意，部分方法在执行的时候，需要安全管理的验证：SecurityManager。

在没啥了，挺简单的一个类。源码再往下翻就是native级别了，都是c++实现的。

over！
