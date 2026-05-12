# 04、XML 树结构
- 来源：https://ddkk.com/zhuanlan/xml/xml/4.html
- 分类：其他语言
- 分组：教程目录
XML文档是一种树形结构，它从 **根部** 开始，然后扩展到 **枝叶**

## 一个 XML 文档范例

XML文档使用的是简单的具有自我描述性的语法

我们拿之间的小红写给小明的情书作为范例

```xml
<?xml version="1.0" encoding="UTF-8"?>  
<note>  
  <to>小明</to>  
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>   
```

是XML 声明，它规定了 XML 的版本（1.0）和所使用的编码 UTF-8 编码是当下最流行的编码格式，又称万国码, 可显示各种语言文字

`` 描述文档的 **根元素** ，就像在说："本文档是一个便签"

接下来 4 行描述 根(note) 的 4 个 **子元素** (to, from, heading 以及 body )

```xml
<to>小明</to>  
<from>小红</from>
<heading>短信</heading>
<body>I miss you so much</body>
```

`` 最后一行定义根元素的结尾

XML具有出色的自我描述性，你同意吗？

## XML 文档是一种树型结构

XML文档必须包含 **根元素**，作为所有其它元素的父元素

XML文档中的元素形成了一棵文档树，这棵树从根部开始，并扩展到树的最底端

所有的元素都可以有子元素

```xml
<root>
    <child>
        <subchild>.....</subchild>
    </child>
</root>
```

> 书写 XML 时，父、子元素之间一般用 4 个空格缩进以显示层级关系

父、子以及同胞等术语用于描述元素之间的关系:

**1、** 父元素拥有子元素；

**2、** 相同层级上的子元素成为同胞（兄弟或姐妹；

所有的元素都可以有文本内容和属性 (类似 HTML 的标签)

### 范例

上图表示的书店、书、章节之间的关系可以用 XML 表示如下

#### bookstore.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)-->
<!-- Copyright © 2015-2065 www.ddkk.com. All rights reserved. -->
<bookstore>
    <book category="COOKING">
        <title lang="en">Everyday Italian</title>
        <author>Giada De Laurentiis</author>
        <year>2005</year>
        <price>30.00</price>
    </book>
    <book category="CHILDREN">
        <title lang="en">Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
    </book>
        <book category="WEB">
        <title lang="en">Learning XML</title>
        <author>Erik T. Ray</author>
        <year>2003</year>
        <price>39.95</price>
    </book>
</bookstore>
```

XML文档 **bookstore.xml** 的根元素是 ``

文档中的所有 `` 元素都被包含在 `` 中

`` 元素有 4 个子元素：``、``、``、``
