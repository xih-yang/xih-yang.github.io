# 02、jQuery 实战 - Jquery 对象
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/2/2.html
- 分类：前端框架
- 分组：教程目录
## 一、什么是 jQuery 对象？

- jQuery 对象就是通过 jQuery 包装 DOM 对象后产生的对象。
- jQuery 对象是 jQuery 独有的. 如果一个对象是 jQuery 对象, 那么它就可以使用 jQuery 里的方法。
- 虽然 jQuery 对象是包装 DOM 对象后产生的，但是 ***jQuery 无法使用 DOM 对象的任何方法，同理 DOM 对象也不能使用 jQuery 里的方法，乱使用会报错***。

## 二、DOM 对象转成 jQuery 对象

对于已经是一个 DOM 对象，只需要用 `$()` 把 DOM 对象包装起来，就可以获得一个 jQuery 对象了，如：`$(DOM对象)` 。转换后就可以使用 jQuery 中的方法了！

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
	var div1 = document.getElementById("myinput");
	//把dom转换成jQuery对象
	var jdiv1 = $(div1);
	//使用jquery里的方法来取值
	alert(jdiv1.val());
});
function myclick()
{
	var div1 = document.getElementById("myinput");
	//把dom转换成jQuery对象
	var jdiv1 = $(div1);
	//使用jquery里的方法来取值
	alert(jdiv1.val());
}
</script>
</head>
<body>
<input id="myinput" type="text">
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

## 三、jQuery 对象转成 DOM 对象

两种转换方式将一个 jQuery 对象转换成 DOM 对象：`[index]` 和 `.get(index);`

(1)jQuery 对象是一个数组对象，可以通过 [index] 的方法，来得到相应的 DOM 对象。

(2)jQuery 本身提供，通过 `.get(index)` 方法，得到相应的 DOM 对象

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
	var div1 = document.getElementById("myinput");
	//把dom转换成jQuery对象
	var jdiv1 = $(div1);
	//把jQuery对象转换成dom对象，由于dom转jQuery后实际上是一个数组，所以取数组里的单独的元素就是dom对象
	//方式一
	alert(jdiv1[0].value);
	//方式二
	alert(jdiv1.get(0).value);
}
</script>
</head>
<body>
<input id="myinput" type="text">
<input type="button" value="点击" onclick="myclick()">
</body>
</html>
```

如有错误，欢迎指正！
