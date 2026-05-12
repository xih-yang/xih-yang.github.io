# 25、JavaScript DOM基础认识
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/25.html
- 分类：前端框架
- 分组：教程目录
DOM：document object model 文档对象模型 加载网页的部分就是DOM

document：内的内容

### 节点类型：

元素节点：

属性节点：标签内的属性

文本节点：div文本

document节点：

comment:注释节点

### 元素节点的获取：

#### document.getElementById(id)

功能：通过id获取复合条件的元素（id是唯一的）。只能在全局模式下查找

返回值：符合条件的节点

#### node.getElementsByTagName(标签名)

功能：从node节点开始，通过标签名获取符合条件的元素节点

返回值：伪数组/类数组 数据类型：对象（HTMLCollection）

伪数组/类数组：使用起来与数组类似，但是数据类型不是数组。人为起的名字

#### node.getElementsByClassName(class属性值) （IE8以下不兼容）

功能：从node节点开始，通过类（class）名获取符合条件的元素节点。

返回值：伪数组/类数组 。数据类型：对象（HTMLCollectio）

#### document.getElementsByName(name属性值)（一般使用在表单元素里）

功能：通过name属性的值获取符合条件的元素节点。只能在**全局模式**下查找。

返回值：伪数组/数组 数据类型：对象（NodeList）

注：虽然所有的标签都可以设置name属性，并且通过document.getElementsByName（）都可以获取到。但是在实际应用当中没有用处。所以在使用document.getElementsByName（）都是用来获取表单元素的

#### document.querySelector() （IE8以下不兼容）

参数：字符串 （css选择器格式）

返回值：第一个符合条件的元素节点

#### document.querySelectorAll() （IE8以下不兼容）

参数：字符串（css选择器格式）

返回值：都是返回伪数组（不管是id、class）数据类型：对象 Nodelist（实则是元素集合，并且是static）

注：所有css选择器都格式都可以在document.querySelectorAll() 、document.querySelector()使用（群组选择器、后代选择器、伪类选择器、伪元素选择器…）

### 获取行间属性(内联/行内属性)的值：

一般情况下：直接通过.属性名获取即可（包括id值），但是class是关键字，所以只能通过.classname获取。

注：如果css样式带 -（横杠），将 - (横杠)去掉，并将 - 后面第一个字母大写。因为-是非法字符（不是数字、字母、下划线、$）

注：通过.style.属性名只能访问行内样式，不能访问内部样式。

当background-color用十六进制表示时，获取会以rgba形式显示。如果是单词的话，直接原样显示。

设置和修改行间属性的值：

HTMLCollection伪数组和Nodelist伪数组区别：

HTMLCollection是元素集合（只有element元素节点）；Nodelist是节点集合。Nodelist包含（注释节点，文本节点，element元素节点）

#### 获取浏览器（布局）窗口宽高：

document.documentElement.clientHeight||document.body.clientHeight;

document.documentElement.clientHeight||document.body.clientWidth;

#### 获取浏览器窗口滚条距离顶部距离：

document.documentElement.scrollTop||document.body.scrollTop;
