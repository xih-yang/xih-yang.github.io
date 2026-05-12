# 03、WSDL 文档
- 来源：https://ddkk.com/zhuanlan/other/wsdl/3.html
- 分类：其他语言
- 分组：教程目录
WSDL 文档是包含一系列的，可描述某个 web service 的定义的，简单的 XML 文档

## WSDL 文档结构

WSDL 文档用下表这些主要的元素来描述某个 web service 的

元素
描述

web service 想要执行的操作

web service 使用的消息

web service 使用的数据类型

web service 使用的通信协议

WSDL 文档的主要结构类似这样的:

```xml
<definitions>
    <types>data type definitions........</types>
    <message>definition of the data being communicated....</message>
    <portType>set of operations......</portType>
    <binding>protocol and data format specification....</binding>
</definitions>
```

WSDL 文档还可包含其它的元素，比如 extension 元素，以及一个 service 元素

services 元素可把若干个 web services 的定义组合在一个单一的 WSDL 文档中

## WSDL 端口

`` 元素是 WSDL 最重要的元素，它描述了一个 web service 可被执行的操作，以及相关的消息

我们可以把 `` 元素比作传统编程语言中的一个函数库（或一个模块、或一个类）

## WSDL 消息

`` 元素定义了一个操作的数据元素。

每个消息 `` 均由一个或多个部件组成。

可以把这些部件比作传统编程语言中一个函数调用的参数。

## WSDL 数据类型

**** 元素定义了 web service 使用的数据类型

当然，为了最大程度的平台中立性，WSDL 使用 XML Schema 语法来定义数据类型。

## WSDL 通讯协议

`` 元素为每个端口定义了消息格式和协议细节

## WSDL 范例

看一个简化了的 WSDL 文档片段

```xml
<message name="getTermRequest"><part name="term" type="xs:string"/></message>
<message name="getTermResponse"><part name="value" type="xs:string"/></message>
<portType name="glossaryTerms">
    <operation name="getTerm">
        <input message="getTermRequest"/>
        <output message="getTermResponse"/>
    </operation>
</portType>
```

在这个范例中:

- `` 元素把 "glossaryTerms" 定义为某个 **端口** 的名称，把 "getTerm" 定义为某个 **操作** 的名称
- 操作 "getTerm" 拥有一个名为 "getTermRequest" 的 **输入消息** ，以及一个名为 "getTermResponse" 的 **输出消息**
- `` 元素可定义每个消息的 **部件** ，以及相关联的数据类型

对比传统的编程，glossaryTerms 是一个函数库，而 "getTerm" 是带有输入参数 "getTermRequest" 和返回参数 getTermResponse 的一个函数
