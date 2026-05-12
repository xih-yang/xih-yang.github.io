# 03、Drools 规则引擎 - 入门（下）测试和评估
- 来源：https://ddkk.com/zhuanlan/other/drools/1/3.html
- 分类：Drools 教程
- 分组：教程目录
因为篇幅原因，所以分为上下两个部分，主要就是通过一个交通违章项目的例子，带你先粗略感受一下决策模型的使用流程，总体来说有详细，也有没说清的地方，如果想要了解一下决策模型，可以进来了解一下。

#### 测试场景

Drools中的测试场景使您能够在将业务规则和业务规则数据（用于基于规则的测试场景）或DMN模型（用于基于DMN的测试方案）部署到生产环境之前验证它们的功能。 在测试场景中，您可以使用项目中的数据，基于定义好的业务规则设置给定条件和期望结果。当你运行场景的时候，规则实例的期望结果和实际结果会进行比较。如果期望结果和实际结果匹配，则测试成功。如果期望结果和实际结果没有匹配，则测试失败。

你可以用很多种方式运行定义好的测试场景，例如：你可以在项目层次或者内部一个指定测试场景素材中运行可获得的测试场景。特使场景是独立的并且不会影响和修改其他的测试场景。你可以在使用Drools开发项目的任何时间运行测试场景。

你可以将不同包里的数据对象导入到与测试场景相同的项目包里。在同一个包里的素材是被默认导入的。在你创建了需要的数据对象与测试场景之后，你可以使用测试场景设计器的Data Objects tab页去验证，是否列出了所有必需有的数据对象，或者通过添加一个新项目导入其他已经存在的数据对象。

##### 使用测试场景测试交通违章

使用测试场景设计器去测试DMN决策模型需要DRDs，并定义交通违章项目的决策逻辑。

图示12.交通违章的测试场景实例

先决条件

你已经成功的使用Drools构建了交通违章项目

过程

**1、** 在IDE中新建一个测试场景；

a.在测试场景属性里输入 Violation Scenarios。

b.在包列表中，选择com.myspace.traffic_violation.

c.选择DMN作为Source type

d.从Choosen a DMN asset列表里，选择DMN素材的路径

e.单击OK，打开在Test Scenarios设计器里面的Violation Scenarios测试场景。

**2、** 在列Driver下，右键单击State,City,Age和Name单元格并选择Deletecolumn，从上下文菜单选项中删除它们；

**3、** 在列Violation下，右键单击Date和Code单元格并选择Deletecolumn，从上下文菜单选项中删除它们；

**4、** 在测试场景中的第一行输入下列信息：；

- 场景描述：Above speed limit:10km/h and 30km/h
- Points（在列Given下）：10
- Type:speed
- Speed Limit:100
- Actual Speed:120
- Points:3
- Amount:500
- Should the driver be suspended?:No

右键第一行选择Insert row below添加另一行。

**5、** 在测试场景中的第二行输入下列信息：；

- 场景描述：Above speed limit:10km/h and 30km/h
- Points（在列Given下）：10
- Type:speed
- Speed Limit:100
- Actual Speed:150
- Points:7
- Amount:1000
- Should the driver be suspended?:No

右键第二行选择Insert row below添加另一行。

**6、** 在测试场景中的第三行输入下列信息：；

- 场景描述：Parking violation
- Points（在列Given下）：10
- Type:parking
- Speed Limit:
- Actual Speed:
- Points:1
- Amount:100
- Should the driver be suspended?:No

右键第三行选择Insert row below添加另一行。

**7、** 在测试场景中的第四行输入下列信息：；

- 场景描述：DUI violation
- Points（在列Given下）：10
- Type:driving under the influence
- Speed Limit:
- Actual Speed:
- Points:5
- Amount:1000
- Should the driver be suspended?:No

右键第四行选择Insert row below添加另一行。

**8、** 在测试场景中的第五行输入下列信息：；

- 场景描述：Driver suspended
- Points（在列Given下）：15
- Type:speed
- Speed Limit:100
- Actual Speed:140
- Points:7
- Amount:1000
- Should the driver be suspended?:Yes

**9、** 单击Save；

**10、** 单击Play![ ][nbsp2]图标检测测试场景是否通过；

图示13.测试场景对于交通违章例子的执行结果。

如果失败，就修改错误然后再次运行测试场景。

#### 用Drools评价交通违法DMN模型

评估交通违规DMN模型所遵循的说明，取决于从先决条件中选择的部署平台。

根据部署平台评估DMN模型的详细信息，请参见：https://docs.drools.org/8.40.0.Final/drools-docs/drools/getting-started/index.html#dmn-execution-con_dmn-models

##### 例子：DroolsDMN引擎作为嵌入类库使用

之后的例子里假设Drools DMN引擎是被作为嵌入类库使用，例子都是在给出的部署平台中使用。

交通违章的DMN模型的源代码和单元测试代码，在生成Maven元模型时可用。

用下面的命令创建一个项目。

```java
mvn archetype:generate -DarchetypeGroupId=org.kie -DarchetypeArtifactId=kie-drools-dmn-archetype -DarchetypeVersion=8.40.0.Final
```

在命令执行期间，输入项目的属性值。

现在，你的第一个规则项目建好了，让我们进到项目里面去查看一下。

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

首先是Pom文件。

他们是使用DroolsDMN引擎作为嵌入类库必须依赖的jar包。

原型包含src/main/resources/Traffic Violation.DMN文件作为示例，在前面的小节中详细描述了该文件。

最终，src/test/java/org/example/TrafficViolationTest.java是评估DMN模型的测试用例，你可以学习在自己的应用中使用简单的API。

```java
Map<String, ?> driver = of("Points", 2);
Map<String, ?> violation = of("Type", "speed", "Actual Speed", 120, "Speed Limit", 100);
DMNContext dmnContext = dmnRuntime.newContext();
dmnContext.set("Driver", driver);
dmnContext.set("Violation", violation);
```

在DMN模型中为Driver和Violation输入节点，创建一个带一些测试数据例子的DMNContext；或者，你可以提供你自己的Pojos。

```java
LOG.info("Evaluating DMN model");
DMNResult dmnResult = dmnRuntime.evaluateAll(dmnModelUT, dmnContext);
```

使用在DMNContext的实际测试数据评估交通违章的DMN模型。

```java
LOG.info("Checking results: {}", dmnResult);
assertFalse(dmnResult.hasErrors());
```

检查评估Traffic_Violation DMN模型时未报告错误。

```java
assertEquals(DecisionEvaluationStatus.SUCCEEDED, dmnResult.getDecisionResultByName("Should the driver be suspended?").getEvaluationStatus());
assertEquals("No", dmnResult.getDecisionResultByName("Should the driver be suspended?").getResult());
```

检查最终决策Should the driver be suspended?的结果是字符串No。让我们运行一下mvn clean verify。

```java
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running org.example.TrafficViolationTest
2022-08-29 16:11:44,539 [main] INFO  Evaluating DMN model
2022-08-29 16:11:44,540 [main] INFO  Checking results: DMNResultImpl{context={
    Driver: {
        Points: 2
    }
    Violation: {
        Type: speed
        Speed Limit: 100
        Actual Speed: 120
    }
    Fine: {
        Points: 3
        Amount: 500
    }
    Should the driver be suspended?: No
}
, messages=org.kie.dmn.core.util.DefaultDMNMessagesManager@4f89331f}
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.001 s - in org.example.TrafficViolationTest
```

通过修改存在的DMN模型或者创建全新的DMN模型，可以随意的使用此原型生成的项目作为基础。这个原型也包括使用SecSim工具的更高级的测试用例。

##### 样例：Kogito作为部署平台

下面的样例假设选择了Kogito作为部署平台。

交通违章例子的源代码和详细运行介绍可以从Kogito上面获得：https://github.com/kiegroup/kogito-examples/tree/stable/kogito-quarkus-examples/dmn-quarkus-example

过程

**1、** 决定访问RESTAPI端点的基础URL，这个请求需要知道下面的这些值：（以默认的本地部署为例）；

- HOST（localhost）
- Port（8080）
- Rest path（没有指定）

**2、** 交通违法项目的本地部署中的示例基本URL：http://localhost:8080/TrafficViolation；

**3、** 确定用户的身份验证需求；

**4、** 如果Kogito的用户和角色配置是在Quarkus应用上，HTTP基础身份验证可能需要用户名和密码成功的请求需要用户已经被配置的角色；

**5、** 下面的例子演示了如何其去添加证书到一个curl请求上：；

```java
curl -u username:password <request>
```

如果在Quarkus应用上的Kogito配置有Red Hat Single Sign-On，请求中必须包含token

```java
curl -H "Authorization: bearer $TOKEN" <request>
```

执行DMN模型

**[POST]**`Traffic%20Violation`

请求curl示例：

```java
curl -L -X POST 'localhost:8080/Traffic Violation' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
--data-raw '{
    "Driver": {
        "Points": 2
    },
    "Violation": {
        "Type": "speed",
        "Actual Speed": 120,
        "Speed Limit": 100
    }
}'
```

请求JSON示例：

```java
{
    "Driver": {
        "Points": 2
    },
    "Violation": {
        "Type": "speed",
        "Actual Speed": 120,
        "Speed Limit": 100
    }
}
```

响应JSON示例：

```java
{
    "Driver": {
        "Points": 2
    },
    "Violation": {
        "Type": "speed",
        "Actual Speed": 120,
        "Speed Limit": 100
    },
    "Fine": {
        "Points": 3,
        "Amount": 500
    },
    "Should the driver be suspended?": "No"
}
```
