# 22、Drools 规则引擎 - CEP 会话时钟，事件流和切入点
- 来源：https://ddkk.com/zhuanlan/other/drools/1/22.html
- 分类：Drools 教程
- 分组：教程目录
#### 会话时钟的实现

在复杂事件处理期间，事件可能会有时间约束，因为需要一个会话时钟，用来提供当前的时间。例如，如果规则需要决定过去一个小时的某个给定股票的平均价格，Drools必须能够用会话中的当前时间比较股票价格的事件的时间戳。

Drools支持实时时钟和伪时钟。你可以根据场景使用一个或两个时钟类型：

- 规则测试：测试需要控制环境，并且当测试包含使用时间约束的规则，你必须能够控制输入的规则、事实和时间流。
- 定期执行：Drools会实时对事件作出反应，因此需要一个实时时钟。
- 指定环境：指定环境可能会有指定时间控制需求。例如，聚类环境可能需要时钟同步或者JEE环境可能需要应用服务器通过的时钟。
- 规则重播或模拟：为了重播或模拟场景，应用必须能够控制时间流。

根据你的环境需求来决定是否使用实时时钟或者伪时钟。

实时时钟

实时时钟是默认时钟，使用的是系统时钟作为时间戳。配置Drools使用实时时钟，设置KIE会话配置参数为realtime：

配置实时时钟代码如下：

```java
import org.kie.api.KieServices.Factory;
import org.kie.api.runtime.conf.ClockTypeOption;
import org.kie.api.runtime.KieSessionConfiguration;
KieSessionConfiguration config = KieServices.Factory.get().newKieSessionConfiguration();
config.setOption(ClockTypeOption.get("realtime"));
```

伪时钟

伪时钟是为了辅助测试时间规则，伪时钟可以被应用控制。配置Drools使用伪时钟，设置KIE会话配置参数为pseudo：

配置伪时钟代码如下：

```java
import org.kie.api.runtime.conf.ClockTypeOption;
import org.kie.api.runtime.KieSessionConfiguration;
import org.kie.api.KieServices.Factory;
KieSessionConfiguration config = KieServices.Factory.get().newKieSessionConfiguration();
config.setOption(ClockTypeOption.get("pseudo"));
```

你也可以使用额外的配置和事实处理控制伪时钟：

在会话中控制伪时钟

```java
import java.util.concurrent.TimeUnit;
import org.kie.api.runtime.KieSessionConfiguration;
import org.kie.api.KieServices.Factory;
import org.kie.api.runtime.KieSession;
import org.drools.core.time.SessionPseudoClock;
import org.kie.api.runtime.rule.FactHandle;
import org.kie.api.runtime.conf.ClockTypeOption;
KieSessionConfiguration conf = KieServices.Factory.get().newKieSessionConfiguration();
conf.setOption( ClockTypeOption.get("pseudo"));
KieSession session = kbase.newKieSession(conf, null);
SessionPseudoClock clock = session.getSessionClock();
// While inserting facts, advance the clock as necessary.
FactHandle handle1 = session.insert(tick1);
clock.advanceTime(10, TimeUnit.SECONDS);
FactHandle handle2 = session.insert(tick2);
clock.advanceTime(30, TimeUnit.SECONDS);
FactHandle handle3 = session.insert(tick3);
```

#### 事件流和切入点

Drools可以用事件流的形式处理大量事件。在DRL规则文件中声明，流也被成为切入点。当你在DRL规则文件或者java应用中声明了切入点，Drools会在编译时会识别和创建适当的内部规则，用来使用切入点的数据去评估规则。

一个切入点的事实或流可以连接来自任意其切入点的事实，除了已经在工作内存中的事实。事实总是会和他们进入的切入点关联。相同类型的事实可以通过不同的切入点进入Drools，但是通过切入点A进入的事实不会与切入点B的模式匹配。

事件流有下面的特点：

- 流中的时间会按时间排序。虽然时间戳在不同的流中可能有不同的语义，但是他们总是内部排序的。
- 事件流通常会有大量的事件。
- 流中的原子事件通常单独没有用，只在流中集合时才有用。
- 事件流可以是同构的，包含单一事件类型，或者异构，包含各种不同类型的事件。

##### 为规则数据声明切入点

你可以为事件声明一个切入点（事件流），好让Drools只用来自切入点的数据评估规则。你可以在DRL规则文件中通过引用隐式声明切入点，也可以在java程序中显式声明切入点。

过程

使用下面方法之一声明切入点

- 在DRL规则文件，为插入的事实指定from entry-point "``"

使用"ATM流"切入点授权提现规则

```java
rule "Authorize withdrawal"
when
  WithdrawRequest($ai : accountId, $am : amount) from entry-point "ATM Stream"
  CheckingAccount(accountId == $ai, balance > $am)
then
  // Authorize withdrawal.
end
```

应用带有"分支流"切入点的费用规则

```java
rule "Apply fee on withdraws on branches"
when
  WithdrawRequest($ai : accountId, processed == true) from entry-point "Branch Stream"
  CheckingAccount(accountId == $ai)
then
  // Apply a $2 fee on the account.
end
```

银行系统的两个示例中的DRL规则都是插入了带有CheckingAccount事实的WithdrawalRequest事件，但是是从不同的切入点插入的。在运行时，Authorize withdrawal规则只会用ATM Stream切入点的数据来评估，而Apply fee规则只会用Branch Stream切入点来评估。任何插入到ATM stream的事件都不会与Apply fee规则里面的模式匹配，同理，任何插入到Branch Stream的事件都不会与Authorize withdrawal rule规则匹配。

在Java应用代码里，使用getEntryPoint方法指定获取一个EntryPoint对象，同时将事实插入到该切入点中：

用java代码的切入点并插入事实

```java
import org.kie.api.runtime.KieSession;
import org.kie.api.runtime.rule.EntryPoint;
// Create your KIE base and KIE session as usual.
KieSession session = ...
// Create a reference to the entry point.
EntryPoint atmStream = session.getEntryPoint("ATM Stream");
// Start inserting your facts into the entry point.
atmStream.insert(aWithdrawRequest);
```

任何指定了from entry-point Atm StreamDRL的规则，都只会根据这个切入点的数据进行评估。
