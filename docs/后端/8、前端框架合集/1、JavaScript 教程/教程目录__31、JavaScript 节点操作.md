# 31、JavaScript 节点操作
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/31.html
- 分类：前端框架
- 分组：教程目录
document.body：获取body标签

document.write() ： 将任意字符串插入到文档中（包括标签）

注：会覆盖掉页面上所有的内容。

createElement（）

功能：创建一个新的**元素节点**

格式：document.createElement（）

参数：标签名

返回值：创建好的这个节点

createTextNode（）

功能：创建一个文本节点；（纯文本）

格式：document.creatTextNode（）

返回值：返回一个新的文本节点

appendChild()

格式：node.appendChild(newNode)

功能：将newNode作为node的子节点，插在node的子节点的末尾

insertBefore（）

格式：node.insertBefore(beforNode，laterNode)

功能：在元素节点node中，将子节点beforeNode插在子节点laterNode前面

注：laterNode必须时已经是node的子节点，而不是新创建的节点，否则会报错。

replaceChild（）

格式：node.replaceChild(newNode,oldNode)

功能：在node节点当中，用newNode子节点替换oldNode子节点

cloneNode（）

格式：node.cloneNode（）

参数：true

返回值：克隆出来的新节点

注：如果仅仅是node.cloneNode（），克隆出来的仅仅时一个外层节点，里面的子节点不会被克隆出来。但是如果是node.cloneNode（true）的话，就会克隆出整个节点包括子节点。

浅克隆：

深克隆

removeChild（）

格式：node.removeChild（oldnode）

功能：删除box节点。必须通过父节点删除子节点。

案例：节点的增删复制

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
			.control{
				width: 400px;
				background-color:FFC0CB;
				margin: 100px auto 0;
				line-height: 30px;
			}
			button{
				font-size: 20px;
				background-color: yellow;
				color: green;
				border: 0;
				border-radius: 5px;
			}
			input{
				height:30px ;
			}
			#main{
				margin: 0 auto;
				background-color:DAA520;
				height: 400px;
				width: 400px;
			}
			.newnode{
				height: 30px;
				display: flex;
				justify-content: space-between;
				width: 100%;
				margin-bottom: 5px;
			}
			.newnode p{
				text-align: center;
				color: white;
				line-height: 30px;
			}
			.newnode button{
				width: 50px;
				height: 30px;
				font-size: 20px;
				border-radius: 5px;
				background-color: crimson;
				color: azure;
			}
		</style>
	</head>
	<body>
		<div class="control">
			<input type="text" name="" id="text" value="" />
			<button type="button" id="add">增加</button>
			<button type="button" id="remove">删除</button>
			<button type="button" id="clone">拷贝</button>
		</div>
		<div id="main"></div>
		<script type="text/javascript">
			var oTe=document.getElementById('text');
			var oadd=document.getElementById('add');
			var oremove=document.getElementById('remove')
			var ocop=document.getElementById('clone')
			var oMain=document.getElementById('main')
			function getColor(){
       /* 获取随机背景颜色*/
				return 'rgb('+parseInt(Math.random()*256)+','+parseInt(Math.random()*256)+','+parseInt(Math.random()*256)+')'
			}
			/* 增加 */
			oadd.onclick=function(){
				var newnode=document.createElement('div')
				var newnodeP=document.createElement('p')
				var newnodeB=document.createElement('button')
				var text=oTe.value;
				var newTextNode=document.createTextNode(text);
				if(oTe.value){
					newnode.className='newnode'
					newnode.style.backgroundColor=getColor();
					newnode.appendChild(newnodeP)   /* div节点末尾追加p*/
					newnode.appendChild(newnodeB)/* div节点追加button */
					newnodeP.appendChild(newTextNode);  /* 在p节点追加文本节点：输入框内容*/
					newnodeB.innerText='删除'      /* 在button节点添加'删除'内容*/
					oMain.appendChild(newnode)    /*在main节点追加创建的的新节点 */
					oTe.value=''
					/* 在节点创建的时候，就应该给每一个关闭添加删除事件 方法1 */
					// newnodeB.οnclick=function(){
					// 	oMain.removeChild(newnode)
					// }
				}else{
					alert('内容不能为空！！！！！')
				}
			}
			/* 删除最后一个 */
			oremove.onclick=function(){
				var last=oMain.lastElementChild;
				oMain.removeChild(last)
			}
			/* 拷贝 */
			ocop.onclick=function(){
				/* 深克隆 */
				var copy_last=oMain.lastElementChild.cloneNode(true);
				oMain.appendChild(copy_last)
			}
			/* 点击任一项的删除进行删除 */
			oMain.onclick=function(ev){
				var e=ev||window.event;
				var target=e.target||e.srcElement;
				console.log(target.nodeName)
				if(target.nodeName.toLowerCase()=='button'){
					oMain.removeChild(target.parentNode)
				}
			}
		</script>
	</body>
</html>
```
