# 06、HTML5 MathML 数学公式
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/6.html
- 分类：前端框架
- 分组：教程目录
HTML5 可以在文档中使用 `` 添加 MathML 数学公式

MathML 是数学标记语言，是一种基于XML（标准通用标记语言的子集）的标准，用来在互联网上书写数学符号和公式的置标语言

> 注意
> 大部分浏览器都支持 MathML 标签
>
> 如果你的浏览器不支持该标签，可以使用最新版的 Firefox 或 Safari 浏览器查看

下面的范例演示了一个最基本的 MathML

```html
<!DOCTYPE html>
<meta charset="UTF-8">
<math xmlns="http://www.w3.org/1998/Math/MathML">
   <mrow>
      <msup><mi>a</mi><mn>2</mn></msup>
      <mo>+</mo>
      <msup><mi>b</mi><mn>2</mn></msup>
      <mo>=</mo>
      <msup><mi>c</mi><mn>2</mn></msup>
   </mrow>
</math>
```

在Safari 浏览器中显示如下

### 范例 2

下面的范例演示了一些运算符

```html
<!DOCTYPE html>
<meta charset="UTF-8">
<math xmlns="http://www.w3.org/1998/Math/MathML">
   <mrow>           
      <mrow>
         <msup>
            <mi>x</mi>
            <mn>2</mn>
         </msup>
         <mo>+</mo>
         <mrow>
            <mn>4</mn>
            <mo>⁢</mo>
            <mi>x</mi>
         </mrow>
         <mo>+</mo>
         <mn>4</mn>
      </mrow>
      <mo>=</mo>
      <mn>0</mn>
   </mrow>
</math>
```

在Safari 浏览器中显示如下：

## 范例 3

下面的范例演示了一个 2×2 矩阵，可以在 Firefox 3.5+ 或 Safari 查看到效果

```html
<!DOCTYPE html>
<meta charset="UTF-8">
<math xmlns="http://www.w3.org/1998/Math/MathML">
   <mrow>
      <mi>A</mi>
      <mo>=</mo>
      <mfenced open="[" close="]">
         <mtable>
            <mtr>
               <mtd><mi>x</mi></mtd>
               <mtd><mi>y</mi></mtd>
            </mtr>
            <mtr>
               <mtd><mi>z</mi></mtd>
               <mtd><mi>w</mi></mtd>
            </mtr>
         </mtable>
      </mfenced>
   </mrow>
</math>
```

在Safari 浏览器中显示如下：
