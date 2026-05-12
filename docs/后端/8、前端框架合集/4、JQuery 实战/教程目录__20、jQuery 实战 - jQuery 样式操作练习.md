# 20、jQuery 实战 - jQuery 样式操作练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/20.html
- 分类：前端框架
- 分组：教程目录
## 一、题目要求

## 二、代码实现

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
function myfocus(obj)
{
	//聚焦的时候，获得到文本框的值
	var val = $(obj).val();
	//如果值是请输入
	if(val == "请输入电话/邮箱/用户名")
	{
		//把值变成空
		$(obj).val("");
		//为了让我们输入的内容是黑色的字把样式去掉
		$(obj).removeClass();
	}	
}
function myblur(obj)
{
	//离开焦点的时候如果没有输入内容
	if($(obj).val() == "")
	{
		//把请输入再填回去
		$(obj).val("请输入电话/邮箱/用户名");
		//把灰色的字变回来
		$(obj).addClass("uname");
	}	
}
</script>
<style type="text/css">
.uname
{
	color: gray;
}
</style>
</head>
<body>
<div id="div1" class="c1">
</div>
用户名：<input type="text" value="请输入电话/邮箱/用户名" class="uname"  onfocus="myfocus(this)"  onblur="myblur(this)" >
</body>
</html>
```

如有错误，欢迎指正！
