# 06、JSON 解码 JSON.parse()
- 来源：https://ddkk.com/zhuanlan/other/json/6.html
- 分类：JSON 教程
- 分组：教程目录
JSON 流行于与服务端交换数据

客户端接收到的服务器数据时一般是字符串

可以使用 JSON.parse() 方法将数据转换为 JavaScript 对象

### 语法

```java
JSON.parse(text[, reviver])
```

#### 参数说明

- **text:** 必需， 一个有效的 JSON 字符串
- **reviver:** 可选，一个转换结果的函数， 将为对象的每个成员调用此函数

## JSON 解析范例

假设我们从服务器接收到以下数据

```java
{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":10000, "site":"www.ddkk.com" }
```

使用JSON.parse() 方法处理以上数据，将其转换为 JavaScript 对象

```java
var obj = JSON.parse('{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":10000, "site":"www.ddkk.com" }');
```

解析前要确保数据是标准的 JSON 格式，否则会解析出错

可以使用我们的在线工具检测： [JSON 在线监测工具](/t/penglei/json/)

解析完成后，我们就可以在网页上使用 JSON 数据

```java
<p id="demo"></p>
<script>
var obj = JSON.parse('{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":10000, "site":"www.ddkk.com" }');
document.getElementById("demo").innerHTML = obj.name + "：" + obj.site;
</script>
```

## 从服务接收 JSON 数据

可以使用 AJAX 从服务器请求 JSON 数据，并解析为 JavaScript 对象

```java
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        myObj = JSON.parse(this.responseText);
        document.getElementById("demo").innerHTML = myObj.name;
    }
};
xmlhttp.open("GET", "/r/show/penglei/json/json_demo", true);
xmlhttp.send();
```

查看服务端数据： json_demo

## 从服务端接收数组的 JSON 数据

如果从服务端接收的是数组的 JSON 数据，则 JSON.parse 会将其转换为 JavaScript 数组

```java
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        myArr = JSON.parse(this.responseText);
        document.getElementById("demo").innerHTML = myArr[1];
    }
};
xmlhttp.open("GET", "/r/show/penglei/json/json_demo_array", true);
xmlhttp.send();
```

查看服务端数据： json_demo_array

## 异常

### 解析数据

JSON 不能存储 Date 对象

如果需要存储 Date 对象，需要先将其转换为字符串

之后再将字符串转换为 Date 对象

```java
var text = '{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "initDate":"2017-8-8", "site":"www.ddkk.com"}';
var obj = JSON.parse(text);
obj.initDate = new Date(obj.initDate);
document.getElementById("demo").innerHTML = obj.name + "创建日期: " + obj.initDate;
```

使用JSON.parse 的第二个参数 reviver，一个转换结果的函数，对象的每个成员调用此函数

```java
var text = '{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "initDate":"2017-8-8", "site":"www.ddkk.com"}';
var obj = JSON.parse(text, function (key, value) {
    if (key == "initDate") {
        return new Date(value);
    } else {
        return value;
}});
document.getElementById("demo").innerHTML = obj.name + "创建日期：" + obj.initDate;
```

## 解析函数

JSON 不允许包含函数，但可以将函数作为字符串存储，之后再将字符串转换为函数

```java
var text = '{ "name":"DDKK.COM 弟弟快看，程序员编程资料站", "alexa":"function () {return 10000;}", "site":"www.ddkk.com"}';
var obj = JSON.parse(text);
obj.alexa = eval("(" + obj.alexa + ")");
document.getElementById("demo").innerHTML = obj.name + " Alexa 排名：" + obj.alexa();
```

> 不建议在 JSON 中使用函数

## 浏览器支持

主流浏览器都支持 JSON.parse() 函数：

- Firefox 3.5
- Internet Explorer 8
- Chrome
- Opera 10
- Safari 4
