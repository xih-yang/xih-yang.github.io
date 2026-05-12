# 06、Java13 新特性 - 动态CDS存档
- 来源：https://ddkk.com/zhuanlan/java/java13/6.html
- 分类：Java 13 新特性
- 分组：教程目录
CDS，类数据共享是 JVM 的一个重要特性，用于提高应用程序加载的启动时间。由于它允许跨不同的 JVM 共享类元数据，因此减少了启动时间和内存占用。Java 10 通过提供 AppCDS 增强了 CDS，应用程序 CDS 使开发人员可以访问将应用程序类包含在共享存档中。Java 12 将 CDS 存档设置为默认值。

但是创建 CDS 的过程很乏味，因为开发人员必须通过多次试验他们的应用程序来创建类列表作为第一步，然后将该类列表转储到存档中。然后这个归档文件可用于在 JVM 之间共享元数据。

从Java 13 开始，现在 Java 具有动态归档功能。现在开发人员可以在应用程序退出时生成共享存档。因此不再需要试运行。

以下步骤展示了使用选项 -XX:ArchiveClassesAtExit 在默认系统存档之上创建动态共享存档并传递存档名称。

```java
$java -XX:ArchiveClassesAtExit=sharedApp.jar -cp APITester.jar APITester
```

生成后，共享存档可用于使用 -XX:SharedArchiveFile 选项运行应用程序。

```java
$java -XX:SharedArchiveFile=sharedApp.jar -cp APITester.jar APITester
```

## Java13 动态CDS存档的示例

APITester.java

```java
package com.yiidian;
public class APITester {
   public static void main(String[] args) {
      System.out.println("Welcome to yiidian.com.");
   }   
}
```

编译并运行程序

```java
$javac APITester.java
$jar cf APITester.jar APITester.class
$java -XX:ArchiveClassesAtExit=sharedApp.jsa -cp APITester.jar APITester
$java -XX:SharedArchiveFile=sharedApp.jsa -cp APITester.jar APITester
```

输出结果为

```java
Welcome to yiidian.com.
```
