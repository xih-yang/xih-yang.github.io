# 04、Java 9 新特性 – 模块化
- 来源：https://ddkk.com/zhuanlan/java/java9/4.html
- 分类：Java新特性
- 分组：教程目录
Java 9 最大的特性就是模块化 ( Module ) 了。本章，我们就对这个 **模块化** 进行一些简单的讲解，包括 Java 9 模块化的概念、如何实现、如何使用等

对于Java 9 来说，模块化 ( Module ) 是一个新引入的新型的编程组件 ( Component )

因为是一个组件，所以也是一个自我完备的系统，是代码和数据的自描述的集合，而且有一个自我标识的名称，也就是模块名

## Java 9 模块化的特性

Java 9 为了引入新的模块化的编程方式，特意增强和改进了一些功能，也添加了一些新的特性

**1、** Java程序编译运行过程中，引入了一个新的可选的阶段「链接时间」(linktime)；

这个阶段介于编译时和运行时之间

在该阶段，可以组装和优化一组模块，可以使用 jLink工具制作自定义运行时镜像 ( image )

**2、** javac、jlink和java三个命令都添加了一些可选项用于指定模块路径；

这些选项用于指定模块的定义位置

**3、** 增强JAR格式，更新JAR格式更新为模块化JAR，并且在JAR根目录下包含module-info.class文件；

**4、** 引入了JMOD格式，这种一种类似于JAR的新的打包格式，这种格式中可以包含本地(native)代码和配置文件；

**5、** 特意引入了module关键字，用于定义一个模块，不过这个关键字仅限于module-info.java中使用；

## 模块化的概念

从Java 9 为模块化的改变来看，Java 9 中的模块化其实就是一个 JAR 或 JMOD 格式的归档文件，该归档文件里包含了一些代码和数据还有一些配置文件，其中一定包含了一个名为 module-info.class 的文件，在该文件中定义了模块的一些信息

## 创建一个 Java 9 模块

接下来我们来看看如何定义一个 Java 9 模块，假设我们想要定义的模块名为 com.ddkk.module.greeting

假设我们的工作目录为 d:\devops\java9，当前项目的名为 greeting

**1、** 首先，我们要做的就是创建com.ddkk.module.greeting目录，也就是创建目录；

```java
d:\devops\java9\greeting\src\com.ddkk.module.greeting
```

注意，目录名和模块名要一致。

如果使用 tree . 命令，可以看到目录结构如下

```java
[penglei@ddkk.com src]$ tree .
.
└── com.ddkk.module.greeting
```

**2、** 然后，在\src\com.ddkk.module.greeting目录下新建一个名为module-info.java文件，并输入以下内容；

```java
module com.ddkk.module.greeting { }
```

注意，特别注意 module 关键字后的包名，要个目录名一致，其实它就是定义当前模块名，同时，不要忽略那对大括号 {}

module-info.java 是用于创建模块的文件，按照惯例，此文件应驻留在名称与模块名称相同的文件夹中

创建完成后，src 目录结构如下

```java
[penglei@ddkk.com src]$ tree .
.
└── com.ddkk.module.greeting
    └── module-info.java
```

**3、** 添加源代码包；

假设我们的测试代码都处于 com.module.greeting 包下，那么，就要在 \src\com.ddkk.module.greeting 目录下再创建目录 com/module/greeting

创建完成后，目录结构如下

```java
[penglei@ddkk.com src]$ tree .
.
└── com.ddkk.module.greeting
    ├── com
    │   └── module
    │       └── greeting
    └── module-info.java
```

**4、** 然后我们在这个称之为com/module/greeting的包下创建一个名为ModuleTester.java的文件，用于测试目的；

内容如下，很简单，就是输出 Hello World 文件而已

```java
package com.module.greeting;
public class ModuleTester {
   public static void main(String[] args) {
      System.out.println("Hello World!");
   }
}
```

> 这是是方便起见，也是管理，所以将源代码及其包放在模块的目录下

```java
[penglei@ddkk.com src]$ tree .
.
└── com.ddkk.module.greeting
    ├── com
    │   └── module
    │       └── greeting
    │           └── ModuleTester.java
    └── module-info.java
```

**5、** 在d:\devops\java9\greeting\目录下，也就是和src的同级，创建一个文件夹mods，然后再这个目录下创建一个和模块名相同的目录结构，也就是；

```java
d:\devops\java9\greeting\mods\com.ddkk.module.greeting
```

创建完之后，devops\java9\greeting 目录结构如下

```java
[penglei@ddkk.com greeting]$ tree .
.
├── mods
│   └── com.ddkk.module.greeting
└── src
    └── com.ddkk.module.greeting
        ├── com
        │   └── module
        │       └── greeting
        │           └── ModuleTester.java
        └── module-info.java
```

**6、** 接下来，跳转到d:\devops\java9\greeting\目录，并使用下面的命令来编译我们的模块；

```java
[penglei@ddkk.com greeting]$ javac -d mods/com.ddkk.module.greeting src/com.ddkk.module.greeting/module-info.java src/com.ddkk.module.greeting/com/module/greeting/ModuleTester.java
```

上面的命令运行完之后，目录结构如下

```java
[penglei@ddkk.com greeting]$ tree .
.
├── mods
│   └── com.ddkk.module.greeting
│       ├── com
│       │   └── module
│       │       └── greeting
│       │           └── ModuleTester.class
│       └── module-info.class
└── src
    └── com.ddkk.module.greeting
        ├── com
        │   └── module
        │       └── greeting
        │           └── ModuleTester.java
        └── module-info.java
```

可以看到 mods 目录下存在一些和 src 目录下相同的目录结构的 .class 文件

**7、** 然后，还是在当前目录下，我们就可以使用java命令来运行刚刚编译好的模块了；

```java
[penglei@ddkk.com greeting]$ java --module-path mods -m com.ddkk.module.greeting/com.module.greeting.ModuleTester
Hello World!
```

运行结果如下为 Hello World ，Bingoooo，模块可以作为独立文件完美运行

## 结束语

还剩下一个主题，就是将这个模块链接到其它的项目中，这个以后有空我们再来讲解吧
