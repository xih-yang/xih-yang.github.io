# 04、WSDL 端口
- 来源：https://ddkk.com/zhuanlan/other/wsdl/4.html
- 分类：其他语言
- 分组：教程目录
`` 元素是最重要的 WSDL 元素

``可描述一个 web service、可被执行的操作，以及相关的消息

我们可以把 `` 元素比作传统编程语言中的一个函数库（或一个模块、或一个类）

## 操作类型

WSDL 定义了四种类型：

类型
定义

One-way
此操作可接受消息，但不会返回响应

Request-response
此操作可接受一个请求并会返回一个响应

Solicit-response
此操作可发送一个请求，并会等待一个响应

Notification
此操作可发送一条消息，但不会等待响应

## One-Way 操作

一个one-way 操作的范例

```xml
<message name="newTermValues">
    <part name="term" type="xs:string"/>
    <part name="value" type="xs:string"/>
</message>
<portType name="glossaryTerms">
    <operation name="setTerm">
        <input name="newTerm" message="newTermValues"/>
    </operation>
</portType >
```

在这个范例中:

端口"glossaryTerms" 定义了一个名为 "setTerm" 的 one-way 操作

这个"setTerm" 操作可接受新术语表项目消息的输入，这些消息使用一条名为 "newTermValues" 的消息，此消息带有输入参数 "term" 和 "value"。

但没有为这个操作定义任何输出

> 我们会发现，这四种操作类型，完全是靠缺了一份来实现和划分的 有定义 input 没定义 output，就是 One-Way

## Request-Response 操作

一个request-response 操作的范例:

```xml
<message name="getTermRequest">
    <part name="term" type="xs:string"/>
</message>
<message name="getTermResponse">
    <part name="value" type="xs:string"/>
</message>
<portType name="glossaryTerms">
    <operation name="getTerm">
        <input message="getTermRequest"/>
        <output message="getTermResponse"/>
    </operation>
</portType>
```

在这个范例中：

端口"glossaryTerms" 定义了一个名为 "getTerm" 的 request-response 操作

"getTerm" 操作会请求一个名为 "getTermRequest" 的输入消息，此消息带有一个名为 "term" 的参数

并将返回一个名为 "getTermResponse" 的输出消息，此消息带有一个名为 "value" 的参数。

> 为什么这个操作是 request-response 模型？ 因为它既定义了 input 又定义了 output
