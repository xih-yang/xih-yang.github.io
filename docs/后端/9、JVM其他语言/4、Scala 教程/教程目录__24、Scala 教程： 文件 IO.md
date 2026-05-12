# 24、Scala 教程： 文件 IO
- 来源：https://ddkk.com/zhuanlan/java/scala/24.html
- 分类：Scala 教程
- 分组：教程目录
Scala 进行文件写操作，直接用的都是 java中 的 I/O 类 （ **java.io.File** )：

```java
import java.io._
object Test {
   def main(args: Array[String]) {
      val writer = new PrintWriter(new File("test.txt" ))
      writer.write("教程 ")
      writer.close()
   }
}
```

执行以上代码，会在你的当前目录下生产一个 test.txt 文件，文件内容为”教程 “:

```java
$ cat test.txt 
教程 
```

## 从屏幕上读取用户输入

有时候我们需要接收用户在屏幕输入的指令来处理程序。范例如下：

```java
object Test {
   def main(args: Array[String]) {
      print("请输入教程 官网 : " )
      val line = Console.readLine
      println("谢谢，你输入的是: " + line)
   }
}
```

执行以上代码，屏幕上会显示如下信息:

```java
请输入教程 官网 : ddkk.com
谢谢，你输入的是: ddkk.com
```

## 从文件上读取内容

从文件读取内容非常简单。我们可以使用 Scala 的 **Source** 类及伴生对象来读取文件。以下范例演示了从 “test.txt”(之前已创建过) 文件中读取内容:

```java
import scala.io.Source
object Test {
   def main(args: Array[String]) {
      println("文件内容为:" )
      Source.fromFile("test.txt" ).foreach{ 
         print 
      }
   }
}
```

上面代码执行结果为:

```java
文件内容为:
教程 
```
