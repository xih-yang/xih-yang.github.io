# 07、Java 9 新特性 – 多版本共存 JAR
- 来源：https://ddkk.com/zhuanlan/java/java9/7.html
- 分类：Java新特性
- 分组：教程目录
Java 9 之前的 JAR 格式中只能包含一个 Java 版本，显然，这是不符合 Java 这种开启了版本帝的发展线路了，想想，现在大多数 Java 还停留在 Java 6 7 8 的年代，Java 10 已经发布，如果要发布一个 JAR 格式的类库，意味着要编译多个版本的 JAR， 6 7 8 9 10 五个版本，看起来也太恐怖了。

Java 9 突然间良心发现，开始支持多版本共存的 JAR 了。

Java 9 引入了一个新的功能，其实也不算吧，就是增强了 JAR 格式，可以在同一个 JAR 中维护和使用不同版本的 java 类或资源

## JAR 多版本共存原理

首先在JAR 中，文件 MANIFEST.MF 文件的 main 节中有一个条目 Multi-Release:true ， 用于指定该 JAR 包是多 Java 版本共存的

同时，JAR 目录下的子目录 META-INF 还包含一个 versions 子目录，其子目录 ( 从 9 开始，用于 Java 9 ) 存储特定于版本的类和资源文件

## 多版本 JAR 范例

接下来这个范例，我们的多版本 JAR 中有三个版本的 MultiReleaseJarTester.java 文件，一个用于 JDK 8，一个用于 JDK 9，最后一个用于 JDK 10 并在可以在这些不同的 JDK 版本上运行

**1、** 首先，我们在当前工作目录，例如我的是d:\devops\java9创建一个multireleasejar文件；

然后创建一个目录 src/main 目录，并在该目录中创建 java10 目录

并在java10 目录中创建 com.ddkk 包

创建完成后，目录结果如下

```java
 .
└── src
    └── main
        ├── java10
            └── cn
                └── souyunku
```

**2、** 然后在java10/com.ddkk目录下新建MultiReleaseJarTester.java文件并输入以下内容；

```java
package com.ddkk;
public class MultiReleaseJarTester {
   public static void main(String[] args) {
        String javaVersion = System.getProperty("java.version");
        System.out.println("JDK version is:" + javaVersion);
   }
}
```

创建完成后目录结构如下

```java
.
└── src
    └── main
        ├── java10
            └── cn
                └── souyunku
                    └── MultiReleaseJarTester.java
```

**3、** 然后重复2-3步骤，创建相同的目录java9和java8，内容都是一样的，创建完成后目录结构如下；

```java
.
└── src
    └── main
        ├── java10
        │   └── cn
        │       └── souyunku
        │           └── MultiReleaseJarTester.java
        ├── java8
        │   └── cn
        │       └── souyunku
        │           └── MultiReleaseJarTester.java
        └── java9
            └── cn
                └── souyunku
                    └── MultiReleaseJarTester.java
```

**4、** 跳转到multireleasejar目录，并使用下面的命令编译三个不同的版本，其中，最重要的参数是--release；

```java
javac --release 10 -d java10  src/main/java10/com.ddkk/MultiReleaseJarTester.java
javac --release 9  -d java9   src/main/java9/com.ddkk/MultiReleaseJarTester.java
javac --release 8  -d java8   src/main/java8/com.ddkk/MultiReleaseJarTester.java
```

--release 选项用于指定要编译目标的 JDK 版本。

编译完成后就可以看到 multireleasejar 的目录结构如下

```java
.
├── java10
│   └── cn
│       └── souyunku
│           └── MultiReleaseJarTester.class
├── java8
│   └── cn
│       └── souyunku
│           └── MultiReleaseJarTester.class
├── java9
│   └── cn
│       └── souyunku
│           └── MultiReleaseJarTester.class
└── src
    └── main
        ├── java10
        │   └── cn
        │       └── souyunku
        │           └── MultiReleaseJarTester.java
        ├── java8
        │   └── cn
        │       └── souyunku
        │           └── MultiReleaseJarTester.java
        └── java9
            └── cn
                └── souyunku
                    └── MultiReleaseJarTester.java
```

**5、** 然后我们就可以使用下面的命令将这些不同版本的MultiReleaseJarTester.class封装到一个JAR里；

**1、** 首先跳转到multireleasejar目录，然后运行下面的命令首先创建一个默认版本，也就是Java8版本；

```java
jar -c -f  multireleasejar.jar --main-class=com.ddkk.MultiReleaseJarTester -C java8 .
```

运行完成后，就可以在当前目录看到一个 multireleasejar.jar 文件

我们可以使用 jar -tvf multireleasejar.jar 查看文件中的内容

```java
[penglei@ddkk.com multireleasejar]$ jar -tvf multireleasejar.jar 
     0 Sun Sep 02 11:19:00 CST 2018 META-INF/
   109 Sun Sep 02 11:19:00 CST 2018 META-INF/MANIFEST.MF
     0 Sun Sep 02 10:51:40 CST 2018 cn/
     0 Sun Sep 02 10:51:40 CST 2018 com.ddkk/
   714 Sun Sep 02 10:51:40 CST 2018 com.ddkk/MultiReleaseJarTester.class
```

**2、** 然后依次运行下面的命令添加两个其它的版本；

```java
jar -u -f multireleasejar.jar --release 10 -C java10 .
jar -u -f multireleasejar.jar --release 9 -C java9 .
```

执行第二条语句的时候会有一个警告，可以忽略

```java
[penglei@ddkk.com multireleasejar]$ jar -u -f multireleasejar.jar --release 9 -C java9 .
警告: 条目 META-INF/versions/10/com.ddkk/MultiReleaseJarTester.class 包含与 jar 中的
现有条目相同的类
```

好了，这样我们的多版本 multireleasejar.jar 就生成了，然后使用 jar -tvf multireleasejar.jar 查看文件中的内容如下

```java
[penglei@ddkk.com multireleasejar]$ jar -tvf multireleasejar.jar 
0 Sun Sep 02 11:20:24 CST 2018 META-INF/
130 Sun Sep 02 11:20:40 CST 2018 META-INF/MANIFEST.MF
0 Sun Sep 02 10:51:40 CST 2018 cn/
0 Sun Sep 02 10:51:40 CST 2018 com.ddkk/
714 Sun Sep 02 10:51:40 CST 2018 com.ddkk/MultiReleaseJarTester.class
0 Sun Sep 02 10:21:20 CST 2018 META-INF/versions/10/
0 Sun Sep 02 10:21:20 CST 2018 META-INF/versions/10/cn/
0 Sun Sep 02 10:21:20 CST 2018 META-INF/versions/10/com.ddkk/
956 Sun Sep 02 10:21:20 CST 2018 META-INF/versions/10/com.ddkk/MultiReleaseJarTester.class
0 Sun Sep 02 10:22:06 CST 2018 META-INF/versions/9/
0 Sun Sep 02 10:22:06 CST 2018 META-INF/versions/9/cn/
0 Sun Sep 02 10:22:06 CST 2018 META-INF/versions/9/com.ddkk/
956 Sun Sep 02 10:22:06 CST 2018 META-INF/versions/9/com.ddkk/MultiReleaseJarTester.class
```

## 运行多版本 JAR 包

首先在Java 10 的环境下运行，输出结果如下

```java
[penglei@ddkk.com multireleasejar]$ java -version
java version "10.0.2" 2018-07-17
Java(TM) SE Runtime Environment 18.3 (build 10.0.2+13)
Java HotSpot(TM) 64-Bit Server VM 18.3 (build 10.0.2+13, mixed mode)
[penglei@ddkk.com multireleasejar]$ java -jar multireleasejar.jar
JDK version is:10.0.2
```

其次，在 Java 8 中运行，输出结果如下

```java
[penglei@ddkk.com multireleasejar]$ java -version
java version "1.8.0_45"
Java(TM) SE Runtime Environment (build 1.8.0_45-b14)
Java HotSpot(TM) 64-Bit Server VM (build 25.45-b02, mixed mode)
[penglei@ddkk.com multireleasejar]$ java -jar  multireleasejar.jar
JDK version is:1.8.0_45
```

## 注意

**1、** 首先，没必要特别区分src/main/java10、src/main/java9、src/main/java8这几个目录，如果代码都相同，只要一份即可；

**2、** 其次，多版本真正最重要的是编译的时候带上--release[version]版本号，用来指定编译版本；

**3、** 打包成jar的时候，三条命令可以放在一起，但最重要的是--release[version]一定要在-C参数之前，如果在之后，则有可能无效；

我折腾好久，就是因为犯了这个默认错误

**4、** 一定要存在一个默认版本，一般情况下，可以使用主流版本为默认版本，这个默认版本可以不用添加--release参数；
