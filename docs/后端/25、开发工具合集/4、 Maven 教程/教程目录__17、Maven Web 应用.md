# 17、Maven Web 应用
- 来源：https://ddkk.com/zhuanlan/tools/maven/17.html
- 分类：开发工具
- 分组：教程目录
## Maven – Web 应用

本教程将指导你如何使用 Maven 版本控制系统来管理一个基于 Web 的工程。在此，你将学习到如何创建/构建/部署以及运行 Web 应用程序：

## 创建 Web 应用

建立一个简单的 Java web 应用，我们可以使用 maven-archetype-webapp 插件。首先我们打开命令控制台，进入 C:\MVN 目录并且执行以下的 mvn 命令。

```xml
C:\MVN>mvn archetype:generate 
-DgroupId=com.companyname.automobile 
-DartifactId=trucks
-DarchetypeArtifactId=maven-archetype-webapp 
-DinteractiveMode=false
```

Maven 将开始处理并且将创建完整的基于 Web 的 java 应用工程结构。

```xml
[INFO] Scanning for projects...
[INFO] Searching repository for plugin with prefix: 'archetype'.
[INFO] -------------------------------------------------------------------
[INFO] Building Maven Default Project
[INFO]    task-segment: [archetype:generate] (aggregator-style)
[INFO] -------------------------------------------------------------------
[INFO] Preparing archetype:generate
[INFO] No goals needed for project - skipping
[INFO] [archetype:generate {execution: default-cli}]
[INFO] Generating project in Batch mode
[INFO] --------------------------------------------------------------------
[INFO] Using following parameters for creating project 
from Old (1.x) Archetype: maven-archetype-webapp:1.0
[INFO] --------------------------------------------------------------------
[INFO] Parameter: groupId, Value: com.companyname.automobile
[INFO] Parameter: packageName, Value: com.companyname.automobile
[INFO] Parameter: package, Value: com.companyname.automobile
[INFO] Parameter: artifactId, Value: trucks
[INFO] Parameter: basedir, Value: C:\MVN
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] project created from Old (1.x) Archetype in dir: C:\MVN\trucks
[INFO] -------------------------------------------------------------------
[INFO] BUILD SUCCESSFUL
[INFO] -------------------------------------------------------------------
[INFO] Total time: 16 seconds
[INFO] Finished at: Tue Jul 17 11:00:00 IST 2012
[INFO] Final Memory: 20M/89M
[INFO] -------------------------------------------------------------------
```

现在进入 C:/MVN 目录，你将看到一个名为 trucks（由 artifactld 指定）的 java 应用工程。

Maven 使用一个标准的目录架构，如上示例，我们可以理解以下的关键概念：

文件夹结构
描述

trucks
包含 src 文件夹和 pom.xml

src/main/webapp
包含 index.jsp 和 WEB-INF 文件夹.

src/main/webapp/WEB-INF
包含 web.xml

src/main/resources
包含 images / properties 文件。

## POM.xml

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" 
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
   http://maven.apache.org/maven-v4_0_0.xsd">
   <modelVersion>4.0.0</modelVersion>
   <groupId>com.companyname.automobile</groupId>
   <artifactId>trucks</artifactId>
   <packaging>war</packaging>
   <version>1.0-SNAPSHOT</version>
   <name>trucks Maven Webapp</name>
   <url>http://maven.apache.org</url>
   <dependencies>
      <dependency>
         <groupId>junit</groupId>
         <artifactId>junit</artifactId>
         <version>3.8.1</version>
         <scope>test</scope>
      </dependency>
   </dependencies>
   <build>
      <finalName>trucks</finalName>
   </build>
</project>
```

如果仔细观察，Maven 还创建了一个示例 JSP 的源文件。

打开 **C:\ > MVN > trucks > src > main > webapp >** 文件夹, 你将看到 index.jsp.

```xml
<html>
   <body>
      <h2>Hello World!</h2>
   </body>
</html>
```

## Build Web Application

打开终端，进入 C:\MVN\trucks 目录，然后执行如下 **mvn** 命令.

```xml
C:\MVN\trucks>mvn clean package
```

Maven 将会开始构建此工程，日志输出如下：

```xml
[INFO] Scanning for projects...
[INFO] -------------------------------------------------------------------
[INFO] Building trucks Maven Webapp
[INFO]    task-segment: [clean, package]
[INFO] -------------------------------------------------------------------
[INFO] [clean:clean {execution: default-clean}]
[INFO] [resources:resources {execution: default-resources}]
[WARNING] Using platform encoding (Cp1252 actually) to 
copy filtered resources,i.e. build is platform dependent!
[INFO] Copying 0 resource
[INFO] [compiler:compile {execution: default-compile}]
[INFO] No sources to compile
[INFO] [resources:testResources {execution: default-testResources}]
[WARNING] Using platform encoding (Cp1252 actually) to 
copy filtered resources,i.e. build is platform dependent!
[INFO] skip non existing resourceDirectory 
C:\MVN\trucks\src\test\resources
[INFO] [compiler:testCompile {execution: default-testCompile}]
[INFO] No sources to compile
[INFO] [surefire:test {execution: default-test}]
[INFO] No tests to run.
[INFO] [war:war {execution: default-war}]
[INFO] Packaging webapp
[INFO] Assembling webapp[trucks] in [C:\MVN\trucks\target\trucks]
[INFO] Processing war project
[INFO] Copying webapp resources[C:\MVN\trucks\src\main\webapp]
[INFO] Webapp assembled in[77 msecs]
[INFO] Building war: C:\MVN\trucks\target\trucks.war
[INFO] -------------------------------------------------------------------
[INFO] BUILD SUCCESSFUL
[INFO] -------------------------------------------------------------------
[INFO] Total time: 3 seconds
[INFO] Finished at: Tue Jul 17 11:22:45 IST 2012
[INFO] Final Memory: 11M/85M
[INFO] -------------------------------------------------------------------
```

## 部署 Web 应用

现在拷贝在 **C:\ > MVN > trucks > target >** 文件夹下的 trucks.war 到你的 web 服务器的 webapp 目录下，并且重启 web 服务。

## 测试 Web 应用

使用URL: **http://\ :\ /trucks/index.jsp** 来运行你的 Web 应用。

验证输出结果：
