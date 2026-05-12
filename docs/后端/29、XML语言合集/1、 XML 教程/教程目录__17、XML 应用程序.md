# 17、XML 应用程序
- 来源：https://ddkk.com/zhuanlan/xml/xml/17.html
- 分类：其他语言
- 分组：教程目录
这章节我们就来看看一些基于 XML, HTML, XML DOM 和 JavaScript 构建的小型 XML 应用程序

## XML 文档范例

在本应用程序中，我们将使用 " cd_catalog.xml " 文件

## 在 HTML div 元素中显示第一个 CD

下面的范例从第一个 CD 元素中获取 XML 数据，然后在 id="showCD" 的 HTML 元素中显示数据

displayCD() 函数在页面加载时调用

```xml
x=xmlDoc.getElementsByTagName("CD");
i=0;
function displayCD()
{
    artist=(x[i].getElementsByTagName("ARTIST")[0].childNodes[0].nodeValue);
    title=(x[i].getElementsByTagName("TITLE")[0].childNodes[0].nodeValue);
    year=(x[i].getElementsByTagName("YEAR")[0].childNodes[0].nodeValue);
    txt="Artist: " + artist + "<br />Title: " + title + "<br />Year: "+ year;
    document.getElementById("showCD").innerHTML=txt;
}
```

## 添加导航脚本

为了向上面的范例添加导航（功能），需要创建 next() 和 previous() 两个函数：

```xml
function next()
{ // display the next CD, unless you are on the last CD
if (i<x.length-1)
  {
  i++;
  displayCD();
  }
}
function previous()
{ // displays the previous CD, unless you are on the first CD 
if (i>0)
  {
  i--;
  displayCD();
  }
}
```

## 当点击 CD 时显示专辑信息

最后的范例展示如何在用户点击某个 CD 项目时显示专辑信息

如果想要深入学习使用 JavaScript 和 XML DOM，请访问我们的 XML DOM 基础教程
