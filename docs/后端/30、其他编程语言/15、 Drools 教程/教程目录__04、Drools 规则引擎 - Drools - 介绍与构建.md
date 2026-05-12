# 04、Drools 规则引擎 - Drools - 介绍与构建
- 来源：https://ddkk.com/zhuanlan/other/drools/1/4.html
- 分类：Drools 教程
- 分组：教程目录
这一章内容颇多，就是一个构建，就翻译了好久，虽然说之前用过drools，但是里面kie相关的很多类都比较混乱，翻译完这个用户手册，感觉清晰了许多，因为实在是太多了，如果你也有相同的情况，可以来看一看。

在这一节，你将会学习将Drools类库作为KIE的一部分去构建，部署已经运行你的基于Drools解决方案的范例。

### 介绍

Drools从6.0版本引入了一个新的配置和约定方法去构建KIE知识库，进而代替了版本5以前用程序去构建的方法。

使用maven构建基于Drools的KIE项目，并且与maven实践保持一致。kie项目或者模块是一个简单的Maven Java项目或者模块；附带着一个额外的源文件 META-INF/kmodule.xml。这个文件是描述一个描述符，描述选择用于KIE库的资源并配置那些KIE库和连接。

虽然标准的Maven可以构建和打包KIE资源，但是他不能在构建的时候提供验证。有一个maven插件（kie-maven-plugin），建议在构件时使用该插件来进行验证。插件也会生成很多的类，使得在运行时加载的更快。

例子项目的结构和Pom文件在下面的截屏图示中。

图示1.例子项目的文件结构和Maven的pom文件

KIE使用默认值去减少配置的数量。一个空kmodule.xml文件是最简单的配置。kmodule.xml是必须要有的，即使是空的也要有，因为这个文件用于发现JAR及其内容。

Maven也即可以使用‘mvn install’部署KieModule到本地机器，供本地的其他应用使用。也可以使用‘mvn deploy’将KieModule推到远程仓库中。构建应用程序引入KieModule，并在这个过程中 将其加入到本地仓库。

图示2

JAR包可以用上述两种方法之一部署，也可以添加到classpth中，像Maven依赖列表中其他JAR那样，或者在运行时他们可以被动态的加载进去。KIE会扫描classpath寻找所有含有kmodule.xml文件的JAR包。每一个被找到的JAR包都由KieModule接口代表。类路径KieModule和动态KieModule这两个术语是指两种加载方式。动态加载支持多版本，类路径不支持。此外，一旦某个模块在路径上，其他版本就不会被动态加载了。

API的详细参考资料将在接下来的章节介绍，如果没有耐心看可以直接跳到示例部分，示例都是一目了然的。

### 构建

#### 创建和构建一个Kie项目

Kie项目的文件结构和普通的Maven工程一样，唯一不同点是多了一个kmodule.xml文件，该文件以声明的方式定义了可以被创建的KieBases和KieSessions。kmodule.xml文件必须放在Maven项目的resources/META-INF文件夹下，而所有其他的Kie artifacts（例如DRL或者Excel文件）必须放在resources或者其子文件夹下。

因为已经为所有的配置项提供了有意义的默认值，所以最简单的kmodlue.xml文件就是仅仅含有一个空的kmodule标签的文件，像下面这样：

示例1.一个空的看module.xml文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<kmodule xmlns="http://www.drools.org/xsd/kmodule"/>
```

用这种方式kmodule将会只包含一个单独默认的KieBase。所有的Kie素材都会被保存在resources文件夹下，或者是resources下的任意子文件夹下， 这些Kie素材都会被编译并且被加入到KieBase中。为了触发这些artifacts的构建，创建一个KieContainer就可以了。

图示4. KieContainer

对于这个简单的实例，创建一个KiContainer就足够了，这个KieContainer可以从类路径读取文件去完成构建：

示例2. 从类路径创建一个KieContainer

```java
KieServices kieServices = KieServices.Factory.get();
KieContainer kContainer = kieServices.getKieClasspathContainer();
```

KieService是一个可以访问所有Kie构建和运行时设施的接口。

图示5. KieService

使用这种方式，所有的Java源文件和Kie资源都会被编译，并且部署到KieContainer中，使其内容可以在运行时获取。

#### kmodule.xml文件

如上一节所述，这个kmodules文件是一个可以声明式方式在Kie项目里创建KieBase和KieSession的地方。

KieBase是所有应用知识定义的仓库。他包含规则，过程，函数和类型模板。KieBase本身不包含数据，相反的，从KieBase中创建出来的sessions，session是可以插入数据，和启动实例的。创建Kiebase是非常重量级的，而session的创建却非常的轻量，所以推荐将KieBase缓存起来，以备在使用时可以重复创建session。但是终端用户通常不用担心这个事情，因为缓存机制KieContainer已经提供了。

图示6KieBase

相反的，KieSession存储并执行运行时数据。KieSession是KieBase创建的，如果kmodule文件定义了，KieSession可以直接从KieContainer中创建。

图示7. KieSession

kmodule允许定义和配置一个或者多个的KieBase，并且每一个KieBase可以定义和配置KieSession，如下示例所示：

示例3. 一个简单的kmodule文件

```java
<kmodule xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"xmlns="http://www.drools.org/xsd/kmodule">
    <configuration>
        <property key="drools.evaluator.supersetOf" value="org.mycompany.SupersetOfEvaluatorDefinition"/>
    </configuration>
    <kbase name="KBase1" default="true" eventProcessingMode="cloud" equalsBehavior="equality" declarativeAgenda="enabled" packages="org.domain.pkg1">
        <ksession name="KSession2_1" type="stateful" default="true"/>
        <ksession name="KSession2_2" type="stateless" default="false" beliefSystem="jtms"/>
    </kbase>
    <kbase name="KBase2" default="false" eventProcessingMode="stream" equalsBehavior="equality" declarativeAgenda="enabled" packages="org.domain.pkg2, org.domain.pkg3" includes="KBase1">
        <ksession name="KSession3_1" type="stateful" default="false" clockType="realtime">
            <fileLogger file="drools.log" threaded="true" interval="10"/>
            <workItemHandlers>
                <workItemHandler name="name" type="org.domain.WorkItemHandler"/>
            </workItemHandlers>
            <calendars>
                 <calendar name="monday" type="org.domain.Monday"/>
            </calendars>
            <listeners>
                <ruleRuntimeEventListener type="org.domain.RuleRuntimeListener"/>
                <agendaEventListener type="org.domain.FirstAgendaListener"/>
                <agendaEventListener type="org.domain.SecondAgendaListener"/>
                <processEventListener type="org.domain.ProcessListener"/>
            </listeners>
        </ksession>
     </kbase>
</kmodule>
```

这里面的标签包含了键值对的列表，这些键值对是用于配置KieBase构建过程的可选属性。例如这个例子的看module文件额外定义了一个自定义操作，名字是supersetOf，被org.mycompany.SupersetOfEvaluatorDefinition类实现。

在配置属性定义后面是2个KieBase的定义，第一个KieBase可以实例出2种不同类型的KieSession，而第二个KieBase只能实例出一种KieSession。能够在KieBase标签定义的属性列表和含义，以及默认值如下表所示：

A

B

C

D

1

属性名

默认值

值范围

解释

2

name

没有

任意

name只是用来在KieContainer中检索KieBase的作用，这是一个强制性的属性。

3

includes

没有

用逗号分隔的列表

一个被逗号隔开的包含在本文件的另外的KieBase列表。列表里面的所有KieBase工件也包含在这个KieBase中。

4

packages

all

用逗号分隔的列表

默认情况下，resources文件夹下的任意层级中的drools工件，都包含在KieBase中。这个属性可以限制工件所在位置，KieBase的工件在编译之后，只属于packages列表下。

5

default

FALSE

true,false

定义当前KieBase是否是当前module的默认KieBase，如果是，则当前的KieBase可以不传name给KieContainer直接创建。每一个module中最多只有一个默认的KieBase。

6

equalsBehavior

identity

identity,equality

当一个新的事实插入到工作内存时，定义Drools的行为。如果是identity，总是创建一个新的FactHandler，除非相同的对象还不存在与工作内存中。如果是equality，只有当插入新对象（根据其equals方法判断对象是否是新对象）与已经存在的对象不相等时，才创建一个新的FactHandler。

7

eventProcessingMode

cloud

cloud,stream

当在云模式下编译时，KieBase对待事件就是一个正常的事实。如果在流模式下，允许KieBase对事件进行一个时间推理。

8

declarativeAgenda

disabled

disabled,enabled

定义是否启动Declarative Agenda

同理，ksession标签的所有属性（当然除了name）也有有意义的默认值。这些属性的列表和描述如下表所示：

A

B

C

D

1

name

value

values

meaning

2

name

没有

任意

KieSession的名字是独一无二的，用于从KieContain中获取对应的KieSession。这是一个强制属性。

3

type

stateful

stateful,stateless

有状态的session可以迭代的使用工作能存。而无状态的session是使用提供的数据集一次性的使用工作内存。

4

default

FALSE

true，false

定义Kiesession是否是module中的默认session，如果是就可以不传name直接从KieContainer中创建。每个module中的每个session类型最多只能有一个session。

5

clockType

realtime

realtime，pseudo

定义事件的时间戳是由系统时钟决定还是根据一个应用的伪时钟提供。时钟对于单元测试尤其有用。

6

beliefSystem

simple

simple，jtms，defeasible

定义用于KieSession的belief系统的类别。

像之前kmodule例子中概述的那样，可以在每个KieSession中创建一个日志文件（或控制台），一个或多个的WorkItemHandler和Calendar，以及监听器，监听器可以是ruleRuntimeEventListener, agendaEventListener and processEventListener。

在定义了像前面例子中的kmodule之后，可以通过KieBase和KieSession的name在KieSession中做简单的检索。

示例4. 从KieContainer中检索KieBase和KieSession

```java
KieServices kieServices = KieServices.Factory.get();
KieContainer kContainer = kieServices.getKieClasspathContainer();
KieBase kBase1 = kContainer.getKieBase("KBase1");
KieSession kieSession1 = kContainer.newKieSession("KSession2_1");
StatelessKieSession kieSession2 = kContainer.newStatelessKieSession("KSession2_2");
```

有个必须要注意的地方时KSession2_1和KSession2_2是两个不同类型的Session（第一个是有状态的，第二个是无状态的），需要根据他们的声明方式去调用KieContainer的两个不同方法。如果KieSession向KieContainer请求的类型与在Kmodule文件中声明的类型不同，KieContainer会抛出运行时异常。

此外，因为KieBase和KieSession已经标记了默认值，所以可以在不传任何name的情况下，从KieContainer中获得KieBase和KieSession。

示例5. 从KieContainer中检索默认的KieBase和KieSession

```java
KieContainer kContainer = ...
KieBase kBase1 = kContainer.getKieBase(); // returns KBase1
KieSession kieSession1 = kContainer.newKieSession(); // returns KSession2_1
```

因为Kie项目也是一个maven项目，所以在pom中声明的groupId，artifactsId和version会被用于生成一个ReleseId，这个id可以在应用程序里面代表这个Kie项目。这就允许通过传递ReleaseId到KieService创建一个KieContainer。

示例6. 通过ReleaseId从现有项目中创建KieContainer

```java
KieServices kieServices = KieServices.Factory.get();
ReleaseId releaseId = kieServices.newReleaseId( "org.acme", "myartifact", "1.0" );
KieContainer kieContainer = kieServices.newKieContainer( releaseId );
```

> 从Drools6开始KieBase和KiePackage不支持序列化。需要通过KieContainer去构建KieBase。另一方面，KieSession可以由KieMashaller来组织和取消组织。详细请看：https://docs.drools.org/8.40.0.Final/drools-docs/drools/KIE/index.html#_marshalling

#### 通过Maven构建

Maven的Kie插件能够确保Kie资源被验证和预编译，建议一直使用。使用插件就是很简单的坐在maven的pom文件里面添加插件的build部分，并且用Packaging kjar激活它。

示例7. 在Maven的pom文件里添加KIE插件并激活。

```java
  <packaging>kjar</packaging>
  ...
  <build>
      <plugins>
          <plugin>
              <groupId>org.kie</groupId>
              <artifactId>kie-maven-plugin</artifactId>
              <version>${version.org.drools}</version>
              <extensions>true</extensions>
          </plugin>
      </plugins>
 </build>
```

插件本身支持所有的Drools和jBPM只是资源。但是，如果在你的java类中使用了指定的KIE注解，例如：@kie.api.Position，你将需要在项目中添加的kie-api编译时需要的依赖关系。我们建议使用提供的score对所有的额外添加的KIE依赖。这样，kjar就可以尽可能的保证轻量，而且不依赖任何指定的KIE版本。

构建一个没有maven插件的KIE模块需要复制所有的资源，按照原封不动的样子，粘贴到结果的JAR中。当这个JAR在运行时被加载，他将会尝试构建所有的资源。如果有编译问题，将会返回一个空的KieContainer。而且还将编译开销推到了运行时。总之，这种方式不建议使用，还是应该使用Maven插件。

#### 引擎依赖

Drools拥有3种引擎以来，这三种引擎依赖聚合了所有的依赖集合。drools-ruleunits-engine是启动执行模型的规则单元的标准引擎。drools-engine是启动执行模型的传统DRL语法的标准引擎。drools-engine-classic是使用MVEL解释器的旧引擎。drools-engine-classic和drools-mvel现在已经被放弃了，所以使用drools-ruleunits-engine或者drools-engine代替。

```java
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-engine</artifactId>
</dependency>
```

> drools-engine不包含drools-xml-support，因为规则单元使用样例不需要kmodule.xml，所以不需要去处理XML。换句话说，当你在项目里面使用kmodule.xml,并且使用了drools-engine,你必须额外添加drools-xml-support依赖.例子如下：
>
>
> org.drools
>
> drools-engine
>
>
>
>
>
> org.drools
>
> drools-xml-support

#### 在一个uber-jar或fatjar中用maven构建并运行Drools

当在一个uber-jar（也被称为fat jar或者带有依赖的JAR）构建和运行Drools，比如通过Maven Shade插件创建，你将需要去维护所有依赖的冲突资源。比如说，当你的构建时依赖org.drools:drools-ecj，org.eclipse.jdt:ecj依赖被过度添加到项目中，你可能想要移除在最终工件中不匹配的ECJ工件。在这种情况下，Maven Shade插件可以按如下配置：

```java
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>3.1.0</version>
  <executions>
    <execution>
      <phase>package</phase>
      <goals>
          <goal>shade</goal>
      </goals>
      <configuration>
        <filters>
          <filter>
          <artifact>*:*</artifact>
          <excludes>
            <exclude>META-INF/*.SF</exclude>
            <exclude>META-INF/*.DSA</exclude>
            <exclude>META-INF/*.RSA</exclude>
          </excludes>
          </filter>
        </filters>
        <!-- ... additional configuration ... -->
      </configuration>
    </execution>
  </executions>
</plugin>
```

#### 以编程的方式定义一个KieModule

也可以使用编程的方式去定义属于KieModule的KieBase和KieSession，而不是通过在kmodule文件中以声明的方式去定义。同样的，编程API也允许显式的添加包含Kie工件的文件，而不是从你项目的resources文件夹下去读取。显式添加需要先创建一个KieFileSystem（有序的虚拟文件系统），并且抱你项目中的所有资源放进去。

图示8. KieFileSystem

像所有的其他Kie核心插件一样，你可以从KieService中获取KieFileSystem实例。kmodule.xml配置文件必须被田间道文件系统中。这是一个强制步骤。Kie也提供了方便的流式API可以以编程的方式创建这个文件，通过类KieModuleModel类实现。

图示9.KieModuleModel

实际操作需要从KieService中去创建KieModuleModel，配置这个KieModuleModel需要的KieBase和KieSession，转换他成为XML格式，并且添加这个XML到KieFileSystem中。这个过程在下面的例子中展示：

示例8. 以编程的方式创建kmodule.xml并添加它到KieFileSystem

```java
KieServices kieServices = KieServices.Factory.get();
KieModuleModel kieModuleModel = kieServices.newKieModuleModel();
KieBaseModel kieBaseModel1 = kieModuleModel.newKieBaseModel( "KBase1 ")
        .setDefault( true )
        .setEqualsBehavior( EqualityBehaviorOption.EQUALITY )
        .setEventProcessingMode( EventProcessingOption.STREAM );
KieSessionModel ksessionModel1 = kieBaseModel1.newKieSessionModel( "KSession1" )
        .setDefault( true )
        .setType( KieSessionModel.KieSessionType.STATEFUL )
        .setClockType( ClockTypeOption.get("realtime") );
KieFileSystem kfs = kieServices.newKieFileSystem();
kfs.writeKModuleXML(kieModuleModel.toXML());
```

你项目中的所有其他工件，也需要通过这个流式API，添加到KieFileSystem。这些工件需要被添加到，在maven项目中对应的相同位置。

示例9. 添加Kie工件到KieFileSystem

```java
KieFileSystem kfs = ...
kfs.write( "src/main/resources/KBase1/ruleSet1.drl", stringContainingAValidDRL )
        .write( "src/main/resources/dtable.xls",
                kieServices.getResources().newInputStreamResource( dtableFileStream ) );
```

示例展示了，添加Kie工件既可以通过普通的字符串方式，也可以是Resource的方式。在后一种的情况，Resource可以通过KieResource工厂创建，也可以通过KieService创建。KieResource提供了很多很方便的工厂方法，这些工厂方法可以将代表文件系统路径的输入流，文件或者字符串转换成Resource，转换后的Resource可以被KieFileSystem管理。

图示10. KieResource

> Drools8开始，URLResource不再能获取，是为了保证更好复制的知识库构建（防止远程URL）和更好的安全性。如果你过去使用了URLResource，你可以在Drools应用的外部管理远程资源的本地拉取，这样就可以将关注点限制在Drools本地资源的构建。

通常，通过添加到KieFileSystem的扩展文件的名字，可以推断出Resource的类型。但是，也可以不尊选Kie约定的文件扩展名，并将特定的ResourceType显式分配给Resource，像下面展示的那样：

示例10. 创建并添加显现类型的Resource

```java
KieFileSystem kfs = ...
kfs.write( "src/main/resources/myDrl.txt",
           kieServices.getResources().newInputStreamResource( drlStream )
                      .setResourceType(ResourceType.DRL) );
```

添加所有的资源到KieFileSystem并且通过将KieFileSystem传递给KieBuilder构键KieFileSystem。

图示11.KieBuilder

当KieFileSystem的内容被成功构建，结果KieModule会被自动添加到KieRepository。KieRepository是一个单例，扮演了所有KieModule的仓库。

图示12.KieRepository

在此之后，可以通过KieServices使用其ReleaseId为该KieModule创建一个新的KieContainer。但是，因为在这种情况下，KieFileSystem不包含pom.xml文件（可以通过KieFileSystem.writePomXML添加一个pom文件），Kie不能决定KieModule的ReleaseId并为其分为默认值。这个默认值通过KieRepository获取，并且可以在KieRepository内部来确认KieModule身份。下面的示例展示了全部过程。

示例11.构建KieFileSystem内容并且创建KieContainer

```java
KieServices kieServices = KieServices.Factory.get();
KieFileSystem kfs = ...
kieServices.newKieBuilder( kfs ).buildAll();
KieContainer kieContainer = kieServices.newKieContainer(kieServices.getRepository().getDefaultReleaseId());
```

此时，可以从KieContainer获取KieBase并创建新的KieSession，其方式与直接通过类路径创建KieContainer一样。

检查编译结果是最佳实践。KieBuilder报告里面的三种不同严重性的编译结果：ERROR，WARING和INFO。ERROR代表项目的编译失败，这种情况下，没有KieModule被生产并且KieRepository没有添加任何东西。WARNING和INFO可以被忽略，但是可供检查。

示例12.检查一个没有产生任何错误的编译

```java
KieBuilder kieBuilder = kieServices.newKieBuilder( kfs ).buildAll();
assertEquals( 0, kieBuilder.getResults().getMessages( Message.Level.ERROR ).size() );
```

#### 更改默认构建结果的严重性

在某些情况下，可以更改某类构建结果的默认严重性。举例来说，当一个和存在规则名重复的新规则被加入到包中，默认行为是用新规则代替旧规则，并且报告的严重性是INFO。这可能在大多数的用例里面都是可以接受的，但是在某些开发的用户，可能想要阻止规则的更新，并报告这种情况的严重性是ERROR。

修改结果类型的默认严重性，像Drools里面其他可选配置一样，可以通过调用API来，系统属性或者配置文件来完成。就目前版本来说，Drools支持规则更新和函数更新的可配置结果严重性。使用系统属性活配置晚间来配置，用户可以使用下面的属性：

示例13. 用属性来设置严重性。

```java
// sets the severity of rule updates
drools.kbuilder.severity.duplicateRule = <INFO|WARNING|ERROR>
// sets the severity of function updates
drools.kbuilder.severity.duplicateFunction = <INFO|WARNING|ERROR>
```
