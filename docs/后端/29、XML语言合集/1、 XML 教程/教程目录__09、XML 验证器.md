# 09、XML 验证器
- 来源：https://ddkk.com/zhuanlan/xml/xml/9.html
- 分类：其他语言
- 分组：教程目录
接下来我们开发一个 XML 验证器来对 XML 文件进行语法检查

## XML 错误会终止我们的程序

XML文档中的错误会终止我们的 XML 应用程序

W3C的 XML 规范声明：

```xml
如果 XML 文档存在错误，那么程序就不应当继续处理这个文档
```

理由是，XML 软件应当轻巧，快速，具有良好的兼容性

如果使用 HTML，创建包含大量错误的文档是有可能的（比如忘记了结束标签 其中一个原因是 HTML

```xml
浏览器相当臃肿，兼容性也很差，并且它们有自己的方式来确定当发现错误时文档应该显示为什么样子
```

**使用 XML 时，这种情况不应当存在**

> 规范是规范，当 XML 发生错误时，大多数应用程序是不能终止程序的，这是服务的精髓之一，必须要有强大的容错能力

## 对 XML 进行语法检查

为了以后方便对 XML 进行语法检查，我们接下来将要创建一个 XML 验证器

只要把XML 粘贴到下面的文本框中，然后点击 "验证" 按钮来进行语法检查

语法正确的 XML 文档

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
    <to>小明</to>
    <from>小红</from>
    <heading>短信</heading>
    <body>I miss you so much</body>
</note>
```

语法错误 XML 文档

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
    <to>小明</to>
    <from>小红</Ffrom>
    <heading>短信</heading>
    <body>I miss you so much</body>
</note>
```

> 只会检查 XML 是否"形式良好"。如果想根据 DTD 来验证 XML，请参阅此页面上的最后一段

## 根据 DTD 来验证 XML

如果你的浏览器是 **Internet Explorer** ，则可以在下面的文本区域中根据 DTD 验证你的 XML

只要把DOCTYPE 声明（带有 DTD）添加到您的 XML 中 `` 元素后，然后点击"验证"按钮即可：

```xml
<?xml version="1.0" ?>
<!DOCTYPE note [
        <!ELEMENT note (to,from,heading,body)>
        <!ELEMENT to      (#PCDATA)>
        <!ELEMENT from    (#PCDATA)>
        <!ELEMENT heading (#PCDATA)>
        <!ELEMENT body    (#PCDATA)>
        ]>
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <message>Don't forget me this weekend!</message>
</note>
```
