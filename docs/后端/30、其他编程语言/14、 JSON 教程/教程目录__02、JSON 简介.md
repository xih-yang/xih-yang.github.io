# 02、JSON 简介
- 来源：https://ddkk.com/zhuanlan/other/json/2.html
- 分类：JSON 教程
- 分组：教程目录
我们提供了 Web 版的 JSON 编辑器，你可以依托于我们的 Web 编辑器编辑 JavaScript 代码，然后通过点击一个按钮来查看结果

```java
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)</title>
</head>
<body>
<h1>JavaScript 创建 JSON 对象</h1>
<p>
网站名称: <span id="jname"></span><br /> 
网站地址: <span id="jurl"></span><br /> 
网站 slogan: <span id="jslogan"></span><br /> 
</p>
<script>
var json_obj = {
    "name":"DDKK.COM 弟弟快看，程序员编程资料站",
    "url":"www.ddkk.com",
    "slogan":"DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站！"
};
document.getElementById("jname").innerHTML=json_obj.name
document.getElementById("jurl").innerHTML=json_obj.url
document.getElementById("jslogan").innerHTML=json_obj.slogan
</script>
</body>
</html>
```

> 点击 "运行范例" 按钮查看在线范例

## 与 XML 相同之处

**1、** JSON是纯文本；

**2、** JSON具有"自我描述性"，具有可读性；

**3、** JSON具有层级结构：值中存在值；

**4、** JSON可通过JavaScript进行解析；

**5、** JSON数据可使用AJAX进行传输；

## 与 XML 不同之处

**1、** 没有结束标签；

**2、** 更短，意味着传输更快；

**3、** 读写的速度更快；

**4、** 能够使用内建的JavaScripteval()方法进行解析；

**5、** 使用数组；

**6、** 没有保留字；

## 为什么使用 JSON？

对于AJAX 应用程序或者现在火爆的不行的 APP 开发来说，JSON 比 XML 更快更易使用

#### 使用 XML

**1、** 读取XML文档；

**2、** 使用XMLDOM来循环遍历文档；

**3、** 读取值并存储在变量中；

#### 使用 JSON

**1、** 读取JSON字符串；

**2、** 用eval()处理JSON字符串；
