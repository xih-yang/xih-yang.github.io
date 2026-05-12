# 14、JavaScript 数组的引用
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/14.html
- 分类：前端框架
- 分组：教程目录
**数组的变量仅仅存储的是数组的地址**

```java
// 基本数据类型
var num=10;
var num2=num
num2=20;
console.log(num,num2)
//引用数据类型
var arr=[1,2,3]
var arr2=arr
arr2.push(10,20)
console.log(arr,arr2)
```

运行程序：

**1、** 准备运行程序要用的空间（一旦分配好以后，内存大小没法进行改变了）；

**2、** 开始运行程序；

因为内存空间一旦分配以后就无法改变了，所以如果只有一个固定空间的话，那么数组就无法进行push添加元素。因此，内存被分成了两部分：一部分是堆内存，一部分是栈内存（程序运行段）

concat（）方法：生成一个新数组

```java
var arr=[1,2,3]
// var arr2=arr
var arr2=arr.concat()
arr2.push(10,20)
console.log(arr,arr2)
```
