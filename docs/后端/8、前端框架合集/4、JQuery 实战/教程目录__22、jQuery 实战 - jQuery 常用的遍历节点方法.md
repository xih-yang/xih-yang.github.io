# 22、jQuery 实战 - jQuery 常用的遍历节点方法
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/22.html
- 分类：前端框架
- 分组：教程目录
## 一、常用的遍历节点方法

### 1、children()

取得匹配元素的所有子元素组成的集合，该方法只考虑子元素而不考虑任何后代元素。

### 2、next()

取得匹配元素后面紧邻的同辈元素的集合。

### 3、prev()

取得匹配元素前面紧邻的同辈元素的集合。

### 4、siblings()

取得匹配元素前后所有的同辈元素。

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
function myclick()
{
	/* 
	$("ul li").each(function()
	{
		alert($(this).html())
	});
	*/
	//获得ul下的孩子节点
	var lis = $("ul").children();
	lis.each(function()
	{
		alert($(this).html());
	});
}
function login()
{
	//根据id选择器获得用户名的jQuery对象
	var unameObj = $("#username");
	var val = unameObj.val();
	var reg = unameObj.attr("reg");
	var tip = unameObj.attr("tip");
	var regObj = new RegExp(reg);
	if(!regObj.test(val))
	{
		//获得username紧挨着的下一个dom的jQuery对象
		var spanObj = unameObj.prev();
		spanObj.html(tip);
	}
	else
	{
		//提交表单
		$("#myform").submit();
	}
}
function myclick1()
{
	//siblings获得兄弟节点
	$("div p:first-child").siblings().each(function()
	{
		alert($(this).html());
	});
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
<hr>
<form id="myform" action="${path }/jsp2/tab.jsp" method="post">
	<p>
		用户名：<span></span><input id="username" name="username" type="text" reg="^\w{6,8}$" tip="请输入6到8位的单词字符"><span></span>
	</p>
	<p>
		<input type="button" value="登录" onclick="login()">
	</p>
</form>
<hr>
<div>
	<p>白日依山尽</p>
	<p>黄河入海流</p>
	<input type="text" >
	<ul>
		<li>列表项1</li>
		<li>列表项2</li>
		<li>列表项3</li>
		<li>列表项4</li>
	</ul>
</div>
<input type="button" value="点击" onclick="myclick1()">
</body>
</html>
```

如有错误，欢迎指正！
