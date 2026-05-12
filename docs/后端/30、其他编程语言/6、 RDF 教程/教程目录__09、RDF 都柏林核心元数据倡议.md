# 09、RDF 都柏林核心元数据倡议
- 来源：https://ddkk.com/zhuanlan/other/rdf/9.html
- 分类：RDF 教程
- 分组：教程目录
都柏林核心元数据倡议 (DCMI) 创建了一套供描述文档的预定义属性

## DCMI 核心内容

RDF是一种元数据，是描述数据的数据，RDF 被用于描述信息资源

都柏林核心内容是一套供描述文档的预定义属性

第一份都柏林核心属性是于1995年 在俄亥俄州的都柏林的元数据工作组被定义的，目前由都柏林元数据倡议来维护

属性
定义

Contributor
为当前资源做出贡献的机构或个人

Coverage
资源内容的作用域

Creator
当前资源的创建者

Format
物理或数字的资源表现形式

Date
当前资源的创建日期

Description
当前资源内容的摘要或说明

Identifier
当前资源的唯一标识

Language
当前资源所用的语言

Publisher
当前资源的发布者

Relation
当前资源的相关资源

Rights
当前资源的版权信息

Source
当前资源的来源

Subject
资源内容的主题

Title
资源的名称

Type
资源内容的种类或类型

总览上面的所有元素，发现和 RDF 非常类似，所以 RDF 是非常适合表示都柏林核心信息的

## RDF 范例

让我们用都柏林核心元数据倡议 (DCMI)制作一个 RDF 文档

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
    xmlns:dc= "http://purl.org/dc/elements/1.1/">
    <rdf:Description rdf:about="https://www.ddkk.com">
        <dc:description>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</dc:description>
        <dc:publisher>DDKK.COM 弟弟快看，程序员编程资料站</dc:publisher>
        <dc:date>2017-09-01</dc:date>
        <dc:type>前端开发</dc:type>
        <dc:format>text/html</dc:format>
        <dc:language>zh-cn</dc:language>
    </rdf:Description>
</rdf:RDF>
```
