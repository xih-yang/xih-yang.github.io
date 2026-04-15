---
title: CSS 全体系
category: 知识点
tags:
  - 前端
  - CSS
  - 样式
---

# CSS 全体系

CSS 不只是"把页面调好看"，更是布局系统、视觉规范和组件样式边界管理的核心。

## 核心范围

- 基础布局：盒模型、定位、浮动、Flex、Grid
- CSS3：动画、过渡、变换、阴影、圆角、自定义属性
- 预处理器：Less、Sass 的变量、混入、嵌套与模块拆分
- UI 框架：Bootstrap 的栅格体系、组件思路和场景边界
- 原子化 CSS：Tailwind、UnoCSS 的设计思想、优劣和适用团队
- 移动端适配：视口、`rem`、媒体查询、响应式断点和安全区域

## 一、CSS 基础

### 1. 引入方式
- **行内样式**：`style=""`
- **内部样式**：`<style>`
- **外部样式**：`<link rel="stylesheet" href="xx.css">`
- **优先级**：行内 > 内部/外部（后写覆盖先写）

### 2. 基础选择器
- **标签**：`div`
- **类**：`.class`
- **ID**：`#id`
- **通配符**：`*`
- **优先级**：ID > 类 > 标签 > 通配符

### 3. 字体常用属性
- `font-size`：大小
- `font-weight`：粗细（`bold`/`700`）
- `color`：颜色
- `line-height`：行高
- `text-align`：对齐
- `text-decoration`：下划线（`none` 清除）

### 4. 盒子模型（必考）
组成：内容 + 内边距 + 边框 + 外边距
- `width` / `height`：内容宽度/高度
- `padding`：内边距
- `border`：边框
- `margin`：外边距
- `box-sizing: border-box;` （自动包含内边距+边框，必用）

### 5. 显示模式
- **块级**：`div`、`p` → 独占一行 → `display:block`
- **行内**：`span`、`a` → 并排 → `display:inline`
- **行内块**：`img`、`button` → 并排+可设宽高 → `display:inline-block`

### 6. 背景
- `background-color`：背景颜色
- `background-image`：背景图片
- `background-size: cover;`：背景大小
- `background-position`：背景位置

### 7. 浮动 float
- `float: left / right`：左浮动/右浮动
- **特点**：会脱标，父级塌陷
- **清除浮动**：`overflow:hidden` / `::after{clear:both}`

### 8. 定位 position
- `static`：默认值
- `relative`：相对定位（不脱标，保留位置）
- `absolute`：绝对定位（脱标，层级提升）
- `fixed`：固定定位（脱标，固定屏幕）
- **配合使用**：`top`/`left`/`right`/`bottom`

## 二、CSS3 重点新特性（高频）

### 1. 圆角
- `border-radius: 50%`：圆形

### 2. 阴影
- `box-shadow`：盒子阴影
- `text-shadow`：文字阴影

### 3. 过渡（最常用）
- `transition: all 0.3s;`：所有属性过渡 0.3 秒

### 4. 2D 变换 transform
- **位移**：`translate(x,y)` （居中神器）
- **旋转**：`rotate(deg)`
- **缩放**：`scale()`
- **斜切**：`skew()`

### 5. 3D 变换
- `transform-style: preserve-3d`：保持 3D 效果
- `perspective`：景深

### 6. 动画 animation
```css
@keyframes 名称 {
  0% {}
  100% {}
}

animation: 名称 时长 无限循环;
```

### 7. 新选择器
- **子选择器**：`div > p`
- **兄弟选择器**：`div + p` / `div ~ p`
- **结构伪类**：`nth-child(n)`
- **伪元素**：`::before` / `::after`

### 8. 渐变
- **线性渐变**：`linear-gradient`
- **径向渐变**：`radial-gradient`

### 9. 其他常用
- `opacity`：透明度
- `rgba()`：带透明颜色
- `cursor: pointer`：小手
- `overflow: hidden`：溢出隐藏
- `white-space: nowrap`：不换行
- `ellipsis`：文字溢出省略号（必背）

### 10. 自定义属性（变量）
```css
:root {
  --color: red;
}

使用：color: var(--color)
```

## 三、必背布局

### 1. 水平居中
- **行内元素**：`text-align: center`
- **块级元素**：`margin: 0 auto`
- **绝对定位**：`left:50% + transform:translateX(-50%)`

### 2. 垂直居中
- **定位**：`top:50% + transform:translateY(-50%)`
- **Flex**：`align-items:center`

### 3. 弹性布局 flex（必学）
- `display: flex`：启用弹性布局
- `justify-content`：水平排列
- `align-items`：垂直对齐
- `flex-wrap`：换行
- `flex:1`：占满剩余空间

### 4. Grid 布局
- `display: grid`：启用网格布局
- `grid-template-columns`：列宽
- `gap`：间距
- **用途**：二维布局、后台管理系统、卡片宫格

## 四、CSS 预处理器（Less / Sass）

### 1. 变量
```css
@color: red;
.box { color: @color; }
```

### 2. 嵌套
```css
父 {
  子 {}
}
```

### 3. 混入（复用代码）
```css
.mixin() { ... }
.box { .mixin(); }
```

### 4. 模块拆分
```css
@import "common.less"
```

**用途**：提高复用、便于维护、适合中大型项目

## 五、UI 框架：Bootstrap

### 1. 栅格系统
- **响应式分栏**：`row > col-*`
- **12 栅格**：自动适配移动端/PC

### 2. 组件
- 按钮、表单、导航、弹窗、表格

### 3. 使用边界
- **适合**：快速开发、后台、官网、原型
- **不适合**：高度定制设计、复杂交互页面

## 六、原子化 CSS：Tailwind / UnoCSS

### 核心思想
不写 CSS，直接用类名控制样式
- 例：`w-full h-10 flex items-center`

### 优点
- 极快开发
- 不写冗余样式
- 样式统一
- 适合移动端、后台、中后台项目

### 区别
- **Tailwind**：生态强
- **UnoCSS**：轻量、速度快

## 七、移动端适配（必背）

### 1. 视口
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 2. rem 适配
- 以 `html` 字体大小为基准
- 配合 `flexible` / 媒体查询自动调整根字体

### 3. 媒体查询
```css
@media (max-width:768px) { ... }
```

### 4. 响应式断点
- 移动端 <576px
- 平板 768px
- PC 1200px+

### 5. 安全区域
- `env(safe-area-inset-bottom)`
- 解决苹果底部横条遮挡

### 6. 常用方案
- `rem + flexible + 媒体查询`
- `viewport` 单位 `vw/vh`
- 现代方案：`vw + Tailwind`

## 八、高频面试题

1. **盒子模型组成？**
   内容、内边距、边框、外边距

2. **清除浮动方法？**
   `overflow:hidden`、伪元素清除法

3. **水平垂直居中方法？**
   定位+transform、flex 布局

4. **CSS3 新特性？**
   圆角、阴影、过渡、变换、动画、渐变、新选择器

5. **flex 有什么用？**
   快速、高效、简洁实现各种自适应布局

## 实战关注点

- 样式组织要和组件边界保持一致
- 先选布局策略，再补视觉细节
- 组件库、原子化和传统样式方案都要看团队协作成本

## 常见问题

- 一上来就堆样式，缺少结构和层级规划
- 组件样式没有边界，后期容易互相污染
- 过度依赖某一种方案，忽略团队可维护性

## 学习路线

1. 先把盒模型、定位、Flex、Grid 练熟。
2. 再补动画、变量、预处理器和响应式适配。
3. 最后对比 Bootstrap、Tailwind、UnoCSS 这类方案的适用场景。