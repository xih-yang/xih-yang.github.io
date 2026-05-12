# 16、jQuery 实战 - jQuery 中的 DOM 操作之节点克隆
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/16.html
- 分类：前端框架
- 分组：教程目录
## 一、复制节点

### 1、clone()

克隆匹配的 DOM 元素，返回值为克隆后的副本。但此时复制的新节点不具有任何行为。

### 2、clone(true)

复制元素的同时也复制元素中的的事件。

## 二、代码演示

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
$(function()
{
	$("#div1").click(function()
	{
		alert("div1的点击事件");
	});
});
function copy()
{
	var divObj = $("#div1");
	//如果带着true的参数复制就会把事件也复制过去，如果不去指定参数就不会复制事件
	var divObjcopy = divObj.clone(true);
	$("#div2").after(divObjcopy);
}
</script>
<style type="text/css">
div
{
	width: 100px;
	height: 100px;
	background: skyblue;
	margin: 1px;
}
</style>
</head>
<body>
<div id="div1">div1</div>
<div id="div2">div2</div>
<input type="button" value="复制" onclick="copy()"><br>
</body>
</html>
```

如有错误，欢迎指正！
