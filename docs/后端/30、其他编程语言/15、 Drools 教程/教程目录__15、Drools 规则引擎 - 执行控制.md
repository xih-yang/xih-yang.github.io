# 15、Drools 规则引擎 - 执行控制
- 来源：https://ddkk.com/zhuanlan/other/drools/1/15.html
- 分类：Drools 教程
- 分组：教程目录
### Drools的执行控制

当新的规则数据进入Drools的工作内存时，规则就有可能被完全匹配并执行。单个工作内容操作可能导致多个规则的执行。当规则被完全匹配时，Drools会创建一个引用规则和匹配的事实的内部匹配实例，并将这个实例放到Drools的议程中。议程使用冲突解决策略控制着规则内部匹配的执行顺序。

在调用fireAllRule方法之后，drools会重复执行下面两个阶段：

议程评估。在这个阶段，drools选择所有可以被执行的规则。如果没有可执行规则存在，则执行周期结束。如果执行规则被发现，drools在议程中注册一个内部匹配，然后将这个内部匹配转移到工作内存操作阶段去执行规则结果操作。

工作内存操作。在这个阶段，drools对所有在议程中之前注册的激活规则执行规则结果操作（每条规则then后面的部分）。所有的操作完成，或者java应用再次调用fireAllRules之后，drools会返回到议程评估阶段重新评估规则。

图示4. drools执行的两个阶段

当议程上存在多条规则时，一条规则的执行可能会导致议程长的另一条规则被移除。为了防止这件事情发生，你可以定义drools上的规则如何以及何时执行。定义规则执行顺序的常用方法是通过使用规则优先级，议程组，或者内部匹配组。

#### 规则的优先级

每一条规则都有一个salience属性，这个属性可以决定规则的执行顺序。在内部匹配队里里面，优先级越高的规则，执行顺序越靠前。默认的优先级的值是0，优先级的值可以是正数，也可以是负数。

举例来说，drools堆栈中按展示顺序列出了下面的DRL规则示例

```java
rule "RuleA"
salience 95
when
    $fact : MyFact( field1 == true )
then
    System.out.println("Rule2 : " + $fact);
    update($fact);
end
rule "RuleB"
salience 100
when
   $fact : MyFact( field1 == false )
then
   System.out.println("Rule1 : " + $fact);
   $fact.setField1(true);
   update($fact);
end
```

RuleB规则是列表中的第二条规则，但是他比ruleA的优先级要高，因此会先执行ruleB。

#### 规则的议程组

议程组，就是有相同agenda-group属性的一组规则集合。议程组在议程上将规则分开。在任何一个时间，只能有一组成为焦点，这组成为焦点的议程组会优先执行，通过调用setFocus方法决定焦点议程组。也可以使用auto-focus属性定义规则，这样，在下一次激活规则时，有这个属性的规则，会让其所在的议程组自动成为焦点。

每次setFocus方法被调用，drools会在堆栈头添加指定的议程组。默认的议程组“MAIN”包含所有没有指定议程组的规则，除非其他议程组有焦点，否则这个默认议程组会第一个执行。

例如：下面的示例DRL规则属于指定议程组，并在drools堆栈中按顺序列出：

银行应用的示例DRL规则

```java
rule "Increase balance for credits"
  agenda-group "calculation"
when
  ap : AccountPeriod()
  acc : Account( $accountNo : accountNo )
  CashFlow( type == CREDIT,
            accountNo == $accountNo,
            date >= ap.start && <= ap.end,
            $amount : amount )
then
  acc.balance  += $amount;
end
```

```java
rule "Print balance for AccountPeriod"
  agenda-group "report"
when
  ap : AccountPeriod()
  acc : Account()
then
  System.out.println( acc.accountNo +
                      " : " + acc.balance );
end
```

对于这个例子来说，report议程组的规则必须总是第一个执行，calculation议程组的规则必须是第二个执行，然后执行其余议程组的剩余规则。因此，在其他规则执行之前，report和calculation组必须按顺序接收焦点：

设置议程组执行顺序的焦点

```java
Agenda agenda = ksession.getAgenda();
agenda.getAgendaGroup( "report" ).setFocus();
agenda.getAgendaGroup( "calculation" ).setFocus();
ksession.fireAllRules();
```

也可以通过clear()方法取消议程组的的执行。

```java
ksession.getAgenda().getAgendaGroup( "Group A" ).clear();
```

#### 规则激活组

内部匹配组是一组规则，这一组规则拥有相同的actibation-group规则属性。在这组里，只能有一条规则被执行。当这个组里面的某条规则满足条件并执行之后，这个组里的所有其他挂起的规则会被从议程中移除。

例如，下面这个示例DRL规则属于指定的内部匹配组，并像下面展示的顺序排列在drools堆栈中：

银行示例DRL规则

```java
rule "Print balance for AccountPeriod1"
  activation-group "report"
when
  ap : AccountPeriod1()
  acc : Account()
then
  System.out.println( acc.accountNo +
                      " : " + acc.balance );
end
```

```java
rule "Print balance for AccountPeriod2"
  activation-group "report"
when
  ap : AccountPeriod2()
  acc : Account()
then
  System.out.println( acc.accountNo +
                      " : " + acc.balance );
end
```

这个例子里，如果report内部匹配组的第一条规则被执行了，则组内的第二条规则和议程上的其他规则都会被移出议程。
