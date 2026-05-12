# 32、Scala 教程： 匿名函数
- 来源：https://ddkk.com/zhuanlan/java/scala/32.html
- 分类：Scala 教程
- 分组：教程目录
Scala 中的 **匿名函数** 是没有方法名，也不用 **def** 定义的函数。一般匿名函数都是一个 **表达式**

因此 **匿名函数** 非常适合替换那些只用一次且任务简单的常规函数

> 匿名函数，会使得我们的代码变得更简洁了。

匿名函数的语法很简单，箭头左边是参数列表，右边是函数体。

定义匿名函数的语法为:

```java
(param1,param2) => [expression]
```

下面的表达式就定义了一个接受一个Int类型输入参数的匿名函数:

```java
var inc = (x:Int) => x+1
```

上述定义的匿名函数，其实是下面这个常规函数的简写：

```java
def add(x:Int):Int {
    return x+1;
}
```

以上范例的 inc 现在可作为一个函数，使用方式如下：

```java
var x = inc(7)-1
```

同样我们可以在匿名函数中定义多个参数：

```java
var mul = (x: Int, y: Int) => x*y
```

mul现在可作为一个函数，使用方式如下：

```java
println(mul(3, 4))
```

我们也可以不给匿名函数设置参数，如下所示：

```java
var userDir = () => { System.getProperty("user.dir") }
```

userDir 现在可作为一个函数，使用方式如下：

```java
println( userDir() )
```

### 范例

```java
object Demo {
   def main(args: Array[String]) {
      println( "multiplier(1) value = " +  multiplier(1) )
      println( "multiplier(2) value = " +  multiplier(2) )
   }
   var factor = 5
   val multiplier = (i:Int) => i * factor
}
```

编译执行上面的代码，输出为:

```java
multiplier(1) value = 5
multiplier(2) value = 10
```
