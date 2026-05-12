# 22、XML DOM 高级
- 来源：https://ddkk.com/zhuanlan/xml/xml/22.html
- 分类：其他语言
- 分组：教程目录
之前的章节中，我们学习了 XML DOM，并使用了 XML DOM 的 getElementsByTagName() 方法从 XML 文档中取回数据

本章节我们将继续学习其它重要的 XML DOM 方法

如果要深入学习 XML DOM，请移步 XML DOM 基础教程

### 获取元素的值

下面的范例中使用的 XML 文件： books.xml

下面的范例检索第一个 `` 元素的文本值：

```xml
txt=xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
```

### 获取属性的值

下面的范例检索第一个 `` 元素的 "lang" 属性的文本值

```xml
txt=xmlDoc.getElementsByTagName("title")[0].getAttribute("lang");
```

### 改变元素的值

下面的范例改变第一个 `` 元素的文本值：

```xml
x=xmlDoc.getElementsByTagName("title")[0].childNodes[0];
x.nodeValue="Easy Cooking";
```

### 创建新的属性

XMLDOM 的 setAttribute() 方法可用于改变现有的属性值，或创建一个新的属性

下面的范例创建了新的属性（edition="first"），再把它添加到每一个 `` 元素中

```xml
x=xmlDoc.getElementsByTagName("book");
for(i=0;i<x.length;i++)
{
    x[i].setAttribute("edition","first");
}
```

## 创建元素

XMLDOM 的 createElement() 方法创建一个新的元素节点

XMLDOM 的 createTextNode() 方法创建一个新的文本节点

XMLDOM 的 appendChild() 方法向节点添加子节点 ( 在最后一个子节点之后 )

如需创建带有文本内容的新元素，需要同时创建元一个新的元素节点和一个新的文本节点，然后把它追加到现有的节点

下面的范例创建了一个新的元素 (``)，带有如下文本：First，然后把它添加到第一个 `` 元素

```xml
newel   = xmlDoc.createElement("edition");
newtext = xmlDoc.createTextNode("First");
newel.appendChild(newtext);
x       = xmlDoc.getElementsByTagName("book");
x[0].appendChild(newel);
```

范例解释

**1、** 创建一个``元素；

**2、** 创建值为"First"的文本节点；

**3、** 把这个文本节点追加到新的``元素；

**4、** 把``元素追加到第一个``元素；

## 删除元素

下面的范例删除第一个 `` 元素的第一个节点：

```xml
x = xmlDoc.getElementsByTagName("book")[0];
x.removeChild(x.childNodes[0]);
```

### 注意

上面范例的结果可能会根据所用的浏览器而不同。

Firefox 把新行字符当作空的文本节点 Internet Explorer 不是这样

如果想要深入了解 XML DOM，请移步我们的 XML DOM 教程
