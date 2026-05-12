# 07、JSON 编码 JSON.stringify()
- 来源：https://ddkk.com/zhuanlan/other/json/7.html
- 分类：JSON 教程
- 分组：教程目录
JSON 通常用于与服务端交换数据

向服务器发送数据时一般是字符串

可以使用 JSON.stringify() 方法将 JavaScript 对象转换为字符串

### 语法

```java
JSON.stringify(value[, replacer[, space]])
```

**参数说明：**

- **value:** 必需， 一个有效的 JSON 字符串
- **replacer:** 可选，用于转换结果的函数或数组
- 如果 replacer 为函数，则 JSON.stringify 将调用该函数，并传入每个成员的键和值使用返回值而不是原始值

如果此函数返回 undefined，则排除成员，根对象的键是一个空字符串：""

- 如果 replacer 是一个数组，则仅转换该数组中具有键值的成员

成员的转换顺序与键在数组中的顺序一样

当 value 参数也为数组时，将忽略 replacer 数组。
- **space:** 可选，文本添加缩进、空格和换行符，如果 space 是一个数字，则返回值文本在每个级别缩进指定数目的空格，如 space 大于 10，则文本缩进 10 个空格

space 有可以使用非数字，如：\t

## JavaScript 对象转换

假设我们有以下数据想要发送给服务器

```java
var obj = { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":10000, "site":"www.ddkk.com" }
```

先使用JSON.stringify() 方法处理以上数据，将其转换为字符串

```java
var json_str = JSON.stringify(obj);
```

json_str 为字符串

我们可以将 json_str 发送到服务器

```java
var obj = { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":10000, "site":"www.ddkk.com" }
var json_str = JSON.stringify(obj);
document.getElementById("demo").innerHTML = json_str;
```

## JavaScript 数组转换

可以将JavaScript 数组转换为 JSON 字符串

```java
var arr = [ "腾讯", "百度", "DDKK.COM 弟弟快看，程序员编程资料站","阿里巴巴" ];
var json_str = JSON.stringify(arr);
```

json_str 为字符串

可以将json_str 发送到服务器

```java
var arr = [ "腾讯", "百度", "DDKK.COM 弟弟快看，程序员编程资料站","阿里巴巴" ];
var json_str = JSON.stringify(arr);
document.getElementById("demo").innerHTML = json_str;
```

## 异常

### 解析数据

JSON 不能存储 Date 对象

JSON.stringify() 会将所有日期转换为字符串

```java
var obj = { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "initDate":new Date(), "site":"www.ddkk.com"};
var json_str = JSON.stringify(obj);
document.getElementById("demo").innerHTML = json_str;
```

之后就可以再将字符串转换为 Date 对象

## 解析函数

JSON 不允许包含函数

JSON.stringify() 会删除 JavaScript 对象的函数，包括 key 和 value

```java
var obj = { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":function () {return 10000;}, "site":"www.ddkk.com"};
var json_str = JSON.stringify(obj);
document.getElementById("demo").innerHTML = json_str;
```

我们可以在执行 JSON.stringify() 函数前将函数转换为字符串来避免以上问题的发生

```java
var obj = { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":function () {return 10000;}, "site":"www.ddkk.com"};
obj.alexa = obj.alexa.toString();
var json_str = JSON.stringify(obj);
document.getElementById("demo").innerHTML = json_str;
```

> 不建议在 JSON 中使用函数

## 浏览器支持

主流浏览器都支持 JSON.stringify() 函数

- Firefox 3.5
- Internet Explorer 8
- Chrome
- Opera 10
- Safari 4
