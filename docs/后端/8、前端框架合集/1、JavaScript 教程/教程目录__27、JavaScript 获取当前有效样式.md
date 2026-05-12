# 27、JavaScript 获取当前有效样式
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/27.html
- 分类：前端框架
- 分组：教程目录
通过.style.属性名可以获取行内样式的属性值，但是无法获取内部样式的属性值

#### 获取当前有效样式：

系统提供了两个方法：不同浏览器使用的方法

**1、** node.currentStyle[属性名]IE兼容获取有效样式方法；

**2、** getComputedStyle（node）[属性名]chrome、firefox兼容获取有效样式方法；

**只有权重值高的才能够被外界读取到样式，也就是不管是.style.属性名，还是系统提供的方法，都是只能获取到权重值最高的样式**

#### 跨浏览器的兼容

如果每次都要因为浏览器的不同，而需要单独的去使用node.currentStyle[ … ]和getComputedStyle（node）[ … ] 的话。那么就会造成如果我不知道我使用的是什么浏览器，那么我根本就无法知道我需要哪种方式去获取有效样式。因此我们需要跨浏览器兼容，实现不管在什么样的浏览器我只需要通过声明的函数，就能够获取有效样式

```java
function getStyle(node,classStr){
//node  访问有效样式的目标节点  ;classStr  :访问的样式名（属性名）
				return node.currentStyle?node.currentStyle[classStr]:getComputedStyle(node)[classStr]
			}
```

为什么只有获取当前有效样式兼容，而没有设置当前有效样式呢？因为我们在设置的时候可以直接通过node.style.属性名=xxx;样式就会直接添加到行内样式，行内样式权重值是最高的。所以没必要设置方法去设置设置当前样式。

练习：定时改变字体大小和颜色

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<div class="text">改变字体颜色和大小</div>
		<script type="text/javascript">
			var oTe=document.getElementsByClassName('text')[0]
			var count=0;
			var speed=6;
			function getStyle(node,style){
				return node.currentStyle?node.currentStyle[style]:getComputedStyle(node)[style]
			}
			function setRodColor(){
				return 'rgb('+parseInt(Math.random()*256)+','+parseInt(Math.random()*256)+','+parseInt(Math.random()*256)+')'
			}
			setInterval(function(){
				oTe.style.color=setRodColor();
				var fSize=parseInt(getStyle(oTe,'fontSize')) ;
				count++;
				oTe.style.fontSize=fSize+speed+'px'
				if(count%6==0){
					speed=speed*(-1);
				}
			},1000)
		</script>
	</body>
</html>
```
