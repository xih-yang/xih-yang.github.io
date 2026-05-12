# 08、JMeter 实战 - 断言
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/8.html
- 分类：开发工具
- 分组：教程目录
jmeter中有个元件叫做断言（Assertion），它的作用和loadrunner中的检查点类似；

用于检查测试中得到的响应数据等是否符合预期，用以保证性能测试过程中的数据交互与预期一致。

**使用断言的目的：** 在request的返回层面增加一层判断机制；因为request成功了，并不代表结果一定正确。

**使用断言的方法：**

**△**在选择的Sampler下添加对应的断言（因为不同类型的断言检查的内容不同）；配置好响应的检查内容（根据断言情况而定，有的断言控制面板不需要添加任何内容，如XML Assertion）。

**△**添加一个断言结果的监听器（从监听器中添加），通过“断言结果”可以看到是否通过断言；对于一次请求，如果通过的话，断言结果中只会打印一行请求的名称；

如果失败，则除了请求的名称外，还会有一行失败的原因（不同类型的断言，结果不同）。

**PS：** 一个Sampler可以添加多个断言，根据你的检查需求来添加相应的断言，当Sampler下所有的断言都通过了，那么才算request成功。

最新版本的3.0jmeter中有13种不同的断言，下面简单介绍下每个断言各自拥有什么样的作用以及它们的适用场景：

**1、BeanShell断言**

BeanShell之前关于定时器的随笔中有介绍过，是一种松散类型的脚本语言（这点和JS类似），一种完全符合java语法的java脚本语言，并且又拥有自己的一些语法和方法；

**作用对象：** 针对sampler中的Bean Shell sampler而使用的断言

**Name:**断言的名字（可以用一个比较容易理解和分辨的名称）

**Comments：** 注释（对这个断言进行一个解释，备注）

**Reset bsh.interpreter before each call:**在每次调用Bean Shell之前重置bsh.interpreter类（bsh.interpreter是Bean Shell脚本语言的一种类，也可以理解为一种解析器）

**Parameters（String Parameters and String []bsh.args）:**String参数（String []bsh.args是主类main函数的形式参数,是一个String 对象数组，可以用来获取命令行用户输入进去的参数）

**Script file：** 脚本文件（可以填入脚本文件路径）

**Script（see below for variables that are defined）:**参照下文定义的变量（使脚本文件参照定义的变量来运行）

**2、 BSF断言**

BSF(Bean Scripting Framework)之前也介绍过，是一个支持在Java应用程序内调用脚本语言 (Script)，并且支持脚本语言直接访问Java对象和方法的一个开源项目；

**作用对象：** 针对sampler中的BSF sampler而使用的断言

**Script language（e.g.beanshell,javascirpt,jexl）:**脚本语言（可以从下面的下拉框中选择对应的脚本语言JavaScript、beanshell等）

**parameters to be passed to script（=> String Parameters and String []args）:**（传递给脚本的参数→可以理解为使用BSF断言脚本时候一起引用的参数 ）

**Script file（overrides script）：** 重写脚本（可以通过选择脚本文件的状态，是浏览调用已有的脚本还是在在下方的输入框内写入脚本；）

**Script：** 下面的输入框表示可以输入变量类型，运用的脚本（取样结果、断言结果、取样日志文件等参数）

**3、比较断言（compare assertion）**

这是一种比较特殊的断言元件，针对断言进行字符串替换时使用；

**作用对象：** 需要替换的字符串

**Select Comparison Operators:**选择比较运算符

**Compare Content:**可以选择比较的内容类型（true/false或者自定义，编辑）

**Compare Time：** 比较时间（可以设定比较的时间，单位为秒，默认为-1）

**Comparison Fitters:**比较修改工具

**regular expression substitutions:**替换正则表达式

**Regex String:**要替换的字符串（可从断言结果中选择）

**substitutions：** 替换的字符串（替换结果）

**4、HTML断言**

对响应类为XML类型的文件进行断言；

**作用对象：** 针对sampler中的SOAP/XML-RPC Request而使用的断言

**Tidy Settings:**Tidy 环境（Tidy是一个HTML语法检查器和打印工具，可以将HTML转换为XML类型的文件）

**Doctype:**文档类型（可通过下拉框选择不同文档类型→ omit疏忽遗漏的/auto动态的/strict严格的/loose宽泛的。。。。。。我也不太懂这里什么意思GG）

**Format：** 文件格式（可选择HTML/XHTML/XML三种不同类型的文件格式来检查返回内容）

**Errors only：** 误差校正（能接受的最大值）

**Error threshold：** 误差/错误范围（可选择误差/错误数量的范围，最大值）

**Warning threshold：** 警告范围（可选择误差警告的数量范围，最大值）

如果勾选“Error only”这里忽略Warning，只对误差作统计检查；如果对返回内容的检查结果不超过指定结果，则断言通过，否则失败。

**Write JTidy report to file:**写入JTidy报告的文件（JTidy是Tidy的一个java移植，可以将它当成一个处理HTML文件的DOM解析器）

**5、JSR223断言**

JSR223即Java 规范请求，是指向JCP(Java Community Process)提出新增一个标准化技术规范的正式请求；

**作用对象：** 针对sampler中的JSR223 sampler而使用的断言

**Script language（e.g.beanshell,javascirpt,jexl）:**脚本语言（可以从下面的下拉框中选择对应的脚本语言JavaScript、beanshell等）

**parameters to be passed to script（=> String Parameters and String []args）:**（传递给脚本的参数→可以理解为使用JSR223断言脚本时候一起引用的参数 ）

**Script file（overrides script）：** 重写脚本（可以通过选择脚本文件的状态，是浏览调用已有的脚本还是在在下方的输入框内写入脚本；）

**Script：** 下面的输入框表示可以输入变量类型，运用的脚本（取样结果、断言结果、取样日志文件等参数）

**6、MD5Hex断言**

MD5是一种消息摘要算法，用以提供消息的完整性保护（具体关于MD5的知识请自行查询）；

**作用对象：** 针对参数类型为MD5Hex加密的参数的断言

**MD5Hex：** 将已被MD5加密的参数写入其中，添加取样器等其他元件

**7、Size断言**

用于判断返回内容的大小；

**作用对象：** 返回信息，响应报文

**APPly to:**应用范围（返回内容的断言范围）

Main sample and sub-samples:作用于父节点取样器及对应子节点取样器

Main sample only：仅作用于父节点取样器

Sub-samples only:仅作用于子节点取样器

JMeter Variable:作用于jmeter变量(输入框内可输入jmeter的变量名称)

**Response Size Field to Test:**响应字节的测试范围（可以选择用于判断的响应范围）

Full Response:全部响应

Response Headers:响应头部

Response Body:响应主体

响应代码：响应报文相关的代码

响应信息：响应报文的信息

**Size to Assert:**断言字节范围

字节大小单位为：字节；比较顺序是①返回内容的大小②比较类型③指定字节大小

**8、SMIME断言**

SMIME是一种多用途网际邮件扩充协议，相比于之前的SMAP邮件传输协议，增加了安全性，对邮件主题进行保护；

**作用对象：** 针对采用了该种邮件传输协议的信息

**signature:**签名（可选择对协议的签名验证状态）

Verify signature:验证签名

Message not signed:没有签名消息

**Signer certificate：** 签名证书（因为SMIME协议增加了安全传输，需要证书验证）

Nocheck：不检查

Check values:检查

**Signer distinguished name:**签名证书者名称（证书注册者的名称）

**Sigmer email address:**签名者的邮件地址（注册的邮件地址）

**Issuer distinguished name:**发行者名称（由谁发行的证书）

**Serial Number:**证书序号

**Certificate file:**选择证书文件

**Execute assertion message at position:**执行断言消息的位置（在返回消息的具体哪个位置执行断言）

**9、XML概要断言**

亦可以称为XML模型断言/XML数据类型断言；XML Schema 定义了两种主要的数据类型：①xml document schema 文档架构 ;② 文档架构xml-schema xml模式

**作用对象：** 返回结果为XML概要断言的2中数据类型的消息

**XML Schema：** XML概要模型

**File Name:**文件名（写入需要断言的文件名称）

**10、XML断言**

XML(可扩展标记语言) 提供一种描述结构化数据的方法。与主要用于控制数据的显示和外观的 HTML 标记不同，XML 标记用于定义数据本身的结构和数据类型；

**作用对象：** 判断返回结果是否和xml的格式即<>成对出现

**11、XPath断言**

XPath即为XML路径语言，它是一种用来确定XML（标准通用标记语言的子集）文档中某部分位置的语言。XPath基于XML的树状结构，提供在数据结构树中找寻节点的能力。

**作用对象：** 针对返回信息为XPAth的数据类型进行断言

**Apply to:**适用范围

Main sample and sub-samples:主要样本和次级样本

Main sample only：仅主要样本

Sub-samples only:仅次级样本

JMeter Variable:jmeter变量(输入框内可输入jmeter的变量名称)

**XML Parsing Options：** XML解析选项

UseTidy(tolerant parser):使用Tidy（容错解析器），默认选择quiet（不显示）

Quiet：不显示

Report errors：错误报告

Show warnings:显示错误

UseNamespaces:使用名称空间

Validate XML:验证XML（文件包/数据）

Ignore Whitespace:忽略空格（这允许你指定语法分析器可以忽略哪个空格，而哪个空格是重要的）

Fetch external DTDs:获取外部DTDs（一些XML元素具有属性，属性包含应用程序使用的信息，属性仅在程序对元素进行读、写操作时，提供元素的额外信息，这时候需要在DTDs中声明）

**XPath Assertion:**输入框中写入xpath断言，点击Validate验证其正确性

True if nothing matches:确认都不匹配

**12、响应断言**

判断返回内容中的内容

**作用对象：** 响应报文中的所有对象

**APPly to:**适用范围

Main sample and sub-samples:作用于父节点取样器及对应子节点取样器

Main sample only：仅作用于父节点取样器

Sub-samples only:仅作用于子节点取样器

JMeter Variable:作用于jmeter变量(输入框内可输入jmeter的变量名称)

**要测试的响应字段：** 要检查的项

响应报文

Documeng(text)：测试文件

URL样本

响应代码

响应信息

Response Headers:响应头部

Ignore status：忽略返回的响应报文状态码

**模式匹配规则：**

包括：返回结果包括你指定的内容

匹配：（好像跟Equals查不多，弄不明白有什么区别）

Equals：返回结果与你指定结果一致

Substring：返回结果是指定结果的字串

否：不进行匹配

**要测试的模式:**即填写你指定的结果（可填写多个）,按钮【添加】、【删除】是进行指定内容的管理

**13、断言持续时间**

用于判断服务器的响应时间

**作用对象:**服务器

**APPly to:**适用范围

Main sample and sub-samples:作用于父节点取样器及对应子节点取样器

Main sample only：仅作用于父节点取样器

Sub-samples only:仅作用于子节点取样器

**Duration to assert：** 持续断言

**Duration in milliseconds：** 响应时间设置（单位：毫秒），如果响应时间大于设置的响应时间，则断言失败，否则成功！
