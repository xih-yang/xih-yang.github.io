# 04、jQuery 教程 - jQuery实现元素向上向下滑动效果
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/4.html
- 分类：前端框架
- 分组：教程目录
### 1、slideDown（）方法

> slideDown() 方法用于向下滑动元素。

```java
$("button").click(function(){
  $("#div").slideDown();
});
```

### 2、slideUp（）方法

> slideUp() 方法用于向上滑动元素。

```java
$("button").click(function(){
  $("#div").slideUp();
});
```

**3、** slideToggle（）方法；

> slideToggle() 方法可以在 slideDown() 与 slideUp() 方法之间进行切换。

```java
$("button").click(function(){
  $("#div").slideToggle();
});
```
