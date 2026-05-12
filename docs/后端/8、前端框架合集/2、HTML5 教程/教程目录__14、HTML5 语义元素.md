# 14、HTML5 语义元素
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/14.html
- 分类：前端框架
- 分组：教程目录
## 什么是语义元素?

一个语义元素能够清楚的描述其意义给浏览器和开发者

**无语义** 元素: `` 和 `` - 无需考虑内容

**语义** 元素: ``, `` 和 `` - 清楚的定义了它的内容

## 浏览器支持

Internet Explorer 9+, Firefox, Chrome, Safari 和 Opera 支持语义元素

**注意:** Internet Explorer 8 及更早版本不支持该元素，不过我们在文章的的末尾提供了兼容的解决方法

## HTML5 中新的语义元素

在HTML5 之前，许多的网站都包含了以下 HTML 代码

```html
<div id="nav">
<div class="header">
<div id="footer">
```

用来指明导航链接, 头部, 以及尾部

HTML5 则提供了新的语义元素来明确一个 Web 页面的不同部分

**1、**``；

**2、**``；

**3、**``；

**4、**``；

**5、**``；

**6、**``；

**7、**``；

**8、**``；

## HTML5  元素

元素`` 用于定义文档中的节 ( section、区段)，比如章节、页眉、页脚或文档中的其它部分

`` 可以包含一组内容及其标题

```html
<section>
  <h1>日志</h1>
  <p>是我在乎，才会喜怒无常</p>
</section>
```

## HTML5  元素

元素`` 用于定义独立的内容

`` 用法

**1、** Forumpost；

**2、** Blogpost；

**3、** Newsstory；

**4、** Comment；

```html
<article>
  <h1>全部评论</h1>
  <p>爱你，就是一万年</p>
</article>
```

## HTML5  元素

元素`` 标签定义导航链接的部分

`` 元素用于定义页面的导航链接部分区域，但是，不是所有的链接都需要包含在 `` 中

```html
<nav>
    <a href="/penglei/html">HTML 5</a> |
    <a href="/penglei/css">CSS 3</a> |
    <a href="/penglei/javascript">JavaScript</a> |
    <a href="/penglei/jquery">jQuery</a>
</nav>
```

## HTML5  元素

元素`` 定义了页面主区域内容之外的内容 ( 比如侧边栏 )

`` 元素的内容应与主区域的内容相关

```html
<h3>我的日志</h3>
<p>今天天气好冷，心情特沮丧</p>
<aside>
  <h4>每日正能量</h4>
  <p>明天就会天晴，还你以一个艳阳高照天</p>
</aside>
```

## HTML5  元素

元素`` 描述了文档的头部区域

`` 元素注意用于定义内容的介绍展示区域

我们可以在一个页面中使用多个 `` 元素

```html
<article>
  <header>
    <h1>2017-10-1 日志</h1>
    <p><time pubdate datetime="2017-10-1"></time></p>
  </header>
  <p>放假第一天，心情特好，游玩了下黄山</p>
</article>
```

## HTML5  元素

元素`` 元素描述了文档的底部区域

`` 元素应该包含它的包含元素

一个页脚通常包含文档的作者，著作权信息，链接的使用条款，联系信息等

我们可以在一个页面中使用多个 `` 元素

```html
<footer>
  <p>作者: penglei</p>
  <p><time pubdate datetime="2017-10-01"></time></p>
</footer>
```

## HTML5  和  元素

`` 元素定义了独立的流内容（图像、图表、照片、代码等等）

`` 元素的内容应该与主内容相关，但如果被删除，则不应对文档流产生影响

`` 标签定义 `` 元素的标题

`` 元素应该被置于 "figure" 元素的第一个或最后一个子元素的位置

```html
<figure>
  <img src="/static/i/img1.jpg" alt="The Pulpit Rock" width="304" height="228">
  <figcaption>Fig1. - The Pulpit Pock, Norway</figcaption>
</figure>
```

## 我们可以开始使用这些语义元素吗?

我们上面介绍的元素都是块元素( 除了 `` )

为了让这些块及元素在所有版本的浏览器中生效，我们需要在样式表文件中设置一下属性

```html
header, section, footer, aside, nav, article, figure{display: block;}
```

## Internet Explorer 8 及更早 IE 版本中的问题

IE8及更早 IE 版本无法在这些元素中渲染 CSS 效果，以至于我们不能直接使用 ``, ``, ``, ``, ``, ``, ``, 或者其它的 HTML5 元素

**解决办法:** 可以使用 HTML5 Shiv Javascrip t脚本来解决 IE 的兼容问题

国外

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

需要将这些代码放在 HTML 文档的头部，因为 IE 浏览器需要在头部加载后渲染这些 HTML5 的新元素
