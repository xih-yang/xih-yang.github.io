# 05、Drools 规则引擎 - Drools - 部署
- 来源：https://ddkk.com/zhuanlan/other/drools/1/5.html
- 分类：Drools 教程
- 分组：教程目录
这是用户手册第三章的部署部分，主要讲了使用maven和不使用maven时，drools的一些功能和使用方法，内容相对来说比较少，也是不厌其烦的在解释基础，比如这个kieBase在这一节里，有介绍了一遍。

### 部署

#### KieBase

KieBase是所有应用的知识定义仓库。它包含规则，过程，定义和模型类型，KieBase本身不包含数据；相反，会话是被KieBase创建的，会话可以插入数据并启动实例流程。KieBase从包含定义了KieBase的KieModule的KieContainer处获得。

图示13.KieBase

当KieBase需要去解决那些不在默认类加载器中的类型时，需要额外的类加载器创建一个KieBaseConfiguration，并且在通过KieBaseConfiguration创建新的KieBase时要将这个KieBaseConfiguration传给KieContainer。

示例14 用自定义的类加载器创建一个新的KieBase

```java
KieServices kieServices = KieServices.Factory.get();
KieBaseConfiguration kbaseConf = kieServices.newKieBaseConfiguration( null, MyType.class.getClassLoader() );
KieBase kbase = kieContainer.newKieBase( kbaseConf );
```

#### KieSession和KieBase的修改

KieSession的讨论将会在Running一节中详细介绍。KieBase创建并返回KieSession对象，并且KieBase可以选择保留这些创建的KieSession的引用。当KieBase发生修改，这些修改也会应用于session中的数据。这个KieSession的引用是弱引用并且也是可选的，通过一个布尔标记对其是否是弱引用进行控制。

#### KieScanner

KieScanner允许持续的监测你的maven仓库，用来检查是否已经安装的Kie项目有新的公开版本。一个新项目的部署包装在KieContainer中。KieScanner的使用需要在类路径上有Kie-ci.jar。

图示14. KieScanner

KieScanner可以在KieContainer上注册，如下面的例子这样：

示例15. 注册并启动KieContainer上的KieScanner

```java
KieServices kieServices = KieServices.Factory.get();
ReleaseId releaseId = kieServices.newReleaseId( "org.acme", "myartifact", "1.0-SNAPSHOT" );
KieContainer kContainer = kieServices.newKieContainer( releaseId );
KieScanner kScanner = kieServices.newKieScanner( kContainer );
// Start the KieScanner polling the Maven repository every 10 seconds
kScanner.start( 10000L );
```

这个例子里面，KieScanner被配置在一个固定的时间间隔执行，但是KieScanner也可以根据需求调用scanNow()方法执行。如果在Maven仓库里面，KieScanner发现了KieContainer使用了Kie项目的更新版本，会自动下载最新版本，并且启动新项目的增量构建。此时，在KieContainer控制下的KieBase和KieSession将会自动更新，具体来说，就是那些通过getKieBase方法获取的KieBase和她们相关的KieSession，以及直接通过KieContainer.newKieSession()方法获取的引用默认KieBase的KieSession。另外，从更新时刻之后，所有的KieContainer新建KieBase和KieSession都会使用新得项目版本。但是，请注意，在KieScanner更新之前，通过newKieBase获取，已经存在的KieBase和其相关的KieSession，将不会自动更新；这是因为通过newKieBase()方法获取的KieBase不是直接被KieContainer控制。

KieScanner仅仅只在使用了SNAPSHOT，版本范围，最新版本和发布设置时更新。固定版本号的将不会在运行时自动更新。

如果你不想安装maven仓库，也可以通过从普通文件系统的文件夹简单的获取KieScanner。你可以创建一个KieScanner像下面这样简单

```java
KieServices kieServices = KieServices.Factory.get();
KieScanner kScanner = kieServices.newKieScanner( kContainer, "/myrepo/kjars" );
```

KieScanner将会在文件夹“/myerpo/kjars”下去寻找kjar的更新。放在这个文件夹的jar文件必须遵守maven约定的命名方式{artifactId}-{versionId}.jar。

#### Maven的版本和依赖

Maven支持很多机制来管理应用的版本和依赖。模块可以指定版本号发布，或者使用SNAPSHOT后缀。依赖可以指定版本的范围去订阅，或者使用SNAPSHOT机制。

StackOverflow对此提供了一个非常好的描述，如下所述。

[java - How do I tell Maven to use the latest version of a dependency? - Stack Overflow](http://stackoverflow.com/questions/30571/how-do-i-tell-maven-to-use-the-latest-version-of-a-dependency)

> 由于Maven3.x版本不再支持可重复构建的RELEASE和LATEST

查看Maven书的POM语法章节以获得更详细的信息

[http://books.sonatype.com/mvnref-book/reference/pom-relationships-sect-pom-syntax.html](http://books.sonatype.com/mvnref-book/reference/pom-relationships-sect-pom-syntax.html)

[http://books.sonatype.com/mvnref-book/reference/pom-relationships-sect-project-dependencies.html](http://books.sonatype.com/mvnref-book/reference/pom-relationships-sect-project-dependencies.html)[java - How do I tell Maven to use the latest version of a dependency? - Stack Overflow](http://stackoverflow.com/questions/30571/how-do-i-tell-maven-to-use-the-latest-version-of-a-dependency)

这有一个示例展示了版本选择。在maven仓库里，com.foo:my-foo有如下的元数据：

```java
<metadata>
    <groupId>com.foo</groupId>
    <artifactId>my-foo</artifactId>
    <version>2.0.0</version>
    <versioning>
        <release>1.1.1</release>
        <versions>
            <version>1.0</version>
            <version>1.0.1</version>
            <version>1.1</version>
            <version>1.1.1</version>
            <version>2.0.0</version>
        </versions>
        <lastUpdated>20090722140000</lastUpdated>
    </versioning>
</metadata>
```

如果某个工件上的依赖是必须的，你有以下的选项（其他版本范围当然可以指定，这里只展示相关的即可）：声明一个明确的版本（始终解析为1.0.1）：

```java
<version>[1.0.1]</version>
```

声明一个明确的版本（将始终解析为1.0.1，除非发生冲突，此时Maven将选择匹配的版本）

```java
<version>1.0.1</version>
```

声明一个版本范围，范围是所有1.x（将当前解析为1.1.1）

```java
<version>[1.0.0,2.0.0)</version>
```

声明一个开放的版本范围（将解析为2.0.0）

```java
<version>[1.0.0,)</version>
```

将版本声明为LATEST（将解析为2.0.0）

```java
<version>LATEST</version>
```

将版本声明为RELEASE（将解析为1.1.1）

```java
<version>RELEASE</version>
```

请注意，默认情况下，你自己的部署将会更新maven元数据下的latest条目，但是对于release条目的更新，你需要从Maven父POM中激活release-profile。你可以使用"-Prelease-profile"或者"-DperformRelease=true"。

#### Setting.xml和远程仓库的设置

maven的setting.xml文件可以放在三个位置，实际使用时是那三个地方的合并。

- maven安装的地方：`$`M2_HOME/conf/settings.xml
- 用户安装的地方：`$`{user.home}/.m2/settings.xml
- 系统属性指定的文件夹位置：kie.maven.settings.custom

setting.xml用于指定远程仓库的位置。激活指定的远程仓库的文件很重要，通常可以使用"activeByDefault"进行配置：

```java
<profiles>
    <profile>
        <id>profile-1</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
            ...
    </profile>
</profiles>
```

Maven提供了有关使用多个远程存储库的详细文档：

[Maven – Guide to using Multiple Repositories](http://maven.apache.org/guides/mini/guide-multiple-repositories.html)
