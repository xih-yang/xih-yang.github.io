# 06、JMeter 实战 - 元件的作用域与执行顺序
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/6.html
- 分类：开发工具
- 分组：教程目录
jmeter是一个开源的性能测试工具，它可以通过鼠标拖拽来随意改变元件之间的顺序以及元件的父子关系，那么随着它们的顺序和所在的域不同，它们在执行的时候，也会有很多不同。

jmeter的test plan通过图形化的方式表达脚本，域代码方式的脚本不同，图形方式表达的脚本中无法使用变量和函数等描述元件的作用域，因此jmeter主要依靠test plan中元件的相对位置、

父子关系以及元件本身的类型来决定test plan中各元件的执行顺序；原件在test plan中的位置不同，可能导致该元件的行为有很大差异。（新版jmeter都可以自主选择语言，对号入座即可）

**1、元件的作用域**

jmeter中共有8类可被执行的元件（test plan和thread group不属于元件），其中，sampler（取样器）是不与其他元件发生交互的作用的元件，Logic Controller

（逻辑控制器）只对其子节点的sampler有效，而其他元件需要与sampler等元件交互。

**Config Elements（配置元件）：** 影响其范围内的所有元件

**Pre-porcessors（前置处理器）：** 在其作用范围内的每一个sampler元件之前执行

**Timer（定时器）：** 对其作用范围内的每一个sampler有效

**Post-porcessors（后置处理器）：** 在其作用范围内的每一个sampler元件之后执行

**Assirtions（断言）：** 对其作用范围内的每一个sampler元件执行后的结果执行校验

**Listener（监听器）：** 收集其作用范围内的每一个sampler元件的信息并且呈现出来

在jmeter中，元件的作用域是靠test plan的树形结构中元件的父子关系来确定的，其原则如下：

**1）** sampler不与其他元件相互作用，因此不存在作用域问题

**2）** Logic Controller只对其子节点中的sampler和Logic Controller作用

**3）** 除sampler和Logic Controller外的其他元件，如果是某个sampler的子节点，则该元件仅对其父节点作用

**4）** 除sampler和Logic Controller外的其他元件，如果其父节点不是sampler，则其作用域是该元件父节点下的其他所有后带节点（包括子节点，子节点的子节点等）

**2、元件的执行顺序**

在同一作用域范围内，test plan中的元件按照以下顺序执行：

1） **Config Elements**

2） **Pre-porcessors**

3） **Timer**

4） **Sampler**

5） **Post-porcessors**（除非Sampler得到的返回结果为空）

6） **Assirtions**（除非Sampler得到的返回结果为空）

7） **Listener**（除非Sampler得到的返回结果为空）

注意:Pre-porcessors、Post-porcessors和Assirtions等元件仅对Sampler作用，如在它们作用域内没有任何Sampler，则不会被执行；

如果在同一作用域范围内有多个同一类型的元件，则这些元件按照它们在test plan中的上下顺序依次执行。
