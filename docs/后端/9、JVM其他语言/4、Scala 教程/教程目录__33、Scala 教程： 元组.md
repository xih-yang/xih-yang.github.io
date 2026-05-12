# 33、Scala 教程： 元组
- 来源：https://ddkk.com/zhuanlan/java/scala/33.html
- 分类：Scala 教程
- 分组：教程目录
元组的值是通过将单个的值包含在圆括号中构成的。

```java
val t = (1, 3.14, "Fred")
```

上面的代码定义了一个由三个元素组成的元组，对应的类型分别为[Int, Double, java.lang.String]

与列表一样，元组也是不可变的，但与列表不同的是元组可以包含不同类型的元素。

此外我们也可以使用以上方式来定义：

```java
val t3 = new Tuple3(1, 3.14, "Fred")
val t4 = new Tuple4(1, 3.14, "Fred",Console)
```

> 上面的 Tuple 后面的数字表示元组有多少个元素，最长元素个数为 22。 其实 Scala 就是内置了 Tuple1,Tuple2….Tuple22 22个元组定义单例。

元组的实际类型取决于它的元素的类型，比如： (99, “DDKK.COM 弟弟快看，程序员编程资料站”) 是 Tuple2[Int, String]。 (‘u’, ‘r’, “the”, 1, 4, “me”) 为 Tuple6[Char, Char, String, Int, Int, String]。

目前Scala 支持的元组最大长度为 22。对于更大长度你可以使用集合，或者扩展元组。

访问元组的元素可以通过数字索引，如下一个元组：

```java
val t = (4,3,2,1)
```

我们可以使用 t._1 访问第一个元素， t._2 访问第二个元素，如下所示：

```java
object Test {
   def main(args: Array[String]) {
      val t = (4,3,2,1)
      val sum = t._1 + t._2 + t._3 + t._4
      println( "元素之和为: "  + sum )
   }
}
```

上面代码执行结果为：

```java
$ scalac Test.scala 
$ scala Test
元素之和为: 10
```

## 迭代元组

**Tuple.productIterator()** 方法可以迭代输出元组的所有元素，元素的顺序和定义时相同：

```java
object Test {
   def main(args: Array[String]) {
      val t = (4,3,2,1)
      t.productIterator.foreach{ i =>println("Value = " + i )}
   }
}
```

上面代码执行结果为：

```java
Value = 4
Value = 3
Value = 2
Value = 1
```

## 元组转为字符串

**Tuple.toString()** 方法能将元组的所有元素组合成一个由逗号拼接的字符串

```java
object Test {
   def main(args: Array[String]) {
      val t = new Tuple3(1, "hello", Console)
      println("连接后的字符串为: " + t.toString() )
   }
}
```

上面代码执行结果为：

```java
连接后的字符串为: (1,hello,scala.Console$@1f89ab83)
```

## 元素交换

使用 **Tuple.swap** 方法可以交换元素，也就是调整元素的顺序，并且产生一个新的元组

```java
object Test {
   def main(args: Array[String]) {
      val t = new Tuple2("www.google.com", "ddkk.com")
      println("交换前的元组:" + t)
      println("交换后的元组: " + t.swap )
   }
}
```

上面代码执行结果为：

```java
交换前的元组:(www.google.com,ddkk.com)
交换后的元组: (ddkk.com,www.google.com)
```
