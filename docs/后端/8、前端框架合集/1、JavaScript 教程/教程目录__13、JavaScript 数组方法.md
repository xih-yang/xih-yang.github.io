# 13、JavaScript 数组方法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/13.html
- 分类：前端框架
- 分组：教程目录
### 栈结构：先进后出

**push（）**

格式：数组.push（参数1，参数2，…）

功能：给数组的末尾添加元素

返回值：数组的元素个数

```java
var arr=[1,2,3]
var result=arr.push('new')
console.log(arr,result)
```

**pop（）**

格式：数组.pop（），不能传参

功能：从数组的末尾取下一个元素

返回值：取下的一个元素

```java
var arr=[1,2,3]
var result=arr.pop()
console.log(arr,result)
```

队列结构：先进先出

push()

shfit()

格式：数组.shfit()，没有参数

功能：从头部取下一个元素

返回值：取下的元素值

```java
var arr=[1,2,3]
var res=arr.shift()
console.log(arr,res)
```

unshfit()

格式：数组.unshfit() 没有参数

功能：从头部插入一个元素

返回值：返回数组的长度（元素个数）

```java
var arr=[1,2,3]
var res=arr.unshift(0)
console.log(res,arr)
```

规律：只要是从数组取值的，那么返回的都会取下的值。往数组插值的，返回的是数组长度。上述方法，**原数组都发生改变**

concat()

格式：数组.concat(数组，数据，…)

功能：拷贝原数组，生成新数组。合并数组

返回值：**新数组，原数组不会发生任何改变**

*注：就算传入的是数组，那数组也需要单独拆出来在合并*

```java
var arr=[1,2,3,4]
var arr2=[5,6,7]
var res=arr.concat(arr2,'hello','word')
console.log(res,arr,arr2)
```

注：arr2是被拆分成一个个元素，在进行合并的。而不是将整个数组进行合并，否则res会变成[1, 2, 3,[ 4, 5, 6, 7], “hello”, “word”] 。所以新数组的长度是9

slice（）

格式：数组.slice(start,end)

功能：基于当前数组获取指定区域元素（start,end）,提取出元素**生成新数组**。start从下标0开始

返回值：提取的元素生成的新数组 [start,end),**原数组不会发生任何改变**

注：新数组，包含start，不包含end

```java
var arr=[1,2,3,4,5,6]
var res=arr.splice(1,3)
console.log(arr,res)
```

注：如果只写一个参数，意味这从提取从这个位置开始的数到数组结尾所有数字

注：如果不写参数，意味着提取数组所有的元素

splice（）

格式：数组.splice(start,length,新增元素)

start截取元素开始的下标；length：截取元素的个数；第三个参数开始，在start位置，插入的元素

功能：可以实现增加、截取、修改数组中指定区域的元素，**原数组被修改**

返回值：截取元素组成的数组（包含start）

注：省略顺序，必须从右往左开始省略，不能出现数组.splice(start, ,新增元素)和数组.splice( ,length,新增元素)这两种情况

截取

```java
var arr=[1,2,3,4,5,6]
var res=arr.splice(1,3)
console.log(arr,res)
```

截取并插入新数据

```java
var arr=[1,2,3,4,5,6]
var res=arr.splice(1,3,'hello')
console.log(arr,res)
```

直接插入新数据

```java
var arr=[1,2,3,4,5,6]
var res=arr.splice(1,0,'hello')
console.log(arr,res)
```

返回值是一个空数组[]

当只有一个参数值时：表示截取从参数下标开始，到数组结束中间所有的元素

```java
var arr=[1,2,3,4,5,6]
var res=arr.splice(1)
console.log(arr,res)
```

join()

格式：数组.join（字符串）（参数可省略）

功能：将数组中元素，用传入的拼接符，拼接成字符串（数组转成字符串），**原数组不更改**

返回值：拼接成的字符串

```java
var arr=[1,2,3,4,5,6]
var res=arr.join('-')
console.log(arr,res)
```

不传参：

```java
var arr=[1,2,3,4,5,6]
var res=arr.join()
console.log(arr,res)
```

要想换取完整的，没有字符间隔的字符串可以传入一个空字符串

```java
var arr=[1,2,3,4,5,6]
var res=arr.join('')
console.log(arr,res)
```

reverse()

格式：数组.reverse()

功能：逆序（**将下标倒过来**），**改变原数组**

返回值：逆序之后的新数组

```java
var arr=[1,2,3,4,5,6]
var res=arr.reverse()
console.log(arr,res)
```

sort()

格式：数组.sort（fn）

功能：对数组进行排序 ，默认从小到大排序。**改变原数组**

参数：一个函数，代表要怎么进行排序（固定用法）

返回值：排序好的新数组

**注：排序是按照将每个元素转成字符串，然后按照字符串大小进行逐位比较的**

```java
var arr=[1,3,6,4,5,2]
var res=arr.sort()
console.log(arr,res)
```

```java
var arr=[1,20,3,4,25]
var res=arr.sort()
console.log(arr,res)
```

假如我们按照数值排序，并且按照数值从小到大排序

```java
var arr=[1,20,3,4,25]
var res=arr.sort()
var res=arr.sort(function(value,value2){
	return value>value2 // 或者可以value-value2
	 })
console.log(arr,res)
```

假如我们按照数值排序，并且按照数值从大到小排序

```java
var arr=[1,20,3,4,25]
var res=arr.sort()
var res=arr.sort(function(value,value2){
	return value<value2 // 或者可以value2-value
	 })
console.log(arr,res)
```

练习：求平均数，定义一个数组，长度为30.按顺序赋予从2开始的偶数，然后按顺序每五个数求出一个平均数，放在另一个数组里

```java
var arr=Array(30)
var arr2=[]
var count=0
for(var i=0;i<arr.length;i++){
    arr[i]=2*(i+1)
    count+=arr[i]
    if((i+1)%5==0){
        arr2.push(count/5)
        count=0
    }
}
console.log(arr,arr2)
```

ECMA5新增数组方法：

indexOf（）

格式：数组.indexOf（item,start）

item:任意数据

start：下标（可省略，省略则默认是0）

功能：在数组中查找**第一次出现**item这个元素的下标，**从start下标开始查找**

返回值：1.如果查找不到，返回-1

**2、** 如果找到，返回第一次出现item的下标（0<=）；

```java
var arr=[1,2,3,4,3]
    var res=arr.indexOf(3)
    console.log(res,arr)
```

如果要查找下一个3，可以添加第个参数start

如果找不到的item话，就会返回-1

总结：
