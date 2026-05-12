# 37、JavaScript 件对象和事件对象属性
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/37.html
- 分类：前端框架
- 分组：教程目录
### 事件对象

事件绑定“元素节点.on+事件类型=匿名函数

注：系统会在事件绑定一旦完成，生成一个事件对象

普通函数：声明->调用->执行。

```java
function fn(){
    console.log(1)
}
fn()
```

事件处理函数：

```java
var obtn=document.getElementsByTagName('button')[0]
obtn.onclick=function(){
    console.log('事件处理函数')
}
```

注：触发事件的时候，系统会自动去调用事件绑定的函数。**将事件对象当作第一个参数传入**

获取这个事件对象有两种方法：一种是利用argument[0]伪数组获取

另外一种是：直接在定义事件处理函数时，就把形参定义好。 （ 因为实参只有在函数调用的时候才会传入，所以程序员无法给函数传参，只有系统才能够给函数进行传参。) 就好比系统调用函数做的事情就是 fn（事件对象），所以我们定义的时候就可以function fn（event）{} event就是事件对象。

注意：这种方法IE8以下不兼容。但是IE8有另一种方法：window.event

形参：

window.event

每次事件绑定完成后返回的事件对象都是不同的，即使调用的都是window.event

### 事件对象属性

#### button 的属性

格式：事件对象.button

返回值：点击鼠标左键：返回0 点击鼠标滚轮：返回1 点击鼠标右键：返回2

#### 获取鼠标位置的属性（以下三者的区别在于：原点位置不一样）（x轴以右为正，y轴向下为正）

clientX、clientY：

格式：事件对象.clientX、事件对象.clientY

返回值：以**可视窗口左上角**为原点，返回鼠标坐标点（不带单位）

pageX、pageY：

返回值：**整个页面的左上角**为原点，返回鼠标坐标点 （不带单位）

screenX、screenY：

返回值：**整个电脑屏幕左上角**为原点，返回鼠标坐标点 （不带单位）

offetX、offsetY

返回值：**点击元素的左上角为原点**，返回鼠标坐标点 （不带单位）

案例：跟随鼠标移动的提示框

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			*{
				margin: 0;
				padding: 0;
			}
			.main div{
				margin: 200px;
				font-size: 50px;
			}
			.main p{
				display: none;
				position: absolute;
				font-size: 20px;
				width: 200px;
				background-color: lightgray;
			}
		</style>
	</head>
	<body>
		<div class="main">
			<div class="html">
				<a href="">HTML</a>
				<p>
					HTML的全称为超文本标记语言，是一种标记语言。
					它包括一系列标签．通过这些标签可以将网络上的文档格式统一，使分散的Internet资源连接为一个逻辑整体。
					HTML文本是由HTML命令组成的描述性文本，HTML命令可以说明文字，图形、动画、声音、表格、链接等。 [1]
				</p>
			</div>
			<div class="css">
				<a href="">CSS</a>
				<p>
					CSS
					层叠样式表(英文全称：
					Cascading Style Sheets)是一种用来表现HTML（标准通用标记语言的一个应用）
					或XML（标准通用标记语言的一个子集）等文件样式的计算机语言
					。CSS不仅可以静态地修饰网页，还可以配合各种脚本语言动态地对网页各元素进行格式化。
				</p>
			</div>
			<div class="javascript">
				<a href="">JavaScript</a>
				<p>
					avaScript（简称“JS”） 是一种具有函数优先的轻量级，解释型或即时编译型的编程语言。
					虽然它是作为开发Web页面的脚本语言而出名，但是它也被用到了很多非浏览器环境中，JavaScript
					基于原型编程、多范式的动态脚本语言，并且支持面向对象、命令式和声明式（如函数式编程）风格
				</p>
			</div>
		</div>
		<script type="text/javascript">
			var omain=document.getElementsByClassName('main')[0]
			var aA=omain.getElementsByTagName('a')
			var aP=omain.getElementsByTagName('p')
			for(var i=0;i<aA.length;i++){
				aA[i].index=i
				aA[i].onmousemove=function(event){
					console.log(event.pageY,event.pageX)
					for(var j=0;j<aP.length;j++){
						aP[j].style.display='none'
					}
					aP[this.index].style.display='block'
					aP[this.index].style.top=event.pageY+10+'px'
					aP[this.index].style.left=event.pageX+10+'px'
				}
				aA[i].onmouseleave=function(event){
					for(var j=0;j<aP.length;j++){
						aP[j].style.display='none'
					}
				}
			}
		</script>
	</body>
</html>
```

#### 鼠标键+摁键属性：

shifitKey altKey ctrlKey metaKey

shifitKey 按下shifit键为true，默认为false

altKey 按下alt键为true，默认为false

ctrlKey 按下ctrl键为true，默认为false

metaKey window系统 按下window（开始键）为true，mac摁下comman键 为true

应用：可以和其它功能组合：形成快捷键

#### 键盘键属性：

keyCode 键码

功能：返回键盘摁键 键码

返回值：键码：字母都是大写ASIIC码值，其他键都是一一对应的ASIIC码

which

功能：返回键盘摁键 键码

返回值：键码：字母都是大写ASIIC码值，其他键都是一一对应的ASIIC码

charCode字符码（仅在keypress下支持）

返回值：除了keypress事件处理函数触发输出的charCode代表字符码。其他事件处理函数触发的输出的charCode都是0

keydown、keyup事件类型触发事件处理函数输出的键码都是不区分字母大小的，但是keypress事件类型触发事件处理函数输出的键码都是区分字母大小的

#### 触发/目标对象属性

target:（IE8以下不兼容）

功能：找到触发事件发生的目标对象

返回值：触发事件发生的目标对象

window.event.srcElement （IE8以下兼容）

IE7版本

this指向当前函数的主人，target指向引起事件发生的主人。以上面的例子来说，点击事件最开始是由我点击了 第一个li引起的，但是li层级比ul高，当我点击li的时候，同时因为事件冒泡，ul也发生了点击事件。所以事件触发了，而目标对象是li。

阻止事件冒泡属性：

cancleBubble=true

stopProgapation()

cancleBubble=true和stopPropagetion()这两个方法浏览器比较高的版本兼容，但是在低版本的情况下也存在不兼容现象。

实现跨浏览器兼容：

```java
function stopBubble(e){
				if(e.stopPropagation){
					e.stopPropagation()
				}else{
					e.cancelBubble=true;
				}
			}
```

案例：

精灵移动（图片跟随鼠标移动）：

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			*{
				margin: 0;
				padding: 0;
			}
			body,html{
				height: 100%;
				width: 100px%;
				background-color:000000;
				overflow: hidden;
			}
			img{
				position: absolute;
			}
		</style>
	</head>
	<body>
		<img id="imag" src="2700.gif_wh860.gif" style="width: 100px;height: 100px;">
		<script type="text/javascript">
			var oIm=document.getElementById('imag')
			document.onmousemove=function(ev){
				var e=ev?ev:window.event;
				oIm.style.top=e.clientY+10+'px';
				oIm.style.left=e.clientX+10+'px'
				if(e.clientX>(document.body.offsetWidth-100)){
					console.log(e.clientX,document.body.offsetWidth-100)
					oIm.style.left=document.body.offsetWidth-100+'px'
				}
				if(e.clientX<0){
					oIm.style.left=0+'px'
				}
			}
		</script>
	</body>
</html>
```

跟随鼠标移动形成一串连起来的点

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			li {
				position: absolute;
			}
		</style>
	</head>
	<body>
		<ul>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
			<li></li>
		</ul>
		<script type="text/javascript">
			var ali = document.getElementsByTagName('li')
			document.onmousemove = function(ev) {
				var e = ev ? ev : window.event;
				/* 每一次移动，都让后一个替代前一个的位置 */
				for (var i = ali.length-1; i>0; i--) {
					ali[i].style.left = ali[i-1].offsetLeft + 'px';
					ali[i].style.top = ali[i-1].offsetTop + 'px';
				}
				ali[0].style.left=e.clientX+'px'
				ali[0].style.top=e.clientY+'px'
			}
		</script>
	</body>
</html>
```

阻止默认行为属性：

preventDefault() （IE8以下不兼容含IE8 谷歌火狐都可）

window.event.returnValue=flase (IE8以下兼容IE8以上不行 谷歌火狐都可）

方式一：

案例：设置右键菜单：

```java
/* 关闭右键菜单 */
			document.oncontextmenu=function(){
				return false
			}
```

案例：阻止点击 a标签跳转

```java
//阻止a标签跳转
a元素节点.onclick=function(){
					return false
				}
```

comfirm 点击确定返回true 点击取消返回false

以上两种阻止默认行为的方式有一个缺点就是：因为执行程序遇到return就会结束运行，那么后面的程序就会执行不到。

方式二：（适合阻止a链接跳转。但是不适合右键菜单）

案例：拖拽

原理：当**鼠标摁下元素**时，触发的时元素的**mousedown**事件处理函数，与其同时，应该**触发窗口**的移动**mousemove**事件，这样即使在被拖拽的元素之外，也能够捕获到坐标。当鼠标抬起时，可能鼠标不在被拖拽元素的内部了，因此要将**鼠标抬起的mouseup处理函数绑定给浏览器窗口**，并且同时让鼠标移动失效，因为我们给窗口的绑定的鼠标移动，所以只需要将窗口的移动事件处理函数置为空字符串即可。

优化：解决出界
