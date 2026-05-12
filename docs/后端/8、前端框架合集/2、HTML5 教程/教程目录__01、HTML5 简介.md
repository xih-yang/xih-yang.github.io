# 01、HTML5 简介
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/1.html
- 分类：前端框架
- 分组：教程目录
HTML5 是 HTML 最新的修订版本，由万维网联盟（W3C）在 2014 年 10 月由完成标准制定

HTML5 的设计目的是为了在移动设备上支持多媒体

## 什么是 HTML5?

HTML5 是下一代 HTML 标准，而 HTML 4.01 作为上一个版本诞生于 1999 年

HTML5 是 W3C 与 WHATWG 合作的结果

WHATWG 指 Web Hypertext Application Technology Working Group

WHATWG 致力于 web 表单和应用程序，而 W3C 专注于 XHTML 2.0

在2006 年，双方决定进行合作，来创建一个新版本的 HTML

HTML5 中的一些有趣的新特性

**1、** 用于绘画的canvas元素；

**2、** 用于媒介回放的video和audio元素；

**3、** 对本地离线存储的更好的支持；

**4、** 新的特殊内容元素，比如article、footer、header、nav、section；

**5、** 新的表单控件，比如calendar、date、time、email、url、search；

## HTML5

`` 声明必须位于 HTML5 文档中的第一行

```html
<!DOCTYPE html>
```

## 最小的 HTML5 文档

下面的代码是演示了一个最基本的 HTML5 文档

```html
<!DOCTYPE html>
<meta charset="utf-8">
<title>文档标题</title>
文档内容......
```

你会发现，``,``,`` 都省略了

对的，这些元素在 HTML5 中是可选的了

> 注意： 对于中文网页需要使用  声明编码，否则会出现乱码

## HTML5 的改进

**1、** 添加了新元素；

**2、** 添加了新属性；

**3、** 完全支持CSS3；

**4、** Video和Audio；

**5、** 2D/3D制图；

**6、** 本地存储；

**7、** 本地SQL数据；

**8、** Web应用；

## HTML5 多媒体

HTML 5 新增的 `` 和 `` 元素可以在网页中播放 视频(video)与音频 (audio)

**1、** HTML5``；

**2、** HTML5``；

## HTML5 应用

使用HTML5 你可以简单地开发应用

**1、** 本地数据存储；

**2、** 访问本地文件；

**3、** 本地SQL数据；

**4、** 缓存引用；

**5、** Javascript工作者；

**6、** XHTMLHttpRequest2；

## HTML5 图形

HTML 5 新增了 `` 和 `` 元素用于在 HTML 5 中绘制图形

**1、**``元素；

**2、** 内联SVG；

**3、** CSS32D转换；

**4、** CSS33D转换；

## HTML5 使用 CSS3

**1、** 新选择器；

**2、** 新属性；

**3、** 动画；

**4、** 2D/3D转换；

**5、** 圆角；

**6、** 阴影效果；

**7、** 可下载的字体；

如果想了解更多 CSS3 的知识，可以访问我们的 CSS3 基础教程

## 语义元素

下表列出了 HTML5 添加的语义元素

标签
描述

定义页面独立的内容区域

定义页面的侧边栏内容

允许您设置一段文本，使其脱离其父元素的文本方向设置

定义命令按钮，比如单选按钮、复选框或按钮

用于描述文档或文档某个部分的细节

定义对话框，比如提示框

标签包含 details 元素的标题

规定独立的流内容（图像、图表、照片、代码等等）

定义  元素的标题

定义 section 或 document 的页脚

定义了文档的头部区域

定义带有记号的文本

定义度量衡。仅用于已知最大和最小值的度量

定义导航链接的部分

定义任何类型的任务的进度

定义 ruby 注释（中文注音或字符）

定义字符（中文注音或字符）的解释或发音

在 ruby 注释中使用，定义不支持 ruby 元素的浏览器所显示的内容

定义文档中的节（section、区段）

定义日期或时间

规定在文本中的何处适合添加换行符

## HTML5 表单

新表单元素, 新属性，新输入类型，自动验证

更多内容，可以访问我们的 HTML5 表单元素

## 已移除元素

下面列出的 HTML 4.01 元素在 HTML5 中已经被删除

- ``
- ``
- ``
- ``
- ``
- ``
- ``
- ``
- ``
- ``
- ``

## 每个知识点的范例

我们在每一个小知识点后都会附上一个小小的范例，你可以编辑 HTML，然后点击按钮来查看结果

```html
<!DOCTYPE HTML>
<meta charset="utf-8"> 
<video width="320" height="240" controls>
    <source src="/static/i/html/html_video_1.mp4" type="video/mp4">
    <source src="/static/i/html/html_video_1.ogg" type="video/ogg">
    你的浏览器不支持 video 标签
</video>
```

可以点击 "运行范例" 按钮查看在线运行结果*

## HTML5 浏览器支持

最新版本的 Safari、Chrome、Firefox 以及 Opera 支持某些 HTML5 特性

Internet Explorer 9 将支持某些 HTML5 特性

IE9以下版本浏览器兼容HTML5的方法，使用本站的静态资源的html5shiv包:

#### 国外

```html
<!--[if lt IE 9]>
  <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

#### 国内

```html
<!--[if lt IE 9]>
<script src="https://cdn.staticfile.org/html5shiv/r29/html5.min.js"></script>
<![endif]-->
```

载入后，初始化新标签的 CSS

```html
/*html5*/
article,aside,dialog,footer,header,section,footer,nav,figure,menu
{display:block}
```

## HTML5 参考手册

最后，我们精心整理了一份关于 HTML5 的标签及属性描述，可以访问我们的 HTML5参考手册
