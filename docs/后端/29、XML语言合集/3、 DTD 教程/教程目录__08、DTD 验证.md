# 08、DTD 验证
- 来源：https://ddkk.com/zhuanlan/xml/dtd/8.html
- 分类：XML语言教程
- 分组：教程目录
现代浏览器都内置了可根据某个 DTD 来验证 XML 是否合规的功能

## 通过 XML 解析器进行验证

当我们试图打开某个 XML 文档时，XML 解析器有可能会产生错误。通过访问 parseError 对象，就可以得到引起错误的确切代码、文本甚至所在的行

> load() 方法用于加载文件，而 loadXML() 方法用来加载字符串

```xml
<h3>This demonstrates a parser error:</h3>
<script>
var xmldoc = null;
function loadxml(filename)
{
    if (window.ActiveXObject) {
        xmldoc = new ActiveXObject("Microsoft.XMLDOM");
        xmldoc.async = false;
        xmlDoc.validateOnParse="true"
        xmldoc.load(filename);
    }
    else if (document.implementation && document.implementation.createDocument)
    {
        var xmlhttp = new window.XMLHttpRequest();
        xmlhttp.open("get", filename, false);
        xmlhttp.send(null);
        var parser = new DOMParser();
        var xmldoc = parser.parseFromString(xmlhttp.responseText, "application/xml");
        console.log(xmldoc.parseError);
    } else {
        xmldoc = null;
    }
    return xmldoc;
}
xmldoc = loadxml("/static/exam/dtde/note_dtd_error.xml")
document.write("<br />Error Code: ")
document.write(xmldoc.parseError.errorCode)
document.write("<br />Error Reason: ")
document.write(xmldoc.parseError.reason)
document.write("<br />Error Line: ")
document.write(xmldoc.parseError.line)
</script>
```

> 建议使用 Internet Explorer 浏览器测试，webkit 类浏览器还没找到解决方案

查看 note_dtd_error XML 文件

## 关闭验证

通过把XML 解析器的 validateOnParse 设置为 "false"，就可以关闭验证。

```xml
<h3>This demonstrates a parser error:</h3>
<script>
var xmldoc = null;
function loadxml(filename)
{
    if (window.ActiveXObject) {
        xmldoc = new ActiveXObject("Microsoft.XMLDOM");
        xmldoc.async = false;
        xmlDoc.validateOnParse="false"
        xmldoc.load(filename);
    }
    else if (document.implementation && document.implementation.createDocument)
    {
        var xmlhttp = new window.XMLHttpRequest();
        xmlhttp.open("get", filename, false);
        xmlhttp.send(null);
        var parser = new DOMParser();
        var xmldoc = parser.parseFromString(xmlhttp.responseText, "application/xml");
        console.log(xmldoc.parseError);
    } else {
        xmldoc = null;
    }
    return xmldoc;
}
xmldoc = loadxml("/static/exam/dtde/note_dtd_error.xml")
document.write("<br />Error Code: ")
document.write(xmldoc.parseError.errorCode)
document.write("<br />Error Reason: ")
document.write(xmldoc.parseError.reason)
document.write("<br />Error Line: ")
document.write(xmldoc.parseError.line)
</script>
```

> 建议使用 Internet Explorer 浏览器测试，webkit 类浏览器还没找到解决方案

查看 note_dtd_error XML 文件

## 通用的 XML 验证器

你可以使用 [XML 验证器](http://xmlgrid.net/validator.html) 验证任何 XML 文件

## parseError 对象

可以在我们的《XML DOM 教程》中阅读更多有关 parseError 对象的信息
