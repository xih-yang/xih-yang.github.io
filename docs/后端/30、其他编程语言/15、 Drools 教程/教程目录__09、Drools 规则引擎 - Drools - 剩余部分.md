# 09、Drools 规则引擎 - Drools - 剩余部分
- 来源：https://ddkk.com/zhuanlan/other/drools/1/9.html
- 分类：Drools 教程
- 分组：教程目录
终于是把这一章给看完了，看完也有点懵，需要重新梳理实践一下，最主要是概念有些多，不过还好，多用一用就明白了。

### 规则单元API

这一章的前面几节都是在解释使用Drools规则引擎的传统KIE API。但是正如First Rule Project介绍的那样，在Drools8中，规则单元是一个新的并且推荐使用的规则实现形式。

规则单元是一个原子模块，定义了一套规则和一套强类型的数据源，通过数据源插入事实，这些插入的事实由规则进行处理。数据源有两种：DataStream和DataStore，这两种数据源会在稍后的进行介绍描述。

数据源可以在不同的单元中分享，用来提供他们之间的协调机制。

#### 规则单元数据

RuleUnitData是一个用来定义规则单元的接口。规则单元的实现应该像这样。

```java
public class MeasurementUnit implements RuleUnitData {
    private final DataStore<Measurement> measurements;
    private final Set<String> controlSet = new HashSet<>();
    public MeasurementUnit() {
        this(DataSource.createStore());
    }
    public MeasurementUnit(DataStore<Measurement> measurements) {
        this.measurements = measurements;
    }
    public DataStore<Measurement> getMeasurements() {
        return measurements;
    }
    public Set<String> getControlSet() {
        return controlSet;
    }
}
```

在这个例子中，Measurement是你的事实类，所以你需要实现它。规则单元的类名MeasurementUnit和DRL规则中unit语句相关联的。

```java
package org.example;
unit MeasurementUnit;
rule "will execute per each Measurement having ID color"
when
  ....
```

#### 数据源

数据源是规则单元可以订阅更新的类型化数据源。你可以通过暴露的数据源与其进行交互。

Drools支持下面类型的数据源。

- DataStream:仅追加的存储选项。当你想要发表或者分享值的时候，使用这个存储选项。你可以使用DataSource.createStream方法返回一个DataStreeam``对象，并使用append（T）方法添加更多数据。

DataStream数据源的使用例子

```java
DataStream<Measurement> measurements = DataSource.createStream();
// Append value and notify all subscribers
measurements.append(new Measurement("color", "red"));
```

- DataStore：一个可写存储选项，为了当数据添加或者删除时，通知所有订阅者，可修改数据已经被修改了。规则可以被模式匹配，并更新或删除可用值。对于熟悉传动DRL语法的用户，该选项相当于一个切入点的版本。实际上，DataStore``相当于传统样式的切入点。

DataSource数据源的使用示例

```java
DataStore<Measurement> measurements = DataSource.createStore();
Measurement measurement = new Measurement("color", "red");
// Add value and notify all subscribers
DataHandle mHandle = measurements.add(measurement);
measure.setValue("blue");
// Notify all subscribers that the value referenced by mHandle has changed
measurements.update(mHandle, measurement);
// Remove value referenced by mHandle and notify all subscribers
measurements.remove(mHandle);
```

- SingletonStore:可写的存储选项，对于可以设置和清除的单独元素，并通知所有订阅者元素已经被修改了。规则可以针对值的模式匹配，并更新或清除可用值。对于熟悉传统DRL语法的用户，该选项类似于一个全局选项，但是会对更改做出反应。Singleton``类似于传统格式的全局变量，只是当与规则结合时，你可以用模式匹配针对它。

SingletonStore 数据源定义示例

```java
SingletonStore<Measurement> measurement = DataSource.createSingleton();
Measurement m1 = new Measurement("color", "red");
// Add value m1 and notify all subscribers
measurement.set(m1);
measure.setValue("blue");
// Notify all subscribers that the value has changed
measurement.update();
Measurement m2 = new Measurement("color", "green");
// Overwrite contained value with m2 and notify all subscribers
measurement.set(m2);
measure2.setValue("black");
// Notify all subscribers that the value has changed
measurement.update();
// Clear store and notify all subscribers
measurement.clear();
```

数据源的订阅者相当于数据处理器。数据处理器实现了DataProcessor接口。这个接口包含对于事件的回调，该事件是订阅数据源可以触发的所有事件。

数据处理器

```java
public interface DataProcessor<T> {
    default void insert(T object) {
        insert(null, object);
    }
    FactHandle insert(DataHandle handle, T object);
    void update(DataHandle handle, T object);
    void delete(DataHandle handle);
}
```

DataHandle是数据源对象的内部引用。根据对应数据源是否实现了其自身的能力，每一个回调方法都有可能被引用，也有可能不被引用。举了例子，DataDteram数据源仅仅调用了插入回调，而SingletonStore数据源再看set上调用插入回调，在clear上或者覆盖set之前调用删除回调。

注意，数据处理器是一个很小的内部细节。如果你实例化了RuleUnitInstance，EntryPointDataProcessor会自动绑定规则单元的数据源。

#### 客户端代码

最后，你可以使用RuleUnitProvider实例化一个RuleUnitInstance去执行规则。

```java
    public void test() {
        MeasurementUnit measurementUnit = new MeasurementUnit();
        RuleUnitInstance<MeasurementUnit> instance = RuleUnitProvider.get().createRuleUnitInstance(measurementUnit);
        try {
            measurementUnit.getMeasurements().add(new Measurement("color", "red"));
            ...
            List<Measurement> queryResult = instance.executeQuery("FindColor").stream().map(tuple -> (Measurement) tuple.get("$m")).collect(toList());
            ...
        } finally {
            instance.dispose();
        }
    }
```

##### 配置项

你可以使用RuleConfig通过创建RuleUnitInstance来添加配置。

```java
        RuleConfig ruleConfig = RuleUnitProvider.get().newRuleConfig();
        ruleConfig.getAgendaEventListeners().add(new MyAgendaEventListener());
        ruleConfig.getRuleRuntimeListeners().add(new MyRuleRuntimeEventListener());
        ruleConfig.getRuleEventListeners().add(new MyRuleEventListener());
        HelloWorldUnit unit = new HelloWorldUnit();
        RuleUnitInstance<HelloWorldUnit> unitInstance = RuleUnitProvider.get().createRuleUnitInstance(unit, ruleConfig);
```

#### 在DRL中声明规则

你可以直接在DRL中声明规则单元，而不是编写一个java类。详情请见：

[https://docs.drools.org/8.40.0.Final/drools-docs/drools/language-reference/index.html#con-drl-rule-units_drl-rules](https://docs.drools.org/8.40.0.Final/drools-docs/drools/language-reference/index.html#con-drl-rule-units_drl-rules)

### 规则单元DSL

除了标准的规则单元API，drools8提供了与规则单元结合的规则编写方式。你可以为规则单元使用专用的javaAPI决策集合定义规则。让我们通过例子来学习一下。

```java
public class HelloWorldUnit implements RuleUnitDefinition {
    private final DataStore`<String>` strings; // DataStore where you add String factprivate final DataStore`<Integer>` ints; // DataStore where you add Integer factprivate final List`<String>` results = new ArrayList`<>`(); // Store results. In traditional DRL, it is called global// omitting constructors and getters// ...@Overridepublic void defineRules(RulesFactory rulesFactory) {
        // /strings[ this == "Hello World" ]
        rulesFactory.rule()
                    .on(strings)
                    .filter(EQUAL, "Hello World") // when no extractor is provided "this" is implicit
                    .execute(results, r -> r.add("it worked!")); // the consequence can ignore the matched facts// /strings[ length > 5 ]
        rulesFactory.rule()
                    .on(strings) // since the datasource has been already initialized its class can be inferred without the need of explicitly passing it
                    .filter(s -> s.length(), GREATER_THAN, 5) // when no property name is provided it's impossible to generate indexes and property reactivity
                    .execute(results, (r, s) -> r.add("it also worked with " + s.toUpperCase())); // this consequence also uses the matched fact// /strings[ length < 5 ]
        rulesFactory.rule("MyRule") // it is possible to optionally set a name for the rule
                    .on(strings)
                    .filter("length", s -> s.length(), LESS_THAN, 5) // providing the name of the property used in the constraint allows index and property reactivity generation
                    .execute(results, r -> r.add("this shouldn't fire"));
        // $s: /strings[ length > 5 ]// /ints[ this > 5, this == $s.length ]
        rulesFactory.rule()
                    .on(strings)
                    .filter("length", s -> s.length() > 5) // it is also possible to use a plain lambda predicate, but in this case no index can be generated
                    .join(
                          rule -> rule.on(ints) // creates a new pattern ...
                                      .filter(GREATER_THAN, 5) // ... add an alpha filter to it
                    ) // ... and join it with the former one
                    .filter(EQUAL, String::length) // this filter is applied to the result of the join, so it is a beta constraint
                    .execute(results, (r, s, i) -> r.add("String '" + s + "' is " + i + " characters long")); // the consequence captures all the joined variables positionally
    }
}
```

[https://docs.drools.org/8.40.0.Final/drools-docs/drools/language-reference/index.html#con-drl-rule-units_drl-rules](https://docs.drools.org/8.40.0.Final/drools-docs/drools/language-reference/index.html#con-drl-rule-units_drl-rules)就像你用defineRules方法定义规则一样，你可以执行规则，而不使用DRL去定义规则。

```java
    public void helloWorld() {
        HelloWorldUnit unit = new HelloWorldUnit();
        unit.getStrings().add("Hello World");
        RuleUnitInstance<HelloWorldUnit> unitInstance = RuleUnitProvider.get().createRuleUnitInstance(unit);
        assertThat(unitInstance.fire()).isEqualTo(2);
        assertThat(unit.getResults()).containsExactlyInAnyOrder("it worked!", "it also worked with HELLO WORLD");
        unit.getResults().clear();
        unit.getInts().add(11);
        assertThat(unitInstance.fire()).isEqualTo(1);
        assertThat(unit.getResults()).containsExactly("String 'Hello World' is 11 characters long");
        unitInstance.close();
    }
```

你可以在下面的地址中找到各种测试示例：

[https://github.com/kiegroup/drools/tree/main/drools-ruleunits/drools-ruleunits-dsl](https://github.com/kiegroup/drools/tree/main/drools-ruleunits/drools-ruleunits-dsl)

### 使用Kie扫描器去监控和更新Kie容器

Drools中的Kie扫描器会检测你的maven仓库，检测你的Drools项目是否有新的SNAPSHOT版本，并且部署最新的项目版本到一个指定的Kie容器中。你可以在开发项目中使用kie扫描器，以便在新本版可用时让你的drools项目开发更加高效。

> 在生产环境中，不要带SNAOSHOT版本号使用kie扫描器，避免出现意外，或者出乎意料的项目更新。kie扫描器是用于开发环境使用快照项目版本的时候使用。

先决条件

- 你的Drools项目中的类路径上有kie-ci.jar

过程

在相关的.java类的项目中，注册并开启KIE扫描器，如下面的例子所示：

对kie容器注册并开始kie扫描器

```java
import org.kie.api.KieServices;
import org.kie.api.builder.ReleaseId;
import org.kie.api.runtime.KieContainer;
import org.kie.api.builder.KieScanner;
...
KieServices kieServices = KieServices.Factory.get();
ReleaseId releaseId = kieServices
  .newReleaseId("com.sample", "my-app", "1.0-SNAPSHOT");
KieContainer kContainer = kieServices.newKieContainer(releaseId);
KieScanner kScanner = kieServices.newKieScanner(kContainer);
// Start KIE scanner for polling the Maven repository every 10 seconds (10000 ms)
kScanner.start(10000L);
```

在这个例子里，kie扫描器被配置了一个固定时间间隔执行。最小的kie扫描器执行时间间隔是1毫秒，最大的时间间隔是数据类型long的最大值。如果执行时间间隔是0会导致错误：java.lang.IllegalArgumentException: pollingInterval must be positive。你也可以根据需要调用scanNow（）方法。

例子中的项目的groupId，artifactId和版本号定义为com.sample:my-app:1.0-SNAPSHOT。项目版本必须包含-SNAPSHOT后缀用来启动Kie扫描器，以便检索指定工件版本的最新构建。如果你改变了快照项目的版本号，比如升了版本到1.0.1-SNAPSHOT，然后你就必须也更新你kie扫描器的配置中GAV定义的版本号。KIE扫描器不检索带有静态版本号的项目的更新，例如com.sample:my-app:1.0.

在maven仓库的settingg.xml文件中，设置updatePolicy配置为always，用来开始kie扫描器的功能：

```java
<profile>
    <id>my-nexus-env</id>
    <repositories>
        <repository>
            <id>my-nexus</id>
            <name>My Nexus repository</name>
            <url>http://repository.example.org/nexus/content/groups/public/</url>
            <layout>default</layout>
            <releases>
                <enabled>true</enabled>
                <updatePolicy>always</updatePolicy>
            </releases>
            <snapshots>
                <enabled>true</enabled>
                <updatePolicy>always</updatePolicy>
            </snapshots>
        </repository>
    </repositories>
</profile>
```

当kie扫描器开始轮训之后，如果检测到了指定容器中的快照项目有更新，kie扫描器会自动的下载新的项目版本，并启动新项目的增量构建。从那一刻起，所有Kie容器创建的新kieBase和KieSession对象都会使用新项目的版本。

### 安全管理

> 从JDK17开始，java平台就取消了安全管理；因此，这个特性在未来可能不被支持。
>
> 获取更多信息：JEP 411: Deprecate the Security Manager for Removal

kie引擎是一个建模和执行也为行为的平台，使用大量的抽象声明和隐喻，类似规则，处理，决策表等等。

很多时候，这些隐喻的创作是来自第三方团队，可能是同一个公司的不同团队，可能是合作伙伴的团队，甚至是网络上的匿名团队。

规则和处理过程被设计成可以执行任意代码来完成工作，当时在这些情况下，有可能需要去限制他们能做什么。举个例子，不太可能允许规则创建类加载器（能让系统受到攻击），当然，规则也不能允许调用System.exit()。

java平台提供了非常全面并很好定义的安全框架，该框架允许用户定义系统执行策略。kie平台利用该框架，允许应用开发人员定义指定策略应用于用户提供代码的任意执行，无论是规则，过程，工作先处理等等。

#### 如何定义一个Kie策略

规则和处理可以使用非常严格的权限去运行，但是引擎本身为了工作需要执行很多复杂的操作。举例来说：引擎需要创建类加载器，读取系统配置，访问文件系统，等等。

一旦安装了安全管理，JVM中的所有代码都需要根据定义的策略去执行。因为这个原因，kie允许用户定力两种不同的策略文件，一个针对引擎本身，一个针对部署到引擎中执行的素材。

设置环境的一种简单方法是为引擎本身提供一个非常宽松的策略，同时为规则和流程提供一个受限的策略。

策略文件遵循java文档中的标准策略文件语法。更详细内容，请参阅：

[Default Policy Implementation and Policy File Syntax](https://docs.oracle.com/javase/6/docs/technotes/guides/security/PolicyFiles.html#FileSyntax)

引擎的许可策略文件可以如下所示：

示例62. engin.policy文件的例子

```java
grant {
    permission java.security.AllPermission;
}
```

请注意，根据规则和过程的内容，很多权限需要被授予，比如访问文件系统，数据库等等。

为了使用策略文件，需要的是使用这些文件作为JVM的参数去执行应用程序，三个必须的参数如下所示：

参数

解释

-Djava.security.manager

开启安全管理

-Djava.security.policy=

定义应用于全部应用的全局策略文件，包括引擎

-Dkie.security.policy=

定义用于规则和过程的策略稳健

举个例子：

`java -Djava.security.manager -Djava.security.policy=global.policy -Dkie.security.policy=rules.policy foo.bar.MyApp`

> 当在容器内执行引擎时，使用容器的文档找出如何配置安全管理，并如何定义全局安全策略。像上面描述那样定义kie的安全策略，并为了让引擎使用该策略，设置系统属性kie.security.policy。

> 请注意，除非配置了安全管理，否则kie.security.policy将会被忽略。

> 安全管理会严重影响jvm的性能。强烈建议具有性能要求的系统不要使用安全管理。可以使用其他的安全处理，比如在测试和部署之前对规则/流程进行审计，以防止恶意代码被部署到环境中。
