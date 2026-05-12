# 19、Drools 规则引擎 - CEP 复杂事件处理
- 来源：https://ddkk.com/zhuanlan/other/drools/1/19.html
- 分类：Drools 教程
- 分组：教程目录
### 复杂事件处理（CEP）

在Drools中，事件是记录，记录了领域在某个时间点的状态的改变。根据领域的建模方式，状态的改变可能被一个单独事件代表，也可能被很多原子事件代表，或者相关事件的层次结构代表。从复杂事件处理角度来看，事件是事实或对象的一种类型，事件发生在某些特定的时间点，业务规则是对来自事实和对象数据如何反映的定义。例如：股票经纪人应用中，证券价格的变化，买卖关系的变化，或者账户持有人余额的变化都被认为是事件，因为在给定时间点上，应用程序的状态发生了变化。

Drools使用CEP来监测和处理事件集合中的多事件，发现事件之间存在的关系，并且从事件和他们的关系中推断出新的数据。

CEP用例和业务规则用例共享若干需求和目标。

从业务的角度出发，业务规则的定义通常基于事件触发的场景来定义。在下面的例子中，事件形成根据业务规则的基础：

- 在一个算法交易应用中，如果证券价格高于开盘价格百分之X以上，则规则执行操作。在股票交易应用中，价格上涨被标记为事件。
- 在一个监控应用中，如果服务器机房的温度在Y分钟内增长了X摄氏度，则规则执行操作。传感器的示数被标记为事件。

从技术角度来看，业务规则评估和CEP有下列相似之处：

- 业务规则评估和CEP都需要和企业基础设施和应用无缝集成，这一条对于生命周期管理，审计和安全尤其重要。
- 业务规则评估和CEP都有函数需求，例如模式匹配，还有无函数需求，例如响应时间限制和查询规则解释

CEP场景具有以下特征：

- 通常用来处理大量事件，但是只有少量事件是相关的。
- 时间通常是不变的，并且代表状态改变的记录。
- 规则和查询针对事件运行，并且必须对检测出的事件模式做出反应
- 先关事件通常拥有很强的时间关系
- 单条事件没有优先级。CEP系统会优先考虑相关事件的模式以及他们之间的关系
- 事件通常需要被组合与聚合

鉴于这些普通CEP场景特点，Drools的CEP系统支持下面的特性和功能，优化了事件处理：

- 用合适的语义处理事件
- 事件监测，关联，聚合和组合
- 事件流处理
- 时间约束建模事件之间的时间关系
- 重大事件的滑动窗口
- 会话范围的统一时钟
- CEP用例所需要的事件量
- 反应性规则
- 用于将事件输入到Drools的适配器（管道）

#### CEP中的事件

在Drools中，事件是应用领域在某个时间点上，对于状态的重大变化的记录。根据领域建模，状态的改变被一个单独事件，多个原子事件，或者相关事件的层次代表。从CEP视角来看，时间是事实或对象在某个特定时间点的类型，业务规则是定义了如何对事实或对象中的数据做出反应。举例来说，在股票经纪人应用中，证券价格的改变，买卖关系的改变，或者账户持有者的改变都被认为是事件，因为在某个给定的时间点，引用领域的状态发生了改变。

事件拥有下面的主要特征：

- 不变性：事件是过去某个时间点发生变化的记录，因此不能改变。

> Drools不会对代表事件的java对象强制不变。此行为可能会使事件数据变得丰富。你的应用应该能够填充未填充事件的属性，并且这些属性被Drools用于丰富推断数据的事件。但是，如果事件属性已经被填充之后，你不应该修改事件属性。

- 有很强的时间限制： 涉及事件的规则要求多事件关联，这些事件彼此相关，发生在不同的时间点上。
- 生命周期管理：因为事件是不变的和有时间限制的，所以他们通常只在指定的时间段内关联。这就意味着Drools能够自动管理事件的生命周期。
- 可以使用滑动窗口：可以定义事件定义时间和长度的滑动窗口。滑动的时间窗口是指可以处理事件的特定时间段。滑动长度窗口是指能够被处理的事件数量。

#### 将事实声明为事件

在Java类或者DRL规则文件中可以声明事实作为时间，所以Drools在处理CEP时将事实作为事件处理。你可以将事实作为internal-based事件或者point-in-time事件。Internal-base事件有持续时间，并且会被保存到Drools的工作内存中，直到持续时间结束。Point-in-time事件没有持续时间，本质上是持续时间为0的internal-based事件。

过程

对于在java类和Drl规则文件中的相关事实类型，输入元数据标签@role(event)和参数。元数据标签@role接收下面两个值：

- fact：（默认）声明作为相关事实的类型
- event：声明作为事件的类型

例如，下面代码段在股票经纪人应用中声明了StockPoint的事实类型，该类型必须作为事件被处理：

声明事实类型为事件

```java
import some.package.StockPoint
declare StockPoint
  @role( event )
end
```

如果StockPoint是在DRL规则文件中声明的事实类型，而不是之前就存在的类，你可以现声明事件：

现声明事实类型并赋予其事件的角色

```java
declare StockPoint
  @role( event )
  datetime : java.util.Date
  symbol : String
  price : double
end
```

#### Drools的事件处理模式

Drools既可以在云模式下运行，也可以在流模式下运行。在云模式下，Drools处理事实，按照没有时间限制，与时间无关，并且没有特定顺序的事实来处理。在流模式下，Drools处理事实，按照强时间限制，实时或近实时的事件来处理。流模式使用异步使事件处理成为可能。

云模式下，下面的需求不会引入：

- 没有时钟同步，因为没有时间概念
- 事件无序，因为引擎处理事件，是将事件当做无序云处理的，无序云就是Drools匹配规则的对象。

可以通过设置系统属性在相关的配置文件中指定云模式，也可以通过使用Java客户端的API：

使用系统属性设置云模式：

```java
drools.eventProcessingMode=cloud
```

使用java客户端API设置云模式

```java
import org.kie.api.conf.EventProcessingOption;
import org.kie.api.KieBaseConfiguration;
import org.kie.api.KieServices.Factory;
KieBaseConfiguration config = KieServices.Factory.get().newKieBaseConfiguration();
config.setOption(EventProcessingOption.CLOUD);
```

可以在kmodule.xml文件中使用KIE库属性eventProcessingMode=""指定云模式

```java
<kmodule>
  ...
  <kbase name="KBase2" default="false" eventProcessingMode="cloud" packages="org.domain.pkg2, org.domain.pkg3" includes="KBase1">
    ...
  </kbase>
  ...
</kmodule>
```

流模式

流模式按时间顺序处理事件，并且是按照插入的顺序实时处理的。在流模式下，Drools同步事件流（以便不同的流中能够按时间顺序处理），实现时间或长度的滑动窗口，并且启动自动生命周期管理。

下面的需求应用于流模式：

- 每一个流中的事件都要按时间排序。
- 同步事件流必须有会话时钟存在。

> 你的应用不需要再流之间强制事件的顺序，但是使用没有同步的事件流有可能会引起意想不到的结果

可以通过设置系统属性在相关的配置文件中指定流模式，也可以通过使用Java客户端的API：

```java
drools.eventProcessingMode=stream
```

使用java客户端API设置云模式

```java
import org.kie.api.conf.EventProcessingOption;
import org.kie.api.KieBaseConfiguration;
import org.kie.api.KieServices.Factory;
KieBaseConfiguration config = KieServices.Factory.get().newKieBaseConfiguration();
config.setOption(EventProcessingOption.STREAM);
```

可以在kmodule.xml文件中使用KIE库属性eventProcessingMode=""指定流模式

```java
<kmodule>
  ...
  <kbase name="KBase2" default="false" eventProcessingMode="stream" packages="org.domain.pkg2, org.domain.pkg3" includes="KBase1">
    ...
  </kbase>
  ...
</kmodule>
```

##### 流模式中的负模式

负模式是不满足条件的模式，例如，如果检测到火灾且未激活洒水器，以下DRL规则将激活火灾警报：

```java
rule "Sound the alarm"
when
  $f : FireDetected()
  not(SprinklerActivated())
then
  // Sound the alarm.
end
```

在云模式下，Drools假设所有事实（常规事实和事件）都是预先知道的，并且立即评估负模式。流模式下，Drools只是对事实的时间约束，用来等待激活规则之前的设置时间。

相同的例子在流模式下激活报警是一样的，但是会延迟10秒。

使用负模式的火警警报和时间延迟（只有流模式下）

```java
rule "Sound the alarm"
when
  $f : FireDetected()
  not(SprinklerActivated(this after[0s,10s] $f))
then
  // Sound the alarm.
end
```

下面修改的火警规则期望每十秒发生一个心跳事件。如果期望的时间没有发生，则规则会被执行。这个规则使用了在第一个模式和负模式中相同的对象类型。负模式有时间约束，在执行之前等待0到10秒，并且排除绑定到$h的心跳事件，以便规则可以执行。绑定事件$h必须显式排除，为了规则能够执行，因为时间约束不会排除并在此匹配。

在负模式中排除绑定事件的火警规则（只流模式）

```java
rule "Sound the alarm"
when
  $h: Heartbeat() from entry-point "MonitoringStream"
  not(Heartbeat(this != $h, this after[0s,10s] $h) from entry-point "MonitoringStream")
then
  // Sound the alarm.
end
```
