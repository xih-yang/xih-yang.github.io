# 08、JSON 使用范例
- 来源：https://ddkk.com/zhuanlan/other/json/8.html
- 分类：JSON 教程
- 分组：教程目录
JSON 是当下最流行的数据交换格式，简单轻便易使用

## 把 JSON 文本转换为 JavaScript 对象

JSON 最常见的用法之一，是从 web 服务器上读取 JSON 数据，然后将 JSON 数据转换为 JavaScript 对象，然后在网页中使用该数据

为了更简单地演示，我们使用字符串作为输入

### JSON 范例 ：来自字符串的对象

首先创建包含 JSON 语法的 JavaScript 字符串

```java
var json_str = '{ "sites" : [' +
    '{ "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" },' + 
    '{ "name":"阿里巴巴" , "url":"www.taobao.com" },' + 
    '{ "name":"腾讯" ,     "url":"www.qq.com" }]';
```

由于JSON 语法是 JavaScript 语法的子集，JavaScript 函数 eval() 可用于将 JSON 文本转换为 JavaScript 对象

eval() 函数使用的是 JavaScript 编译器，可解析 JSON 文本，然后生成 JavaScript 对象

必须把文本包围在括号中，这样才能避免语法错误

```java
var obj = eval ("(" + txt + ")");
```

在网页中使用 JavaScript 对象

```java
var json_str = '{ "sites" : [' +
    '{ "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" },' + 
    '{ "name":"阿里巴巴" , "url":"www.taobao.com" },' + 
    '{ "name":"腾讯" ,     "url":"www.qq.com" }]}';
var obj = eval ("(" + json_str + ")");
document.getElementById("name").innerHTML=obj.sites[0].name 
document.getElementById("url").innerHTML=obj.sites[0].url
```

## JSON 解析器

eval() 函数可编译并执行任何 JavaScript 代码，但这隐藏了一个潜在的安全问题

使用JSON 解析器将 JSON 转换为 JavaScript 对象是更安全的做法

JSON 解析器只能识别 JSON 文本，而不会编译脚本

在浏览器中，**eval()** 函数提供了原生的 JSON 支持，而且 JSON 解析器的速度更快

较新的浏览器和最新的 ECMAScript (JavaScript) 标准中均包含了原生的对 JSON 的支持。

Web 浏览器支持
Web 软件支持

Firefox (Mozilla) 3.5
Internet Explorer 8
Chrome
Opera 10
Safari 4
jQuery
Yahoo UI
Prototype
Dojo
ECMAScript 1.5

较老的浏览器，可使用 JavaScript 库 [https://github.com/douglascrockford/JSON-js](https://github.com/douglascrockford/JSON-js)

JSON 格式最初是 [originally specified by Douglas Crockford](http://developer.yahoo.com/yui/theater/video.php?v=crockford-json)
