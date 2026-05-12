# 38、Scala 教程： 函数 – 可变参数
- 来源：https://ddkk.com/zhuanlan/java/scala/38.html
- 分类：Scala 教程
- 分组：教程目录
Scala 通过在参数的类型之后放一个星号来设置可变参数(可重复的参数)

Scala 允许你指明函数的最后一个参数可以是重复的，即我们不需要指定函数参数的个数，可以向函数传入可变长度参数列表。

```java
object Test {
   def main(args: Array[String]) {
        printStrings("DDKK.COM 弟弟快看，程序员编程资料站", "Scala", "Python","HTML");
   }
   def printStrings( args:String* ) = {
      var i : Int = 0;
      for( arg <- args ){
         println("Arg value[" + i + "] = " + arg );
         i = i + 1;
      }
   }
}
```

上面代码执行结果为：

```java
Arg value[0] = DDKK.COM 弟弟快看，程序员编程资料站
Arg value[1] = Scala
Arg value[2] = Python
Arg value[3] = HTML
```
