# 03、jQuery 实战 - jQuery 基本选择器
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/3.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

选择器是 jQuery 的根基, 在 jQuery 中, 对事件处理, 遍历 DOM 和 Ajax 操作都依赖于选择器 jQuery 选择器的优点是写法简洁。

```java
$(“#id”)  等价于  document.getElementById("id");
$(“tagName”)  等价于  document.getElementsByTagName("tagName");
```

## 二、基本选择器

基本选择器是 jQuery 中最常用的选择器, 也是最简单的选择器, 它通过元素 id, class 和标签名来查找 DOM 元素。

### 1、#id

**用法**: `$`(”#myDiv”);

**返回值**：单个元素的组成的集合。

**说明**: 这个就是直接选择 html 中的 id=”myDiv”。

### 2、Element

**用法**: `$(”div”)`

**返回值**：`集合元素`

**说明**: element 的英文翻译过来是 ”元素”,所以 element 其实就是 html 已经定义的标签元素，例如 div，input，a 等等。

### 3、class

**用法**: `$(”.myClass”)`

**返回值**：集合元素。

**说明**: 这个标签是直接选择 html 代码中 class=”myClass” 的元素或元素组（因为在同一 html 页面中 class 是可以存在多个同样值的）。

### 4、*

**用法**: `$(”*”)`

**返回值**：集合元素。

**说明**: 匹配所有元素,多用于结合上下文来搜索。

### 5、selector1, selector2, selectorN

**用法**: `$(”div,span,p.myClass”)`

**返回值**：集合元素

**说明**: 将每一个选择器匹配到的元素合并后一起返回。你可以指定任意多个选择器, 并将匹配到的元素合并到一个结果内。其中 p.myClass 是表示匹配元素。

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
});
function myclick()
{
	//根据id选择器获得jQuery对象
	var jinput = $("#myinput1");
	alert(jinput.val());
	//根据元素选择器获得所有页面上input的jQuery元素
	var inputs = $("input");
	//如果获得的元素是多个不能使用普通的for,为什么呢？前面我们就说到使用索引拿到的是dom对象，就不能使用jQuery对象的方法了
	/* 
	for(var i = 0; i < inputs.length; i++)
	{
		alert(inputs[i].value)
	} 
	*/
	//需要使用jQuery提供的遍历方式：
	inputs.each(function()
	{
		//获得每一个jQuery对象
		var obj = $(this);
		alert(obj.val());
		if(obj.val() == 'a')
		{
			//each返回false的时候回跳出循环
			return false;
		}
	});
}
</script>
</head>
<body>
用户名1：<input id="myinput1" type="text"><br>
用户名2：<input id="myinput2" type="text"><br>
用户名3：<input id="myinput3" type="text"><br>
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

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
}) 
*/
function myclick()
{
	var divs = $(".divcss");
	divs.each(function()
	{
		var divObj = $(this);
		alert(divObj.html());
	});
}
</script>
<style type="text/css">
div 
{
	border: 1px solid black;
	width: 100px;
	height: 100px;
}
.divcss
{
	color: blue;
}
</style>
</head>
<body>
<div>div1</div>
<div class="divcss">div2</div>
<div class="divcss">div3</div>
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

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
}) 
*/
function myclick()
{
	//拿到全部
	//var divs = $("*");
	var divs = $(".divcss,input,textarea,#div1");
	divs.each(function()
	{
		var divObj = $(this);
		alert(divObj.html());
	});
}
</script>
<style type="text/css">
div 
{
	border: 1px solid black;
	width: 100px;
	height: 100px;
}
.divcss
{
	color: blue;
}
</style>
</head>
<body>
<div id="div1">div1</div>
<div class="divcss">div2</div>
<div class="divcss">div3</div>
用户名1：<input id="myinput" type="text"><br>
用户名2：<input id="myinput1" type="text"><br>
用户名3：<input id="myinput2" type="text"><br>
简介：<textarea ></textarea>
<input  type="button" value="点击" onclick="myclick()">
</body>
</html>
```

如有错误，欢迎指正！
