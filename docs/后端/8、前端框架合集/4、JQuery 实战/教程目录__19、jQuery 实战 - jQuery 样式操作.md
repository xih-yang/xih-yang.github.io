# 19、jQuery 实战 - jQuery 样式操作
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/19.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

获取class 和设置 `class:class` 是元素的一个属性，所以获取 class 和设置 class 都可以使用 attr() 方法来完成。

### 1、addClass()

追加样式。

### 2、removeClass()

移除样式，从匹配的元素中删除全部或指定的 class。

### 3、toggleClass()

切换样式，控制样式上的重复切换。如果类名存在则删除它， 如果类名不存在则添加它。

### 4、hasClass()

判断是否含有某个样式，判断元素中是否含有某个 class，如果有，则返回 true，否则返回 false。

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
function getClass()
{
	alert($("#div1").attr("class"));
}
function setClass()
{
	$("#div1").addClass("c2");
}
function delClass()
{
	$("#div1").removeClass();
}
function toggleClass1()
{
	$("#div1").toggleClass("c3");
}
</script>
<style type="text/css">
.c1
{
	width: 100px;
	height: 100px;
	background: aqua;
}
.c2
{
	width: 200px;
	height: 200px;
	background: gray;
}
.c3
{
	width: 300px;
	height: 300px;
	background: maroon;
}
</style>
</head>
<body>
<div id="div1" class="c1">
</div>
<input type="button" value="获得类" onclick="getClass()"><br>
<input type="button" value="设置类" onclick="setClass()"><br>
<input type="button" value="删除类" onclick="delClass()"><br>
<input type="button" value="切换类" onclick="toggleClass1()"><br>
</body>
</html>
```

如有错误，欢迎指正！
