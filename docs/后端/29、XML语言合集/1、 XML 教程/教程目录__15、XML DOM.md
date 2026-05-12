# 15、XML DOM
- 来源：https://ddkk.com/zhuanlan/xml/xml/15.html
- 分类：其他语言
- 分组：教程目录
XMLDOM（Document Object Model 文档对象模型）定义了访问和操作文档的标准方法

XMLDOM 把 XML 文档作为树结构来查看

所有元素可以通过 DOM 树来访问。

可以修改或删除它们的内容，并创建新的元素。元素，它们的文本，以及它们的属性，都被认为是节点。

如果想要深入学习 XML DOM，请移步我们的 XML DOM 基础教程

## HTML DOM

HTML DOM 定义了访问和操作 HTML 文档的标准方法。

所有HTML 元素可以通过 HTML DOM 来访问。

如果想要深入学习 HTML DOM，请移步我们的 HTML DOM 基础教程

## 加载一个 XML 文件 - 跨浏览范例

下面的范例把 XML 文档 ( note.xml ) 解析到 XML DOM 对象中，然后通过 JavaScript 提取一些信息

```xml
<html>
<meta charset="utf-8"/>
<body>
<h1>DDKK.COM 弟弟快看，程序员编程资料站 Internal Note</h1>
<div>
<b>To:</b> <span id="to"></span><br />
<b>From:</b> <span id="from"></span><br />
<b>Message:</b> <span id="message"></span>
</div>
<script>
if (window.XMLHttpRequest)
{
  xmlhttp=new XMLHttpRequest();
}
xmlhttp.open("GET","/static/media/note.xml",false);
xmlhttp.send();
xmlDoc=xmlhttp.responseXML;
document.getElementById("to").innerHTML=
xmlDoc.getElementsByTagName("to")[0].childNodes[0].nodeValue;
document.getElementById("from").innerHTML=
xmlDoc.getElementsByTagName("from")[0].childNodes[0].nodeValue;
document.getElementById("message").innerHTML=
xmlDoc.getElementsByTagName("body")[0].childNodes[0].nodeValue;
</script>
</body>
</html>
```

## 重要！

如需从上面的 XML 文件（"note.xml"）的 `` 元素中提取文本 "小明"，语法是：

```xml
getElementsByTagName("to")[0].childNodes[0].nodeValue
```

注意，即使 XML 文件只包含一个 `` 元素，仍然必须指定数组索引 [0]。 这是因为 getElementsByTagName() 方法返回一个数组

## 加载一个 XML 字符串 - 跨浏览器范例

下面的范例把 XML 字符串解析到 XML DOM 对象中，然后通过 JavaScript 提取一些信息：

```xml
<html>
<meta charset="utf-8"/>
<body>
<h1>DDKK.COM 弟弟快看，程序员编程资料站 Internal Note</h1>
<div>
<b>To:</b> <span id="to"></span><br />
<b>From:</b> <span id="from"></span><br />
<b>Message:</b> <span id="message"></span>
</div>
<script>
txt="<note>";
txt=txt+"<to>小明</to>";
txt=txt+"<from>小红</from>";
txt=txt+"<heading>短信</heading>";
txt=txt+"<body>I miss you so much!</body>";
txt=txt+"</note>";
if (window.DOMParser)
  {
  parser=new DOMParser();
  xmlDoc=parser.parseFromString(txt,"text/xml");
  }
else // Internet Explorer
  {
  xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
  xmlDoc.async=false;
  xmlDoc.loadXML(txt);
  }
document.getElementById("to").innerHTML=
xmlDoc.getElementsByTagName("to")[0].childNodes[0].nodeValue;
document.getElementById("from").innerHTML=
xmlDoc.getElementsByTagName("from")[0].childNodes[0].nodeValue;
document.getElementById("message").innerHTML=
xmlDoc.getElementsByTagName("body")[0].childNodes[0].nodeValue;
</script>
</body>
</html>
```
