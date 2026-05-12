# 02、jQuery 教程 - jQuery效果隐藏和显示
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/2.html
- 分类：前端框架
- 分组：教程目录
### hide()隐藏元素

```java
$(document).ready(function(){
	$('button').click(function(){
     //点击按钮事件
		$('p').hide();//隐藏p元素
	})
})
```

### show()显示元素

```java
$(document).ready(function(){
	$('button').click(function(){
     //点击按钮事件
		$('p').show();//显示p元素
	})
})
```

语法：

```java
$(selector).hide(speed,callback);
$(selector).show(speed,callback);
```

speed：隐藏/显示的速度，可以取以下值：“slow”、“fast” 或毫秒。

callback：隐藏或显示完成后所执行的函数名称。

```java
$(document).ready(function(){
	$('button').click(function(){
     //点击按钮事件
		$('p').hide(200);//200毫秒内隐藏p元素
	})
})
```

```java
$(document).ready(function(){
	$('button').click(function(){
     //点击按钮事件
		$('p').show(slow);//慢动作显示p元素
	})
})
```

### toggle()切换隐藏显示

> 如果该元素隐藏，使用toggle()就显示元素，反之，如果该元素显示，使用toggle()就隐藏元素：

```java
$(document).ready(function(){
	$('button').click(function(){
     //点击按钮事件
		$('p').toggle();//p元素会在隐藏和显示之间切换
	})
})
```
