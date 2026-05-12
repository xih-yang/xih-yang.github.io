# 05、XPointer 范例
- 来源：https://ddkk.com/zhuanlan/xml/xlink/5.html
- 分类：XML语言教程
- 分组：教程目录
在XLink和 XPointer 语法 章节，我们讲到可以在 xlink:href 属性中把 XPointer 部分添加到 URL 后面，这样就可以导航到文档中某个具体的位置

现在，让我们通过一个范例来学习一些基础的 XPointer 语法

## XPointer 范例

在本例中，我们会为您演示如何使用 XPointer 并结合 XLink来指向另外一个文档的某个具体的部分。

我们将通过研究目标 XML 文档开始（即我们要链接的那个文档）。

## 目标 XML 文档

假设存在一个名为 dogbreeds.xml 的 XML 文档，它列出了一些不同的狗种类：

```java
<?xml version="1.0" encoding="ISO-8859-1"?>
<dogbreeds>
<dog breed="Rottweiler" id="Rottweiler">
  <picture url="/static/i/rottweiler.gif" />
  <history>
  The Rottweiler's ancestors were probably Roman
  drover dogs.....
  </history>
  <temperament>
  Confident, bold, alert and imposing, the Rottweiler
  is a popular choice for its ability to protect....
  </temperament>
</dog>
<dog breed="FCRetriever" id="FCRetriever">
  <picture url="/static/i/fcretriever.gif" />
  <history>
  One of the earliest uses of retrieving dogs was to
  help fishermen retrieve fish from the water....
  </history>
  <temperament>
  The flat-coated retriever is a sweet, exuberant,
  lively dog that loves to play and retrieve....
  </temperament>
</dog>
</dogbreeds>
```

查看dogbreeds.xml

> info: 注释：上面的 XML 文档在每个我们需要链接的元素上使用了 id 属性！

## XML 链接文档

XPointer 不止能够链接到整个文档（当使用 XLink时），XPointer 还可以让您链接到文档的特定部分。

如需链接到页面的某个具体的部分，请在 xlink:href 属性中的 URL 后添加一个井号 (#) 以及一个 XPointer 表达式

表达式： #xpointer(id("Rottweiler")) 可引用目标文档中 id 值为 Rottweiler 的元素

因此，xlink:href 属性会类似这样:

```java
xlink:href="http://dog.com/dogbreeds.xml#xpointer(id('Rottweiler'))"
```

当然，当使用 id 链接到某个元素时，XPointer 允许简写形式。您可以直接使用 id 的值，就像这样:

```java
xlink:href="http://dog.com/dogbreeds.xml#Rottweiler"
```

下面的XML 文档可引用每条狗的品种信息，均通过 XLink和 XPointer 来引用：

```java
<?xml version="1.0" encoding="UTF-8" ?>
<mydogs xmlns:xlink="http://www.w3.org/1999/xlink">
  <mydog 
    xlink:type="simple"
    xlink:href="/static/media/dogbreeds.xml#Rottweiler">
    <description 
      xlink:type="simple"
      xlink:href="/static/i/mydogs/anton.gif">
  Anton is my favorite dog. He has won a lot of.....
  </description>
</mydog>
<mydog 
  xlink:type="simple"  
  xlink:href="/static/media/dogbreeds.xml#FCRetriever">`
  <description xlink:type="simple"
  xlink:href="/static/i/mydogs/pluto.gif">
  Pluto is the sweetest dog on earth......
  </description>
</mydog>
</mydogs>
```
