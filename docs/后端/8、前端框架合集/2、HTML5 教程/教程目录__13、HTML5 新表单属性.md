# 13、HTML5 新表单属性
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/13.html
- 分类：前端框架
- 分组：教程目录
HTML5 为 `` 和 `` 标签新添加了几个属性

####  新属性

**1、** autocomplete；

**2、** novalidate；

####  新属性

**1、** autocomplete；

**2、** autofocus；

**3、** form；

**4、** formaction；

**5、** formenctype；

**6、** formmethod；

**7、** formnovalidate；

**8、** formtarget；

**9、** height与width；

**10、** list；

**11、** min与max；

**12、** multiple；

**13、** pattern(regexp)；

**14、** placeholder；

**15、** required；

**16、** step；

##  /  autocomplete 属性

属性autocomplete 用于设置 form 或 input 域应该拥有自动完成功能

当用户在自动完成域中开始输入时，浏览器应该在该域中显示填写的选项

> autocomplete 属性有可能在 form 元素中是开启的，而在 input 元素中是关闭的
>
> autocomplete 适用于  标签，以及以下类型的  标签：text, search, url, telephone, email, password, datepickers, range 以及 color

#### 浏览器支持

### 范例

下面的范例在 HTML form 中开启 autocomplete，同时一个 input 字段关闭 autocomplete

```html
<form action="/dy/html/getpost" autocomplete="on">
  First name:<input type="text" name="fname"><br>
  Last name: <input type="text" name="lname"><br>
  E-mail: <input type="email" name="email" autocomplete="off"><br>
  <input type="submit">
</form>
```

> 注意: 在某些浏览器中，您可能需要启用自动完成功能，以使该属性生效

##  novalidate 属性

属性novalidate 是一个 boolean 属性，用于设置在提交表单时不应该验证 form 或 input 域

#### 浏览器支持

### 范例

下面的范例设置无需验证提交的表单数据

```html
<form action="/dy/html/getpost" novalidate>
  E-mail: <input type="email" name="user_email">
  <input type="submit">
</form>
```

##  autofocus 属性

属性autofocus 是一个 boolean 属性，用于设置在页面加载时，域自动地获得焦点

#### 浏览器支持

### 范例

下面的范例让 "First name" input 输入域在页面载入时自动聚焦

```html
First name:<input type="text" name="fname" autofocus>
```

##  form 属性

属性form 用于设置输入域所属的一个或多个表单

如需引用一个以上的表单，需要使用空格分隔的列表

#### 浏览器支持

### 范例

下面的范例位于 form 表单外的 input 字段引用了 HTML form (该 input 表单仍然属于form表单的一部分)

```html
<form action="demo-form.php" id="form1">
  姓: <input type="text" name="fname"><br>
  <input type="submit" value="提交">
</form>
名: <input type="text" name="lname" form="form1">
```

##  formaction 属性

属性formaction 用于描述表单提交的 URL 地址，它会覆盖 `` 元素中的 action 属性

> 注意: 属性 formaction 只适用于 type="submit" 和 type="image"

#### 浏览器支持

### 范例

下面范例中的 form 表单包含了两个不同地址的提交按钮

```html
<form action="/dy/html/getpost">
  First name: <input type="text" name="fname"><br>
  Last name: <input type="text" name="lname"><br>
  <input type="submit" value="提交"><br>
  <input type="submit" formaction="/dy/json/getpost" 
  value="提交">
</form>
```

##  formenctype 属性

属性formenctype 用于设置表单提交到服务器的数据编码，只对 form 表单中 method="post" 表单

属性formenctype 会覆盖 form 元素的 enctype 属性

该属性主要与 type="submit" 和 type="image" 配合使用

#### 浏览器支持

### 范例

下面的范例中， 第一个提交按钮已默认编码发送表单数据，第二个提交按钮以 "multipart/form-data" 编码格式发送表单数据

```html
<form action="/dy/html/getpost" method="post">
  First name: <input type="text" name="fname"><br>
  <input type="submit" value="提交">
  <input type="submit" formenctype="multipart/form-data"
  value="以 Multipart/form-data 提交">
</form>
```

##  formmethod 属性

属性formmethod 用于设置表单的提交方法

属性formmethod 会覆盖了 `` 元素的 method 属性

该属性可以与 type="submit" 和 type="image" 配合使用

#### 浏览器支持

### 范例

下面的范例重新设置了表单提交方法

```html
<form action="/dy/html/getpost" method="get">
  First name: <input type="text" name="fname"><br>
  Last name: <input type="text" name="lname"><br>
  <input type="submit" value="提交">
  <input type="submit" formmethod="post" formaction="/dy/html/getpost"
  value="使用 POST 提交">
</form>
```

##  formnovalidate 属性

属性novalidate 是一个 boolean 属性，用于设置 `` 元素在表单提交时无需被验证

formnovalidate 属性会覆盖 `` 元素的 novalidate 属性

属性formnovalidate 一般与 type="submit" 一起使用

### 浏览器支持

### 范例

下面的范例设置了两个提交按钮的表单(使用与不适用验证 )

```html
<form action="/dy/html/getpost">
E-mail: <input type="email" name="userid"><br>
<input type="submit" value="提交"><br>
<input type="submit" formnovalidate value="不验证提交">
</form>
```

##  formtarget 属性

属性formtarget 用于设置一个名称或一个关键字来指明表单提交数据接收后的展示

属性formtarget 会覆盖 `` 元素的 target 属性

属性formtarget 一般与 type="submit" 和 type="image" 配合使用

#### 浏览器支持

### 范例

下面的范例使用两个提交按钮的表单, 在不同窗口中显示

```html
<form action="/dy/html/getpost">     
    First name: <input type="text" name="fname"><br>
    Last name: <input type="text" name="lname"><br>
    <input type="submit" value="正常提交">
  <input type="submit" formtarget="_blank"
  value="提交到一个新的页面上">
</form>
```

##  height 和 width 属性

属性height 和 width 用于设置 image 类型的 `` 元素的图像高度和宽度

> 属性 height 和 width 只适用于 image 类型的  标签

图像通常会同时指定高度和宽度属性

如果图像设置高度和宽度，图像所需的空间 在加载页时会被保留

如果没有这些属性，浏览器不知道图像的大小，并不能预留 适当的空间

图片在加载过程中会使页面布局效果改变 ( 尽管图片已加载 )

#### 浏览器支持

### 范例

下面的范例定义了一个图像提交按钮, 使用了 height 和 width 属性

```html
<input type="image" src="img_submit.gif" alt="Submit" width="48" 
    height="48">
```

##  list 属性

属性list 用于设置输入域的 datalist

datalist 是输入域的选项列表

#### 浏览器支持

### 范例

下面的范例在 `` 中预定义 `` 值

```html
<input list="browsers">
    <datalist id="browsers">
      <option value="Internet Explorer">
  <option value="Firefox">
  <option value="Chrome">
  <option value="Opera">
  <option value="Safari">
</datalist>
```

##  min 和 max 属性

属性min 、max 和 step 用于为包含数字或日期的 input 类型设置约束条件

min、max 和 step 属性适用于以下类型的 `` 标签：date pickers、number 以及 range

#### 浏览器支持

### 范例

下面的范例为 `` 元素最小值与最大值设置

```html
Enter a date before 1980-01-01:
<input type="date" name="bday" max="1979-12-31">
Enter a date after 2000-01-01:
<input type="date" name="bday" min="2000-01-02">
Quantity (between 1 and 5):
<input type="number" name="quantity" min="1" max="5">
```

##  multiple 属性

属性multiple 属性是一个 boolean 属性，用于设置 `` 元素中可选择多个值

属性multiple 适用于以下类型的 `` 标签 email 和 file

#### 浏览器支持

#### 范例

下面的范例用于上传多个文件

```html
<input type="file" name="img" multiple>
```

##  pattern 属性

属性pattern 用于设置一个正则表达式验证 `` 元素的值

pattern 属性适用于以下类型的 `` 标签: text, search, url, tel, email, 和 password

可以使用全局属性 title 来描述模式

如果想了解更多正则表达式的内容，可以访问我们的 JavaScript 基础教程

#### 浏览器支持

### 范例

下面的范例显示了一个只能包含三个字母的文本域 ( 不含数字及特殊字符 )

```html
Country code: <input type="text" name="country_code" pattern="[A-Za-z]{3}" 
    title="Three letter country code">
```

##  placeholder 属性

属性placeholder 用于设置一种提示 ( hint ) ，描述输入域所期待的值

简短的提示在用户输入值前会显示在输入域上

placeholder 属性适用于以下类型的 `` 标签：text, search, url, telephone, email 以及 password

#### 浏览器支持

### 范例

下面的范例为 input 字段设置提示文本

```html
<input type="text" name="fname" placeholder="First name">
```

##  required 属性

属性required 属性是一个 boolean 属性，用于设置必须在提交之前填写输入域 (不能为空 )

required 属性适用于以下类型的 `` 标签：text, search, url, telephone, email, password, date pickers, number, checkbox, radio 以及 file

#### 浏览器支持

### 范例

下面的范例设置了 input 字段不能为空

```html
<input type="text" name="usrname" required>
```

##  step 属性

属性step 用于为输入域规定合法的数字间隔

如果step="3"，则合法的数是 -3,0,3,6 等

step 属性可以与 max 和 min 属性创建一个区域值

step 属性与以下 type 类型一起使用: number, range, date, datetime, datetime-local, month, time 和 week

#### 浏览器支持

### 范例

下面的范例为 input 设置 step 步长为 3

```html
<input type="number" name="points" step="3">
```

## HTML5  标签

标签
描述

定义一个 form 表单

定义一个 input 域
