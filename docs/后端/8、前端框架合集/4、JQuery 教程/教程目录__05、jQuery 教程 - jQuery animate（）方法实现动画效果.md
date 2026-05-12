# 05、jQuery 教程 - jQuery animate（）方法实现动画效果
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/5.html
- 分类：前端框架
- 分组：教程目录
### animate() 方法用于创建自定义动画

实例：
点击按钮，实现div向右移动200px。

```java
$('button').click(function(){
	$('.div').animate({
     left: '200px'});
})
```

> 提示：默认的，所有 HTML 元素都有一个静态位置，且无法移动。

> 如需对位置进行操作，要记得首先把元素的 CSS position 属性设置为 relative、fixed 或 absolute！

```java
.div{
     position: absolute;}
```

### animate() 操作多个属性

```java
$('button').click(function(){
	$('.div').animate({
		left:'200px',
		opacity:'0.8',
		width: '100px',
		height:'100px'
	});
})
```

### animate() 实现多个动画

```java
$('button').click(function(){
	var div = $('.div');
	div.animate({
     height:'300px',opacity:'0.5'},800);
	div.animate({
     width:'300px',opacity:'0.8'},600);
	div.animate({
     height:'100px',opacity:'0.6'},500);
	div.animate({
     width:'100px',opacity:'0.8'},1000);
})
```
