# 09、JSONP 基础教程
- 来源：https://ddkk.com/zhuanlan/other/json/9.html
- 分类：JSON 教程
- 分组：教程目录
JSONP (JSON with Padding) 是 JSON 的一种 **使用模式**，可以让网页从别的网站那获取数据，即跨域读取数据

为什么我们从不同的域（网站）访问数据需要一个特殊的技术(JSONP )呢？

这是因为同源策略

同源策略，它是由 Netscape 提出的一个著名的安全策略，现在所有支持 JavaScript 的浏览器都会使用这个策略

接下我们将学习 JSONP 的知识

## JSONP 应用

### 1. 服务端 JSONP 格式数据

假设其它网站想访问 : /r/show/penglei/jsonp/python_cnt?jsonp=callbackFunction

假设我们期望返回如下 JSON 数据

```java
{"python":11582}
```

真正返回到客户端的数据显示为

```java
callbackFunction({"python":11582})
```

服务端文件 jsonp.php 代码为

#### jsonp.php

```java
<?php
header('Content-type: application/json;charset="utf-8"');
//获取回调函数名
$jsoncallback = htmlspecialchars( $_REQUEST ['jsonp'] );
// JSON 数据
$json_data = '{"python":11582}';
//输出 JSONP 格式的数据
echo $jsoncallback . "(" . $json_data . ")";
```

### 2. 客户端实现 callbackFunction 函数

```java
<script>
function callbackFunction(result,methodName)
{
    var rs = result['data'];
    var html='<ul>';
    for(var i=0; i<rs.length; i++)
    {
        html += '<li>'+rs[i]['lang']+':'+rs[i]['cnt']+'</li>';
    }
    html += '</ul>';
    document.getElementById('divCustomers').innerHTML=html;
}
</script>
```

### 页面展示

```java
<div id="divCustomers"></div>
```

### 客户端页面完整代码

```java
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JSONP 范例</title>
</head>
<body>
    <div id="divCustomers"></div>
    <script>
    function callbackFunction(result,methodName)
    {
        var rs = result['data'];
        var html='<ul>';
        for(var i=0; i<rs.length; i++)
        {
            html += '<li>'+rs[i]['lang']+':'+rs[i]['cnt']+'</li>';
        }
        html += '</ul>';
        document.getElementById('divCustomers').innerHTML=html;
    }
    </script>
    <script src="/r/show/penglei/jsonp/python_cnt?jsonp=callbackFunction"></script>
</body>
</html>
```

## jQuery 使用 JSONP

上面的范例可以使用 jQuery 重写

```java
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JSONP 范例</title>
    <script src="/static/js/jquery-1.8.3.min.js"></script>    
</head>
<body>
<div id="divCustomers"></div>
<script>
$.getJSON("/r/show/penglei/jsonp/python_cnt?jsonp=?",function(result){
        var rs = result['data'];
        var html='<ul>';
        for(var i=0; i<rs.length; i++)
        {
            html += '<li>'+rs[i]['lang']+':'+rs[i]['cnt']+'</li>';
        }
        html += '</ul>';
        $('#divCustomers').html(html);
    }
);
</script>
</body>
</html>
```
