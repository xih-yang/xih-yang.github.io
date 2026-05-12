# 17、jQuery 实战 - jQuery 属性操作
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/17.html
- 分类：前端框架
- 分组：教程目录
## 一、属性操作

### 1、attr()

获取属性和设置属性。当为该方法传递一个参数时，即为某元素的获取指定属性；当为该方法传递两个参数时，即为某元素设置指定属性的值。

### 2、removeAttr()

删除指定元素的指定属性。

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
function getAttr()
{
	//获得元素的属性
	var srcValue = $("#myimg").attr("src");
	alert(srcValue)
}
function setAttr()
{
	//$("#myimg").attr("width","100");
	$("#myimg").attr({
     width:100,alt:"图片不存在"});
}
function delAttr()
{
	$("#myimg").removeAttr("width");
}
</script>
</head>
<body>
<img id="myimg" src="${path }/img/1.jpg"><br>
<input type="button" value="获得属性" onclick="getAttr()"><br>
<input type="button" value="设置属性" onclick="setAttr()"><br>
<input type="button" value="删除属性" onclick="delAttr()">
</body>
</html>
```

如有错误，欢迎指正！
