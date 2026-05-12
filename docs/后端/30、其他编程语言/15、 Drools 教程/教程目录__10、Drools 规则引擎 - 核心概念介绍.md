# 10、Drools 规则引擎 - 核心概念介绍
- 来源：https://ddkk.com/zhuanlan/other/drools/1/10.html
- 分类：Drools 教程
- 分组：教程目录
## Drools规则引擎

Drools规则引擎可以对你定义的业务规则和决策模型进行存储，处理和求值。drools规则引擎的基础函数是将传入的数据，或者事实与规则情况相匹配，用来决定是否执行规则和如何执行规则。

Drools规则引擎使用下面的基础组件进行操作：

- 规则（**Rules**）：定义好的业务规则或者DMN决策。所有的规则都必须至少包含的启动规则的规则和操作。
- 事实（**Facts**）：Drools规则引擎里面输入与修改的数据，与Drools规则引擎将事实与规则相匹配。
- 生产内存（**Production memory**）：Drools规则引擎存储在本地的规则
- 工作内存（**Working memory**）：Drools规则引擎存储在本地的事实
- 议程（**Agenda**）：注册与排序（如果适用）激活的规则，用来为执行做准备的。

在Drools中，当业务用户或者自动化系统添加或者修改规则相关的信息，该信息将会以事实的形式插入到Drools的工作内存中。Drools规则引擎会把这些事实与生产内存中的规则条件进行匹配，匹配到合适的规则进行执行。（事实与规则匹配的过程是模式匹配的）当满足规则条件时，Drools规则引擎会激活并注册议程中的规则，然后Drools会对优先级和冲突规则进行排序，以备执行。

下面图表展示了Drools的基本组件：

图示1. Drools组件概览

规则的更多详细信息和例子，事实行为，请参见：

[https://docs.drools.org/8.40.0.Final/drools-docs/drools/rule-engine/index.html#inference-and-truth-maintenance_rule-engine](https://docs.drools.org/8.40.0.Final/drools-docs/drools/rule-engine/index.html#inference-and-truth-maintenance_rule-engine)

这些核心概念有助于你更好的理解其他高级组件，Drools的进程和子进程， 从而通过drools设计出更高效的业务素材。

### KIE会话

带drools中，kie会话存储和执行运行时数据，kie会话由kie库创建，如果你在kmodule中定义了kie会话，可以直接从kie容器中直接创建kie会话。

kmodule文件中配置kie会话例子

```java
<kmodule>
  ...
  <kbase>
    ...
    <ksession name="KSession2_1" type="stateless" default="true" clockType="realtime">
    ...
  </kbase>
  ...
</kmodule>
```

kie库是kmodule的定义仓库，包含drools中的所有，但是不包含运行时数据。

kmodule文件中配置kie库例子

```java
<kmodule>
  ...
  <kbase name="KBase2" default="false" eventProcessingMode="stream" equalsBehavior="equality" declarativeAgenda="enabled" packages="org.domain.pkg2, org.domain.pkg3" includes="KBase1">
    ...
  </kbase>
  ...
</kmodule>
```

kie会话可以是有状态的，也可以是无状态的。无状态的会话，来自会话先前调用的数据，会在会话调用之间被消除。在有状态会话中，该数据会被保留。kie会话的类型使用根据项目的需求，以及你想如何持久化来自不同素材调用的数据。

### 疑问

drools核心概念里面有一个**Agenda，**对于这个单词，我实在是不会翻译，之前的文章中也有这个单词，查询就是议程，意思是会议上议案讨论的程序；议事的执行流程。再看英文解释，类似于先决条件，就是执行前的准备流程，想来想去，最后还是就叫议程吧，希望有喜欢研究翻译的朋友，给这个单词一个相对准确的翻译，就是那种一看，就和咱们计界有点关系的那种翻译。
