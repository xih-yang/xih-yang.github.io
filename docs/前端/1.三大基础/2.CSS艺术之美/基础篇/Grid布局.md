# Grid 布局

Grid（网格）布局是最强大的 CSS 布局方案，它用于构建二维布局。Grid 布局将页面划分成一个个网格，可以任意组合不同的网格，实现各种各样的布局。下面就来看看 CSS Grid 布局是如何使用的！

![1665562360871-8161304a-bee2-455e-9c18-0507a98cfc6b.png](./img/a5VS-NNj_I5JtEJ3/1665562360871-8161304a-bee2-455e-9c18-0507a98cfc6b-616080.png)

## 1. Grid 布局概述

在解释 CSS Grid 布局之前，我们先来看看 Grid 布局中一些重要概念。

### （1）网格容器

网格容器是所有网格项的父元素，网格容器会定义`display:grid`。下面例子中，类名为 `container` 的 `div` 元素就是网格容器：

```css
.container {
	display: grid;
}
<div class="container">
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
  <div class="item">4</div>
</div>
```

### （2）网格项

网格项是网格容器的子元素，上面例子中类名为`item`的`div`元素就是网格项。

### （3）网格线

构成网格结构的水平和垂直分隔线就是网格线，这些线位于列（列网格线）或行（行网格线）的任一侧。

下图中的网格有 9 个网格项，有 4 条行网格线和 4 条列网格线：

![1665503787426-7b2d68c0-8da2-4620-9d5f-f820b900cde4.png](./img/a5VS-NNj_I5JtEJ3/1665503787426-7b2d68c0-8da2-4620-9d5f-f820b900cde4-476178.png)

### （4）网格轨道

两条相邻网格线之间的区域就是网格轨道。下图紫色区域就是网格轨道（红线圈起来的位置）：

![1665503752317-7e6fbcac-2472-40fd-a3a2-8375adbb428e.png](./img/a5VS-NNj_I5JtEJ3/1665503752317-7e6fbcac-2472-40fd-a3a2-8375adbb428e-175527.png)

### （5）网格单元

两条**相邻的列网格线**和两条**相邻的行网格线**组成是的网格单元。它是网格的单个单元，也是最小单元。下图紫色区域就是一个单元网格：

![1665503951114-ebf5235a-cff1-43f5-9983-13550db70fc6.png](./img/a5VS-NNj_I5JtEJ3/1665503951114-ebf5235a-cff1-43f5-9983-13550db70fc6-866501.png)

### （6）网格区域

网格区域就是网格上的一个矩形区域，由一个或多个网格单元组成。下图中紫色的区域就是网格区域：

![1665504138321-27ba3fd7-5a75-4b6d-ad4e-51149797488f.png](./img/a5VS-NNj_I5JtEJ3/1665504138321-27ba3fd7-5a75-4b6d-ad4e-51149797488f-746580.png)

## 2. 设置基本网格

要想创建 CSS 网格布局，首先需要定义网格容器。可以使用`display: grid`或者`display: inline-grid`指定一个容器为网格布局。这样网格容器的所有直接子元素都会隐式转换为网格项。

```css
.container {
  display: grid;
}

.container {
  display: inline-grid;
}
```

下面来看一个例子：

```html
<div class="container">
  <div class="box a">1</div>
  <div class="box b">2</div>
  <div class="box c">3</div>
  <div class="box d">4</div>
</div>
```

在上面的代码中，我们定义了一个类名为 `container` 的 `div` 元素，其有四个子元素。下面来将其设置为网格容器：

```css
.container {
  display: grid;
}
```

结果如下：

![1665505921971-e9c1199d-30ec-4da7-ad50-ebdd2fcc11b4.png](./img/a5VS-NNj_I5JtEJ3/1665505921971-e9c1199d-30ec-4da7-ad50-ebdd2fcc11b4-802775.png)

当元素设置了网格布局，`column`、`float`、`clear`、`vertical-align`属性都会失效。

## 3. 设置行和列宽度

将元素单独设置为网格容器不会立即影响子元素的显示方式，因为我们还没有指定布局的央样式。要更改网格中网格项的布局，就需要明确定义网格的行和列。这就用到了 `grid-template-columns` 和 `grid-template-rows` 属性。

### （1）grid-template-columns

可以使用 `grid-template-columns` 属性来指定网格容器中所需的列数以及每列的宽度。

该属性接受一个或多个非负 CSS 长度值，这些值的个数就是网格容器的列数，每个值表示每列（即每个网格轨道）的宽度。例如：

```css
.container {
  display: grid;
  grid-template-columns: 400px 400px 400px;
}
```

结果如下：

![1665506490733-2fd7a33a-43e4-49c2-baa2-cce8a7c5e948.png](./img/a5VS-NNj_I5JtEJ3/1665506490733-2fd7a33a-43e4-49c2-baa2-cce8a7c5e948-682754.png)

在这个例子中，我们使用 `grid-template-columns` 属性将网格容器的布局设置为三列，每列宽 400px。由于网格容器有四个子元素，而我们只给网格指定了三列，所以当网格容器中的网格项数量超过三个时，CSS 会将其他网格项放到新行中以保持容器的布局。

### （2）grid-template-rows

可以使用 `grid-template-rows` 属性来指定网格容器中每一行的高度。与 `grid-template-columns` 属性不同，它并没有指定网格容器的行数，而只用来设置每行的高度。这是因为每当网格项换行时，网格容器都会隐式创建一个新行。因此，我们无法使用 `grid-template-rows` 属性来控制网格的行数。

该属性接受一个或多个非负CSS 长度值，其中每个值表示网格容器中每一行的高度，从第一行到最后一行。例如：

```css
.container {
  display: grid;
  grid-template-columns: 400px 400px 400px;
  grid-template-rows: 100px 200px;
}
```

在上面的代码中，我们指定了网格容器的第一行高度为 100px，第二行高度为 200px。

结果如下：

![1665507032485-d5150404-9dbb-46bb-9f52-2ed7f1a4cb1c.png](./img/a5VS-NNj_I5JtEJ3/1665507032485-d5150404-9dbb-46bb-9f52-2ed7f1a4cb1c-756027.png)

上面我们仅设置了网格容器中前两行的高度。如果向网格容器中添加更多的网格项，那么那些隐式创建的行的高度将不是由 `grid-template-rows` 属性决定，而由其内容的大小决定。

![1665507181509-202441d9-3ade-4147-b626-8103d276a885.png](./img/a5VS-NNj_I5JtEJ3/1665507181509-202441d9-3ade-4147-b626-8103d276a885-902920.png)

### （3）grid-template-areas

可以使用`grid-template-areas`属性来定义网格区域。该属性有以下三个属性值：

* `grid-area-name`：使用`grid-area`属性设置的网格区域的名称
* `.` ： 空网格单元
* `none`： 没有定义网格区域

下面来看一个例子：

```css
.container{
    grid-template-areas: "header header header header"
                         "main main . sidebar"
                         "footer footer footer footer";
}

```

结果如下：

![1665555935045-a71a66ce-8abc-4301-8c8b-a5cd49819afa.png](./img/a5VS-NNj_I5JtEJ3/1665555935045-a71a66ce-8abc-4301-8c8b-a5cd49819afa-266812.png)

### （4）网格线名称

`grid-template-columns` 和 `grid-template-rows` 属性还可以使用方括号来指定每一条网格线的名字，方便引用。

下面来看一个例子：

```css
.container{
  grid-template-columns: [one] 40px [two] 50px [three] auto [four];
  grid-template-rows: [five] 25% [six] 100px [seven] auto [eight];
}
```

这里定义了一个 3 行 4 列的网格，其中 one、two、three、four是列网格线的名称，five、six、seven、eight 是行网格线的名称。

## 4. 行和列之间添加间隙

当这样设置完一个基础的网格之后，有时想要在网格项之间有一些距离，就可以通过调整网格线的大小在列和行之间添加间距。这就需要用到 `row-gap` 和 `column-gap` 属性。

### （1）column-gap

可以使用 `column-gap` 属性来通过调整网格容器中垂直网格线的宽度来增加列之间的间距。它接受一个非负 CSS 长度值，该值用来定义每列之间的网格线的宽度。例如：

```css
.container { 
   display: grid; 
   column-gap: 28px;
}
```

这里将网格容器中每条垂直（列）网格线的宽度设置为了 28px。使得网格中每一列之间的距离增加了28px。

结果如下：

![1665507923534-246a253c-6c16-49f9-8b03-13f015d7d4a4.png](./img/a5VS-NNj_I5JtEJ3/1665507923534-246a253c-6c16-49f9-8b03-13f015d7d4a4-011857.png)

### （2）row-gap

可以使用 `row-gap` 属性来通过调整网格容器中所有水平网格线的高度来在网格容器中的行之间添加间距。它接受一个非负 CSS 长度值，该值定义每行之间网格线的大小。

例如：

```css
.container { 
   display: grid; 
   column-row: 40px;
}
```

这里将网格容器中每条水平（行）网格线的高度设置为 40px。使得网格中每一行之间的距离增加了40px。

结果如下：

![1665508081214-9e01857f-3eeb-40e8-bf31-62321a0119f0.png](./img/a5VS-NNj_I5JtEJ3/1665508081214-9e01857f-3eeb-40e8-bf31-62321a0119f0-409334.png)

可以结合 `column-gap` 和 `row-gap` 属性来分隔列和行：

```css
.container { 
   display: grid; 
   column-row: 40px;
   row-gap: 20px;
}
```

结果如下：

![1665508114527-5e7a8a1f-98e3-4949-a367-943f3ab6b65c.png](./img/a5VS-NNj_I5JtEJ3/1665508114527-5e7a8a1f-98e3-4949-a367-943f3ab6b65c-338772.png)

## 5. 水平对齐内容

Grid  布局提供了六个属性来控制网格项沿网格容器的行或列的对齐方式。下面就来看看沿网格容器的列水平对齐网格项的属性都是如何使用的。

### （1）justify-items

可以使用` justify-items` 属性来控制所有网格项\*\*\*\*沿水平方向的对齐方式。它被传递给网格容器，其值适用于网格中的所有网格项。它接受四个可能的值：

* `start`：将网格项对齐到所有列的开头，即其单元格的左边缘。

```css
.container {
   justify-items: start;
}
```

![1665509286276-98e70f54-ab56-402b-a8b6-c656434d1092.png](./img/a5VS-NNj_I5JtEJ3/1665509286276-98e70f54-ab56-402b-a8b6-c656434d1092-397745.png)

* `end`：将网格项对齐到所有列的末尾，即其单元格的右边缘

```css
.container {
   justify-items: end;
}
```

![1665509367531-3dc06ea1-6027-4648-9326-8a06a657ef95.png](./img/a5VS-NNj_I5JtEJ3/1665509367531-3dc06ea1-6027-4648-9326-8a06a657ef95-018062.png)

* `center`：将所有网格项目放在其单元格的中心

```css
.container {
   justify-items: center;
}
```

![1665509386275-b4739601-fb9e-4dab-8c18-553c2ed777fd.png](./img/a5VS-NNj_I5JtEJ3/1665509386275-b4739601-fb9e-4dab-8c18-553c2ed777fd-567678.png)

* `stretch`：将拉伸网格项目以填充其单元格的整个宽度（默认值）

```css
.container {
   justify-items: stretch;
}
```

![1665509406660-d700d1d7-5903-4f20-9ae4-066c112a823b.png](./img/a5VS-NNj_I5JtEJ3/1665509406660-d700d1d7-5903-4f20-9ae4-066c112a823b-677100.png)

### （2）justify-content

可以使用`justify-content`属性来设置**网格在网格容器内**沿着水平方向的对齐方式。它接受七个可能的值。

* `start`：将网格与网格容器的左边对齐

```css
.container {
   justify-content: start;
}
```

![1665509941110-0269df93-4420-4a9c-931a-c1410eac2735.png](./img/a5VS-NNj_I5JtEJ3/1665509941110-0269df93-4420-4a9c-931a-c1410eac2735-238991.png)

* `end`：将网格与网格容器的右边对齐

```css
.container {
   justify-content: end;
}
```

![1665509993046-ddd79b98-cec5-4807-aa17-d8f284062bb5.png](./img/a5VS-NNj_I5JtEJ3/1665509993046-ddd79b98-cec5-4807-aa17-d8f284062bb5-724396.png)

* `center`：将整个网格水平放置在网格容器的中心

```css
.container {
   justify-content: center;
}
```

![1665510025736-b1c06567-411b-4375-93b3-965ca22ba804.png](./img/a5VS-NNj_I5JtEJ3/1665510025736-b1c06567-411b-4375-93b3-965ca22ba804-604870.png)

* `stretch`：调整网格项大小，让宽度填充整个网格容器（默认值）

```css
.container {
   justify-content: stretch;
}
```

![1665510064195-63a14d83-ee58-49e8-915c-35cdc59a3bd7.png](./img/a5VS-NNj_I5JtEJ3/1665510064195-63a14d83-ee58-49e8-915c-35cdc59a3bd7-897291.png)

* `space-around`：在网格项之间设置均等宽度的空白间隙，其外边缘间隙大小为中间空白间隙宽度的一半

```css
.container {
   justify-content: space-around;
}
```

![1665510097484-4741495a-d810-468e-af3e-8ab588382db6.png](./img/a5VS-NNj_I5JtEJ3/1665510097484-4741495a-d810-468e-af3e-8ab588382db6-791120.png)

* `space-between`：在网格项之间设置均等宽度空白间隙，其外边缘无间隙

```css
.container {
   justify-content: space-between;
}
```

![1665510133249-c4fdd52f-ff80-402f-bdd1-cfe8b2026354.png](./img/a5VS-NNj_I5JtEJ3/1665510133249-c4fdd52f-ff80-402f-bdd1-cfe8b2026354-326479.png)

* `space-evenly`：在每个网格项之间设置均等宽度的空白间隙，包括外边缘

```css
.container {
   justify-content: space-evenly;
}
```

![1665510157377-5432c0bc-d844-407b-9c59-2945281da5fc.png](./img/a5VS-NNj_I5JtEJ3/1665510157377-5432c0bc-d844-407b-9c59-2945281da5fc-676536.png)

### （3）justify-self

可以使用 `justify-self` 属性来设置单元格内容的水平位置，此属性定义在网格项上，它接受四个可能得值。

* `start`：将网格项对齐到列的开头，即其单元格的左边缘

```css
.box-1 {
   justify-self: start;
}
```

![1665510616838-8abfad35-8591-4b54-b82d-ff6f34262ffa.png](./img/a5VS-NNj_I5JtEJ3/1665510616838-8abfad35-8591-4b54-b82d-ff6f34262ffa-093812.png)

* `end`：将网格项对齐到列的末尾，即其单元格的右边缘

```css
.box-2 {
   justify-self: end;
}
```

![1665510631529-643a0cfa-50e1-411d-8e54-3e1eac794abc.png](./img/a5VS-NNj_I5JtEJ3/1665510631529-643a0cfa-50e1-411d-8e54-3e1eac794abc-795109.png)

* `center`：单将网格项放置在其单元格的中心

```css
.box-3 {
   justify-self: center;
}
```

![1665510712619-3ee577f7-a136-4fbd-9210-0eb028c6c52c.png](./img/a5VS-NNj_I5JtEJ3/1665510712619-3ee577f7-a136-4fbd-9210-0eb028c6c52c-429718.png)

* `stretch`：将拉伸网格项以填充整个单元格宽度（默认值）

```css
.box-4 {
   justify-self: stretch;
}
```

![1665510740392-c9f433fb-f8e9-4c02-afdf-ff14dce4fa35.png](./img/a5VS-NNj_I5JtEJ3/1665510740392-c9f433fb-f8e9-4c02-afdf-ff14dce4fa35-568679.png)

## 6. 垂直对齐内容

### （1）align-items

可以使用`align-items` 属性来控制所有网格项沿垂直方向的对齐方式。它被传递给网格容器，其值适用于网格中的所有网格项。它接受四个可能的值：

* `start`：将所有网格项放在所有行的顶部

```css
.container {
   align-items: start;
}
```

![1665510996013-4772c0d1-6674-4ec0-beda-e145e91db72e.png](./img/a5VS-NNj_I5JtEJ3/1665510996013-4772c0d1-6674-4ec0-beda-e145e91db72e-084123.png)

* `end`：将所有网格项放在所有行的底部。

```css
.container {
   align-items: end;
}
```

![1665511019141-d4b3da34-7492-48ef-bb67-cddefc5d0101.png](./img/a5VS-NNj_I5JtEJ3/1665511019141-d4b3da34-7492-48ef-bb67-cddefc5d0101-885853.png)

* `center`：将所有网格项目放在其单元格的中心

```css
.container {
   align-items: center;
}
```

![1665511042747-fd221b8f-8b16-4307-8abf-43680f6619a1.png](./img/a5VS-NNj_I5JtEJ3/1665511042747-fd221b8f-8b16-4307-8abf-43680f6619a1-910263.png)

* `stretch`：将拉伸所有网格项目以填充其单元格的整个高度（默认值）

```css
.container {
   align-items: stretch;
}
```

![1665511065813-9a817194-dc39-4bda-b8be-1fe15132c831.png](./img/a5VS-NNj_I5JtEJ3/1665511065813-9a817194-dc39-4bda-b8be-1fe15132c831-097753.png)

### （2）align-content

可以使用`align-content`属性来设置**网格在网格容器内**沿着垂直方向的对齐方式。它接受七个可能的值。

* `start`：将整个网格对齐到网格容器的顶部

```css
.container {
   align-content: start;
}

```

![1665511152736-8ae6f7bf-9436-45c8-89e9-10642bebe5d4.png](./img/a5VS-NNj_I5JtEJ3/1665511152736-8ae6f7bf-9436-45c8-89e9-10642bebe5d4-084073.png)

* `end`：将整个网格与网格容器的底部对齐

```css
.container {
   align-content: end;
}
```

![1665511182772-a38f7423-95e8-4726-9111-384f8818dd6f.png](./img/a5VS-NNj_I5JtEJ3/1665511182772-a38f7423-95e8-4726-9111-384f8818dd6f-512790.png)

* **center**：将整个网格垂直放置在网格容器的中心

```css
.container {
   align-content: center;
}
```

![1665511205332-76a813e6-8c5f-47c0-b94b-fe228534e85f.png](./img/a5VS-NNj_I5JtEJ3/1665511205332-76a813e6-8c5f-47c0-b94b-fe228534e85f-219707.png)

* `stretch`： 网格项目拉伸以填充容器网格的整个高度（默认值）

```css
.container {
   align-content: stretch;
}
```

![1665511234825-0647614a-ad6c-40d5-9c41-db0074d6e392.png](./img/a5VS-NNj_I5JtEJ3/1665511234825-0647614a-ad6c-40d5-9c41-db0074d6e392-721767.png)

* `space-around`：在网格项之间设置均等宽度的空白间隙，其外边缘间隙大小为中间空白间隙宽度的一半

```css
.container {
   align-content: space-around;
}
```

![1665511350441-30b2f7c2-bc65-416f-8881-5ae65379dc77.png](./img/a5VS-NNj_I5JtEJ3/1665511350441-30b2f7c2-bc65-416f-8881-5ae65379dc77-052456.png)

* `space-between`：在网格项之间设置均等宽度空白间隙，其外边缘无间隙

```css
.container {
   align-content: space-between;
}
```

![1665511377686-7ca08fe4-7252-429f-a4ee-7dd063d6c361.png](./img/a5VS-NNj_I5JtEJ3/1665511377686-7ca08fe4-7252-429f-a4ee-7dd063d6c361-053252.png)

* `space-evenly`：在每个网格项之间设置均等宽度的空白间隙，包括外边缘

```css
.container {
   align-content: space-evenly;
}
```

![1665511392342-cd5fcd6e-48c6-4a7f-bd39-d3345e619c2c.png](./img/a5VS-NNj_I5JtEJ3/1665511392342-cd5fcd6e-48c6-4a7f-bd39-d3345e619c2c-042873.png)

### （3）align-self

可以使用 `align-self` 属性来设置单元格内容的垂直位置，此属性定义在网格项上，它接受四个可能得值。

* `start`：在其单元格的顶部放置一个网格项

```css
.box-4 {
   align-self: start;
}

```

![1665511516239-65938ad5-9f6e-47b2-8bfc-a729338520d8.png](./img/a5VS-NNj_I5JtEJ3/1665511516239-65938ad5-9f6e-47b2-8bfc-a729338520d8-663989.png)

* `end`：在其单元格的底部放置一个网格项

```css
.box-5 {
   align-self: end;
}
```

![1665511541616-88728072-a765-4fea-98dd-67ccbf94a1c6.png](./img/a5VS-NNj_I5JtEJ3/1665511541616-88728072-a765-4fea-98dd-67ccbf94a1c6-035469.png)

* `center`：将一个网格项放置在其单元格的中心

```css
.box-6 {
   align-self: center;
}
```

![1665511566964-40b2d1f1-56b3-42c4-9d6d-cdc8b07b393b.png](./img/a5VS-NNj_I5JtEJ3/1665511566964-40b2d1f1-56b3-42c4-9d6d-cdc8b07b393b-783158.png)

* stretch：将拉伸网格项目以填充其单元格的整个高度（默认值）

```css
.box-1 {
  align-self: stretch;
}
```

![1665511602385-a7fcdd57-2618-4dd5-aafc-fd29c3178f19.png](./img/a5VS-NNj_I5JtEJ3/1665511602385-a7fcdd57-2618-4dd5-aafc-fd29c3178f19-888568.png)

## 7. 新的测量单位

除了非负CSS 长度值（例如px、rem、vw和百分比 ( %) ）之外，我们还可以使用特殊的大小单位和关键字来控制网格中网格项的大小。

### （1）fr 单位

fr单位是“fractional”的缩写，是 CSS 网格布局中引入的长度单位。它代表网格容器中可用空间的一部分。这使它成为定义响应列和行的理想单位，这些列和行将随着浏览器的视口缩小和增大而缩放。

下面来看一个简单的例子，假设我们要创建一个由三列组成的网格布局，其中第一列占网格宽度的 1/6，第二列是第一列宽度的两倍，第三列是第一列宽度的三倍。如果没有fr 单位，我们就需要执行一些数学运算，先用网格的总宽度100%除以6，然后将结果乘以每列的跨度：

* 第一列的宽度 = 100% / 6 \* 1 —> 15%
* 第二列的宽度 = 100% / 6 \* 2 —> 30%
* 第三列的宽度 = 100% / 6 \* 3 —> 45%

随着布局变得越来越复杂，使用百分比或任何CSS 数学函数将变得不可持续。这时 fr 单位就派上用场了。fr单位通过让我们指定网格容器中的可用空间应如何在其行和列之间进行分配，然后按该顺序分配可用空间：

```css
.container {
   display: grid;
   grid-template-columns: 1fr 2fr 3fr;
}
```

上面的代码中，我们将容器宽度的一部分分给第一列，第二列的宽度是第一列的两倍，第三列的宽度是第一列的三倍。

结果如下：\
![1665541105910-5f6cb0df-7c4d-4054-bf3d-e96d0028cfec.png](./img/a5VS-NNj_I5JtEJ3/1665541105910-5f6cb0df-7c4d-4054-bf3d-e96d0028cfec-126202.png)

### （2）min-content

min-content 是一个用于调整大小的关键字，它将网格轨迹的宽度设置为最小宽度，通常是网格项中最小内容或文本的大小。它的工作原理类似于CSS函数：`min()`，但被用作间距单位而不是函数。

当应用于列或行时，它们会变得与轨迹中最长的内容一样窄。这可以获得网格项内内容的最短长度。

下面来看一个例子；

```css
.container {
   display: grid;
   grid-template-columns: 1fr min-content 1fr;
}
```

在上面的代码中，我们将第一列和第三列的宽度设置为网格容器的小部分，同时将第二列设置为 `min-content`，使其缩小到网格项中内容的大小。

结果如下：

![1665542134627-7e906364-a6d4-4e88-ad8a-bf6de8d91c42.png](./img/a5VS-NNj_I5JtEJ3/1665542134627-7e906364-a6d4-4e88-ad8a-bf6de8d91c42-932818.png)

### （3）max-content

`max-content`关键字的效果与`min-content`相反，它类似于CSS函数：max()。当应用于列或行时，轨道将变得尽可能宽，以便网格项中的所有内容都显示在一条完整的长行中。

使用`max-content`的好处就是，可以让网格项中的内容扩展，而不是将它们包装成新行，这会导致垂直文本溢出。

下面来看一个例子：

```css
.container {
   display: grid;
   grid-template-columns: 1fr max-content 1fr;
}
```

上面的代码定义了三列，并将第二列的宽度设置为`max-content`关键字。如果在第二列的网格项中添加大量内容，这些网格项中的文本将不会溢出。相反，第二列的宽度将增加，第一列和第三列将缩小以适应它。

结果如下：

![1665543035085-4cece427-7345-440c-bc78-665880275d1a.png](./img/a5VS-NNj_I5JtEJ3/1665543035085-4cece427-7345-440c-bc78-665880275d1a-460960.png)

## 8. CSS函数

在使用 CSS Grid 进行布局时，一些CSS数学函数可以帮助我们提高效率。比如 `repeat()` 、`minmax()`、`fit-content()`。

### （1）repeat()

`repeat()` 函数表示轨道列表的重复片段，允许以更紧凑的形式写入大量显示重复模式的列或行。。

例如，在使用`grid-template-columns`和`grid-template-rows`这两个属性时，可以使用 `repeat()` 函数更简洁地声明这些重复模式。

该函数有两个参数：

① 第一个参数用来指定行或列的重复模式重复的次数，有三种取值方式：

* `<number>`：整数，确切的重复次数。
* `<auto-fill>`：以网格项为准自动填充。
* `<auto-fit>`：以网格容器为准自动填充。

② 第二个参数用来指定行或列的重复模式重复的内容，有以下取值方式：

* `<length>`：非负长度。
* `<percentage>`：相对于列轨道中网格容器的内联大小的非负百分比，以及行轨道中网格容器的块长宽。
* `<flex>`：单位为`fr`的非负长度，指定轨道弹性布局的系数值。
* `max-content`：表示网格的轨道长度自适应内容最大的那个单元格。
* `min-content`：表示网格的轨道长度自适应内容最小的那个单元格。
* `auto`：作为最大值时，等价于`max-content`。作为最小值时，它表示轨道中单元格最小长宽(`min-width`/`min-height)`的最大值。

假设我们要创建一个具有六个相等列的网格。如果没有 `repeat()` 函数，我们必须使用 `grid-template-columns` 属性显式定义每个列。代码如下：

```css
.container {
     display: grid;
     grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}
```

然而，随着列数的增加，这种方法变得不可持续和冗长。我们可以使用`repeat()`函数将其重写为更紧凑的形式。代码如下：

```css
.container {
     display: grid;
     grid-template-columns: repeat(6, 1fr);
}
```

结果如下：

![1665543708820-15921765-d124-44ab-bf2b-68694d0154c4.png](./img/a5VS-NNj_I5JtEJ3/1665543708820-15921765-d124-44ab-bf2b-68694d0154c4-993773.png)

### （2）minmax()

定义响应式网格布局时，我们可能希望为每个网格轨道指定最小和最大宽度，以确保它们在视口调整大小时上下缩放以适应其内容。这时 `minmax()` 就派上用场了。

`minmax()` 函数允许我们指定网格轨道的最小和最大尺寸，它是一个长宽范围的闭区间。当网格在视口中调整大小时，网格轨道将在该范围内增长和缩小。在较小的屏幕上，它会缩小直到达到最小尺寸。在更大的屏幕上，它会拉伸直到达到最大尺寸。

`minmax()` 函数接受 CSS Grid 大小单位、关键字、长度和百分比值。其有两个参数：

* `min`：轨道的最小尺寸。
* `max`：轨道的最大尺寸。

下面来看一个例子：

```css
.container {
  display: grid;
   grid-template-columns: repeat(3, 1fr);
   grid-template-rows: repeat(2, minmax(100px, max-content));
}
```

在上面的代码中，我们使用 `minmax()` 函数将网格容器中两行的最小高度设置为 100px，将最大高度设置 `max-content`。这样就可以确保每一行在超过 100px 时都能伸展并变得尽可能宽，以容纳其内容。

结果如下：

![1665545512913-eb95159f-443b-47aa-88b9-af9f7d1e2ccb.png](./img/a5VS-NNj_I5JtEJ3/1665545512913-eb95159f-443b-47aa-88b9-af9f7d1e2ccb-407178.png)`minmax()` 函数的一个显著优点就是它减少了对媒体查询的需要。它不依靠媒体查询来控制跨视口的网格轨道（列和行）的大小，而是允许在一定程度上设置网格轨道值的响应式转换。

### （3）fit-content()

`fit-content()` 函数的操作类似于 `minmax()` 函数。 不同之处在于，使用` fit-content()` 时，最小值是网格项中内容的大小，最大值是我们传递给它的值。这样就可以将内容设置为最小值，并根据需要将其放大到某个值。

当应用于网格轨道时，它将网格轨道的大小设置为最小宽度，这是其网格项目中最小的内容或文本的大小。需要注意的是，最小的内容或文本大小不大于函数中指定的值。

但是，如果最小宽度的值超过了提供给函数的值，则网格轨道的大小将设置为传递给 `fit-content()` 函数的值，并且网格项的内容将换行。

下面来看一个例子：

```css
.container {
   display: grid;
   grid-template-columns: fit-content(200px) fit-content(300px) fit-content(400px);
}
```

上面的代码使用 `fit-content()` 函数分别创建了宽度为 200px、300px 和 400px 的三列。 这意味着每列的大小将等于其网格项目中最小的内容或文本的大小，但如果这变得大于提供给 `fit-content()` 函数的值，则列将设置为传递给 `fit-content()` 函数的值。

结果如下：

![1665546346135-351a8e1b-f180-405c-b66d-56f72ebf9d95.png](./img/a5VS-NNj_I5JtEJ3/1665546346135-351a8e1b-f180-405c-b66d-56f72ebf9d95-892638.png)

## 9. 网格项属性

在网格容器中，每条网格线都根据其在网格上的位置给出一个编号。第一条网格线（行或列）的编号为 1，第二条为 2，依此类推。

例如，下图在一个三列两行的网格容器上存在的网格线的数量，其中列线是橙色圆圈内从 1 到 4 的数字，而行线是蓝色圆圈内的数字从 1 到 3 圈。

![1665548915309-19b3919a-9348-4c4f-a862-5c9519232da4.png](./img/a5VS-NNj_I5JtEJ3/1665548915309-19b3919a-9348-4c4f-a862-5c9519232da4-518626.png)

浏览器使用这些网格线来控制网格中项目的布局和位置。CSS Grid 提供了一些属性来控制网格项目沿这些网格线的位置，以及它们在水平和垂直方向上跨越的宽度。

可用于控制网格项的位置以及它们如何跨越这些行的属性是：

* grid-column-start
* grid-column-end
* grid-row-start
* grid-row-end

### （1）grid-column-start

可以使用 grid-column-start 属性来指定网格项沿网格容器内的列网格线的水平起始位置。 这个开始位置定义了网格项目左边缘的开始。

使用下面的网格布局，来定位第一个网格项并将其水平起始位置设置为第 2 列。

![1665549744226-316cfd5a-7989-46fc-98d4-e01b24d6f45a.png](./img/a5VS-NNj_I5JtEJ3/1665549744226-316cfd5a-7989-46fc-98d4-e01b24d6f45a-677608.png)

选择第一个子元素，并定位：

```css
.container div:nth-of-type(1) {
  grid-column-start: 2;
}
```

这样，所选网格项的水平起始位置将位于第二条垂直网格线（第 2 列）上。

![1665549835995-2980c51b-008b-4193-a13c-4ae8417688c2.png](./img/a5VS-NNj_I5JtEJ3/1665549835995-2980c51b-008b-4193-a13c-4ae8417688c2-131488.png)

上图中，第一个网格项现在从第 2 列开始，而其他网格项被移动，换行到了新行或在网格上创建了空白空间。

### （2）grid-column-end

除了使用 `grid-column-start` 指定网格项的水平起始位置外，还可以使用 `grid-column-end` 属性设置网格项的结束位置。

例如：

```css
.container div:nth-of-type(1) {
  grid-column-start: 2;
  grid-column-end: 4;
}
```

这使得第一个网格项从第 2 列开始，跨越两条网格线，并在第 4 行结束。使用 `grid-column-start` 和 `grid-column-end` 属性，可以有效地控制网格的水平起始位置以及它跨越网格的宽度。

结果如下：

![1665550028979-8101eaa3-b0cd-41e5-bc98-b5c3064e9830.png](./img/a5VS-NNj_I5JtEJ3/1665550028979-8101eaa3-b0cd-41e5-bc98-b5c3064e9830-845083.png)

### （3）grid-row-start

可以使用 grid-row-start 属性来指定网格项沿网格容器内水平（行）网格线的垂直起始位置。它用于设置网格项开始的行。

例如：

```css
.container div:nth-of-type(2) {
  grid-row-start: 1;
}
```

在上面的代码中，使用 `grid-row-start`属性将第二个 `div` 元素的垂直起始位置设置为第 1 行。

结果如下：

![1665550125171-6c68af0d-97bb-4f3a-acb4-cb8f4377e79b.png](./img/a5VS-NNj_I5JtEJ3/1665550125171-6c68af0d-97bb-4f3a-acb4-cb8f4377e79b-420146.png)

### （4）grid-row-end

可以使用 grid-row-end 属性来指定网格项沿网格容器内水平（行）网格线的垂直结束位置。

例如：

```css
.container div:nth-of-type(2) {
   grid-row-start: 1;
   grid-row-start: 4;
}
```

这使得第二个网格项从第一行开始，跨越三个网格线，在第 4 行结束。使用 `grid-row-start` 和 `grid-row-end` 属性，可以有效地控制网格项的垂直起始位置及其在网格中的高度。

结果如下：

![1665550445030-98cf165c-6f25-4b42-a436-06cd416de6d2.png](./img/a5VS-NNj_I5JtEJ3/1665550445030-98cf165c-6f25-4b42-a436-06cd416de6d2-319840.png)

### （5）其他

上面的四个属性使用特定的网格线来确定网格项在网格内的位置，它们的属性值有以下几种：

* `<line>`：可以是一个数字来指代相应编号的网格线，也可使用名称指代相应命名的网格线；
* `span <number>`：网格项将跨越指定数量的网格轨道；
* `span <name>`：网格项将跨越一些轨道 ，直到遇到指定命名的网格线；
* `auto`：自动布局，或者自动跨越，或者跨越一个默认的轨道。

下面来看一个例子：

```css
.container div:nth-of-type(1) {
  grid-column-start: span 2;
}
```

这里使用 `span` 来表示第一个单元格跨越了2个网格。

结果如下：

![1665555817325-a0e5f505-66e7-4296-a574-16b6c24bf031.png](./img/a5VS-NNj_I5JtEJ3/1665555817325-a0e5f505-66e7-4296-a574-16b6c24bf031-504262.png)

下面来结合使用上面的四个属性：

```css
.container div:nth-of-type(1) {
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 2;
  grid-row-end: 4;
}
```

结果如下：

![1665555857653-0461ae05-01e6-486b-b3a8-33d921a24d90.png](./img/a5VS-NNj_I5JtEJ3/1665555857653-0461ae05-01e6-486b-b3a8-33d921a24d90-048328.png)

## 10. 隐式网格轨道

当我们设置的网格不足以放下所有的网格项时，就会自动出现一些网格轨道，这些多出来的行的高度是`auto`的，可以使用`grid-auto-columns`和 `grid-auto-rows` 属性来指定**自动生成的网格轨道**（又称为隐式网格轨道）的大小。

例如：

```css
.container {
   display: grid;
   grid-auto-columns: 100px
   grid-auto-rows: 80px
}
```

这里， `grid-auto-columns` 属性指定了隐式创建的网格垂直方向轨道的宽度为 100px，grid-auto-rows 属性指定了隐式创建的网格水平方向轨道的高度为 80px。

## 11. 速记属性

像大多数 CSS 属性一样，CSS Grid 提供了一些速记属性，它们提供了一种更短、更先进的方式来同时设置多个 CSS Grid 属性的值。使用这些速记属性，我们就可以编写更简洁

更易读的样式，从而节省开发时间。下面就来看看这些属性。

### （1）gap

`column-gap` 和 `row-gap` 属性用来设置网格之前的距离，即网格线的宽度。可以通过 `gap` 属性简写这两个属性，其语法如下：

```css
gap: <row-gap> <column-gap>
```

其中 `<column-gap>` 是一个可选值，如果省略，则设置为与 `<row-gap>` 相同的值。下面来看一个例子：

```css
.container {
   display: grid;
   gap: 20px;
}
```

这在网格容器中的所有列和行之间都添加了 20px 的空间，与下面的代码等价：

```css
.container { 
	display: grid; 
	column-row: 20px;
	row-gap: 20px;
}
```

### （2）place-items

`place-items` 用来设置 `align-items` 和 `justify-items` 属性的值，它能够同时控制所有网格项目的水平和垂直对齐。

它接受两个值：第一个值设置 `align-items` 属性的值，第二个值设置 `justify-item`s 属性的值。 如果未指定第二个值，则将第一个值指定为两个属性的值。

例如：

```css
.container { 
	display: grid; 
	place-items: center; 
}
```

这会将 `align-items` 和 `justify-items` 属性的值都设置为 `center`，将所有网格项放置在其网格区域的中心。

### （3）place-content

`place-content` 用来设置网格属性 `align-content` 和 `justify-content` 的值，它能够同时控制网格容器内整个网格的水平和垂直对齐方式。

它接受两个值：第一个值设置 `align-content` 属性的值，第二个值设置 `justify-content` 属性的值。 如果未指定第二个值，则将第一个值指定为两个属性的值。

例如：

```css
.container { 
	display: grid; 
	place-content: center; 
}
```

这样就会将 `align-content` 和 `justify-content` 属性的值都设置为 `center`，使整个网格在网格容器中水平和垂直居中。

### （4）place-self

`place-items` 可以设置 `align-self` 和 `justify-self` 属性的值。 它能够控制单个网格项目在其网格区域内的水平和垂直对齐方式。

它接受两个值：第一个值设置 `align-self` 属性的值，第二个值设置 `justify-self` 属性的值。如果未指定第二个值，则将第一个值指定为两个属性的值。

例如：

```css
.item { 
   place-self: end center;
}
```

在上面的代码中，`align-self` 属性的值设置为`end`，这会将网格项垂直向下推到其网格单元格的底部。`justify-self` 属性设置为 `center`，将网格项目水平放置在其单元格的中心。

结果如下：

![1665556922126-ad2535ff-5109-4e16-ad4f-768adc1d8e0b.png](./img/a5VS-NNj_I5JtEJ3/1665556922126-ad2535ff-5109-4e16-ad4f-768adc1d8e0b-143750.png)

### （5）grid-column

`grid-column` 是 `grid-column-start` 和 `grid-column-end` 属性的简写属性。 它可以指定网格项沿网格容器内的列网格线的水平起始位置以及网格项应该结束的位置。

`grid-column`的语法如下：

```css
grid-column: column-start / column-end;
```

`grid-column` 属性接受两个由斜线 (/) 分隔的网格线值，其中：

* 第一个值 `column-start` 是 `grid-column-start` 属性的值；
* 第二个值 `column-end` 是 `grid-column-end` 属性的值；
* 斜杠 (/) 用作这两个值之间的分界线，因为两者都可以包含一个或多个空格。 因此，需要通过斜线来消除错误和歧义。 此外，作为最佳实践，建议在斜杠 (/) 的两侧添加一哥空格，以使 CSS 更具可读性。

例如：

```css
.gird-item {
  grid-column: 1 / 3;
}
```

上面的代码告诉网格项从网格中的第 1 列水平跨越到第 3 列，与下面的代码等价：

```css
.gird-item {
  grid-column-start: 1;
  grid-column-end: 3;
}
```

### （6）grid-row

`grid-row` 属性的工作方式与 `grid-column` 属性一样。 它是 `grid-row-start` 和 `grid-row-end` 属性的简写属性。 它可以指定网格项沿网格容器中的行网格线的垂直起始位置，以及网格项应该在网格中的何处结束。

例如：

```css
.gird-item {
  grid-column: 2 / 5;
}
```

这就会使得网格项的高度从网格中的第 2 行向下跨越到第 5 行。

`grid-column` 和 `grid-row` 属性中也可以使用 `span` 关键字，以下两者是等效的：

```css
.gird-item {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.gird-item {
  grid-column: 1 / span 2;
  grid-row: 1 / span 2;
}
```

斜杠后面的部分可以省略，表示跨越第一个网格。

### （7）grid-template

`grid-template-columns`、`grid-template-rows`、`grid-template-areas`这三个属性可以简写在`grid-template`属性中。

`grid-template`属性有三个属性值：

* `none`： 将三个属性都设置为其初始值，即一行一列一个单元格；
* `subgrid`： 把`grid-template-columns`和`grid-template-rows`设置为`subgrid`，并且把`grid-template-areas`设置为初始值；
* `grid-template-rows/grid-template-columns`：将`grid-template-columns`和`grid-template-rows`设为指定值，而`grid-template-areas`设置为`none`。

### （8）grid-area

`grid-area` 属性指定网格元素在网格布局中的大小和位置，它是`grid-row-start`、`grid-column-start`、`grid-row-end`、`grid-column-end`属性的合并简写形式，其语法如下：

```css
grid-area: <row-start> / <column-start> / <row-end> / <column-end>;
```

对于下面这段代码：

```css
.container div:nth-of-type(1) {
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 2;
  grid-row-end: 4;
}
```

可以简写成这样：

```css
.container div:nth-of-type(1) {
  grid-area: 2 / 1 / 4 / 3;
}
```

除此之外，`grid-area` 属性还可以对网格元素进行命名。命名的网格元素可以通过容器的 `grid-template-areas` 属性来引用。

下面来看一个例子：

```css
.item1 { grid-area: header; }
.item2 { grid-area: main; }
.item3 { grid-area: sideber; }
.item4 { grid-area: footer; }
 
.container {
  grid-template-areas:
    'header header header'
    'menu main sideber'
    'footer footer footer';
}
```

结果如下：

![1665558970329-e4780077-6535-42b2-8379-1642d076c898.png](./img/a5VS-NNj_I5JtEJ3/1665558970329-e4780077-6535-42b2-8379-1642d076c898-605177.png)

### （9）grid

`grid` 属性可以为每个显式网格容器属性（例如 `grid-template-rows`、`grid-template-columns` 和 `grid-template-areas`）以及每个隐式网格容器属性设置一个值（例如 `grid-auto-rows`、`grid-auto-columns` 和 `grid-auto-flow`）在一个声明中。

`grid` 属性的语法如下：

```css
<grid-template> | <grid-template-rows> / [ auto-flow && dense? ] <grid-auto-columns>? | [ auto-flow && dense? ] <grid-auto-rows>? / <grid-template-columns>
```

## 12. CSS Grid 调试

上面我们介绍了如何定义 CSS Grid 布局，那该如何调试呢？Chrome DevTools 支持对 Grid 布局进行提示。如果一个元素是 Grid 布局，在 DevTools 的 Elements 面板中，Grid 布局的容器元素上就会显示一个 grid 的标识，如下：

![1665560204401-11298ced-0e4a-4dab-b7d2-a63f3c3cce4a.png](./img/a5VS-NNj_I5JtEJ3/1665560204401-11298ced-0e4a-4dab-b7d2-a63f3c3cce4a-726716.png)

点击这个 grid 标志，页面的 grid 网格就会显示数网格区域以及网格线，并且会为网格线进行编号，如下：

![1665560187594-f3d3de81-91f6-4e3f-b32a-ab7d1b92dc4e.png](./img/a5VS-NNj_I5JtEJ3/1665560187594-f3d3de81-91f6-4e3f-b32a-ab7d1b92dc4e-483118.png)

下面切换到 Layout 选项卡，就可以看到 Grid 布局的一些选项，我们可以设置页面上是否显示轨道的宽度/高度，是否展示网格区域的名称，是否显示网格线的延长，是否显示网格线的名称。除此之外，还会显示当前页面上所有使用 Grid 布局的地方，可以进行显示隐藏：

![1665560667739-c72e4435-d863-4f46-8105-8a503b020349.png](./img/a5VS-NNj_I5JtEJ3/1665560667739-c72e4435-d863-4f46-8105-8a503b020349-172398.png)通过这些选项，就可以对 CSS Grid 布局进行调试了。

## 13. CSS Grid 生成器

最后来分享几个实用的 CSS Grid 生成器。通过这些生成器，可以可视化得调整 Grid 布局，最终会拿到生成的 Grid 布局代码。

### （1）CSS Grid Generator

![1665561628501-516edeab-5eb2-4781-a2fb-d93e640f4a95.png](./img/a5VS-NNj_I5JtEJ3/1665561628501-516edeab-5eb2-4781-a2fb-d93e640f4a95-239985.png)

**在线体验：**<https://cssgrid-generator.netlify.app/>

### （2）CSS Layout Generator

![1665561703104-7fc885b9-8775-4d19-9f6e-889e056163a8.png](./img/a5VS-NNj_I5JtEJ3/1665561703104-7fc885b9-8775-4d19-9f6e-889e056163a8-604469.png)

**在线体验：**<https://layout.bradwoods.io/customize>

### （3）Grid LayoutIt

![1665561765583-6894f795-f6b6-4037-9712-252027e2f458.png](./img/a5VS-NNj_I5JtEJ3/1665561765583-6894f795-f6b6-4037-9712-252027e2f458-098053.png)

**在线体验：**<https://grid.layoutit.com/>

### （4）Griddy

![1665561807682-c77eb79b-9c35-43bc-9738-8bfb7934bb66.png](./img/a5VS-NNj_I5JtEJ3/1665561807682-c77eb79b-9c35-43bc-9738-8bfb7934bb66-239698.png)

**在线体验：**<https://griddy.io/>

### （5）Cssgr.id

![1665561862726-ae02b225-7050-4610-b5bb-70f02f8e3965.png](./img/a5VS-NNj_I5JtEJ3/1665561862726-ae02b225-7050-4610-b5bb-70f02f8e3965-190382.png)

**在线体验：**<https://cssgr.id/>


> 更新: 2023-02-26 16:58:13  
> 原文: <https://www.yuque.com/cuggz/feplus/uiqzok>