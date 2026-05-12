# 73、JavaScript Jquery的案例练习
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/73.html
- 分类：前端框架
- 分组：教程目录
放大镜：

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<script src="../js/jquery-3.4.1.js" type="text/javascript" charset="utf-8"></script>
		<style type="text/css">
			*{
				margin: 0;
				padding: 0;
			}
			.box img{
				width: 300px;
				height: 300px;
			}
			.box{
				display: inline-block;
				width: 300px;
				height: 300px;
			}
			.small{
				display: none;
				width: 100px;
				height: 100px;
				background-color: rgba(255,255,240,0.5);
				position: absolute;
				top: 0;
				left: 0;
			}
			.big{
				position: relative;
				display: inline-block;
				width: 200px;
				height: 200px;
				overflow: hidden;
				border: 1px solid black;
			}
			.big img{
				width: 600px;
				height: 600px;
				position: absolute;
				z-index: -1;
			}
		</style>
		<script type="text/javascript">
			$(function(){
				$('.box').mouseenter(function(){
					$('.small').css('display','block')
				})
				$('.box').mouseleave(function(){
					$('.small').css('display','none')
				})
				$('.small').mousedown(function(e){
					let boxL=e.clientX-this.offsetLeft
					let boxT=e.clientY-this.offsetTop
					var _this=this
					$(document).mousemove(function(e){
						let L=e.clientX-boxL
						let T=e.clientY-boxT
						let limitL=parseInt($('.box').css('width'))+$('.box').offset().left-parseInt($('.small').css('width'))
						let limitT=parseInt($('.box').css('height'))+$('.box').offset().top-parseInt($('.small').css('height'))
						if(L<=0){
							L=0+'px'
						}else if(L>=limitL){
							L=limitL+'px'
						}
						if(T<=0){
							T=0+'px'
						}else if(T>=limitT){
							T=limitT+'px'
						}
						$(_this).css({
							left:L+'px',
							top:T+'px'
						})
						let imgL=-L*2+'px'
						let imgT=-T*2+'px'
						$('.big img').css({
							left:imgL,
							top:imgT
						})
					})
				})
			})
		</script>
	</head>
	<body>
		<div class="box">
			<img src="../img/龙猫.jpeg" >
			<div class="small"></div>
		</div>
		<div class="big">
			<img src="../img/龙猫.jpeg" >
		</div>
	</body>
</html>
```

轮播图

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<script src="../js/jquery-3.4.1.js" type="text/javascript" charset="utf-8"></script>
		<style type="text/css">
			*{
				margin: 0;
				padding: 0;
			}
			.box{
				position: relative;
				width: 300px;
				height: 200px;
				margin: 100px 100px;
				border: 1px solid black;
				overflow: hidden;
			}
			img{
				width: 300px;
				height: 200px;
			}
			ul{
				float: left;
				width: 1500px;
				height: 200px;
				position: absolute;
				left: 0;
				top: 0;
			}
			ul::after{
				content: :'';
				display: block;
				height: 100%;
			}
			li{
				float: left;
				list-style: none;
			}
			#point {
				width: 100px;
				height: 20px;
				position: absolute;
				left: 50%;
				top: 180px;
				transform: translateX(-50%);
			}
			#point li{
				float: left;
				width: 10px;
				height: 10px;
				margin: 5px;
				border-radius: 5px;
				background-color: orange;
				z-index: 2;
			}
			#point li:nth-child(1){
				background-color: red;
			}
		</style>
		<script type="text/javascript">
			$(function(){
				let point=0
				let oul=document.getElementsByTagName('ul')[0]
				function getStyle(attr,node){
					return node.currentStyle?node.currentStyle[attr]:getComputedStyle(node)[attr]
				}
				/* 图片滑动 */
				function move({
     attr,itarget,node,complete}){
					node.time=setInterval(function(){
						if(parseInt(getStyle(attr,node))==itarget){
							if(complete){
								complete()
							}
						}else{
							let speed=-5
							node.style[attr]=(parseInt(getStyle(attr,node))+speed)+'px';
							let pointShow=-parseInt(parseInt(getStyle(attr,node))%300)
							/* 指示点改变 */
							if(pointShow==0){
								point++;
								if(point==4){
									point=0
								}
							}
							$('#point li').css('backgroundColor','orange')
							$('#point li').eq(point).css('backgroundColor','red')
						}
					},36)
				}
				function banner(){
						move({
							attr:'left',
							itarget:-1200,
							node:oul,
							complete:function(){
								oul.style.left=0+'px'
							}
						})
				}
				banner()
				/* 指示点 */
				$('#point li').hover(function(){
					clearInterval(oul.time)
					$('#point li').css('backgroundColor','orange')
					$('#point li').eq($(this).index()).css('backgroundColor','red')
					$('#image').css('left',-$(this).index()*300+'px')
					point=$(this).index()
				},function(){
					banner()
				})
			})
		</script>
	</head>
	<body>
		<div class="box">
			<ul id="image">
				<li><img src="../img/龙猫.jpeg" ></li>
				<li><img src="../img/可爱二.jpg" ></li>
				<li><img src="../img/龙猫.jpeg" ></li>
				<li><img src="../img/可爱二.jpg" ></li>
				<li><img src="../img/龙猫.jpeg" ></li>
			</ul>
			<!-- 指示点 -->
			<ul id="point">
				<li></li>
				<li></li>
				<li></li>
				<li></li>
			</ul>
		</div>
	</body>
</html>
```
