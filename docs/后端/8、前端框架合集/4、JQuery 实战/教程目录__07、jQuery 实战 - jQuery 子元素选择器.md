# 07、jQuery 实战 - jQuery 子元素选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/7.html
- 分类：前端框架
- 分组：教程目录
## 一、子元素选择器

### 1、:nth-child(index/even/odd/equation)

用法:`$(”ul li:nth-child(2)”);`

返回值：集合元素。

说明：匹配其父元素下的第 N 个子或奇偶元素。这个选择器和之前说的基础过滤 (Basic Filters) 中的 eq() 有些类似，不同的地方就是前者是从 0 开始，后者是从 1 开始。

### 2、:first-child

用法：`$(”ul li:first-child”);`

返回值：集合元素。

说明：匹配第一个子元素 。`’:first’` 只匹配一个元素，而此选择符将为每个父元素匹配一个子元素。这里需要特别的记忆下区别。

### 3、:last-child

用法:$(”ul li:last-child”);

返回值：集合元素。

说明：匹配最后一个子元素。`’:last’` 只匹配一个元素，而此选择符将为每个父元素匹配一个子元素。

### 4、: only-child

用法：`$(”ul li:only-child”);`

返回值：集合元素。

说明：如果某个元素是父元素中唯一的子元素，那将会被匹配。如果父元素中含有其他元素，那将不会被匹配。意思就是：只有一个子元素的才会被匹配！

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
	//序号从1开始
	//var liObj = $("ul li:nth-child(3)");
	//var liObj = $("ul li:first-child");
	//var liObj = $("ul li:last-child");
	var liObj = $("ul li:only-child");
	alert(liObj.html());
}
</script>
</head>
<body>
<ul>
	<li>列表项1</li>
	<!-- <li>列表项2</li>
	<li>列表项3</li>
	<li>列表项4</li> -->
</ul>
<input  type="button" value="点击" onclick="myclick()">
</body>
</html>
```

此处不再演示，请读者自行尝试！

如有错误，欢迎指正！
