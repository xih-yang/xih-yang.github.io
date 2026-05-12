# 23、XML 注意事项
- 来源：https://ddkk.com/zhuanlan/xml/xml/23.html
- 分类：其他语言
- 分组：教程目录
本章列出了我们日常使用 XML 时应该尽量避免使用的技术

## Internet Explorer - XML 数据岛

**它是什么？** XML 数据岛是嵌入到 HTML 页面中的 XML 数据

**为什么要避免使用它？** XML 数据岛只在 Internet Explorer 浏览器中有效

**用什么代替它？** 在 HTML 中使用 JavaScript 和 XML DOM 来解析并显示 XML

如果想学习有关 JavaScript 和 XML DOM 的信息，请移步我们的 XML DOM 基础教程

### XML 数据岛范例

范例使用 XML 文档 cd_catalog.xml

把XML 文档绑定到 HTML 文档中的一个 `` 标签 id 属性定义数据岛的标识符，而 src 属性指向 XML 文件

> 本范例只适用于 IE 浏览器

```xml
<html>
<body>
<xml id="cdcat" src="/static/media/cd_catalog.xml"></xml>
<table border="1" datasrc="#cdcat">   
<tr>
<td><span datafld="ARTIST"></span></td>  
<td><span datafld="TITLE"></span></td>
</tr>
</table>
</body>
</html>
```

`` 标签的 datasrc 属性把 HTML 表格绑定到 XML 数据岛

`` 标签允许 datafld 属性引用要显示的 XML 元素

在这个范例中，要引用的是 "ARTIST" 和 "TITLE" 当读取 XML 时，会为每个 `` 元素创建相应的表格行

## Internet Explorer - 行为

**它是什么？** Internet Explorer 5 引入了行为 行为是通过使用 CSS 样式向 XML （或 HTML ）元素添加行为的一种方法

**为什么要避免使用它？** 只有 Internet Explorer 支持 behavior 属性

**使用什么代替它？** 使用 JavaScript 和 XML DOM（或 HTML DOM）来代替它

### 范例 1 ：鼠标悬停突出

下面的HTML 文件中的 `` 元素为 `` 元素定义了一个行为

```xml
<html>
<head>
<style type="text/css">
h1 { behavior: url(/static/media/behave.htc) }
</style>
</head>
<body>
<h1>Mouse over me!!!</h1>
</body>
</html>
```

下面是XML 文档 "behave.htc" ( 该文件包含了一段 JavaScript 和针对元素的事件句柄 )

```xml
<attach for="element" event="onmouseover" handler="hig_lite" />
<attach for="element" event="onmouseout" handler="low_lite" />
<script>
function hig_lite()
{
element.style.color='red';
}
function low_lite()
{
element.style.color='blue';
}
</script>
```

## 范例 2 : 打字机模拟

下面的HTML 文件中的 `` 元素为 id 为 "typing" 的元素定义了一个行为

```xml
<html>
<head>
<style type="text/css">
#typing
{
behavior:url(/static/media/typing.htc);
font-family:'courier new';
}
</style>
</head>
<body>
<span id="typing" speed="100">IE5 introduced DHTML behaviors.
Behaviors are a way to add DHTML functionality to HTML elements
with the ease of CSS.<br /><br />How do behaviors work?<br />
By using XML we can Linkbehaviors to any element in a web page
and manipulate that element.</p>v
</span>
</body>
</html>
```

下面是XML 文档 "typing.htc"

```xml
<attach for="window" event="onload" handler="beginTyping" />
<method name="type" />
<script>
var i,text1,text2,textLength,t;
function beginTyping()
{
i=0;
text1=element.innerText;
textLength=text1.length;
element.innerText="";
text2="";
t=window.setInterval(element.id+".type()",speed);
}
function type()
{
text2=text2+text1.substring(i,i+1);
element.innerText=text2;
i=i+1;
if (i==textLength)
  {
  clearInterval(t);
  }
}
</script>
```
