# 12、jQuery 实战 - jQuery 中的 DOM 操作之外部插入节点
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/12.html
- 分类：前端框架
- 分组：教程目录
## 一、外部插入节点

### 1、after(content)

在每个匹配的元素之后插入内容。

### 2、before(content)

在每个匹配的元素之前插入内容。

**以上方法不但能将新创建的 DOM 元素插入到文档中，也能对原有的 DOM 元素进行移动。**

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
function valid()
{
	var tip = $("<font color='red'>用户名已经存在</font>");
	$("#username").after(tip);
	//$("#username").before(tip);
	//$("#username").insertBefore($("#password"));
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
			用户：<input id="username" name="usename" type="text" value="0">
		</td>
		<td>
			密码：<input id="password" name="password" type="password">
		</td>
	</tr>
</table>
<input type="button" value="点击" onclick="valid()"><br>
</body>
</html>
```

如有错误，欢迎指正！
