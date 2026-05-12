# 04、CSS基础知识 - 快速生成html结构语法
- 来源：https://ddkk.com/zhuanlan/qianduan/css/1/4.html
- 分类：前端框架
- 分组：教程目录
## 一、快速生成HTML结构语法

> 1. 生成标签——直接输入标签名，按tab键或回车键即可

- 输入div然后按tab键或回车键， 可以生成 ````

```css
//div + tab键/回车键：
<div></div>
```

> 2. 如果想要生成多个相同标签——使用*

- 输入div*3， 可以生成3个````

```css
//div*3 + tab键/回车键（*左右不要加空格）：
<div></div>
<div></div>
<div></div>
```

> 3. 如果有父子级关系的标签——使用 >

- 输入 ul>`li，可以生成````````

```css
	//ul>li + tab键/回车键（>左右不要加空格）：
	<ul>
		<li> </li>
	</ul>
```

> 4. 如果有兄弟关系的标签——使用 +

- 输入 div+p，可以生成 ````````

```css
//div+p + tab键/回车键（+左右不要加空格）：
<div></div>
<p></p>
```

> 5. 如果生成带有类名或者id名字的——直接写 .demo 或者 #two ，按tab 键或回车键

- 输入.demo，可以生成````
- 输入#two，可以生成````

```css
//.demo + tab键/回车键:
<div class="demo"></div>
//#two + tab键/回车键:
<div id="two"></div>
```

> 6.如果生成的div 类名是有顺序的——使用自增符号 $

```css
//.demo$*6 + tab键/回车键:
<div class="demo1"></div>
<div class="demo2"></div>
<div class="demo3"></div>
<div class="demo4"></div>
<div class="demo5"></div>
<div class="demo6"></div>
```

> **7. 如果想要在生成的标签内部写内容——使用 { } **

```css
//#one$*3{$3} + tab键/回车键:
<div id="one1">13</div>
<div id="one2">23</div>
<div id="one3">33</div>
```
