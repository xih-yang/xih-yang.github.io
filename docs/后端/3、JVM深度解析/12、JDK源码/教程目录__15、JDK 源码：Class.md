# 15、JDK 源码：Class
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/15.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Class的实例代表着正在运行的Java应用程序的类和接口。枚举是一种类，而直接是一种接口。每一个数组也属于一个类，这个类b被反射为具有相同元素类型和维数的所有数组共享的类对象。八大基本树类型和void关键字也都有属于自己的类对象。

Class没有public的构造器，由JVM虚拟机调用类加载器中的defineClass方法来构造。

## 二、代码剖析

类定义：

```java
public final class Class<T> implements java.io.Serializable,GenericDeclaration,Type,AnnotatedElement
```

构造方法：这是一个有参的私有构造，只能有2JVM虚拟机在创建对象时使用，这个构造可以防止默认的无参构造被使用。

```java
private Class(ClassLoader loader) {
   classLoader = loader;
}
```

toString方法：会打印一个Class是类还是接口，以及它的名字。

```java
public String toString() {
    return (isInterface() ? "interface " : (isPrimitive() ? "" : "class "))
        + getName();
}
```

toGenericString()：jdk1.8新增方法，返回包含修饰符和参数在内的类信息。

```java
public String toGenericString() {
    if (isPrimitive()) {
        return toString();
    } else {
        StringBuilder sb = new StringBuilder();
        // Class modifiers are a superset of interface modifiers
        int modifiers = getModifiers() & Modifier.classModifiers();
        if (modifiers != 0) {
            sb.append(Modifier.toString(modifiers));
            sb.append(' ');
        }
        if (isAnnotation()) {
            sb.append('@');
        }
        if (isInterface()) { // Note: all annotation types are interfaces
            sb.append("interface");
        } else {
            if (isEnum())
                sb.append("enum");
            else
                sb.append("class");
        }
        sb.append(' ');
        sb.append(getName());
        TypeVariable<?>[] typeparms = getTypeParameters();
        if (typeparms.length > 0) {
            boolean first = true;
            sb.append('<');
            for(TypeVariable<?> typeparm: typeparms) {
                if (!first)
                    sb.append(',');
                sb.append(typeparm.getTypeName());
                first = false;
            }
            sb.append('>');
        }
        return sb.toString();
    }
}
```

public static Class forName(String className)

通过类或接口的名字获取对应的Class对象。

forName(className,true, this.getClass().getClassLoader())：

Class.forName(className)实际上是调用Class.forName(className,true, this.getClass().getClassLoader())。第二个参数，是指Class被loading后是不是必须被初始化。最终都调用了native方法去实现。

public T newInstance() throws InstantiationException, IllegalAccessException

为类创建一个类实例，这个方法用的比较多。newInstance()方法调用默认构造器（无参数构造器）初始化新建对象。

public native boolean isArray()：判断对象是否为数组，由native实现。

public native boolean isPrimitive()：判断是否基本数据类型。

isSynthetic()：当且仅当这个类是Java语言规范定义的一种合成类此方法返回true。synthetic总的来说，是由编译器引入的字段、方法、类或其他结构，主要用于JVM内部使用。有关合成类请参考：[https://blog.csdn.net/a327369238/article/details/52608805](https://blog.csdn.net/a327369238/article/details/52608805)。

public ClassLoader getClassLoader()：返回类加载器。

接着有一大堆的get方法，可以获取类型参数，父类，泛型父类，包，接口们，泛型接口们，方法，属性等各种各样可用于反射的方法。

## 三、总结

**最后用最简单的描述来区分new关键字和newInstance()方法的区别：**

**1、** newInstance:弱类型低效率只能调用无参构造；

**2、** new:强类型相对高效能调用任何public构造；
