# 13、Drools 规则引擎 - 规则引擎的推断和事实维护
- 来源：https://ddkk.com/zhuanlan/other/drools/1/13.html
- 分类：Drools 教程
- 分组：教程目录
### Drools规则引擎的推断和事实维护

规则引擎的基础函数是匹配数据和业务规则，并决定是否执行和如何执行规则。为了确保相关数据被应用于合适规则，规则引擎会基于存在的知识进行推断并基于推断结果执行操作。

举个例子，下面的DRL规则决定了成年人的年龄要求，例如可以用于公交卡政策：定义年龄的规则

```java
rule "Infer Adult"
when
  $p : Person(age >= 18)
then
  insert(new IsAdult($p))
end
```

根据这个规则，规则引擎推断一个人是否是成年人或者儿童，并执行指定的操作。每一个大于或等于18岁的人在工作内存中会有一个IsAudult的实例。这个年龄和公交卡相关的推断可以在任何规则里被调用，例如在下面这个代码片段里：

```java
$p : Person()
IsAdult(person == $p)
```

很多情况下，规则系统中的新数据，是其他规则执行的结果，这种新数据能够影响其他规则的执行，如果规则引擎推断数据是执行规则的结果，引擎会用事实维护去证明合理性，并当其应用于推断其他规则时强制其为真。事实维护也有助于识别不一致和处理冲突。举个例子，如果两条规则执行了，结果导致了矛盾的操作，规则引擎会从之前计算结论的假设去选择操作。

规则引擎使用状态或者逻辑插入去插入事实：

- 状态插入：用insert方法定义。状态插入之后，事实通常会被明确的回收。
- 逻辑插入：用insertLogical方法定义。在逻辑插入之后，当插入事实的规则条件不再为真时，插入的事实会自动回收。当没有条件支持逻辑插入时，事实会回收。规则引擎认为逻辑插入的事实是合理的。

举个例子，下面的示例DRL规则使用状态插入，决定签发儿童公交卡和成人公交卡的年龄要求：

签发公家卡的规则，状态插入

```java
rule "Issue Child Bus Pass"
when
  $p : Person(age < 18)
then
  insert(new ChildBusPass($p));
end
rule "Issue Adult Bus Pass"
when
  $p : Person(age >= 18)
then
  insert(new AdultBusPass($p));
end
```

随着乘客年龄的增长，从儿童公交卡变成成人公交卡，这些规则在规则引擎中不容易维护。作为选择，这些规则可以使用逻辑插入被分开，分为乘客年龄规则和公交卡类型规则。事实的逻辑插入使得事实依赖子句when的真实性。

下面的DRL规则使用逻辑插入决定儿童和成人的年龄要求：

儿童与成人年龄要求，逻辑插入

```java
rule "Infer Child"
when
  $p : Person(age < 18)
then
  insertLogical(new IsChild($p))
end
rule "Infer Adult"
when
  $p : Person(age >= 18)
then
  insertLogical(new IsAdult($p))
end
```

> 对于逻辑插入，你的事实对象必须重写equals和hashCode方法。两个对象相等的条件是，equals方法返回true，hashCode方法返回的值相等。获取更多信息，请参照你使用的java版本的api文档

当规则中的条件是false，事实会被自动回收。此行为在这个示例中是有帮助的，因为这两个规则是互斥的。在例子中，如果年龄小于18岁，规则会逻辑插入IsChild事实。在人大于或等于18岁的时候，IsChild事实会被自动回收，并且IsAdult事实会被插入。

然后下面的DRL规则会决定签发儿童公交卡或者成人公交卡，并且逻辑插入ChildBudPass或者AdultBusPass事实。这种规则配置是可以的，因为规则引擎的真值系统支持回收级联集合逻辑插入链。

签发公交卡规则，逻辑插入

```java
rule "Issue Child Bus Pass"
when
  $p : Person()
    IsChild(person == $p)
then
  insertLogical(new ChildBusPass($p));
end
rule "Issue Adult Bus Pass"
when
  $p : Person()
    IsAdult(person =$p)
then
  insertLogical(new AdultBusPass($p));
end
```

当某人到18岁时，IsChild事实和人的ChildBusPass事实会被回收。在这些条件下，你可以级联其他规则，当年龄超过18岁之后，必须回收儿童公交卡。当规则引擎自动回收ChildBusPass对象时，下面的规则会执行，向人发送请求：

通知巴士通行证持有人新通行证的规则

```java
rule "Return ChildBusPass Request"
when
  $p : Person()
    not(ChildBusPass(person == $p))
then
  requestChildBusPass($p);
end
```

下面流程图说明了状态插入和逻辑插入的生命周期：

图示2. 状态插入

图示3.逻辑插入

当规则引擎在规则执行期间逻辑插入了一个对象，规则引擎会通过执行规则证明对象的合理性。对于每个逻辑插入，只能存在一个相等的对象，并且每个后去相等的逻辑插入，都会增加逻辑插入的调整计数器。当规则条件不真时，调整计数器会被移除。当没有更多的调整计数器存在时，逻辑插入会被自动回收。
