# 07、Drools 规则引擎 - Drools - 构建，部署和应用实例
- 来源：https://ddkk.com/zhuanlan/other/drools/1/7.html
- 分类：Drools 教程
- 分组：教程目录
主要都是基础的应用实例，需要结合源代码去理解。

### 构建，部署和使用实例

学习新系统构建的最好方式，就是通过例子来学习。项目“drools-examples-api”的源代码包含了许多的例子，这个源代码可以通过啊下面的连接获取：

[https://github.com/kiegroup/drools/tree/main/drools-examples-api](https://github.com/kiegroup/drools/tree/main/drools-examples-api)

下面描述的每一个示例，都是从最简单的开始（大部分的选项都是默认的）， 然后逐渐增加例子的复杂度。

下面展示的部署用例全部调用mvn install命令。在Maven中远程部署JAR包在Maven的文案中也有介绍。使用是指加载资源和KIE运行时提供访问的初始行为。而Run是指与那些运行时的交互行为。

#### 默认KieSession

项目：default-kesession。

摘要：空kmodule.xml文件的Kie模块，类路径上所有的资源都在一个单例默认的KieBase里。这个例子展示了从类路径中检索默认的KieSession。

空的Kmodule.xml文件会产生一个单例的KieBase，这个KieBase包括了所有在resources路径下发现的文件，无论是DRL，BOMN2，XLS等。这个KieBase是默认的，并且也包含一个单例默认的KieSession。默认意味着可以不用知道他们的名字，就可以创建他们。

示例36

```java
<kmodule xmlns="http://www.drools.org/xsd/kmodule"> </kmodule>
```

示例37. 构建并安装-Maven

```java
mvn install
```

ks.getKieClasspathContainer方法返回一个KieContainer，这个KieContainer包含部署在环境类路径上的KieBase。

KContainer.newKieSession方法创建了默认的KieSession。注意，你不需要为了创建KieSession去查找KieBase。Ksession知道自己是与哪一个KieBase关联的并使用的，本例中，是与默认的KieBase关联的。

示例38.应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieContainer kContainer = ks.getKieClasspathContainer();
KieSession kSession = kContainer.newKieSession();
kSession.setGlobal("out", out);
kSession.insert(new Message("Dave", "Hello, HAL. Do you read me, HAL?"));
kSession.fireAllRules();
```

#### 命名的KieSession

项目：named-kiesession

摘要：kmodule.xml文件中有一个命了名的KieBase和一个命了名的KieSession。例子展示了如何从类路径中检索命名的KieSession。

kmodule.xml产生一个命名的KieBase叫做kbase1，类路径上所有的资源都在这个kbase1中，无论是DRL ,BOMN2,XLS等。名字是kesession1的KieSession与kbase1关联，并且可以通过名字被kbase1创建出来。

示例39. kmodule.xml

```java
<kmodule xmlns="http://www.drools.org/xsd/kmodule">
    <kbase name="kbase1">
        <ksession name="ksession1"/>
    </kbase>
</kmodule>
```

示例31 构建并安装-Maven

```java
mvn install
```

ks.getKieClasspathContainer方法返回一个KieContainer，这个KieContainer包含部署在环境类路径上的KieBase。这一次KieSession使用名字ksessoin1.首先你不需要去查找KieBase，因为ksession1知道哪一个KieBase与之关联。

示例41. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieContainer kContainer = ks.getKieClasspathContainer();
KieSession kSession = kContainer.newKieSession("ksession1");
kSession.setGlobal("out", out);
kSession.insert(new Message("Dave", "Hello, HAL. Do you read me, HAL?"));
kSession.fireAllRules();
```

#### KieBase 继承

项目：kiebase-inclusion

摘要：kmodule.xml展示了一个KieBase可以包含另一个KieModule的KieBase的资源。在本例中，kbase2继承了name-kiesession例子中的kbase1.包含的KieBase可以来自当前的KieModule，也可以来自pom.xml依赖列表中的其他KieModule。

kmodule.xml产生一个命名的KieBase叫做kbase2，类路径上所有的资源都在这个kbase2中，无论是DRL ,BOMN2,XLS等。由于使用了'includes'属性，所以kbase2将会包含kbase1中的所有资源。名字是kesession2的KieSession与kbase2关联，并且可以通过名字被kbase2创建出来。

示例42. kmodule.xml

```java
<kbase name="kbase2" includes="kbase1">
    <ksession name="ksession2"/>
</kbase>
```

因为本例里面需要上一个例子，'named-kiesession',所以需要先将上一个例子先构建并安装到本地的Maven仓库中，然后在pom.xml中添加上一个例子的依赖。

```java
<project xmlns="http://maven.apache.org/POM/4.0.0"xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
      <groupId>org.drools</groupId>
      <artifactId>drools-examples-api</artifactId>
      <version>6.0.0/version>
  </parent>
  <artifactId>kiebase-inclusion</artifactId>
  <name>Drools API examples - KieBase Inclusion</name>
  <dependencies>
      <dependency>
          <groupId>org.drools</groupId>
          <artifactId>drools-compiler</artifactId>
      </dependency>
      <dependency>
          <groupId>org.drools</groupId>
          <artifactId>named-kiesession</artifactId>
          <version>6.0.0</version>
      </dependency>
  </dependencies>
</project>
```

一旦name-kiesession被构建和安装了，本例就也可以正常的构建和安装了。同样，安装的行为将强制运行测试用例，以演示用例。

示例44. 构建并安装-Maven

```java
mvn install
```

ks.getKieClasspathContainer方法返回一个KieContainer，这个KieContainer包含部署在环境类路径上的KieBase。这一次KieSession使用名字ksession2.首先你不需要去查找KieBase，因为ksession1知道哪一个KieBase与之关联。注意，这一次有两套规则启动，显示kbase2已经包含了依赖的kbase1中的资源。

示例45. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieContainer kContainer = ks.getKieClasspathContainer();
KieSession kSession = kContainer.newKieSession("ksession2");
kSession.setGlobal("out", out);
kSession.insert(new Message("Dave", "Hello, HAL. Do you read me, HAL?"));
kSession.fireAllRules();
kSession.insert(new Message("Dave", "Open the pod bay doors, HAL."));
kSession.fireAllRules();
```

#### 多KieBase

项目：multiple-kbase

摘要：演示kmodule.xml可以包含任意数量的KieBase和KieSession。介绍packages属性，该属性为KieBase中的资源选择文件夹。

kmodule.xml产生6种不同命名的KieBase。'kbase1'包含了KieModule的所有资源。其余的KieBase包含了通过package属性选择的文件夹中的资源。注意通配符'*'的使用，选择此包和此包下的所有包。

示例46. kmodule.xml

```java
<kmodule xmlns="http://www.drools.org/xsd/kmodule">
    <kbase name="kbase1">
        <ksession name="ksession1"/>
    </kbase>
    <kbase name="kbase2" packages="org.some.pkg">
        <ksession name="ksession2"/>
    </kbase>
    <kbase name="kbase3" includes="kbase2" packages="org.some.pkg2">
        <ksession name="ksession3"/>
    </kbase>
    <kbase name="kbase4" packages="org.some.pkg, org.other.pkg">
        <ksession name="ksession4"/>
    </kbase>
    <kbase name="kbase5" packages="org.*">
        <ksession name="ksession5"/>
    </kbase>
    <kbase name="kbase6" packages="org.some.*">
        <ksession name="ksession6"/>
    </kbase>
</kmodule>
```

示例47. 构建并安装-Maven

```java
mvn install
```

下面示例只是例子的一部分，因为每一个KieSession的测试用例除了期望列表不同，都是重复的。

示例48. 应用与运行-Java

```java
@Testpublic void testSimpleKieBase() {
    List<Integer> list = useKieSession("ksession1");
    // no packages imported means import everything
    assertEquals(4, list.size());
    assertTrue( list.containsAll( asList(0, 1, 2, 3) ) );
}
//.. other tests for ksession2 to ksession6 hereprivate List<Integer> useKieSession(String name) {
    KieServices ks = KieServices.Factory.get();
    KieContainer kContainer = ks.getKieClasspathContainer();
    KieSession kSession = kContainer.newKieSession(name);
    List<Integer> list = new ArrayList<Integer>();
    kSession.setGlobal("list", list);
    kSession.insert(1);
    kSession.fireAllRules();
    return list;
}
```

#### 从KieRepository获取KieContainer

项目：kcontainer-from-repository

摘要：项目中没有kmodule.xml，pom.xml也不依赖任何其他的KieModule。使用java代码展示。从Maven仓库加载动态的KieModule。

pom.xml必须包含kie-ci的依赖，为了确保运行时可以获得Maven。因为这是在后台使用Maven，所以可以使用标准Maven的setting.xml文件。

示例49. pom.xml

```java
<project xmlns="http://maven.apache.org/POM/4.0.0"xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.drools</groupId>
        <artifactId>drools-examples-api</artifactId>
        <version>6.0.0</version>
    </parent>
    <artifactId>kiecontainer-from-kierepo</artifactId>
    <name>Drools API examples - KieContainer from KieRepo</name>
    <dependencies>
        <dependency>
            <groupId>org.kie</groupId>
            <artifactId>kie-ci</artifactId>
        </dependency>
    </dependencies>
</project>
```

示例50. 构建并安装-Maven

```java
mvn install
```

在之前的例子里面，已经使用过类路径的KieContainer。这个例子通过指定的ReleaseId创建一个动态的KieContainer。ReleasedId使用Maven里面的group id,artifact id和version。他也遵守版本号是LATEST和SHAPSHOT的。

示例51. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
// Install example1 in the local Maven repo before to do this
KieContainer kContainer = ks.newKieContainer(ks.newReleaseId("org.drools", "named-kiesession", "6.0.0-SNAPSHOT"));
KieSession kSession = kContainer.newKieSession("ksession1");
kSession.setGlobal("out", out);
Object msg1 = createMessage(kContainer, "Dave", "Hello, HAL. Do you read me, HAL?");
kSession.insert(msg1);
kSession.fireAllRules();
```

#### 从文件获取的默认KieSession

项目：default-kiesession-from-file

摘要：动态KieModule可以被任意的Resource位置加载。加载的KieModule提供默认的KieBase和Kiesession。

没有kmodule.xml文件存在。项目默认的kiesession必须首先被构建出来，以便在target文件下生成的jar包，可以被作为文件引用。

示例52. 构建并安装-Maven

```java
mvn install
```

任意的KieModule可以被本地的Resource加载，并加入到KieRepository。一旦部署到了KieRepository中，KieModule就可以通过他的ReleaseId被解析出来。注意这里既不需要Maven也不需要Kie-ci。不会设置传递依赖的父类加载器。

示例53. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieRepository kr = ks.getRepository();
KieModule kModule = kr.addKieModule(ks.getResources().newFileSystemResource(getFile("default-kiesession")));
KieContainer kContainer = ks.newKieContainer(kModule.getReleaseId());
KieSession kSession = kContainer.newKieSession();
kSession.setGlobal("out", out);
Object msg1 = createMessage(kContainer, "Dave", "Hello, HAL. Do you read me, HAL?");
kSession.insert(msg1);
kSession.fireAllRules();
```

#### 从文件获取命名的KieSession

项目：named-kiesession-from-file

摘要：动态KieModule可以被任意的Resource位置加载。加载的KieModule提供命名的KieBase和Kiesession。

没有kmodule.xml文件存在。项目命名的kiesession必须首先被构建出来，以便在target文件下生成的jar包，可以被作为文件引用。

示例54. 构建并安装-Maven

```java
mvn install
```

任意的KieModule可以被本地的Resource加载，并加入到KieRepository。一旦部署到了KieRepository中，KieModule就可以通过他的ReleaseId被解析出来。注意这里既不需要Maven也不需要Kie-ci。不会设置传递依赖的父类加载器。

示例55. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieRepository kr = ks.getRepository();
KieModule kModule = kr.addKieModule(ks.getResources().newFileSystemResource(getFile("named-kiesession")));
KieContainer kContainer = ks.newKieContainer(kModule.getReleaseId());
KieSession kSession = kContainer.newKieSession("ksession1");
kSession.setGlobal("out", out);
Object msg1 = createMessage(kContainer, "Dave", "Hello, HAL. Do you read me, HAL?");
kSession.insert(msg1);
kSession.fireAllRules();
```

#### 依赖KieModule的KieModule

项目：kie-module-from-multiple-files

摘要：以编程的方式提供KieModule的依赖列表，不使用maven。

没有kmodule.xml文件存在。项目命名的kiesession和kiebase-include必须首先被构建出来，以便在target文件下生成的jar包，可以被作为文件引用。

示例56. 构建并安装-Maven

```java
mvn install
```

创建两个资源。一个资源是为了主要的KieModule命名为'exRes1'，另一个是为了依赖的，命名为'exRes2'。尽管不使用kie-ci，Maven不能获取依赖，但是这里会给你展示如何为vararg手动指定依赖的KieModule。

示例57. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieRepository kr = ks.getRepository();
Resource ex1Res = ks.getResources().newFileSystemResource(getFile("kiebase-inclusion"));
Resource ex2Res = ks.getResources().newFileSystemResource(getFile("named-kiesession"));
KieModule kModule = kr.addKieModule(ex1Res, ex2Res);
KieContainer kContainer = ks.newKieContainer(kModule.getReleaseId());
KieSession kSession = kContainer.newKieSession("ksession2");
kSession.setGlobal("out", out);
Object msg1 = createMessage(kContainer, "Dave", "Hello, HAL. Do you read me, HAL?");
kSession.insert(msg1);
kSession.fireAllRules();
Object msg2 = createMessage(kContainer, "Dave", "Open the pod bay doors, HAL.");
kSession.insert(msg2);
kSession.fireAllRules();
```

#### 用编程的方式，使用默认值构建一个简单的kieModule

项目：kiemodulemodel-example

摘要：仅用单个文件以编程的方式构建KieModule。Pom和模块都是默认的。这是最快的开箱即用的方式，但是不会被添加到Maven仓库中去。

示例58. 构建并安装-Maven

```java
mvn install
```

用编程构建一个KieModule。他由ReleaseId代表的模块和kmodule.xml文件构成，并且添加相关资源。pom.xml文件由Releaseid产生。

示例59. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieRepository kr = ks.getRepository();
KieFileSystem kfs = ks.newKieFileSystem();
kfs.write("src/main/resources/org/kie/example5/HAL5.drl", getRule());
KieBuilder kb = ks.newKieBuilder(kfs);
kb.buildAll(); // kieModule is automatically deployed to KieRepository if successfully built.if (kb.getResults().hasMessages(Level.ERROR)) {
    throw new RuntimeException("Build Errors:\n" + kb.getResults().toString());
}
KieContainer kContainer = ks.newKieContainer(kr.getDefaultReleaseId());
KieSession kSession = kContainer.newKieSession();
kSession.setGlobal("out", out);
kSession.insert(new Message("Dave", "Hello, HAL. Do you read me, HAL?"));
kSession.fireAllRules();
```

#### 使用元模型以编程的方式构建KieModule

项目：kiemodulemodel-example

摘要：编程构建KieModule，通过创建该KieModule的kmodule.xml元模型资源。

示例60. 构建并安装-Maven

```java
mvn install
```

这里以编程的方式构建了KieModule。他由ReleaseId代表的模块和kmodule.xml文件构成，并且添加相关资源。pom.xml文件由Releaseid产生。

示例61. 应用与运行-Java

```java
KieServices ks = KieServices.Factory.get();
KieFileSystem kfs = ks.newKieFileSystem();
Resource ex1Res = ks.getResources().newFileSystemResource(getFile("named-kiesession"));
Resource ex2Res = ks.getResources().newFileSystemResource(getFile("kiebase-inclusion"));
ReleaseId rid = ks.newReleaseId("org.drools", "kiemodulemodel-example", "6.0.0-SNAPSHOT");
kfs.generateAndWritePomXML(rid);
KieModuleModel kModuleModel = ks.newKieModuleModel();
kModuleModel.newKieBaseModel("kiemodulemodel")
            .addInclude("kiebase1")
            .addInclude("kiebase2")
            .newKieSessionModel("ksession6");
kfs.writeKModuleXML(kModuleModel.toXML());
kfs.write("src/main/resources/kiemodulemodel/HAL6.drl", getRule());
KieBuilder kb = ks.newKieBuilder(kfs);
kb.setDependencies(ex1Res, ex2Res);
kb.buildAll(); // kieModule is automatically deployed to KieRepository if successfully built.if (kb.getResults().hasMessages(Level.ERROR)) {
    throw new RuntimeException("Build Errors:\n" + kb.getResults().toString());
}
KieContainer kContainer = ks.newKieContainer(rid);
KieSession kSession = kContainer.newKieSession("ksession6");
kSession.setGlobal("out", out);
Object msg1 = createMessage(kContainer, "Dave", "Hello, HAL. Do you read me, HAL?");
kSession.insert(msg1);
kSession.fireAllRules();
Object msg2 = createMessage(kContainer, "Dave", "Open the pod bay doors, HAL.");
kSession.insert(msg2);
kSession.fireAllRules();
Object msg3 = createMessage(kContainer, "Dave", "What's the problem?");
kSession.insert(msg3);
kSession.fireAllRules();
```
