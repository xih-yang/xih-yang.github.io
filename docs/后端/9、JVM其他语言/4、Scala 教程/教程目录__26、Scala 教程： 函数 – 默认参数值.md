# 26、Scala 教程： 函数 – 默认参数值
- 来源：https://ddkk.com/zhuanlan/java/scala/26.html
- 分类：Scala 教程
- 分组：教程目录
定义 **函数** 时可以给函数参数指定 **默认值**

使用了默认参数，调用函数可以不需要传递参数，参数处理机制为: 1. 如果没有传递这个参数，这时函数就会调用它的默认参数值 2. 如果传递了参数，则传递值会取代默认值。

```java
object Test {
   def main(args: Array[String]) { 
        println( "返回值 : " + addInt() );
        println( "返回值 : " + addInt(8) );
        println( "返回值 : " + addInt(b=11));
   }
   def addInt( a:Int=5, b:Int=7 ) : Int = {
      var sum:Int = 0
      sum = a + b
      return sum
   }
}
```

上面代码执行结果为：

```java
返回值 : 12
返回值 : 15
返回值 : 16
```

因为有了默认值这种机制，所以我们可以选择性的给函数传递参数，后面的章节会详细讲到这一点
