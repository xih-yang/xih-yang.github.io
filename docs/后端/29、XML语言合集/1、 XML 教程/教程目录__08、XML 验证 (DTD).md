# 08、XML 验证 (DTD)
- 来源：https://ddkk.com/zhuanlan/xml/xml/8.html
- 分类：其他语言
- 分组：教程目录
拥有正确语法的 XML 被称为 "形式良好" 的 XML 通过 DTD 验证的 XML 是 "合法" 的 XML

## 形式良好的 XML 文档

"形式良好"的 XML 文档拥有正确的语法

也就是遵守前面的章节描述的语法规则

**1、** XML文档必须有一个根元素；

**2、** XML元素都必须有一个关闭标签；

**3、** XML标签对大小写敏感；

**4、** XML元素必须被正确的嵌套；

**5、** XML属性值必须加引号；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

## 验证 XML 文档

合法的XML 文档是 "形式良好"的 XML 文档

也就是符合文档类型定义（DTD）的规则：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE note SYSTEM "Note.dtd">   
<note>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

DOCTYPE 声明是对外部 DTD 文件的引用

Note.dtd 的内容会在下一节中学习到

## XML DTD

DTD的目的是定义 XML 文档的结构。 它使用一系列合法的元素来定义文档结构

```xml
<!DOCTYPE note[
    <!ELEMENT note (to,from,heading,body)>
    <!ELEMENT to  (#PCDATA)>
    <!ELEMENT from  (#PCDATA)>
    <!ELEMENT heading (#PCDATA)>
    <!ELEMENT body    (#PCDATA)>
]>
```

如果要深入要学习 DTD，请移步在我们的 DTD 基础教程

## XML Schema

W3C支持一种基于 XML 的 DTD 代替者 XML Schema

```xml
<xs:element name="note">
    <xs:complexType>
        <xs:sequence>
            <xs:element name="to" type="xs:string"/>
            <xs:element name="from" type="xs:string"/>
            <xs:element name="heading" type="xs:string"/>
            <xs:element name="body" type="xs:string"/>
        </xs:sequence>
    </xs:complexType>
</xs:element>
```

看起来XML Schema 比 DTD 要复杂有没有？

> 所以，才流行不起来？

如果要深入学习 XML Schema，请移步我们的 XML Schema 基础教程

## 一个通用的 XML 验证器

为了更简单快捷的检查 XML 文件的语法，我们会在下一章节中创建一个 XML 验证器，以便在需要时对任何 XML 文件进行语法检查
