# 16、Intellij Idea 构建工具
- 来源：https://ddkk.com/zhuanlan/tools/idea/16.html
- 分类：开发工具
- 分组：教程目录
IntelliJ IDEA 提供了一个构建工具选项，用于从我们的源代码自动创建可执行应用程序。它提供了将 Java 代码编译、链接和打包成可执行形式的功能。

IntelliJ IDEA 支持各种 Java 应用程序构建工具，例如 Maven、Gradle、Ant 等。在本节中，我们将讨论 Maven 和 Gradle 构建工具。

## 创建 Maven 项目

要创建Maven 项目，请执行以下操作：

**1、** 转到**File->New->Project**一个新的窗口屏幕打开；

**2、** 在左侧窗格中选择Maven，然后单击下一步按钮；

**3、** 将打开新窗口屏幕输入GroupId和ArtifactId单击下一步；

**4、** 单击完成它将打开pom.xml文件；

**5、** 在这个文件中，我们将添加属性最终的pom.xml文件如下；

```java
<?xml version="1.0" encoding="UTF-8"?>  
<project xmlns="http://maven.apache.org/POM/4.0.0"  
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">  
    <modelVersion>4.0.0</modelVersion>  
    <groupId>yiidian.com</groupId>  
    <artifactId>HelloWorld</artifactId>  
    <version>1.0-SNAPSHOT</version>  
    <properties>  
        <maven.compiler.source>1.7</maven.compiler.source>  
        <maven.compiler.target>1.7</maven.compiler.target>  
    </properties>  
</project>  
```

**6、** 创建Java类；

- 转到src/main/java
- 右键单击并选择New->Java Class。

**7、** 使用Maven编译Java类；

- 转到**Run-> Edit Configuration**
- 单击绿色加号图标并选择Maven选项。将打开一个新窗口。

- 在命令行中输入项目名称和包。
- 单击确定按钮。
- 再次转到运行并选择 Maven_Project 选项。
- 开始构建包。成功构建后，我们将看到结果。
