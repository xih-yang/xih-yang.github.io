# 15、jQuery 实战 - jQuery 中的 DOM 操作之节点操作练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/15.html
- 分类：前端框架
- 分组：教程目录
## 一、题目要求

实现添加一条数据到表格（添加一行），删除一行，批量删除行。

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
function del()
{
	//$("li:first").remove();
	//清空子元素
	$("ul").remove();
}
function add()
{
	//获得填入的值
	var realName = $("#realName").val();
	var age = $("#age").val();
	var address = $("#address").val();
	//创建一行
	var trObj = $("<tr><td><input type=\"checkbox\"></td><td>"+realName+"</td><td>"+age+"</td><td>"+address+"</td><td><a href=\"javascript:void(0)\" οnclick=\"del(this)\">删除</a></td></tr>")
	//获得tbody
	$("#mytb").append(trObj);
}
function del(obj)
{
	//找父节点
	$(obj).parent().parent().remove();
}
function checkAll(obj)
{
	var checkAllStatus = $(obj).attr("checked");
	if(checkAllStatus == "checked")
	{
		$("tbody input").attr("checked", "checked");
	}
	else
	{
		$("tbody input").removeAttr("checked");
	}
}
function delBatch()
{
	$("tbody input:checked").parent().parent().remove();
}
</script>
<style type="text/css">
table
{
	width: 800px;
	border-collapse: collapse;
}
</style>
</head>
<body>
<table>
	<tr>
		<td>姓名：<input id="realName" name="realName" type="text"></td>
		<td>年龄：<input id="age" name="age" type="text"></td>
		<td>地址：<input  id="address" name="address" type="text"></td>
		<td>
			<input value="添加" type="button" onclick="add()">
			<input value="批量删除" type="button" onclick="delBatch()">
		</td>
	</tr>
</table>
<table border="1">
	<thead>
		<tr>
			<td><input id="checkall" type="checkbox" onchange="checkAll(this)"></td>
			<td>姓名</td>
			<td>年龄</td>
			<td>地址</td>
			<td>操作</td>
		</tr>
	</thead>
	<tbody id="mytb">
		<tr>
			<td><input type="checkbox"></td>
			<td>魏宇轩</td>
			<td>11</td>
			<td>北京</td>
			<!-- javascript:void(0) 中最关键的是 void 关键字， void 是 JavaScript 中非常重要的关键字，该操作符指定要计算一个表达式但是不返回值。 -->
			<td><a href="javascript:void(0)" onclick="del(this)">删除</a></td>
		</tr>
	</tbody>
</table>
</body>
</html>
```

如有错误，欢迎指正！
