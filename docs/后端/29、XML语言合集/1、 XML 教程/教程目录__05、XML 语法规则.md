# 05、XML 语法规则
- 来源：https://ddkk.com/zhuanlan/xml/xml/5.html
- 分类：其他语言
- 分组：教程目录
XML是自描述的数据传输语言

XML的语法规则很简单，且很有逻辑

XML的语法规则很容易学习，很容易记住，更很容易使用

## XML 文档必须有根元素

XML必须包含根元素，它是所有其他元素的父元素，

比如以下 XML 文档中 root 就是根元素

```xml
<root>
  <child>
    <subchild>.....</subchild>
  </child>
</root>
```

下面XML 文档中 note 是根元素

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>小明</to>
  <from>小红</from>
  <heading>短信</heading>
  <body>I miss you so much</body>
</note>
```

## XML 声明

XML声明部分的可选部分，如果存在需要放在文档的第一行，如下所示：

```xml
<?xml version="1.0" encoding="utf-8"?>
```

这个声明包含 **XML 版本(1.0)** 和 **文件编码格式(UTF-8)**

> 虽然声明是可选的，但我们推荐你的 XML 文档都要有 XML 声明

## 所有的 XML 元素都必须有一个关闭标签

在HTML4 中，某些元素不必有一个关闭标签

```xml
<p>这是一个段落。
<br>
```

但在XML 中，省略关闭标签是非法的。所有元素都 **必须** 有关闭标签

```xml
<p>这是一个段落。</p>
<br />
```

你也许已经注意到 XML 声明没有关闭标签。这不是错误 声明不是 XML 文档本身的一部分，它没有关闭标签

## XML 标签对大小写敏感

**XML 标签** 对大小写敏感。

标签`` 与标签 `` 是不同的

必须使用相同的大小写来编写打开标签和关闭标签

```xml
<Message>这是错误的</message>
<message>这是正确的</message>
```

打开标签和关闭标签通常被称为开始标签和结束标签，不论你喜欢哪种术语，它们的概念都是相同的。

## XML 必须正确嵌套

在HTML 中，常会看到没有正确嵌套的元素

```xml
<b><i>This text is bold and italic</b></i>
```

在XML 中，所有元素都 **必须** 彼此正确地嵌套

```xml
<b><i>This text is bold and italic</i></b>
```

正确嵌套的意思是：由于 `` 元素是在 `` 元素内打开的，那么它必须在 `` 元素内关闭

## XML 属性值必须加引号

与HTML 类似，XML 元素也可拥有属性 (名称/值的对 )

在XML 中，XML 的属性值必须加引号

#### 这是错误的

```xml
<note date=12/11/2007>
<to>Tove</to>
<from>Jani</from>
</note>
```

#### 这个才是正确的

```xml
<note date="12/11/2007">
<to>Tove</to>
<from>Jani</from>
</note>
```

第一个文档中的错误是：note 元素中的 date 属性没有加引号

## 实体引用

在XML 中，一些字符拥有特殊的意义

把字符" 看到红色部分了没，那就是表示 XML 解析器出错了，出错第地方用红色显示

为了避免这个错误，可以用 **实体引用** 来代替 "
大于号

&
&
与号

'
'
单引号

"
"
双引号

> 在XML 中，只有字符 "`<" 和 "&" 是非法的。大于号是合法的 用实体引用来代替它是一个好习惯

## XML 中的注释

在XML 中编写注释的语法与 HTML 的语法很相似

XML注释以 `` 结尾，可以跨行，但不可以嵌套

这是注释

```xml
<!-- This is a comment -->
```

这也是注释

```xml
<!-- author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)-->
<!-- Copyright © 2015-2065 www.ddkk.com. All rights reserved. -->
```

## XML 中的空格会被保留

HTML 会把多个连续的空格字符合并为一个

```xml
"Hello           Tove" 输出为 "Hello Tove"
```

在XML 中，文档中的空格不会被合并

## XML 以 LF 存储换行

XML以 **换行符(\n)**) 存储换行

在Windows 中，换行通常以 **回车换行符(\r\n)** 来存储

在Unix 和 Mac OSX 中，换行以 **换行符来存储(\n)**

在旧的Mac 系统中，换行以 **回车符(\r)** 来存储
