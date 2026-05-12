# 11、使用 CSS 显示 XML
- 来源：https://ddkk.com/zhuanlan/xml/xml/11.html
- 分类：其他语言
- 分组：教程目录
使用CSS（Cascading Style Sheets 层叠样式表）可以添加显示信息到 XML 文档中

## 使用 CSS 显示 XML？

使用CSS 来格式化 XML 文档是有可能的

下面的范例就是关于如何使用 CSS 样式表来格式化 XML 文档

请看这个 XML 文件： CD 目录

然后看这个样式表： CSS 文件

最后，请查看： 使用 CSS 文件格式化的 CD 目录

下面是XML 文件的一小部分，第二行把 XML 文件链接到 CSS 文件

```xml
<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/css" href="cd_catalog.css"?>
<CATALOG>
    <CD>
        <TITLE>Empire Burlesque</TITLE>
        <ARTIST>Bob Dylan</ARTIST>
        <COUNTRY>USA</COUNTRY>
        <COMPANY>Columbia</COMPANY>
        <PRICE>10.90</PRICE>
        <YEAR>1985</YEAR>
    </CD>
    <CD>
        <TITLE>Hide your heart</TITLE>
        <ARTIST>Bonnie Tyler</ARTIST>
        <COUNTRY>UK</COUNTRY>
        <COMPANY>CBS Records</COMPANY>
        <PRICE>9.90</PRICE>
        <YEAR>1988</YEAR>
    </CD>
    ...
</CATALOG>
```

使用CSS 格式化 XML 不是常用的方法

W3C推荐使用 XSLT
