# 02、XLink以及 XPointer 简介
- 来源：https://ddkk.com/zhuanlan/xml/xlink/2.html
- 分类：XML语言教程
- 分组：教程目录
**XLink** 标准定义了如何在 XML 文档中创建**超级链接**

**XPointer** 则允许这些超级链接指向 XML 文档中的更多具体部分

## 您应当具备的基础知识

在继续学习之前，我们希望你对以下知识点有基本的了解：

- HTML / HTML5
- XML / XML 命名空间
- XPath

如果你先学习本教程，可能会看的一头雾水

但如果你对以上知识有过基础的了解，那么本教程会加深你对 HTML 和 XML 的理解

> 学会 XLink和 XPointer 不能帮你找到工作，不过可以提高你的技术见解

## XLink是什么？

- XLink是 XML 链接语言（XML Linking Language）的缩写
- XLink是用于在 XML 文档中创建超级链接的语言
- XLink类似于 HTML 链接 - 但是更为强大
- XML 文档中的任何元素均可成为 XLink
- XLink支持简易链接，也支持可将多重资源链接在一起的扩展链接
- 通过 XLink，链接可在被链接文件外进行定义
- XLink是 W3C 推荐标准

## XPointer 是什么 ？

- XPointer 是 XML 指针文件（XML Pointer Language）的缩写
- XPointer 使超级链接可以指向 XML 文档中更多具体的部分
- XPointer 使用 XPath 表达式在 XML 文档中进行定位
- XPointer 是 W3C 推荐标准

## XLink和 XPointer 是 W3C 标准

**1、** XLink于2001年6月27日，被确立为W3C推荐标准；

**2、** XPointer于2003年3月25日成为W3C推荐标准；

## XLink和 XPointer 的浏览器支持

浏览器只在最小限度内支持 XLink和 XPointer

在Mozilla 0.98+、Netscape 6.02+ 以及 Internet Explorer 6.0 中，均具有对 XLink某种程度的支持。更早版本的浏览器根本不支持 XLink

> 也就是自 2017 年七夕节开始的今天，你可以放心，当然，浏览器支持的功能还是少的可怜
