# 18、jQuery 实战 - jQuery 节点的 HTML 和值的管理
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/18.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

jQuery 中有很多方法都是一个函数实现获取和设置。如：attr()，html()，text()，val()，height()，width()，css() 等。

### 1、html()

读取和设置某个元素中的 HTML 内容，该方法可以用于 XHTML，但不能用于 XML 文档。

### 2、text()

读取和设置某个元素中的文本内容，该方法既可以用于 XHTML 也可以用于 XML 文档。

### 3、val()

读取和设置某个元素中的值，该方法类似 JavaScript 中的 value 属性。 对于文本框，下拉列表框，单选框该方法可返回元素的值（多选框只能返回第一个值），如果为多选下拉列表框，则返回一个包含所有选择值的数组。

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
function getHTML()
{
	var htmlTxt = $("#div1").html();
	//var htmlTxt = $("#div1").text();
	alert(htmlTxt);
}
function setHTML()
{
	$("#div1").html("<font color='red'>div1</font>");
}
</script>
</head>
<body>
<div id="div1">
	用户名：<input name="username">
</div>
<input type="button" value="获得html" onclick="getHTML()"><br>
<input type="button" value="设置html" onclick="setHTML()"><br>
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
function getVal()
{
	alert($("#username").val());
}
function setVal()
{
	$("#username").val("999");
	$("#username").css({
     background:"green",border:"1px solid yellow"});
}
</script>
</head>
<body>
<div id="div1">
	用户名：<input id="username" name="username">
</div>
<input type="button" value="获得值" onclick="getVal()"><br>
<input type="button" value="设置值" onclick="setVal()"><br>
</body>
</html>
```

如有错误，欢迎指正！
