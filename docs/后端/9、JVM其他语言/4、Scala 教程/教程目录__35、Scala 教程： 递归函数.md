# 35、Scala 教程： 递归函数
- 来源：https://ddkk.com/zhuanlan/java/scala/35.html
- 分类：Scala 教程
- 分组：教程目录
**递归函数** 意味着函数可以调用它本身,递归函数在函数式编程的语言中起着重要的作用。

下面我们举个用 **递归函数** 实现阶乘的范例

```java
object Test {
   def main(args: Array[String]) {
      for (i <- 1 to 5)
         println(i + " 的阶乘为: = " + factorial(i) )
   }
   def factorial(n: BigInt): BigInt = {  
      if (n <= 1)
         1  
      else    
         n * factorial(n - 1)
   }
}
```

上面代码执行结果为：

```java
1 的阶乘为: = 1
2 的阶乘为: = 2
3 的阶乘为: = 6
4 的阶乘为: = 24
5 的阶乘为: = 120
```
