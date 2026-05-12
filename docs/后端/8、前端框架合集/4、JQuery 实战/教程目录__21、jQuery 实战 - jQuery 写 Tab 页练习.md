# 21、jQuery 实战 - jQuery 写 Tab 页练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/21.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

标签页功能是一个比较常用的功能。虽然很多前端框架、插件都带有若干种标签页的功能实现，我依然觉得掌握其基本实现会更有利于我们对这个功能的理解，我们也可以更容易地根据实际情况进行修改。

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
	//获得第一个li
	$("li:first").css("border-bottom","2px solidB0BFD4");
	$("li").click(function()
	{
		//点击其中一个li，遍历所有li，把所有的li的白边框都加上
		$("li").each(function()
		{
			$(this).css("border","2px solid white");
		});
		//把点击的这个li的下边框编程灰色的
		$(this).css("border-bottom","2px solidB0BFD4");
		//获得li的tab属性
		var tab = $(this).attr("tab");
		//把每一个tab对应的div隐藏
		$(".tabdiv").hide();
		//显示点击的div
		$("#"+tab).show();
	});
});
</script>
<style type="text/css">
li
{
	list-style: none;
	width: 60px;
	height: 30px;
	background:B0BFD4;
	text-align: center;
	float: left;
	border: 2px solid white;
}
.tabdiv
{
	width: 400px;
	height: 200px;
	background:B0BFD4;
}
</style>
</head>
<body>
<div>
	<ul>
		<li tab="div1">tab1</li>
		<li tab="div2">tab2</li>
		<li tab="div3">tab3</li>
	</ul>
	<div id="div0" style="clear: both;"></div>
	<div id="div1" class="tabdiv">div1</div>
	<div id="div2" class="tabdiv" style="display: none;">div2</div>
	<div id="div3" class="tabdiv" style="display: none;">div3</div>
</div>
</body>
</html>
```

如有错误，欢迎指正！
