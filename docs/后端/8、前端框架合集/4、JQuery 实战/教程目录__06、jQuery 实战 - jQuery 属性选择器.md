# 06、jQuery 实战 - jQuery 属性选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/6.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

属性过滤选择器的过滤规则是通过元素的属性来获取相应的元素。

## 二、属性选择器

### 1、[attribute]

用法:`$(”div[id]“);`

返回值：集合元素。

说明：匹配包含给定属性的元素。例子中是选取了所有带 ”id” 属性的 div 标签。

### 2、[attribute=value]

用法:`$(”input[name='wyx']“).attr(”checked”, true);`

返回值：集合元素。

说明：匹配给定的属性是某个特定值的元素。例子中选取了所有 name 属性是 wyx 的 input 元素。

### 3、[attribute!=value]

用法：`$(”input[name!='newsletter']“).attr(”checked”, true);`

返回值：集合元素。

说明：匹配所有不含有指定的属性，或者属性不等于特定值的元素。此选择器等价于`:not([attr=value])`，要匹配含有特定属性但不等于特定值的元素，请使用 `[attr]:not([attr=value])`。之前看到的 `:not` 派上了用场.

### 4、[attribute^=value]

用法：`$(”input[name^=‘news’]“);`

返回值：集合元素。

说明：匹配给定的属性是以某些值开始的元素。

### 5、[attribute$=value]

用法：`$(”input[name$=‘letter’]“);`

返回值：集合元素。

说明：匹配给定的属性是以某些值结尾的元素。

### 6、[attribute*=value]

用法：`$(”input[name*=‘man’]“);`

返回值：集合元素。

说明：匹配给定的属性是以包含某些值的元素。

### 7、[attributeFilter1][attributeFilter2][attributeFilterN]

用法：`$(”input[id][name$=‘man’]“);`

返回值：集合元素。

说明：复合属性选择器，需要同时满足多个条件时使用。又是一个组合，这种情况我们实际使用的时候很常用。这个例子中选择的是所有含有 id 属性,并且它的 name 属性是以 man 结尾的元素。

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
	/* 
	$("input[name]").each(function()
	{
		alert($(this).val())
	});
	*/
	/* 
	$("input[name!='password']").each(function()
	{
		alert($(this).val());
	}) 
	*/
	/* 
	$("input[name*='ss']").each(function()
	{
		alert($(this).val())
	});
	*/
	$("input[name='username'][type='text']").each(function()
	{
		alert($(this).val());
	});
	//使用自定义属性做表单校验
	/* 
	$("input[reg]").each(function()
	{
		var val = $(this).val();
		var reg = $(this).attr("reg");
		var tip = $(this).attr("tip");
		//alert(reg + "   "+tip)
		var regExp = new RegExp(reg);
		if(!regExp.test(val))
		{
			alert(tip);
		}
	});
	*/
}
</script>
</head>
<body>
<form action="">
	用户：<input id="username" name="username" type="text" reg="^\d{6,8}$" tip="请输入6到8位用户名"><br>
	密码：<input name="password" type="password" reg="^\w{6,8}$" tip="请输入6到8单词字符的密码"><br>
	密码：<input name="passsword" type="password"><br>
	<div>
		密码：<input name="p1" type="text"><br>
	</div>
	<textarea ></textarea>
	<select>
		<option>足球</option>
		<option>篮球</option>
	</select>
	<select>
		<option>男</option>
		<option>女</option>
	</select>
</form>
<input name="username" type="radio">
<input  type="button" value="点击" onclick="myclick()">
</body>
</html>
```

此处不再演示，请读者自行尝试！

如有错误，欢迎指正！
