# 07、XML 属性
- 来源：https://ddkk.com/zhuanlan/xml/xml/7.html
- 分类：其他语言
- 分组：教程目录
XML元素可以有属性，和 HTML 标签的属性一样

属性（Attribute）提供有关元素的额外信息

## XML 属性

HTML 中的 属性提供有关元素的额外信息：

```xml
<img src="path_to_image.gif"><a href="link_url.html">
```

属性通常提供不属于数据组成部分的信息

下面的范例，文件类型与数据无关，但是对需要处理这个元素的软件来说却很重要

```xml
<file type="gif">computer.gif</file>
```

## XML 属性值必须加引号

属性值必须被引号包围，既可以使用单引号，也可以使用双引号

比如一个人的性别，person 元素可以这样写

```xml
<person sex="female">
```

或者这样

```xml
<person sex='female'>
```

如果属性值本身包含双引号，可以使用单引号

```xml
<gangster name='George "Shotgun" Ziegler'>
```

或者使用字符实体

```xml
<gangster name="George "Shotgun" Ziegler">
```

## XML 元素 vs. 属性

先来看两个 XML 文档

```xml
<person sex="female">
    <firstname>Anna</firstname>
    <lastname>Smith</lastname>
</person>
```

```xml
<person>
    <sex>female</sex>
    <firstname>Anna</firstname>
    <lastname>Smith</lastname>
</person>
```

sex 是一个属性 sex 是一个元素

这两个范例都提供相同的信息

XML推荐标准 没有什么规定可以告诉我们什么时候该使用属性，而什么时候该使用元素

但我们的实战经验是

**1、** HTML中，属性用起来很便利；

**2、** XML中，应该尽量避免使用属性如果信息感觉起来很像数据，那么请使用元素吧；

### 我最喜欢的方式

下面的三个 XML 文档包含完全相同的信息：

> 写情书的日期应该是最重要的，因为日思夜想，所谓属性，它只是标识情书的日期而已

这个使用了 date 属性

```xml
<note date="2017-10-18">
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

这个使用了 date 元素 （这是我的最爱）

```xml
<note>
  <date>2017-10-18</date>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

这个使用了扩展的 date 元素

> 太臃肿了

```xml
<note>
  <date>
      <day>18</day>
      <month>10</month>
      <year>2017</year>
  </date>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

## 避免 XML 属性？

使用属性可能会引起的一些问题：

**1、** 属性不能包含多个值（元素可以）；

**2、** 属性不能包含树结构（元素可以）；

**3、** 属性不容易扩展（为未来的变化）；

属性难以阅读和维护

请尽量使用元素来描述数据，而仅仅使用属性来提供与数据无关的信息。

记住，千万不要做这样的蠢事 (这不是 XML 应该被使用的方式 )

```xml
<note day="18" month="10" year="2017">
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

## 针对元数据的 XML 属性

有时候会向元素分配 ID 引用。这些 ID 索引可用于标识 XML 元素，它起作用的方式与 HTML 中 id 属性是一样的

比如

```xml
<message>
    <note id="520">
      <date>2017-10-18</date>
      <to>小明</to>
      <from>小红</from>
      <heading>短信</heading>
      <body>I miss you so much</body>
    </note>
    <note id="512">
      <date>2017-10-17</date>
      <to>小明</to>
      <from>小红</from>
      <heading>短信</heading>
      <body>I miss you today</body>
    </note>
</message>
```

上面的id 属性仅仅是一个标识符，用于标识不同的便签。它并不是便签数据的组成部分

## 标签 VS 属性最佳实战

元数据（有关数据的数据）应当存储为属性，而数据本身应当存储为元素
