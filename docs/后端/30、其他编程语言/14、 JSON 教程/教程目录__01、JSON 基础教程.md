# 01、JSON 基础教程
- 来源：https://ddkk.com/zhuanlan/other/json/1.html
- 分类：JSON 教程
- 分组：教程目录
JSON 全称 (**J** ava **S** cript **O** bject **N** otation )，中文名 **JavaScript 对象表示方法**

JSON 是存储和交换文本信息的语法，类似 XML，但比 XML 更流行

因为JSON 比 XML 更小、更快，更易解析

## JSON 范例

#### sites.json

```java
{
    "sites": [
        { "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" }, 
        { "name":"阿里巴巴" , "url":"www.taobao.com"}, 
        { "name":"腾讯" ,     "url":"www.qq.com" }
    ]
}
```

这个sites 对象是包含 3 个站点记录的数组

## 什么是 JSON ？

**1、** JSON指的是JavaScript对象表示法（**J**ava**S**cript**O**bject**N**otation）；

**2、** JSON是轻量级的文本数据交换格式；

**3、** JSON独立于语言：JSON使用JavaScript语法来描述数据对象，但是JSON仍然独立于语言和平台，JSON解析器和JSON库支持许多不同的编程语言；

**4、** JSON具有自我描述性，更易理解；

**5、** 目前主流的编程语言（PHP，JSP，.NET）都支持JSON；

## JSON 转换为 JavaScript 对象

JSON 格式在语法上与创建 JavaScript 对象的代码相同

因此，不需要额外的解析器，JavaScript 程序就能够 eval() 函数生成 JavaScript 对象
