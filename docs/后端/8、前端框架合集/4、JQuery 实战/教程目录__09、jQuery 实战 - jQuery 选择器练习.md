# 09、jQuery 实战 - jQuery 选择器练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/9.html
- 分类：前端框架
- 分组：教程目录
## 一、题目要求

- 1、给网页中所有的 `` 元素添加 onclick 事件。
- 2、使一个特定的表格隔行变色。
- 3、对多选框进行操作，输出选中的多选框的个数。

## 二、实现代码

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
/*
var myclick = function()
{
	alert("0");
} 
*/
$(function()
{
	//$("p").attr("onclick","myclick()");
	$("p").click(function()
	{
		alert($(this).html());
	});	
	$("li:even").css("background","skyblue");	
});
function myclick()
{
	var inputObj = $("input:checked");
	alert(inputObj.length);
}
</script>
</head>
<body>
<p>段落1</p>
<p>段落2</p>
<p>段落3</p>
<ul>
	<li>列表项1</li>
	<li>列表项2</li>
	<li>列表项3</li>
	<li>列表项4</li>
</ul>
<input type="checkbox">多选项1
<input type="checkbox">多选项2
<input type="checkbox">多选项3
<input type="checkbox">多选项4
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

## 三、实现效果

如有错误，欢迎指正！
