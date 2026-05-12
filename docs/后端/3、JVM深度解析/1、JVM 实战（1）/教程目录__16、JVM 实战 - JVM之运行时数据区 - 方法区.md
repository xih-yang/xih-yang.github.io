# 16、JVM 实战 - JVM之运行时数据区 - 方法区
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/16.html
- 分类：JVM 实战
- 分组：教程目录
### 一、方法区(Method Area)

JVM虚拟机规范中虽然在逻辑上将方法区描述为堆区的一部分，但对于HotSpot虚拟机而言，还有一个别名Non-Heap(非堆)，目的是与堆区分开。方法也是线程共享的区域，在JVM启动的时候被创建，并且，和堆区一样可以是逻辑上连续，物理上不连续的区域。

方法区包含了四部分内容；

**类型信息**：类的版本、接口、字段、方法等描述信息。

**运行时常量池**：Class文件加载后的常量池数据（各种字面量和符号引用），直接引用，字符串常量池（JDK8移入Java堆中）。字面量：各种文本字符串、final常量值、基本类型数据数值等，如描述Object类的"()Ljava/lang/Object"字符串就是一个字面量。*符号引用：如cp info #44 ，#44就是对toString方法的符号引用。*

**JIT代码缓存**：即时编译器编译后的代码缓存。

**静态变量**：类中的静态变量，JDK7以后移入Java堆中，并且将静态变量存在类型数据对应的java.lang.Class实例里面，下面是引自《深入理解Java虚拟机》的图。

### 二、方法区实现的变化

JDK8以前，很多人把方法区称为永久代（Permanent Generation），实际上两者并不等价，这一说法是因为HotSpot虚拟机将垃圾收集分代设计将区域扩展到方法区，或者说永久代是方法区的实现。由于永久代更容易OOM，所以该设计在JDK7以后逐渐被淘汰，JDK1.7以后将字符串常量池和静态变量移入堆区，在JDK8以后，就不再有永久代说法，而是元空间（Meta Space）实现方法区。元空间和永久代最大的区别就是元空间不在JVM内存之中，而是使用本地内存，这样可以大大降低方法区的OOM。

**字符串常量池被移到Java堆的原因？**

方法区的垃圾回收只有在Full GC时才会发生，又因为String字符串创建频繁，放回堆中，使得能够及时回收。

### 三、方法区大小设置

#### 1、永久代（JDK1.7）

- -XX:PermSize : 永久代初始化内存，默认20.75M, -XX:PermSize=20m
- -XX:MaxPermSize: 永久代最大内存，32位虚拟机默认64M， 64位默认82M，超出时会报java.lang.OutOfMemoryError:PermaGen space

#### 2、元空间（JDK1.8）

- -XX:MetaspaceSize:元空间初始化内存，默认是21M
- -XX:MaxMetaspaceSize:元空间最大内存，默认是-1无限制。虽然使用直接内存，但是当无法再为Metaspace分配内存时，将会抛出java.lang.OutOfMemoryError: Metaspace

### 四、方法区OOM

#### 1、字符串常量池溢出导致OOM

基于JDK1.6，字符串常量池在永久代之中，-XX:MaxPermSize=6m限制永久代最大内存为6M，执行以下代码，将会出现java.lang.OutOfMemoryError: PermaGen space

```java
public class PermGenOOMDemo {
    public static void main(String[] args) {
        Set<String> set = new HashSet<>();
        short i = 0;
        while (true) {
            set.add(String.valueOf(i++).intern());
        }
    }
}
```

JDK1.7以后字符串常量池进入Java堆，执行以上代码就不会出现OOM，而限制最大堆内存-Xmx之后，将同样出现OOM，只不过错误变成java.lang.OutOfMemoryError: Java heap space。

#### 2、类型数据加载导致OOM

类型数据是方法区的主要组成部分，无论JDK1.6、JDK1.7或是1.8在设置永久代上限或元空间上限的情况下，都会出现OOM，如下代码，引入CGLib依赖，不断创建动态代理类放入方法区:

- 当JVM参数为-XX:MaxPermSize=6m时，抛出异常java.lang.OutOfMemoryError: PermaGen space
- 当JVM参数为—XX:MaxMetaspaceSize=6m时，抛出异常java.lang.OutOfMemoryError: Metaspace

```java
<dependency>
    <groupId>cglib</groupId>
    <artifactId>cglib</artifactId>
    <version>3.3.0</version>
</dependency>
```

```java
public class MethodOOM {
    static class OOMObject {
    }
    public static void main(final String[] args) {
        while (true) {
            Enhancer enhancer = new Enhancer();
            enhancer.setSuperclass(OOMObject.class);
            enhancer.setUseCache(false);
            enhancer.setCallback(new MethodInterceptor() {
                public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
                    return methodProxy.invokeSuper(o, args);
                }
            });
            enhancer.create();
        }
    }
}
```
