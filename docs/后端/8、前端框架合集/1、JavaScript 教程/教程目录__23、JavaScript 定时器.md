# 23、JavaScript 定时器
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/23.html
- 分类：前端框架
- 分组：教程目录
格式：setInterval（函数，毫秒数）

功能：每个对应的毫秒数，执行一次传入函数

返回值：启动定时器的，系统分配的编号

clearInterval(timer) ：取消定时器

一般情况下：将没有名字的函数称为匿名函数

vartimer=setInterval(匿名函数名/函数体，毫秒数)

练习：实时显示时间

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			#time{
				background-color:DAA520;
				font-size: 25px;
				width: 500px;
				height: 50px;
				margin: 0 auto;
				text-align: center;
				line-height: 50px;
			}
		</style>
	</head>
	<body>
		<div id="time"></div>
		<script type="text/javascript">
			var oTime=document.getElementById('time')
			function show(){
				var timer=new Date();
				var year=timer.getFullYear();
				var month=timer.getMonth()+1;
				var day=timer.getDate();
				function realDay(week){
					var arr=['日','一','二','三','四','五']
					return arr[week];
				}
				var week=realDay(timer.getDay())
				var hour=timer.getHours();
				var minute=timer.getMinutes();
				var seconds=timer.getSeconds()
				function doublenum(time){
					if(time<=9){
						return '0'+time;
					}
					else{
						return  time
					}
				}
				return year+'年'+month+'月'+day+'日'+' 星期'+week+''+doublenum(hour)+":"+doublenum(minute)+":"+doublenum(seconds)
			}
			setInterval(function(){
				 oTime.innerText=  show()
			},1000)
		</script>
	</body>
</html>
```

秒表：

window.οnlοad=function(){写在这里的执行代码，是整个页面加载完成以后才执行的（固定格式）}：一般适用于将script标签写在head标签内，优先级比body的script优先级低。

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<style type="text/css">
			.show {
				width: 300px;
				height: 400px;
				background-color: pink;
				margin: 100px auto;
				text-align: center;
			}
			.text {
				height: 200px;
				line-height: 200px;
				text-align: center;
				font-size: 50px;
			}
			button {
				border: 0;
				background-color:DAA520;
				width: 200px;
				height: 50px;
				font-size: 30px;
				margin-bottom: 10px;
				color: white;
			}
		</style>
		<script type="text/javascript">
			window.onload = function() {
				function $(name) {
      //name是字符串类型的数据
					if (name[0] == '.') {
						var newname = name.slice(1)
						return document.getElementsByClassName(newname)
					} else if (name[0] == '#') {
						var newname = name.slice(1)
						return document.getElementById(newname)
					} else {
						return document.getElementsByTagName(name)
					}
				}
				// var start = document.getElementsByTagName('button')[0]
				// var replay = document.getElementsByTagName('button')[1]
				// var ote = document.getElementsByClassName('text')[0];
				// var hour = document.getElementById('hours')
				// var minute = document.getElementById('minutes')
				// var second = document.getElementById('seconds')
				var start = $('button')[0]
				var replay = $('button')[1]
				var ote = $('.text')[0]
				var second = $('#seconds')
				var minute = $('#minutes')
				var hour = $('#hours')
				// var Hcount = 0;
				// var Mcount = 0;
				// var Scount = 0
				var count = 0;
				var click = false
				var timer = null;
				function doubleNum(num) {
					if (num < 9) {
						return '0' + num;
					} else {
						return num
					}
				}
				start.onclick = function() {
					click = !click;
					if (click) {
						timer = setInterval(function() {
							count++;
							second.innerText =doubleNum(parseInt((count) % 60)) ;
							minute.innerText =doubleNum(parseInt((count) / 60) % 60)
							hour.innerText =doubleNum(parseInt(((count) / 3600) % 24) )
							// if (Scount == 60) {
							// 	Scount = 0;
							// 	Mcount++;
							// 	if (Mcount == 60) {
							// 		Mcount = 0;
							// 		Hcount++;
							// 		if (Hcount == 24) {
							// 			Hcount = 0
							// 		}
							// 	}
							// }
							start.innerText = '停止计时'
						}, 100)
					} else {
						clearInterval(timer)
						start.innerText = '开始计时'
					}
				}
				replay.onclick = function() {
					// Scount = 0;
					// Hcount = 0;
					// Mcount = 0;
					click = false
					count = 0;
					// second.innerText = doubleNum(Scount);
					// minute.innerText = doubleNum(Mcount);
					// hour.innerText = doubleNum(Hcount);
					second.innerText =doubleNum(parseInt((count) % 60)) ;
					minute.innerText =doubleNum(parseInt((count) / 60) % 60)
					hour.innerText =doubleNum(parseInt(((count) / 3600) % 24) )
					clearInterval(timer)
					start.innerText = '开始计时'
				}
			}
		</script>
	</head>
	<body>
		<div class="show">
			<div class="text">
				<span id="hours">00</span>:<span id="minutes">00</span>:<span id="seconds">00</span>
			</div>
			<button type="button">开始计时</button>
			<button type="button">复位</button>
		</div>
	</body>
</html>
```
