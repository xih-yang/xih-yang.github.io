# 39、Scala 教程： Option(选项)
- 来源：https://ddkk.com/zhuanlan/java/scala/39.html
- 分类：Scala 教程
- 分组：教程目录
Scala **Option(选项)** 类型用来表示一个值是可选的（有值或无值)。

Scala 使用 Option[T] 来告诉程序：「我会想办法回传一个 T 类型的数据，但也可能没有 T 类型数据给你」。

Option[T] 是一个类型为 T 的可选值的容器： + 如果值存在， Option[T] 就是一个 Some[T] + 如果不存在， Option[T] 就是对象 None 。

引入Option[T] 机制是为了「更严格的」类型检查，使得在编译时可以发现更多问题（未预期的变量为空）。

下面这段代码说明了 Option 的这种特性

```java
object Test {
   def main(args: Array[String]) {
      val myMap: Map[String, String] = Map("key1" -> "value")
      val value1: Option[String] = myMap.get("key1")
      val value2: Option[String] = myMap.get("key2")
      println(value1) // Some("value1")
      println(value2) // None
   }
}
```

输出结果为:

```java
Some(value)
None
```

在上面的代码中，myMap 一个是一个 Key 的类型是 String，Value 的类型是 String 的 hash map，但不一样的是他的 get() 返回的是一个叫 Option[String] 的类别。

myMap 里并没有 key2 这笔数据，get() 方法返回 None。

Option 有两个子类别，一个是 Some，一个是 None，当他回传 Some 的时候，代表这个函式成功地给了你一个 String，而你可以透过 get() 这个函式拿到那个 String，如果他返回的是 None，则代表没有字符串可以给你。

再来看看另一组代码:

```java
object Test {
   def main(args: Array[String]) {
      val sites = Map("DDKK.COM 弟弟快看，程序员编程资料站" -> "ddkk.com", "google" -> "www.google.com")
      println("sites.get( \"DDKK.COM 弟弟快看，程序员编程资料站\" ) : " +  sites.get( "DDKK.COM 弟弟快看，程序员编程资料站" )) // Some(ddkk.com)
      println("sites.get( \"baidu\" ) : " +  sites.get( "baidu" ))  //  None
   }
}
```

上面代码执行结果为：

```java
sites.get( "DDKK.COM 弟弟快看，程序员编程资料站" ) : Some(ddkk.com)
sites.get( "baidu" ) : None
```

我们可以通过模式匹配来输出匹配值。

```java
object Test {
   def main(args: Array[String]) {
      val sites = Map("DDKK.COM 弟弟快看，程序员编程资料站" -> "ddkk.com", "google" -> "www.google.com")
      println("show(sites.get( \"DDKK.COM 弟弟快看，程序员编程资料站\")) : " +  
                                          show(sites.get( "DDKK.COM 弟弟快看，程序员编程资料站")) )
      println("show(sites.get( \"baidu\")) : " +  
                                          show(sites.get( "baidu")) )
   }
   def show(x: Option[String]) = x match {
      case Some(s) => s
      case None => "?"
   }
}
```

上面代码执行结果为：

```java
show(sites.get( "DDKK.COM 弟弟快看，程序员编程资料站")) : ddkk.com
show(sites.get( "baidu")) : ?
```

## getOrElse() 方法

可以使用 getOrElse() 方法来获取元组中存在的元素或者返回其默认的值

唯一的参数就是如果元素不存在应该返回的默认值

```java
object Test {
   def main(args: Array[String]) {
      val a:Option[Int] = Some(5)
      val b:Option[Int] = None 
      println("a.getOrElse(0): " + a.getOrElse(0) )
      println("b.getOrElse(10): " + b.getOrElse(10) )
   }
}
```

上面代码执行结果为：

```java
a.getOrElse(0): 5
b.getOrElse(10): 10
```

## isEmpty() 方法

可以使用 isEmpty() 方法来检测元组中的元素是否为 None，范例如下：

```java
object Test {
   def main(args: Array[String]) {
      val a:Option[Int] = Some(5)
      val b:Option[Int] = None 
      println("a.isEmpty: " + a.isEmpty )
      println("b.isEmpty: " + b.isEmpty )
   }
}
```

上面代码执行结果为：

```java
a.isEmpty: false
b.isEmpty: true
```

## Scala Option 常用方法

下表列出了 Scala Option 常用的方法：

序号
方法及描述

def get: A
获取可选值

def isEmpty: Boolean
检测可选类型值是否为 None，是的话返回 true，否则返回 false

def productArity: Int
返回元素个数， A(x_1, …, x_k), 返回 k

def productElement(n: Int): Any
获取指定的可选项，以 0 为起始。即 A(x_1, …, x_k), 返回 x_(n+1) ， 0  Boolean): Boolean
如果可选项中指定条件的元素是否存在且不为 None 返回 true，否则返回 false。

def filter(p: (A) => Boolean): Option[A]
如果选项包含有值，而且传递给 filter 的条件函数返回 true， filter 会返回 Some 范例。 否则，返回值为 None 。

def filterNot(p: (A) => Boolean): Option[A]
如果选项包含有值，而且传递给 filter 的条件函数返回 false， filter 会返回 Some 范例。 否则，返回值为 None 。

def flatMap[B](f: (A) => Option[B]): Option[B]
如果选项包含有值，则传递给函数 f 处理后返回，否则返回 None

def foreach[U](f: (A) => U): Unit
如果选项包含有值，则将每个值传递给函数 f， 否则不处理。

def getOrElse[B >: A](default: => B): B
如果选项包含有值，返回选项值，否则返回设定的默认值。

def isDefined: Boolean
如果可选值是 Some 的范例返回 true，否则返回 false。

def iterator: Iterator[A]
如果选项包含有值，迭代出可选值。如果可选值为空则返回空迭代器。

def map[B](f: (A) => B): Option[B]
如果选项包含有值， 返回由函数 f 处理后的 Some，否则返回 None

def orElse[B >: A](alternative: => Option[B]): Option[B]
如果一个 Option 是 None ， orElse 方法会返回传名参数的值，否则，就直接返回这个 Option。

def orNull
如果选项包含有值返回选项值，否则返回 null。
