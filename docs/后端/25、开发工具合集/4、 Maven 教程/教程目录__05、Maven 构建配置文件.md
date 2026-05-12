# 05、Maven 构建配置文件
- 来源：https://ddkk.com/zhuanlan/tools/maven/5.html
- 分类：开发工具
- 分组：教程目录
## Maven – 构建配置文件

## 什么是构建配置文件？

构建配置文件是一组配置的集合，用来设置或者覆盖 Maven 构建的默认配置。使用构建配置文件，可以为不同的环境定制构建过程，例如 Producation 和 Development 环境。

Profile 在 pom.xml 中使用 activeProfiles / profiles 元素指定，并且可以用很多方式触发。Profile 在构建时修改 POM，并且为变量设置不同的目标环境（例如，在开发、测试和产品环境中的数据库服务器路径）。

## Profile 类型

Profile 主要有三种类型。

类型
在哪里定义

Per Project
定义在工程 POM 文件 pom.xml 中

Per User
定义在 Maven 设置 xml 文件中 （%USER_HOME%/.m2/settings.xml）

Global
定义在 Maven 全局配置 xml 文件中 （%M2_HOME%/conf/settings.xml）

## Profile 激活

Maven 的 Profile 能够通过几种不同的方式激活。

- 显式使用命令控制台输入
- 通过 maven 设置
- 基于环境变量（用户 / 系统变量）
- 操作系统配置（例如，Windows family）
- 现存 / 缺失 文件

## Profile 激活示例

我们假定你的工程目录像下面这样：

现在，在 src/main/resources 目录下有三个环境配置文件：

文件名称
描述

env.properties
没有配置文件时的默认配置

env.test.properties
使用测试配置文件时的测试配置

env.prod.properties
使用产品配置文件时的产品配置

## 显式 Profile 激活

在接下来的例子中，我们将 attach maven-antrun-plugin:run 目标添加到测试阶段中。这样可以我们在不同的 Profile 中输出文本信息。我们将使用 pom.xml 来定义不同的 Profile，并在命令控制台中使用 maven 命令激活 Profile。

假定，我们在 C:\MVN\project 目录下创建了以下的 pom.xml 文件。

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
   http://maven.apache.org/xsd/maven-4.0.0.xsd">
   <modelVersion>4.0.0</modelVersion>
   <groupId>com.companyname.projectgroup</groupId>
   <artifactId>project</artifactId>
   <version>1.0</version>
   <profiles>
      <profile>
      <id>test</id>
      <build>
      <plugins>
         <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-antrun-plugin</artifactId>
            <version>1.1</version>
            <executions>
               <execution>
                  <phase>test</phase>
                  <goals>
                     <goal>run</goal>
                  </goals>
                  <configuration>
                  <tasks>
                     <echo>Using env.test.properties</echo>
            <copy file="src/main/resources/env.test.propertiestofile
            ="${project.build.outputDirectory}/env.properties"/>
                  </tasks>
                  </configuration>
               </execution>
            </executions>
         </plugin>
      </plugins>
      </build>
      </profile>
   </profiles>
</project>
```

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行以下 mvn 命令。使用 -P 选项指定 Profile 的名称。

```xml
C:\MVN\project>mvn test -Ptest
```

Maven 将开始处理并显示 test Profile 的结果。

```xml
[INFO] Scanning for projects...
[INFO] ------------------------------------------------------------------
[INFO] Building Unnamed - com.companyname.projectgroup:project:jar:1.0
[INFO]    task-segment: [test]
[INFO] ------------------------------------------------------------------
[INFO] [resources:resources {execution: default-resources}]
[WARNING] Using platform encoding (Cp1252 actually) to copy filtered resources,
i.e. build is platform dependent!
[INFO] Copying 3 resources
[INFO] [compiler:compile {execution: default-compile}]
[INFO] Nothing to compile - all classes are up to date
[INFO] [resources:testResources {execution: default-testResources}]
[WARNING] Using platform encoding (Cp1252 actually) to copy filtered resources,
i.e. build is platform dependent!
[INFO] skip non existing resourceDirectory C:\MVN\project\src\test\resources
[INFO] [compiler:testCompile {execution: default-testCompile}]
[INFO] Nothing to compile - all classes are up to date
[INFO] [surefire:test {execution: default-test}]
[INFO] Surefire report directory: C:\MVN\project\target\surefire-reports
-------------------------------------------------------
 T E S T S
-------------------------------------------------------
There are no tests to run.
Results :
Tests run: 0, Failures: 0, Errors: 0, Skipped: 0
[INFO] [antrun:run {execution: default}]
[INFO] Executing tasks
     [echo] Using env.test.properties
[INFO] Executed tasks
[INFO] ------------------------------------------------------------------
[INFO] BUILD SUCCESSFUL
[INFO] ------------------------------------------------------------------
[INFO] Total time: 1 second
[INFO] Finished at: Sun Jul 08 14:55:41 IST 2012
[INFO] Final Memory: 8M/64M
[INFO] ------------------------------------------------------------------
```

现在我们练习一下，你可以按照下面的步骤做：

- 在 pom.xml 的 profiles 元素中添加另一个 profile 元素（拷贝已有的 profile 元素并粘贴到 profiles 元素结尾）。
- 将此 profile 元素的 id 从 test 修改为 normal。
- 将任务部分修改为 echo env.properties，以及 copy env.properties 到目标目录
- 再次重复以上三个步骤，修改 id 为 prod，修改 task 部分为 env.prod.properties
- 全部就这些了。现在你有了三个构建配置文件（normal / test / prod）。

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行下面的 **mvn** 命令。使用 -P 选项指定 Profile 的名称。

```xml
C:\MVN\project>mvn test -Pnormal
C:\MVN\project>mvn test -Pprod
```

检查构建的输出看看有什么不同。

## 通过 Maven 设置激活 Profile

打开Maven 的 **settings.xml** 文件，该文件可以在 %USER_HOME%/.m2 目录下找到，**%USER_HOME%** 表示用户主目录。如果 settings.xml 文件不存在则需要创建一个。

像在下面例子中展示的一样，使用 activeProfiles 节点添加 test 配置作为激活的 Profile。

```xml
<settings xmlns="http://maven.apache.org/POM/4.0.0"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
   http://maven.apache.org/xsd/settings-1.0.0.xsd">
   <mirrors>
      <mirror>
         <id>maven.dev.snaponglobal.com</id>
         <name>Internal Artifactory Maven repository</name>
         <url>http://repo1.maven.org/maven2/</url>
         <mirrorOf>*</mirrorOf>
      </mirror>
   </mirrors>
   <activeProfiles>
      <activeProfile>test</activeProfile>
   </activeProfiles>
</settings>
```

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行下面的 mvn 命令。不要使用 -P 选项指定 Profile 的名称。Maven 将显示被激活的 test Profile 的结果。

```xml
C:\MVN\project>mvn test
```

## 通过环境变量激活 Profile

现在从maven 的 settings.xml 中删除激活的 Profile，并更新 pom.xml 中的 test Profile。将下面的内容添加到 profile 元素的 activation 元素中。

当系统属性 “env” 被设置为 “test” 时，test 配置将会被触发。创建一个环境变量 “env” 并设置它的值为 “test”。

```xml
<profile>
   <id>test</id>
   <activation>
      <property>
         <name>env</name>
         <value>test</value>
      </property>
   </activation>
</profile>
```

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行下面的 mvn 命令。

```xml
C:\MVN\project>mvn test
```

## 通过操作系统激活 Profile

activation 元素包含下面的操作系统信息。当系统为 windows XP 时，test Profile 将会被触发。

```xml
<profile>
   <id>test</id>
   <activation>
      <os>
         <name>Windows XP</name>
         <family>Windows</family>
         <arch>x86</arch>
         <version>5.1.2600</version>
      </os>
   </activation>
</profile>
```

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行下面的 mvn 命令。不要使用 -P 选项指定 Profile 的名称。Maven 将显示被激活的 test Profile 的结果。

```xml
C:\MVN\project>mvn test
```

## 通过现存 / 缺失的文件激活 Profile

现在使用 activation 元素包含下面的操作系统信息。当 *target/generated-sources/axistools/wsdl2java/com/companyname/group* 缺失时，test Profile 将会被触发。

```xml
<profile>
   <id>test</id>
   <activation>
      <file>
         <missing>target/generated-sources/axistools/wsdl2java/
         com/companyname/group</missing>
      </file>
   </activation>
</profile>
```

现在打开命令控制台，跳转到 pom.xml 所在目录，并执行下面的 mvn 命令。不要使用 -P 选项指定 Profile 的名称。Maven 将显示被激活的 test Profile 的结果。

```xml
C:\MVN\project>mvn test
```
