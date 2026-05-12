# 28、Scala 教程： 函数嵌套
- 来源：https://ddkk.com/zhuanlan/java/scala/28.html
- 分类：Scala 教程
- 分组：教程目录
**函数嵌套** 是指在函数内再定义函数,定义在函数内的函数称之为局部函数。

下面我们用 **函数嵌套** 方式来实现阶乘

```java
object Test {
   def main(args: Array[String]) {
      println( factorial(1) )
      println( factorial(2) )
      println( factorial(3) )
      println( factorial(4) )
      println( factorial(5) )
   }
   def factorial(i: Int): Int = {
      def fact(i: Int, accumulator: Int): Int = {
         if (i <= 1)
            accumulator
         else
            fact(i - 1, i * accumulator)
      }
      fact(i, 1)
   }
}
```

上面代码执行结果为：

```java
1
2
6
24
120
```
