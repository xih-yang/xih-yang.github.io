# 06、XML 元素 vs 属性
- 来源：https://ddkk.com/zhuanlan/xml/dtd/6.html
- 分类：XML语言教程
- 分组：教程目录
我们已经知道在 DTD 中既可以声明元素，也可以声明属性。

但一个部件何时声明成元素，又何时声明为属性呢？

很遗憾，在 XML 中，并有没有规定何时使用属性，以及何时使用子元素

## 数据可以存储在子元素或属性中

### 范例: sex 数据存储在属性中

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<person sex="男">
<firstname>飞</firstname>
<lastname>语</lastname>
</person>
```

### 范例: sex 数据存储在子元素中

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<person>
<sex>男</sex>
<firstname>飞</firstname>
<lastname>语</lastname>
</person>
```

在第一个例子中 "sex" 是一个属性。 而在后面一个例子中，"sex"是一个子元素。 但是两者都提供了相同的信息。

> 虽然没有特别规定何时使用属性，以及何时使用子元素。 但我们的经验是描述数据的数据放在属性中(元数据,共有元素且不变)，易变的数据放在子元素中

## 我喜欢的方式

> 我喜欢在子元素中存储数据 在属性中存储元数据

下面的三个XML文档包含完全相同的信息：

### 范例: 使用属性存储 created_at (我最喜欢的方式)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<article created_at="2017-08-08 08:08:08">
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article>
```

### 范例： 使用created_at 子元素

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<article>
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<created_at>2017-08-08 08:08:08</created_at>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article>
```

### 范例: 使用了扩展的 "created_at"

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<article>
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<created_at>
    <time>08:08:08</time>
    <day>08</day>
    <month>08</month>
    <year>2017</year>
</created_at>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article>
```

> 强调一次，选择元素还是属性，第一优先使用子元素，然后再考虑数据是否可变，是否与主体数据没有关联，如果是则用属性

## 何时避免使用属性?

虽然我推荐属性，但不推荐滥用

一些属性具有以下问题:

- 属性不能包含多个值（子元素可以）
- 属性不容易扩展（为以后需求的变化）
- 属性无法描述结构（子元素可以）
- 属性更难以操纵程序代码
- 属性值是不容易测试，针对DTD

也就是说：如果使用属性作为数据容器，最终的XML文档将难以阅读和维护。 尝试使用**元素**来描述数据。只有在提供的数据是不相关信息时我们才建议使用属性

> 但我为什么推荐 created_at 使用属性，现在各个语言对日期的解析已经成熟，没必要按照日月年分开，同时 created_at 每篇文章都会出现，是文章的元数据之一，然后，created_at 一旦赋值，就永远不会变。
>
> ps:如果改变了，这个IT系统设计也太薄弱了

当然推荐也不要这个样子结束（这不是XML应该使用的）：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!--  Copyright www.ddkk.com -->
<article day="08" month="08" year="2017" time="08:08:08">
<author>DDKK.COM 弟弟快看，程序员编程资料站</author>
<summary>DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站</summary>
<content>DDKK.COM 弟弟快看，程序员编程资料站[www.ddkk.com]以编程开发所需掌握的语言和知识入手...</content>
</article>
```

> :再三强调: 在这里我想说的是，元数据（关于数据的数据）应当存储为属性，而数据本身应当存储为元素。
