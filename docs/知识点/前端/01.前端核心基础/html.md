---
title: HTML 全体系
category: 知识点
tags:
  - 前端
  - HTML
  - 基础
---

# HTML 全体系

HTML 负责描述内容结构。结构写得越清晰，SEO、无障碍、可维护性和后续样式扩展就越顺。

## 核心范围

- 基础语法、文档结构、常见标签与表单体系
- HTML5 新特性：语义标签、多媒体、表单增强、离线能力入口
- 语义化与可访问性：标题层级、`label`、`alt`、ARIA 基础
- SEO 基础：`title`、`meta`、语义结构、结构化内容组织
- 整站布局：头部、导航、主内容区、侧栏、页脚的职责划分

## HTML / HTML5 复习核心知识点

### 一、HTML 基础概念

#### 1. 定义与作用

- 全称：HyperText Markup Language（超文本标记语言）
- 本质：标记语言，非编程语言；无需编译，浏览器直接解析
- 核心作用：构建网页结构与内容，作为前端"骨架"
- 前端三大核心：HTML（结构）+ CSS（样式）+ JavaScript（交互）

#### 2. HTML 核心特性

- 标记语言：通过标签描述内容（双标签/单标签）
- 超文本：支持链接、图片、音视频等多媒体与跨页面跳转
- 平台无关性：跨浏览器、跨设备兼容
- 结构优先：只负责结构，不负责样式与交互

### 二、HTML 文档基本结构

```html
<!DOCTYPE html>                <!-- 文档类型声明，HTML5标准 -->
<html lang="zh-CN">             <!-- 根元素，lang声明页面语言 -->
<head>
    <meta charset="UTF-8">      <!-- 字符编码，UTF-8通用 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>      <!-- 浏览器标签页显示的标题 -->
</head>
<body>
    <!-- 页面可见内容 -->
</body>
</html>
```

### 三、标签分类与属性

#### 1. 标签分类

- 双标签（成对标签）：有开始和结束标签，如 `<h1>`、`<p>`、`<div>`
- 单标签（自闭合标签）：无需结束标签，如 `<img>`、`<br>`、`<hr>`、`<input>`

#### 2. 元素分类（显示方式）

- 块级元素：独占一行，默认宽度100%，如 `<div>`、`<p>`、`<h1>`、`<ul>`、`<table>`
- 行内元素：不独占一行，宽度由内容决定，如 `<span>`、`<a>`、`<strong>`、`<img>`、`<input>`

#### 3. 标签嵌套规则

- 先打开的后关闭（正确）：`<div><p>内容</p></div>`
- 禁止交叉嵌套（错误）：`<div><p>内容</div></p>`

#### 4. 核心属性

- `id`：唯一标识，用于JS/CSS定位或锚点
- `class`：类名，用于批量设置样式或功能
- `name`：表单提交参数名（后端接收标识）
- 属性值需用双引号包裹：`class="title"`

### 四、常用核心标签（按功能分类）

#### 1. 文本结构类

- `<h1>~<h6>`：标题标签，h1最重要，一页仅一个
- `<p>`：段落标签，自动产生间距
- `<br>`：强制换行
- `<hr>`：水平分割线
- `<strong>`：加粗强调（有语义）
- `<em>`：斜体强调（有语义）

#### 2. 链接与媒体类

- `<a>`：超链接
  - `href`：目标地址（必填）
  - `target`：`_blank`（新窗口）、`_self`（当前窗口）
  - 用途：页面跳转、锚点定位（`href="#id"`）、下载（`download`属性）、邮件（`mailto:`）
- `<img>`：图片
  - `src`：图片路径（必填）
  - `alt`：替代文本（必填，图片加载失败时显示）
  - `width/height`：宽高（建议只设置一个以保持比例）

#### 3. 列表类

- `<ul>+<li>`：无序列表（默认圆点）
- `<ol>+<li>`：有序列表（默认数字序号）
- `<dl>+<dt>+<dd>`：定义列表（名词解释）

#### 4. 容器类

- `<div>`：块级容器，布局核心，可包裹任意内容
- `<span>`：行内容器，用于局部样式或JS操作

#### 5. 表格类

- `<table>`：表格容器
- `<tr>`：行
- `<td>`：普通单元格
- `<th>`：表头单元格（加粗居中）
- `<caption>`：表格标题
- 单元格合并：`colspan`（横向合并）、`rowspan`（竖向合并）

### 五、表单交互

#### 1. 表单容器

```html
<form action="提交地址" method="GET/POST">
    <!-- 表单元素 -->
</form>
```

- `action`：数据提交的服务器地址
- `method`：`GET`（参数在URL，不安全，适合少量数据）、`POST`（参数隐藏，安全，适合敏感数据）

#### 2. 常用表单元素

- `<input>`：单标签，通过type实现不同功能
  - `text`：文本框
  - `password`：密码框
  - `radio`：单选框（需相同name）
  - `checkbox`：复选框
  - `file`：文件上传
  - `email`、`number`、`date`等HTML5新类型
- `<button>`：按钮
- `<select>+<option>`：下拉框
- `<textarea>`：多行文本域

#### 3. 表单辅助标签

- `<label>`：提升可访问性，可通过for与id关联
- `<datalist>`：提供建议列表（自动补全）

#### 4. 表单验证属性（HTML5）

- `required`：必填
- `pattern`：正则表达式验证
- `min/max`：数值范围
- `placeholder`：提示文本

### 六、HTML5 新增核心特性

#### 1. 语义化标签（最重要）

- `<header>`：网页头部
- `<nav>`：导航栏
- `<main>`：主内容区域
- `<article>`：独立文章内容
- `<section>`：内容分区
- `<aside>`：侧边栏
- `<footer>`：网页底部
- `<figure>+<figcaption>`：图像及标题

#### 2. 原生多媒体支持

- `<audio>`：音频标签
- `<video>`：视频标签

#### 3. 其他新特性

- `<canvas>`：2D绘图
- `localStorage/sessionStorage`：本地存储
- `navigator.geolocation`：地理定位
- 拖拽API

### 七、编码规范与最佳实践

- 标签名/属性名小写
- 属性值用双引号包裹
- 必须添加`<!DOCTYPE html>`声明
- 优先使用语义化标签，而非无语义的`<div>`、`<span>`
- 图片必须添加`alt`属性
- 注释：`<!-- 注释内容 -->`，快捷键Ctrl+/

### 八、路径类型

- 相对路径：
  - 同一目录：直接写文件名
  - 下级目录：目录名/文件名
  - 上级目录：../文件名
- 绝对路径：从根目录开始的完整路径或带协议的完整地址（如https://example.com/image.jpg）

### 九、H1标签使用规范（重点）

#### 1. 使用建议

- 一页只保留一个 H1，作为页面主标题
- 多 H1 会模糊页面主旨，可能降低搜索引擎与屏幕阅读器对核心主题的识别效果

#### 2. 何时降级到 H2？

- 导航栏、侧边栏、页脚等非主内容区域的"大字头"不宜用 H1，优先用 H2
- Logo/品牌名通常不应是 H1，除非该页就是品牌主页

#### 3. 可接受的例外（谨慎使用）

- 在独立、语义清晰的 `<article>` 或 `<section>` 中各有 H1，并确保整体结构仍然明确
- 单页应用（SPA）按视图切换时，每个视图有自己的 H1（需保证语义与内容匹配）

### 十、高频考点速记

- H1在页面中只能使用一次
- P标签内不能嵌套块级元素
- 表格合并单元格后需删除多余单元格
- 单选框通过相同name实现互斥
- 表单元素的name属性是后端接收参数的标识
- 语义化标签利于SEO和可访问性
- `target="_blank"`配合`rel="noopener noreferrer"`增强安全性
- 标题标签必须逐级使用，不能跳级（如h1后不能直接用h3）
- 图片的alt属性是SEO必备
- HTML5中`<canvas>`用于绘图，`<video>`和`<audio>`用于多媒体播放

### 十一、常见错误与规避

#### 1. 语义错误

- 用`<div>`替代`<header>`、`<nav>`等语义标签
- 仅为了改变文字大小使用标题标签（应使用CSS）
- 跳过标题级别（如h1后直接用h3）

#### 2. 嵌套错误

- 交叉嵌套标签（如`<div><p>内容</div></p>`）
- 在`<p>`标签内嵌套块级元素

#### 3. 属性错误

- 属性值未用引号包裹
- 使用废弃属性（如align，应使用CSS）

#### 4. 可访问性错误

- 图片缺少alt属性
- 表单元素缺少`<label>`关联
- 多个H1导致导航混乱

### 十二、响应式基础

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- 确保页面在移动设备上正确显示
- 配合媒体查询（Media Queries）实现不同设备的样式适配

### 十三、字符实体（常用）

- `&lt;` ：小于号 <
- `&gt;` ：大于号 >
- `&amp;` ：和号 &
- `&nbsp;` ：不换行空格
- `&quot;` ：引号 "
- `&copy;` ：版权符号 ©

### 十四、HTML5 新增表单类型

- `email`：邮箱输入框（自动验证邮箱格式）
- `url`：网址输入框
- `date`：日期选择器
- `time`：时间选择器
- `number`：数字输入框
- `range`：滑块选择器
- `color`：颜色选择器
- `search`：搜索框

### 十五、SEO 相关最佳实践

- H1标签包含页面核心关键词，但避免关键词堆砌
- 标题标签（h1-h6）应清晰反映内容层次结构
- 图片alt属性描述图片内容，包含相关关键词
- 链接的anchor文本（链接文字）应描述目标页面内容
- 语义化标签帮助搜索引擎理解页面结构
- 页面加载速度影响SEO，优化图片大小和代码精简

### 十六、无障碍设计（Accessibility）

- 为所有图片提供有意义的alt文本
- 使用语义化标签构建清晰的文档结构
- 表单元素使用label标签关联
- 确保键盘可以访问所有交互元素
- 提供足够的色彩对比度
- 避免仅依赖颜色传达信息

### 十七、文档类型与编码

```html
<!DOCTYPE html>  <!-- HTML5文档类型声明 -->
<meta charset="UTF-8">  <!-- 字符编码声明 -->
```

- `<!DOCTYPE html>`告知浏览器使用HTML5标准模式渲染
- UTF-8支持几乎所有语言字符，避免乱码

### 十八、HTML 与 CSS、JavaScript 的协作

HTML 是网页的 **骨架**，CSS 是 **皮肤**，JavaScript 是 **灵魂**。三者共同构建现代 Web 应用：

- HTML + CSS：HTML 定义内容结构，CSS 控制样式（颜色、布局、动画）
- HTML + JavaScript：HTML 提供元素，JavaScript 实现交互（点击事件、表单验证、动态内容更新）

**总结**：HTML作为前端开发的基石，语义化是HTML5的灵魂，理解各种标签的特性和适用场景，掌握现代HTML5 API能为项目增色不少，性能优化要从HTML结构开始。

### 十九、常用重点

#### 1. 块级元素与行内元素

- **块级元素**：`div`、`p`、`h1-h6`、`ul`、`ol`、`li`、`form`、`table`
  - 特性：独占一行，可设置宽高

- **行内元素**：`span`、`a`、`img`、`input`、`strong`、`em`
  - 特性：不换行，不可设置宽高

#### 2. 常用标签

- **标题**：`h1~h6`
- **段落**：`p`
- **链接**：`a`（属性：`href`、`target`）
- **图片**：`img`（属性：`src`、`alt`）
- **容器**：`div`（块级）、`span`（行内）
- **列表**：`ul`、`ol`、`li`
- **表格**：`table`、`tr`、`th`、`td`
- **表单**：`input`、`textarea`、`select`、`button`

### 二十、Iframe标签

#### 1. 定义与作用

`<iframe>`（Inline Frame，内联框架）是 HTML 中用于在当前页面嵌入另一个网页的标签。它允许你在一个页面中无缝集成另一个完整的网页内容，如嵌入地图、视频、在线编辑器或第三方内容。

#### 2. 基本用法

```html
<iframe src="目标页面地址" title="嵌入页面标题" width="宽度" height="高度"></iframe>
```

**核心属性**：
- `src`：必填，指定嵌入页面的URL地址
- `title`：必填，用于辅助技术（屏幕阅读器）理解内容，提升可访问性
- `width/height`：可选，设置嵌入框架的尺寸（单位px或百分比）
- `frameborder`：已废弃，使用CSS控制边框
- `sandbox`：可选，启用沙箱模式增强安全性
  - 常用值：`sandbox="allow-scripts allow-same-origin"`（允许脚本和同源资源加载）

#### 3. 高级应用场景

**嵌入网页**：
```html
<iframe src="https://www.example.com" title="示例网站" width="100%" height="600px"></iframe>
```

**嵌入地图**：
```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18..." title="公司地图" width="100%" height="300px"></iframe>
```

**嵌入视频**：
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

#### 4. 安全注意事项

- **内容安全策略(CSP)** ：确保嵌入的页面是可信来源
- **沙箱模式(sandbox)** ：限制内嵌页面的权限，防止恶意代码执行
- **避免敏感信息**：不要在iframe中放置登录页或支付页面，可能引发安全风险
- **跨域问题**：当嵌入不同域的内容时，会受到浏览器同源策略限制

#### 5. 注意事项

- **响应式设计**：使用CSS `width:100%` 和适当的高度比例，或通过JavaScript动态调整大小
- **性能优化**：延迟加载不可见的iframe，减少页面初始化时间
- **可访问性**：始终提供明确的标题属性，帮助屏幕阅读器用户理解嵌入内容

## 七、高频面试题

### 1. HTML 基础概念
1. **HTML 是什么？**
   HyperText Markup Language（超文本标记语言），用于构建网页结构与内容

2. **HTML 的核心作用是什么？**
   构建网页结构与内容，作为前端"骨架"

3. **前端三大核心是什么？**
   HTML（结构）+ CSS（样式）+ JavaScript（交互）

### 2. 文档结构与规范
4. **HTML5 文档的基本结构是什么？**
   ```html
   <!DOCTYPE html>
   <html lang="zh-CN">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>页面标题</title>
   </head>
   <body>
       <!-- 页面内容 -->
   </body>
   </html>
   ```

5. **`<!DOCTYPE html>` 的作用是什么？**
   告知浏览器使用HTML5标准模式渲染页面

6. **`<meta charset="UTF-8">` 的作用是什么？**
   声明字符编码，避免乱码

### 3. 标签与元素
7. **块级元素和行内元素的区别？**
   - 块级元素：独占一行，默认宽度100%，可设置宽高
   - 行内元素：不独占一行，宽度由内容决定，不可设置宽高

8. **常见的块级元素有哪些？**
   `div`、`p`、`h1-h6`、`ul`、`ol`、`li`、`form`、`table`

9. **常见的行内元素有哪些？**
   `span`、`a`、`img`、`input`、`strong`、`em`

10. **标签嵌套的规则是什么？**
    先打开的后关闭，禁止交叉嵌套

### 4. 表单相关
11. **GET 和 POST 的区别？**
    - GET：参数在URL，不安全，适合少量数据
    - POST：参数隐藏，安全，适合敏感数据

12. **表单元素的 `name` 属性有什么作用？**
    作为后端接收参数的标识

13. **如何实现单选框的互斥？**
    给单选框设置相同的 `name` 属性

14. **HTML5 表单验证属性有哪些？**
    `required`、`pattern`、`min/max`、`placeholder`

### 5. HTML5 新特性
15. **HTML5 新增的语义化标签有哪些？**
    `<header>`、`<nav>`、`<main>`、`<article>`、`<section>`、`<aside>`、`<footer>`

16. **HTML5 新增的表单类型有哪些？**
    `email`、`url`、`date`、`time`、`number`、`range`、`color`、`search`

17. **HTML5 其他新特性有哪些？**
    `<canvas>`、`localStorage/sessionStorage`、地理定位、拖拽API

### 6. 语义化与 SEO
18. **什么是语义化标签？**
    具有特定含义的标签，如 `<header>`、`<nav>` 等，有助于搜索引擎和屏幕阅读器理解页面结构

19. **语义化的好处有哪些？**
    利于SEO、提升可访问性、提高代码可维护性

20. **H1 标签的使用规范是什么？**
    一页只保留一个 H1，作为页面主标题

21. **图片的 `alt` 属性有什么作用？**
    图片加载失败时显示的替代文本，利于SEO和可访问性

### 7. 可访问性
22. **如何提升 HTML 的可访问性？**
    - 为图片添加 `alt` 属性
    - 使用语义化标签
    - 表单元素使用 `<label>` 关联
    - 确保键盘可访问所有交互元素

23. **`<label>` 标签的作用是什么？**
    提升可访问性，通过 `for` 属性与表单元素关联

### 8. Iframe
24. **Iframe 的作用是什么？**
    在当前页面嵌入另一个网页内容

25. **Iframe 的核心属性有哪些？**
    `src`（必填）、`title`（必填）、`width/height`、`sandbox`

26. **使用 Iframe 的安全注意事项有哪些？**
    - 确保嵌入的页面是可信来源
    - 使用沙箱模式增强安全性
    - 避免在iframe中放置敏感信息
    - 注意跨域问题

### 9. 最佳实践
27. **HTML 编码规范有哪些？**
    - 标签名/属性名小写
    - 属性值用双引号包裹
    - 必须添加 `<!DOCTYPE html>` 声明
    - 优先使用语义化标签
    - 图片必须添加 `alt` 属性

28. **响应式布局的基础是什么？**
    ```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ```

29. **`target="_blank"` 的安全隐患及解决方案？**
    可能导致钓鱼攻击，解决方案：配合 `rel="noopener noreferrer"`

30. **标题标签的使用规范是什么？**
    必须逐级使用，不能跳级（如h1后不能直接用h3）

## 实战关注点

- 页面结构先于视觉表现设计
- 表单语义和交互反馈要一起考虑
- 内容型页面优先保证可读性和抓取友好性

## 常见问题

- 只顾视觉布局，忽略标题层级和内容结构
- 表单没有正确关联 `label`，导致可用性和无障碍较差
- SEO 只关注关键词，忽略页面语义和内容质量