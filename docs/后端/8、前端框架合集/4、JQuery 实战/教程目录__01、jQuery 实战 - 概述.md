# 01、jQuery 实战 - 概述
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/1.html
- 分类：前端框架
- 分组：教程目录
## 一、JQuery 是什么?

- jQuery 由美国人 John Resig 创建，至今已吸引了来自世界各地的众多 javascript 高手加入其团队。

其宗旨是——WRITE LESS，DO MORE，**写更少的代码，做更多的事情**。
- 它是轻量级的 js 库（压缩后只有21k） ，还兼容各种浏览器 。
- jQuery 是一个快速的，简洁的 javaScript 库，使用户能更方便地处理 HTML documents、events、实现动画效果，并且方便地为网站提供 AJAX 交互。
- jQuery 还有一个比较大的优势是，它的文档说明很全，而且各种应用也说得很详细，同时还有许多成熟的插件可供选择。
- [jquery 文档](https://blog.csdn.net/qq_36260974/article/details/103370406)

## 二、jquery 的引入

```java
<script type="text/javascript" src="script/jquery-1.8.3.js"></script>
```

[jquery 类库](https://download.csdn.net/download/qq_36260974/12012170)

注意：工程编码和工作空间编码建议都使用 UTF-8！

### 关于 MyEclipse 建立 JSP 高级模板和基本模板的说明

为了避免混淆，建议使用基本模板。

#### 1、基本模板

#### 2、高级模板

## 二、JQuery 第一个例子

```java
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<c:set var="path" value="${pageContext.request.contextPath }"></c:set>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html> 
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<script type="text/javascript" src="${path}/js/jquery-1.8.3.js"></script><!-- 建议使用绝对路径（规范） -->
<title>Insert title here</title>
<script type="text/javascript">
	//注意文档的加载顺序，这样拿到的docnment对象div1为空，除非写到最后
	var div1 = document.getElementById("div1");
	alert(div1);
	//定义jQuery的主函数，含义在于把整个文档加载完毕后再去执行主函数（第一种方式）
	$(document).ready(function()
	{
		var div1 = document.getElementById("div1");
		alert(div1);
	});
	//简写，建议使用这种方式，简便（第二种方式）
	$(function()
	{
		var div1 = document.getElementById("div1");
		alert(div1);	
	});
</script>
</head>
<body>
<div id="div1"></div>
</body>
</html>
```

如有错误，欢迎指正！
