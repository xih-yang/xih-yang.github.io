# 21、服务器上的 XML
- 来源：https://ddkk.com/zhuanlan/xml/xml/21.html
- 分类：其他语言
- 分组：教程目录
XML文件是类似 HTML 文件的纯文本文件

XML能够通过标准的 WEB 服务器轻松地存储和生成

### 在服务器上存储 XML 文件

XML文件在 Internet 服务器上进行存储的方式与 HTML 文件完全相同

启动Windows 记事本，并写入以下内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

然后用适当的文件名，比如 note.xml，在 WEB 服务器上保存这个文件

### 通过 ASP 生成 XML

ASP可在不安装任何 XML 软件的情况输出 XML

从服务器生成 XML 响应，只需简单地把以下代码并在 Web 服务器上把它保存为一个 ASP 文件：

```xml
<% 
    response.ContentType="text/xml"
    response.Write("<?xml version='1.0' encoding='UTF-8'?>")
    response.Write("<note>")
    response.Write("<from>小红</from>")
    response.Write("<to>小明</to>")
    response.Write("<heading>短信</heading>")
    response.Write("<body>I miss you so much</body>")
    response.Write("</note>")
%>
```

响应头部的内容类型必须设置为 "text/xml"

查看这个 ASP 文件如何从服务器返回

### 通过 PHP 生成 XML

PHP也可以生成 XML 响应

```xml
<?php 
header( "Content-type: text/xml" );
echo "<?xml version='1.0' encoding='UTF-8'?>";  
echo "<note>";
echo "<from>小红</from>";
echo "<to>小明</to>";
echo "<heading>短信</heading>";
echo "<body>I miss you so much</body>";
echo "</note>";
```

响应头部的内容类型必须设置为 "text/xml"

查看这个 PHP 文件如何从服务器返回

如果想要深入学习 PHP，请移步我们的 PHP 基础教程

## 从数据库生成 XML

XML可在不安装任何 XML 软件的情况下从数据库生成。

从服务器生成 XML 响应，只需简单地把以下代码并在 Web 服务器上把它保存为一个 ASP 文件：

```xml
<%
    response.ContentType = "text/xml"  
    set conn      = Server.CreateObject("ADODB.Connection")
    conn.provider = "Microsoft.Jet.OLEDB.4.0;"
    conn.open
    server.mappath("/db/database.mdb")
    sql    = "select fname,lname from tblGuestBook"
    set rs = Conn.Execute(sql)
    response.write("<?xml version='1.0' encoding='UTF-8'?>")
    response.write("<guestbook>")
    while (not rs.EOF)
        response.write("<guest>")
        response.write("<fname>" & rs("fname") & "</fname>")
        response.write("<lname>" & rs("lname") & "</lname>")
        response.write("</guest>")
        rs.MoveNext()
    end
    rs.close()
    conn.close()
    response.write("</guestbook>")
%>
```

响应头部的内容类型必须设置为 "text/xml"

查看以上 ASP 文件的实际数据库输出

上面的范例使用了带有 ADO 的 ASP

如果想要学习 ASP 和 ADO，请在我们的 首页 查找相关教程

### 在服务器上通过 XSLT 转换 XML

下面的ASP 代码在服务器上把 XML 文件转换为 HTML5：

```xml
<%
    'Load XML
    set xml    = Server.CreateObject("Microsoft.XMLDOM")
    xml.async  = falsexml.load(Server.MapPath("simple.xml"))
    'Load XSL
    set xsl    = Server.CreateObject("Microsoft.XMLDOM")
    xsl.async  = false
    xsl.load(Server.MapPath("simple.xsl"))
    'Transform file
    Response.Write(xml.transformNode(xsl))
%>
```

范例解析

**1、** 第一个代码块创建微软XML解析器的实例（XMLDOM），并把XML文件载入内存；

**2、** 第二个代码块创建解析器的另一个实例，并把XSL文件载入内存；

**3、** 最后一个代码使用XSL文档来转换XML文档，并把结果以HTML发送到您的浏览器；

看看上面的代码怎么运行

## 通过 ASP 把 XML 保存为文件

这个ASP 实例会创建一个简单的 XML 文档，并把该文档保存到服务器上：

```xml
<%
    text = "<note>"
    text = text & "<to>小明</to>"
    text = text & "<from>小红</from>"
    text = text & "<heading>短信</heading>"
    text = text & "<body>I miss you so much</body>"
    text = text & "</note>"
    set xmlDoc=Server.CreateObject("Microsoft.XMLDOM")
    xmlDoc.async=false
    xmlDoc.loadXML(text)
    xmlDoc.Save("test.xml")
%>
```
