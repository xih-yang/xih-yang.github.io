# 01、jQuery 教程 - jQuery常用鼠标触发元素事件（鼠标点击、进入、离开）
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/1.html
- 分类：前端框架
- 分组：教程目录
### jQuery 事件方法

**1、click事件：点击鼠标左键时触发**

```java
$(document).ready(function(){
	$('div').click(function(){
		alert("鼠标点击了！");
	})
});
```

**2、mouseover事件：鼠标从一个元素移入另一个元素时触发（鼠标进入）**

```java
$(document).ready(function(){
	$('div').mouseover(function(){
		alert("鼠标进入了！");
	})
});
```

**3、mouseout事件：鼠标从一个元素移出时触发（鼠标离开）**

```java
$(document).ready(function(){
	$('div').mouseout(function(){
		alert("鼠标离开了！");
	})
});
```

**4、mouseenter事件：鼠标从一个元素移入另一个元素时触发（鼠标进入）**

> *此事件可以阻止冒泡事件发生

```java
$(document).ready(function(){
	$('div').mouseenter(function(){
		alert("鼠标进入了！");
	})
});
```

**5、mouseleave事件：鼠标从一个元素移出时触发（鼠标离开）**

> *此事件可以阻止冒泡事件发生

```java
$(document).ready(function(){
	$('div').mouseleave(function(){
		alert("鼠标离开了！");
	})
});
```
