# 05、jQuery 实战 - jQuery 过滤选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/5.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

过滤选择器主要是通过特定的过滤规则来筛选出所需的 DOM 元素，该选择器都以 “:” 开头按照不同的过滤规则，过滤选择器可以分为基本过滤，内容过滤，可见性过滤，属性过滤，子元素过滤和表单对象属性过滤选择器。

## 二、基本过滤选择器

### 1、:first

用法:`$(”tr:first”);`

返回值：单个元素的组成的集合。

说明：匹配找到的第一个元素。

### 2、:last

用法：`$(”tr:last”);`

返回值：集合元素。

说明：匹配找到的最后一个元素。与 `:first` 相对应。

### 3、:not(selector)

用法：`$(”input:not(:checked)”);`

返回值：集合元素。

说明：去除所有与给定选择器匹配的元素，有点类似于 ”非”，意思是没有被选中的 input（当 input 的type=”checkbox”）。

### 4、:even

用法：`$(”tr:even”);`

返回值：集合元素。

说明：匹配所有索引值为偶数的元素，从 0 开始计数，js 的数组都是从 0 开始计数的，例如要选择table 中的行，因为是从 0 开始计数，所以 table 中的第一个 tr 就为偶数 0。

### 5、: odd

用法：`$(”tr:odd”);`

返回值：集合元素。

说明：匹配所有索引值为奇数的元素，和 `:even` 对应，从 0 开始计数。

### 6、:eq(index)

用法：`$(”tr:eq(0)”);`

返回值：集合元素。

说明：匹配一个给定索引值的元素 `.eq(0)` 就是获取第一个 tr 元素，括号里面的是索引值，不是元素排列数。

### 7、:gt(index)

用法：`$(”tr:gt(0)”);`

返回值：集合元素。

说明：匹配所有大于给定索引值的元素。

### 8、:lt(index)

用法：`$(”tr:lt(2)”);`

返回值：集合元素。

说明：匹配所有小于给定索引值的元素。

### 9、:header(固定写法)

用法：`$`(”:header”).css(”background”, “#EEE”);

返回值：集合元素。

说明：匹配如 h1, h2, h3 之类的标题元素.这个是专门用来获取 h1，h2 这样的标题元素。

### 10、:animated(固定写法)

返回值：集合元素。

说明：匹配所有正在执行动画效果的元素 。

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
$(function()
{
	var css1 = {
     background:'yellow',color:'red'};
	$("tr:odd").css(css1);	
});
function myclick()
{
	//var divs = $("tr:first");
	//var divs = $("tr:last");
	/* 
	var divs = $("tr:even");
	divs.each(function()
	{
		var divObj = $(this);
		alert(divObj.html());
	}); 
	*/
	/* 
	//获取被选中的
	$("input:checked").each(function()
	{
		alert($(this).val());
	});
	*/
	//获取没有被选中的
	$("input:not(:checked)").each(function()
	{
		alert($(this).val());
	});
}
function checkAll()
{
	/* 
	$("td input").each(function()
	{
		$(this).attr("checked","checked");
	});
	*/
	//jquery元素选择器获得到的都是数组，如果不去便利就调用方法，那么就是给这一组元素区操作，如果想当个操作需要遍历。
	$("td input").attr("checked","checked");
}
function reverseCheck()
{
	$("td input").each(function()
	{
		var checkedState = $(this).attr("checked");
		if(checkedState == 'checked')
		{
			$(this).removeAttr("checked");
		}
		else
		{
			$(this).attr("checked","checked");
		}
	});
}
//注意：方法名不能取 click
function _click()
{
	//alert($("tr:eq(3)").html());
	$("tr:lt(1)").each(function()
	{
		alert($(this).html())
	});
}
</script>
<style type="text/css">
table
{
	border-collapse: collapse;
}
</style>
</head>
<body>
<table border="1">
<tr>
	<td><input type="checkbox" value="1"></td>
	<td>魏宇轩1</td>
	<td>18</td>
</tr>
<tr>
	<td><input type="checkbox" value="2"></td>
	<td>魏宇轩2</td>
	<td>18</td>
</tr>
<tr>
	<td><input type="checkbox" value="3"></td>
	<td>魏宇轩3</td>
	<td>18</td>
</tr>
<tr>
	<td><input type="checkbox" value="4"></td>
	<td>魏宇轩4</td>
	<td>18</td>
</tr>
</table>
<input type="button" value="点击1" onclick="myclick()">
<input type="button" value="全选" onclick="checkAll()">
<input type="button" value="反选" onclick="reverseCheck()">
<input type="button" value="点击2" onclick="_click()">
</body>
</html>
```

如有错误，欢迎指正！
