# 04、SVG 在HTML页面
- 来源：https://ddkk.com/zhuanlan/other/svg/4.html
- 分类：SVG 教程
- 分组：教程目录
**SVG** 文件可通过 ``、`` 、`` 标签嵌入 HTML 文件中

**SVG** 的代码可以直接嵌入到 HTML 页面中，也可以直接链接到 SVG 文件

## 使用  标签

```xml
<embed src="SVG 文件地址" type="image/svg+xml" />
```

- 优势： 所有主要浏览器都支持，并允许使用脚本
- 缺点： 不推荐在 HTML4 和 XHTML 中使用（但在 HTML5 允许）

### 范例

```xml
<embed src="/r/show/penglei/svg/circle_1" type="image/svg+xml" />
```

结果：

## 使用  标签

``

- 优势：所有主要浏览器都支持，并支持 HTML4，XHTML 和 HTML5 标准
- 缺点：不允许使用脚本

### 语法

```xml
<object data="SVG 文件地址"  type="image/svg+xml"></object>
```

### 范例

```xml
<object data="/r/show/penglei/svg/circle_1" type="image/svg+xml"></object>
```

结果

## 使用  标签

``

- 优势：所有主要浏览器都支持，并允许使用脚本
- 缺点：不推荐在 HTML4 和 XHTML 中使用（但在HTML5允许）

### 语法

```xml
<iframe src="SVG 文件地址"></iframe>
```

### 范例

```xml
<iframe src="/r/show/penglei/svg/circle_1" type="image/svg+xml"></iframe>
```

结果

## 直接在 HTML 嵌入 SVG 代码

在Firefox、Internet Explorer9、谷歌Chrome和Safari中，我们可以直接在 HTML 嵌入 SVG 代码

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
   <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />
</svg>
```

结果

## 链接到 SVG 文件

可以用`` 标签链接到一个 SVG 文件链接到 HTML 中

### 语法

```xml
<a href="SVG 文件地址">查看 SVG 文件</a>
```

### 范例

```xml
<a href="/t/penglei/svg/circle_1">查看 SVG 文件</a>
```

结果

[查看SVG 文件](/t/penglei/svg/circle_1)
