# 9、JavaScript 循环语句
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/9.html
- 分类：前端框架
- 分组：教程目录
### 循环语句类型：

while（判断语句）{}

do{…}while(判断语句); 分号尽量不要省略

for（表达式1；表达式2；表达式3）{…}

表达1执行完->求解表达式2（为真）->执行大括号里的执行语句->执行表达式3

表达式1和表达式3可以不用写在括号内，但是分号不能少。尽量不要省略了，因为for循环优势就是这三条语句集合

```java
var i=0
for(;i<100;){
    sum+=i;
    i++
}
```

### break与continue的区别：

break：终止当前循环

continue：跳过本次循环

### 死循环：

while（true/只要为真的语句）{…}

do{…}while（true/只要为真的语句）

for（；；；）{…} 省略三条语句

小tip：&nbsp；半角空格 只占半个空格

&ensp；全角空格 占全部空格，但是宽度无法达到整个字符。

练习：
水仙花：例：153=13+53+33

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<script type="text/javascript">
			var num=153
			for(num=100;num<1000;num++){
				var sum=0
				// 百分位
				var hundre_dist=parseInt(num/100);
				// 十位
				// var ten=num-hundre_dist*100;
				// var ten_dist=parseInt(ten/10);
				var ten_dist=parseInt(num/10)%10
				//个位
				// var single=num-hundre_dist*100-ten_dist*10;
				var single=num%10
				//立方和
				sum=Math.pow(hundre_dist,3)+Math.pow(ten_dist,3)+Math.pow(single,3)
				if(num==sum){
					console.log(num)
				}
			}
		</script>
	</body>
</html>
```

九九乘法表

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<script type="text/javascript">
			for(var i=1;i<=9;i++){
				for(var j=1;j<=i;j++){
					document.write(i+'*'+j+'='+(i*j+' &nbsp'))
				}
				document.write('<br />')
			}
		</script>
	</body>
</html>
```

三角形

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<script type="text/javascript">
			var num=6  /* 打印的行数*/
			// var str=''
			for(var i=0;i<num;i++){
				// var nbsp=' '
				// var star=''
				for(var j=num-i;j>0;j--){
					// nbsp+=' '
					document.write('&nbsp')
				}
				for(var z=0;z<=i;z++){
					// star+='*'
					document.write('*')
				}
				// str+=nbsp+star+'<br />'
				document.write('<br />')
			}
			// document.write(str)
		</script>
	</body>
</html>
```

五位数，回文数：123321

```java
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
	</head>
	<body>
		<script type="text/javascript">
			for(num=10000;num<=99999;num++){
				//万位
					var top1=parseInt(num/10000)
				//千位
					var top2=parseInt(num/1000)%10
				// 个位
					var end1=num%10
				// 十位
					var end2=parseInt((num%100)/10)
					if(top1==end1&&top2==end2){
						console.log(num)
					}
			}
		</script>
	</body>
</html>
```
