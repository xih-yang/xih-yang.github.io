# 17、JDK 源码：Compiler
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/17.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Compiler这个类被用于支持Java到本地代码编译器和相关服务。在设计上，这个类啥也不做，他充当JIT编译器实现的占位符。

放JVM虚拟机首次启动时，他确定系统属性java.compiler是否存在（系统属性可以通过System类的getProperty(String)和getProperty(String,String)方法获取）。如果存在，就被认定为是库的名称（跟平台依赖相关的确切位置和类型）；然后调System.loadLibrary来加载这个库。如果加载成功，函数在库中的名字Wiejava_lang_Compiler_start()。

如果编译器不可用，那么这些方法啥也不干。

## 二、源码解析

这又是一个native级别的类，所以属性和方法上均有native关键字。

类定义：

```java
public final class Compiler 
```

有一个私有无参构造，不要使用它构造实例，即使通过反射。

```java
//编译指定的类
public static native boolean compileClass(Class<?> clazz);
//编译名称与指定字符串匹配的所有类
public static native boolean compileClasses(String string);
//使编译器恢复运行
public static native void enable();
//使编译器停止运行
public static native void disable();
//检查参数类型及字段，并执行一些文档化操作， 不需要具体的操作。
public static native Object command(Object any);
```

一个静态代码块，主要的逻辑

```java
static {
registerNatives();
java.security.AccessController.doPrivileged(
    new java.security.PrivilegedAction<Void>() {
        public Void run() {
            boolean loaded = false;
            String jit = System.getProperty("java.compiler");
            if ((jit != null) && (!jit.equals("NONE")) &&
                (!jit.equals("")))
            {
                try {
                    System.loadLibrary(jit);
                    initialize();
                    loaded = true;
                } catch (UnsatisfiedLinkError e) {
                    System.err.println("Warning: JIT compiler \"" +
                      jit + "\" not found. Will use interpreter.");
                }
            }
            String info = System.getProperty("java.vm.info");
            if (loaded) {
                System.setProperty("java.vm.info", info + ", " + jit);
            } else {
                System.setProperty("java.vm.info", info + ", nojit");
            }
            return null;
        }
    });
}
```
