# 16、JMeter 教程 - JMeter断言
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/1/16.html
- 分类：开发工具
- 分组：教程目录
## 1.简介

断言组件用来对服务器的响应数据做验证，常用的断言是响应断言，其支持正则表达式。虽然我们的通过响应断言能够完成绝大多数的结果验证工作，但是JMeter还是为我们提供了适合多个场景的断言元件，辅助我们来更好的完成结果验证工作。在使用JMeter进行性能测试或者接口自动化测试工作中，经常会用到的一个功能，就是断言，断言相当于检查点，它是用来判断系统返回的响应结果是否正确，以此帮我们判断测试是否通过。

## 2.预览断言

首先我们来看一下JMeter的断言，路径：线程组（用户）->添加->断言；我们可以清楚地看到JMeter5中共有15个断言（不包括jp@gc开头的断言，这个是安装的插件），如下图所示：

## 3.常用断言详解

比较常用的断言：响应断言、JSON断言、持续时间断言

### 3.1 响应断言

响应断言，判断返回消息中的内容。响应断言是最常用的一种断言方法，它可以对各种返回类型的结果进行断言，比如Test、html、application/json等

使用频率：非常高，大部分场景均可以使用该断言器

**3、** 1.1新建：线程组>添加>断言>响应断言，如下图所示：；

**3、** 1.2关键参数说明如下：；

APPly to：

- Main sample and sub-samples：作用于父节点取样器及对应子节点取样器
- Main sample only：仅作用于父节点取样器（默认）
- Sub-samples only：仅作用于子节点取样器
- JMeter Variable Name to use：作用于jmeter变量(输入框内可输入jmeter的变量名称)

测试字段

- 响应文本：从服务器返回的响应文本，比如body，包含 HTTP 头（请求的响应数据——Response Body）
- 响应代码：比如 200、404（请求的取样器结果中的 Response code）
- 响应消息：比如 OK（请求的取样器结果中的 Response message）
- 响应头：比如 Set-Cookie 头（请求的响应数据——Response headers）
- 请求头：（请求的请求——Request Headers）
- URL样本：请求的地址（请求的请求——Request Body 中的地址）
- 文档（文本）：通过 Apache Tika 追踪的各种类型文档的文本（比如返回的是HTML格式，其中的文本信息）
- 忽略状态：指示 JMeter 设置 sampler status 的初始状态为 success。sample status 是否成功，由已 Response status 和断言结果决定，当选中 Ignore Status 时，Response status 被强制设置为 success，不执行进一步的断言判断。仅第一次断言时使用
- 请求数据：（请求的请求——Request Body）

模式匹配规则

- 包括：响应内容包括需要匹配的内容即代表响应成功，支持正则表达式
- 匹配：响应内容要完全匹配需要匹配的内容即代表响应成功，大小写不敏感，支持正则表达式。
- 相等：响应内容要完全等于需要匹配的内容才代表成功，大小写敏感，需要匹配的内容是字符串正则表达式
- 字符串：返回结果包含指定结果的字串，但是 subString 不支持正则字符串
- 否：不进行匹配

测试模式： 与模式匹配规则一同使用，可以直接写值也可以使用正则表达式

自定义失败消息： 自定义失败消息

### 3.2JSON断言

JSON断言也是测试工作中经常用到的一种断言方法，它只能针对响应结果是applicaton/json格式的请求进行断言。适用于返回消息是JSON格式

使用频率：比较高，尤其是返回为 JSON 时，为首先断言器

**3、** 2.1新建：线程组>添加>断言>JSON断言，如下图所示：；

**3、** 2.2关键参数说明如下：；

Assert JSON Path exists： json路径

Additionally assert value：等于特定值

Match as regular expression：正则匹配

Expected Value：预期值；支持脚本语言写法

Expect null：空值

Invert assertion(will fail if above conditions met)：上面的条件满足则fail；若勾选，表示对断言结果取反

### 3.3大小断言

大小断言，显示取样器请求和响应的细节以及请求结果，包括消息头，请求的数据，响应的数据。判断响应结果是否包含正确数量的byte。可定义（=, !=, >, =,

使用频率：一般

**3、** 3.1新建：线程组>添加>断言>大小断言，如下图所示：；

**3、** 3.2关键参数说明如下：；

APPly to：

- Main sample and sub-samples：作用于父节点取样器及对应子节点取样器
- Main sample only：仅作用于父节点取样器（默认）
- Sub-samples only：仅作用于子节点取样器
- JMeter Variable Name to use：作用于jmeter变量(输入框内可输入jmeter的变量名称)

响应字段大小

- 完整响应
- 响应头
- 响应的消息体
- 响应代码
- 响应信息

Size to Assert：断言字节范围

- 字节大小
- 比较类型

### 3.4 JSR223 断言

JSR223即Java 规范请求，是指向JCP(Java Community Process)提出新增一个标准化技术规范的正式请求；

作用对象：针对取样器中的JSR223 sampler而使用的断言

使用频率：一般

**3、** 4.1新建：线程组>添加>断言>JSR223断言，如下图所示：；

**3、** 4.2关键参数说明如下：；

语言：脚本语言（可以从下面的下拉框中选择对应的脚本语言JavaScript、beanshell等）

参数：（传递给脚本的参数→可以理解为使用JSR223断言脚本时候一起引用的参数 ）

文件名：重写脚本（可以通过选择脚本文件的状态，是浏览调用已有的脚本还是在在下方的输入框内写入脚本；）

脚本：下面的输入框表示可以输入变量类型，运用的脚本（取样结果、断言结果、取样日志文件等参数）

### 3.5XPath2 Assertion

XPath即为XML路径语言，它是一种用来确定XML（标准通用标记语言的子集）文档中某部分位置的语言。XPath基于XML的树状结构，提供在数据结构树中找寻节点的能力。

使用频率：一般

**3、** 5.1新增：线程组>添加>断言>XPath2Assertion，如下图所示：；

**3、** 5.2关键参数说明如下：；

APPly to：

- Main sample and sub-samples：作用于父节点取样器及对应子节点取样器
- Main sample only：仅作用于父节点取样器（默认）
- Sub-samples only：仅作用于子节点取样器
- JMeter Variable Name to use：作用于jmeter变量(输入框内可输入jmeter的变量名称)

XPath2 Assertion

- 反转断言（如果XPath表达式匹配，则将失败）
- 验证XPath表达式

命名空间别名列表

输入框中写入xpath断言

### 3.6 比较断言

这是一种比较特殊的断言元件，针对断言进行字符串替换时使用；

作用对象：需要替换的字符串

使用频率：一般

**3、** 6.1新建：线程组>添加>断言>比较断言，如下图所示：；

**3、** 6.2关键参数说明如下：；

选择比较运算符

- 比较的内容：可以选择比较的内容类型（true/false或者自定义，编辑）
- 比较的时间：比较时间（可以设定比较的时间，单位为秒，默认为-1）

比较过滤器

- 正则表达式替换
- 正则表达式：要替换的正则表达式（可从断言结果中选择）
- 替换：替换的正则表达式（替换结果）

### 3.7 HTML断言

对响应类为XML类型的文件进行断言；

作用对象：针对sampler中的SOAP/XML-RPC Request而使用的断言

使用频率：一般

**3、** 7.1新建：线程组>添加>断言>HTML断言，如下图所示：；

**3、** 7.2关键参数说明如下：；

Tidy Settings：Tidy 环境（Tidy是一个HTML语法检查器和打印工具，可以将HTML转换为XML类型的文件）

- Doctype：文档类型（可通过下拉框选择不同文档类型→ omit疏忽遗漏的/auto动态的/strict严格的/loose）

Format：文件格式（可选择HTML/XHTML/XML三种不同类型的文件格式来检查返回内容）

Errors only：误差校正（能接受的最大值）

Error threshold：误差/错误范围（可选择误差/错误数量的范围，最大值）

Warning threshold：警告范围（可选择误差警告的数量范围，最大值）

如果勾选“Error only”这里忽略Warning，只对误差作统计检查；如果对返回内容的检查结果不超过指定结果，则断言通过，否则失败。

将JTidy报告写入文件：写入JTidy报告的文件（JTidy是Tidy的一个java移植，可以将它当成一个处理HTML文件的DOM解析器）

### 3.8JSON JMESPath Assertion

同JSON断言类似，不详细讲解

### 3.9MD5 Hex断言

MD5是一种消息摘要算法，用以提供消息的完整性保护，对返回的MD5结果进行断言，使用简单，直接跳入MD5值。执行服务器响应的MD5哈希并将其与给定的Md5哈希进行比较。它非常适合您要检查下载文件是否完整的情况。

作用对象：针对参数类型为MD5Hex加密的参数的断言

**3、** 9.1新建：线程组>添加>断言>MD5Hex断言，如下图所示：；

**3、** 9.2关键参数说明如下：；

MD5Hex：将已被MD5加密的参数写入其中，添加取样器等其他元件

### 3.10 SMIME断言

SMIME是一种多用途网际邮件扩充协议，相比于之前的SMAP邮件传输协议，增加了安全性，对邮件主题进行保护；

作用对象：针对采用了该种邮件传输协议的信息

使用频率：少

**3、** 10.1新建：线程组>添加>断言>SMIME断言，如下图所示：；

**3、** 10.2关键参数说明如下：；

signature：签名（可选择对协议的签名验证状态）

- Verify signature：验证签名
- Message not signed：没有签名消息

Signer certificate：签名证书（因为SMIME协议增加了安全传输，需要证书验证）

- No check：不检查
- Check values：检查

Signer distinguished name：签名证书者名称（证书注册者的名称）

Sigmer email address：签名者的邮件地址（注册的邮件地址）

Issuer distinguished name：发行者名称（由谁发行的证书）

Serial Number：证书序号

Certificate file：选择证书文件

Execute assertion message at position：执行断言消息的位置（在返回消息的具体哪个位置执行断言）

### 3.11XML Schema断言

亦可以称为XML模型断言/XML数据类型断言；XML Schema 定义了两种主要的数据类型：①xml document schema 文档架构 ;② 文档架构xml-schema xml模式

作用对象：返回结果为XML概要断言的2中数据类型的消息

使用频率：少

**3、** 11.1新建：线程组>添加>断言>XMLSchema断言，如下图所示：；

**3、** 11.2关键参数说明如下：；

文件名：载入文件名 ，（写入需要断言的文件名称）

### 3.12XML断言

XML(可扩展标记语言) 提供一种描述结构化数据的方法。与主要用于控制数据的显示和外观的 HTML 标记不同，XML 标记用于定义数据本身的结构和数据类型；

作用对象：判断返回结果是否和xml的格式即<>成对出现

使用频率：少

**3、** 12.1新建：线程组>添加>断言>XML断言，如下图所示：；

### 3.13Xpath 断言

XPath即为XML路径语言，它是一种用来确定XML（标准通用标记语言的子集）文档中某部分位置的语言。XPath基于XML的树状结构，提供在数据结构树中找寻节点的能力。

使用频率：一般

**3、** 13.1新增：线程组>添加>断言>Xpath断言，如下图所示：；

**3、** 13.2关键参数说明如下：；

APPly to：

- Main sample and sub-samples：作用于父节点取样器及对应子节点取样器
- Main sample only：仅作用于父节点取样器（默认）
- Sub-samples only：仅作用于子节点取样器
- JMeter Variable Name to use：作用于jmeter变量(输入框内可输入jmeter的变量名称)

XMLParsing Options：XML解析选项

- Use Tidy(tolerant parser)：使用Tidy（容错解析器），默认选择quiet（不显示）
- Quiet：不显示
- 报告异常
- 显示警告
- Use Namespaces：使用名称空间
- Validate XML：验证XML（文件包/数据）
- Ignore Whitespace：忽略空格（这允许你指定语法分析器可以忽略哪个空格，而哪个空格是重要的）
- Fetch external DTDs：获取外部DTDs（一些XML元素具有属性，属性包含应用程序使用的信息，属性仅在程序对元素进行读、写操作时，提供元素的额外信息，这时候需要在DTDs中声明）

XPath 断言：输入框中写入xpath断言，点击“验证”验证其正确性

- Invert assertion(will fail if XPath expression matches)：反转断言（如果XPath表达式匹配，则将失败）

### 3.14 断言持续时间

断言持续时间，用于判断服务器的响应时间

使用频率：一般

**3、** 14.1新建：线程组>添加>断言>断言持续时间，如下图所示：；

**3、** 14.2关键参数说明如下：；

APPly to：

- 选项默认即可，Main sample only(仅作用于父节点取样器)
- Main sample and sub-samples：作用于父节点取样器及对应子节点取样器
- Sub-samples only：仅作用于子节点取样器

断言持续时间

- 持续时间（毫秒）：响应时间设置，如果响应时间大于设置的响应时间，则断言失败，否则成功！

### 3.15 Bean Shell断言

BeanShell是一种松散类型的脚本语言（这点和JS类似），一种完全符合java语法的java脚本语言，并且又拥有自己的一些语法和方法；

BeanShell断言支持各种开发语言，本文介绍使用java编写断言，使用BeanShell断言的好处是可以自由发挥，比如当断言失败，提示预期结果、实际结果，或者失败时把结果输出到日志。

作用对象：针对sampler中的Bean Shell sampler而使用的断言

使用频率：一般

**3、** 15.1新建：线程组>添加>断言>BeanShell断言，如下图所示：；

**3、** 15.2关键参数说明如下：；

每次调用前重置bsh.Interpreter：在每次调用Bean Shell之前重置bsh.interpreter类（bsh.interpreter是Bean Shell脚本语言的一种类，也可以理解为一种解析器）

参数：String参数（String []bsh.args是主类main函数的形式参数,是一个String 对象数组，可以用来获取命令行用户输入进去的参数）

文件名：脚本文件（可以填入脚本文件路径）

脚本（see below for variables that are defined）：参照下文定义的变量（使脚本文件参照定义的变量来运行）
