# 47、JavaScript 集合
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/47.html
- 分类：前端框架
- 分组：教程目录
集合和数组区别：集合不重复、无序

### Set

set类似于对象，但是只能存储除函数以外的数据，并且键名和键值(属性和属性值）必须一致，key=value。返回值是一个伪数组

声明变量：new Set();

#### 赋值：

**1、** 变量.add(值)；

**2、** newSet(数组)：数组转集合；

#### 功能：去重

注：如果传入的值是一个对象或者数组的话，因为地址不一样，所以即使里面定义的属性值一致，也不会去重

集合遍历：

forEach

for…of 默认遍历键值

通过键名遍历 set集合.keys（）

通过键值 set集合.values（）

利用set去重特性,可以给数组去重（数组变集合）

集合变数组

…将数据结构展开成数组

利用Array.from（）伪数组变成真实数组

Map映射

声明：var map=new Map()

添加数据：map集合.set（键名，键值）也具有去重效果

取值：map集合.get(键名)

遍历：

键名：map集合.keys()

键值：map集合.values()

键值对：map集合.entries()

默认遍历键值对 map集合

map案例：字典查询
