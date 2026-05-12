# 29、JavaScript 元素节点属性和节点属性
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/29.html
- 分类：前端框架
- 分组：教程目录
innerHtml 获取和设置标签间的文本 ，包含标签

innerText 获取和设置标签间的纯文本 ，不包含标签

outerHTML 取值：从外标签开始，到外标签结束。修改：将外标签整个替换

获取子节点的属性

**childNodes**

**获取所有类型的节点：**（包含元素节点、文本节点、属性节点、注释节点…所有类型的节点）

功能：访问当前节点下，所有的子节点。

返回值：伪数组、数组 数据类型：对象Nodelist

**firstChild**

功能：访问子节点中的首位

**lastChild**

功能：访问子节点中的最后一位

**nextSibling** 下一个同级节点

**previousSibling** 上一个同级节点

注意：空格和回车符也会算作单独的文本节点（键盘上的所有键都可以被当作文本节点）

**获取元素节点：**(只获取元素节点 IE8以下不兼容)

children : 获取所有的子元素节点

firstElementChild ：获取第一个子元素节点

lastElementChild :获取最后一个子元素节点

nextElementSibling ：获取下一个同级元素节点

previousElementSibling ：获取上一个同级元素节点
