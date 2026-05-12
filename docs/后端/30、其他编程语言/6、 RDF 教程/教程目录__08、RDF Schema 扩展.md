# 08、RDF Schema 扩展
- 来源：https://ddkk.com/zhuanlan/other/rdf/8.html
- 分类：RDF 教程
- 分组：教程目录
RDFSchema (RDFS) 是对 RDF 的一种扩展，提供了定义 RDF 的规范

## RDF Schema 和 应用程序的类

RDF通过类、属性和值来描述资源

RDF还需要一种定义应用程序专业的类和属性的方法。应用程序专用的类和属性必须使用对 RDF 的扩展来定义

RDFSchema 就是这样一种扩展

## RDF Schema (RDFS)

RDFSchema 提供了描述应用程序专用的类和属性的框架，但这种框架不能用于实际的应用程序专用的类和属性

RDFSchema 中的类与面向对象编程语言中的类非常相似，这就使得资源能够作为类的实例和类的子类来被定义

RDFSchema 与 RDF 的关系，就像 XSLT 与 XML 的关系

## RDFS 范例

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
    xml:base="/books#">
    <rdf:Description rdf:ID="book">
        <rdf:type rdf:resource="http://www.w3.org/2000/01/rdf-schema#Class"/>
    </rdf:Description>
    <rdf:Description rdf:ID="webservices">
        <rdf:type rdf:resource="http://www.w3.org/2000/01/rdf-schema#Class"/>
        <rdfs:subClassOf rdf:resource="#book"/>
   </rdf:Description>
</rdf:RDF>
```

在上面的例子中，资源 "webservices" 是类 "book" 的子类

## 简化的范例

因为一个 RDFS 类就是一个 RDF 资源，那么我们可以用 rdfs:Class 取代 rdf:Description，并去掉 rdf:type 信息

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" 
    xml:base="/books#">
    <rdfs:Class rdf:ID="book" />
        <rdfs:Class rdf:ID="webservices">
        <rdfs:subClassOf rdf:resource="#book"/>
    </rdfs:Class>
</rdf:RDF>
```
