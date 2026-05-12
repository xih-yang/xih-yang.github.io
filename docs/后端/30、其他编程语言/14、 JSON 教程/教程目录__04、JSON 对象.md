# 04、JSON 对象
- 来源：https://ddkk.com/zhuanlan/other/json/4.html
- 分类：JSON 教程
- 分组：教程目录
JSON 对象使用在大括号({})中书写

对象可以包含多个 **key/value（键/值）** 对

key必须是字符串，value 可以是合法的 JSON 数据类型（字符串, 数字, 对象, 数组, 布尔值或 null）

key和 value 中使用冒号(:)分割

每个key/value 对使用逗号(,)分割

### JSON 对象图示

### JSON 对象语法

```java
{ "name":"ddkk", "alexa":null, "site":"http://www.ddkk.com" }
```

## 访问对象值

**可以使用点号（.）来访问对象的值**

```java
var myObj, x;
myObj = { "name":"ddkk", "alexa":null, "site":"http://www.ddkk.com" };
x = myObj.name;
```

**可以使用中括号（[]）来访问对象的值**

```java
var myObj, x;
myObj = { "name":"ddkk", "alexa":null, "site":"http://www.ddkk.com" };;
x = myObj["name"];
```

## 循环对象

可以使用 for-in 来循环对象的属性

```java
var myObj = { "name":"ddkk", "alexa":null, "site":"http://www.ddkk.com" };
for (x in myObj) {
    document.getElementById("demo").innerHTML += x + "<br>";
}
```

在for-in 循环对象的属性时，使用中括号（[]）来访问属性的值

```java
var myObj = { "name":"ddkk", "alexa":null, "site":"http://www.ddkk.com" };
for (x in myObj) {
    document.getElementById("demo").innerHTML += myObj[x] + "<br>";
}
```

## 嵌套 JSON 对象

JSON 对象中可以包含另外一个 JSON 对象

```java
myObj = {
    "name":"ddkk",
    "alexa":100000,
    "sites": {
        "site1":"www.ddkk.com",
        "site2":"ddkk.cn",
        "site3":"c.ddkk.cn"
    }
}
```

可以使用点号(.)或者中括号([])来访问嵌套的 JSON 对象

```java
x = myObj.sites.site1;
```

或

```java
x = myObj.sites["site1"];
```

## 修改值

可以使用点号(.)来修改 JSON 对象的值

```java
myObj.sites.site1 = "www.google.com";
```

可以使用中括号([])来修改 JSON 对象的值

```java
myObj.sites["site1"] = "www.google.com";
```

## 删除对象属性

可以使用 **delete** 关键字来删除 JSON 对象的属性

```java
delete myObj.sites.site1;
```

可以使用中括号([])来删除 JSON 对象的属性

```java
delete myObj.sites["site1"]
```
