# 25、jQuery 实战 - jQuery 的 Ajax 练习
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/25.html
- 分类：前端框架
- 分组：教程目录
## 题目要求

可以不使用数据库，使用 Jquery Ajax 模拟用户名校验，可使用的 [JSON 工具包](https://download.csdn.net/download/qq_36260974/12006976)。

## 一、前端页面

```java
<%@ page language="java" contentType="text/html; charset=UTF-8"  pageEncoding="UTF-8"%>
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
		var name = obj.attr("name");
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
			if(name == "username")
			{
				//ajax的重复性校验
				var result = validSame(val);
				if(result == "yes")
				{
					spanObj.html("<font color='red'>用户名已经存在</font>");
				}
				else
				{
					spanObj.html("");
				}
			}
			else
			{
				spanObj.html("");
			}
		}
	});
	/**
	 * 查询用户名是否重复，no不重复，yes重复
	 */
	function validSame(val)
	{
		var isSame = "no";
		$.ajax
		({
			type:'post',
			url:'${path}/validsame',
			async:false,
			data:
			{
				username:val
			},
			dataType:"text",
			success:function(result)
			{
				isSame = result;
			},
			error:function()
			{
				alert("系统错误");
			}
		});
		return isSame;
	}
	$("form input").focus(function()
	{
		$(this).css("background","yellow");
	});
	$("form input").keyup(function(event)
	{
		/* var num = window.event?event.keyCode : event.which;
		var charStr = String.fromCharCode(num); */
		var obj = $(this);
		var val = obj.val();
		var reg = obj.attr("reg");
		var tip = obj.attr("tip");
		var name = obj.attr("name");
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
			if(name == "username")
			{
				//ajax的重复性校验
				var result = validSame(val);
				if(result == "yes")
				{
					spanObj.html("<font color='red'>用户名已经存在</font>");
				}
				else
				{
					spanObj.html("");
				}
			}
			else
			{
				spanObj.html("");
			}
		}
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
			var name = obj.attr("name");
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
				if(name == "username")
				{
					//ajax的重复性校验
					var result = validSame(val);
					if(result == "yes")
					{
						spanObj.html("<font color='red'>用户名已经存在</font>");
						isSubmit =false;
					}
					else
					{
						spanObj.html("");
					}
				}
				else
				{
					spanObj.html("");
				}			
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
				var name = obj.attr("name");
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
					if(name == "username")
					{
						//ajax的重复性校验
						var result = validSame(val);
						if(result == "yes")
						{
							spanObj.html("<font color='red'>用户名已经存在</font>");
							isSubmit =false;
						}
						else
						{
							spanObj.html("");
						}
					}
					else
					{
						spanObj.html("");
					}
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

## 二、后台 servlet

```java
package cn.wyx.servlet;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
public class ValidSameServlet extends HttpServlet
{
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException
	{
		doPost(req, resp);
	}
	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException
	{
		// 获得ajax发送的数据
		String name = req.getParameter("username");
		if ("12345".equals(name))
		{
			resp.getWriter().print("yes");
		} else
		{
			resp.getWriter().print("no");
		}
	}
}
```

## 三、web.xml 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" xmlns="http://java.sun.com/xml/ns/javaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
	http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">
	<servlet>
		<servlet-name>validsame</servlet-name>
		<servlet-class>cn.wyx.servlet.ValidSameServlet</servlet-class>
	</servlet>
	<servlet-mapping>
		<servlet-name>validsame</servlet-name>
		<url-pattern>/validsame</url-pattern>
	</servlet-mapping>
</web-app>
```

## 四、效果演示

实现效果，校验用户名是否存在，以及用户名和密码的边输入边验证是否合法。

如有错误，欢迎指正！
