# 01、DTD 基础教程
- 来源：https://ddkk.com/zhuanlan/xml/dtd/1.html
- 分类：XML语言教程
- 分组：教程目录
DTD（文档类型定义）的作用是定义 XML 文档的合法组成部件，它使用一系列的合法元素来定义文档结构。

## 下面是一份产品目录 DTD

```xml
<!DOCTYPE CATALOG [
<!ENTITY AUTHOR "John Doe">
<!ENTITY COMPANY "JD Power Tools, Inc.">
<!ENTITY EMAIL "jd@jd-tools.com">
<!ELEMENT CATALOG (PRODUCT+)>
<!ELEMENT PRODUCT
(SPECIFICATIONS+,OPTIONS?,PRICE+,NOTES?)>
<!ATTLIST PRODUCT
NAME CDATA #IMPLIED
CATEGORY (HandTool|Table|Shop-Professional) "HandTool"
PARTNUM CDATA #IMPLIED
PLANT (Pittsburgh|Milwaukee|Chicago) "Chicago"
INVENTORY (InStock|Backordered|Discontinued) "InStock">
<!ELEMENT SPECIFICATIONS (#PCDATA)>
<!ATTLIST SPECIFICATIONS
WEIGHT CDATA #IMPLIED
POWER CDATA #IMPLIED>
<!ELEMENT OPTIONS (#PCDATA)>
<!ATTLIST OPTIONS
FINISH (Metal|Polished|Matte) "Matte" 
ADAPTER (Included|Optional|NotApplicable) "Included"
CASE (HardShell|Soft|NotApplicable) "HardShell">
<!ELEMENT PRICE (#PCDATA)>
<!ATTLIST PRICE
MSRP CDATA #IMPLIED
WHOLESALE CDATA #IMPLIED
STREET CDATA #IMPLIED
SHIPPING CDATA #IMPLIED>
<!ELEMENT NOTES (#PCDATA)>
]>
```

## 教程目录

DTD简介

对XML DTD 的简介，以及使用它的原因

DTD- XML 构建模块

可以在DTD 中定义的 XML 构建模块

DTD元素

如何使用 DTD 定义 XML 文档的合法元素

DTD属性

如何使用 DTD 定义 XML 元素的合法属性

DTD实体

如何使用 DTD 定义 XML 实体

DTD验证

本章节讨论了如何在载入 XML 文档时，检验 DTD 错误

DTD实例

本章显示了一些真实的 DTD 案例

DTD总结

本章节是对本教程所学内容的一个总结，以及向您推荐的下一步应该学习的内容
