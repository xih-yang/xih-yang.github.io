# 11、jQuery 实战 - jQuery 中的 DOM 操作练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/11.html
- 分类：前端框架
- 分组：教程目录
## 一、题目要求

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
function rightMove()
{
	//获得左面被选中的option
	$("#perm option").each(function()
	{
		//获得每一个option的是否被选中的属性值
		var opt = $(this).attr("selected");
		if(opt == "selected")
		{
			$("#selPerm").append($(this));
		}
	});
}
function rightMoveAll()
{
	//获得左面被选中的option
	$("#perm option").each(function()
	{
		//var copy = $(this).clone();
		$("#selPerm").append($(this));
	});
}
function leftMove()
{
	//获得左面被选中的option
	$("#selPerm option").each(function()
	{
		//获得每一个option的是否被选中的属性值
		var opt = $(this).attr("selected");
		if(opt == "selected")
		{
			$("#perm").append($(this));
		}
	});
}
function leftMoveAll()
{
	//获得左面被选中的option
	$("#selPerm option").each(function()
	{
		$("#perm").append($(this));
	});
}
</script>
<style type="text/css">
select
{
	width: 200px;
	height: 200px;
}
</style>
</head>
<body>
<table>
	<tr>
		<td>
			<select id="perm" multiple="multiple">
				<option>登录</option>
				<option>员工管理</option>
				<option>部门管理</option>
				<option>订单管理</option>
			</select>
		</td>
		<td>
			<input type="button" value=">" onclick="rightMove()"><br>
			<input type="button" value=">>" onclick="rightMoveAll()"><br>
			<input type="button" value="&lt" onclick="leftMove()"><br>
			<input type="button" value="&lt&lt" onclick="leftMoveAll()">
		</td>
		<td>
			<select id="selPerm" multiple="multiple"></select>
		</td>
	</tr>
</table>
</body>
</html>
```

## 三、实现效果

如有错误，欢迎指正！
