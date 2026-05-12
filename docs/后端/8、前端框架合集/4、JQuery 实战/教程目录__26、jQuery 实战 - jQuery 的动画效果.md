# 26、jQuery 实战 - jQuery 的动画效果
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/26.html
- 分类：前端框架
- 分组：教程目录
## 演示

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
	//隐藏元素
	//$("#mydiv").hide("slow");
	//$("#mydiv").hide(1000);
	$("#mydiv").slideUp(1000);
}
function myshow()
{
	//隐藏元素
	//$("#mydiv").show('slow');
	//$("#mydiv").show(500);
	$("#mydiv").slideDown(500);
}
function mytog()
{
	//隐藏元素
	//$("#mydiv").show('slow');
	$("#mydiv").toggle(500);
}
</script>
</head>
<body>
<div id="mydiv" style="width: 100px;height: 100px;background: yellow;"></div>
<input type="button" value="隐藏" onclick="myclick()"><br>
<input type="button" value="显示" onclick="myshow()"><br>
<input type="button" value="效果切换" onclick="mytog()"><br>
</body>
</html>
```

***其他的就自己去玩吧！***

如有错误，欢迎指正！
