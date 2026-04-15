# Less

Less 是一个 CSS 预处理器，扩展了 CSS 语言，增加了变量、混合、函数等特性，使 CSS 更易维护和扩展。下面就来看看 Less 中常用的功能。

## 1. 注释

在 Less 中支持两种类型的注释：

```css
// 注释一

/* 注释二 */
```

需要注意，当 Less 编译成 CSS 时，第一种注释不会编译到 CSS 中（只在 Less 文件中可见），第二种注释会编译到 CSS 中。

## 2. 嵌套

嵌套的写法是 Less 的一大特点，通过嵌套这些代码，可以得到类似 HTML 结构的 CSS 代码，使代码更具可读性。

```css
nav {
    background: #C39BD3;
    padding: 10px;
    height: 50px;
  
    ul {
        display: flex;
        list-style: none;
        justify-content: flex-end;

        li {
            color: white;
            margin-right: 10px;
        }
    }
}
```

那为什么要使用嵌套呢？在 CSS 中，如果想为其父元素的继承元素定义样式，就必须每次都选择父元素：

```css
html, body {
    height: 100%;
}

html #root, body #root {
    height: 100%;
}

html .div-with-button, body .div-with-button {
    background-color: black;
}

html .div-with-button button, body .div-with-button button {
    background-color: #e4c681;
}

html .div-with-button button:hover, body .div-with-button button:hover {
    background-color: #ffe082;
}
```

在 Less 中就可以这样写，这样写就会使代码更加清晰、条理和简洁：

```css
html, body {
  height: 100%;

  #root {
    height: 100%;
  }

  .div-with-button {
    background-color: black;

    button {
      background-color: #e4c681;

      &:hover {
        background-color: #ffe082;
      }
    }
  }
}
```

注意，在编写 Less 时，要嵌套嵌套太深，尽量不要超过三层，超过之后就会导致代码难以维护，并且在编译为 CSS 时就会出现不必要的选择器，就会导致 CSS 文件变大。

我们还可以在嵌套中使用 `&`，比如鼠标在按钮上悬浮时，改变颜色。在 CSS 中是这样的：

```css
button {
  background-color: #535353;
  color: #000;
}
button:hover {
  background-color: #000;
  color: #fff;
}
```

在 Less 中就可以这么写：

```css
button {
  background-color: #535353;
  color: #000;
  &:hover {
    background-color: #000;
    color: #fff;
  }
}
```

通常，& 总是指向它上面的元素，可以用于伪类和伪元素：

```css
.box {
  &:focus{}
  &:hover{}
  &:active{}
  &:first-child{}
  &:nth-child(2){}
  &::after{}
  &::before{}
}
```

编译后的 CSS 代码如下：

```css
.box:focus{}
.box:hover{}
.box:active{}
.box:first-child{}
.box:nth-child(2){}
.box::after{}
.box::before{}
```

此外，如果类以相同的词开头（比如`box-yellow`和`box-red`），就可以嵌套它们：

```css
.box {
  &-yellow {
    background: #ff6347;
  }
  &-red {
    background: #ffd700;
  }
  &-green {
    background: #9acd32;
  }
}
```

编译成 CSS 就是这样的：

```css
.box-yellow {
  background: #ff6347;
}
.box-red {
  background: #ffd700;
}
.box-green {
  background: #9acd32;
}
```

Less 还支持使用`:`来嵌套属性：

```css
.add-icon {
  background: {
    image: url("./assets/arrow-right-solid.svg");
    position: center center;
    repeat: no-repeat;
    size: 14px 14px;
  }
}
```

上面的代码编译为如下 CSS：

```css
.add-icon {
  background-image: url("./assets/arrow-right-solid.svg");
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 14px 14px;
}
```

## 3. 变量

变量是用来储存数据的，在 Less 中，我们可以将任何有效的 CSS 值保存在变量中。变量使用 `@` 符号定义：

```css
@red: #ee4444;
@black: #222;
@bg-color: #3e5e9e;
@link-color: red;
@p-color: #282A36;

@font-p: 13px;
@font-h1: 28px;

@base-font: 'Noto Sans KR', sans-serif;
```

变量的使用：

```css
body {
    background-color: @bg-color;
    font-size: @font-p;
    font-family: @base-font;
}

h1 {
    font-size: @font-h1;
    color: @black;
}

p {
    font-size: @font-p;
    color: @black;
}

a {
    color: @link-color;
}
```

当 Less 编译成 CSS 时，所有的变量都会被替换为定义的变量值。变量可以减少重复、进行复杂的数学运算等。

需要注意，Less 变量是有范围的，位于顶层的变量都是全局变量，在块中定义的变量都是局部变量。全局变量可以在任何地方使用，局部变量只能在变量定义的块中使用。

```css
@my-global-variable: "global";

div {
  @my-local-variables: "local";
}
```

变量值是可以覆盖的：

```css
@color: #fefefe;
.content {
  background-color: @color;
}

@color: #939393;
.footer {
  background-color: @color;
}
```

在上面的代码中，`content`的背景颜色是`#fefefe`，而`footer`的背景颜色是`#939393`。

## 4. 混合（Mixins）

`mixin` 是一组可以重用的 CSS 声明，语法类似于 JavaScript 中的函数，使用 `.` 或 `#` 来定义。调用 `mixin` 是通过直接使用 mixin 名称完成的。

以下是用 `mixins` 使元素水平垂直居中的方法：

```css
.absolute-center() {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.element {
  .absolute-center();
}
```

当然，mixin 也是支持传递参数的：

```css
.square(@size) {
  width: @size;
  height: @size;
}
div {
  .square(60px);
  background-color: #000;
}
```

参数可以是可选的，可选参数的定义和 Less 变量的定义形式是一样的：

```css
.square(@width: 50px) {
  width: @width;
  height: @width;
}
```

## 5. 导入

在 CSS 中我们通常会创建多个 CSS 文件并在需要时引入：

```css
<link rel="stylesheet" href="/path/to/css/1"></link>
<link rel="stylesheet" href="/path/to/css/2"></link>
<link rel="stylesheet" href="/path/to/css/3"></link>
```

这样做会使浏览器发出多个 HTTP 请求，从而在一定程度上降低应用的速度。而 Less 会在代码发动到浏览器之前进行代码组合，这样只需要请求一个 CSS 文件。

下面来看看如何使用 `@import` 将文件分块并导入到一个父文件中：

```css
/* normalize.less */
body {
  padding: 0;
  margin: 0;
}

body, html {
  width: 100%;
  min-height: 100%;
}
```

```css
/* styles.less */
@import 'normalize';

content {
  max-width: 660px;
}
```

假设 `normalize.less` 和 `styles.less` 都在同一个文件夹中，可以将一个导入另一个，如上所示。

## 6. 算术运算符

在 CSS 中可以使用 calc() 进行数学计算，Less 支持直接使用 +、-、/、*、% 操作符对值和变量进行计算：

```css
@content-width: 600px;
content {
  width: @content-width;
}
.inner-content {
  width: @content-width - 60px;
}
.outer-content {
  width: @content-width + 60px;
}
```

## 7. 流程控制

在 Less 中有三种类型的流程控制规则：`@if` / `@else`、`@each` 和 `@for`。其中 @if 和 @else 类似于 JavaScript 中的 if 和 else。

```css
.theme(@is-dark: false) {
  @if @is-dark {
    background-color: #000;
    color: #fff;
  }
  @else {
    background-color: #fff;
    color: #000;
  }
}

.dark-theme {
  .theme(true);
}

.light-theme {
  .theme(false);
}
```

`@each` 类似于 JavaScript 中的 `for of`：

```css
@sizes: 40px, 50px, 80px;
@each @size in @sizes {
  .icon-@{size} {
    font-size: @size;
    height: @size;
    width: @size;
  }
}
```

注意：@{size} 表示法用于使用变量制作动态属性名称和选择器，这称为插值。

`@for` 类似于 JavaScript 中的 `for` 循环：

```css
@for @i from 1 through 4 {
  .bubble-@{i} {
    transition-delay: 0.3 * @i;
  }
}
```

## 8. 扩展/继承

Less 中使用 `:extend` 伪类来实现继承，它允许一个选择器继承另一个选择器的所有样式。

```css
.flex {
  display: flex;
}

.some-class {
  height: 50%;
  background-color: black;
}

.flex-with-color {
  &:extend(.flex);
  &:extend(.some-class);
}

.button-styles {
  height: 50px;
  width: 200px;
}

div {
  &:extend(.flex-with-color);

  button {
    &:extend(.button-styles);
    color: #424242;
    background-color: #d966fb;
  }
}
```

上面的代码编译成 CSS 之后将是这样的：

```css
.flex, div {
  display: flex;
}

.some-class, div {
  height: 50%;
  background-color: black;
}

.button-styles, div button {
  height: 50px;
  width: 200px;
}

div button {
  color: #424242;
  background-color: #d966fb;
}
```

## 9. 媒体查询

在 Less 中可以这样来使用媒体查询：

```css
body {
    article {
        p {
            font-size: 100%;
            color: black;
            padding: 10px;

            @media (max-width: 768px) {
                font-size: 150%;
            }
        }
    }
}
```

编译成的 CSS 代码如下：

```css
body article p {
  font-size: 100%;
  color: black;
  padding: 10px;
}

@media (max-width: 768px) {
  body article p {
    font-size: 150%;
  }
}
```

媒体查询是支持嵌套的，并将所有适用的查询与 and 运算符结合起来：

```css
p {
    @media (max-width: 768px) {
        font-size: 150%;
        @media (orientation: landscape) {
            line-height: 75%;
        }
    }
}
```

编译成的 CSS 代码如下：

```css
@media (max-width: 768px) {
  p {
    font-size: 150%;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  p {
    line-height: 75%;
  }
}
```

## 10. 函数

Less 提供了许多内置函数，可以用于颜色操作、数学计算等。

### 颜色函数

```css
@base-color: #428bca;

// 调整亮度
.light-color {
  color: lighten(@base-color, 20%);
}

// 调整饱和度
.saturated-color {
  color: saturate(@base-color, 20%);
}

// 调整透明度
.transparent-color {
  color: fade(@base-color, 50%);
}
```

### 数学函数

```css
@width: 100px;

// 四舍五入
.rounded {
  width: round(@width / 3);
}

// 向上取整
.ceiled {
  width: ceil(@width / 3);
}

// 向下取整
.floored {
  width: floor(@width / 3);
}
```

## 11. 命名空间

Less 允许使用命名空间来组织混合和变量，避免命名冲突：

```css
#utils {
  .center() {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  
  .text-center() {
    text-align: center;
  }
}

.element {
  #utils > .center();
  #utils > .text-center();
}
```

## 12. 作用域

Less 中的变量和混合遵循词法作用域，即从当前作用域向外查找：

```css
@color: red;

.parent {
  @color: blue;
  
  .child {
    color: @color; // 会使用 blue
  }
}

.other {
  color: @color; // 会使用 red
}
```

## 13. 编译工具

Less 可以通过以下方式编译：

1. **命令行工具**：使用 `lessc` 命令
   ```bash
   lessc styles.less styles.css
   ```

2. **Node.js**：使用 `less` 包
   ```javascript
   const less = require('less');
   
   less.render('.class { width: (1 + 1) * 50px; }', {
     compress: true
   }).then(output => {
     console.log(output.css);
   });
   ```

3. **构建工具**：如 Webpack、Gulp、Grunt 等

4. **浏览器端**：使用 `less.js` 在浏览器中实时编译（仅用于开发环境）

## 14. 最佳实践

1. **组织文件结构**：将 Less 文件按功能模块化
2. **使用变量**：为颜色、字体、间距等定义变量
3. **合理嵌套**：避免过深的嵌套（建议不超过 3 层）
4. **使用混合**：封装可重用的样式
5. **使用扩展**：减少重复代码
6. **注释**：为复杂样式添加注释
7. **性能优化**：编译时开启压缩

通过使用 Less，我们可以编写更加模块化、可维护的 CSS 代码，提高开发效率。