# 14、XML 解析器
- 来源：https://ddkk.com/zhuanlan/xml/xml/14.html
- 分类：其他语言
- 分组：教程目录
所有现代浏览器都有内建的 XML 解析器

XML解析器把 XML 文档转换为 XML DOM 对象 - 可通过 JavaScript 操作的对象

## 解析 XML 文档

下面的代码片段把 XML 文档解析到 XML DOM 对象中：

```xml
if (window.XMLHttpRequest)
{
    xmlhttp=new XMLHttpRequest();
}
xmlhttp.open("GET","/static/media/books.xml",false);
xmlhttp.send();
xmlDoc=xmlhttp.responseXML;
```

## 解析 XML 字符串

下面的代码片段把 XML 字符串解析到 XML DOM 对象中：

```xml
txt="<bookstore><book>";
txt=txt+"<title>Everyday Italian</title>";
txt=txt+"<author>Giada De Laurentiis</author>";
txt=txt+"<year>2005</year>";
txt=txt+"</book></bookstore>";
if (window.DOMParser){
    parser=new DOMParser();
    xmlDoc=parser.parseFromString(txt,"text/xml");
}else // Internet Explorer
{
    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async=false;
    xmlDoc.loadXML(txt);
}
```

#### 注意

> Internet Explorer 使用 loadXML() 方法来解析 XML 字符串，而其他浏览器使用 DOMParser 对象

## 跨域访问

出于安全方面的原因，现代的浏览器不允许跨域的访问。

这意味着，网页以及它试图加载的 XML 文件，都必须位于相同的服务器上
