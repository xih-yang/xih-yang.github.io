# 16、HTML 页面显示 XML 数据
- 来源：https://ddkk.com/zhuanlan/xml/xml/16.html
- 分类：其他语言
- 分组：教程目录
接下来的范例，我们打开一个 XML 文件 ( "cd_catalog.xml" )，然后遍历每个 CD 元素，并显示 HTML 表格中的 ARTIST 元素和 TITLE 元素的值：

```xml
<html>
<body>
<script>
if (window.XMLHttpRequest)
{
  xmlhttp=new XMLHttpRequest();
}
xmlhttp.open("GET","/static/media/cd_catalog.xml",false);
xmlhttp.send();
xmlDoc=xmlhttp.responseXML; 
document.write("<table border='1'>");
var x=xmlDoc.getElementsByTagName("CD");
for (i=0;i<x.length;i++)
  { 
  document.write("<tr><td>");
  document.write(x[i].getElementsByTagName("ARTIST")[0].childNodes[0].nodeValue);
  document.write("</td><td>");
  document.write(x[i].getElementsByTagName("TITLE")[0].childNodes[0].nodeValue);
  document.write("</td></tr>");
  }
document.write("</table>");
</script>
</body>
</html>
```

如果想要深入学习 JavaScript 和 XML DOM ，请移步我们的 XML DOM 基础教程
