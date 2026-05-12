# 17、Drools 规则引擎 - drools中的事实传播模式和议程评估过滤器
- 来源：https://ddkk.com/zhuanlan/other/drools/1/17.html
- 分类：Drools 教程
- 分组：教程目录
#### drools中的事实传播模式

drools支持下面的事实传播模式，这些模式决定了drools如何通过引擎网络推进插入的事实，用来为执行规则做准备：

- Lazy（延迟模式）：（默认） 事实在规则执行时在批量集合中传播，而不是作为插入的单条事实去实时传播。因此，事实最终的传播顺序，和事实插入的顺序是不一样的。
- Immediate（立即模式）：事实会立即传播，而且事实传播的顺序就是事实插入时的顺序。
- Eager（急切模式）：事实被延迟传播（在批处理集合中），但是是在规则执行之前。drools的这种传播行为是为了那些设置了no-loop或者lock-on-active属性的规则。

默认的，为了全面提高规则评估，drools的Phreak规则算法使用懒加载事实传播。但是，在少数情况下，懒加载能改变某些规则执行的预期结果，这些规则执行就需要立即传播或者eager传播。

例如，下面的规则用？前缀的指定查询，用来仅拉取或被动方式调用查询：

使用被动查询规则的示例

```java
query Q (Integer i)
    String( this == i.toString() )
end
rule "Rule"
  when
    $i : Integer()
    ?Q( $i; )
  then
    System.out.println( $i );
end
```

对于这个例子，在插入整数之前，只有当插入满足查询的字符串时，规则才会被执行，例如下面的示例命令：

触发规则执行的示例命令

```java
KieSession ksession = ...
ksession.insert("1");
ksession.insert(1);
ksession.fireAllRules();
```

但是，由于在Phreak中默认的传播行为是懒加载，drools没有检测到两个事实的插入顺序，所以，不论字符串和整数的插入顺序如何，这个规则都会执行。对于这个例子，为了预期的规则评估，需要立即传播。

在这个情况下，为了完成预期的规则评估，更改drools的传播模式，你可以在你的规则上添加@Propagation()注解，并且设置为LAZY，IMMEDIATE或者EAGER。

这相同的示例规则下，立即传播注解能够像预期的那样执行规则评估：

使用被动查询和指定传播模式的规则示例

```java
query Q (Integer i)
    String( this == i.toString() )
end
rule "Rule" @Propagation(IMMEDIATE)
  when
    $i : Integer()
    ?Q( $i; )
  then
    System.out.println( $i );
end
```

#### 议程评估过滤器

图示5.议程过滤器

drools在过滤器接口中支持AgendaFilter对象，在议程评估阶段，这个对象可以允许或者拒绝指定规则的评估。你可以指定一个议程过滤器作为fireAllRules方法调用的一部分。

下面的实例代码 只允许带有字符串"Test"结尾的规则被评估和执行。所有其他的规则都会被过滤器过滤掉。

议程过滤器的定义示例

```java
ksession.fireAllRules( new RuleNameEndsWithAgendaFilter( "Test" ) );
```
