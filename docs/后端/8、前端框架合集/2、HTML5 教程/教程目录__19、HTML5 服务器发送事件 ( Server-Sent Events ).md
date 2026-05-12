# 19、HTML5 服务器发送事件 ( Server-Sent Events )
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/19.html
- 分类：前端框架
- 分组：教程目录
HTML5 服务器发送事件（server-sent event）允许网页获得来自服务器的更新

## Server-Sent 事件 - 单向消息传递

Server-Sent 事件指的是网页自动获取来自服务器的更新

在HTML5 之前也可以做到这一点，前提是网页不得不询问是否有可用的更新

通过HTML5 服务器发送事件，更新能够自动到达，比如 Facebook/Twitter 更新、估价更新、新的博文、赛事结果等

## 浏览器支持

所有主流浏览器均支持服务器发送事件，除了 Internet Explorer

## 接收 Server-Sent 事件通知

EventSource 对象用于接收服务器发送事件通知

```html
var source=new EventSource("/dy/html/sse");
source.onmessage=function(event){
    document.getElementById("result").innerHTML+=event.data + "<br>";
};
```

HTML5 服务器发送事件过程解析

**1、** 创建一个新的EventSource对象，然后设置发送更新的页面的URL（"/dy/sse"）；

**2、** 每接收到一次更新，就会发生onmessage事件；

**3、** 当onmessage事件发生时，把已接收的数据推入id为"result"的元素中；

## 检测 Server-Sent 事件支持

在创建EventSource 对象前，我们必须先检测服务器发送事件的浏览器支持情况

```html
if(typeof(EventSource)!=="undefined"){
    // 浏览器支持 Server-Sent
    // *一些代码.....*
}else{
    // 浏览器不支持 Server-Sent..
}
```

## 服务器端代码范例

为了让上面的范例可以运行，我们还需要能够发送数据更新的服务器 ( 比如 PHP 或 Python )

服务器端事件流的语法是非常简单的

把"Content-Type" 报头设置为 "text/event-stream"

然后就可以开始发送事件流了

#### demo_sse.php

```html
<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
$time = date('r');
echo "data: The server time is: {$time}\n\n";
flush();
```

ASP代码 (VB) (demo_sse.asp)

```html
<% 
Response.ContentType="text/event-stream"
Response.Expires=-1
Response.Write("data: " & now())
Response.Flush()
%>
```

**1、** 把报头"Content-Type"设置为"text/event-stream"；

**2、** 规定不对页面进行缓存；

**3、** 输出发送日期（始终以"data:"开头）4.向网页刷新输出数据；

## EventSource 对象

上面的范例中，我们使用 onmessage 事件来获取消息

同时，我们也还可以使用其它事件

事件
描述

onopen
当通往服务器的连接被打开

onmessage
当接收到消息

onerror
当发生错误
