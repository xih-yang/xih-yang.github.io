# 06、jQuery 教程 - jQuery 停止动画stop（）方法
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/6.html
- 分类：前端框架
- 分组：教程目录
### stop（）方法用于在动画或效果完成之前对他们进行停止

> 适用于所有jQuery动画效果函数。

实例：

```java
$('button').click(function(){
	$('.div').stop();
})
```

> stop()会清除被选元素上指定的动画效果。
