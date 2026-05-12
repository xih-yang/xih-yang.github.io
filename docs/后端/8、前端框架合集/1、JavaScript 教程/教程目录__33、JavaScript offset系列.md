# 33、JavaScript offset系列
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/33.html
- 分类：前端框架
- 分组：教程目录
之前学习获取css样式的方法有两种：一种是通过 . 操作获取内联样式属性；另一种是跨浏览器兼容获取内部样式的方法

node.currentStyle[style]（IE兼容） getComputedStyle(node)[style]（火狐和谷歌兼容）。如下图利用函数封装能够实现跨浏览器兼容获取css样式

但是注意：所有通过 . 操作或者是跨浏览器兼容的获取css样式的方法，获取到的高、宽都是纯content的高宽也就是属性：width和属性：height的值，不包括padding和border部分。（**带单位**：**string类型**）

第三种获取css样式方法：offset系列：返回值是**数字（number类型）** 。并且这个方法返回的高宽包括了padding和border值哦。

offsetWidth:

功能：获取width+padding左右+border左右的值

返回：width+padding左右+border左右的值

offsetHeight：

功能：获取width+padding上下+border上下的值

返回：width+padding上下+border上下的值

offsetLeft:

功能：获取距离**第一个有定位的父节点**左边距离的值

返回值：距离**第一个有定位的父节点**左边距离

offsetTop:

功能：获取距离**第一个有定位的父节点**上边距离的值

返回值：距离**第一个有定位的父节点**上边距离的值

父元素无定位，一直想查找定位的祖先，直到浏览器窗口

父元素定位：
