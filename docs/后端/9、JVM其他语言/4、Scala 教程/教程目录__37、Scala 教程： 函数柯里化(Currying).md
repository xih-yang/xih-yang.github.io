# 37、Scala 教程： 函数柯里化(Currying)
- 来源：https://ddkk.com/zhuanlan/java/scala/37.html
- 分类：Scala 教程
- 分组：教程目录
## 柯里化(Currying)

**柯里化(Currying)** 指的是将原来接受两个参数的函数变成新的接受一个参数的函数的过程。新的函数返回一个以原有第二个参数为参数的函数。

我们先定义一个带有两个 Int 类型的常规函数

```java
def add(x:Int,y:Int) = x+y
```

那么我们调用 **add** 的时候，应该是这样用：** add(1,2)**

现在我们把这个函数变一下形：

```java
def add(x:Int)(y:Int) = x + y
```

那么我们调用 **add** 的时候应该是这样用：** add(1)(2)** ,最后结果都一样是3，这种方式（过程）就叫柯里化。

### 实现过程

**add(1)(2)** 实际上是依次调用两个普通函数（非柯里化函数），第一次调用使用一个参数 x，返回一个函数类型的值，第二次使用参数y调用这个函数类型的值。

实质上最先演变成这样一个方法：

```java
def add(x:Int)=(y:Int)=>x+y
```

那么这个函数是什么意思呢？ 接收一个x为参数，返回一个匿名函数，该匿名函数的定义是：接收一个Int型参数y，函数体为x+y。现在我们来对这个方法进行调用。

```java
val result = add(1)
```

返回一个result，那result的值应该是一个匿名函数：(y:Int)=>1+y

所以为了得到结果，我们继续调用result。

```java
val sum = result(2)
```

最后打印出来的结果就是3。

### 范例

```java
object Test {
   def main(args: Array[String]) {
      val str1:String = "Hello, "
      val str2:String = "DDKK.COM 弟弟快看，程序员编程资料站!"
      println( "str1 + str2 = " +  strcat(str1)(str2) )
   }
   def strcat(s1: String)(s2: String) = {
      s1 + s2
   }
}
```

上面代码执行结果为：

```java
str1 + str2 = Hello, DDKK.COM 弟弟快看，程序员编程资料站!
```
