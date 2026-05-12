# 11、Drools 规则引擎 - 无状态会话
- 来源：https://ddkk.com/zhuanlan/other/drools/1/11.html
- 分类：Drools 教程
- 分组：教程目录
#### 无状态kie会话

无状态的kie会话是不使用推理去迭代更新事实的会话。在无状态kie会话中，前一个被调用的kie会话中的数据会在会话调用之间失效，而有状态会话，会保留这个数据。无状态kie会话类似于函数，其结果只和kie库的内容和传进kie会话的数据决定。无状态kie会话没有任何之前传入kie会话数据的存储。

无状态kie会话通常用于下面的情况:

- 验证，比如验证某人是否有贷款的资格
- 计算，比如极端贷款保费
- 路由和过滤，比如将电子邮件分类或者发送电子邮件到目的地

举个例子，仔细思考下面驾照数据模型和例子的DRL文件：

驾照应用的数据模型

```java
public class Applicant {
  private String name;
  private int age;
  private boolean valid;
  // Getter and setter methods
}
```

驾照应用的DRL文件

```java
package com.company.license
rule "Is of valid age"
when
  $a : Applicant(age < 18)
then
  $a.setValid(false);
end
```

Isof valid age规则可以取消所有未满18周岁人的申请资格。当Applicant对象被插入到drools规则引擎的时候，drools会评估每条规则的约束并找到与插入对象匹配的规则。objectType约束是默认有的，但是你却看不到，所有展示出来的约束被评估之后，就会执行objectType约束。变量$a会绑定某个变量，这个变量会在规则的结果中引用匹配的对象。

> 刀乐符是可选的，有助于区分变量名和属性名

在这个例子中，示例规则和所有drools项目中其他resources文件夹下的文件，用下面的代码构建：

创建kie容器

```java
KieServices kieServices = KieServices.Factory.get();
KieContainer kContainer = kieServices.getKieClasspathContainer();
```

这个代码编译了所有类路径上的规则文件，并在KieContainer中添加了编译的结果——KieModule对象

最终，从kie容器中实例化无状态的kie会话对象，并执行指定数据。

实例化无状态kie会话并输入数据

```java
StatelessKieSession kSession = kContainer.newStatelessKieSession();
Applicant applicant = new Applicant("Mr John Smith", 16);
assertTrue(applicant.isValid());
ksession.execute(applicant);
assertFalse(applicant.isValid());
```

在kie无状态会话的配置中，execute方法的调用相当于一个组合方法的调用，这个组合方法包括实例化kiesession对象，添加所有的用户数据，执行用户命令，调用fireAllRules方法，然后调用dispose方法。因此，使用kie的无状态会话，不需要在会话调用之后再去调用fireAllRules方法或者调用dispose方法，而kie的有状态会话是需要调用这两个方法的。

在上面的例子里，指定申请者16岁，未满18岁，所以申请不通过。

下面的例子是一个更加复杂的用例，这个例子使用了无状态会话并且执行规则的对象是遍历对象的列表，比如集合。

驾照应用的扩展数据模型

```java
public class Applicant {
  private String name;
  private int age;
  // Getter and setter methods
}
public class Application {
  private Date dateApplied;
  private boolean valid;
  // Getter and setter methods
}
```

驾照应用的扩展DRL规则集

```java
package com.company.license
rule "Is of valid age"
when
  Applicant(age < 18)
  $a : Application()
then
  $a.setValid(false);
end
rule "Application was made this year"
when
  $a : Application(dateApplied > "01-jan-2009")
then
  $a.setValid(false);
end
```

扩展java源代码，用无状态会话遍历执行

```java
StatelessKieSession ksession = kbase.newStatelessKnowledgeSession();
Applicant applicant = new Applicant("Mr John Smith", 16);
Application application = new Application();
assertTrue(application.isValid());
ksession.execute(Arrays.asList(new Object[] { application, applicant }));  
assertFalse(application.isValid());
ksession.execute
  (CommandFactory.newInsertIterable(new Object[] { application, applicant }));  
List<Command> cmds = new ArrayList<Command>();  
cmds.add(CommandFactory.newInsert(new Person("Mr John Smith"), "mrSmith"));
cmds.add(CommandFactory.newInsert(new Person("Mr John Doe"), "mrDoe"));
BatchExecutionResults results = ksession.execute(CommandFactory.newBatchExecution(cmds));
assertEquals(new Person("Mr John Smith"), results.getValue("mrSmith"));
```

> 针对Array. asList（）方法生成的可迭代对象集合执行规则的方法。 在执行匹配规则之前插入集合中的每个元素。execute(Object object)方法和execute(Iterable objects)方法是封装的，增强了execute(Command command)方法，这个execute(Command command)是实现了BatchExecutor接口中的方法。
>
> 使用CommandFactory接口执行对象的可迭代集合。
>
> BatchExecator和Command dFactory配置，用于处理许多不同的命令或结果输出标识符。Command dFactory接口支持您可以在BatchExecator中使用的其他命令，例如StartProcess、Query和SetGlobal。

##### 无状态kie会话中的全局变量

StatelessKieSession对象支持全局变量（globals），这个全局变量可以被配置成为会话范围的全局变量，委托全局变量或者执行范围的全局变量。

- 会话范围的全局变量： 对于会话范围的全局变量，可以使用方法getGlobal返回一个Globals的实例，这个实例提供访问kie会话的全局变量。这些全局变量用于所有执行的调用。使用可变全局变量是要格外的小心，因为执行调用可以同时在不同线程中执行。

会话范围的全局变量

```java
import org.kie.api.runtime.StatelessKieSession;
StatelessKieSession ksession = kbase.newStatelessKieSession();
// Set a global myGlobal that can be used in the rules.
ksession.setGlobal("myGlobal", "I am a global");
// Execute while resolving the myGlobal identifier.
ksession.execute(collection);
```

- 委托全局变量：对于委托全局变量，你可以使用setGlobal（String，Object）进行赋值，这样让值存储在一个内部的map集合中。map中的标识符拥有比其他委托更高的优先级。如果在map中没有找到标识符，则使用全局委托（如果有）。
- 执行范围全局变量：对于执行范围的全局变量，你可以使用Command对象设置全局变量，这个命令传递给CommandExecutor接口为了执行指定的全局变量的解析。

CommandExecutor接口也能使你使用out标识符为全局变量，插入事实，和查询结果导出数据：

为全局变量，插入数据和查询结果的out标识符

```java
import org.kie.api.runtime.ExecutionResults;
// Set up a list of commands.
List cmds = new ArrayList();
cmds.add(CommandFactory.newSetGlobal("list1", new ArrayList(), true));
cmds.add(CommandFactory.newInsert(new Person("jon", 102), "person"));
cmds.add(CommandFactory.newQuery("Get People" "getPeople"));
// Execute the list.
ExecutionResults results = ksession.execute(CommandFactory.newBatchExecution(cmds));
// Retrieve the ArrayList.
results.getValue("list1");
// Retrieve the inserted Person fact.
results.getValue("person");
// Retrieve the query as a QueryResults instance.
results.getValue("Get People");
```
