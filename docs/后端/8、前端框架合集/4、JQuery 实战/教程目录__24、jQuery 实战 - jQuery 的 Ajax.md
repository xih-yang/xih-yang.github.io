# 24、jQuery 实战 - jQuery 的 Ajax
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/24.html
- 分类：前端框架
- 分组：教程目录
## JSON 工具包

[点我下载](https://download.csdn.net/download/qq_36260974/12006976)

## 一、返回值类型为 Text

### 1、前端页面

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
function ajaxInvoke()
{
	var uname = $("#username").val();
	var opt = 
	{
		//请求方式
		type:'post',
		//请求的地址
		url:'${path}/login',
		/* 
		//方式一（推荐）
		data:
		{
			username:uname//username=uname
		}, 
		*/
		//方式二
		data:"username="+uname,
		//返回值的类型，一般使用两种，text，json
		dataType:'text',
		success:function(responseText)
		{
			//ajax调用成功后的回调方法
			//alert(responseText);
			//jQuery把字符串解析成json对象（方式一）
			//var jsonObj = window.eval("("+responseText+")");
			//jQuery把字符串解析成json对象（方式二）（推荐）
			var jsonObj = $.parseJSON(responseText);
			alert(jsonObj.id+ "  "+jsonObj.name +"   "+jsonObj.age);
		},
		error:function()
		{
			//调用失败进入的方法，如果404或者后台报异常就会走入error
			alert("系统错误");
		}
	};
	$.ajax(opt);
}
</script>
</head>
<body>
<input id="username" name="username" type="text">
<input type="button" value="点击" onclick="ajaxInvoke()">
</body>
</html>
```

### 2、后台 servlet

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
public class MyServlet extends HttpServlet
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
		Person p  = new Person();
		p.setId(1);
		p.setAge(20);
		p.setName(name);
		//注意处理中文处理
		resp.setCharacterEncoding("UTF-8");
		resp.setContentType("text/html;charset=UTF-8");
		//自己组装 json（较麻烦，不推荐）
		//String result ="{\"id\":"+p.getId()+",\"name\":\""+p.getName()+"\",\"age\":"+p.getAge()+"}";
		//resp.getWriter().print(result);
		//使用工具包（建议）
		JSONObject obj = JSONObject.fromObject(p);
		resp.getWriter().print(obj.toString());
	}
}
```

### 3、web.xml 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" xmlns="http://java.sun.com/xml/ns/javaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
	http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">
	<servlet>
		<servlet-name>servlet1</servlet-name>
		<servlet-class>cn.wyx.servlet.MyServlet</servlet-class>
	</servlet>
	<servlet-mapping>
		<servlet-name>servlet1</servlet-name>
		<url-pattern>/login</url-pattern>
	</servlet-mapping>
</web-app>
```

### 4、person 类

```java
package cn.wyx.servlet;
public class Person
{
	private Integer id;
	private String name;
	private Integer age;
	public Integer getId()
	{
		return id;
	}
	public void setId(Integer id)
	{
		this.id = id;
	}
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public Integer getAge()
	{
		return age;
	}
	public void setAge(Integer age)
	{
		this.age = age;
	}
}
```

### 5、效果演示

## 二、返回值类型为 Json

### 1、前端页面

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
function ajaxInvoke()
{
	var uname = $("#username").val();
	var opt = 
	{
		//请求方式
		type:'post',
		//请求的地址
		url:'${path}/login',
		data:
		{
			//username=uname
			username:uname
		},
		//返回值的类型，一般使用两种，text，json
		dataType:'json',
		success:function(responseJSON)
		{
			//ajax调用成功后的回调方法
			//如果dataType是json那么要求后台一定要返回JSONObject或者JSONArray对象,这个后台的json对象会直接转换成js中的json
			//alert(responseJSON.id+ "  "+responseJSON.name +"   "+responseJSON.age);
			for(var i = 0; i < responseJSON.length; i++)
			{
				alert(responseJSON[i].id + "  "+ responseJSON[i].name + "  "+responseJSON[i].age);
			}
		},
		error:function()
		{
			alert("系统错误");
		}
	};
	$.ajax(opt);
}
</script>
</head>
<body>
<input id="username" name="username" type="text">
<input type="button" value="点击" onclick="ajaxInvoke()">
</body>
</html>
```

### 2、后台 servlet

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
public class MyServlet1 extends HttpServlet
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
		List<Person> pList = new ArrayList<Person>();
		for (int i = 0; i < 5; i++)
		{
			Person p  = new Person();
			p.setId(1);
			p.setAge(20);
			p.setName(name + i);
			pList.add(p);
		}
		//注意处理中文处理
		resp.setCharacterEncoding("UTF-8");
		resp.setContentType("text/html;charset=UTF-8");
		JSONArray ja = JSONArray.fromObject(pList);
		resp.getWriter().print(ja);
	}
}
```

### 3、web.xml 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" xmlns="http://java.sun.com/xml/ns/javaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
	http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">
	<servlet>
		<servlet-name>servlet1</servlet-name>
		<servlet-class>cn.wyx.servlet.MyServlet1</servlet-class>
	</servlet>
	<servlet-mapping>
		<servlet-name>servlet1</servlet-name>
		<url-pattern>/login</url-pattern>
	</servlet-mapping>
</web-app>
```

### 4、person 类

```java
package cn.wyx.servlet;
public class Person
{
	private Integer id;
	private String name;
	private Integer age;
	public Integer getId()
	{
		return id;
	}
	public void setId(Integer id)
	{
		this.id = id;
	}
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public Integer getAge()
	{
		return age;
	}
	public void setAge(Integer age)
	{
		this.age = age;
	}
}
```

### 5、效果演示

## 三、关于 AJAX　的同步异步问题

### 1、前端页面

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
function ajaxInvoke()
{
	var uname = $("#username").val();	
	$.ajax
	({
		//请求方式
		type:'post',
		//请求的地址
		url:'${path}/login',
		//同步的ajax,会等着回调函数执行完毕再往下执行
		//async:false,
		data:
		{
			//username=uname
			username:uname
		},
		//返回值的类型，一般使用两种，text，json
		dataType:'json',
		success:function(responseJSON)
		{
			//ajax调用成功后的回调方法
			alert(1);
			//如果dataType是json那么要求后台一定要返回JSONObject或者JSONArray对象,这个后台的json对象会直接转换成js中的json
			//alert(responseJSON.id+ "  "+responseJSON.name +"   "+responseJSON.age);
			for(var i = 0; i < responseJSON.length; i++)
			{
				alert(responseJSON[i].id + "  "+ responseJSON[i].name + "  "+responseJSON[i].age);
			}
		},
		error:function()
		{
			alert("系统错误");
		}
	});
	//默认情况下ajax是异步的，所以程序不会等着回调函数执行完毕采取执行
	alert(2);
}
function ajax()
{
	var result = "";
	$.ajax
	({
		//同步的ajax,会等着回调函数执行完毕再往下执行，如果没有async:false, ajax() 这个方法只会返回空串""
		async:false,
		success:function(respText)
		{
			result = respText;
		}
	});
	return result;
}
</script>
</head>
<body>
<input id="username" name="username" type="text">
<input type="button" value="点击" onclick="ajaxInvoke()">
</body>
</html>
```

### 2、后台 servlet

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
public class MyServlet1 extends HttpServlet
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
		List<Person> pList = new ArrayList<Person>();
		for (int i = 0; i < 5; i++)
		{
			Person p  = new Person();
			p.setId(1);
			p.setAge(20);
			p.setName(name + i);
			pList.add(p);
		}
		//注意处理中文处理
		resp.setCharacterEncoding("UTF-8");
		resp.setContentType("text/html;charset=UTF-8");
		JSONArray ja = JSONArray.fromObject(pList);
		resp.getWriter().print(ja);
	}
}
```

### 3、web.xml 配置文件

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" xmlns="http://java.sun.com/xml/ns/javaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
	http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">
	<servlet>
		<servlet-name>servlet1</servlet-name>
		<servlet-class>cn.wyx.servlet.MyServlet1</servlet-class>
	</servlet>
	<servlet-mapping>
		<servlet-name>servlet1</servlet-name>
		<url-pattern>/login</url-pattern>
	</servlet-mapping>
</web-app>
```

### 4、person 类

```java
package cn.wyx.servlet;
public class Person
{
	private Integer id;
	private String name;
	private Integer age;
	public Integer getId()
	{
		return id;
	}
	public void setId(Integer id)
	{
		this.id = id;
	}
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public Integer getAge()
	{
		return age;
	}
	public void setAge(Integer age)
	{
		this.age = age;
	}
}
```

### 5、效果演示

### （1）、同步效果

### （2）、异步效果

如有错误，欢迎指正！
