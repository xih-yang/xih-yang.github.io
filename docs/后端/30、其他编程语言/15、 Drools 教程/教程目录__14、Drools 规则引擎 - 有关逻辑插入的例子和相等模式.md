# 14、Drools 规则引擎 - 有关逻辑插入的例子和相等模式
- 来源：https://ddkk.com/zhuanlan/other/drools/1/14.html
- 分类：Drools 教程
- 分组：教程目录
#### 政府身份证ID的例子

到目前为止，我们知道了什么是推断，并且有一个基本示例，这如何促进良好的规则设计和维护？

思考一下，政府的身份证号管理部门，当儿童成年时负责签发身份证。他们可能有一个像这样包括逻辑的决策表，当在伦敦居住满18年，或者超过18年时签发身份证：

RuleTable ID Card

CONDITION
CONDITION
ACTION

p : Person

location
age >= $1
issueIdCard($1)

Select Person
Select Adults
Issue ID Card

Issue ID Card to Adults
London
18

p

但是身份证部门并没有制定谁是成年人的政策。这个政策是在政府层面完成的。如果政府将这个年龄更改为21，这将启动一个变更的管理流程。某个人必须与身份证部门联系，确保他们的系统更新，及时让法律生效。

这个更改管理流程和部门之间的通信这种情况来说并不理想，并且更改成为成本高和容易出错的事情，此外，身份证管理部门管理了更多的信息，有一些信息本身是不需要身份证管理部分管理的，这样就会更容易的泄露一些信息。意思是，系统根本就不关心年龄大于18这样明确的信息，而是只关心是否是成年人就行。

与此相反，让我们使用一种责任分离的方法，以便政府和身份证部分可以维护他们自己的规则。

决定谁是成年人是政府的工作，如果他们更改法律，他们只需要臫新规则更新他们的中间仓库：

RuleTable Age Policy

CONDITION
ACTION

p : Person

age >= $1
insert($1)

Adult Age Policy
Add Adult Relation

Infer Adult
18
new IsAdult( p )

如之前讨论的那样，IsAdult事实是从政策规则推断来的。IsAdult封装了一条看似随意的逻辑“age>=18”，并且提供了IsAdult的抽象含义。现在，如果有部门使用上述规则，他们不再需要知道是否某人是成年人这样明确的信息，他们仅仅使用推断事实：

RuleTable ID Card

CONDITION
CONDITION
ACTION

p : Person
isAdult

location
person == $1
issueIdCard($1)

Select Person
Select Adults
Issue ID Card

Issue ID Card to Adults
London
p
p

虽然例子是非常小并且琐碎的，但是阐述了一些重要的点。我们从单一的，漏洞百出的只是工程方法开始。我们创建了一个单独的决策表，这个决策表包含所有的可能信息，并且从政府泄露了身份证部门不关心也不想管理的信息。

我们首先解除了支持过程中的耦合，所以每个部门只需要对他们需要知道的东西负责。然后使用推断事实IsAdult封装了这个泄露的知识。术语IsAdult的使用也对之前很随意的逻辑"age>=18"进行了抽象。

因此，在进行知识工程时，一般的经验法则是：

不好的方面

- 整体化
- 泄露

好的方面

- 知识职责解耦
- 封装知识
- 对封装提供语义抽象

#### Drools规则引擎中的事实相等模式

规则引擎支持下面的事实相等模式，这个相等模式决定规则引擎如何去存储和比较插入的事实：

- 标识符（默认）：规则引擎用IdentityHashMap存储所有插入的事实。对于每一个新插入的事实，规则引擎会返回一个新的FactHandle对象。如果事实被再次插入，规则引擎会返回旧的FactHandle对象，，忽略对于相同事实的重复插入。在这种模式下，两个事实是否相等，只看他们是否是相同的对象并且拥有相同的标识符。
- 等于：规则引擎使用HashMap存储所有插入的事实。只有当插入的事实和所有已经存在的事实都不相等的时候，引擎才会返回一个新的FactHandle对象，是否相等需要根据插入事实的equals方法来决定。在这个模式下，对于规则引擎来说，如果两个事实以相同的方式组成，无论标识符是否相等，都是相同的事实。当你想要对象基于相等功能插入，而不是明确的标识插入，可以使用这个模式。

作为事实相等模式的说明，请考虑以下示例事实：

实例事实

```java
Person p1 = new Person("John", 45); 
Person p2 = new Person("John", 45);
```

在标识符模式下，事实p1和p2是Person类的不同实例，被作为不同的对象对待，因为他们有各自的标识符。在相等模式下，事实p1和p2是被作为相同对象对待的，因为他们里面的内容是一样的。这种行为上的区别，会影响你和事实处理器的交互。

举个例子，假设你在规则引擎中插入了事实p1和p2，然后你想要为p1检索事实处理器。在标识符模式下，你必须指定p1,才能精确的返回对应的事实处理。而在等于模式下，你可以指定p1,p2甚至new Person("John",45)，都可以返回事实处理器。

插入事实，并在标识符模式下返回实时处理器的例子

```java
ksession.insert(p1); 
ksession.getFactHandle(p1);
```

插入事实，在等于模式下返回处理器的例子

```java
ksession.insert(p1); 
ksession.getFactHandle(p1); 
// Alternate option: 
ksession.getFactHandle(new Person("John", 45));
```

设置成事实相等模式，使用下面选项中的一个：

- 将系统属性drools.equalityBehavior设置成identity（默认）或者equlity
- 当写代码创建Kie base时，设置成equality模式

```java
KieServices ks = KieServices.get(); 
KieBaseConfiguration kieBaseConf = ks.newKieBaseConfiguration(); kieBaseConf.setOption(EqualityBehaviorOption.EQUALITY); 
KieBase kieBase = kieContainer.newKieBase(kieBaseConf);
```

- 在kmodule文件中的kbase标签属性中设置equality模式

```java
<kmodule>
  ...
  <kbase name="KBase2" default="false" equalsBehavior="equality" packages="org.domain.pkg2, org.domain.pkg3" includes="KBase1">
    ...
  </kbase>
  ...
</kmodule>
```
