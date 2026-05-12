# 04、jQuery 实战 - jQuery 层次选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/4.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

如果想通过 DOM 元素之间的层次关系来获取特定元素，例如后代元素，子元素，相邻元素，兄弟元素等，则需要使用层次选择器.。

## 二、层次选择器

### 1 、ancestor descendant

**用法**: `$(”form input”);`

**返回值**：集合元素。

**说明**: 空格代表下级，在给定的祖先元素下匹配所有后代元素。这个要和下面讲的 `”parent > child”` 区分开。

### 2、parent > child

**用法**: `$(”form > input”);`

**返回值**：集合元素。

**说明**：在给定的父元素下匹配所有子元素，注意：要区分好后代元素与子元素。

### 3、prev + next

**用法**: `$(”label + input”);`

**返回值**：集合元素。

**说明**：匹配所有紧接在 prev 元素后的 next 元素，必须是 prev 后面紧挨着的元素才能拿到。

### 4、prev ~ siblings

**用法**: `$(”form ~ input”);`

**返回值**：集合元素。

**说明**: 匹配 prev 元素之后的所有 siblings 元素。

**注意**：是匹配之后的元素，不包含该元素在内，并且 siblings 匹配的是和 prev 同辈的元素，其后辈元素不被匹配。 (“prev ~ div”) 选择器只能选择 “# prev ” 元素后面的同辈元素；而 jQuery 中的方法 siblings() 与前后位置无关, 只要是同辈节点就可以选取。

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
/* 
$(function()
{	
});
*/
function myclick()
{
	//注意：不支持id选择器
	//var divs = $("form input");
	//var divs = $("form > input");
	//var divs = $("input + select");
	var divs = $("textarea ~ input");
	divs.each(function()
	{
		var divObj = $(this);
		alert(divObj.html());
	});
}
</script>
</head>
<body>
<form action="">
	用户名：<input id="username" name="usename" type="text"><br>
	密码：<input name="password" type="password"><br>
	<div>
		密码1：<input name="p1" type="text"><br>
	</div>	
	<textarea></textarea>
	<select>
		<option>足球</option>
		<option>篮球</option>
	</select>	
	<select>
		<option>男</option>
		<option>女</option>
	</select>	
	用户名：<input id="username" name="usename" type="text"><br>
</form>
<input name="usename" type="text">
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

如有错误，欢迎指正！
