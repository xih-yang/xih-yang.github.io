# SASS

Sass 是一个 CSS 预处理器，完全兼容所有版本的 CSS。实际上，Sass 并没有真正为 CSS 语言添加任何新功能。只是在许多情况下可以可以帮助我们减少 CSS 重复的代码，节省开发时间。下面就来看看 Sass 中常用的功能。

## 1. 注释

在 Sass 中支持两种类型的注释：

```css
// 注释一

/* 注释二 */
```

需要注意，当 Sass 编译成CSS时，第一种注释不会编译到CSS中（只在Sass文件中可见），第二种注释会编译到CSS中。

## 2. 嵌套

嵌套的写法是Sass的一大特点，通过嵌套这些代码，可以得到类似HTML结构的CSS代码，使代码更具可读性。

```css
nav {
    background : #C39BD3;
    padding : 10px;
    height: 50px;
  
    ul {
        display: flex;
        list-style : none;
        justify-content: flex-end;

        li {
            color: white;
            margin-right: 10px;
        } 
    }
}
```

那为什么要使用嵌套呢？在CSS中，如果想为其父元素的继承元素定义样式，就必须每次都选择父元素：

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

在Sass中就可以这样写，这样写就会使代码更加清晰、条理和简洁：

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

注意，在编写Sass时，要嵌套嵌套太深，尽量不要超过三层，超过之后就会导致代码难以维护，并且在编译为CSS时就会出现不必要的选择器，就会导致CSS文件变大。

我们还可以在嵌套中使用 `&`，比如鼠标在按钮上悬浮时，改变颜色。在CSS中是这样的：

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

在Sass中就可以这么写：

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

编译后的CSS代码如下：

```css
.box:focus{} 
.box:hover{}
.box:active{}
.box:frist-child{}
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

编译成CSS就是这样的：

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

Sass还支持使用`:`来嵌套属性：

```css
add-icon {
  background : {
    image: url("./assets/arrow-right-solid.svg");
    position: center center;
    repeat: no-repeat;
    size: 14px 14px;
  }
}
```

上面的代码编译为如下CSS：

```css
.add-icon {
  background-image: url("./assets/arrow-right-solid.svg");
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 14px 14px;
}
```

## 3. 变量

变量是用来储存数据的，在Sass中，我们可以将任何有效的CSS值保存在变量中。变量使用`$`符号定义：

```css
$red: #ee4444;
$black: #222;
$bg-color: #3e5e9e;
$link-color: red;
$p-color: #282A36;

$font-p: 13px;
$font-h1: 28px;

$base-font: 'Noto Sans KR', sans-serif;
```

变量的使用：

```css
body {
    background-color : $bg-color;
    font-size : $font-p;
    font-family : $base-font;
}

h1 {
    font-size: $font-h1;
    color: $black;
}

p {
    font-size: $font-p;
    color: $black;
}

a {
    color: $link-color;
}
```

当Sass编译成CSS时，所有的变量都会被替换为定义的变量值。变量可以减少重复、进行复杂的数学运算等。

需要注意，CSS变量是有范围的，位于顶层的变量都是全局变量，在块中定义的变量都是局部变量。全局变量可以在任何地方使用，局部变量只能在变量定义的块中使用。

```css
$my-global-variable: "global";

div {
  $my-local-variables: "local";
}
```

变量值是可以覆盖的：

```css
$color: #fefefe;
.content {
  background-color: $color;
}

$color: #939393;
.footer {
  background-color: $color;
}
```

在上面的代码中，`content`的背景颜色是`#fefefe`，而`footer`的背景颜色是`#939393`。要想改变全局变量，就需要添加`!global`修饰符：

```css
$color: #111;
.content {
  $color: #222;
  background-color: $color;
}
.footer {
  $color: #333 !global;
}
```

除此之外，Sass变量是可以指定默认值的：

```css
$message-color: blue !default;

.message {
    color: $message-color;
}
```

编译成的CSS代码如下：

```css
p.message {
  color: blue;
}
```

我们可以在 @import 之前覆盖模块默认值：

```css
$message-color: black;
@import 'my-module';

.message {
    color: $message-color;
}
```

编译成的CSS代码如下：

```css
p.message {
  color: black;
}
```

也就是说，带有 `!default` 的变量只有在没有值的情况下才会生效。

## 4. Mixins 和  Include

`mixin` 是一组可以重用的 CSS 声明，语法类似于JavaScript中的函数，使用 `@mixin` 指令来代替 `function` 关键字。调用 `mixin` 是通过 `@include` 语句完成的。

以下是用 `mixins` 使元素水平垂直居中的方法：

```css
@mixin absolute-center() {
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
}

.element {
  @include absolute-center();
}
```

当然，mixin也是支持传递参数的：

```css
@mixin square($size) {
  width:$size;
  height:$size;
}
div {
  @include square(60px);
  background-color:#000;
}
```

参数可以是可选的，可选参数的定义和Sass变量的定义形式是一样的：

```css
@mixin square($width: 50px) {
  width:$size;
  height:$size;
}
```

我们还可以将 CSS 规则传递给 mixins。 这些规则可以在使用 @content 的 mixin 中使用。

```css
@mixin hover-not-disabled {
  &:not([disabled]):hover {
    @content;
  }
}
.button {
  border: 1px solid black;
  @include hover-not-disabled {
    border-color: blue;
  }
}
```

这样`mixin`中的`@content`在编译后就会变成`border-color: blue;`这样写有助于减少&`:not([disabled]):hover`部分的重复。

## 5. @import 和 @use

在CSS中我们通常会创建多个CSS文件并在需要时引入：

```css
<link rel="stylesheet" href="/path/to/css/1"></link>
<link rel="stylesheet" href="/path/to/css/2"></link> 
<link rel="stylesheet" href="/path/to/css/3"></link> 
```

这样做会使浏览器发出多个HTTP请求，从而在一定程度上降低应用的速度。而Sass会在代码发动到浏览器之前进行代码组合，这样只需要请求一个CSS文件。

下面来看看如何使用 @import 将文件分块并导入到一个父文件中：

```css
body {
  padding:0;
  margin:0;
}

body, html {
  width:100%;
  min-height:100%;
}
```

```css
@import 'normalize';

content {
  max-width:660px;
}
```

假设 `normalize.scss` 和 `styles.scss` 都在同一个文件夹中，可以将一个导入另一个，如上所示。在使用`@import`时，所有变量、mixin 等都可以全局访问，<font style="color:rgb(41, 41, 41);">因为一切都是全局的，所以库必须为其所有成员添加前缀以避免命名冲突。</font>因此不建议使用 @import。

可以使用 @use 来代替，它的基本用法与@import 相同：

```css
@use 'normalize';

content {
  max-width:660px;
}
```

使用 `@use` 导入的文件称为模块。 要使用这些模块的 mixin 或变量，必须使用命名空间来调用它们。 默认情况下，命名空间是文件名（不带扩展名）。

```css
$accent-color: #535353;
@mixin dark-background {
  background-color:#000;
  color:#fff;
}
```

```css
@use 'src/colors';
body {
  color: colors.$accent-color;
}
.dark-region {
  @include colors.dark-background;
}
```

还可以使用 as 来使用自定义命名空间：

```css
@use 'src/colors' as c;
body  {
  color: c.$accent-color;
}
```

当 `_` 被添加到 SCSS 文件的文件名前时，解析器知道它是一个部分文件并且它仅用于导入。 导入时，`_` 部分是可选的。 注意，这里使用 `src/colors` 来导入 `src/_colors.scss`。

## 6. 算术运算符

在CSS中可以使用calc()进行数学计算，Sass 支持直接使用+、-、/、\*、% 操作符对值和变量进行计算：

```css
$content-width: 600px;
content {
  width:$content-width;
}
.inner-content {
  width: $content-width - 60px; 
}
.outer-content {
  width: $content-width + 60px;
}
```

## 7. 流程控制

在 Sass 中有四种类型的流程控制规则：`@if` /`@else`、`@each`、`@for` 和`@while`。其中 @if 和 @else 类似于 JavaScript 中的 if 和 else。

```css
@mixin theme($is-dark: false) {
  @if $is-dark {

  }
  @else {
    
  }
}
```

`@each` 类似于 JavaScript 中的 `for of`：

```css
$sizes: 40px, 50px, 80px;
@each $size in $sizes {
  .icon-#{$size} {
    font-size: $size;
    height: $size;
    width: $size;
  }
}
```

注意：#{$size} 表示法用于使用变量制作动态属性名称和选择器，这称为插值。

`@for` 类似于 JavaScript 中的 `for` 循环：

```css
@for $i from 1 through 4 {
  .bubble-#{$i} {
    transition-delay: .3 * $i;
  }
}
```

@while（不常用）类似于 JavaScript 中的 while 循环。

## 8. 扩展/继承

有时需要编写一个仅用于扩展的样式规则。 在这种情况下，可以使用占位符选择器，它看起来像以 `%` 而不是 `.` 开头的类选择器。

```css
%flex {
  display: flex;
}

.some-class {
  height: 50%;
  background-color: black;
}

%flex_with_color {
  @extend %flex;
  @extend .some-class;
}

%button_styles {
  height: 50px;
  width: 200px;
}

div {
  @extend %flex_with_color;

  button {
    @extend %button_styles;
    color: #424242;
    background-color: #d966fb;
  }
}
```

上面的代码编译成CSS之后将是这样的：

```css
div {
  display: flex;
}

.some-class, div {
  height: 50%;
  background-color: black;
}

div button {
  height: 50px;
  width: 200px;
}

div button {
  color: #424242;
  background-color: #d966fb;
}
```

## 9. 媒体查询

在Sass中可以这样来使用媒体查询：

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

编译成的CSS代码如下：

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

编译成的CSS代码如下：

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


> 更新: 2022-04-17 23:30:29  
> 原文: <https://www.yuque.com/cuggz/feplus/tuyx2n>