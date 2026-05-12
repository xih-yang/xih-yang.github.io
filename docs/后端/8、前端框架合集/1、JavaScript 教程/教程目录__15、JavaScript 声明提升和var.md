# 15、JavaScript 声明提升和var
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/15.html
- 分类：前端框架
- 分组：教程目录
内存是一次分配，并且一次分配之后就无法再修改了。在预编译时内存空间已经被分配好了

预编译：在所有代码运行之前，（计算机）将代码从头到尾看一遍，将这个程序需要运行的空间一次性分配好。

#### 声明提升

声明提升：在**当前作用域**，声明变量和函数，会直接提升在代码最前面运行。

变量声明提升：

```java
console.log(num)
var num=10
```

拿这个例子说：当计算机扫描到var num=10时，发现需要开辟一段名为num的空间，这是系统就会为他开一个空间。这样就相当于把变量声明提到了最前面

```java
类似于这样：
var num；
console.log(num)
 num=10；
```

之前我们说过，如果变量声明时，没有初始化，那么系统默认会往这个变量空间里放入undefined的值。也就出现了运行的结果。

函数提升：

```java
fn()
function fn(){
    console.log(1)
}
```

仅在当前作用域进行函数提升。

```java
fn()
function fn(){
    console.log(num)
    var num=10
}
console.log(num)
```

#### 省略var声明变量

作用：变量会被强制声明成全局变量。

注：不建议，属于语法错误

```java
function fn(){
    var num=10;
    num2=20
}
fn()
console.log(num2)
console.log(num)
```

如果函数不被调用，那么函数内的变量仅仅只是在函数内作为变量有一个变量空间，此时计算机并未认为num2变成全局变量。

```java
function fn(){
    var num=10;
    num2=20
}
console.log(num2)
console.log(num)
```
