# 23、jQuery 实战 - jQuery 事件
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/23.html
- 分类：前端框架
- 分组：教程目录
## 一、说明

- 提供可以绑定的事件有（加粗的为重点）

***blur***, ***focus***, focusin, focusout, load, resize, scroll, unload, click, ***dblclick***, mousedown, mouseup, mousemove, mouseover, mouseout, mouseenter, mouseleave, ***change***, select, ***submit***, ***keydown***, keypress, ***keyup***, error。

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
$(function()
{
	/* 
	   1.事件结合选择器会把选择器选出来的一组元素都加上事件
	   2.在元素上可以不去指定事件
	   3.事件的方法建议使用匿名方法
	   4.事件的赋值必须要放在jQuery的主函数内部
	*/
	$("form input").blur(function()
	{
		//离开焦点的input是哪个这个this就是哪个对象
		var obj = $(this);
		var val = obj.val();
		var reg = obj.attr("reg");
		var tip = obj.attr("tip");
		var regObj = new RegExp(reg);
		if(!regObj.test(val))
		{
			//获得username紧挨着的下一个dom的jQuery对象
			var spanObj = obj.next();
			spanObj.html("<font color='red'>"+tip+"</font>");
		}
		else
		{
			var spanObj = obj.next();
			spanObj.html("");
		}
	});
	$("form input").focus(function()
	{
		$(this).css("background","yellow");
	});
	$("#regist").click(function()
	{
		//设置一个提交表单的标志
		var isSubmit = true;
		$("form input").each(function(){
			var obj = $(this);
			var val = obj.val();
			var reg = obj.attr("reg");
			var tip = obj.attr("tip");
			var regObj = new RegExp(reg);
			if(!regObj.test(val))
			{
				//获得username紧挨着的下一个dom的jQuery对象
				var spanObj = obj.next();
				spanObj.html("<font color='red'>"+tip+"</font>");
				isSubmit =false;
			}
			else
			{
				var spanObj = obj.next();
				spanObj.html("");
			}
		});
		if(isSubmit){
			//表单提交
			$("#myform").submit();
		}
	});
	$("#gender").change(function()
	{
		//获得改变后的值
		var val = $(this).val();
		alert(val);
	});	
});
</script>
</head>
<body>
<form id="myform" action="${path }/jsp2/tab.jsp" method="post">
<p>
	用户：<input id="username" name="username" type="text" reg="^\d{3,5}$" tip="请输入3到5位的数字"><span></span>
</p>
<p>
	密码：<input name="password" type="password" reg="^\w{6,8}$" tip="请输入6到8位的英文或者数字或_"><span></span>
</p>
<p>
	地址：<input name="address" type="text" reg="^.{0,50}$" tip="请输入50个字符"><span></span>
</p>
<p>
	性别：<select id="gender">
			<option value="1">男</option>
			<option value="2">女</option>
		</select><span></span>
</p>
<p>
	<input type="button" value="注册" id="regist">
</p>
</form>
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
$(function()
{
	/* 1.事件结合选择器会把选择器选出来的一组元素都加上事件
	   2.在元素上可以不去指定事件
	   3.事件的方法建议使用匿名方法
	   4.事件的赋值必须要放在jQuery的主函数内部
	*/
	$("form input").blur(function()
	{
		//离开焦点的input是哪个这个this就是哪个对象
		var obj = $(this);
		var val = obj.val();
		var reg = obj.attr("reg");
		var tip = obj.attr("tip");
		var regObj = new RegExp(reg);
		if(!regObj.test(val))
		{
			//获得username紧挨着的下一个dom的jQuery对象
			var spanObj = obj.next();
			spanObj.html("<font color='red'>"+tip+"</font>");
		}
		else
		{
			var spanObj = obj.next();
			spanObj.html("");
		}
	});
	$("form input").focus(function()
	{
		$(this).css("background","yellow");
	});
	/* 
	$("#regist").click(function()
	{
		//设置一个提交表单的标志
		var isSubmit = true;
		$("form input").each(function()
		{
			var obj = $(this);
			var val = obj.val();
			var reg = obj.attr("reg");
			var tip = obj.attr("tip");
			var regObj = new RegExp(reg);
			if(!regObj.test(val))
			{
				//获得username紧挨着的下一个dom的jQuery对象
				var spanObj = obj.next();
				spanObj.html("<font color='red'>"+tip+"</font>");
				isSubmit =false;
			}
			else
			{
				var spanObj = obj.next();
				spanObj.html("");
			}
		});
		if(isSubmit)
		{
			//表单提交
			$("#myform").submit();
		}
	});
	*/
	$("#myform").submit(function()
	{
		var isSubmit =true;
		$("form input").each(function()
		{
			var obj = $(this);
			var val = obj.val();
			var reg = obj.attr("reg");
			var tip = obj.attr("tip");
			var regObj = new RegExp(reg);
			if(!regObj.test(val))
			{
				//获得username紧挨着的下一个dom的jQuery对象
				var spanObj = obj.next();
				spanObj.html("<font color='red'>"+tip+"</font>");
				isSubmit =false;
			}
			else
			{
				var spanObj = obj.next();
				spanObj.html("");
			}
		});
		//阻止表单提交，如果是true就允许表单提交
		return isSubmit;
	});
	$("#gender").change(function()
	{
		//获得改变后的值
		var val = $(this).val();
		alert(val);
	});
	$("body").keydown(function(event)
	{
		var num = window.event?event.keyCode : event.which;
		if(num == 13)
		{
			var isSubmit = true;
			$("form input").each(function()
			{
				var obj = $(this);
				var val = obj.val();
				var reg = obj.attr("reg");
				var tip = obj.attr("tip");
				var regObj = new RegExp(reg);
				if(!regObj.test(val))
				{
					//获得username紧挨着的下一个dom的jQuery对象
					var spanObj = obj.next();
					spanObj.html("<font color='red'>"+tip+"</font>");
					isSubmit =false;
					//跳出each循环
					//return false;
				}
				else
				{
					var spanObj = obj.next();
					spanObj.html("");
				}
			});
			if(isSubmit)
			{
				//表单提交
				$("#myform").submit();
			}
		}
	});	
});
</script>
</head>
<body>
<form id="myform" action="${path }/jsp2/tab.jsp" method="post">
<p>
	用户：<input id="username" name="username" type="text" reg="^\d{3,5}$" tip="请输入3到5位的数字"><span></span>
</p>
<p>
	密码：<input name="password" type="password" reg="^\w{6,8}$" tip="请输入6到8位的英文或者数字或_"><span></span>
</p>
<p>
	地址：<input name="address" type="text" reg="^.{0,50}$" tip="请输入50个字符"><span></span>
</p>
<p>
	性别：<select id="gender">
			<option value="1">男</option>
			<option value="2">女</option>
		</select><span></span>
</p>
<p>
	<input type="submit" value="注册" id="regist">
</p>
</form>
</body>
</html>
```

效果同上！

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
	$("#username").keyup(function(event)
	{
		var num = window.event?event.keyCode : event.which;
		var charStr = String.fromCharCode(num);
		alert(num + "   "+charStr);
		//请注意组合键，此处不再深入探讨
		if(charStr != "H")
		{
			$(this).val("");
		}
	});	
});
</script>
</head>
<body>
<form id="myform" action="${path }/jsp2/tab.jsp" method="post">
<p>
	用户名：<input id="username" name="username" type="text" ><span></span>
</p>
<p>
	<input type="submit" value="注册" id="regist">
</p>
</form>
</body>
</html>
```

按键抬起后触发！

如有错误，欢迎指正！
