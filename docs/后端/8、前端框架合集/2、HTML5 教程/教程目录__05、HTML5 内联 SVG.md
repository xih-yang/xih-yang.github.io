# 05、HTML5 内联 SVG
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/5.html
- 分类：前端框架
- 分组：教程目录
在HTML5 中，我们可以直接将 SVG 元素嵌入 HTML 页面中

HTML5 SVG 对不起，你的浏览器不支持内联 SVG

## 什么是SVG ？

**1、** SVG指可伸缩矢量图形(ScalableVectorGraphics)；

**2、** SVG用于定义用于网络的基于矢量的图形；

**3、** SVG使用XML格式定义图形；

**4、** SVG图像在放大或改变尺寸的情况下其图形质量不会有损失；

## SVG 优势

与其它图像格式相比（比如 JPEG 和 GIF），使用 SVG 有如下好处

**1、** SVG图像可通过文本编辑器来创建和修改；

**2、** SVG图像可被搜索、索引、脚本化或压缩；

**3、** SVG是可伸缩的；

**4、** SVG图像可在任何的分辨率下被高质量地打印；

**5、** SVG可在图像质量不下降的情况下被放大；

## 浏览器支持

Internet Explorer 9+, Firefox, Opera, Chrome, 和 Safari 支持内联 SVG

## 把 SVG 直接嵌入 HTML 页面

在HTML5 中，我们可以直接将 SVG 元素嵌入 HTML 页面中

```html
<!DOCTYPE html>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="190">
  <polygon points="100,10 40,180 190,60 10,60 160,180"
  style="fill:lime;stroke:purple;stroke-width:5;fill-rule:evenodd;">
</svg>
```

运行结果如下

如果想要学习更多 SVG 的知识，可以访问我们的 SVG 基础教程

## SVG 与 canvas 之间的区别

SVG是一种使用 XML 描述 2D 图形的语言

Canvas 通过 JavaScript 来绘制 2D 图形

SVG基于 XML，这意味着 SVG DOM 中的每个元素都是可用的

我们可以为某个元素附加 JavaScript 事件处理器

在SVG 中，每个被绘制的图形均被视为对象

如果SVG 对象的属性发生变化，那么浏览器能够自动重现图形

Canvas 是逐像素进行渲染的

在canvas 中，一旦图形被绘制完成，它就不会继续得到浏览器的关注

如果其位置发生变化，那么整个场景也需要重新绘制，包括任何或许已被图形覆盖的对象

## canvas 与 SVG 的比较

下表列出了 canvas 与 SVG 之间的一些不同之处

canvas
sVG

依赖分辨率
不依赖分辨率

不支持事件处理器
支持事件处理器

弱的文本渲染能力
最适合带有大型渲染区域的应用程序（比如谷歌地图）

能够以 png 或 jpg 格式保存结果图像
复杂度高会减慢渲染速度（任何过度使用 DOM 的应用都不快）

最适合图像密集型的游戏，其中的许多对象会被频繁重绘
不适合游戏应用
