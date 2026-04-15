# 背景图 vs <img>

在开发中，我们可以使用 HTML 中的`<img>`标签来设置图片，也可以使用 CSS 背景来设置图片。除此之外，还可以使用 SVG `<image>` 来设置图片。那这些方式之间有哪些区别呢？下面就来看看这些方法都是怎么使用的，它们都有哪些优缺点，以及何时该使用哪种方法！

## HTML `<img>` 标签

在最简单的情况下，img 元素必须包含 src 属性：

```html
<img src="cool.jpg" alt="">
```

### 设置宽高

在页面加载时，它们会在页面图像加载时发生一些布局变化。为避免这种情况，可以为其设置 `height` 和 `width` 属性：

```html
<img src="cool.jpg" width="200" height="100" alt="">
```

这样设置有什么作用呢？来看看效果图：

![1676305948220-34d168bb-25ca-4390-a0f5-1be18c6758da.gif](./img/HxF1Jjl1rP59_pAK/1676305948220-34d168bb-25ca-4390-a0f5-1be18c6758da-323629.gif)

可以看到，右侧的图像在加载完之前，已经提前保留了空间，这就是设置了 `height` 和 `width` 属性的缘故。

### 隐藏图像

可以使用 CSS 来隐藏图像，但是隐藏之后，它仍将加载到页面中。

```css
img {
  display: none;
}
```

这段代码不会阻止浏览器加载图像，即使它在视觉上是隐藏的。 原因是 `<img>` 被认为是**可替换元素**，所以无法控制它加载的内容。

> 在 CSS 中，可替换元素的展现效果不是由 CSS 来控制的。这些元素是一种外部对象，它们外观的渲染，是独立于 CSS 的。
>
> 简单来说，它们的内容不受当前文档的样式的影响。CSS 可以影响可替换元素的位置，但不会影响到可替换元素自身的内容。某些可替换元素，例如 `<iframe>` 元素，可能具有自己的样式表，但它们不会继承父文档的样式。

### 图像可访问性

HTML图 像可以通过将`alt`属性设置为有意义的描述来访问。这对屏幕阅读器用户非常有用。

如果不需要 `alt` 描述，也不要删除它。如果删除了，图像 src 将被读出，这对可访问性非常不利。

来看下面两个图片：

```html
<img class="food-thumb" width="300" height="200" src="cheescake.jpg">

<img class="food-thumb" width="300" height="200" src="cheescake.jpg" alt="">
```

这里，src 都无效且未加载。第一个没有设置 `alt` 属性，而第二个设置了一个空的 `alt` 属性。效果如下：

![1676306236367-ae8733a8-750b-43ea-b52d-b554ceb75f3d.png](./img/HxF1Jjl1rP59_pAK/1676306236367-ae8733a8-750b-43ea-b52d-b554ceb75f3d-275711.png)

没有 `alt` 的图像仍然保留其空间，这不利于可访问性。 而另一个折叠以适应其空 `alt` 属性的内容，这导致它由于具有边框而显示为一个小点。

但是，当有 `alt` 属性值时，它会是这样的：

![1676306300235-5e032513-f89c-4ad0-92f6-04f70791cc67.png](./img/HxF1Jjl1rP59_pAK/1676306300235-5e032513-f89c-4ad0-92f6-04f70791cc67-838405.png)

这样可以更好的向用户反馈，让用户知道这个加载失败的图片内容是什么。

除此之外，我们还可以使用**伪元素**来替换显示的默认替代文本，方法是将伪元素放置在默认文本的顶部，将其隐藏起来。

```css
img:after { 
  content: "\f1c5" " " attr(alt);

  font-size: 16px;
  font-family: FontAwesome;
  color: rgb(100, 100, 100);

  display: block;
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
}
```

效果如下：

![1676306446584-f36684f6-891e-442b-b014-47c82392411d.png](./img/HxF1Jjl1rP59_pAK/1676306446584-f36684f6-891e-442b-b014-47c82392411d-759157.png)

### 响应式图像

![1676306551106-cc80eee2-c349-4afd-b2b4-6d22b77f1ffa.png](./img/HxF1Jjl1rP59_pAK/1676306551106-cc80eee2-c349-4afd-b2b4-6d22b77f1ffa-184085.png)

`<img>` 的好处是它可以扩展为具有特定视口大小的图片的多个版本。

#### （1）srcset 属性

```html
<img src="small.jpg" srcset="medium.jpg 500w, large.jpg 800w" alt="">
```

这是一个很简单的例子。不过，srcset 并不是根据屏幕宽度显示多个图像尺寸的完美解决方案。浏览器会选择合适的图像，我们无法控制。

#### （2）HTML picture 元素

```html
<picture>
  <source srcset="large.jpg" media="(min-width: 800px)" />
  <source srcset="medium.jpg" media="(min-width: 500px)" />
  <img src="small.jpg" />
</picture>
```

另一种方式就是使用 `<picture>` 元素。这种方式更容易且更可预测。

### 调整图像大小

![1676306890125-8ba38a2a-4694-4afd-9615-0a0042528c3e.png](./img/HxF1Jjl1rP59_pAK/1676306890125-8ba38a2a-4694-4afd-9615-0a0042528c3e-780713.png)

CSS 中的 object-fit 和 object-position 属性可以与 `<img>` 标签一起使用。使用它们可以控制 `<img>` 的内容如何调整大小和定位，就像 CSS 背景图一样。

> object-fit 的可能值为：fill、contain、cover、none、scale-down

可以这样使用：

```css
img {
  object-fit: cover;
  object-position: 50% 50%;
}
```

介绍完 `<img>` 元素，下面来看看 CSS 中的背景图。

## CSS 背景图

要想设置背景图，首先需要一个 HTML 元素。

```html
<div class="element">content</div>
```

```css
.element {
  background: url('cool.jpg');
}
```

### 多重背景

CSS 背景图的好处是可以使用 CSS 轻松控制多个背景。来看下面的例子：

```css
.element {
    background: url('cool-1.jpg'), url('cool-2.jpg');
}
```

### 隐藏图像

我们可以在特定视口上隐藏和显示图像，而无需下载它。如果图片没有设置 CSS，则不会下载。

```css
@media (min-width: 700px) {
    .element {
        background: url('cool-1.jpg');
    }
}
```

在上面的例子中，有一个背景图，它仅在视口宽度大于 700px 时显示。

### 图像保存

如果想要保存网页上的图像，只需右键单击然后选择保存即可。 但这不适用于 CSS 背景图。 如果不检查检查元素，就无法下载使用 CSS 添加的图像。想要下载背景图，只能在 DevTools 中打开背景图 url 中的链接来下载。

### 伪元素

我们可以将伪元素与 CSS 背景图一起使用，例如在图像顶部显示叠加层。 对于 `<img>`，这是不可能的，除非为叠加层添加一个单独的元素。

## SVG <Image>

SVG 最大的优势是在不影响质量的情况下进行缩放。 此外，借助 SVG，可以嵌入 JPG、PNG 或 SVG 图像：

```html
<svg width="200" height="200">
  <image href="cheesecake.jpg" height="100%" width="100%" preserveAspectRatio="xMidYMid slice" />
</svg>
```

![1676307773202-f9e6c337-c94b-49ba-b50d-9c33c97c50b6.png](./img/HxF1Jjl1rP59_pAK/1676307773202-f9e6c337-c94b-49ba-b50d-9c33c97c50b6-928046.png)

这里我们添加了一个 `preserveAspectRatio` 属性，这是使图像保持 SVG 的宽度和高度，而不会被拉伸或压缩。当 `<image>` 宽度较大时，它将填充其父级（SVG）宽度而不会被拉伸。

![1676307854932-e7efb26e-1b07-4ba4-9143-a8309dae7164.png](./img/HxF1Jjl1rP59_pAK/1676307854932-e7efb26e-1b07-4ba4-9143-a8309dae7164-761725.png)

这和 CSS 中的 `object-fit: cover` 或 `background-size: cover` 非常相似。

## 图像可访问性

当谈到 SVG 的可访问性时，就不得不说说 `<title>` 元素。 例如，可以像下面这样添加它：

```html
<svg width="200" height="200">
   <title>A photo of blueberry Cheescake</title>
   <image href="cheesecake.jpg" height="100%" width="100%" preserveAspectRatio="xMidYMid slice" />
</svg>
```

更重要的是，可以使用 `<desc>`元素：

```html
<svg width="200" height="200">
   <title>A photo of blueberry Cheescake</title>
   <desc>A meaningful description about the image</desc>
   <image href="cheesecake.jpg" height="100%" width="100%" preserveAspectRatio="xMidYMid slice" />
</svg>
```

给 SVG 添加标题或描述之后，其访问性就提高了。

### 图像保存

和 CSS 背景图类似，在检查元素并复制图像的 URL 之前，不能下载嵌入在 SVG 中的图像。如果想要阻止用户下载特定图像，它可能会很有用。至少，它会减少轻松下载图像的机会。

## 怎么选?

下面通过五个例子，看看不同情况应该使用哪种设置图像方式。

### 文章标题背景

文章标题和简介下面有一张背景图：

![1676904482876-3d528654-8612-458c-9c4f-b678ddfcde80.png](./img/HxF1Jjl1rP59_pAK/1676904482876-3d528654-8612-458c-9c4f-b678ddfcde80-520957.png)

对于这张图片，有一些要求：

* 图像可以通过后端进行动态更改；
* 图像上有一个遮罩层，有助于使内容易于阅读；
* 图片有三种尺寸：小、中、大，每个都用于特定的视口。

先来考虑几个问题：

* 这张图片对用户来说重要吗，还是可有可无？
* 是否需要在所有视口尺寸上都使用它？
* 图片是静态的还是会动态变化？

#### （1）解决方案-1

我们可以使用多个 CSS 背景来实现，一个用于遮罩层，另一个是实际的背景图：

```css
.hero {
  background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('landscape.jpg');
  background-repeat: no-repeat;
  background-size: 100%, cover;
}
```

这样是可以实现的。如果想要动态更改背景图，就可以使用内联 CSS：

```html
<section class="hero" style="background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('landscape.jpg');">
  <!-- 内容区域 -->
</section>
```

这样是可行的，但是代码看起来很丑陋。或许可以使用 CSS 变量来修改一下？

```html
<section class="hero" style="--bg-url: url('landscape.jpg')">
  <!-- 内容区域 -->
</section>
```

![1676905125623-50afeb44-4357-4d7b-a46e-18d90252adab.png](./img/HxF1Jjl1rP59_pAK/1676905125623-50afeb44-4357-4d7b-a46e-18d90252adab-789030.png)

现在，我们可以通过更新`--bg-url`变量来更换背景图，这看起来比内联 CSS 好多了。

对于这个解决方案，主要适用于以下情况：

* 图像不重要，可有可无。
* 图像不会动态修改，而是固定的。

#### （2）解决方案-2

下面再来看看第二个解决方案：使用 img 标签。

```html
<section class="hero">
  <h2 class="hero__title">CSS背景图和 img 标签怎么选？</h2>
  <p class="hero__desc">文章简介......</p>
  <img src="landscape.jpg" alt="">
</section>
```

在 CSS 中，需要将图像绝对定位在内容的下方，并且还需要一个伪元素作为遮罩。

```css
.hero {
  position: relative;
}

.hero img {
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero:after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
}
```

这个解决方案的好处就是很容易更改图像的`src`属性。此外，如果图像很重要，这个方案就更合适。除此之外，使用HTML`<img>`可以在图像未加载的情况下添加回退功能。这种回退至少可以保持内容可读。

```css
.hero img {
    background: #2962ff;
}
```

![1676905619038-ea07909e-8603-42d2-901d-c55942ba491d.png](./img/HxF1Jjl1rP59_pAK/1676905619038-ea07909e-8603-42d2-901d-c55942ba491d-089096.png)

### 网站 Logo

#### （1）细节多的 Logo

对于网站的 Logo，当一有很多细节或形状时，将其用作内联 SVG 可能不太好。**建议使用**<code>**＜img＞**</code>，图像文件类型可以是`png`、`jpg`或`svg`。

![1676905769439-e1c9d561-224c-4a85-bc97-198df951f9e0.png](./img/HxF1Jjl1rP59_pAK/1676905769439-e1c9d561-224c-4a85-bc97-198df951f9e0-559869.png)

```html

```

#### （2）带动画的 Logo

有一个简单的 Logo，有一个形状和文字组成。当鼠标悬停在Logo上时，需要改变 Logo 的颜色。这时最合适的方案就是**使用内联 SVG。**

![1676905967887-236749c3-7f84-4ce4-818e-acee93009931.png](./img/HxF1Jjl1rP59_pAK/1676905967887-236749c3-7f84-4ce4-818e-acee93009931-025544.png)

```html
<a href="#">
    <svg class="logo" width="115" height="47" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-5 -5)" fill="none" fill-rule="evenodd">
        <rect fill="#D8D8D8" transform="rotate(45 28.5 28.5)" x="9" y="9" width="39" height="39" rx="11" />
        <text font-family="Rubik-Medium, Rubik" font-size="25" font-weight="400" fill="#6F6F6F">
          <tspan x="63.923" y="36.923">Rect</tspan>
        </text>
      </g>
    </svg>
</a>
```

```css
.logo rect,
.logo text {
  transition: 0.3s ease-out;
}

.logo:hover rect,
.logo:hover text {
  fill: #4a7def;
}
```

#### （3）响应式的 Logo

所谓的响应式 Logo 就是在不同视口下，显示的 Logo 不一样。例如下面的 Logo：

![1676906097093-c8eee1ca-b0b6-4731-8b93-ddcdf7b91fee.png](./img/HxF1Jjl1rP59_pAK/1676906097093-c8eee1ca-b0b6-4731-8b93-ddcdf7b91fee-817383.png)

当视口的宽度超过 `1350px` 时就显示右边的 Logo，否则就显示左边的 Logo。

这里比较完美的解决方案就是`<picture>`元素，它可以添加两个版本的 Logo ：

```css
<a class="logo" href="/">
  <picture>
    <source media="(min-width: 1350px)" srcset="sm-logo--full.svg">
		<img src="sm-logo.svg" alt="Smashing Magazine">
	</picture>
</a>
```

在 CSS 中，需要将视口的宽度更改为等于或大于1350px：

```css
.logo {
  display: inline-block;
  width: 45px;
}

@media (min-width: 1350px) {
  .logo {
    width: 180px;
  }
}
```

#### （4）带渐变的 Logo

当有一个带渐变色的 Logo 时，可以使用 SVG 来轻松实现渐变色。

```html
<svg class="logo" width="115" height="47" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#4a7def"></stop>
      <stop offset="50%" stop-color="#ab4787"></stop>
    </linearGradient>
  </defs>
  <g transform="translate(-5 -5)" fill="none" fill-rule="evenodd">
    <rect fill="#AB4787" transform="rotate(45 28.5 28.5)" x="9" y="9" width="39" height="39" rx="11" />
      <text font-family="Rubik-Medium, Rubik" font-size="30" font-weight="400" fill="url(#gradient)">
        <tspan x="63.923" y="36.923">Rect</tspan>
      </text>
  </g>
</svg>
```

这里添加了一个`＜linearGradient＞`，并将其作为 `text` 的 `fill` 属性，轻松实现了带渐变色的 Logo。

### 页面打印

如果用户需要打印页面，需要避免将图像作为CSS的背景，因为背景图不会被打印，而会显示一个空白区域：

![1676907586527-65444cc4-ab71-4026-bda8-2568744afe99.png](./img/HxF1Jjl1rP59_pAK/1676907586527-65444cc4-ab71-4026-bda8-2568744afe99-131454.png)

不过，我们可以通过强制浏览器显示图像来解决这个问题（不适用于 Firefox 和 IE）：

```css
.element {
    background: url('cheesecake.png') center/cover no-repeat;
    -webkit-print-color-adjust: exact;
}
```

对于这种情况，使用 HTML `<img>` 标签会更安全，因为它可以完美地打印出来。


> 更新: 2023-04-20 21:14:13  
> 原文: <https://www.yuque.com/cuggz/feplus/hgk35hpcab958z5e>