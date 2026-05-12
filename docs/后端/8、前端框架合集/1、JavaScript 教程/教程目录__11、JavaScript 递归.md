# 11、JavaScript 递归
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/11.html
- 分类：前端框架
- 分组：教程目录
### 特点：

**1、** 函数自己调用自己；

**2、** 一般情况下有参数；

**3、** 一般情况下有return；

递归可以解决循环解决的所有问题。

### 创建递归方法：

**1.首先去找临界值，即无需计算，获得的值。**

**2.找这一次和上一次的关系**

**3.假设当前函数已经可以使用，调用自身计算上一次**

例子：求0-100和

```java
//普通for循环
function  add(num){
    var sum=0
    for(var i=1;i<=num;i++)
    {
        sum+=i
    }
    return sum
}
console.log(add(100)) 
```

```java
//递归解决：
function sum(n){
    if(n==1){
        return 1
    }
    return sum(n-1)+n
}
console.log(sum(100)) 
// sum(100)=sum(99)+100
```

内存虽然从sum（100）到sum（1）创建，但是时间很短。当然释放空间从sum（1）到sum（100）时间也很短。但是如果短时间内开的空间个数过多，销毁也会随之增加，就会造成递归爆栈。计算机时耗不起的。

### 练习

输出五次hello word：

```java
function print(n)
{
    if(n==0)
    {
        return;
    }
    console.log('hello world')
    return print(n-1)
}
print(5)
```

斐波那契数列：

```java
// 1 1 2 3 5 8
// Fibonacci(5)=Fibonacci(4)+Fibonacci(3)
function Fibonacci(n){
    /* 找到临界值 */
    if(n<=2){
        return 1
    }
    /* 找到上一个和下一个关系 */
    return Fibonacci(n-1)+Fibonacci(n-2)
}
console.log(Fibonacci(5)) 
```

猴子吃桃：桃子树未知，猴子第一天吃掉一半桃子，加一个，第二天一样吃掉一半桃子+一个 到第n天，桃子只有一个

```java
// eat(n)/2-1=eat(n-1)
function eat(n){
//找到临界值
    if(n==1){
        return 1
    }
    //找到与上一个关系
    return (eat(n-1)+1)*2
}
console.log(eat(4))
```
