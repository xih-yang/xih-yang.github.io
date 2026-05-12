# 03、JSON 语法
- 来源：https://ddkk.com/zhuanlan/other/json/3.html
- 分类：JSON 教程
- 分组：教程目录
JSON 语法是 JavaScript 语法的子集

## JSON 语法规则

JSON 语法是 JavaScript 对象表示法语法的子集

**1、** 数据在名称/值对中；

**2、** 数据由逗号分隔；

**3、** 大括号保存对象；

**4、** 中括号保存数组；

## JSON 键/值对

JSON 数据的书写格式是：键/值对

键/值对包括字段名称（在双引号中），后面写一个冒号，然后是值

```java
"name" : "DDKK.COM 弟弟快看，程序员编程资料站"
```

等价于这条 JavaScript 语句

```java
name = "DDKK.COM 弟弟快看，程序员编程资料站"
```

> 在JavaScript 中，键的双引号可以省略，但其它语言中是不可以的

## JSON 值

JSON 值可以是

**1、** 数字（整数或浮点数）；

**2、** 字符串（在双引号中）；

**3、** 逻辑值（true或false）；

**4、** 数组（在中括号中）；

**5、** 对象（在大括号中）；

**6、** null；

### 图示

## JSON 数字

JSON 数字可以是整型或者浮点型

```java
{ "age":30 }
```

### 图示

## JSON 对象

JSON 对象和 JavaScript 对象一样，在大括号 ( {} ) 中书写

JSON 对象可以包含多个名称/值对

```java
{ "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" }
```

### 图示

## JSON 数组

JSON 数组和 JavaScript 数组一样，用中括号括起来

JSON 数组可包含多个对象或者多个其它数组

```java
{
    "sites": [
        { "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" }, 
        { "name":"阿里巴巴" , "url":"www.taobao.com" }, 
        { "name":"腾讯" ,     "url":"www.qq.com" }
    ]
}
```

对象"sites" 是包含三个对象的数组

每个对象代表一条关于某个网站（name、url）的记录

### 图示

## JSON 布尔值

JSON 布尔值可以是 true 或者 false

```java
{ "flag":true }
```

## JSON null

JSON 可以设置值为 null

```java
{ "ddkk":null }
```

## JSON 使用 JavaScript 语法

因为JSON 使用 JavaScript 语法，所以 JavaScript 无需额外的依赖就能处理 JSON

可以使用 JavaScript 创建一个对象数组，并像这样进行赋值

```java
var sites = [
    { "name":"DDKK.COM 弟弟快看，程序员编程资料站" , "url":"www.ddkk.com" }, 
    { "name":"阿里巴巴" , "url":"www.taobao.com" }, 
    { "name":"腾讯" ,     "url":"www.qq.com" }
];
```

可以像下面这样访问 JavaScript 对象数组中的第一项 (索引从 0 开始 )

```java
sites[0].name;
```

返回的内容是：DDKK.COM 弟弟快看，程序员编程资料站

然后可以像下面这样修改数据

```java
sites[0].name="DDKK.COM 弟弟快看，程序员编程资料站";
```

## JSON 文件

JSON 文件的扩展名是 .json

JSON 的 MIME 类型是 application/json

接下来的一章，我们将学习如何把 JSON 文本转换为 JavaScript 对象
