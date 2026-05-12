# 19、JDK 源码：Package
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/19.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Package对象包含有关Java包的实现和规范的版本信息。 该版本信息由加载该类的[ClassLoader](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/ClassLoader.html)实例检索并提供。 通常，它存储在与类分发的清单中。构成包的一组类可以实现特定的规范。

在每个`ClassLoader`实例中，来自同一个java包的所有类都具有相同的Package对象。 静态方法允许通过名称找到一个包，或者找到当前类加载器已知的所有包的集合。

## 二、方法

```java
//返回此包的名称。
public String getName()
//返回此程序包实现的规范的标题。
public String getSpecificationTitle()
```

```java
//在实例中按名称查找包
public static Package getPackage(String name) {
    ClassLoader l = ClassLoader.getClassLoader(Reflection.getCallerClass());
    if (l != null) {
        return l.getPackage(name);
    } else {
        return getSystemPackage(name);
    }
}
```

## 三、package的作用

package 的作用就是 c++ 的 namespace 的作用，防止名字相同的类产生冲突。Java 编译器在编译时，直接根据 package 指定的信息直接将生成的 class 文件生成到对应目录下。如 package aaa.bbb.ccc 编译器就将该 .java 文件下的各个类生成到 ./aaa/bbb/ccc/ 这个目录。

import 是为了简化使用 package 之后的实例化的代码。假设 ./aaa/bbb/ccc/ 下的 A 类，假如没有 import，实例化A类为：new aaa.bbb.ccc.A()，使用 import aaa.bbb.ccc.A 后，就可以直接使用 new A() 了，也就是编译器匹配并扩展了 aaa.bbb.ccc. 这串字符串。
