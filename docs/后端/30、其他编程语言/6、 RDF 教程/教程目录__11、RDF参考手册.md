# 11、RDF参考手册
- 来源：https://ddkk.com/zhuanlan/other/rdf/11.html
- 分类：RDF 教程
- 分组：教程目录
## 1. RDF 命名空间

RDF命名空间 ( xmlns:rdf )

```xml
xmlns:rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
```

RDF命名空间( xmlns:rdfs )

```xml
xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" 
```

## 2. RDF 扩展名和 MIME 类型

- RDF 文件的推荐扩展名: .xml

当然，官方推荐的是 .rdf，但这个扩展名经常会导致浏览器下载我们的 rdf 文档而不是显示其内容

- RDF 的 MIME 类型：application/rdf+xml

## 3. RDFS / RDF 类

元素
类
子类

rdfs:Class
All classes

rdfs:Datatype
Data types
Class

rdfs:Resource
All resources
Class

rdfs:Container
Containers
Resource

rdfs:Literal
Literal values (text and numbers)
Resource

rdf:List
Lists
Resource

rdf:Property
Properties
Resource

rdf:Statement
Statements
Resource

rdf:Alt
Containers of alternatives
Container

rdf:Bag
Unordered containers
Container

rdf:Seq
Ordered containers
Container

rdfs:ContainerMembershipProperty
Container membership properties
Property

rdf:XMLLiteral
XML literal values
Literal

## 4. RDFS / RDF 属性

元素
领域
范围
描述

rdfs:domain
Property
Class
资源域

rdfs:range
Property
Class
资源的范围

rdfs:subPropertyOf
Property
Property
属性是另一个属性的子属性

rdfs:subClassOf
Class
Class
资源是另一个类的子类

rdfs:comment
Resource
Literal
人类可读的资源描述

rdfs:label
Resource
Literal
资源的标签

rdfs:isDefinedBy
Resource
Resource
资源的定义

rdfs:seeAlso
Resource
Resource
资源的其他信息

rdfs:member
Resource
Resource
资源的成员

rdf:first
List
Resource

rdf:rest
List
List

rdf:subject
Statement
Resource
陈述RDF的资源主体

rdf:predicate
Statement
Resource
陈述RDF的资源的谓词

rdf:object
Statement
Resource
陈述RDF的资源客体

rdf:value
Resource
Resource
value属性

rdf:type
Resource
Class
资源是一个类的实例

## 5. RDF 属性

元素
领域
范围
描述

rdf:about

定义所描述的资源

rdf:Description

资源描述的容器

rdf:resource

定义资源，以确定一个属性

rdf:datatype

定义一个元素的数据类型

rdf:ID

定义元素的ID

rdf:li

定义列表

rdf:_n

定义一个节点

rdf:nodeID

定义元素节点的ID

rdf:parseType

定义元素应如何解析

rdf:RDF

一个RDF文档的根

xml:base

定义了XML基础

xml:lang

定义元素内容的语言

### 以下属性已经从 RDF标准中删除

元素

rdf:aboutEachdeleted

rdf:aboutEachPrefixdeleted

rdf:bagIDdeleted

deleted 为最近从 RDF 标准删除元素
