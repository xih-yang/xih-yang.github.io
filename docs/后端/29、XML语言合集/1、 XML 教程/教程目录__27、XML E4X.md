# 27、XML E4X
- 来源：https://ddkk.com/zhuanlan/xml/xml/27.html
- 分类：其他语言
- 分组：教程目录
E4X向 JavaScript 添加了对 XML 的直接支持

### E4X 范例

```xml
var employees=
<employees>
<person>
    <name>Tove</name>
    <age>32</age>
</person>
<person>
    <name>Jani</name>
    <age>26</age>
</person>
</employees>;
document.write(employees.person.(name == "Tove").age)
```

**这个范例仅适用于 Firefox！**

### 作为一个 JavaScript 对象的 XML

E4X是正式的 JavaScript 标准，增加了对 XML 的直接支持

通过E4X，可以用声明 Date 或 Array 对象变量的方式声明 XML 对象变量

```xml
var x = new XML()
var y = new Date()
var z = new Array()
```

### E4X 是一个 ECMAScript（JavaScript）标准

ECMAScript 是 JavaScript 的正式名称。ECMA-262（JavaScript 1.3）是在 1999 年 12 月标准化的

E4X是 JavaScript 的扩展，增加了对 XML 的直接支持。ECMA-357（E4X）是在 2004 年 6 月标准化的

ECMA 组织（成立于 1961 年），是专门用于信息和通信技术（ICT）和消费电子（CE）的标准化

ECMA 制定的标准有

**1、** JavaScript；

2. C# 语言
**3、** 国际字符集；

**4、** 光盘；

**5、** 磁带；

**6、** 数据压缩；

**7、** 数据通信；

**8、** ...；

### 不使用 E4X

下面的范例是一个跨浏览器的，它加载一个现有的 XML 文档 ( "note.xml" ) 到 XML 解析器，并显示消息说明

```xml
var xmlDoc;
//code for Internet Explorer
if (window.ActiveXObject)
{
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async=false;
    xmlDoc.load("/static/media/note.xml");
    displaymessage();
}
// code for Mozilla, Firefox, etc.
else (document.implementation && document.implementation.createDocument)
{
    xmlDoc= document.implementation.createDocument("","",null);
    xmlDoc.load("note.xml");
    xmlDoc.onload=displaymessage;
}
function displaymessage()
{
    document.write(xmlDoc.getElementsByTagName("body")[0].firstChild.nodeValue);
}
```

### 使用 E4X

下面的范例和上面的相同，但是使用了 E4X

```xml
var xmlDoc=new XML();xmlDoc.load("note.xml");document.write(xmlDoc.body);
```

简单多了，是不是？

### 浏览器支持

**Firefox** 是目前唯一对 E4X 的支持比较好的浏览器

目前还没有支持 E4X 的有 **Opera** 、 **Chrome** 或 **Safari**

到目前为止，没有迹象显示在 **Internet Explorer** 中对 E4X 的支持

### E4X 的未来

E4X没有未来

E4X没有得到广泛的支持。也许它提供的实用功能太少，尚未被其他的解决方案涉及

**1、** 对于完整的XML处理，可以学习XMLDOM和XPath；

**2、** 对于访问XMLHttpRequests，JSON是首选的格式；

**3、** 对于简单的文档处理JQuery选择更容易；
