# 10、jQuery 实战 - jQuery 中的 DOM 操作
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/10.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

DOM（Document Object Model—文档对象模型）：一种与浏览器，平台，语言无关的接口，使用该接口可以轻松地访问页面中所有的标准组件。

## 二、JQuery 中的 DOM 操作

### 1、append(content)

向每个匹配的元素的内部的结尾处追加内容。

### 2、appendTo(content)

将每个匹配的元素追加到指定的元素中的内部结尾处。

### 3、prepend(content)

向每个匹配的元素的内部的开始处插入内容。

### 4、prependTo(content)

将每个匹配的元素插入到指定的元素内部的开始处。

## 三、代码演示

```java
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<c:set var="path" value="${pageContext.request.contextPath }"></c:set>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html> 
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<script type="text/javascript" src="${path }/js/jquery-1.8.3.js"></script>
<title>Insert title here</title>
<script type="text/javascript">
function myclick()
{
	var len = $("li").length;
	//创建li的jQuery元素
	var liObj = $("<li>列表项"+(len+1)+"</li>");
	//在ul内追加jQuery的li元素
	//$("ul").append(liObj);
	/* 
	var urlObj = $("ul");
	liObj.appendTo(urlObj); 
	*/
	/* 
	$("ul").prepend(liObj);
	var urlObj = $("ul"); 
	*/
	var urlObj = $("ul");
	liObj.prependTo(urlObj);
}
</script>
</head>
<body>
<ul>
	<li>列表项1</li>
	<li>列表项2</li>
	<li>列表项3</li>
	<li>列表项4</li>
</ul>
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

此处不再演示，请读者自行尝试！

如有错误，欢迎指正！
