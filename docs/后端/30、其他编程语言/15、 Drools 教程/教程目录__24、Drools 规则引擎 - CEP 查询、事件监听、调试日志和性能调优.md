# 24、Drools 规则引擎 - CEP 查询、事件监听、调试日志和性能调优
- 来源：https://ddkk.com/zhuanlan/other/drools/1/24.html
- 分类：Drools 教程
- 分组：教程目录
### Drools查询和实时查询

你可以将查询和Drools引擎一起使用，这样就可以根据在规则中使用的事实模式去检索事实集合。模式也可以使用可选参数。

使用查询和Drools，你需要在DRL文件中添加查询的定义，然后在应用代码中获取匹配的结果。当查询遍历结果集时，你可以使用任意绑定到查询的标识符访问相关的事实或属性，通过带有绑定的变量名作为参数调用get方法。如果绑定的是一个事实对象的引用，你可以通过调用geyFactHandle方法检索事实处理，将变量名作为参数。

图示13. QueryResults

图示14. QueryResultsRow

在DRL中的查询定义

```java
query "people under the age of 21"
    $person : Person( age < 21 )
end
```

获得和遍历查询结果的代码

```java
QueryResults results = ksession.getQueryResults( "people under the age of 21" );
System.out.println( "we have " + results.size() + " people under the age of 21" );
System.out.println( "These people are under the age of 21:" );
for ( QueryResultsRow row : results ) {
    Person person = ( Person ) row.get( "person" );
    System.out.println( person.getName() + "\n" );
}
```

当您监视随时间变化时，通过遍历返回的集合来调用查询和处理结果可能很困难。 使用持续查询来降低困难程度，drools提供了实时查询，实时查询使用附加的监听器来监听事件的改变，而不是遍历返回的结果集。实时查询通过创建一个视图来维持打开状态，并为这个视图推送更改事件。

要激活实时查询，请使用参数开始查询并监控结果视图中的更改。 您可以使用dispose（）方法终止查询并停止此反应式场景。

在DRL文件中的查询定义

```java
query colors(String $color1, String $color2)
    TShirt(mainColor = $color1, secondColor = $color2, $price: manufactureCost)
end
```

使用事件监听和实时查询的代码

```java
final List updated = new ArrayList();
final List removed = new ArrayList();
final List added = new ArrayList();
ViewChangedEventListener listener = new ViewChangedEventListener() {
 public void rowUpdated(Row row) {
  updated.add( row.get( "$price" ) );
 }
 public void rowRemoved(Row row) {
  removed.add( row.get( "$price" ) );
 }
 public void rowAdded(Row row) {
  added.add( row.get( "$price" ) );
 }
};
// Open the live query:
LiveQuery query = ksession.openLiveQuery( "colors",
                                          new Object[] { "red", "blue" },
                                          listener );
...
...
// Terminate the live query:
query.dispose()
```

获取更多关于实时查询的例子，请看

http://blog.athico.com/2010/07/glazed-lists-examples-for-drools-live.html

### Drools的事件监听和调试日志

Drools会在插入事实和规则执行时产生事件。如果你注册了事件监听器，当执行活动时Drools会调用每一个监听器。

事件监听器对不同的活动类型有不同的方法关联。Drools会给每个方法传递一个事件对象，这个对象包含指定活动的信息。

你的代码可以实现自定义的事件监听器，你也可以添加和移除注册的事件监听器。用这种方式，你的代码可以被Drools活动通知，并且你可以将日志和审计工作从你的引用代码里分离。

Drools引擎支持使用下面的方法的事件监听器

议程事件监听器

```java
public interface AgendaEventListenerextendsEventListener {
    void matchCreated(MatchCreatedEvent event);
    void matchCancelled(MatchCancelledEvent event);
    void beforeMatchFired(BeforeMatchFiredEvent event);
    void afterMatchFired(AfterMatchFiredEvent event);
    void agendaGroupPopped(AgendaGroupPoppedEvent event);
    void agendaGroupPushed(AgendaGroupPushedEvent event);
    void beforeRuleFlowGroupActivated(RuleFlowGroupActivatedEvent event);
    void afterRuleFlowGroupActivated(RuleFlowGroupActivatedEvent event);
    void beforeRuleFlowGroupDeactivated(RuleFlowGroupDeactivatedEvent event);
    void afterRuleFlowGroupDeactivated(RuleFlowGroupDeactivatedEvent event);
}
```

规则运行监听器

```java
public interface RuleRuntimeEventListener extends EventListener {
    void objectInserted(ObjectInsertedEvent event);
    void objectUpdated(ObjectUpdatedEvent event);
    void objectDeleted(ObjectDeletedEvent event);
}
```

关于事件类的定义，看

https://github.com/kiegroup/drools/tree/7.59.0.Final/drools-core/src/main/java/org/drools/core/event

Drools包含这些监听类的默认实现：DefaultAgendaEventListener和DefaultRuleRuntimeEventListener。你可以继承这些实现来监控指定的事件。

例如，下面的代码继承了DefaultAgendaEventListener来监视AfterMatchFireEvent事件并且将这个监听器连接到会话上。当规则启动时，代码会打印模匹配的模式：

在议程中监控并打印AfterMatchFireEvent事件的代码

```java
ksession.addEventListener( new DefaultAgendaEventListener() {
   public void afterMatchFired(AfterMatchFiredEvent event) {
       super.afterMatchFired( event );
       System.out.println( event );
   }
});
```

Drools为调试日志也包含下面的议程和规则运行时事件监听器：

- DebugAgendaEventListener
- DebugRuleRuntimeEventListener

这些监听器实现了相同的支持事件监听器方法并默认包含一个调试打印语句。你可以为指定支持事件添加额外的监控代码。

例如，下面的代码使用DebugRuleRuntimeEventListener事件监听器去监控和打印所有的工作内存（规则运行时）事件“

监控并打印所有工作内存事件的代码

```java
ksession.addEventListener( new DebugRuleRuntimeEventListener() );
```

#### 事件监听器的开发实践

Drools在规则处理期间调用事件监听。这些调用会阻止Drools的执行。因为事件监听会影响Drools的性能。

为了将监听的影响降低至最小，请遵循下面的指导：

- 任何操作必须尽可能的短。
- 监听器类必须没有状态。Drool可以在任意时间摧毁和重建监听器类。
- 不要使用依赖不同监听器的执行顺序的逻辑
- 不在要监听器内与Drools之外的不同实体进行交互。例如，时间的通知不要包含REST调用。日志的输出可以，但是日志监听器必须尽可能的短
- 你可以使用监听器修改Drools的状态，例如，改变变量的值。

#### 在Drools中配置日志

Drools使用Java的日志APISLF4J作为系统日志。你可以使用下面日志工具中的一种，用于故障排查和数据收集：

- Logback
- Apache Commons Logging
- Apache Log4j
- java.util.logging package

过程

对于你想要使用的日志工具，在Maven工程中添加相关的依赖，或者在你的Drools包中的org.drools中保存相关的XML配置文件：

Logback的Maven依赖示例

```java
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>${logback.version}</version>
</dependency>
```

在org.drools包中的logback.xml配置示例

```java
<configuration><logger name="org.drools" level="debug"/>
  ...
<configuration>
```

在org.drools包中的log4j.xml配置示例

```java
<log4j:configuration xmlns:log4j="http://jakarta.apache.org/log4j/"><category name="org.drools"><priority value="debug" /></category>
  ...
</log4j:configuration>
```

> 如果你正在开发一个超级轻量级的环境，可以使用slf4j-nop或者slf4j-simple logger。

### Drools性能调优的注意事项

下面的关键概念和建议实践可以帮你优化Drools的性能。为了方便起见，本章节的总结了这些概念，并在交叉引用文档中做了更加详细的解释。这一节将会根据Drools新版的需要进行扩展或者更改。

##### 对于Drools的重要更新没有需求的无状态会话使用顺序模式

在Drools中，顺序模式是高级规则库配置，顺序模式让Drools按顺序一次性的评估规则，这些规则是Drools议程列表中的规则，忽略工作内存中的修改。因此，顺序模式下的规则执行可能更快，但是重要的更新可能不会被用到你的规则中去，顺序模式只用于无状态的会话。

开启顺序模式，设置系统属性drools.sequential为true。

获取更多关于顺序模式的信息或者其他开启他的选择，请看“Phreak中的顺序模式”章节了解.

##### 使用事件监听器进行简单操作

限制事件监听器的数量和监听器执行的操作类型。对简单操作使用事件监听器，比如调试日志和设置属性。监听器中的复杂操作，比如网络调用，会阻碍规则执行。当你用会话完成了工作之后，移除附加的事件监听器，以便让会话可以被清除，展示代码如下：

```java
Listener listener = ...;
StatelessKnowledgeSession ksession = createSession();
try {
    ksession.insert(fact);
    ksession.fireAllRules();
    ...
} finally {
    if (session != null) {
        ksession.detachListener(listener);
        ksession.dispose();
    }
}
```

##### 为可执行模型构建配置LambdaIntrospector的缓存大小

你可以在可执行模型构建中配置LambdaIntrospector.methodFingerprintsMap缓存的大小。默认的大小是32。当你为缓存配置较小的值时，会减少内存的使用。例如，你可以配置系统属性drools.lambda.introspector.cache.size为0，以实现最小的内存使用。注意，较小的缓存也可能会降低构建性能。

##### 对可执行模型使用lambda外部化

在运行期间使用lambda外部化可以优化内存的使用。lambda外部化会重写lambda，这些lambda是生成和可执行模型上使用的lambda。这个外部化能够在所有模式和星通的约束下重用lambda多次。当rete或phreak被实例化时，可执行模型变得可以收集垃圾。

要为可执行模型启用lambda外部化，请包含以下属性：

```java
-Ddrools.externaliseCanonicalModelLambda=true
```

##### 配置alpha节点范围下标阈值

Alpha节点范围下标用于评估规则限制。你可以使用系统属性（drools.alphaNodeRangeIndexThreshold）配置alpha节点范围下标的阈值。默认阈值是9，表示当先前节点包含超过九个具有不等式约束的alpha节点时，启用alpha节点范围索引。比如，当你有九条类似于Person（age>10）,Person(age>20),...,Person(age>90)这样的规则时，你可以有9个类似的alpha节点。

阈值的默认值是根据相关的优势和开销。但是，如果你为阈值配置了一个相对较小的值时，则可以根据您的规则提高性能。 比如，你可以配置drools.alphaNodeRangeIndexThreshold为6，当先例节点的alpha节点超过六个时启用alpha节点范围索引。您可以根据您的规则的性能测试结果为阈值设置一个合适的值。

##### 启用连接节点范围索引

连接节点范围索引功能仅在有大量事实要连接时才会提高性能，例如256*16组合。当您的应用程序插入大量事实时，您可以启用连接节点范围索引并评估性能改进。默认情况下，连接节点范围索引被禁用。

示例kmodule. xml文件

```java
<kbase name="KBase1" betaRangeIndex="enabled">
```

BetaRangeIndexOption的系统属性

```java
drools.betaNodeRangeIndexEnabled=true
```
