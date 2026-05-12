# 15、Angular 4 教程 - NG-ZORRO：ICON/Button/Grid
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/15.html
- 分类：前端框架
- 分组：教程目录
NG-ZORRO使用起来非常方便，上手很快，这篇文章介绍一下如何使用NG-ZORRO的ICON/Button/Grid。

## Button（nz-button）

属性设定如下，可以结合nz-button-group使用

属性
说明
类型
默认值

nzType
设置按钮类型，可选值为 primary dashed danger default
String
-

nzShape
设置按钮形状，可选值为 circle 或者不设
String
-

nzSize
设置按钮大小，可选值为 small large 或者不设
String
default

nzGhost
设置幽灵按钮
Boolean
false

nzLoading
设置按钮载入状态
Boolean
false

## Icon

使用例如下：

```java
<i class="anticon anticon-${type}"></i>
```

## Grid(nz-row & nz-col)

### [nz-row]

成员
说明
类型
默认值

nzGutter
栅格间隔
Number
0

nzType
布局模式，可选 flex，现代浏览器下有效
String

nzAlign
flex 布局下的垂直对齐方式：top middle bottom
String
top

nzJustify
flex 布局下的水平排列方式：start end center space-around space-between
String
start

### [nz-col]

成员
说明
类型
默认值

nzSpan
栅格占位格数，为 0 时相当于 display: none
Number
-

nzOrder
栅格顺序，flex 布局模式下有效
Number
0

nzOffset
栅格左侧的间隔格数，间隔内不可以有栅格
Number
0

nzPush
栅格向右移动格数
Number
0

nzPull
栅格向左移动格数
Number
0

nzXs
<768px 响应式栅格，可为栅格数或一个包含其他属性的对象
Number|Object
-

nzSm
≥768px 响应式栅格，可为栅格数或一个包含其他属性的对象
Number|Object
-

nzMd
≥992px 响应式栅格，可为栅格数或一个包含其他属性的对象
Number|Object
-

nzLg
≥1200px 响应式栅格，可为栅格数或一个包含其他属性的对象
Number|Object
-

nzXl
≥1600px 响应式栅格，可为栅格数或一个包含其他属性的对象
Number|Object
-

## 例子

### 事前准备

如何引入NG-ZORRO的Angular项目中，请参看：[http://blog.csdn.net/liumiaocn/article/details/78526421](http://blog.csdn.net/liumiaocn/article/details/78526421)

### 代码

#### CSS

```java
[root@mail app]# cat app.component.css 
.nzrow-box-1 {
  background:#BFBFBF;
  color:#FFF;
  height:40px;
  font-size:30px;
  text-align:center;
}
.nzrow-box-2 {
  background:#CFCFCF;
  color:#FFF;
  height:40px;
  font-size:30px;
  text-align:center;
}
[root@mail app]#
```

#### HTML模板

```java
[root@mail app]# cat app.component.html 
<!--The content below is only a placeholder and can be replaced.-->
<div style="text-align:center">
  <h1>
    Welcome to {
     {
     title}}!
  </h1>
</div>
<h2>Buttons</h2>
<button nz-button [nzType]="'primary'">primary</button>
<button nz-button [nzType]="'dashed'">dashed</button>
<button nz-button [nzType]="'default'">default</button>
<button nz-button [nzType]="'danger'">danger</button>
<button nz-button [nzShape]="'default'">defaultShape</button>
<button nz-button [nzShape]="'circle'">O</button>
<button nz-button [nzSize]="'large'">L</button>
<button nz-button [nzSize]="'default'">M</button>
<button nz-button [nzSize]="'small'">S</button>
<button nz-button [nzGhost]="true">L</button>
<button nz-button [nzLoading]="true">L</button>
<h1>nz-row:nz-col</h1>
<div nz-row>
  <div nz-col [nzSpan]="24"><div class="nzrow-box-1">100%</div></div>
</div>
<hr>
<div nz-row>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2">25%</div></div>
</div>
<hr>
<div nz-row>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-1">33%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-2">33%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-1">33%</div></div>
</div>
<hr>
<hr>
<div nz-row>
  <div nz-col [nzSpan]="12"><div class="nzrow-box-1">50%</div></div>
  <div nz-col [nzSpan]="12"><div class="nzrow-box-2">50%</div></div>
</div>
<hr>
<div nz-row>
  <div nz-col [nzSpan]="16"><div class="nzrow-box-1">66%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-2">33%</div></div>
</div>
<hr>
<h1>nz-row:nz-col: nzGutter :16+8n</h1>
<div nz-row [nzGutter]="48">
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1">25%</div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2">25%</div></div>
</div>
<hr>
<div nz-row [nzGutter]="40">
  <div nz-col [nzSpan]="8"><div class="nzrow-box-1">33%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-2">33%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-1">33%</div></div>
</div>
<hr>
<hr>
<div nz-row [nzGutter]="32">
  <div nz-col [nzSpan]="12"><div class="nzrow-box-1">50%</div></div>
  <div nz-col [nzSpan]="12"><div class="nzrow-box-2">50%</div></div>
</div>
<hr>
<div nz-row [nzGutter]="32">
  <div nz-col [nzSpan]="16"><div class="nzrow-box-1">66%</div></div>
  <div nz-col [nzSpan]="8"><div class="nzrow-box-2">33%</div></div>
</div>
<hr>
<h1>icon</h1>
<div nz-row>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1"><i class="anticon anticon-step-backward"></i></div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2"><i class="anticon anticon-step-forward"></i></div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-1"><i class="anticon anticon-fast-backward"></i></div></div>
  <div nz-col [nzSpan]="6"><div class="nzrow-box-2"><i class="anticon anticon-fast-forward"></i></div></div>
</div>
<hr>
[root@mail app]# 
```

### 结果确认
