# 18、JMeter 实战 - 关联之XPath Extractor
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/18.html
- 分类：开发工具
- 分组：教程目录
之前的博客，有介绍jmeter如何对请求进行关联的一种常见用法，即：后置处理器中的[正则表达式提取器](http://www.cnblogs.com/imyalost/p/6485754.html)，下面介绍另一种关联方法，XPath Extractor！

所谓**关联**，从业务角度讲，即：某些操作步骤与其相邻步骤存在一定的依赖关系，导致某个步骤的输入数据来源于上一步的返回数据，这时就需要“关联”来建立步骤之间的联系。

简单来说，就是：将上一个请求的响应结果作为下一个请求的参数。。。

jmeter提供的对关联的支持包括以下2个方面：

①能够将返回页面上的指定内容保存在参数中；

②能够将GET或POST方法中的数据使用该参数来替换；

**XPath Extractor**的使用方法与正则表达式提取器(Regular Expression Extractor)类似，只不过该Expression中指定的不是正则表达式，而是给定的XPath路径。

首先，新建一个线程组，然后右键-添加-后置处理器-XPath Extractor：

这里简单介绍下**jmeter后置处理器的作用**：

后置处理器(Post Processor)本质上是一种对sampler发出请求后接受到的响应数据进行处理（后处理）的方法，结合之前我介绍过的jmeter[元件的作用域和执行顺序](http://www.cnblogs.com/imyalost/p/5971168.html)，

必须将后置处理器元件放在合适的位置才能达到预期的效果。

XPath Extractor界面如下：

**APPly to:**作用范围（返回内容的断言范围）

Main sample and sub-samples:作用于父节点的取样器及对应子节点的取样器

Main sample only：仅作用于父节点的取样器

Sub-samples only:仅作用于子节点的取样器

JMeter Variable:作用于jmeter变量(输入框内可输入jmeter的变量名称)

**XML Parsing Options**：要解析的XML参数

UseTidy：当需要处理的页面是HTML格式时，必须选中该选项；如果是XML或XHTML格式（例如RSS返回），则取消选中；

Quiet表示只显示需要的HTML页面，Report errors表示显示响应报错，Show warnings表示显示警告；

UseNamespaces：如果启用该选项，后续的XML解析器将使用命名空间来分辨；

Validate XML：根据页面元素模式进行检查解析；

Ignore Whitespace：忽略空白内容；

Fetch external DTDs：如果选中该项，外部将使用DTD规则来获取页面内容；

**Return entire XPath fragment of text content**：返回文本内容的整个XPath片段；

**Reference Name**：存放提取出的值的参数。

**XPath Query**：用于提取值的XPath表达式。

**Default Value**：参数的默认值。

**PS**:XPath是XML/XHTML中常用的选取给定节点和节点集的方法。

正则表达式提取器和XPath Extractor的区别：

①正则表达式提取器可以用于对页面任何文本的提取，提取的内容是根据正则表达式在页面内容中进行文本匹配；

②XPath Extractor则可以提取返回页面任意元素的任意属性；

③如果需要提取的文本是页面上某元素的属性值，建议使用XPath Extractor;

④如果需要提取的文本在页面上的位置不固定，或者不是元素的属性，建议使用正则表达式提取器。
