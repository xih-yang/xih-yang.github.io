# 16、Drools 规则引擎 - 规则执行模式和线程安全
- 来源：https://ddkk.com/zhuanlan/other/drools/1/16.html
- 分类：Drools 教程
- 分组：教程目录
甩锅声明：本人英语一般，翻译只是为了做个笔记，所以有翻译错误的地方，错就错了，如果你想给我纠正，就给我留言，我会改过来，如果懒得理我，就直接划过即可。

#### drools的规则执行模式和线程安全

Drools支持下面的规则执行模式，这些模式决定了Drools如何以及何时执行规则：

- 被动模式：（默认）当用户或者应用明确调用了fireAllRules方法时，Drools会评估规则。Drools的被动模式对于需要直接控制规则评估和执行的应用程序，或者对于使用伪时钟实现的复杂的事件处理（CEP）应用程序来说都是是最好的。

被动模式的CEP应用程序代码示例

```java
KieSessionConfiguration config = KieServices.Factory.get().newKieSessionConfiguration();
config.setOption( ClockTypeOption.get("pseudo") );
KieSession session = kbase.newKieSession( conf, null );
SessionPseudoClock clock = session.getSessionClock();
session.insert( tick1 );
session.fireAllRules();
clock.advanceTime(1, TimeUnit.SECONDS);
session.insert( tick2 );
session.fireAllRules();
clock.advanceTime(1, TimeUnit.SECONDS);
session.insert( tick3 );
session.fireAllRules();
session.dispose();
```

- 主动模式：如果用户或者应用程序调用fireUntilHalt方法，Drools会启动主动模式并持续的评估规则，直到用户或者应用程序调用halt方法。主动模式对于将规则的评估和执行委托给Drools的应用程序，或者使用实时时钟实现的CEP程序来说是最好的。主动模式对于使用主动查询的CEP应用程序是可选的。

主动模式的示例CEP应用代码

```java
KieSessionConfiguration config = KieServices.Factory.get().newKieSessionConfiguration();
config.setOption( ClockTypeOption.get("realtime") );
KieSession session = kbase.newKieSession( conf, null );
new Thread( new Runnable() {
  @Overridepublic void run() {
      session.fireUntilHalt();
  }
} ).start();
session.insert( tick1 );
... Thread.sleep( 1000L ); ...
session.insert( tick2 );
... Thread.sleep( 1000L ); ...
session.insert( tick3 );
session.halt();
session.dispose();
```

这个例子启用了一个专门的线程调用fireUntilHalt方法，启用专门的线程是为了防止drools在评估规则时当前线程无休止的被阻塞。这个专门的线程也可以在之后的阶段调用halt方法。

尽管你应该避免同时调用fireAllRules方法和fireUntilHalt方法，尤其是来自不同线程的调用，但是Drools是可以处理这种情况的，处理方法就是使用安全线程逻辑和一个内部的状态机。如果fireAllRules方法正在调用的同时，你又调用fireUntilHalt方法，drools会使用被动模式继续运行，直到fireAllRules方法操作完成，然后启用主动模式用来响应fireUntilHalt的调用。但是，如果drools是以主动模式下调用fireUntilHalt，同时你调用了fireAllRules方法，这个fireAllRules方法调用会被忽略，drools会继续以主动模式运行，直到你调用了halt方法。

为了在主动模式下添加线程安全，drools支持submit方法，你可以使用submit方法对线程安全中的kie会话进行分组和操作，原子操作：

在主动模式下使用submit方法执行原子操作的应用代码示例

```java
KieSession session = ...;
new Thread( new Runnable() {
  @Overridepublic void run() {
      session.fireUntilHalt();
  }
} ).start();
final FactHandle fh = session.insert( fact_a );
... Thread.sleep( 1000L ); ...
session.submit( new KieSession.AtomicAction() {
  @Overridepublic void execute( KieSession kieSession ) {
    fact_a.setField("value");
    kieSession.update( fh, fact_a );
    kieSession.insert( fact_1 );
    kieSession.insert( fact_2 );
    kieSession.insert( fact_3 );
  }
} );
... Thread.sleep( 1000L ); ...
session.insert( fact_z );
session.halt();
session.dispose();
```

从客户端视角来看，线程安全和原子操作也是有帮助的。例如，你可能需要在给定时间内插入不止一条事实，但是需要drools去考虑将插入作为原子操作，并且等到所有插入完成之后，再次评估规则。
