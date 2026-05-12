# 05、JSON 数组
- 来源：https://ddkk.com/zhuanlan/other/json/5.html
- 分类：JSON 教程
- 分组：教程目录
JSON 数组在中括号 ( [] ) 中书写

JSON 数组值必须是合法的 JSON 数据类型 ( 字符串, 数字, 对象, 数组, 布尔值或 null )

JavaScript 中，数组值可以是以上的 JSON 数据类型，也可以是 JavaScript 的表达式，包括函数，日期，及 *undefined*

### JSON 数组图示

### JSON 数组语法格式

```java
[ "腾讯", "百度", "DDKK.COM 弟弟快看，程序员编程资料站","阿里巴巴" ]
```

## JSON 对象中的数组

对象属性的值可以是一个数组

```java
{
    "name":"公司",
    "num":4,
    "sites":[ "腾讯", "百度", "DDKK.COM 弟弟快看，程序员编程资料站","阿里巴巴" ]
}
```

可以使用索引值来访问数组

```java
x = myObj.sites[0];
```

## 循环数组

可以使用 for-in 来访问数组

```java
for (i in myObj.sites) {
    x += myObj.sites[i] + "<br>";
}
```

可以使用 for 循环来访问数组

```java
for (i = 0; i < myObj.sites.length; i++) {
    x += myObj.sites[i] + "<br>";
}
```

## 嵌套 JSON 对象中的数组

JSON 对象中数组可以包含另外一个数组，或者另外一个 JSON 对象

```java
myObj = {
    "name":"公司",
    "num":4,
    "sites": [
        { "name":"百度", "info":[ "百度搜索", "百度地图", "百度百科" ] },
        { "name":"DDKK.COM 弟弟快看，程序员编程资料站", "info":[ "DDKK.COM 弟弟快看，程序员编程资料站", "DDKK.COM 弟弟快看，程序员编程资料站" ] },
        { "name":"阿里巴巴", "info":[ "淘宝", "天猫","支付宝" ] }
    ]
}
```

可以使用 for-in 来循环访问每个数组

```java
for (i in myObj.sites) {
    x += "<h1>" + myObj.sites[i].name + "</h1>";
    for (j in myObj.sites[i].info) {
        x += myObj.sites[i].info[j] + "<br>";
    }
}
```

## 修改数组值

可以使用索引值来修改数组值

```java
myObj.sites[1] = "Github";
```

## 删除数组元素

可以使用 **delete** 关键字来删除数组元素

```java
delete myObj.sites[1];
```
