# 02、HTML5 浏览器支持
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/2.html
- 分类：前端框架
- 分组：教程目录
现代的浏览器都支持 HTML5，对于无法识别的元素，所有浏览器，包括旧的和最新的，会作为内联元素自动处理

同时我们可以使用一些 hack 手段让一些较早的浏览器（不支持 HTML5）支持 HTML5

## 将 HTML5 元素定义为块元素

HTML5 定了 8 个新的 HTML **语义（semantic）** 元素

所有这些元素都是 **块级** 元素

为了能让旧版本的浏览器正确显示这些元素，需要设置 CSS 的 **display:block**

```html
header, section, footer, aside, nav, main, article, figure {
    display: block; 
}
```

## 为 HTML 添加新元素

我们也可以为 HTML 添加新的元素

下面的范例向 HTML 添加的新的元素 ``，并为该元素定义样式

```html
<!DOCTYPE html>
<meta charset="utf-8"> 
<script>
document.createElement("ysHero")</script>
<style>
ysHero{
    display:block;
    background-color:#ddd;
    padding:50px;
    font-size:30px;
}
</style>
<h1>我的第一个标题</h1>
<p>我的第一个段落</p>
<ysHero>我的第一个新元素</ysHero>
```

JavaScript 语句 document.createElement("ysHero") 是为 IE 浏览器添加新的元素

在浏览器中显示如下

## Internet Explorer 浏览器问题

虽然我们可以使用 document.createElement("element") 方法来为 IE 浏览器添加 HTML5 元素

但是Internet Explorer 8 及更早 IE 版本的浏览器不支持这种方式

不过，我们可以使用 Sjoerd Visscher 创建的 "HTML5 Enabling JavaScript", " **shiv** " 来解决该问题

#### 国外

```html
<!--[if lt IE 9]>
  <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

国内

```html
<!--[if lt IE 9]>
<script src="https://cdn.staticfile.org/html5shiv/r29/html5.min.js"></script>
<![endif]-->
```

这个代码是一个注释，作用是在 IE 浏览器的版本小于 IE9 时将读取 html5.js 文件，并解析它

针对IE 浏览器，html5shiv 是比较好的解决方案

html5shiv 主要解决 HTML5 提出的新的元素不被 IE6-8 识别，这些新元素不能作为父节点包裹子元素，并且不能应用 CSS 样式

### 范例： 完美的 Shiv 解决方案

```html
<!DOCTYPE html>
<meta charset="utf-8">
<!--[if lt IE 9]>
<script src="https://cdn.staticfile.org/html5shiv/r29/html5.min.js"></script>
<![endif]-->
<h1>我的第一篇文章</h1>
<article>
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
</article>
```

html5shiv.js 引用代码必须放在 HTML 文档头部，因为 IE 浏览器在解析 HTML5 新元素时需要先加载该文件

在浏览器中显示如下
