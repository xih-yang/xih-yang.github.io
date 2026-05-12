# 12、JavaScript 数组
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/12.html
- 分类：前端框架
- 分组：教程目录
使用单独变量名来存储一系列的值

### 数组声明方式：

**1、** 通过new运算符创建数组；

()内可以传入任意的数据

```java
var arr=new Array(10,20,'hello')
```

**2、** 省略new运算符创建数组；

()内可以传入任意的数据

```java
var arr=Array(10,20,'hello')
```

注：上述两种方法，传入的参数只有一个，并且是数字的时候，直接声明的长度为第一个参数值的空数组。

**3、** 直接通过常量赋值；

```java
var arr=[10,20,'hello']
```

### 数组属性

数组.length 返回数组[元素]的个数

元素：将数组中存储的每一个数据，叫做数组

访问数组的元素：数组[下标] 下标0开始

### 数组的遍历方法

**for循环**

```java
for(var i=0;i<arr.length;i++){
    console.log(arr[i])
}
```

**for …in** 快速遍历 ，快速枚举

**对象**一般使用for in遍历，不过for in遍历会把原型上的**属性和方法**给遍历出来。for in只遍历**键名**。

执行速度比for快，安全级别比较低。快在不需要判断

```java
var arr=[10,20,'hello']
for( index in arr){
	console.log(arr[index])
}
```

#### Es5新增的遍历

**forEach（）** 循环

格式：数组.forEach(function(item,index,arr){…})

缺点：屏蔽了初学者对循环的理解

item当前遍历的元素；index当前遍历到元素的下标；arr原数组

**map()** 会遍历当前数组，然后调用参数中的方法，返回当前方法的返回值

格式：数组.map(function(item,index,arr){…})

功能：映射，根据固定的运算公式，将运算结果，放在对应的下标当中

item当前遍历的元素；index当前遍历到元素的下标；arr原数组

返回值：更改原数组中的每个元素新组成的数组

```java
var arr=[10,20,'hello']
    var newarr=arr.map(function(item,index,arr){
return item=0   //映射关系
})
console.log(newarr,arr)
```

**filter（）过滤**

格式：数组.filter(function(item,index,arr){…})

功能：过滤出符合条件的元素

返回值：符合条件的元素组成的新数组

item当前遍历的元素；index当前遍历到元素的下标；arr原数组

```java
var arr=[10,20,'hello']
var newarr=arr.filter(function(item,index,arr){
    return typeof item=='number'  //过滤条件
})
console.log(newarr,arr)
```

**some()**

格式：数组.some(function(item,index,arr){…})

item当前遍历的元素；index当前遍历到元素的下标；arr原数组

功能：查找是否有符合条件的元素（存在一个即可）

返回值：符合条件返回true，不符合条件返回false。

注：短路操作，只要找到一个符合条件的元素，后面的循环就停止了。

```java
var arr=[10,20,'hello']
var newarr=arr.some(function(item,index,arr){
    console.log(item)
    return typeof item=='number'  //条件
})
console.log(newarr,arr)
```

**every（）**

格式：数组.every(function(item,index,arr){…})

item当前遍历的元素；index当前遍历到元素的下标；arr原数组

功能：查找每一个元素是否都符合条件（每一个）

返回值：每一个都符合条件返回ture，只要有一个不符合返回false

注：短路操作：只要有一个不符合条件的，就返回false，结束循环

```java
var arr=[10,'hello',20]
var newarr=arr.every(function(item,index,arr){
    console.log(item)
    return typeof item=='number'  //条件
})
console.log(newarr,arr)
```

**reduce（）归并**

格式：数组.reduce(function(prev,next,index,arr){…})

prev:第一次下标为0元素，第二次开始：上一次遍历表达式的值

next:从下标1开始，当前遍历的元素

index：是next的下标

arr：当前数组本身

功能：按照return 后的条件 实现数组归并

返回值：合并的数据

**注：遍历的次数是当前数组长度-1**

```java
var arr=[10,20,30,40,50]
    var res=arr.reduce(function(prev,next,index,arr){
        console.log(prev,next,index)
        return prev + next; 
    })
    console.log(res)
```

补充：
将伪数组转成真实数组 ：Array.from（）

判断是否是数组：Array.isArray（对象）
