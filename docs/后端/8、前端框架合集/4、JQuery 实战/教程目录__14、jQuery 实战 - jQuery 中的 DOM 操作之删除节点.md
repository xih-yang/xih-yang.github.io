# 14、jQuery 实战 - jQuery 中的 DOM 操作之删除节点
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/14.html
- 分类：前端框架
- 分组：教程目录
## 一、删除节点

### 1、remove()

从DOM 中删除所有匹配的元素，传入的参数用于根据 jQuery 表达式来筛选元素。当某个节点用 remove() 方法删除后，该节点所包含的所有后代节点将被同时删除。这个方法的返回值是一个指向已被删除的节点的引用。

### 2、empty()

清空节点 ，清空元素中的所有后代节点（不包含属性节点）。

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
function del()
{
	$("li:first").remove();
	//清空子元素
	//$("ul").remove();
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
<ul>
	<li>列表项1</li>
	<li>列表项2</li>
	<li>列表项3</li>
	<li>列表项4</li>
</ul>
<input type="button" value="删除" onclick="del()"><br>
</body>
</html>
```

如有错误，欢迎指正!
