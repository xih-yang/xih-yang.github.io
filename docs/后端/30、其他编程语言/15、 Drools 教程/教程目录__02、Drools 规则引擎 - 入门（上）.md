# 02、Drools 规则引擎 - 入门（上）
- 来源：https://ddkk.com/zhuanlan/other/drools/1/2.html
- 分类：Drools 教程
- 分组：教程目录
### 第一个规则项目

这篇指导将带你走过创建一个简单Drools应用项目的过程。

#### 需要的工具

JDK11+环境配置

版本3.8.6+的maven

可选，一个代码编辑器，可以是IDEA，VSCode或者Eclipse

#### 用maven原型创建一个项目

用下面的命令创建一个项目

mvnarchetype:generate -DarchetypeGroupId=org.kie -DarchetypeArtifactId=kie-drools-exec-model-ruleunit-archetype -DarchetypeVersion=8.40.0.Final

在命令执行期间，输入项目的属性值

```java
Define value for property 'groupId': org.example
Define value for property 'artifactId': my-project
Define value for property 'version' 1.0-SNAPSHOT: :
Define value for property 'package' org.example: :
...
 Y: : Y
...
[INFO] BUILD SUCCESS
```

现在，你的第一个规则项目建好了，让我们进到项目里面去查看一下。

首先，是pom文件

```java
<dependency>
   <groupId>org.drools</groupId>
   <artifactId>drools-ruleunits-engine</artifactId>
</dependency>
```

对于单元规则用例来说，这是一个必须的依赖。

> 你可以继续使用传统的drools7风格的规则而不是单元规则。
>
> 这个用例里面，使用kie-drools-exec-model-archetype。

原型包含一个DRL文件，如下面的例子所示：

```java
package org.example;
unit MeasurementUnit;
rule "will execute per each Measurement having ID color"
when
        /measurements[ id == "color", $colorVal : val ]
then
        controlSet.add($colorVal);
end
query FindColor
    $m: /measurements[ id == "color" ]
end
```

这个规则检测传入的Measurement数据，并且当其实颜色信息时，将其值存储在一个全局变量controlSet中 。when的部分实现了模式匹配，then的部分实现了当条件成立时的行为。

下一步，找到src/main/java/org/example/MeasurementUnit.java 该类详细说明了规则里面的单元MeasurementUnit。这个被叫做规则单元，用于对数据源，全局变量和DRL规则进行分组。

```java
public class MeasurementUnit implements RuleUnitData {
    private final DataStore<Measurement> measurements;
    private final Set<String> controlSet = new HashSet<>();
    ...
```

规则文件rules.drl中的/measurements是绑定到MeasurementUnit中的mensurements属性的字段。所以你知道输入的数据类型是Measurement。这个类也被定义为全局变量controlSet。

然后，src/main/java/org/example/Measurement.java 是规则里面的一个java bean的类。这样的对象被称作Fact。

最后，src/test/java/org/example/Measurement.java是执行规则的测试用例。你可以学习在自己的应用中使用简单的API。

```java
MeasurementUnit measurementUnit = new MeasurementUnit();
RuleUnitInstance<MeasurementUnit> instance = RuleUnitProvider.get().createRuleUnitInstance(measurementUnit);
```

创建一个Measurement实例，然后用RuleUnitProvider创建一个带有Measurement实例的RuleUnitInstance。

```java
measurementUnit.getMeasurements().add(new Measurement("color", "red"));
measurementUnit.getMeasurements().add(new Measurement("color", "green"));
measurementUnit.getMeasurements().add(new Measurement("color", "blue"));
```

在measurementUnit.measurements添加Measurement facts。这意味着facts被插入到了Drools规则引擎。

```java
List<Measurement> queryResult = instance.executeQuery("FindColor").stream().map(tuple -> (Measurement) tuple.get("$m")).collect(toList());
```

执行一个叫做FindColor的查询。当你执行一个查询，将自动启动与插入的facts匹配的规则。如果你指向启动规则，不需要查询，你可以直接调用Instance.fire()。

```java
instance.close();
```

在最后，调用close方法释放RuleUnitInstance所持有的资源。

让我们用mvm clean test命令去运行一下测试程序。

> [INFO] ------------------------------------------------------- [INFO] T E S T S [INFO] ------------------------------------------------------- [INFO] Running org.example.RuleTest 2022-06-13 12:49:56,499 [main] INFO Creating RuleUnit 2022-06-13 12:49:56,696 [main] INFO Insert data 2022-06-13 12:49:56,700 [main] INFO Run query. Rules are also fired [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.411 s - in org.example.RuleTest

现在你可以添加自己的规则和facts到项目里面去了。

> 规则项目需要在通过mvn编译阶段生成代码。如果你直接在IDE里面运行RuleTest.java，你可能需要先运行一下mvn compile命令。

### Drools中的角色服务入门

作为一个业务规则的开发者，你可以使用Drools设计各种各样的决策服务。这篇文章基于 从Kogito Examples GitHub repository（https://github.com/kiegroup/kogito-examples/tree/stable/kogito-quarkus-examples/dmn-quarkus-example）获得的**Traffic_Violation样例工程**描述了如何去创建并测试一个交通违章的例子。这个样例项目使用决策模型去定义司机在交通违章中的处罚。你可以根据本文档的步骤去建立一个项目和其包含的文件等，或者打开查看已经创建好的**Traffic_Violation**的示例项目。或者，你可以直接跳到项目评估部分，方法是从上面的连接中本地查看现成的Traffic_Violation示例项目，然后跳到 Evaluating the traffic violations DMN model with Drools（使用Drools评估交通违法DMN模型）（地址：https://docs.drools.org/8.40.0.Final/drools-docs/drools/getting-started/index.html#gs-evaluating-dmn_getting-started-decision-services）部分。

为了得到更多Drools中DMN模块和实现的信息，可以参考DMN Engine in Drools section（https://docs.drools.org/8.40.0.Final/drools-docs/drools/getting-started/index.html#dmn-con_dmn-models）.

先决条件

- 有一个明确的部署平台。例如使用drools所谓java的依赖，或者使用在云原生平台上使用Kogito。
- 满足部署平台的先决条件。
- 在遵循被教程的同时，考虑部署平台的部署过程。

#### 从头开始创建交通违法项目

在IDE中创建一个名为traffic-violation的项目。该项目包含很多素材，例如数据对象，DMN素材，和测试方案。你创建的样例工程和已经存在的**Traffic_Violation**样例工程，是相似的**。**

根据你使用的IDE和下面的介绍，创建一个基于mavne的KJAR项目。

#### 决策模型

决策模型是由OMG为了描述和建模而建立的一套标准。DMN定义了一套XML的模型，该模式可以让DMN模型在符合DMN模式的平台之间甚至跨越组织去分享，以便让业务分析师和业务规则开发人员在设计与实现DMN决策服务时进行合作。DMN标准和为了设计与建立业务模型过程的BPMN标准相似的标准，并且能够一起使用。

想要获取更多关于DMN背景和应用的信息，请看 Drools DMN landing page

（https://www.drools.org/learn/dmn.html）.

##### 创建交通违法的DMN决策需求图

决策需求图是你的DMN模型的视觉表示。使用KIE DMN便捷器去为交通违法项目设计决策需求图，并且决策需求图组件的决策逻辑。

图示1.交通违法示例的DRD

先决条件

你已经用Drools建立了一个交通违法项目。

过程

**1、** 在交通违法项目的首页，点击添加Asset；

**2、** 在AddAsset页面，点击DMN创建新的DMN窗口会被打开a.在创建新DMN窗口中，在DMN的name属性里面输入TrafficViolation.b.从Package列表里面，选择com.myspace.traffic_violation.c.点击OKDMN设计器里面的DMN素材就会被打开；

**3、** 在DMN设计板上，拖两个DMN输入数据点到画布上![ ][nbsp2]图示2.DMN输入数据点；

**4、** 在右上角点击编辑![ ][nbsp3]icon；

**5、** 双击输入点并且对其中一个重命名为Driver，另一个重命名为Violation；

**6、** 拖一个DMNDecision决策点到画布上；

**7、** 双击决策节点并且重命名为Fine；

**8、** 点击Violation输入节点，选择CreateDMNInformationRequirement图标，并且点击Fine决策节点去连接这两个节点![ ][nbsp4]图示3.CreateDMNInformationRequirement图标；

**9、** 拖一个DMNDecision决策节点到画布上；

**10、** 双击决策节点，重命名为Shouldthedriverbesuspended？；

**11、** 点击Driver输入节点，选择**CreateDMNInformationRequirement**图标连接**Shouldthedriverbesuspended?决策节点；

12、** 点击Fine决策节点，选择CreateDMNInformationRequirement图标，选择**Shouldthedriverbesuspended?**决策节点；

**13、** 点击保存；

> 注意：当你定期地保存DRD时，DMN设计者会对DMN模型进行验证，并且在模型完全定义之前，可能会产生错误的信息。在你完成DMN定义之后，如果还有错误，需要对指定的问题进行故障排除。

##### 创建交通违章DMN自定义数据类型

DMN数据类型决定了在DMN装箱表达式中的表、列或字段中用于定义决策逻辑的数据的结构。你可以使用默认的数据类型（像String，Number或者Boolean），也可以使用自定义的数据类型，去指定你想实现装箱表达式值的属性和约束。使用KIE DMN编辑器的数据类型Tab为交通违章项目，定义自定义数据类型。

图示4.自定义数据类型tab

创建下面的表列表tDriver，tViolation和tFine自定义数据类型.

Name
Type

tDriver
Structure

Name
string

Age
number

State
string

City
string

Points
number

Name
Type

tViolation
Structure

Code
string

Date
date

Type
string

Speed Limit
number

Actual Speed
number

Name
Type

tFine
Structure

Amount
number

Points

number

先决条件：

你用KIE DMN编辑器创建了交通违章DMN决策需求表

过程

**1、** 创建自定义数据tDriver，在DataTypestab页里点击AddacustomDataType，在name属性栏里输入tDriver，在Type列表里面选择Structure；

**2、** 单击NewDataType右侧的复选框来保存你的更改；

**3、** 通过点击tDriver旁边的加号，添加下列属性到tDriver数据结构中点击每一个新数据类型右侧的复合按钮保存更改；

Name（string）

Age（number）

State（string）

City（string）

Points（number）

**4、** 创建自定义数据tViolation，点击NewDataType，在Name属性中输入tViolation，在Type列表里面选择Structure；

图示6. 自定义数据类型tViolation

**6、** 通过点击tViolation旁边的加号，添加下列属性到tViolation数据结构中点击每一个新数据类型右侧的复合按钮保存更改；

Code（string）

Date（date）

Type（string）

Speed Limit（number）

Actual Speed（number）

**7、** 在嵌套数据类型Type里添加下列约束，点击编辑图标，点击添加约束，在**Selectconstrainttype**下拉菜单里选择**Enumeration**；

Speed

Parking

Driving under the influence

**8、** 点击OK，然后点击Type数据类型右侧的复选框保存你的修改；

**9、** 创建自定义数据tFine，点击NewDataType，在Name属性中输入tFine，在Type列表里面选择Structure,点击保存；

图示7. 自定义数据类型tFine

**10、** 通过点击tFine旁边的加号，添加下列属性到tFine数据结构中点击每一个新数据类型右侧的复合按钮保存更改；

Amount（number）

Points（number）

**11、** 点击Save；

##### 为DRD的输入和决策节点分配自定义数据类型

在创建DMN自定义数据类型之后，将这些自定义数据分配给交通违章DRD里面的DMN输入节点和DMN决策节点。

先决条件：

在KIE DMN编辑器里面已经创建了交通违章DMN自定义数据类型。

过程：

**1、** 单击DMN设计者的Model菜单的tab页，单击DMN设计者的右上角的属性图标，导出DRD的属性；

**2、** 在DRD中，选择Driver输入节点并且在**Properties**面板的数据类型下拉菜单里面选择tDriver；

**3、** 选择Violation输入节点并且在**Properties**面板的数据类型下拉菜单里面选择tViolation；

**4、** 选择Fine输入节点并且在**Properties**面板的数据类型下拉菜单里面选择tFine；

**5、** 选择**Shouldthedriverbesuspended?**决策节点并且设置如下属性；

**1、** 数据类型：string；

**2、** 问题：Shouldthedriverbesuspendedduetopointsonhisdriverlicense?；

**3、** 允许的回答：Yes,No；

**6、** 单击保存；

至此，你已经将自定义数据类型分配给了DRD的输入和决策节点。

##### 定义交通违章DMN的决策逻辑

计算罚款和决定是否没收驾照，你可以用DMN决策表和上下文的装箱表达式去定义交通文章的DMN决策逻辑。

图示8罚款表达式

图示9司机是否被没收驾照表达式

先决条件

已经用KIE DMN编辑器将DMN的自定义数据类型分配给了交通违章DRD中的合适的决策和输入节点。

过程

**1、** 计算罚款，在DMN设计者画布中，选择Fine决策节点，单击边界图标打开DMN装箱表达式的设计器；

图示10 决策节点的编辑图标

**2、** 单击**Selectexpression**->**DecisionTable**；

图示11 选择Decisiong Table的逻辑类型

**3、** 对于Violaation的Date，Violation的Code和Violation的Speedlimit列，右击并选择删除；

**4、** 单击Violation的ActualSpeed列并且在表达式属性中输入表达式Violation.ActualSpeed-Violation.SpeedLimit；

**5、** 在决策表的第一行中输入下列值；

Violation.Type:"speed"

Violation.Actual Speed - Violation.Speed Limit:[10..30)

Amount:500

Points:3

右击第一行并选择Insert below添加另外一行。

**6、** 在第二行输入下列值；

Violation.Type:"speed"

Violation.Actual Speed - Violation.Speed Limit:>=30

Amount:1000

Points:7

右击第二行并选择Insert below添加另外一行。

**7、** 在第三行输入下列值；

Violation.Type:"parking"

Violation.Actual Speed - Violation.Speed Limit:-

Amount:100

Points:1

右击第三行并选择Insert below添加另外一行。

**8、** 在第四行输入下列值；

Violation.Type:"driving under the influence"

Violation.Actual Speed - Violation.Speed Limit:-

Amount:1000

Points:5

**9、** 单击Save；

**10、** 定义没收驾照规则，返回DMN设计器画布，选择**Shouldthedriverbesuspended?**决策节点，单击编辑图标打开DMN装箱表达式设计器；

**11、** 单击Selectexpression->Context.；

**12、** 单击ContextEntry-1，输入TotalPoints作为name，从数据类型的下拉菜单里选择number；

**13、** 单击TotalPoints旁边的单元格，从上下文菜单选择Literalexperssion，输入Driver.Points+Fine.Points作为表达式；

**14、** 单击**Driver.Points+Fine.Points**的下一格，在上下文菜单选择LiteralExperssion，输入ifTotalPoints>=20then"Yes"else"No"；

**15、** 点击保存；

至此，你已经定义了如何罚款和决策何时没收司机驾照的决策上下文。你可以导航到交通违章项目页面，点击Build按钮构建例子项目，并解决记录在警告面板中的错误。
