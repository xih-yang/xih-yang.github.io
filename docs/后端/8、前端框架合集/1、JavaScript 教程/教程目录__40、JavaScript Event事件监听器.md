# 40、JavaScript Event事件监听器
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/40.html
- 分类：前端框架
- 分组：教程目录
事件监听器：addEventListener（）方法用于向指定元素添加事件监听，IE8以下不支持，火狐和谷歌支持。

普通的事件绑定：

元素节点.on+事件类型=匿名函数

缺点：1.重复事件会被覆盖

缺点2：事件移除使用简单粗暴的null代替事件处理函数

addEventListener事件绑定：

target.addEventlistener(‘事件类型’，匿名函数/执行函数名，false/true)

注：匿名函数名没有双引号

第三个参数是否使用捕获（捉)(反向冒泡)，默认为false，为冒泡

好处：可以绑定多个同事件类型或不同事件类型的事件函数在一个对象上，执行顺序按照绑定的顺序来，并且不会覆盖。

removeEventListener事件移除：

好处：可以精确的删除某一个函数

target.addEventlistener(‘事件类型’，需要移除函数名，false/true)

第二个参数：表示只移除需要的移出的事件处理函数，原有的或者还有其他的处理函数不会被移除

addEventListener和removeEventListener在低版本的IE浏览器不兼容：

IE有类似实现方法attachEvent（）和detachEvent（）（只在IE8及以下可以执行，其他浏览器和其他IE版本不可以用）

格式：target.attachEvent（‘on’+事件类型，匿名函数）

target.detachEvent（‘on’+事件类型，匿名函数）

IE下的addEventListener：

跨浏览器兼容：

```java
function  event(node,type,fn){
    if(node.addEventListener){
        node.addEventListener(type,fn,false)
    }else{
        node.attachEvent('on'+type,fn)
    }
}
```

事件冒泡：点击box3，引起事件冒泡，box2，box跟着发生点击事件

从外到里

事件发生顺序：box3->box2->box

事件捕获：点击box3，引起事件冒泡，box2，box跟着发生点击事件

事件发生顺序：box->box2->box3 (从里到外)

当事件捕获和冒泡事件同时出现时，**先捕获后冒泡**，**⭐最里的元素节点是先冒泡后捕获。**

案例：动态生成表格

注：不能在一开始就定义一个新节点，然后后每次循环就只是给追加同一个新节点，那么会被覆盖，因为检测到父元素有同样的节点，因此就会出现永远添加的只有一个的。

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			tr{
				line-height: 100%;
				text-align: center;
			}
		</style>
	</head>
	<body>
		<input type="text" placeholder="行" value="2"/>
		<input type="text" placeholder="列" value="2"/>
		<button type="button" id="btn">生成表格</button>
		<div id="main">
		</div>
		<script type="text/javascript">
			var obtn=document.getElementById('btn')
			var oIn=document.getElementsByTagName('input')
			var newNode=document.createElement('table')
			var oMain=document.getElementById('main')
			obtn.addEventListener('click',function(){
				if(!oIn[0].value||!oIn){
					alert('请输入行、列')
					return
				}
				for(var i=0;i<oIn[0].value;i++){
					var row=document.createElement('tr')
					if(i%2==0){
						row.style.backgroundColor='pink'
					}
					else{
						row.style.backgroundColor='gold'
					}
					newNode.appendChild(row)
					row.style.height='50px'
				}
				for(var x=0;x<newNode.children.length;x++){
					/* 判断元素节点是否是tr */
					if(newNode.children[x].nodeName.toLowerCase()=='tr'){
						/* 获取到行数，并给每个tr标签添加指定的行 */
						for(var j=0;j<oIn[1].value;j++){
							var col=document.createElement('td');
							if(oIn[1].value-1==j){
								var newBut=document.createElement('button')
								newBut.innerText='删除'
								col.appendChild(newBut)
							}
							col.style.width='50px'
							newNode.children[x].appendChild(col)
						}
					}
				}
				// document.body.lastChild=newNode
				oMain.appendChild(newNode)
			})
			oMain.onclick=function(ev){
				var e=ev||window.event
				var target=e.target||e.srcElement
				if(target.nodeName.toLowerCase()=='button'){
					newNode.removeChild(target.parentNode.parentNode)
				}
			}
		</script>
	</body>
</html>
```

案例：放大镜

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
			#big{
				position: relative;
				margin-left: 100px;
				margin-top: 100px;
				display: inline-block;
				height: 100%;
				overflow: hidden;
			}
			#opcity0{
				width: 200px;
				height: 200px;
				background-color: rgba(235, 235, 235, 0.5);
				position: absolute;
				top: 0;
				left: 0;
				display: none;
			}
			#bigg{
				width: 400px;
				height: 400px;
				overflow: hidden;
				display: inline-block;
				margin-top: 100px;
				vertical-align: top;
			}
			#small{
				width: 200px;
				height: 200px;
				background: url(../精灵移动/2700.gif_wh860.gif) no-repeat;
				/*	让子元素放大两倍 父元素溢出隐藏 */
				transform: scale(2);
			}
		</style>
	</head>
	<body>
		<div id="big">
			<img src="../精灵移动/2700.gif_wh860.gif" >
			<div id="opcity0"></div>
		</div>
		<div id="bigg">
			<div id="small"></div>
		</div>
		<script type="text/javascript">
			var oOp=document.getElementById('opcity0')
			var obig=document.getElementById('big')
			var small=document.getElementById('small')
			obig.onmouseenter=function(){
				oOp.style.display='block'
			}
			obig.onmouseleave=function(){
				oOp.style.display='none'
			}
			oOp.onmousedown=function(ev){
				var e=ev|| window.event;
				// 鼠标初始拖拽位置
				var startX=e.clientX-oOp.offsetLeft;
				var startY=e.clientY-oOp.offsetTop;
				obig.onmousemove=function(ev){
					var e=ev|| window.event;
					// 元素跟随鼠标位置
					oOp.style.left=e.clientX-startX+'px';
					oOp.style.top=e.clientY-startY+'px';
					//获取图片宽高
					var obigW=obig.offsetWidth;
					var obigH=obig.offsetHeight;
					/* 放大镜越界处理 */
					if(oOp.offsetLeft<=0){
						oOp.style.left='0px'
					}
					else if((oOp.offsetLeft+oOp.offsetWidth)>=obigW){
						oOp.style.left=obigW-oOp.offsetWidth+'px'
					}
					if(oOp.offsetTop<=0){
						oOp.style.top='0px'
					}
					else if((oOp.offsetTop+oOp.offsetHeight)>=obigH){
						oOp.style.top=obigH-oOp.offsetHeight+'px'
					}
					//放大显示  移动的位置还是一样，只不过子元素放大两倍而已
					small.style.backgroundPosition=(-oOp.offsetLeft)+'px '+(-oOp.offsetTop)+'px'
					// console.log((-oOp.offsetLeft)+'px '+(-oOp.offsetTop)+'px')
				}
			}
			obig.onmouseup=function(){
				obig.onmousemove=''
			}
		</script>
	</body>
</html>
```
