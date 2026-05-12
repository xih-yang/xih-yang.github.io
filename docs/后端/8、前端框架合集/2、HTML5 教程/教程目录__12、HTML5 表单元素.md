# 12、HTML5 表单元素
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/12.html
- 分类：前端框架
- 分组：教程目录
HTML5 新增加了三个新的表单元素 `` 、`` 、``

可惜的是，并不是所有的浏览器都支持HTML5 新的表单元素

但我们仍然可以使用它们，即使浏览器不支持表单属性，仍然可以显示为常规的表单元素

## HTML5  元素

HTML5 `` 元素用于设置输入域的选项列表

`` 属性设置了 form 或 input 域应该拥有自动完成功能

当用户在自动完成域中开始输入时，浏览器应该在该域中显示填写的选项

可以将`` 元素的列表属性与 `` 元素绑定

#### 浏览器支持

### 范例

下面的范例演示了如何将 `` 元素与 `` 绑定

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

运行以上范例，在浏览器中显示如下

## HTML5  元素

HTML5 `` 元素用于提供一种验证用户的可靠方法

`` 元素设置了用于表单的密钥对生成器字段

当提交表单时，会生成两个键，一个是私钥，一个公钥

私钥（private key）存储于客户端，公钥（public key）则被发送到服务器

公钥可用于之后验证用户的客户端证书 ( client certificate )

#### 浏览器支持

### 范例

下面的范例在一个 form 表单中使用了 `` 元素

```html
<form action="demo_keygen.asp" method="get">
<label>用户名: <input type="text" name="usr_name"></label><br/>
<label>加密: <keygen name="security"></keygen><br/>
<input type="submit">
</form>
```

运行以上范例，在浏览器中显示如下

## HTML5  元素

HTML5 `` 元素用于不同类型的输出，比如计算或脚本输出

#### 浏览器支持

将计算结果显示在 `` 元素

```html
<form oninput="x.value=parseInt(a.value)+parseInt(b.value)">0
<input type="range" id="a" value="50">100 +
<input type="number" id="b" value="50">=
<output name="x" for="a b"></output>
</form>
```

运行以上范例，在浏览器中显示如下

## HTML5 新表单元素

标签
描述

为  标签定义选项列表
请与 input 元素配合使用该元素，来定义 input 可能的值

 标签规定用于表单的密钥对生成器字段

 标签定义不同类型的输出，比如脚本的输出
