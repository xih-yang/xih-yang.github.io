# 12、Drools 规则引擎 - 有状态会话和会话池
- 来源：https://ddkk.com/zhuanlan/other/drools/1/12.html
- 分类：Drools 教程
- 分组：教程目录
#### 有状态的kie会话

有状态会话就是使用推断让事实随着时间变化不断的更改。在有状态会话中 ，上一次调用的数据将会在会话调用之间被保留，而无状态会话这个数据不保留。

> 请在有状态的会话运行结束之后调用dispose方法，防止会话调用之间的内存泄露。

有状态会话通常在以下情况使用：

- 监控：比如监控股市，自动化购物流程
- 诊断：比如故障查找流程，医疗诊断流程
- 物流：比如包裹跟踪和交付供应
- 确保合规：例如验证市场交易的合法性

例子，思考一下下面的获奖数据模型和示例DRL文件：

喷头和火灾报警的数据模型

```java
public class Room {
  private String name;
  // Getter and setter methods
}
public class Sprinkler {
  private Room room;
  private boolean on;
  // Getter and setter methods
}
public class Fire {
  private Room room;
  // Getter and setter methods
}
public class Alarm { }
```

用于激活洒水器和警报的示例DRL规则集

```java
rule "When there is a fire turn on the sprinkler"
when
  Fire($room : room)
  $sprinkler : Sprinkler(room == $room, on == false)
then
  modify($sprinkler) { setOn(true) };
  System.out.println("Turn on the sprinkler for room "+$room.getName());
end
rule "Raise the alarm when we have one or more fires"
when
    exists Fire()
then
    insert( new Alarm() );
    System.out.println( "Raise the alarm" );
end
rule "Cancel the alarm when all the fires have gone"
when
    not Fire()
    $alarm : Alarm()
then
    delete( $alarm );
    System.out.println( "Cancel the alarm" );
end
rule "Status output when things are ok"
when
    not Alarm()
    not Sprinkler( on == true )
then
    System.out.println( "Everything is ok" );
end
```

“当着火就打开喷头”的规则，当火灾发生，为着火的房间创建Fire实例，并插入到会话中。在Fire实例中为指定房间添加一个限制，为了只检查着火的房间。当这条规则执行时，喷头激活。其他示例规则确定警报何时激活或停用。

无状态会话修改属性依赖标准的java语法，而有状态会话依赖修改语句去通知引擎规则的变化。然后规则引擎对规则进行修改，并评估其对后续规则执行的影响。这个过程是drools引擎使用推理和真相维护能力的一部分，也是有状态会话必不可少的一部分。

在这个例子里，示例规则和所有drools项目中其他resources文件夹下的文件，用下面的代码构建：

创建kie容器

```java
KieServices kieServices = KieServices.Factory.get();
KieContainer kContainer = kieServices.getKieClasspathContainer();
```

这个代码编译了所有类路径上的规则文件，并在KieContainer中添加了编译的结果——KieModule对象

最终，从kie容器中实例化无状态的kie会话对象，并执行指定数据。

实例化有状态kie会话并输入数据

```java
KieSession ksession = kContainer.newKieSession();
String[] names = new String[]{"kitchen", "bedroom", "office", "livingroom"};
Map<String,Room> name2room = new HashMap<String,Room>();
for( String name: names ){
    Room room = new Room( name );
    name2room.put( name, room );
    ksession.insert( room );
    Sprinkler sprinkler = new Sprinkler( room );
    ksession.insert( sprinkler );
}
ksession.fireAllRules();
```

输出

```java
Everything is ok
```

添加数据，引擎完成所有的匹配，但是没有规则执行，所以配置的验证消息会出现。作为新数据触发规则条件时，引擎执行规则启动报警，然后取消已经启动的报警：

输入新数据触发规则

```java
Fire kitchenFire = new Fire( name2room.get( "kitchen" ) );
Fire officeFire = new Fire( name2room.get( "office" ) );
FactHandle kitchenFireHandle = ksession.insert( kitchenFire );
FactHandle officeFireHandle = ksession.insert( officeFire );
ksession.fireAllRules();
```

触发

```java
Raise the alarm
> Turn on the sprinkler for room kitchen
> Turn on the sprinkler for room office
```

```java
ksession.delete( kitchenFireHandle );
ksession.delete( officeFireHandle );
ksession.fireAllRules();
```

触发

```java
Cancel the alarm
> Turn off the sprinkler for room office
> Turn off the sprinkler for room kitchen
> Everything is ok
```

在这种情况下，引用会一直保持到返回FactHandle对象。事实处理是对插入实例的内部引擎引用，可以稍后回收或者修改。

在这个展示的例子中，从有状态会话（激活报警）的数据和结果会影响后续会话（取消报警）的调用。

#### 会话池

在拥有大量kie运行时数据和高可用系统中，会话的创建和取消非常频繁。会话的创建和取消不总是耗时的，但是当创建和取消需要重复上百万次的时候，这个过程就可能成为瓶颈。

为了这些高容量的情况，可以使用会话池来代替使用很多单个会话的场景。从容器当中获取会话池，在池中定义会话的初始数量，从池中创建会话如下：

会话池示例

```java
// Obtain a KIE session pool from the KIE container
KieContainerSessionsPool pool = kContainer.newKieSessionsPool(10);
// Create KIE sessions from the KIE session pool
KieSession kSession = pool.newKieSession();
```

在这个例子中，会话池中开始时有10个会话，你也可以指定你需要的会话数量。这个整数值只是池中初始创建会话的数量。如果运行时需要，池中的会话数量可以动态增加，可以超过初始数量。

在定义完会话池之后，下一步就和使用会话一样了，调用会话中的dispose，会话会重置并返回到会话池中，而不是被销毁。

会话池通常应用于有状态会话，但是也会影响无状态会话，被影响的无状态会话通常是调用了execute方法的会话。当你直接从容器中创建了一个无状态会话，会话会在每一次调用execute时在内部创建一个新的会话。相反的，当你从会话池中创建一个无状态会话，会话内部只能使用池中提供的指定会话。

当你完成使用会话池，你可以调用会话池的shutdown方法防止内存泄露。或者，也可以调用容器中的dispose方法去关闭容器创建的所有池。
